/**
 * Asset Sync Service
 * 
 * Handles background synchronization of local assets to cloud storage.
 * Works alongside book sync to ensure all assets are uploaded.
 * Uses the same architecture as SyncEngine for consistency.
 */

import { fetch } from '@tauri-apps/plugin-http';
import { AssetService } from './AssetService';
import { SimpleAssetService } from './SimpleAssetService';
import { AssetDB } from './AssetDB';
import { useAuthStore } from '../auth/useAuthStore';
import { appLog } from '../auth/fileLogger';
import { readFile, writeFile, BaseDirectory, mkdir } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';

interface UploadResponse {
  id: string;
  url: string;
  mime: string;
  width?: number;
  height?: number;
}

interface CloudAsset {
  id: string;
  url: string;
  mime: string;
  size?: number;
  tags?: string[];
  description?: string;
}

export class AssetSyncService {
  private static isRunning = false;
  private static syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start automatic asset synchronization
   */
  static startAutoSync() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          await this.syncPendingAssets();
        } catch (error) {
          await appLog.error('asset-sync', 'Auto sync failed', { error });
        }
      }
    }, 30000); // Sync every 30 seconds when online

    appLog.info('asset-sync', 'Auto sync started');
  }

  /**
   * Stop automatic asset synchronization
   */
  static stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    appLog.info('asset-sync', 'Auto sync stopped');
  }

  /**
   * Manually sync all pending assets
   */
  static async syncPendingAssets(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync: offline');
    }

    try {
      const pendingAssets = await AssetService.getPendingAssets();
      
      if (pendingAssets.length === 0) {
        await appLog.info('asset-sync', 'No pending assets to sync');
        return;
      }

      await appLog.info('asset-sync', 'Starting asset sync', { count: pendingAssets.length });

      for (const asset of pendingAssets) {
        try {
          await this.syncSingleAsset(asset.id);
        } catch (error) {
          await appLog.error('asset-sync', 'Failed to sync asset', { 
            assetId: asset.id, 
            error 
          });
          
          // Mark as failed
          await AssetDB.markAssetFailed(asset.id);
        }
      }

      await appLog.success('asset-sync', 'Asset sync completed', { 
        processed: pendingAssets.length 
      });

    } catch (error) {
      await appLog.error('asset-sync', 'Asset sync failed', { error });
      throw error;
    }
  }

  /**
   * Sync pending assets for a specific book
   */
  static async syncBookAssets(bookId: string): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync: offline');
    }

    try {
      await appLog.info('asset-sync', 'Starting syncBookAssets', { bookId });
      
      const pendingAssets = await AssetService.getPendingAssets();
      
      await appLog.info('asset-sync', 'Found pending assets', { 
        bookId, 
        totalPending: pendingAssets.length,
        assetPaths: pendingAssets.map(a => ({ id: a.id, path: a.local_path }))
      });
      
      // Filter assets for this specific book
      // Note: bookId might be different format, so check both ways
      const bookAssets = pendingAssets.filter(asset => {
        const hasBookId = asset.local_path?.includes(`books/${bookId}/`);
        const hasBookIdSlashes = asset.local_path?.includes(bookId);
        return hasBookId || hasBookIdSlashes;
      });
      
      await appLog.info('asset-sync', 'Filtered book assets', { 
        bookId, 
        bookAssets: bookAssets.length,
        matchedAssets: bookAssets.map(a => ({ id: a.id, path: a.local_path }))
      });
      
      if (bookAssets.length === 0) {
        await appLog.info('asset-sync', 'No pending assets to sync for book', { bookId });
        return;
      }

      await appLog.info('asset-sync', 'Starting book asset sync', { 
        bookId, 
        count: bookAssets.length 
      });

      for (const asset of bookAssets) {
        try {
          await this.syncSingleAsset(asset.id);
        } catch (error) {
          await appLog.error('asset-sync', 'Failed to sync book asset', { 
            bookId,
            assetId: asset.id, 
            error 
          });
          
          // Mark as failed
          await AssetDB.markAssetFailed(asset.id);
        }
      }

      await appLog.success('asset-sync', 'Book asset sync completed', { 
        bookId,
        processed: bookAssets.length 
      });

    } catch (error) {
      await appLog.error('asset-sync', 'Book asset sync failed', { bookId, error });
      throw error;
    }
  }

  /**
   * Sync a single asset to cloud
   */
  private static async syncSingleAsset(assetId: string): Promise<void> {
    const asset = await AssetDB.getAssetById(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    if (!asset.local_path) {
      throw new Error(`Asset has no local path: ${assetId}`);
    }

    try {
      // Read file from local storage
      const fileBytes = await readFile(asset.local_path, { 
        baseDir: BaseDirectory.AppConfig 
      });

      // Create FormData for upload (matching SyncEngine pattern)
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBytes)], { type: asset.mime || 'application/octet-stream' });
      formData.append('file', blob, `${asset.sha256}${asset.ext}`);
      
      // Add metadata
      formData.append('tags', JSON.stringify(['cover'])); // Default tag for covers
      formData.append('description', 'Book cover image');
      formData.append('assetId', assetId);

      // Determine bookId from asset path (books/{bookId}/files/...)
      const bookId = this.extractBookIdFromPath(asset.local_path);
      if (!bookId) {
        throw new Error(`Cannot determine bookId from asset path: ${asset.local_path}`);
      }

      // Upload to server using SyncEngine pattern
      const uploadResult = await this.uploadToServer(bookId, formData);

      // Update asset with remote URL using SimpleAssetService
      await SimpleAssetService.updateAssetWithRemoteUrl(
        asset.id,
        uploadResult.url,
        uploadResult.id
      );

      await appLog.success('asset-sync', 'Asset uploaded to cloud', { 
        assetId: asset.id,
        remoteUrl: uploadResult.url,
        remoteId: uploadResult.id
      });

    } catch (error) {
      await appLog.error('asset-sync', 'Failed to upload asset', { 
        assetId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Upload file to server using same pattern as SyncEngine
   */
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
    
    await appLog.info('asset-sync', 'Server Response for Asset Upload', { 
      status: response.status,
      ok: response.ok 
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Asset upload failed: ${response.status} ${errorText}`);
    }
   
    return await response.json();
  }

  /**
   * Extract bookId from asset local path
   * Path format: books/{bookId}/files/{sha256}/{filename}
   */
  private static extractBookIdFromPath(localPath: string): string | null {
    const match = localPath.match(/books\/([^\/]+)\/files\//);
    return match ? match[1] : null;
  }

  /**
   * Mark an asset for sync (changes status to pending_upload)
   */
  static async markAssetForSync(assetId: string): Promise<void> {
    await AssetDB.updateAsset(assetId, { status: 'pending_upload' });
    await appLog.info('asset-sync', 'Asset marked for sync', { assetId });
  }

  /**
   * Get sync status for all assets
   */
  static async getSyncStatus() {
    const pendingAssets = await AssetService.getPendingAssets();
    const failedAssets = await AssetService.getFailedAssets();
    
    return {
      pendingCount: pendingAssets.length,
      failedCount: failedAssets.length,
      isOnline: navigator.onLine,
      isAutoSyncRunning: this.isRunning
    };
  }

  /**
   * Download cloud assets for a book and save them locally
   * Called when pulling a book from cloud to ensure we have all its assets
   */
  static async downloadBookAssets(bookId: string): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot download assets: offline');
    }

    try {
      await appLog.info('asset-sync', 'Starting downloadBookAssets', { bookId });

      // Get cloud assets for this book
      const cloudAssets = await this.getCloudAssets(bookId);
      
      await appLog.info('asset-sync', 'Found cloud assets', { 
        bookId, 
        cloudAssetCount: cloudAssets.length,
        cloudAssets: cloudAssets.map(a => ({ id: a.id, url: a.url, mime: a.mime }))
      });

      if (cloudAssets.length === 0) {
        await appLog.info('asset-sync', 'No cloud assets to download for book', { bookId });
        return;
      }

      // Check which assets we don't have locally or need to update
      const assetsToDownload = [];
      for (const cloudAsset of cloudAssets) {
        // Search for existing asset by remote_id
        // Since there's no direct getAssetByRemoteId, we'll check during sync
        // For now, add all cloud assets that might need downloading
        assetsToDownload.push(cloudAsset);
        await appLog.info('asset-sync', 'Will check/download cloud asset', { 
          cloudAssetId: cloudAsset.id, 
          bookId 
        });
      }

      await appLog.info('asset-sync', 'Assets to download', { 
        bookId, 
        downloadCount: assetsToDownload.length 
      });

      // Download each asset
      for (const cloudAsset of assetsToDownload) {
        try {
          await this.downloadSingleAsset(cloudAsset, bookId);
        } catch (error) {
          await appLog.error('asset-sync', 'Failed to download asset', { 
            bookId,
            cloudAssetId: cloudAsset.id,
            error 
          });
          // Continue with other assets
        }
      }

      await appLog.success('asset-sync', 'Book asset download completed', { 
        bookId,
        processed: assetsToDownload.length 
      });

    } catch (error) {
      await appLog.error('asset-sync', 'Book asset download failed', { bookId, error });
      throw error;
    }
  }

  /**
   * Get cloud assets for a book from the API
   */
  private static async getCloudAssets(bookId: string): Promise<CloudAsset[]> {
    const authStore = useAuthStore.getState();
    const token = await authStore.ensureAccessToken();

    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api';

    const response = await fetch(`${baseUrl}/books/${bookId}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    await appLog.info('asset-sync', 'Cloud assets API response', { 
      bookId,
      status: response.status,
      ok: response.ok 
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get cloud assets: ${response.status} ${errorText}`);
    }

    const cloudAssets = await response.json();
    return Array.isArray(cloudAssets) ? cloudAssets : [];
  }

  /**
   * Download a single cloud asset and save it locally
   */
  private static async downloadSingleAsset(cloudAsset: CloudAsset, bookId: string): Promise<void> {
    try {
      await appLog.info('asset-sync', 'Downloading cloud asset', { 
        cloudAssetId: cloudAsset.id,
        url: cloudAsset.url,
        bookId 
      });

      // Download the file
      const response = await fetch(cloudAsset.url);
      if (!response.ok) {
        throw new Error(`Failed to download asset: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);

      // Generate hash for integrity check
      const hashResult = await invoke<{sha256: string}>('compute_sha256_bytes', { 
        bytes: Array.from(fileBytes) 
      });
      const hash = hashResult.sha256;
      
      // Determine file extension from mime type or URL
      const ext = this.getExtensionFromMime(cloudAsset.mime) || this.getExtensionFromUrl(cloudAsset.url) || '.bin';
      
      // Create local path (same pattern as upload)
      const relativePath = `books/${bookId}/files/${hash}`;
      const fileName = `${cloudAsset.id}${ext}`;
      const fullRelativePath = `${relativePath}/${fileName}`;

      // Save file to local storage using Tauri file operations
      await invoke('write_file_with_dirs', { 
        relativePath: fullRelativePath, 
        bytes: Array.from(fileBytes) 
      });

      // Check if asset already exists in database by checking for existing asset with same remote_id
      // We'll use the hash to check if we already have this asset
      let localAsset = await AssetDB.getAssetBySha256(hash);
      
      if (localAsset && localAsset.remote_id === cloudAsset.id) {
        // Update existing asset
        await AssetDB.updateAsset(localAsset.id, {
          local_path: fullRelativePath,
          remote_url: cloudAsset.url,
          remote_id: cloudAsset.id,
          sha256: hash,
          ext: ext,
          mime: cloudAsset.mime,
          size_bytes: fileBytes.length,
          status: 'uploaded',
          updated_at: new Date().toISOString()
        });

        await appLog.success('asset-sync', 'Updated existing asset with cloud data', { 
          localAssetId: localAsset.id,
          cloudAssetId: cloudAsset.id,
          localPath: fullRelativePath
        });
      } else {
        // Create new asset record
        const assetId = await invoke<string>('generate_nanoid');
        await AssetDB.createAsset({
          id: assetId,
          local_path: fullRelativePath,
          remote_url: cloudAsset.url,
          remote_id: cloudAsset.id,
          sha256: hash,
          ext: ext,
          mime: cloudAsset.mime,
          size_bytes: fileBytes.length,
          status: 'uploaded'
        });

        await appLog.success('asset-sync', 'Created new asset from cloud data', { 
          localAssetId: assetId,
          cloudAssetId: cloudAsset.id,
          localPath: fullRelativePath
        });
      }

    } catch (error) {
      await appLog.error('asset-sync', 'Failed to download single asset', { 
        cloudAssetId: cloudAsset.id,
        bookId,
        error 
      });
      throw error;
    }
  }

  /**
   * Get file extension from MIME type
   */
  private static getExtensionFromMime(mime: string): string | null {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };
    return mimeToExt[mime] || null;
  }

  /**
   * Get file extension from URL
   */
  private static getExtensionFromUrl(url: string): string | null {
    try {
      const pathname = new URL(url).pathname;
      const lastDot = pathname.lastIndexOf('.');
      return lastDot !== -1 ? pathname.substring(lastDot) : null;
    } catch {
      return null;
    }
  }
}
