use std::path::{Path, PathBuf};
use crate::{backup, paths};
use serde::Serialize;

use crate::launchers::Game;
use crate::manifest::{self, Manifest};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveLocation {
    pub raw_path: String,
    pub tags: Vec<String>,
    pub resolved: Option<String>,
    pub found: Vec<PathBuf>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannedGame {
    pub game: Game,
    pub manifest_name: String,
    pub locations: Vec<SaveLocation>,
    pub files: Vec<backup::BackupFile>,
    pub total_size: u64,
}

pub fn match_steam_games(games: Vec<Game>, manifest: &Manifest, steam_root: &Path) -> Vec<ScannedGame> {
    let index = manifest::steam_index(manifest);
    let mut result = Vec::new();

    for game in games {
        let Ok(app_id) = game.launcher_id.parse::<u32>() else { continue };
        let Some(name) = index.get(&app_id) else { continue };
        let Some(entry) = manifest.get(*name) else { continue };

        let ctx = paths::Context {
            base: &game.install_dir,
            root: steam_root,
        };

        let locations: Vec<SaveLocation> = entry
            .files
            .iter()
            .filter(|(_, file)| file.applies_to("windows", "steam"))
            .map(|(path, file)| {
                let resolved = paths::resolve(path, &ctx);
                let found = resolved
                    .as_deref()
                    .map(paths::find_existing)
                    .unwrap_or_default();
                SaveLocation {
                    raw_path: path.clone(),
                    tags: file.tags.clone(),
                    resolved,
                    found,
                }
            })
            .collect();

        if locations.is_empty() {
            continue;
        }

        let files = backup::collect_files(&locations, &ctx);
        let total_size = files.iter().map(|f| f.size).sum();

        result.push(ScannedGame {
            game,
            manifest_name: name.to_string(),
            locations,
            files,
            total_size,
        });
    }

    result
}