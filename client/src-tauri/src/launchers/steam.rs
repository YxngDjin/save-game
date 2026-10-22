use super::Game;
use winreg::RegKey;
use winreg::enums::HKEY_CURRENT_USER;

pub fn list_games() -> Result<Vec<Game>, steamlocate::Error> {
    let steam_dir = steamlocate::locate()?;
    let mut games = Vec::new();

    for library in steam_dir.libraries()? {
        let Ok(library) = library else { continue };

        for app in library.apps() {
            let Ok(app) = app else { continue };

            let install_dir = library
                .path()
                .join("steamapps")
                .join("common")
                .join(&app.install_dir);

            games.push(Game {
                launcher: "Steam".to_string(),
                launcher_id: app.app_id.to_string(),
                name: app
                    .name
                    .unwrap_or_else(|| format!("Unbekannt ({})", app.app_id)),
                install_dir,
            });
        }
    }

    games.sort_by_key(|game| game.name.to_lowercase());
    Ok(games)
}

pub fn steam_root() -> Result<std::path::PathBuf, steamlocate::Error> {
    Ok(steamlocate::locate()?.path().to_path_buf())
}

pub fn is_running(app_id: u32) -> bool {
    running_app_id() == app_id
}

pub fn running_app_id() -> u32 {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let Ok(key) = hkcu.open_subkey(r"Software\Valve\Steam") else {
        return 0;
    };
    key.get_value("RunningAppID").unwrap_or(0)
}
