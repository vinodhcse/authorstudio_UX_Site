// Asset Database Layer - CRUD operations for file assets and links
import Database from '@tauri-apps/plugin-sql';
import { initializeDatabase } from '../data/dal';
import { FileAsset, FileAssetLink, EntityType, AssetRole, AssetStatus } from '../types';
import { appLog } from '../auth/fileLogger';

export class AssetDB {
  private static async getDatabase(): Promise<Database> {
    return initializeDatabase();
  }

  // FileAsset CRUD operations
  static async createAsset(asset: Omit<FileAsset, 'created_at' | 'updated_at'>): Promise<void> {
    const db = await this.getDatabase();
    const now = new Date().toISOString();
    
    await db.execute(
      `INSERT INTO file_assets 
       (id, sha256, ext, mime, size_bytes, width, height, local_path, remote_id, remote_url, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset.id,
        asset.sha256,
        asset.ext,
        asset.mime,
        asset.size_bytes,
        asset.width || null,
        asset.height || null,
        asset.local_path || null,
        asset.remote_id || null,
        asset.remote_url || null,
        asset.status,
        now,
        now
      ]
    );
    
    await appLog.info('assetdb', 'Asset created', { assetId: asset.id, sha256: asset.sha256 });
  }

  static async getAssetById(id: string): Promise<FileAsset | null> {
    const db = await this.getDatabase();
    const result = await db.select<FileAsset[]>(
      'SELECT * FROM file_assets WHERE id = ?',
      [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  static async getAssetBySha256(sha256: string): Promise<FileAsset | null> {
    const db = await this.getDatabase();
    const result = await db.select<FileAsset[]>(
      'SELECT * FROM file_assets WHERE sha256 = ?',
      [sha256]
    );
    return result.length > 0 ? result[0] : null;
  }

  static async updateAsset(id: string, updates: Partial<FileAsset>): Promise<void> {
    const db = await this.getDatabase();
    const now = new Date().toISOString();
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), now, id];
    
    await db.execute(
      `UPDATE file_assets SET ${fields}, updated_at = ? WHERE id = ?`,
      values
    );
    
    await appLog.info('assetdb', 'Asset updated', { assetId: id, updates: Object.keys(updates) });
  }

  static async markAssetUploaded(id: string, remoteId: string, remoteUrl: string): Promise<void> {
    await this.updateAsset(id, {
      remote_id: remoteId,
      remote_url: remoteUrl,
      status: 'uploaded'
    });
  }

  static async markAssetFailed(id: string): Promise<void> {
    await this.updateAsset(id, { status: 'failed' });
  }

  static async getAssetsByStatus(status: AssetStatus): Promise<FileAsset[]> {
    const db = await this.getDatabase();
    return await db.select<FileAsset[]>(
      'SELECT * FROM file_assets WHERE status = ?',
      [status]
    );
  }

  static async deleteAsset(id: string): Promise<void> {
    const db = await this.getDatabase();
    await db.execute('DELETE FROM file_assets WHERE id = ?', [id]);
    await appLog.info('assetdb', 'Asset deleted', { assetId: id });
  }

  // FileAssetLink CRUD operations
  static async createLink(link: Omit<FileAssetLink, 'created_at' | 'updated_at'>): Promise<void> {
    const db = await this.getDatabase();
    const now = new Date().toISOString();
    
    await db.execute(
      `INSERT INTO file_asset_links 
       (id, asset_id, entity_type, entity_id, role, sort_order, tags, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        link.id,
        link.asset_id,
        link.entity_type,
        link.entity_id,
        link.role,
        link.sort_order,
        link.tags || null,
        link.description || null,
        now,
        now
      ]
    );
    
    await appLog.info('assetdb', 'Asset link created', { 
      linkId: link.id, 
      assetId: link.asset_id, 
      entity: `${link.entity_type}:${link.entity_id}`,
      role: link.role 
    });
  }

  static async upsertLink(link: Omit<FileAssetLink, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const db = await this.getDatabase();
    const now = new Date().toISOString();
    
    // Check if link already exists
    const existing = await db.select<FileAssetLink[]>(
      'SELECT * FROM file_asset_links WHERE asset_id = ? AND entity_type = ? AND entity_id = ? AND role = ?',
      [link.asset_id, link.entity_type, link.entity_id, link.role]
    );
    
    if (existing.length > 0) {
      // Update existing link
      const linkId = existing[0].id;
      await db.execute(
        `UPDATE file_asset_links 
         SET sort_order = ?, tags = ?, description = ?, updated_at = ?
         WHERE id = ?`,
        [link.sort_order, link.tags || null, link.description || null, now, linkId]
      );
      await appLog.info('assetdb', 'Asset link updated', { linkId });
      return linkId;
    } else {
      // Create new link
      const linkId = crypto.randomUUID();
      await this.createLink({ ...link, id: linkId });
      return linkId;
    }
  }

  static async getLinksByEntity(entityType: EntityType, entityId: string): Promise<FileAssetLink[]> {
    const db = await this.getDatabase();
    return await db.select<FileAssetLink[]>(
      'SELECT * FROM file_asset_links WHERE entity_type = ? AND entity_id = ? ORDER BY sort_order',
      [entityType, entityId]
    );
  }

