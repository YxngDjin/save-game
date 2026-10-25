use serde::Serialize;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;

use crate::launchers::steam;

const POLL_INTERVAL: Duration = Duration::from_secs(5);
const SETTLE_DELAY: Duration = Duration::from_secs(15);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoBackupEvent {
    pub launcher_id: String,
    pub message: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunningGame {
    pub launcher_id: String,
    pub name: String,
    pub since: i64,
}

#[derive(Default)]
pub struct WatcherState {
    running: Mutex<Option<RunningGame>>,
    paused_until: Mutex<Option<i64>>,
}

fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

fn game_name(app_id: u32) -> String {
    let id = app_id.to_string();
    steam::list_games()
        .ok()
        .and_then(|games| games.into_iter().find(|game| game.launcher_id == id))
        .map(|game| game.name)
        .unwrap_or_else(|| format!("App {app_id}"))
}

fn set_running(app: &AppHandle, app_id: u32) {
    let running = (app_id != 0).then(|| RunningGame {
        launcher_id: app_id.to_string(),
        name: game_name(app_id),
        since: now_ms(),
    });
    *app.state::<WatcherState>().running.lock().unwrap() = running.clone();
    let _ = app.emit("running-game", running);
}

fn is_paused(app: &AppHandle) -> bool {
    let until = *app.state::<WatcherState>().paused_until.lock().unwrap();
    until.is_some_and(|until| until > now_ms())
}

pub async fn watch_steam(app: AppHandle) {
    let mut last_running = steam::running_app_id();
    set_running(&app, last_running);

    loop {
        tokio::time::sleep(POLL_INTERVAL).await;

        let running = steam::running_app_id();
        if running == last_running {
            continue;
        }
        let ended = last_running;
        last_running = running;
        let ended_name = app
            .state::<WatcherState>()
            .running
            .lock()
            .unwrap()
            .as_ref()
            .map(|game| game.name.clone())
            .unwrap_or_else(|| format!("App {ended}"));
        set_running(&app, running);

        if ended == 0 || is_paused(&app) {
            continue;
        }

        tokio::time::sleep(SETTLE_DELAY).await;

        let launcher_id = ended.to_string();
        let result = crate::perform_backup(&app, &launcher_id, "auto").await;

        let message = match &result {
            Ok(Some(report)) => report.message(),
            Ok(None) => continue,
            Err(e) => format!("Automatisches Backup fehlgeschlagen: {e}"),
        };

        match &result {
            Ok(Some(report)) if report.created => {
                notify(&app, &format!("{ended_name} gesichert"), &report.upload);
            }
            Err(e) => {
                notify(
                    &app,
                    &format!("{ended_name} konnte nicht gesichert werden"),
                    e,
                );
            }
            _ => {}
        }

        let _ = app.emit(
            "auto-backup",
            AutoBackupEvent {
                launcher_id,
                message,
            },
        );
    }
}

fn notify(app: &AppHandle, title: &str, body: &str) {
    let _ = app.notification().builder().title(title).body(body).show();
}

#[tauri::command]
pub fn get_running_game(state: State<'_, WatcherState>) -> Option<RunningGame> {
    state.running.lock().unwrap().clone()
}

#[tauri::command]
pub fn get_paused_until(state: State<'_, WatcherState>) -> Option<i64> {
    let until = *state.paused_until.lock().unwrap();
    until.filter(|until| *until > now_ms())
}

#[tauri::command]
pub fn pause_automatic(state: State<'_, WatcherState>, minutes: i64) -> Option<i64> {
    let until = (minutes > 0).then(|| now_ms() + minutes * 60_000);
    *state.paused_until.lock().unwrap() = until;
    until
}
