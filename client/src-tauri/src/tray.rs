use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::PhysicalPosition;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{App, AppHandle, Manager};

static LAST_HIDE: Mutex<Option<Instant>> = Mutex::new(None);

pub fn hide_tray_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("tray") {
        let _ = window.hide();
        *LAST_HIDE.lock().unwrap() = Some(Instant::now());
    }
}

fn toggle_tray_window(app: &AppHandle, cursor: PhysicalPosition<f64>) {
    let Some(window) = app.get_webview_window("tray") else {
        return;
    };

    let just_hidden = LAST_HIDE
        .lock()
        .unwrap()
        .is_some_and(|time| time.elapsed() < Duration::from_millis(300));
    if window.is_visible().unwrap_or(false) || just_hidden {
        hide_tray_window(app);
        return;
    }

    if let Ok(size) = window.outer_size() {
        let width = size.width as f64;
        let height = size.height as f64;
        let mut x = cursor.x - width / 2.0;
        let mut y = cursor.y - height - 12.0;

        if let Ok(Some(monitor)) = window.monitor_from_point(cursor.x, cursor.y) {
            let left = monitor.position().x as f64;
            let top = monitor.position().y as f64;
            let right = left + monitor.size().width as f64;
            x = x.max(left + 12.0).min(right - width - 12.0);
            if y < top {
                y = cursor.y + 12.0;
            }
        }

        let _ = window.set_position(PhysicalPosition::new(x, y));
    }

    let _ = window.show();
    let _ = window.set_focus();
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub fn setup(app: &App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Öffnen", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "beenden", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("SaveGame")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                position,
                ..
            } = event
            {
                toggle_tray_window(tray.app_handle(), position);
            }
        })
        .build(app)?;

    Ok(())
}
