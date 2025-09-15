// Asset Database Layer - now backed by SurrealDB via Tauri commands
import { invoke } from '@tauri-apps/api/core';
// SurrealDB is initialized once at app startup; no need to import initializeDatabase
import { FileAsset, FileAssetLink, EntityType, AssetRole, AssetStatus } from '../types';
import { appLog } from '../auth/fileLogger';

export class AssetDB {
  private static async ensureDb(): Promise<void> {
  // ...existing code...
  }

  // FileAsset CRUD operations
  static async createAsset(asset: Omit<FileAsset, 'created_at' | 'updated_at'>): Promise<void> {
    await this.ensureDb();
    const now = new Date().toISOString();
    
    // Map frontend 'id' field to backend 'file_asset_id' field
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
      created_at: now,
      updated_at: now,
    };
    
    await invoke('app_create_file_asset', { fileAsset: backendAsset });
    await appLog.info('assetdb', 'Asset created', { assetId: asset.id, sha256: asset.sha256 });
  }

  static async getAssetById(id: string): Promise<FileAsset | null> {
    await this.ensureDb();
    const result = await invoke<any>('app_get_file_asset_by_id', { assetId: id });
    if (!result) return null;
    
    // Map backend 'file_asset_id' field to frontend 'id' field
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
  }

  static async getAssetBySha256(sha256: string): Promise<FileAsset | null> {
    await this.ensureDb();
    const result = await invoke<any>('app_get_file_asset_by_sha256', { sha256: sha256 });
    if (!result) return null;
    
    // Map backend 'file_asset_id' field to frontend 'id' field
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
  }

  static async updateAsset(id: string, updates: Partial<FileAsset>): Promise<void> {
    await this.ensureDb();
    const now = new Date().toISOString();
    
    // Get current asset to merge updates
    const currentAsset = await this.getAssetById(id);
    if (!currentAsset) {
      throw new Error(`Asset not found: ${id}`);
    }
    
    // Merge updates with current asset
    const updatedAsset = { ...currentAsset, ...updates, updated_at: now };
    
    // Map frontend fields to backend fields
    const backendAsset = {
      file_asset_id: updatedAsset.id,
      sha256: updatedAsset.sha256,
      ext: updatedAsset.ext,
      mime: updatedAsset.mime,
      size_bytes: updatedAsset.size_bytes,
      width: updatedAsset.width,
      height: updatedAsset.height,
      local_path: updatedAsset.local_path,
      remote_id: updatedAsset.remote_id,
      remote_url: updatedAsset.remote_url,
      status: updatedAsset.status,
      created_at: updatedAsset.created_at,
      updated_at: now,
    };
    
    await invoke('app_update_file_asset', { assetId: id, fileAsset: backendAsset });
    await appLog.info('assetdb', 'Asset updated', { assetId: id, updates: Object.keys(updates) });
  }

  static async markAssetUploaded(id: string, remoteId: string, remoteUrl: string): Promise<void> {
    await appLog.info('assetdb', 'Marking asset uploaded', { assetId: id, remoteId, remoteUrl });
    await this.updateAsset(id, {
      remote_id: remoteId,
      remote_url: remoteUrl,
      status: 'uploaded'
    });
    await appLog.success('assetdb', 'Asset marked uploaded', { assetId: id, remoteId, remoteUrl });
  }

  static async markAssetFailed(id: string): Promise<void> {
    await this.updateAsset(id, { status: 'failed' });
  }

  static async getAssetsByStatus(status: AssetStatus): Promise<FileAsset[]> {
    await this.ensureDb();
    const results = await invoke<any[]>('app_get_file_assets_by_status', { status: status });
    
    // Map backend 'file_asset_id' field to frontend 'id' field for each asset
    return results.map(result => ({
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
    }));
  }

  static async deleteAsset(id: string): Promise<void> {
    await this.ensureDb();
    await invoke('asset_delete', { id });
    await appLog.info('assetdb', 'Asset deleted', { assetId: id });
  }

  // FileAssetLink CRUD operations
  static async createLink(link: Omit<FileAssetLink, 'created_at' | 'updated_at'>): Promise<void> {
    await this.ensureDb();
    const now = new Date().toISOString();
    const full: FileAssetLink = {
      ...link,
      created_at: now,
      updated_at: now,
    } as FileAssetLink;
    await invoke('link_create', { link: full });
    await appLog.info('assetdb', 'Asset link created', { 
      linkId: full.id, 
      assetId: full.asset_id, 
      entity: `${full.entity_type}:${full.entity_id}`,
      role: full.role 
    });
  }

  static async upsertLink(link: Omit<FileAssetLink, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await this.ensureDb();
    // Normalize link payload to accept either snake_case (DB) or camelCase (UI) fields
    const payload = {
      id: (link as any).id,
      asset_id: (link as any).asset_id ?? (link as any).assetId,
      entity_type: (link as any).entity_type ?? (link as any).entityType,
      entity_id: (link as any).entity_id ?? (link as any).entityId,
      role: (link as any).role ?? undefined,
      sort_order: (link as any).sort_order ?? (link as any).sortOrder ?? 0,
      tags: (link as any).tags ?? null,
      description: (link as any).description ?? null,
    } as any;

    const backendLink = {
      file_asset_link_id: payload.id || crypto.randomUUID(), // Generate UUID if not provided
      asset_id: payload.asset_id,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      role: payload.role,
      sort_order: payload.sort_order,
      tags: payload.tags,
      description: payload.description,
    };

    // Log final payload for debugging
    await appLog.info('assetdb', 'Calling app_upsert_file_asset_link with payload', backendLink);

    const result = await invoke<string>('app_upsert_file_asset_link', { link: backendLink });
    await appLog.info('assetdb', 'Asset link upserted', { linkId: result });
    return result;
  }

  static async getLinksByEntity(entityType: EntityType, entityId: string): Promise<FileAssetLink[]> {
    await this.ensureDb();
    const results = await invoke<any[]>('app_get_file_asset_links_by_entity', { entityType: entityType, entityId: entityId });
    
    // Map backend 'file_asset_link_id' field to frontend 'id' field for each link
    return results.map(result => ({
      id: result.file_asset_link_id,
      asset_id: result.asset_id,
      entity_type: result.entity_type,
      entity_id: result.entity_id,
      role: result.role,
      sort_order: result.sort_order,
      tags: result.tags,
      description: result.description,
      created_at: result.created_at,
      updated_at: result.updated_at,
    }));
  }

  static async getLinksByEntityAndRole(entityType: EntityType, entityId: string, role: AssetRole): Promise<FileAssetLink[]> {
    await this.ensureDb();
  return await invoke<FileAssetLink[]>('links_by_entity_role', { entity_type: entityType, entity_id: entityId, role });
  }

  static async getLinksByAsset(assetId: string): Promise<FileAssetLink[]> {
    await this.ensureDb();
  return await invoke<FileAssetLink[]>('links_by_asset', { asset_id: assetId });
  }

  static async deleteLink(id: string): Promise<void> {
    await this.ensureDb();
    await invoke('link_delete', { id });
    await appLog.info('assetdb', 'Asset link deleted', { linkId: id });
  }

  static async deleteLinksByEntityAndRole(entityType: EntityType, entityId: string, role: AssetRole): Promise<void> {
    await this.ensureDb();
  await invoke('links_delete_by_entity_role', { entity_type: entityType, entity_id: entityId, role });
  await appLog.info('assetdb', 'Asset links deleted by entity and role', { entityType, entityId, role });
  }

  static async deleteLinksByAsset(assetId: string): Promise<void> {
    await this.ensureDb();
  await invoke('links_delete_by_asset', { asset_id: assetId });
  await appLog.info('assetdb', 'Asset links deleted by asset', { assetId });
  }

  // Complex queries
  static async getAssetsWithLinks(entityType: EntityType, entityId: string): Promise<Array<FileAsset & { link: FileAssetLink }>> {
    await this.ensureDb();
    const links = await this.getLinksByEntity(entityType, entityId);
    const assets = await Promise.all(links.map(async (l) => ({ link: l, asset: await this.getAssetById(l.asset_id) })));
    return assets
      .filter(a => !!a.asset)
      .map(a => ({ ...(a.asset as FileAsset), link: a.link }));
  }

  static async getAssetWithLinksByRole(entityType: EntityType, entityId: string, role: AssetRole): Promise<Array<FileAsset & { link: FileAssetLink }>> {
    await this.ensureDb();
    const links = await this.getLinksByEntityAndRole(entityType, entityId, role);
    const assets = await Promise.all(links.map(async (l) => ({ link: l, asset: await this.getAssetById(l.asset_id) })));
    return assets
      .filter(a => !!a.asset)
      .map(a => ({ ...(a.asset as FileAsset), link: a.link }));
  }

  // Cleanup operations
  static async getOrphanedAssets(): Promise<FileAsset[]> {
    await this.ensureDb();
    const rows = await invoke<any>('surreal_query', {
      query: `SELECT * FROM file_assets WHERE id NOT IN (SELECT asset_id FROM file_asset_links)`
    });
    return rows as FileAsset[];
  }

  static async deleteOrphanedAssets(): Promise<number> {
    const orphans = await this.getOrphanedAssets();
    if (orphans.length === 0) return 0;
    for (const a of orphans) {
      await this.deleteAsset(a.id);
    }
    await appLog.info('assetdb', 'Deleted orphaned assets', { count: orphans.length });
    return orphans.length;
  }
}
