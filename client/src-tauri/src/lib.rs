mod launchers;
mod manifest;
mod scan;
mod paths;

use launchers::Game;
use std::path::Path;

#[tauri::command]
fn get_installed_games() -> Result<Vec<Game>, String> {
    launchers::steam::list_games()
        .map_err(|e| format!("Steam-Spiele konnten nicht gelesen werden: {e}"))
}

#[tauri::command]
async fn scan_games() -> Result<Vec<scan::ScannedGame>, String> {
    let manifest = manifest::load(Path::new(r"C:\Users\derde\Documents\SaveGame\manifest.yaml"))?;
    let games = launchers::steam::list_games()
        .map_err(|e| format!("Steam-Spiele konnten nicht gelesen werden: {e}"))?;
    let root = launchers::steam::steam_root()
        .map_err(|e| format!("Steam nicht gefunden: {e}"))?;
    Ok(scan::match_steam_games(games, &manifest, &root))
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_installed_games, scan_games])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
