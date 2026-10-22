mod launchers;
mod manifest;
mod scan;
mod paths;
mod backup;
mod config;
mod credentials;
mod server;

use std::path::Path;
use tauri::Manager;
use launchers::Game;
use std::path::PathBuf;
use serde::Serialize;



#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PairingStatus {
    server_url: Option<String>,
    device_name: Option<String>,
    paired: bool,
}

#[tauri::command]
fn get_pairing_status(app: tauri::AppHandle) -> PairingStatus {
    let config = config::load(&app);
    PairingStatus { 
        server_url: config.server_url,
        device_name: config.device_name, 
        paired: config.device_id.is_some() && credentials::load_token().is_some(),
    }
}

#[tauri::command]
async fn pair_device(
    app: tauri::AppHandle,
    url: String,
    code: String,
    device_name: String,
) -> Result<PairingStatus, String> {
    let url = server::normalize_url(&url)?;
    let result = server::claim(&url, code.trim(), device_name.trim()).await?;

    credentials::save_token(&result.token)?;
    config::save(
        &app, 
        &config::AppConfig {
            server_url: Some(url),
            device_id: Some(result.device_id),
            device_name: Some(result.device_name)
        }
    )?;

    Ok(get_pairing_status(app))
}

#[tauri::command]
fn unpair_device(app: tauri::AppHandle) -> Result<PairingStatus, String> {
    credentials::delete_token()?;
    config::save(&app, &config::AppConfig::default())?;
    Ok(get_pairing_status(app))
}


#[tauri::command]
fn get_installed_games() -> Result<Vec<Game>, String> {
    launchers::steam::list_games()
        .map_err(|e| format!("Steam-Spiele konnten nicht gelesen werden: {e}"))
}

#[tauri::command]
async fn test_server(url: String) -> Result<server::Health, String> {
    let url = server::normalize_url(&url)?;
    server::check_health(&url).await
}

fn backup_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?
        .join("backups")
    )
}

#[tauri::command]
async fn restore_backup(app: tauri::AppHandle, launcher_id: String, file_name: String) -> Result<String, String> {
    if file_name.contains(['/', '\\']) || !file_name.ends_with(".zip") {
        return Err("Ungültiger Backup-Name".to_string());
    }

    let app_id: u32 = launcher_id.parse().map_err(|_| "Ungültige App-ID")?;
    if launchers::steam::is_running(app_id) {
        return Err("Das Spiel läuft gerade. Bitte zuerst beenden.".to_string());
    }

    let root = backup_root(&app)?;
    let zip_path = root.join(&launcher_id).join(&file_name);
    if !zip_path.is_file() {
        return Err("Backup nicht gefunden".to_string());
    }

    let info = backup::read_info(&zip_path).map_err(|e| format!("Backup ist beschädigt: {e}"))?;
    if info.launcher_id != launcher_id {
         return Err("Dieses Backup gehört zu einem anderen Spiel".to_string());
    }

    let scanned = run_scan()?;
    let game = scanned
        .iter()
        .find(|s| s.game.launcher_id == launcher_id)
        .ok_or("Spiel nicht gefunden")?;

    let safety = if game.files.is_empty() {
        None
    } else {
        Some(backup::create_backup(game, &root, "pre-restore")?)
    };

    let steam_root = launchers::steam::steam_root().map_err(|e| e.to_string())?;
    let ctx = paths::Context {
        base: &game.game.install_dir,
        root: &steam_root,
    };
    let count = backup::restore_backup(&zip_path, &ctx)?;

    Ok(match safety {
        Some(path) => format!("{count} Dateien wiederhergestellt. Vorheriger Stand gesichert: {}", path.display()),
        None => format!("{count} Dateien wiederhergestellt."),
    })
}


#[tauri::command]
async fn list_backups(app: tauri::AppHandle, launcher_id: String) -> Result<Vec<backup::BackupSummary>, String> {
    Ok(backup::list_backups(&backup_root(&app)?, &launcher_id))
}

#[tauri::command]
async fn scan_games() -> Result<Vec<scan::ScannedGame>, String> {
    run_scan()
}

#[tauri::command]
async fn backup_game(app: tauri::AppHandle, launcher_id: String) -> Result<String, String> {
    let scanned = run_scan()?;
    let game = scanned
        .iter()
        .find(|s| s.game.launcher_id == launcher_id)
        .ok_or("Spiel nicht gefunden")?;

    if game.files.is_empty() {
        return Err("Keine Dateien zum Sichern gefunden".to_string());
    }

        let zip_path = backup::create_backup(game, &backup_root(&app)?, "manual")?;

    let upload = match try_upload(&app, &zip_path).await {
        Ok(Some(response)) if response.duplicate => "Server hat diesen Stand schon.".to_string(),
        Ok(Some(_)) => "Auf den Server hochgeladen.".to_string(),
        Ok(None) => "Nicht gekoppelt, nur lokal gesichert.".to_string(),
        Err(e) => format!("Upload fehlgeschlagen: {e}"),
    };

    Ok(format!("Gesichert: {}. {upload}", zip_path.display()))
}

fn server_session(app: &tauri::AppHandle) -> Result<(String, String), String> {
    let config = config::load(app);
    match (config.server_url, credentials::load_token()) {
        (Some(url), Some(token)) => Ok((url, token)),
        _ => Err("Nicht mit einem Server gekoppelt".to_string()),
    }
}

#[tauri::command]
async fn list_server_backups(app: tauri::AppHandle, manifest_name: String) -> Result<Vec<server::ServerBackup>, String> {
    let (url, token) = server_session(&app)?;
    server::list_backups_for_game(&url, &token, &manifest_name).await
}

#[tauri::command]
async fn restore_server_backup(app: tauri::AppHandle, launcher_id: String, backup_id: String) -> Result<String, String> {
    launcher_id.parse::<u32>().map_err(|_| "Ungültige App-ID")?;
    let valid_id = backup_id.len() == 36 && backup_id.chars().all(|c| c.is_ascii_hexdigit() || c == '-');
    if !valid_id {
        return Err("Ungültige Backup-ID".to_string());
    }

    let (url, token) = server_session(&app)?;
    let file_name = format!("server_{backup_id}.zip");
    let target = backup_root(&app)?.join(&launcher_id).join(&file_name);

    if !target.is_file() {
        server::download_backup(&url, &token, &backup_id, &target).await?;
    }

    restore_backup(app, launcher_id, file_name).await
}

fn run_scan() -> Result<Vec<scan::ScannedGame>, String> {
    let manifest = manifest::load(Path::new(r"C:\Users\derde\Documents\SaveGame\manifest.yaml"))?;
    let games = launchers::steam::list_games()
        .map_err(|e| format!("Steam-Spiele konnten nicht gelesen werden: {e}"))?;
    let root = launchers::steam::steam_root()
        .map_err(|e| format!("Steam nicht gefunden: {e}"))?;
    Ok(scan::match_steam_games(games, &manifest, &root))
}

async fn try_upload(app: &tauri::AppHandle, zip_path: &Path) -> Result<Option<server::UploadResponse>, String> {
    let config = config::load(app);
    let (Some(url), Some(token)) = (config.server_url, credentials::load_token()) else {
        return Ok(None);
    };

    let info = backup::read_info(zip_path).map_err(|e| format!("Backup ist beschädigt: {e}"))?;
    server::upload_backup(&url, &token, zip_path, &info).await.map(Some) 
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_installed_games, scan_games, backup_game, list_backups, restore_backup, test_server, get_pairing_status, pair_device, unpair_device, list_server_backups, restore_server_backup])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
