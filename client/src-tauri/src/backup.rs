use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::error::Error;
use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::Path;
use std::path::PathBuf;
use walkdir::WalkDir;
use zip::ZipArchive;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipWriter};

use crate::paths;
use crate::scan::SaveLocation;
use crate::scan::ScannedGame;

const IGNORED_FILES: [&str; 1] = ["steam_autocloud.vdf"];

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupFile {
    pub path: PathBuf,
    pub portable: String,
    pub size: u64,
}

pub fn collect_files(locations: &[SaveLocation], ctx: &paths::Context) -> Vec<BackupFile> {
    let mut files = BTreeMap::new();

    for location in locations {
        for found in &location.found {
            for entry in WalkDir::new(found).into_iter().filter_map(Result::ok) {
                if !entry.file_type().is_file() {
                    continue;
                }

                let name = entry.file_name().to_string_lossy();
                if IGNORED_FILES.contains(&name.as_ref()) {
                    continue;
                }

                let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                let path = entry.into_path();

                if files.contains_key(&path) {
                    continue;
                }
                let Some(portable) = paths::to_portable(&path, ctx) else {
                    continue;
                };

                files.insert(
                    path.clone(),
                    BackupFile {
                        path,
                        portable,
                        size,
                    },
                );
            }
        }
    }

    files.into_values().collect()
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub game_name: String,
    pub launcher: String,
    pub launcher_id: String,
    pub created_at: String,
    #[serde(default)]
    pub content_hash: String,
    pub files: Vec<ArchivedFile>,
    #[serde(default)]
    pub manifest_name: String,
    #[serde(default)]
    pub reason: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchivedFile {
    pub portable: String,
    pub archive_path: String,
    pub size: u64,
    #[serde(default)]
    pub sha256: String,
}

fn archive_path(portable: &str) -> String {
    format!("files/{}", portable.replace(['<', '>'], ""))
}

fn file_options() -> SimpleFileOptions {
    SimpleFileOptions::default().compression_method(CompressionMethod::Deflated)
}

pub fn create_backup(
    scanned: &ScannedGame,
    backup_root: &Path,
    reason: &str,
) -> Result<PathBuf, String> {
    let now = chrono::Local::now();
    let dir = backup_root.join(&scanned.game.launcher_id);
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Backup-Ordner konnte nicht angelegt werden: {e}"))?;

    let zip_path = dir.join(format!("{}.zip", now.format("%Y-%m-%d_%H-%M-%S")));

    if let Err(e) = write_zip(&zip_path, scanned, &now.to_rfc3339(), reason) {
        let _ = fs::remove_file(&zip_path);
        return Err(format!("Backup fehlgeschlagen: {e}"));
    }

    Ok(zip_path)
}

fn write_zip(
    zip_path: &Path,
    scanned: &ScannedGame,
    created_at: &str,
    reason: &str,
) -> Result<(), Box<dyn Error>> {
    let mut zip = ZipWriter::new(File::create(zip_path)?);
    let mut archived = Vec::new();

    for file in &scanned.files {
        let archive_path = archive_path(&file.portable);
        zip.start_file(&archive_path, file_options())?;
        let mut source = File::open(&file.path)?;
        let sha256 = copy_and_hash(&mut source, &mut zip)?;

        archived.push(ArchivedFile {
            portable: file.portable.clone(),
            archive_path,
            size: file.size,
            sha256,
        });
    }

    let info = BackupInfo {
        game_name: scanned.game.name.clone(),
        launcher: scanned.game.launcher.clone(),
        launcher_id: scanned.game.launcher_id.clone(),
        created_at: created_at.to_string(),
        content_hash: content_hash(&archived),
        files: archived,
        manifest_name: scanned.manifest_name.clone(),
        reason: reason.to_string(),
    };

    zip.start_file("backup.json", file_options())?;
    zip.write_all(serde_json::to_string_pretty(&info)?.as_bytes())?;
    zip.finish()?;
    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupSummary {
    pub file_name: String,
    pub created_at: String,
    pub file_count: usize,
    pub total_size: u64,
}

pub fn read_info(zip_path: &Path) -> Result<BackupInfo, Box<dyn Error>> {
    let mut archive = ZipArchive::new(File::open(zip_path)?)?;
    let mut json = String::new();
    archive.by_name("backup.json")?.read_to_string(&mut json)?;
    Ok(serde_json::from_str(&json)?)
}

pub fn list_backups(backup_root: &Path, launcher_id: &str) -> Vec<BackupSummary> {
    let dir = backup_root.join(launcher_id);
    let Ok(entries) = fs::read_dir(&dir) else {
        return Vec::new();
    };

    let mut backups: Vec<BackupSummary> = entries
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().is_some_and(|ext| ext == "zip"))
        .filter_map(|path| {
            let info = read_info(&path).ok()?;
            Some(BackupSummary {
                file_name: path.file_name()?.to_string_lossy().to_string(),
                created_at: info.created_at,
                file_count: info.files.len(),
                total_size: info.files.iter().map(|f| f.size).sum(),
            })
        })
        .collect();

    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    backups
}

pub fn restore_backup(zip_path: &Path, ctx: &paths::Context) -> Result<usize, String> {
    restore_inner(zip_path, ctx).map_err(|e| format!("Wiederherstellen fehlgeschlagen: {e}"))
}

fn restore_inner(zip_path: &Path, ctx: &paths::Context) -> Result<usize, Box<dyn Error>> {
    let info = read_info(zip_path)?;
    let mut archive = ZipArchive::new(File::open(zip_path)?)?;

    let mut targets = Vec::new();
    for file in &info.files {
        let target = paths::from_portable(&file.portable, ctx)
            .ok_or_else(|| format!("Pfad nicht auflösbar: {}", file.portable))?;
        targets.push((file, target));
    }

    for (file, target) in &targets {
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut source = archive.by_name(&file.archive_path)?;
        let mut dest = File::create(target)?;
        io::copy(&mut source, &mut dest)?;
    }

    Ok(targets.len())
}

fn copy_and_hash(source: &mut impl Read, dest: &mut impl Write) -> io::Result<String> {
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];
    loop {
        let read = source.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
        dest.write_all(&buffer[..read])?;
    }
    Ok(hex::encode(hasher.finalize()))
}

fn content_hash(files: &[ArchivedFile]) -> String {
    let mut sorted: Vec<&ArchivedFile> = files.iter().collect();
    sorted.sort_by(|a, b| a.portable.cmp(&b.portable));

    let mut hasher = Sha256::new();
    for file in sorted {
        hasher.update(file.portable.as_bytes());
        hasher.update([0]);
        hasher.update(file.sha256.as_bytes());
        hasher.update([b'\n']);
    }
    hex::encode(hasher.finalize())
}
