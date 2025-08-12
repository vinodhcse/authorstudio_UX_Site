
use tauri::{State, Emitter};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use sysinfo::{System};

mod tool_windows;
use tool_windows::{
    WindowRegistry,
    open_tool_window, minimize_tool_window, restore_tool_window,
    close_tool_window, close_all_tools, list_tool_windows, get_tool_windows_state,
    broadcast_theme_change
};

// Use real Whisper dictation for full AI functionality
mod whisper_dictation;
use whisper_dictation::{
    start_dictation, stop_dictation, test_dictation_system, is_dictation_running
};

// Whisper file testing module for debugging
mod whisper_file_test;
use whisper_file_test::{
    test_whisper_with_file, test_whisper_with_sine_wave, test_whisper_with_speech_pattern
};

// Audio test generator for creating sample files
mod audio_test_generator;
use audio_test_generator::{
    create_test_audio_file, list_test_audio_files
};

// Whisper diagnostics for debugging hallucination issues
mod whisper_diagnostics;
use whisper_diagnostics::{
    test_whisper_silence, test_whisper_noise, test_whisper_microphone_noise
};

// Asset system commands
mod asset_commands;
use asset_commands::{
    compute_sha256, compute_sha256_bytes, probe_image, probe_image_bytes, 
    ensure_dir, ext_from_mime, generate_nanoid
};

// Uncomment this and comment out simple_dictation if you have whisper-rs working:
// mod whisper_dictation;
// use whisper_dictation::{
//     start_dictation, stop_dictation, test_microphone_permissions, is_dictation_running
// };

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserRole {
    user_id: String,
    book_id: String,
    role: String, // "AUTHOR", "CO_WRITER", "EDITOR", "REVIEWER"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemSpecs {
    cpu_brand: String,
    cpu_cores: usize,
    total_ram_mb: u64,
}


#[derive(Default)]
pub struct AppState {
    current_user_role: Mutex<Option<UserRole>>,
}

#[tauri::command]
async fn set_user_role(
    state: State<'_, AppState>,
    user_id: String,
    book_id: String,
    role: String,
) -> Result<(), String> {
    let mut current_role = state.current_user_role.lock().unwrap();
    println!(
        "Setting user role: user_id={}, book_id={}, role={}",
        user_id, book_id, role
    );
    *current_role = Some(UserRole {
        user_id,
        book_id,
        role,
    });
    Ok(())
}

#[tauri::command]
async fn can_access_clipboard(state: State<'_, AppState>) -> Result<bool, String> {
    let current_role = state.current_user_role.lock().unwrap();
    println!("Current user role: {:?}", current_role);
    match &*current_role {
        Some(role) => {
            match role.role.as_str() {
                "AUTHOR" | "CO_WRITER" => Ok(true),
                "EDITOR" | "REVIEWER" => Ok(false),
                _ => Ok(false),
            }
        }
        None => Ok(false), // No role set, deny access
    }
}

#[tauri::command]
async fn controlled_copy_to_clipboard(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    text: String,
) -> Result<bool, String> {
    let can_copy = can_access_clipboard(state).await?;
    
    if can_copy {
        // Use Tauri's invoke API to call the frontend clipboard API
        match app_handle.emit("clipboard-write", &text) {
            Ok(_) => Ok(true),
            Err(e) => {
                eprintln!("Failed to emit clipboard event: {}", e);
                Ok(false)
            }
        }
    } else {
        Ok(false) // Clipboard access denied
    }
}

#[tauri::command]
async fn get_current_user_role(state: State<'_, AppState>) -> Result<Option<UserRole>, String> {
    let current_role = state.current_user_role.lock().unwrap();
    Ok(current_role.clone())
}


#[tauri::command]
fn get_cpu_gpu_specs() -> SystemSpecs {
    let mut sys = System::new_all();
    sys.refresh_cpu(); // refresh only CPU data

    let cpu_brand = sys.cpus().first()
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());

    let cpu_cores = sys.cpus().len();
    let total_ram_mb = sys.total_memory() / 1024; // MB

    SystemSpecs {
        cpu_brand,
        cpu_cores,
        total_ram_mb,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .manage(WindowRegistry::default())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            set_user_role,
            can_access_clipboard,
            controlled_copy_to_clipboard,
            get_current_user_role,
            get_cpu_gpu_specs,
            open_tool_window,
            minimize_tool_window,
            restore_tool_window,
            close_tool_window,
            close_all_tools,
            list_tool_windows,
            get_tool_windows_state,
            broadcast_theme_change,
            start_dictation,
            stop_dictation,
            test_dictation_system,
            is_dictation_running,
            test_whisper_with_file,
            test_whisper_with_sine_wave,
            test_whisper_with_speech_pattern,
            create_test_audio_file,
            list_test_audio_files,
            test_whisper_silence,
            test_whisper_noise,
            test_whisper_microphone_noise,
            // Asset system commands
            compute_sha256,
            compute_sha256_bytes,
            probe_image,
            probe_image_bytes,
            ensure_dir,
            ext_from_mime,
            generate_nanoid
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
