use tauri::command;
use sha2::{Sha256, Digest};
use image::io::Reader as ImageReader;
use std::fs;
use std::path::Path;
use std::io::Cursor;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageProbeResult {
    pub width: u32,
    pub height: u32,
    pub mime: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComputeHashResult {
    pub sha256: String,
}

/// Compute SHA256 hash of a file
#[command]
pub async fn compute_sha256(file_path: String) -> Result<ComputeHashResult, String> {
    let path = Path::new(&file_path);
    
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    let content = fs::read(path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let mut hasher = Sha256::new();
    hasher.update(&content);
    let result = hasher.finalize();
    let hash = format!("{:x}", result);
    
    Ok(ComputeHashResult { sha256: hash })
}

/// Compute SHA256 hash of bytes
#[command]
pub async fn compute_sha256_bytes(bytes: Vec<u8>) -> Result<ComputeHashResult, String> {
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let result = hasher.finalize();
    let hash = format!("{:x}", result);
    
    Ok(ComputeHashResult { sha256: hash })
}

/// Probe image file for metadata (width, height, mime type)
#[command]
pub async fn probe_image(file_path: String) -> Result<ImageProbeResult, String> {
    let path = Path::new(&file_path);
    
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    let img = ImageReader::open(path)
        .map_err(|e| format!("Failed to open image: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {}", e))?;
    
    let width = img.width();
    let height = img.height();
    
    // Determine MIME type from file extension
    let extension = path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();
    
    let mime = match extension.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "tiff" | "tif" => "image/tiff",
        "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    }.to_string();
    
    Ok(ImageProbeResult {
        width,
        height,
        mime,
    })
}

/// Probe image from bytes
#[command]
pub async fn probe_image_bytes(bytes: Vec<u8>, extension: String) -> Result<ImageProbeResult, String> {
    let cursor = Cursor::new(&bytes);
    
    let img = ImageReader::new(cursor)
        .with_guessed_format()
        .map_err(|e| format!("Failed to guess image format: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {}", e))?;
    
    let width = img.width();
    let height = img.height();
    
    // Determine MIME type from extension
    let mime = match extension.to_lowercase().as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "tiff" | "tif" => "image/tiff",
        "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    }.to_string();
    
    Ok(ImageProbeResult {
        width,
        height,
        mime,
    })
}

/// Ensure directory exists, creating it if necessary
#[command]
pub async fn ensure_dir(dir_path: String) -> Result<(), String> {
    let path = Path::new(&dir_path);
    
    if !path.exists() {
        fs::create_dir_all(path)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    Ok(())
}

/// Get file extension from MIME type
#[command]
pub async fn ext_from_mime(mime: String) -> Result<String, String> {
    let extension = match mime.as_str() {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/gif" => "gif",
        "image/webp" => "webp",
        "image/bmp" => "bmp",
        "image/tiff" => "tiff",
        "image/svg+xml" => "svg",
        "application/pdf" => "pdf",
        "text/plain" => "txt",
        _ => "bin",
    }.to_string();
    
    Ok(extension)
}

/// Generate a nanoid
#[command]
pub async fn generate_nanoid() -> Result<String, String> {
    Ok(nanoid::nanoid!())
}
