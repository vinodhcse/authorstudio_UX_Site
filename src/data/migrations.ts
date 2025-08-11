// SQLite migrations for encrypted book data with sync state
import Database from '@tauri-apps/plugin-sql';
import { appLog } from '../auth/fileLogger';

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

    // Migration 3: Books table with sync state
    await db.execute(`
      CREATE TABLE IF NOT EXISTS books (
        book_id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL,
        title TEXT,
        is_shared INTEGER NOT NULL DEFAULT 0,
        rev_local TEXT,
        rev_cloud TEXT,
        sync_state TEXT NOT NULL DEFAULT 'idle',
        conflict_state TEXT DEFAULT 'none',
        last_local_change INTEGER,
        last_cloud_change INTEGER,
        updated_at INTEGER
      )
    `);

    // Migration 4: Versions table with sync state
    await db.execute(`
      CREATE TABLE IF NOT EXISTS versions (
        version_id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        label TEXT,
        rev_local TEXT,
        rev_cloud TEXT,
        sync_state TEXT NOT NULL DEFAULT 'idle',
        conflict_state TEXT DEFAULT 'none',
        order_index INTEGER,
        updated_at INTEGER
      )
    `);

    // Migration 5: Chapters table with sync state
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chapters (
        chapter_id TEXT PRIMARY KEY,
        version_id TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        title TEXT,
        order_index INTEGER,
        rev_local TEXT,
        rev_cloud TEXT,
        sync_state TEXT NOT NULL DEFAULT 'idle',
        conflict_state TEXT DEFAULT 'none',
        updated_at INTEGER
      )
    `);

    // Migration 6: Scenes table with encrypted content
    await db.execute(`
      CREATE TABLE IF NOT EXISTS scenes (
        scene_id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        version_id TEXT NOT NULL,
        chapter_id TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        enc_scheme TEXT NOT NULL DEFAULT 'udek',
        content_enc BLOB NOT NULL,
        content_iv BLOB NOT NULL,
        has_proposals INTEGER DEFAULT 0,
        rev_local TEXT,
        rev_cloud TEXT,
        pending_ops INTEGER DEFAULT 0,
        sync_state TEXT NOT NULL DEFAULT 'idle',
        conflict_state TEXT DEFAULT 'none',
        word_count INTEGER,
        title TEXT,
        updated_at INTEGER
      )
    `);

    // Migration 7: Grants table for shared books
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

    // Create indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_books_owner ON books(owner_user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_versions_owner ON versions(owner_user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_chapters_owner ON chapters(owner_user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_scenes_owner ON scenes(owner_user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_scenes_book ON scenes(book_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_grants_owner ON grants(owner_user_id)`);

    await appLog.success('migrations', 'All database migrations completed successfully');
  } catch (error) {
    await appLog.error('migrations', 'Failed to run migrations', error);
    throw error;
  }
}
