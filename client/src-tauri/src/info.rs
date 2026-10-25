use serde::Serialize;
use steamlocate::SteamDir;
use tauri::{AppHandle, Manager};
use walkdir::WalkDir;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageInfo {
    pub path: String,
    pub total_bytes: u64,
    pub backup_count: usize,
}

#[tauri::command]
pub fn get_storage_info(app: AppHandle) -> Result<StorageInfo, String> {
    let root = app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?
        .join("backups");

    let mut total_bytes = 0;
    let mut backup_count = 0;

    for entry in WalkDir::new(&root).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        if let Ok(metadata) = entry.metadata() {
            total_bytes += metadata.len();
        }
        if entry.path().extension().is_some_and(|ext| ext == "zip") {
            backup_count += 1;
        }
    }

    Ok(StorageInfo {
        path: root.to_string_lossy().into_owned(),
        total_bytes,
        backup_count,
    })
}

#[tauri::command]
pub fn get_steam_libraries() -> Vec<String> {
    let Ok(steam) = SteamDir::locate() else {
        return Vec::new();
    };
    let Ok(libraries) = steam.libraries() else {
        return Vec::new();
    };

    libraries
        .filter_map(Result::ok)
        .map(|library| library.path().to_string_lossy().into_owned())
        .collect()
}
