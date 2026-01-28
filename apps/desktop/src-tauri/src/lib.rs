mod notifications;

use tauri::{Manager, RunEvent};

#[tauri::command]
fn start_polling(interval_minutes: u64) -> Result<(), String> {
    notifications::start_polling(interval_minutes);
    Ok(())
}

#[tauri::command]
fn stop_polling() -> Result<(), String> {
    notifications::stop_polling();
    Ok(())
}

#[tauri::command]
fn set_subscriptions(subscriptions: Vec<notifications::Subscription>) -> Result<(), String> {
    notifications::set_subscriptions(subscriptions);
    Ok(())
}

#[tauri::command]
fn get_polling_status() -> bool {
    notifications::is_polling()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize notification system
            notifications::init(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_polling,
            stop_polling,
            set_subscriptions,
            get_polling_status
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, event| {
            if let RunEvent::ExitRequested { api, .. } = event {
                // Allow normal exit behavior
                let _ = api;
            }
        });
}