  static async getLinksByEntityAndRole(entityType: EntityType, entityId: string, role: AssetRole): Promise<FileAssetLink[]> {
    const db = await this.getDatabase();
    return await db.select<FileAssetLink[]>(
      'SELECT * FROM file_asset_links WHERE entity_type = ? AND entity_id = ? AND role = ? ORDER BY sort_order',
      [entityType, entityId, role]
    );
  }

  static async getLinksByAsset(assetId: string): Promise<FileAssetLink[]> {
    const db = await this.getDatabase();
    return await db.select<FileAssetLink[]>(
      'SELECT * FROM file_asset_links WHERE asset_id = ?',
      [assetId]
    );
  }

  static async deleteLink(id: string): Promise<void> {
    const db = await this.getDatabase();
    await db.execute('DELETE FROM file_asset_links WHERE id = ?', [id]);
    await appLog.info('assetdb', 'Asset link deleted', { linkId: id });
  }

  static async deleteLinksByEntityAndRole(entityType: EntityType, entityId: string, role: AssetRole): Promise<void> {
    const db = await this.getDatabase();
    await db.execute(
      'DELETE FROM file_asset_links WHERE entity_type = ? AND entity_id = ? AND role = ?',
      [entityType, entityId, role]
    );
    await appLog.info('assetdb', 'Asset links deleted by entity and role', { entityType, entityId, role });
  }

  static async deleteLinksByAsset(assetId: string): Promise<void> {
    const db = await this.getDatabase();
    await db.execute('DELETE FROM file_asset_links WHERE asset_id = ?', [assetId]);
    await appLog.info('assetdb', 'Asset links deleted by asset', { assetId });
  }

  // Complex queries
  static async getAssetsWithLinks(entityType: EntityType, entityId: string): Promise<Array<FileAsset & { link: FileAssetLink }>> {
    const db = await this.getDatabase();
    const results = await db.select<any[]>(
      `SELECT 
         a.*,
         l.id as link_id,
         l.role as link_role,
         l.sort_order as link_sort_order,
         l.tags as link_tags,
         l.description as link_description,
         l.created_at as link_created_at,
         l.updated_at as link_updated_at
       FROM file_assets a
       JOIN file_asset_links l ON a.id = l.asset_id
       WHERE l.entity_type = ? AND l.entity_id = ?
       ORDER BY l.sort_order`,
      [entityType, entityId]
    );

    return results.map(row => ({
      id: row.id,
      sha256: row.sha256,
      ext: row.ext,
      mime: row.mime,
      size_bytes: row.size_bytes,
      width: row.width,
      height: row.height,
      local_path: row.local_path,
      remote_id: row.remote_id,
      remote_url: row.remote_url,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      link: {
        id: row.link_id,
        asset_id: row.id,
        entity_type: entityType,
        entity_id: entityId,
        role: row.link_role,
        sort_order: row.link_sort_order,
        tags: row.link_tags,
        description: row.link_description,
        created_at: row.link_created_at,
        updated_at: row.link_updated_at
      }
    }));
  }

  static async getAssetWithLinksByRole(entityType: EntityType, entityId: string, role: AssetRole): Promise<Array<FileAsset & { link: FileAssetLink }>> {
    const db = await this.getDatabase();
    const results = await db.select<any[]>(
      `SELECT 
         a.*,
         l.id as link_id,
         l.role as link_role,
         l.sort_order as link_sort_order,
         l.tags as link_tags,
         l.description as link_description,
         l.created_at as link_created_at,
         l.updated_at as link_updated_at
       FROM file_assets a
       JOIN file_asset_links l ON a.id = l.asset_id
       WHERE l.entity_type = ? AND l.entity_id = ? AND l.role = ?
       ORDER BY l.sort_order`,
      [entityType, entityId, role]
    );

    return results.map(row => ({
      id: row.id,
      sha256: row.sha256,
      ext: row.ext,
      mime: row.mime,
      size_bytes: row.size_bytes,
      width: row.width,
      height: row.height,
      local_path: row.local_path,
      remote_id: row.remote_id,
      remote_url: row.remote_url,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      link: {
        id: row.link_id,
        asset_id: row.id,
        entity_type: entityType,
        entity_id: entityId,
        role: row.link_role,
        sort_order: row.link_sort_order,
        tags: row.link_tags,
        description: row.link_description,
        created_at: row.link_created_at,
        updated_at: row.link_updated_at
      }
    }));
  }

  // Cleanup operations
  static async getOrphanedAssets(): Promise<FileAsset[]> {
    const db = await this.getDatabase();
    return await db.select<FileAsset[]>(
      `SELECT a.* FROM file_assets a
       LEFT JOIN file_asset_links l ON a.id = l.asset_id
       WHERE l.asset_id IS NULL`
    );
  }

  static async deleteOrphanedAssets(): Promise<number> {
    const orphans = await this.getOrphanedAssets();
    const db = await this.getDatabase();
    
    if (orphans.length === 0) return 0;
    
    const placeholders = orphans.map(() => '?').join(',');
    const orphanIds = orphans.map(a => a.id);
    
    await db.execute(
      `DELETE FROM file_assets WHERE id IN (${placeholders})`,
      orphanIds
    );
    
    await appLog.info('assetdb', 'Deleted orphaned assets', { count: orphans.length });
    return orphans.length;
  }
}
