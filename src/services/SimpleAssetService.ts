/**
 * Simplified Asset Service for Cover Images
 * 
 * This implements a simplified, efficient offline-first cover upload approach:
 * 1. Save image to local data dir /books/files
 * 2. Create file asset with proper file:// URL for WebView access
 * 3. Update book's coverImageRef to point to the file asset
 * 4. Sync to cloud later to get remote URL
 * 
 * Key Benefits:
 * - No memory-intensive base64 conversion for large images
 * - Proper file:// URLs for Tauri WebView compatibility
 * - Much faster loading and display of cover images
 * - Efficient offline-first approach with proper local file access
 */

import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { readFile, writeFile, BaseDirectory, mkdir } from '@tauri-apps/plugin-fs';
import { FileAsset, FileRef } from '../types';
import { appLog } from '../auth/fileLogger';

export interface SimpleCoverUploadResult {
  assetId: string;
  localPath: string;
  dataUrl: string; // Note: Now contains direct filesystem path for Tauri file access
  fileRef: FileRef;
}

export class SimpleAssetService {
  /**
   * Upload cover image with simplified offline-first approach
   */
  static async uploadCover(file: File, bookId: string): Promise<SimpleCoverUploadResult> {
    try {
      await appLog.info('simple-asset', 'Starting simplified cover upload', { 
        fileName: file.name, 
        size: file.size, 
        bookId 
      });

      // 1. Read file and compute hash
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const hashResult = await invoke<{sha256: string}>('compute_sha256_bytes', { 
        bytes: Array.from(fileBytes) 
      });
      const sha256 = hashResult.sha256;
      
      await appLog.info('simple-asset', 'File hash computed', { sha256 });

      // 2. Check if asset already exists
      const existingAsset = await this.getAssetBySha256(sha256);
      if (existingAsset) {
        await appLog.info('simple-asset', 'Asset already exists, reusing', { assetId: existingAsset.id });
        
        // Use direct file path for existing asset
        let displayUrl: string;
        if (existingAsset.remote_url) {
          displayUrl = existingAsset.remote_url;
        } else if (existingAsset.local_path) {
          try {
            // Get the full filesystem path from Tauri
            const fullPath = await invoke<string>('app_get_asset_file_path', { 
              relativePath: existingAsset.local_path 
            });
            // Convert to proper file:// URL for WebView
            displayUrl = convertFileSrc(fullPath);
          } catch (error) {
            // Fallback to data URL
            displayUrl = await this.convertToDataUrl(existingAsset, file.type);
          }
        } else {
          displayUrl = await this.convertToDataUrl(existingAsset, file.type);
        }
        
        const fileRef = this.createFileRef(existingAsset, displayUrl);
        
        return {
          assetId: existingAsset.id,
          localPath: existingAsset.local_path || '',
          dataUrl: displayUrl,
          fileRef
        };
      }

      // 3. Generate asset ID and determine file paths
      const assetId = await invoke<string>('generate_nanoid');
      const ext = this.getFileExtension(file.name);
      
      // Create path: books/{bookId}/files/{sha256}/{filename}
      const relativePath = `books/${bookId}/files/${sha256}`;
      const fileName = `${assetId}${ext}`;
      const fullRelativePath = `${relativePath}/${fileName}`;

      await appLog.info('simple-asset', 'Creating file path', { 
        relativePath, 
        fileName, 
        fullRelativePath 
      });

      // 4. Ensure directory exists and write file
      await mkdir(relativePath, { 
        baseDir: BaseDirectory.AppConfig, 
        recursive: true 
      });
      
      await writeFile(fullRelativePath, fileBytes, { 
        baseDir: BaseDirectory.AppConfig 
      });

      await appLog.info('simple-asset', 'File written to local storage', { fullRelativePath });

      // 5. Get image dimensions
      const { width, height } = await this.getImageDimensions(file);

      // 6. Get file:// URL for immediate display (WebView-compatible)
      let displayUrl: string;
      try {
        // Get the full filesystem path from Tauri
        const fullPath = await invoke<string>('app_get_asset_file_path', { 
          relativePath: fullRelativePath 
        });
        
        // Convert to proper file:// URL for Tauri WebView
        displayUrl = convertFileSrc(fullPath);
        await appLog.info('simple-asset', 'Created file:// URL for display', { 
          fullRelativePath, 
          fullPath, 
          fileUrl: displayUrl
        });
      } catch (error) {
        // Fallback to data URL if filesystem approach fails
        await appLog.warn('simple-asset', 'Failed to get file path, using data URL fallback', { error });
        displayUrl = await this.bytesToDataUrl(fileBytes, file.type);
      }

      // 7. Create asset record in database
      const now = new Date().toISOString();
      const asset: FileAsset = {
        id: assetId,
        sha256,
        ext,
        mime: file.type,
        size_bytes: file.size,
        width,
        height,
        local_path: fullRelativePath,
        status: 'pending_upload', // Mark for upload so it syncs to cloud
        created_at: now,
        updated_at: now
      };

      await this.createAsset(asset);
      await appLog.info('simple-asset', 'Asset created in database', { assetId });

      // 8. Create FileRef for return
      const fileRef = this.createFileRef(asset, displayUrl);

      await appLog.success('simple-asset', 'Simplified cover upload completed', { 
        assetId, 
        localPath: fullRelativePath 
      });

      return {
        assetId,
        localPath: fullRelativePath,
        dataUrl: displayUrl, // Now contains proper file:// URL for WebView
        fileRef
      };

    } catch (error) {
      await appLog.error('simple-asset', 'Simplified cover upload failed', { 
        fileName: file.name, 
        bookId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Get asset by SHA256 hash
   */
  private static async getAssetBySha256(sha256: string): Promise<FileAsset | null> {
    try {
      const result = await invoke<any>('app_get_file_asset_by_sha256', { sha256 });
      if (!result) return null;
      
      return {
        id: result.file_asset_id,
        sha256: result.sha256,
        ext: result.ext,
        mime: result.mime,
        size_bytes: result.size_bytes,
        width: result.width,
        height: result.height,
        local_path: result.local_path,
        remote_id: result.remote_id,
        remote_url: result.remote_url,
        status: result.status,
        created_at: result.created_at,
        updated_at: result.updated_at,
      };
    } catch (error) {
      await appLog.warn('simple-asset', 'Failed to get asset by SHA256', { sha256, error });
      return null;
    }
  }

  /**
   * Create asset in database
   */
  private static async createAsset(asset: FileAsset): Promise<void> {
    const backendAsset = {
      file_asset_id: asset.id,
      sha256: asset.sha256,
      ext: asset.ext,
      mime: asset.mime,
      size_bytes: asset.size_bytes,
      width: asset.width,
      height: asset.height,
      local_path: asset.local_path,
      remote_id: asset.remote_id,
      remote_url: asset.remote_url,
      status: asset.status,
      created_at: asset.created_at,
      updated_at: asset.updated_at,
    };
    
    await invoke('app_create_file_asset', { fileAsset: backendAsset });
  }

  /**
   * Load asset and convert to data URL
   */
  private static async convertToDataUrl(asset: FileAsset, mimeType: string): Promise<string> {
    if (!asset.local_path) {
      throw new Error('Asset has no local path');
    }

    try {
      const fileBytes = await readFile(asset.local_path, { baseDir: BaseDirectory.AppConfig });
      return this.bytesToDataUrl(fileBytes, mimeType);
    } catch (error) {
      await appLog.error('simple-asset', 'Failed to convert asset to data URL', { 
        assetId: asset.id, 
        localPath: asset.local_path, 
        error 
      });
      throw error;
    }
  }

  /**
   * Convert bytes to data URL
   */
  private static async bytesToDataUrl(bytes: Uint8Array, mimeType: string): Promise<string> {
    let binary = '';
    const len = bytes.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Create FileRef object
   */
  private static createFileRef(asset: FileAsset, dataUrl?: string): FileRef {
    return {
      assetId: asset.id,
      sha256: asset.sha256,
      role: 'cover', // Default role
      mime: asset.mime,
      width: asset.width,
      height: asset.height,
      remoteId: asset.remote_id,
      remoteUrl: asset.remote_url,
      localPath: asset.local_path,
      // Additional properties for extended use
      dataUrl,
      url: asset.remote_url || dataUrl,
      size: asset.size_bytes
    } as any; // Type assertion to handle extended properties
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  }

  /**
   * Get image dimensions
   */
  private static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Load asset by ID for display
   */
  static async loadAssetForDisplay(assetId: string): Promise<string | undefined> {
    try {
      const result = await invoke<any>('app_get_file_asset_by_id', { assetId });
      if (!result) return undefined;
      
      const asset: FileAsset = {
        id: result.file_asset_id,
        sha256: result.sha256,
        ext: result.ext,
        mime: result.mime,
        size_bytes: result.size_bytes,
        width: result.width,
        height: result.height,
        local_path: result.local_path,
        remote_id: result.remote_id,
        remote_url: result.remote_url,
        status: result.status,
        created_at: result.created_at,
        updated_at: result.updated_at,
      };

      // Prefer remote URL if available
      if (asset.remote_url) {
        return asset.remote_url;
      }

      // Use local filesystem with file:// URL if available
      if (asset.local_path) {
        try {
          // Get the full filesystem path from Tauri
          const fullPath = await invoke<string>('app_get_asset_file_path', { 
            relativePath: asset.local_path 
          });
          
          // Convert to proper file:// URL for WebView access
          return convertFileSrc(fullPath);
        } catch (error) {
          await appLog.warn('simple-asset', 'Failed to get asset file path, falling back to data URL', { 
            assetId, 
            localPath: asset.local_path, 
            error 
          });
          
          // Fallback to data URL if file path doesn't work
          return this.convertToDataUrl(asset, asset.mime || 'image/jpeg');
        }
      }

      return undefined;
    } catch (error) {
      await appLog.error('simple-asset', 'Failed to load asset for display', { assetId, error });
      return undefined;
    }
  }

  /**
   * Update asset with remote URL after sync
   */
  static async updateAssetWithRemoteUrl(assetId: string, remoteUrl: string, remoteId?: string): Promise<void> {
    try {
      // Get current asset
      const result = await invoke<any>('app_get_file_asset_by_id', { assetId });
      if (!result) {
        throw new Error(`Asset not found: ${assetId}`);
      }

      // Update with remote info
      const updatedAsset = {
        file_asset_id: result.file_asset_id,
        sha256: result.sha256,
        ext: result.ext,
        mime: result.mime,
        size_bytes: result.size_bytes,
        width: result.width,
        height: result.height,
        local_path: result.local_path,
        remote_id: remoteId || result.remote_id,
        remote_url: remoteUrl,
        status: 'uploaded',
        created_at: result.created_at,
        updated_at: new Date().toISOString(),
      };

      await invoke('app_update_file_asset', { assetId, fileAsset: updatedAsset });
      await appLog.info('simple-asset', 'Asset updated with remote URL', { assetId, remoteUrl });
    } catch (error) {
      await appLog.error('simple-asset', 'Failed to update asset with remote URL', { 
        assetId, 
        remoteUrl, 
        error 
      });
      throw error;
    }
  }
}
