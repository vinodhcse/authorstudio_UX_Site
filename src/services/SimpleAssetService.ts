import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { readFile, writeFile, BaseDirectory, mkdir } from '@tauri-apps/plugin-fs';
import { getFileAssetBySha256, createFileAsset, getFileAssetById, updateFileAsset } from '../data/dexieDal';
import { FileAsset, FileRef, AssetStatus } from '../types';
import { appLog } from '../auth/fileLogger';

export interface SimpleCoverUploadResult {
  assetId: string;
  localPath: string;
  dataUrl: string;
  fileRef: FileRef;
}

export class SimpleAssetService {
  static async uploadCover(file: File, bookId: string): Promise<SimpleCoverUploadResult> {
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const hashResult = await invoke<{sha256: string}>('compute_sha256_bytes', { bytes: Array.from(fileBytes) });
    const sha256 = hashResult.sha256;
    const existingAsset = await getFileAssetBySha256(sha256);
    if (existingAsset) {
      let displayUrl: string;
      if (existingAsset.remote_url) {
        displayUrl = existingAsset.remote_url;
      } else if (existingAsset.local_path) {
        displayUrl = await SimpleAssetService.convertToDataUrl(existingAsset, file.type);
      } else {
        displayUrl = await SimpleAssetService.convertToDataUrl(existingAsset, file.type);
      }
      const fileRef = SimpleAssetService.createFileRef(existingAsset, displayUrl);
      return {
        assetId: existingAsset.id,
        localPath: existingAsset.local_path || '',
        dataUrl: displayUrl,
        fileRef
      };
    }
    const assetId = await invoke<string>('generate_nanoid');
    const ext = SimpleAssetService.getFileExtension(file.name);
    const relativePath = `books/${bookId}/files/${sha256}`;
    const fileName = `${assetId}${ext}`;
    const fullRelativePath = `${relativePath}/${fileName}`;
    await mkdir(relativePath, { baseDir: BaseDirectory.AppConfig, recursive: true });
    await writeFile(fullRelativePath, fileBytes, { baseDir: BaseDirectory.AppConfig });
    const { width, height } = await SimpleAssetService.getImageDimensions(file);
    let displayUrl: string;
    try {
      displayUrl = await SimpleAssetService.convertToDataUrl({
        id: assetId,
        sha256,
        ext,
        mime: file.type,
        size_bytes: file.size,
        width,
        height,
        local_path: fullRelativePath,
        status: 'pending_upload' as AssetStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, file.type);
    } catch {
      displayUrl = '';
    }
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
      status: 'pending_upload' as AssetStatus,
      created_at: now,
      updated_at: now
    };
    await createFileAsset(asset);
    const fileRef = SimpleAssetService.createFileRef(asset, displayUrl);
    return {
      assetId,
      localPath: fullRelativePath,
      dataUrl: displayUrl,
      fileRef
    };
  }

  static async loadAssetForDisplay(assetId: string): Promise<string | undefined> {
    const asset = await getFileAssetById(assetId);
    if (!asset) return undefined;
    if (asset.remote_url) return asset.remote_url;
    if (asset.local_path) return SimpleAssetService.convertToDataUrl({
      ...asset,
      status: asset.status as AssetStatus,
      created_at: asset.created_at || '',
      updated_at: asset.updated_at || ''
    }, asset.mime || 'image/jpeg');
    return undefined;
  }

  static async updateAssetWithRemoteUrl(assetId: string, remoteUrl: string, remoteId?: string): Promise<void> {
    const asset = await getFileAssetById(assetId);
    if (!asset) throw new Error(`Asset not found: ${assetId}`);
    await updateFileAsset(assetId, {
      remote_url: remoteUrl,
      remote_id: remoteId || asset.remote_id,
      status: 'uploaded',
      updated_at: new Date().toISOString(),
    });
  }

  private static async convertToDataUrl(asset: FileAsset, mimeType: string): Promise<string> {
    if (!asset.local_path) throw new Error('Asset has no local path');
    const fileBytes = await readFile(asset.local_path, { baseDir: BaseDirectory.AppConfig });
    let binary = '';
    for (let i = 0; i < fileBytes.length; i++) {
      binary += String.fromCharCode(fileBytes[i]);
    }
    const base64 = btoa(binary);
    return `data:${mimeType};base64,${base64}`;
  }

  private static createFileRef(asset: FileAsset, dataUrl?: string): FileRef {
    return {
      assetId: asset.id,
      sha256: asset.sha256,
      role: 'cover',
      mime: asset.mime,
      width: asset.width,
      height: asset.height,
      remoteId: asset.remote_id,
      remoteUrl: asset.remote_url,
      localPath: asset.local_path,
      dataUrl,
      url: asset.remote_url || dataUrl,
      size: asset.size_bytes
    } as any;
  }

  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  }

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
}
