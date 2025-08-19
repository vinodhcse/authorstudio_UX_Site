
use tauri::{Manager, State, Emitter};
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

// SurrealDB backend
mod surreal;
use surreal::{
    surreal_init_db,
    book_create, book_get_by_user, book_get, book_put, book_delete, book_mark_sync, book_get_dirty,
    version_get, versions_by_book, version_put, version_content_get, version_content_update,
    chapter_get, chapter_put, chapters_by_version, chapter_mark_sync, chapter_mark_conflict, chapters_get_dirty,
    scene_get, scenes_by_book, scene_put, scenes_get_dirty, scene_mark_sync, scene_mark_conflict,
    user_keys_get, user_keys_set,
    session_get, session_get_by_email, session_get_by_user_id, session_upsert, session_clear, session_seal, session_activate,
    device_get, device_upsert,
    kv_set, kv_get, kv_delete,
    get_config_dir, asset_list_all, link_list_all,
};

// App Database (main implementation)
mod app_surreal;
use app_surreal::{
    app_create_book, app_get_books, app_get_book_by_id, app_update_book, app_delete_book,
    app_create_version, app_get_versions_by_book,
    app_create_chapter, app_get_chapters_by_version,
    app_create_character, app_get_characters_by_book,
    app_delete_all_data,
    // Session and user keys commands
    app_get_session, app_save_session, app_clear_session,
    app_get_user_keys, app_save_user_keys,
    // User Books operations
    app_get_user_books, app_get_book, app_update_book_by_user, app_delete_book_by_user,
    // FileAsset operations
    app_create_file_asset, app_get_file_asset_by_id, app_get_file_asset_by_sha256,
    app_update_file_asset, app_get_file_assets_by_status, app_delete_file_asset,
    app_delete_all_file_assets, // NEW: Delete all file assets
    app_get_asset_file_path, // NEW: Get full filesystem path for asset
    // FileAssetLink operations
    app_create_file_asset_link, app_upsert_file_asset_link,
    app_get_file_asset_links_by_entity, app_get_file_asset_links_by_entity_role,
    app_get_file_asset_links_by_asset, app_delete_file_asset_link,
    app_delete_file_asset_links_by_entity_role, app_delete_file_asset_links_by_asset,
    // World operations
    app_create_world, app_get_worlds_by_book, app_get_world_by_id,
    app_update_world, app_delete_world,
    // Location operations
    app_create_location, app_get_locations_by_world, app_get_locations_by_book,
    app_update_location, app_delete_location,
    // Object operations
    app_create_object, app_get_objects_by_world, app_get_objects_by_book,
    app_update_object, app_delete_object,
    // Lore operations
    app_create_lore, app_get_lore_by_world, app_get_lore_by_book,
    app_update_lore, app_delete_lore,
    // Scene operations
    app_create_scene, app_get_scene_by_id, app_get_scenes_by_book,
    app_update_scene, app_delete_scene,
    // Generic query operation
    app_surreal_query,
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
    // Removed SQL plugin; SurrealDB is used for local storage
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            set_user_role,
            can_access_clipboard,
            controlled_copy_to_clipboard,
            get_current_user_role,
            get_cpu_gpu_specs,
            // App database commands (main implementation)
            app_create_book,
            app_get_books,
            app_get_book_by_id,
            app_update_book,
            app_delete_book,
            app_create_version,
            app_get_versions_by_book,
            app_create_chapter,
            app_get_chapters_by_version,
            app_create_character,
            app_get_characters_by_book,
            app_delete_all_data,
            app_get_session,
            app_save_session,
            app_clear_session,
            app_get_user_keys,
            app_save_user_keys,
            // User Books operations
            app_get_user_books,
            app_get_book,
            app_update_book_by_user,
            app_delete_book_by_user,
            // FileAsset operations
            app_create_file_asset,
            app_get_file_asset_by_id,
            app_get_file_asset_by_sha256,
            app_update_file_asset,
            app_get_file_assets_by_status,
            app_delete_file_asset,
            app_delete_all_file_assets, // NEW: Delete all file assets
            app_get_asset_file_path, // NEW: Get full filesystem path for asset
            // FileAssetLink operations
            app_create_file_asset_link,
            app_upsert_file_asset_link,
            app_get_file_asset_links_by_entity,
            app_get_file_asset_links_by_entity_role,
            app_get_file_asset_links_by_asset,
            app_delete_file_asset_link,
            app_delete_file_asset_links_by_entity_role,
            app_delete_file_asset_links_by_asset,
            // World operations
            app_create_world,
            app_get_worlds_by_book,
            app_get_world_by_id,
            app_update_world,
            app_delete_world,
            // Location operations
            app_create_location,
            app_get_locations_by_world,
            app_get_locations_by_book,
            app_update_location,
            app_delete_location,
            // Object operations
            app_create_object,
            app_get_objects_by_world,
            app_get_objects_by_book,
            app_update_object,
            app_delete_object,
            // Lore operations
            app_create_lore,
            app_get_lore_by_world,
            app_get_lore_by_book,
            app_update_lore,
            app_delete_lore,
            // Scene operations
            app_create_scene,
            app_get_scene_by_id,
            app_get_scenes_by_book,
            app_update_scene,
            app_delete_scene,
            // Surreal commands (legacy)
            surreal_init_db,
            app_surreal_query,
            book_create,
            book_get_by_user,
            book_get,
            book_put,
            book_delete,
            book_mark_sync,
            book_get_dirty,
            version_get,
            versions_by_book,
            version_put,
            version_content_get,
            version_content_update,
            chapter_get,
            chapter_put,
            chapters_by_version,
            chapter_mark_sync,
            chapter_mark_conflict,
            chapters_get_dirty,
            scene_get,
            scenes_by_book,
            scene_put,
            scenes_get_dirty,
            scene_mark_sync,
            scene_mark_conflict,
            // Keys
            user_keys_get,
            user_keys_set,
            // Session/Device/KV
            session_get,
            session_get_by_email,
            session_get_by_user_id,
            session_upsert,
            session_clear,
            session_seal,
            session_activate,
            device_get,
            device_upsert,
            kv_set,
            kv_get,
            kv_delete,
            // Assets/Links (removed - using app_surreal versions instead)
            get_config_dir,
            asset_list_all,
            link_list_all,
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

            // Initialize the new unified database only
            let app_handle = app.handle();
            /*let new_db = tauri::async_runtime::block_on(async {
                // Get the data directory path
                let data_dir = app_handle.path().app_data_dir().map_err(|e| format!("Failed to get data dir: {}", e))?;
                let data_dir_str = data_dir.to_string_lossy();
                database::AppDatabase::new(&data_dir_str).await.map_err(|e| format!("Database error: {}", e))
            });*/
            let handle = app.handle().clone();
            let new_db = tauri::async_runtime::block_on(async {
                app_surreal::AppDatabase::new(handle).await
                    .map_err(|e| format!("Database error: {}", e))
            });

            match new_db {
                Ok(db) => {
                    app.manage(db);
                    println!("App database initialized successfully");
                },
                Err(e) => {
                    eprintln!("Failed to initialize app database: {}", e);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
