// SQLite migrations for encrypted book data with sync state
import Database from '@tauri-apps/plugin-sql';
import { appLog } from '../auth/fileLogger';
import { resetChapterTables } from './chapterReset';

export async function runMigrations(db: Database): Promise<void> {
  await appLog.info('migrations', 'Starting database migrations...');
  
  try {
    // Migration 1: Enhanced session table (already exists, but ensure columns)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS session (
        id INTEGER PRIMARY KEY CHECK (id=1),
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        device_id TEXT NOT NULL,
        session_state TEXT NOT NULL DEFAULT 'active',
        sealed_at INTEGER,
        access_exp INTEGER,
        updated_at INTEGER
      )
    `);

    // Migration 2: User keys table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_keys (
        id INTEGER PRIMARY KEY CHECK (id=1),
        user_id TEXT NOT NULL,
        udek_wrap_appkey BLOB NOT NULL,
        kdf_salt BLOB NOT NULL,
        kdf_iters INTEGER NOT NULL,
        updated_at INTEGER
      )
    `);

    // Migration 3: Books table with sync state and encrypted metadata
    await db.execute(`
      CREATE TABLE IF NOT EXISTS books (
        book_id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL,
        title TEXT,
        is_shared INTEGER NOT NULL DEFAULT 0,
        enc_metadata BLOB,
        enc_schema TEXT,
        rev_local TEXT,
        rev_cloud TEXT,
        sync_state TEXT NOT NULL DEFAULT 'idle',
        conflict_state TEXT DEFAULT 'none',
        last_local_change INTEGER,
        last_cloud_change INTEGER,
        updated_at INTEGER
      )
    `);

    // Migration 4: Reset chapter-related tables with correct schema
    await appLog.info('migrations', 'Resetting chapter tables to fix schema mismatches...');
    await resetChapterTables(db);

    // Migration 5: Grants table for shared books
    await db.execute(`
      CREATE TABLE IF NOT EXISTS grants (
        grant_id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        issuer_user_id TEXT NOT NULL,
        bsk_wrap_for_me BLOB NOT NULL,
        perms TEXT NOT NULL,
        revoked INTEGER DEFAULT 0,
        issued_at INTEGER,
        updated_at INTEGER
      )
    `);

    // Migration 6: Add encrypted metadata columns to existing books table if missing
    try {
      const columnsResult = await db.select<any[]>('PRAGMA table_info(books)');
      const columns = columnsResult.map((row: any) => row.name);
      
      if (!columns.includes('enc_metadata')) {
        await db.execute(`ALTER TABLE books ADD COLUMN enc_metadata BLOB`);
        await appLog.info('migrations', 'Added enc_metadata column to books table');
      }
      
      if (!columns.includes('enc_schema')) {
        await db.execute(`ALTER TABLE books ADD COLUMN enc_schema TEXT`);
        await appLog.info('migrations', 'Added enc_schema column to books table');
      }
    } catch (error) {
      await appLog.info('migrations', 'Books table columns already exist or failed to add', { error });
    }

    // Migration 7: Asset system tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS file_assets (
        id TEXT PRIMARY KEY,
        sha256 TEXT NOT NULL,
        ext TEXT NOT NULL,
        mime TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        local_path TEXT,
        remote_id TEXT,
        remote_url TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(sha256)
      )
    `);
    await appLog.info('migrations', 'File assets table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS file_asset_links (
        id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        role TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        tags TEXT,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(asset_id, entity_type, entity_id, role)
      )
    `);
    await appLog.info('migrations', 'File asset links table created');

    // Create remaining indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_books_owner ON books(owner_user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_grants_owner ON grants(owner_user_id)`);

    // Asset system indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_file_assets_status ON file_assets(status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_file_assets_sha256 ON file_assets(sha256)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_entity ON file_asset_links(entity_type, entity_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_asset ON file_asset_links(asset_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_role ON file_asset_links(role)`);
    await appLog.info('migrations', 'Asset system indexes created');

    await appLog.success('migrations', 'All database migrations completed successfully');
  } catch (error) {
    await appLog.error('migrations', 'Failed to run migrations', error);
    throw error;
  }
}
