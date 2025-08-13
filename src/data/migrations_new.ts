// Simple SQLite table creation - no complex migrations
import Database from '@tauri-apps/plugin-sql';
import { appLog } from '../auth/fileLogger';

export async function runMigrations(db: Database): Promise<void> {
  await appLog.info('migrations', 'Creating database tables...');
  
  try {
    // Enable foreign keys
    await db.execute('PRAGMA foreign_keys = ON');

    // 1. Session table
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

    // 2. User keys table
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

    // 3. Books table
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

    // 4. Versions table (MUST be created before chapters due to foreign key)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS versions (
        version_id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'Main',
        description TEXT,
        is_current INTEGER NOT NULL DEFAULT 1,
        parent_version_id TEXT,
        branch_point TEXT,
        enc_scheme TEXT NOT NULL DEFAULT 'udek',
        has_proposals INTEGER NOT NULL DEFAULT 0,
        rev_local TEXT,
        rev_cloud TEXT,
        pending_ops INTEGER NOT NULL DEFAULT 0,
        sync_state TEXT NOT NULL DEFAULT 'dirty',
        conflict_state TEXT NOT NULL DEFAULT 'none',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
        FOREIGN KEY (parent_version_id) REFERENCES versions(version_id) ON DELETE SET NULL
      )
    `);

    // 5. Chapters table (with ALL required columns)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chapters (
        chapter_id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        version_id TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'Untitled Chapter',
        order_index INTEGER NOT NULL DEFAULT 0,
        enc_scheme TEXT NOT NULL DEFAULT 'udek',
        content_enc BLOB,
        content_iv BLOB,
        has_proposals INTEGER NOT NULL DEFAULT 0,
        rev_local TEXT,
        rev_cloud TEXT,
        pending_ops INTEGER NOT NULL DEFAULT 0,
        sync_state TEXT NOT NULL DEFAULT 'dirty',
        conflict_state TEXT NOT NULL DEFAULT 'none',
        word_count INTEGER NOT NULL DEFAULT 0,
        character_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
        FOREIGN KEY (version_id) REFERENCES versions(version_id) ON DELETE CASCADE
      )
    `);

    // 6. Scenes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS scenes (
        scene_id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        version_id TEXT NOT NULL,
        chapter_id TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'Untitled Scene',
        order_index INTEGER NOT NULL DEFAULT 0,
        enc_scheme TEXT NOT NULL DEFAULT 'udek',
        content_enc BLOB,
        content_iv BLOB,
        has_proposals INTEGER NOT NULL DEFAULT 0,
        rev_local TEXT,
        rev_cloud TEXT,
        pending_ops INTEGER NOT NULL DEFAULT 0,
        sync_state TEXT NOT NULL DEFAULT 'dirty',
        conflict_state TEXT NOT NULL DEFAULT 'none',
        word_count INTEGER NOT NULL DEFAULT 0,
        character_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
        FOREIGN KEY (version_id) REFERENCES versions(version_id) ON DELETE CASCADE,
        FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE
      )
    `);

    // 7. Grants table
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

    // 8. File assets table
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

    // 9. File asset links table
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

    // Create indexes for performance
    await db.execute('CREATE INDEX IF NOT EXISTS idx_books_owner ON books(owner_user_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_versions_book ON versions(book_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_versions_owner ON versions(owner_user_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_chapters_version ON chapters(version_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters(book_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_chapters_owner ON chapters(owner_user_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(version_id, order_index)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_scenes_chapter ON scenes(chapter_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_scenes_version ON scenes(version_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_scenes_owner ON scenes(owner_user_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_scenes_order ON scenes(chapter_id, order_index)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_grants_owner ON grants(owner_user_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_file_assets_status ON file_assets(status)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_file_assets_sha256 ON file_assets(sha256)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_links_entity ON file_asset_links(entity_type, entity_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_links_asset ON file_asset_links(asset_id)');

    await appLog.success('migrations', 'All database tables created successfully');
  } catch (error) {
    await appLog.error('migrations', 'Failed to create database tables', error);
    throw error;
  }
}
