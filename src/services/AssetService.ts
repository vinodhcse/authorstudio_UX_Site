// Asset Service - High-level API for asset management
import { invoke } from '@tauri-apps/api/core';
import { writeFile, mkdir, readFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { appConfigDir } from '@tauri-apps/api/path';
import { AssetDB } from './AssetDB';
import { FileRef, ImportContext, FileAsset, AssetImportResult } from '../types';
import { appLog } from '../auth/fileLogger';

// Asset Service Configuration
const ASSET_CONFIG = {
  MAX_UPLOAD_MB: 25,
  ALLOWED_MIME_TYPES: [
    'image/png',
    'image/jpeg', 
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'application/pdf'
  ],
  SYNC_INTERVAL_MS: 30_000,
  UPLOAD_CONCURRENCY: 2
};

/**
 * Check if the app is online
 */
const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

interface ComputeHashResult {
  sha256: string;
}

interface ImageProbeResult {
  width: number;
  height: number;
  mime: string;
}

export class AssetService {
  /**
   * Import a local file into the asset system
   */
  static async importLocalFile(file: File, context: ImportContext): Promise<AssetImportResult> {
    try {
      await appLog.info('asset-service', 'Starting file import', { 
        fileName: file.name, 
        size: file.size,
        entityType: context.entityType,
        entityId: context.entityId,
        role: context.role 
      });

      // Validate file size
      const maxBytes = ASSET_CONFIG.MAX_UPLOAD_MB * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error(`File size exceeds ${ASSET_CONFIG.MAX_UPLOAD_MB}MB limit`);
      }

      // Validate MIME type
      if (!ASSET_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      // Convert File to bytes for processing
      const fileBytes = new Uint8Array(await file.arrayBuffer());

      // Compute SHA256 hash
      const hashResult = await invoke<ComputeHashResult>('compute_sha256_bytes', { 
        bytes: Array.from(fileBytes) 
      });
      const sha256 = hashResult.sha256;

      await appLog.info('asset-service', 'File hash computed', { sha256 });

      // Check if asset already exists
      const existingAsset = await AssetDB.getAssetBySha256(sha256);
      if (existingAsset) {
        await appLog.info('asset-service', 'Asset already exists, reusing', { assetId: existingAsset.id });
        
        // Create/update link to this asset
        await AssetDB.upsertLink({
          asset_id: existingAsset.id,
          entity_type: context.entityType,
          entity_id: context.entityId,
          role: context.role,
          sort_order: 0,
          tags: context.tags ? JSON.stringify(context.tags) : undefined,
          description: context.description
        });

        // If asset hasn't been uploaded yet, mark it for upload
        if (existingAsset.status === 'pending_upload' || existingAsset.status === 'failed') {
          await appLog.info('asset-service', 'Existing asset needs upload', { 
            assetId: existingAsset.id, 
            status: existingAsset.status 
          });
          // Asset will be picked up by next upload cycle
        } else if (!existingAsset.remote_url) {
          // Asset exists but has no remote URL - might have failed upload
          await AssetDB.updateAsset(existingAsset.id, { status: 'pending_upload' });
          await appLog.info('asset-service', 'Marked existing asset for re-upload', { 
            assetId: existingAsset.id 
          });
        }

        return {
          ...this.assetToFileRef(existingAsset, context.role),
          wasReused: true,
          uploadStatus: existingAsset.remote_url ? 'uploaded' : 
                      existingAsset.status === 'pending_upload' ? 'pending_upload' : 
                      existingAsset.status === 'failed' ? 'failed' : 'local_only'
        };
      }

      // Get file extension from MIME type
      const ext = await invoke<string>('ext_from_mime', { mime: file.type });

      // Probe image if it's an image file
      let width: number | undefined;
      let height: number | undefined;
      if (file.type.startsWith('image/')) {
        try {
          const probeResult = await invoke<ImageProbeResult>('probe_image_bytes', {
            bytes: Array.from(fileBytes),
            extension: ext
          });
          width = probeResult.width;
          height = probeResult.height;
        } catch (error) {
          await appLog.warn('asset-service', 'Failed to probe image', { error });
        }
      }

      // Write file to local cache
      let localPath: string;
      try {
        localPath = await this.writeToLocalCache(fileBytes, context.bookId, sha256, ext, file.name);
        await appLog.info('asset-service', 'File written to local cache', { localPath });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await appLog.error('asset-service', 'File import failed', { error: errorMessage, context });
        throw error;
      }

      // Generate asset ID
      const assetId = await invoke<string>('generate_nanoid');

      // Create asset record
      const asset: Omit<FileAsset, 'created_at' | 'updated_at'> = {
        id: assetId,
        sha256,
        ext,
        mime: file.type,
        size_bytes: file.size,
        width,
        height,
        local_path: localPath,
        status: 'pending_upload'
      };

      await AssetDB.createAsset(asset);

      // Create link to entity
      const linkId = await AssetDB.upsertLink({
        asset_id: assetId,
        entity_type: context.entityType,
        entity_id: context.entityId,
        role: context.role,
        sort_order: 0,
        tags: context.tags ? JSON.stringify(context.tags) : undefined,
        description: context.description
      });

      await appLog.success('asset-service', 'File import completed', { assetId, linkId });

      return {
        assetId,
        sha256,
        role: context.role,
        mime: file.type,
        width,
        height,
        localPath,
        wasReused: false,
        uploadStatus: 'pending_upload'
      };

    } catch (error) {
      await appLog.error('asset-service', 'File import failed', error);
      throw error;
    }
  }

  /**
   * Get FileRef for an asset ID
   */
  static async getFileRef(assetId: string): Promise<FileRef | null> {
    const asset = await AssetDB.getAssetById(assetId);
    if (!asset) return null;

    const links = await AssetDB.getLinksByAsset(assetId);
    const role = links.length > 0 ? links[0].role : 'attachment';

    return this.assetToFileRef(asset, role);
  }

  /**
   * Resolve FileRef to a usable source URL
   */
  static resolveSrc(fileRef: FileRef): string | undefined {
    // When offline, skip remote URLs and force local resolution
    if (!isOnline()) {
      return undefined; // Force use of getLocalImageDataUrl
    }

    // When online, prefer remote URL if available
    if (fileRef.remoteUrl) {
      return fileRef.remoteUrl;
    }

    // For local files, return undefined to trigger local loading
    return undefined;
  }

  /**
   * Get image as data URL from local file
   */
  static async getLocalImageDataUrl(fileRef: FileRef): Promise<string | undefined> {
    // When offline, always use local files even if remote URL exists
    if (!isOnline()) {
      if (fileRef.localPath) {
        try {
          // Read file from local storage as bytes
          const relativePath = fileRef.localPath.split('/books/')[1]; // Extract relative path
          if (relativePath) {
              const fileBytes = await readFile(`books/${relativePath}`, { baseDir: BaseDirectory.AppConfig });
              await appLog.info('asset-service', 'Reading local image bytes', { relativePath, bytesLength: fileBytes.length });
            
            // Convert to base64 data URL using proper method for large files
            let binary = '';
            const len = fileBytes.length;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(fileBytes[i]);
            }
            const base64 = btoa(binary);
            const mimeType = fileRef.mime || 'image/jpeg';
            return `data:${mimeType};base64,${base64}`;
          }
        } catch (error) {
          await appLog.error('asset-service', 'Failed to load local image in offline mode', { 
            localPath: fileRef.localPath, 
            error 
          });
        }
      }
      return undefined;
    }

    // When online, prefer remote URL if available
    if (fileRef.remoteUrl) {
      return fileRef.remoteUrl;
    }

    if (fileRef.localPath) {
      try {
        // Read file from local storage as bytes
        const relativePath = fileRef.localPath.split('/books/')[1]; // Extract relative path
        if (relativePath) {
          const fileBytes = await readFile(`books/${relativePath}`, { baseDir: BaseDirectory.AppConfig });
          await appLog.info('asset-service', 'Reading local image bytes (online flow)', { relativePath, bytesLength: fileBytes.length });
          
          // Convert to base64 data URL using proper method for large files
          let binary = '';
          const len = fileBytes.length;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(fileBytes[i]);
          }
          const base64 = btoa(binary);
          const mimeType = fileRef.mime || 'image/jpeg';
          return `data:${mimeType};base64,${base64}`;
        }
      } catch (error) {
        await appLog.warn('asset-service', 'Failed to load local image', { error, localPath: fileRef.localPath });
      }
    }

    return undefined;
  }

  /**
   * Link an existing asset to an entity
   */
  static async linkAsset(assetId: string, entityType: string, entityId: string, role: string, sortOrder: number = 0): Promise<void> {
    await AssetDB.upsertLink({
      asset_id: assetId,
      entity_type: entityType as any,
      entity_id: entityId,
      role: role as any,
      sort_order: sortOrder
    });
    
    await appLog.info('asset-service', 'Asset linked', { assetId, entityType, entityId, role });
  }

  /**
   * Unlink an asset from an entity
   */
  static async unlinkAsset(assetId: string, entityType: string, entityId: string, role: string): Promise<void> {
    await AssetDB.deleteLinksByEntityAndRole(entityType as any, entityId, role as any);
    await appLog.info('asset-service', 'Asset unlinked', { assetId, entityType, entityId, role });
  }

  /**
   * Replace an asset (unlink old, link new)
   */
  static async replaceAsset(oldAssetId: string, newAssetId: string, entityType: string, entityId: string, role: string): Promise<void> {
    // Unlink old asset
    await this.unlinkAsset(oldAssetId, entityType, entityId, role);
    
    // Link new asset
    await this.linkAsset(newAssetId, entityType, entityId, role);
    
    await appLog.info('asset-service', 'Asset replaced', { oldAssetId, newAssetId, entityType, entityId, role });
  }

  /**
   * Force re-upload of an existing asset
   */
  async forceUploadAsset(assetId: string): Promise<void> {
    await AssetDB.updateAsset(assetId, { 
      status: 'pending_upload',
      remote_url: undefined // Clear remote URL to force fresh upload
    });
    
    await appLog.info('asset-service', 'Marked asset for forced re-upload', { assetId });
  }

  /**
   * Get all assets for an entity
   */
  static async getEntityAssets(entityType: string, entityId: string): Promise<FileRef[]> {
    const assetsWithLinks = await AssetDB.getAssetsWithLinks(entityType as any, entityId);
    return assetsWithLinks.map(item => this.assetToFileRef(item, item.link.role));
  }

  /**
   * Get assets for an entity by role
   */
  static async getEntityAssetsByRole(entityType: string, entityId: string, role: string): Promise<FileRef[]> {
    const assetsWithLinks = await AssetDB.getAssetWithLinksByRole(entityType as any, entityId, role as any);
    return assetsWithLinks.map(item => this.assetToFileRef(item, item.link.role));
  }

  /**
   * Get the cover image for a book
   */
  static async getBookCover(bookId: string): Promise<FileRef | null> {
    const covers = await this.getEntityAssetsByRole('book', bookId, 'cover');
    return covers.length > 0 ? covers[0] : null;
  }

  /**
   * Set the cover image for a book
   */
  static async setBookCover(bookId: string, file: File): Promise<FileRef> {
    // Import the new cover
    const importResult = await this.importLocalFile(file, {
      entityType: 'book',
      entityId: bookId,
      role: 'cover',
      bookId: bookId,
      tags: ['cover'],
      description: 'Book cover image'
    });

    // Return as FileRef (the core properties)
    const fileRef: FileRef = {
      assetId: importResult.assetId,
      sha256: importResult.sha256,
      role: importResult.role,
      mime: importResult.mime,
      width: importResult.width,
      height: importResult.height,
      remoteId: importResult.remoteId,
      remoteUrl: importResult.remoteUrl,
      localPath: importResult.localPath
    };

    // The import process handles unlinking any existing cover due to the unique constraint
    return fileRef;
  }

  /**
   * Get assets pending upload
   */
  static async getPendingAssets(): Promise<FileAsset[]> {
    return await AssetDB.getAssetsByStatus('pending_upload');
  }

  /**
   * Get failed assets
   */
  static async getFailedAssets(): Promise<FileAsset[]> {
    return await AssetDB.getAssetsByStatus('failed');
  }

  /**
   * Clean up orphaned assets
   */
  static async cleanupOrphanedAssets(): Promise<number> {
    return await AssetDB.deleteOrphanedAssets();
  }

  // Private helper methods

  private static async writeToLocalCache(bytes: Uint8Array, bookId: string, sha256: string, ext: string, originalFileName?: string): Promise<string> {
    // Use AppConfig directory which has better permission support
    const relativePath = `books/${bookId}/files/${sha256}`;
    
    // Use original filename if provided, otherwise fallback to original.ext
    const fileName = originalFileName || `original.${ext}`;
    const relativeFilePath = `${relativePath}/${fileName}`;

    await appLog.info('asset-service', 'Writing to config dir path', { relativePath, fileName, relativeFilePath, originalFileName });

    // Ensure directory exists using BaseDirectory.AppConfig
    try {
      await mkdir(relativePath, { baseDir: BaseDirectory.AppConfig, recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
      await appLog.info('asset-service', 'Directory already exists or creation skipped', { relativePath });
    }

    // Write file using BaseDirectory.AppConfig approach
    try {
      await writeFile(relativeFilePath, bytes, { baseDir: BaseDirectory.AppConfig });
      
      // Get the full path for return value (needed for local file references)
      const appDataDir = await appConfigDir();
      const fullPath = `${appDataDir}/${relativeFilePath}`.replace(/\\/g, '/');
      
      await appLog.info('asset-service', 'File written successfully using AppConfig', { relativeFilePath, fullPath });
      return fullPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await appLog.error('asset-service', 'File write failed with AppConfig', { relativeFilePath, error: errorMessage });
      throw new Error(`Failed to write file to local cache: ${errorMessage}`);
    }
  }

  private static assetToFileRef(asset: FileAsset, role: string): FileRef {
    return {
      assetId: asset.id,
      sha256: asset.sha256,
      role: role as any,
      mime: asset.mime,
      width: asset.width,
      height: asset.height,
      remoteId: asset.remote_id,
      remoteUrl: asset.remote_url,
      localPath: asset.local_path
    };
  }
}

export { ASSET_CONFIG };
