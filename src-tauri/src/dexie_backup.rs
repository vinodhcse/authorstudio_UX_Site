use std::fs;
use std::path::PathBuf;
use serde_json::Value;
use tauri::{AppHandle, Manager};

/// Write JSON data to a file in a custom directory structure for Dexie backup
#[tauri::command]
pub async fn write_dexie_backup_json(app_handle: AppHandle, relative_path: String, json_data: Value) -> Result<(), String> {
    let app_data_dir: PathBuf = app_handle.path().app_data_dir().map_err(|_| "Could not resolve app_data_dir")?;
    let full_path = app_data_dir.join(&relative_path);
    let parent_dir = full_path.parent().ok_or("Invalid path")?;
    // Ensure parent directory exists
    std::fs::create_dir_all(parent_dir).map_err(|e| e.to_string())?;
    let tmp_path = full_path.with_extension("tmp");
    let json_bytes = serde_json::to_vec(&json_data).map_err(|e| e.to_string())?;
    // Write to temp file first
    fs::write(&tmp_path, &json_bytes).map_err(|e| e.to_string())?;
    // Fsync and rename
    fs::rename(&tmp_path, &full_path).map_err(|e| e.to_string())?;
    Ok(())
}

/// Read JSON data from a file in a custom directory structure for Dexie backup
#[tauri::command]
pub async fn read_dexie_backup_json(app_handle: AppHandle, relative_path: String) -> Result<Value, String> {
    let app_data_dir = app_handle.path().app_data_dir().map_err(|_| "Could not resolve app_data_dir")?;
    let full_path = app_data_dir.join(&relative_path);
    let json_bytes = fs::read(&full_path).map_err(|e| e.to_string())?;
    let json_data: Value = serde_json::from_slice(&json_bytes).map_err(|e| e.to_string())?;
    Ok(json_data)
}
