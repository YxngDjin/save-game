use std::path::{Path, PathBuf};

use serde::Serialize;
use steamlocate::SteamDir;
use tauri::{AppHandle, Manager};
use walkdir::WalkDir;

#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameArt {
    pub header: Option<String>,
    pub capsule: Option<String>,
    pub hero: Option<String>,
    pub logo: Option<String>,
}

fn find_file(dir: &Path, name: &str) -> Option<PathBuf> {
    WalkDir::new(dir)
        .max_depth(2)
        .into_iter()
        .filter_map(Result::ok)
        .find(|entry| entry.file_type().is_file() && entry.file_name() == name)
        .map(|entry| entry.into_path())
}

fn path_string(path: Option<PathBuf>) -> Option<String> {
    path.map(|p| p.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn get_game_art(app: AppHandle, app_id: String) -> Result<GameArt, String> {
    if app_id.is_empty() || !app_id.chars().all(|c| c.is_ascii_digit()) {
        return Err("Ungültige App-ID".into());
    }

    let steam = SteamDir::locate().map_err(|e| e.to_string())?;
    let dir = steam
        .path()
        .join("appcache")
        .join("librarycache")
        .join(&app_id);

    if !dir.is_dir() {
        return Ok(GameArt::default());
    }

    app.asset_protocol_scope()
        .allow_directory(&dir, true)
        .map_err(|e| e.to_string())?;

    Ok(GameArt {
        header: path_string(find_file(&dir, "library_header.jpg")),
        capsule: path_string(find_file(&dir, "library_capsule.jpg")),
        hero: path_string(find_file(&dir, "library_hero.jpg")),
        logo: path_string(find_file(&dir, "logo.png")),
    })
}
