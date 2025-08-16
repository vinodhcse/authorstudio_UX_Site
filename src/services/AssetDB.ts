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
    const full: FileAsset = {
      ...asset,
      created_at: now,
      updated_at: now,
    } as FileAsset;
    await invoke('asset_create', { asset: full });
    await appLog.info('assetdb', 'Asset created', { assetId: asset.id, sha256: asset.sha256 });
  }

  static async getAssetById(id: string): Promise<FileAsset | null> {
    await this.ensureDb();
    return (await invoke<FileAsset | null>('asset_get', { id })) ?? null;
  }

  static async getAssetBySha256(sha256: string): Promise<FileAsset | null> {
    await this.ensureDb();
    return (await invoke<FileAsset | null>('asset_get_by_sha256', { sha256 })) ?? null;
  }

  static async updateAsset(id: string, updates: Partial<FileAsset>): Promise<void> {
    await this.ensureDb();
    const now = new Date().toISOString();
    await invoke('asset_update', { id, updates: { ...updates, updated_at: now } });
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
    return await invoke<FileAsset[]>('assets_by_status', { status });
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
      asset_id: (link as any).asset_id ?? (link as any).assetId,
      entity_type: (link as any).entity_type ?? (link as any).entityType,
      entity_id: (link as any).entity_id ?? (link as any).entityId,
      role: (link as any).role ?? undefined,
      sort_order: (link as any).sort_order ?? (link as any).sortOrder ?? 0,
      tags: (link as any).tags ?? null,
      description: (link as any).description ?? null,
    } as any;

    // Build invoke payload with both snake_case and camelCase keys to satisfy either Rust/Tauri naming
    const invokePayload = {
      asset_id: payload.asset_id,
      assetId: payload.asset_id,
      entity_type: payload.entity_type,
      entityType: payload.entity_type,
      entity_id: payload.entity_id,
      entityId: payload.entity_id,
      role: payload.role,
      sort_order: payload.sort_order,
      sortOrder: payload.sort_order,
      tags: payload.tags,
      description: payload.description,
    } as any;

    // Log final payload for debugging
    await appLog.info('assetdb', 'Calling link_upsert with payload', invokePayload);

    const id = await invoke<string>('link_upsert', invokePayload);
    await appLog.info('assetdb', 'Asset link upserted', { linkId: id });
    return id;
  }

  static async getLinksByEntity(entityType: EntityType, entityId: string): Promise<FileAssetLink[]> {
    await this.ensureDb();
  return await invoke<FileAssetLink[]>('links_by_entity', { entity_type: entityType, entity_id: entityId });
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
