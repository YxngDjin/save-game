use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;
use reqwest::header::{ETAG, IF_NONE_MATCH};
use reqwest::StatusCode;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Manager};

const MANIFEST_URL: &str = "https://raw.githubusercontent.com/mtkennerly/ludusavi-manifest/master/data/manifest.yaml";

pub type Manifest = HashMap<String, GameEntry>;

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct GameEntry {
    pub files: HashMap<String, FileEntry>,
    pub steam: Option<SteamInfo>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct FileEntry {
    pub tags: Vec<String>,
    pub when: Vec<Condition>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Condition {
    pub os: Option<String>,
    pub store: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SteamInfo {
    pub id: Option<u32>,
}

pub fn load(path: &Path) -> Result<Manifest, String> {
    let text = std::fs::read_to_string(path)
        .map_err(|e| format!("Manifest konnte nicht gelesen werden: {e}"))?;
    serde_norway::from_str(&text)
        .map_err(|e| format!("Manifest ist ungültig: {e}"))
}

impl FileEntry {
    pub fn applies_to(&self, os: &str, store: &str) -> bool {
        if self.when.is_empty() {
            return true;
        }
        self.when.iter().any(|c| {
            c.os.as_deref().map_or(true, |o| o == os)
                && c.store.as_deref().map_or(true, |s| s == store)
        })
    }
}

pub fn steam_index(manifest: &Manifest) -> HashMap<u32, &str> {
    manifest
        .iter()
        .filter_map(|(name, entry)| {
            let id = entry.steam.as_ref()?.id?;
            Some((id, name.as_str()))
        })
        .collect()
}

#[derive(Default)]
pub struct ManifestState(tauri::async_runtime::Mutex<Option<Arc<Manifest>>>);

fn manifest_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?
        .join("manifest.yaml"))
}

async fn download_if_changed(path: &Path) -> Result<(), String> {
    let etag_path = path.with_extension("etag");
    let mut request = crate::server::client_with_timeout(300)?.get(MANIFEST_URL);

    if path.is_file() {
        if let Ok(etag) = std::fs::read_to_string(&etag_path) {
            request = request.header(IF_NONE_MATCH, etag.trim());
        }
    }

    let response = request.send().await.map_err(|e| e.to_string())?;
    if response.status() == StatusCode::NOT_MODIFIED {
        return Ok(());
    }
    if !response.status().is_success() {
        return Err(format!("GitHub antwortet mit Status {}", response.status()));
    }

    let etag = response
        .headers()
        .get(ETAG)
        .and_then(|value| value.to_str().ok())
        .map(str::to_string);
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let partial = path.with_extension("part");
    std::fs::write(&partial, &bytes).map_err(|e| e.to_string())?;
    std::fs::rename(&partial, path).map_err(|e| e.to_string())?;

    if let Some(etag) = etag {
        let _ = std::fs::write(&etag_path, etag);
    }
    Ok(())
}

pub async fn ensure(app: &AppHandle) -> Result<Arc<Manifest>, String> {
    let state = app.state::<ManifestState>();
    let mut cached = state.0.lock().await;
    if let Some(manifest) = cached.as_ref() {
        return Ok(manifest.clone());
    }

    let path = manifest_path(app)?;
    if let Err(e) = download_if_changed(&path).await {
        if !path.is_file() {
            return Err(format!(
                "Manifest konnte nicht heruntergeladen werden. Bitte Internetverbindung prüfen. ({e})"
            ));
        }
    }

    let load_path = path.clone();
    let manifest = tauri::async_runtime::spawn_blocking(move || load(&load_path))
        .await
        .map_err(|e| e.to_string())??;

    let manifest = Arc::new(manifest);
    *cached = Some(manifest.clone());
    Ok(manifest)
}