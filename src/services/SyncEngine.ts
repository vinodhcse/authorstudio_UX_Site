// Sync Engine - Handles uploading pending assets and downloading remote assets
import { fetch } from '@tauri-apps/plugin-http';
import { writeFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { appConfigDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import { AssetDB } from './AssetDB';
import { FileAsset, FileRef } from '../types';
import { appLog } from '../auth/fileLogger';
import { useAuthStore } from '../auth/useAuthStore';

interface UploadResponse {
  id: string;
  url: string;
  mime: string;
  width?: number;
  height?: number;
}

export class SyncEngine {
  private static isUploading = false;
  private static uploadQueue: Set<string> = new Set();

  /**
   * Upload all pending assets for a book
   */
  static async uploadPending(bookId: string): Promise<void> {
    if (this.isUploading) {
      await appLog.info('sync-engine', 'Upload already in progress, skipping');
      return;
    }

    this.isUploading = true;

    try {
      await appLog.info('sync-engine', 'Starting upload of pending assets', { bookId });

      const pendingAssets = await AssetDB.getAssetsByStatus('pending_upload');
      const bookAssets = pendingAssets.filter(asset => 
        asset.local_path?.includes(`/books/${bookId}/`)
      );

      if (bookAssets.length === 0) {
        await appLog.info('sync-engine', 'No pending assets to upload', { bookId });
        return;
      }

      await appLog.info('sync-engine', 'Found pending assets', { 
        bookId, 
        count: bookAssets.length 
      });

      // Process uploads with concurrency limit
      const concurrency = 2;
      for (let i = 0; i < bookAssets.length; i += concurrency) {
        const batch = bookAssets.slice(i, i + concurrency);
        const uploadPromises = batch.map(asset => this.uploadAsset(asset, bookId));
        await Promise.allSettled(uploadPromises);
      }

      await appLog.success('sync-engine', 'Upload batch completed', { bookId });

    } catch (error) {
      await appLog.error('sync-engine', 'Upload failed', error);
      throw error;
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Upload a single asset
   */
  private static async uploadAsset(asset: FileAsset, bookId: string): Promise<void> {
    if (this.uploadQueue.has(asset.id)) {
      await appLog.info('sync-engine', 'Asset already in upload queue', { assetId: asset.id });
      return;
    }

    this.uploadQueue.add(asset.id);

    try {
      await appLog.info('sync-engine', 'Uploading asset', { 
        assetId: asset.id, 
        sha256: asset.sha256,
        size: asset.size_bytes 
      });

      // Read file content
      if (!asset.local_path) {
        throw new Error('Asset has no local path');
      }

      const fileContent = await this.readFileAsBytes(asset.local_path);

      // Get asset links to determine tags and description
      const links = await AssetDB.getLinksByAsset(asset.id);
      const primaryLink = links[0]; // Use first link for metadata
      
      const tags = primaryLink?.tags ? JSON.parse(primaryLink.tags) : [];
      const description = primaryLink?.description || '';

      // Create form data
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileContent)], { type: asset.mime });
      formData.append('file', blob, `${asset.sha256}.${asset.ext}`);
      formData.append('tags', JSON.stringify(tags));
      formData.append('description', description);

      // Upload via API client
      const response = await this.uploadToServer(bookId, formData);
      await appLog.info('sync-engine', 'File Upload Server Response', response);
      // Update asset with remote info
      await AssetDB.markAssetUploaded(asset.id, response.id, response.url);

      await appLog.success('sync-engine', 'Asset uploaded successfully', { 
        assetId: asset.id,
        remoteId: response.id,
        remoteUrl: response.url
      });

    } catch (error) {
      await appLog.error('sync-engine', 'Asset upload failed', { assetId: asset.id, error });
      
      // Mark as failed with exponential backoff
      await AssetDB.markAssetFailed(asset.id);
      
      // TODO: Implement retry logic with exponential backoff
      
    } finally {
      this.uploadQueue.delete(asset.id);
    }
  }

  /**
   * Cache a remote asset locally if missing
   */
  static async cacheRemoteIfMissing(fileRef: FileRef, bookId: string): Promise<FileRef> {
    // If already cached locally, return as-is
    if (fileRef.localPath) {
      return fileRef;
    }

    // If no remote URL, can't cache
    if (!fileRef.remoteUrl) {
      return fileRef;
    }

    try {
      await appLog.info('sync-engine', 'Caching remote asset', { 
        assetId: fileRef.assetId,
        remoteUrl: fileRef.remoteUrl 
      });

      // Download the file
      const response = await fetch(fileRef.remoteUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const fileContent = new Uint8Array(await response.arrayBuffer());

      // Get file extension
      const ext = await invoke<string>('ext_from_mime', { 
        mime: fileRef.mime || 'application/octet-stream' 
      });

      // Write to local cache
      const localPath = await this.writeToLocalCache(fileContent, bookId, fileRef.sha256, ext);

      // Update asset record with local path
      await AssetDB.updateAsset(fileRef.assetId, { local_path: localPath });

      await appLog.success('sync-engine', 'Remote asset cached locally', { 
        assetId: fileRef.assetId,
        localPath 
      });

      return {
        ...fileRef,
        localPath
      };

    } catch (error) {
      await appLog.error('sync-engine', 'Failed to cache remote asset', { 
        assetId: fileRef.assetId,
        error 
      });
      
      // Return original fileRef, will fall back to remote URL
      return fileRef;
    }
  }

  /**
   * Start periodic sync
   */
  static startPeriodicSync(bookId: string, intervalMs: number = 30000): () => void {
    const intervalId = setInterval(async () => {
      try {
        if (navigator.onLine) {
          await this.uploadPending(bookId);
        }
      } catch (error) {
        await appLog.warn('sync-engine', 'Periodic sync failed', error);
      }
    }, intervalMs);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Manual sync trigger
   */
  static async syncNow(bookId: string): Promise<void> {
    if (!navigator.onLine) {
      await appLog.warn('sync-engine', 'Cannot sync while offline');
      return;
    }

    await this.uploadPending(bookId);
  }

  // Private helper methods

  private static async uploadToServer(bookId: string, formData: FormData): Promise<UploadResponse> {
    const authStore = useAuthStore.getState();
    const token = await authStore.ensureAccessToken();

    // Use the same base URL as the auth API client
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api';

    const response = await fetch(`${baseUrl}/books/${bookId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    await appLog.info('sync-engine', 'Server Response for File Uplaod', response);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }
   
    return await response.json();
  }

  private static async readFileAsBytes(filePath: string): Promise<Uint8Array> {
    // Use Tauri's readFile from fs plugin
    const { readFile } = await import('@tauri-apps/plugin-fs');
    return await readFile(filePath);
  }

  private static async writeToLocalCache(bytes: Uint8Array, bookId: string, sha256: string, ext: string): Promise<string> {
    // Use AppConfig directory for better permission support
    const relativePath = `books/${bookId}/files/${sha256}`;
    const fileName = `original.${ext}`;
    const relativeFilePath = `${relativePath}/${fileName}`;

    // Ensure directory exists using BaseDirectory.AppConfig
    try {
      await mkdir(relativePath, { baseDir: BaseDirectory.AppConfig, recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Write file using BaseDirectory.AppConfig approach
    await writeFile(relativeFilePath, bytes, { baseDir: BaseDirectory.AppConfig });
    
    // Get the full path for return value (needed for local file references)
    const appDataDir = await appConfigDir();
    const fullPath = `${appDataDir}/${relativeFilePath}`.replace(/\\/g, '/');
    
    return fullPath;
  }
}
