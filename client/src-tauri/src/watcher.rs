use serde::Serialize;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::launchers::steam;

const POLL_INTERVAL: Duration = Duration::from_secs(5);
const SETTLE_DELAY: Duration = Duration::from_secs(15);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoBackupEvent {
    pub launcher_id: String,
    pub message: String,
}

pub async fn watch_steam(app: AppHandle) {
    let mut last_running = steam::running_app_id();

    loop {
        tokio::time::sleep(POLL_INTERVAL).await;

        let running = steam::running_app_id();
        if running == last_running {
            continue;
        }
        let ended = last_running;
        last_running = running;
        if ended == 0 {
            continue;
        }

        tokio::time::sleep(SETTLE_DELAY).await;

        let launcher_id = ended.to_string();
        let message = match crate::perform_backup(&app, &launcher_id, "auto").await {
            Ok(Some(message)) => message,
            Ok(None) => continue,
            Err(e) => format!("Automatisches Backup fehlgeschlagen: {e}"),
        };

        let _ = app.emit(
            "auto-backup",
            AutoBackupEvent {
                launcher_id,
                message,
            },
        );
    }
}
