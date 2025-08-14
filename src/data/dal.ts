// Data Access Layer for encrypted book data
import Database from '@tauri-apps/plugin-sql';
import { appLog } from '../auth/fileLogger';
import { Book, Version, Chapter, Scene, Grant, UserKeys, SyncState, ConflictState, VersionContentData } from '../types';
import { runMigrations } from './migrations';

let db: Database | null = null;

// Retry function for database operations
async function retryDatabaseOperation<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  delayMs: number = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('database is locked') && attempt < maxRetries) {
        appLog.warn('dal', `Database locked, attempt ${attempt}/${maxRetries}, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function initializeDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:data.db');
    
    // Set database pragmas for better concurrency and immediate persistence
    try {
      await db.execute('PRAGMA journal_mode = WAL');
      await db.execute('PRAGMA synchronous = NORMAL');
      await db.execute('PRAGMA foreign_keys = ON');
      await db.execute('PRAGMA busy_timeout = 10000'); // 10 second timeout for locks
      await db.execute('PRAGMA wal_autocheckpoint = 1000'); // Checkpoint every 1000 pages
      appLog.info('dal', 'Database pragmas set for optimal transaction handling');
    } catch (error) {
      appLog.warn('dal', 'Could not set database pragmas', { error });
    }
    
    await runMigrations(db);
    appLog.info('dal', 'Database initialized with migrations');
  }
  return db;
}


// Book metadata interface for encryption
export interface BookMetadata {
  description?: string;
  synopsis?: string;
  genre?: string;
  subgenre?: string;
  bookType?: string;
  prose?: string;
  language?: string;
  publisher?: string;
  publishedStatus?: string;
  publisherLink?: string;
  printISBN?: string;
  ebookISBN?: string;
}


// User Keys operations
export interface UserKeysRow {
  id: number;
  user_id: string;
  udek_wrap_appkey: Uint8Array;
  kdf_salt: Uint8Array;
  kdf_iters: number;
  updated_at: number;
}

export async function getUserKeys(userId: string): Promise<UserKeysRow | null> {
  const database = await initializeDatabase();
  const result = await database.select<UserKeysRow[]>('SELECT * FROM user_keys WHERE user_id = ?', [userId]);
  return result.length > 0 ? result[0] : null;
}

export async function setUserKeys(data: Omit<UserKeysRow, 'id'>): Promise<void> {
  try {
    const database = await initializeDatabase();
    // Use INSERT OR REPLACE with explicit id=1 to satisfy the CHECK constraint
    await database.execute(
      `INSERT OR REPLACE INTO user_keys (id, user_id, udek_wrap_appkey, kdf_salt, kdf_iters, updated_at) 
       VALUES (1, ?, ?, ?, ?, ?)`,
      [data.user_id, data.udek_wrap_appkey, data.kdf_salt, data.kdf_iters, data.updated_at]
    );
    appLog.info('dal', 'User keys updated', { userId: data.user_id });
  } catch (error) {
    appLog.error('dal', 'Error saving user keys to database', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: data.user_id 
    });
    throw error;
  }
}

// Book operations
export interface BookRow {
  book_id: string;
  owner_user_id: string;
  title: string;
  is_shared: number;
  // Encrypted metadata fields
  enc_metadata?: Uint8Array; // Contains description, synopsis, genre, etc.
  enc_schema?: string; // Encryption scheme ('udek' | 'bsk')
  // Sync and revision tracking
  rev_local?: string;
  rev_cloud?: string;
  sync_state: string;
  conflict_state: string;
  last_local_change?: number;
  last_cloud_change?: number;
  updated_at?: number;
}

export async function getUserBooks(userId: string): Promise<BookRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<BookRow[]>('SELECT * FROM books WHERE owner_user_id = ?', [userId]);
  appLog.info('dal', `Retrieved ${result.length} books for user`, { userId });
  return result;
}

export async function getBook(bookId: string, userId: string): Promise<BookRow | null> {
  const database = await initializeDatabase();
  const result = await database.select<BookRow[]>('SELECT * FROM books WHERE book_id = ? AND owner_user_id = ?', [bookId, userId]);
  return result.length > 0 ? result[0] : null;
}

export async function putBook(data: BookRow): Promise<void> {
  try {
    const database = await initializeDatabase();
    
    // Handle undefined/null values for optional fields
    const params = [
      data.book_id, 
      data.owner_user_id, 
      data.title, 
      data.is_shared, 
      data.enc_metadata || null, 
      data.enc_schema || null, 
      data.rev_local || null, 
      data.rev_cloud || null, 
      data.sync_state, 
      data.conflict_state, 
      data.last_local_change || null, 
      data.last_cloud_change || null, 
      data.updated_at || null
    ];
    
    // Use a single atomic operation (autocommit mode)
    await database.execute(
      `INSERT OR REPLACE INTO books 
       (book_id, owner_user_id, title, is_shared, enc_metadata, enc_schema, rev_local, rev_cloud, sync_state, conflict_state, last_local_change, last_cloud_change, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );
    
    // Add a small delay to ensure WAL mode flushes
    await new Promise(resolve => setTimeout(resolve, 10));
    
    appLog.info('dal', 'Book updated successfully', { bookId: data.book_id, syncState: data.sync_state });
  } catch (error) {
    appLog.error('dal', 'Error saving book to database', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      bookId: data.book_id 
    });
    throw error;
  }
}

// Get books that need syncing to cloud
export async function getDirtyBooks(userId: string): Promise<BookRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<BookRow[]>(
    'SELECT * FROM books WHERE owner_user_id = ? AND sync_state = ?', 
    [userId, 'dirty']
  );
  return result;
}

// Get books with conflicts
export async function getConflictedBooks(userId: string): Promise<BookRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<BookRow[]>(
    'SELECT * FROM books WHERE owner_user_id = ? AND conflict_state != ?', 
    [userId, 'none']
  );
  return result;
}

// Book metadata interface for encryption
export interface BookMetadata {
  description?: string;
  synopsis?: string;
  genre?: string;
  subgenre?: string;
  bookType?: string;
  prose?: string;
  language?: string;
  publisher?: string;
  publishedStatus?: string;
  publisherLink?: string;
  printISBN?: string;
  ebookISBN?: string;
}

export async function deleteBook(bookId: string, userId: string): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    'DELETE FROM books WHERE book_id = ? AND owner_user_id = ?',
    [bookId, userId]
  );
  appLog.info('dal', 'Book deleted from database', { bookId, userId });
}

export async function markBookSyncState(bookId: string, userId: string, syncState: SyncState): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    'UPDATE books SET sync_state = ?, updated_at = ? WHERE book_id = ? AND owner_user_id = ?',
    [syncState, Date.now(), bookId, userId]
  );
  appLog.info('dal', 'Book sync state updated', { bookId, syncState });
}

// Scene operations
export interface SceneRow {
  scene_id: string;
  book_id: string;
  version_id: string;
  chapter_id: string;
  owner_user_id: string;
  enc_scheme: string;
  content_enc: Uint8Array;
  content_iv: Uint8Array;
  has_proposals: number;
  rev_local?: string;
  rev_cloud?: string;
  pending_ops: number;
  sync_state: string;
  conflict_state: string;
  word_count?: number;
  title?: string;
  updated_at?: number;
}

export async function getScene(sceneId: string, userId: string): Promise<SceneRow | null> {
  const database = await initializeDatabase();
  const result = await database.select<SceneRow[]>('SELECT * FROM scenes WHERE scene_id = ? AND owner_user_id = ?', [sceneId, userId]);
  return result.length > 0 ? result[0] : null;
}

export async function putScene(data: SceneRow): Promise<void> {
  try {
    const database = await initializeDatabase();
    
    // Handle undefined/null values for optional fields
    const params = [
      data.scene_id, 
      data.book_id, 
      data.version_id, 
      data.chapter_id, 
      data.owner_user_id, 
      data.enc_scheme, 
      data.content_enc, 
      data.content_iv, 
      data.has_proposals, 
      data.rev_local || null, 
      data.rev_cloud || null, 
      data.pending_ops, 
      data.sync_state, 
      data.conflict_state, 
      data.word_count || null, 
      data.title || null, 
      data.updated_at || null
    ];
    
    await database.execute(
      `INSERT OR REPLACE INTO scenes 
       (scene_id, book_id, version_id, chapter_id, owner_user_id, enc_scheme, content_enc, content_iv, has_proposals, rev_local, rev_cloud, pending_ops, sync_state, conflict_state, word_count, title, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );
    appLog.info('dal', 'Scene updated', { sceneId: data.scene_id, syncState: data.sync_state });
  } catch (error) {
    appLog.error('dal', 'Error saving scene to database', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      sceneId: data.scene_id 
    });
    throw error;
  }
}

export async function markSceneSyncState(sceneId: string, userId: string, syncState: SyncState): Promise<void> {
  try {
    const database = await initializeDatabase();
    await database.execute(
      'UPDATE scenes SET sync_state = ?, updated_at = ? WHERE scene_id = ? AND owner_user_id = ?',
      [syncState, Date.now(), sceneId, userId]
    );
    appLog.info('dal', 'Scene sync state updated', { sceneId, syncState });
  } catch (error) {
    appLog.error('dal', 'Error updating scene sync state', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      sceneId 
    });
    throw error;
  }
}

export async function markSceneConflict(sceneId: string, userId: string, conflictState: ConflictState): Promise<void> {
  try {
    const database = await initializeDatabase();
    await database.execute(
      'UPDATE scenes SET conflict_state = ?, updated_at = ? WHERE scene_id = ? AND owner_user_id = ?',
      [conflictState, Date.now(), sceneId, userId]
    );
    appLog.info('dal', 'Scene conflict state updated', { sceneId, conflictState });
  } catch (error) {
    appLog.error('dal', 'Error updating scene conflict state', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      sceneId 
    });
    throw error;
  }
}

export async function getScenesByBook(bookId: string, userId: string): Promise<SceneRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<SceneRow[]>('SELECT * FROM scenes WHERE book_id = ? AND owner_user_id = ?', [bookId, userId]);
  return result;
}

export async function getDirtyScenes(userId: string): Promise<SceneRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<SceneRow[]>('SELECT * FROM scenes WHERE owner_user_id = ? AND sync_state = ?', [userId, 'dirty']);
  return result;
}

// Version operations
export interface VersionRow {
  version_id: string;
  book_id: string;
  owner_user_id: string;
  title: string;
  description?: string;
  is_current: number;
  parent_version_id?: string;
  branch_point?: string;
  enc_scheme: string;
  has_proposals: number;
  rev_local?: string;
  rev_cloud?: string;
  pending_ops: number;
  sync_state: string;
  conflict_state: string;
  created_at: number;
  updated_at: number;
  content_data?: string; // JSON blob for plot canvas, characters, worlds, etc.
}

export async function getVersion(versionId: string, userId: string): Promise<VersionRow | null> {
  const database = await initializeDatabase();
  const result = await database.select<VersionRow[]>(
    'SELECT * FROM versions WHERE version_id = ? AND owner_user_id = ?', 
    [versionId, userId]
  );
  return result.length > 0 ? result[0] : null;
}

export async function getVersionsByBook(bookId: string, userId: string): Promise<VersionRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<VersionRow[]>(
    'SELECT * FROM versions WHERE book_id = ? AND owner_user_id = ? ORDER BY created_at DESC', 
    [bookId, userId]
  );
  return result;
}

export async function putVersion(data: VersionRow): Promise<void> {
  try {
    await retryDatabaseOperation(async () => {
      const database = await initializeDatabase();
      
      // Log the data being saved for debugging
      appLog.info('dal', 'About to save version to database', { 
        versionId: data.version_id, 
        bookId: data.book_id,
        title: data.title,
        dataKeys: Object.keys(data)
      });
      
      // Handle undefined/null values for optional fields
      const params = [
        data.version_id, 
        data.book_id, 
        data.owner_user_id, 
        data.title, 
        data.description || null, // Convert undefined to null
        data.is_current, 
        data.parent_version_id || null, // Convert undefined to null
        data.branch_point || null, // Convert undefined to null
        data.enc_scheme, 
        data.has_proposals, 
        data.rev_local || null, // Convert undefined to null
        data.rev_cloud || null, // Convert undefined to null
        data.pending_ops, 
        data.sync_state, 
        data.conflict_state, 
        data.created_at, 
        data.updated_at,
        data.content_data || null // JSON blob for plot canvas, characters, etc.
      ];
      
      appLog.info('dal', 'SQL parameters prepared', { params });
      
      // Use a single atomic operation (autocommit mode)
      const result = await database.execute(
        `INSERT OR REPLACE INTO versions 
         (version_id, book_id, owner_user_id, title, description, is_current, parent_version_id, branch_point, enc_scheme, has_proposals, rev_local, rev_cloud, pending_ops, sync_state, conflict_state, created_at, updated_at, content_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
      
      appLog.info('dal', 'Database execute result', { 
        versionId: data.version_id, 
        bookId: data.book_id,
        result: result ? 'success' : 'unknown'
      });
      
      // Force WAL checkpoint to ensure immediate persistence
      await database.execute('PRAGMA wal_checkpoint(PASSIVE)');
      
      return result;
    });
    
    // Verify the version was actually saved by trying to retrieve it
    const savedVersion = await getVersion(data.version_id, data.owner_user_id);
    if (savedVersion) {
      appLog.info('dal', 'Version save verified - record found in database', { 
        versionId: data.version_id, 
        bookId: data.book_id,
        savedTitle: savedVersion.title
      });
    } else {
      appLog.error('dal', 'Version save verification FAILED - record not found in database', { 
        versionId: data.version_id, 
        bookId: data.book_id
      });
    }
    
    appLog.info('dal', 'Version saved successfully', { versionId: data.version_id, bookId: data.book_id });
  } catch (error) {
    appLog.error('dal', 'Error saving version to database', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      versionId: data.version_id, 
      bookId: data.book_id 
    });
    throw error;
  }
}

// Helper functions for managing version content data
export async function getVersionContentData(versionId: string, userId: string): Promise<VersionContentData | null> {
  try {
    const version = await getVersion(versionId, userId);
    if (!version || !version.content_data) {
      return null;
    }
    
    const contentData = JSON.parse(version.content_data) as VersionContentData;
    appLog.info('dal', 'Retrieved version content data', { versionId, dataKeys: Object.keys(contentData) });
    return contentData;
  } catch (error) {
    appLog.error('dal', 'Failed to parse version content data', { versionId, error });
    return null;
  }
}

export async function updateVersionContentData(
  versionId: string, 
  userId: string, 
  updates: Partial<VersionContentData>
): Promise<void> {
  try {
    // Get existing version
    const existingVersion = await getVersion(versionId, userId);
    if (!existingVersion) {
      throw new Error(`Version not found: ${versionId}`);
    }

    // Parse existing content data or create new
    let contentData: VersionContentData = {};
    if (existingVersion.content_data) {
      try {
        contentData = JSON.parse(existingVersion.content_data);
      } catch (error) {
        appLog.warn('dal', 'Failed to parse existing content data, creating new', { versionId, error });
      }
    }

    // Merge updates
    contentData = {
      ...contentData,
      ...updates,
      version: '1.0' // Schema version for future migrations
    };

    // Update the version row with new content data
    const updatedVersionRow: VersionRow = {
      ...existingVersion,
      content_data: JSON.stringify(contentData),
      updated_at: Date.now()
    };

    await putVersion(updatedVersionRow);
    appLog.info('dal', 'Updated version content data', { 
      versionId, 
      updateKeys: Object.keys(updates),
      totalDataSize: updatedVersionRow.content_data?.length || 0
    });

  } catch (error) {
    appLog.error('dal', 'Failed to update version content data', { versionId, error });
    throw error;
  }
}

// Helper function to sync chapters from chapters table to version content_data
export async function syncChaptersToVersionData(
  bookId: string, 
  versionId: string, 
  userId: string
): Promise<void> {
  try {
    // Get all chapters from the chapters table
    const chapterRows = await getChaptersByVersion(bookId, versionId, userId);
    
    appLog.info('dal', 'Retrieved chapter rows for sync', {
      bookId,
      versionId,
      chapterCount: chapterRows.length,
      titles: chapterRows.map(row => ({ id: row.chapter_id, title: row.title }))
    });
    
    // Convert chapter rows to Chapter objects (we need to decrypt content to get full data)
    // For now, we'll store basic metadata in version content_data
    const chapterMetadata: Chapter[] = chapterRows.map(row => ({
      id: row.chapter_id,
      title: row.title || 'Untitled Chapter',
      position: row.order_index || 0,
      createdAt: new Date(row.created_at || Date.now()).toISOString(),
      updatedAt: new Date(row.updated_at || Date.now()).toISOString(),
      linkedPlotNodeId: '', // Will be populated from narrative flow
      linkedAct: '', // Will be populated from narrative flow 
      linkedOutline: '', // Will be populated from narrative flow
      linkedScenes: [], // Will be populated from narrative flow
      content: {
        type: 'doc' as const,
        content: [],
        metadata: {
          totalWords: row.word_count || 0,
          totalCharacters: row.character_count || 0
        }
      },
      revisions: [],
      currentRevisionId: '',
      collaborativeState: {
        pendingChanges: [],
        needsReview: false,
        reviewerIds: [],
        approvedBy: [],
        rejectedBy: [],
        mergeConflicts: []
      },
      syncState: row.sync_state as SyncState,
      conflictState: row.conflict_state as ConflictState,
      wordCount: row.word_count || 0,
      hasProposals: row.has_proposals === 1,
      characters: [],
      isComplete: false,
      status: 'DRAFT' as const,
      authorId: userId,
      lastModifiedBy: userId
    }));

    appLog.info('dal', 'Converted chapter rows to metadata', {
      bookId,
      versionId,
      chapterMetadata: chapterMetadata.map(ch => ({ id: ch.id, title: ch.title, position: ch.position }))
    });

    // Update version content_data with chapter metadata
    await updateVersionContentData(versionId, userId, {
      chapters: chapterMetadata.sort((a, b) => a.position - b.position)
    });

    appLog.info('dal', 'Synced chapters to version content_data', { 
      bookId, 
      versionId, 
      chapterCount: chapterMetadata.length,
      finalTitles: chapterMetadata.sort((a, b) => a.position - b.position).map(ch => ch.title)
    });

  } catch (error) {
    appLog.error('dal', 'Failed to sync chapters to version data', { 
      bookId, 
      versionId, 
      error 
    });
    throw error;
  }
}

export async function ensureDefaultVersion(bookId: string, userId: string): Promise<string> {
  // Check if book has any versions in database
  const existingVersions = await getVersionsByBook(bookId, userId);
  
  if (existingVersions.length > 0) {
    appLog.info('dal', 'Using existing version from database', { 
      bookId, 
      versionId: existingVersions[0].version_id 
    });
    return existingVersions[0].version_id;
  }
  
  // Create default version
  const versionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  const defaultVersion: VersionRow = {
    version_id: versionId,
    book_id: bookId,
    owner_user_id: userId,
    title: 'Main',
    description: 'Default version',
    is_current: 1,
    enc_scheme: 'udek',
    has_proposals: 0,
    pending_ops: 0,
    sync_state: 'dirty',
    conflict_state: 'none',
    created_at: now,
    updated_at: now
  };
  
  await putVersion(defaultVersion);
  
  appLog.success('dal', 'Created default version in database', { 
    bookId, 
    versionId 
  });
  
  return versionId;
}

// Helper function to ensure a specific version exists in database
export async function ensureVersionInDatabase(versionId: string, bookId: string, userId: string): Promise<boolean> {
  try {
    const existingVersion = await getVersion(versionId, userId);
    if (existingVersion) {
      await appLog.info('dal', 'Version already exists in database', { versionId, bookId });
      return true;
    }
    
    // Version doesn't exist in database - this is the gap we need to fill
    // For now, create a minimal version record
    const now = Date.now();
    const fallbackVersion: VersionRow = {
      version_id: versionId,
      book_id: bookId,
      owner_user_id: userId,
      title: 'Synced Version',
      description: 'Version synced from UI state',
      is_current: 1,
      enc_scheme: 'udek',
      has_proposals: 0,
      pending_ops: 0,
      sync_state: 'dirty',
      conflict_state: 'none',
      created_at: now,
      updated_at: now
    };
    
    await putVersion(fallbackVersion);
    await appLog.success('dal', 'Created missing version in database', { 
      versionId, 
      bookId 
    });
    
    return true;
  } catch (error) {
    await appLog.error('dal', 'Failed to ensure version in database', { 
      versionId, 
      bookId, 
      error 
    });
    return false;
  }
}

// Utility function to force database unlock and checkpoint
export async function forceUnlockDatabase(): Promise<void> {
  try {
    const database = await initializeDatabase();
    
    // Force WAL checkpoint to unlock database
    await database.execute('PRAGMA wal_checkpoint(RESTART)');
    appLog.info('dal', 'Forced database checkpoint completed');
    
    // Vacuum if needed
    await database.execute('PRAGMA optimize');
    appLog.info('dal', 'Database optimization completed');
    
  } catch (error) {
    appLog.error('dal', 'Failed to unlock database', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Chapter operations with encrypted content
export interface ChapterRow {
  chapter_id: string;
  book_id: string;
  version_id: string;
  owner_user_id: string;
  title?: string;
  order_index?: number;
  enc_scheme: string;
  content_enc: Uint8Array;
  content_iv: Uint8Array;
  has_proposals: number;
  rev_local?: string;
  rev_cloud?: string;
  pending_ops: number;
  sync_state: string;
  conflict_state: string;
  word_count?: number;
  character_count?: number;
  created_at?: number;
  updated_at?: number;
}

export async function getChapter(chapterId: string, userId: string): Promise<ChapterRow | null> {
  const database = await initializeDatabase();
  const result = await database.select<ChapterRow[]>('SELECT * FROM chapters WHERE chapter_id = ? AND owner_user_id = ?', [chapterId, userId]);
  return result.length > 0 ? result[0] : null;
}

export async function putChapter(data: ChapterRow): Promise<void> {
  try {
    const database = await initializeDatabase();
    
    // Log the title being saved
    appLog.info('dal', 'putChapter called with data', {
      chapterId: data.chapter_id,
      title: data.title,
      bookId: data.book_id,
      versionId: data.version_id
    });
    
    // Ensure required fields have values (schema requires NOT NULL)
    const now = Date.now();
    
    // Handle undefined/null values for optional fields
    const params = [
      data.chapter_id, 
      data.book_id, 
      data.version_id, 
      data.owner_user_id, 
      data.title || 'Untitled Chapter', 
      data.order_index || 0, 
      data.enc_scheme, 
      data.content_enc, 
      data.content_iv, 
      data.has_proposals || 0, 
      data.rev_local || null, 
      data.rev_cloud || null, 
      data.pending_ops || 0, 
      data.sync_state || 'dirty', 
      data.conflict_state || 'none', 
      data.word_count || 0, 
      data.character_count || 0, 
      data.created_at || now, // Ensure NOT NULL constraint is satisfied
      data.updated_at || now  // Ensure NOT NULL constraint is satisfied
    ];
    
    appLog.info('dal', 'putChapter final title value', {
      chapterId: data.chapter_id,
      originalTitle: data.title,
      finalTitle: data.title || 'Untitled Chapter'
    });
    
    await database.execute(
      `INSERT OR REPLACE INTO chapters 
       (chapter_id, book_id, version_id, owner_user_id, title, order_index, enc_scheme, content_enc, content_iv, has_proposals, rev_local, rev_cloud, pending_ops, sync_state, conflict_state, word_count, character_count, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );
    appLog.info('dal', 'Chapter saved', { chapterId: data.chapter_id, wordCount: data.word_count, characterCount: data.character_count });
  } catch (error) {
    appLog.error('dal', 'Error saving chapter to database', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      chapterId: data.chapter_id 
    });
    throw error;
  }
}

export async function updateChapterSyncState(chapterId: string, userId: string, syncState: SyncState): Promise<void> {
  try {
    const database = await initializeDatabase();
    await database.execute(
      'UPDATE chapters SET sync_state = ?, updated_at = ? WHERE chapter_id = ? AND owner_user_id = ?',
      [syncState, Date.now(), chapterId, userId]
    );
    appLog.info('dal', 'Chapter sync state updated', { chapterId, syncState });
  } catch (error) {
    appLog.error('dal', 'Error updating chapter sync state', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      chapterId 
    });
    throw error;
  }
}

export async function updateChapterConflictState(chapterId: string, userId: string, conflictState: ConflictState): Promise<void> {
  try {
    const database = await initializeDatabase();
    await database.execute(
      'UPDATE chapters SET conflict_state = ?, updated_at = ? WHERE chapter_id = ? AND owner_user_id = ?',
      [conflictState, Date.now(), chapterId, userId]
    );
    appLog.info('dal', 'Chapter conflict state updated', { chapterId, conflictState });
  } catch (error) {
    appLog.error('dal', 'Error updating chapter conflict state', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      chapterId 
    });
    throw error;
  }
}

export async function getChaptersByVersion(bookId: string, versionId: string, userId: string): Promise<ChapterRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<ChapterRow[]>(
    'SELECT * FROM chapters WHERE book_id = ? AND version_id = ? AND owner_user_id = ? ORDER BY order_index ASC', 
    [bookId, versionId, userId]
  );
  return result;
}

export async function getDirtyChapters(userId: string): Promise<ChapterRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<ChapterRow[]>('SELECT * FROM chapters WHERE owner_user_id = ? AND sync_state = ?', [userId, 'dirty']);
  return result;
}

// Grant operations
export interface GrantRow {
  grant_id: string;
  owner_user_id: string;
  book_id: string;
  issuer_user_id: string;
  bsk_wrap_for_me: Uint8Array;
  perms: string;
  revoked: number;
  issued_at: number;
  updated_at: number;
}

export async function getGrants(userId: string): Promise<GrantRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<GrantRow[]>('SELECT * FROM grants WHERE owner_user_id = ? AND revoked = 0', [userId]);
  return result;
}

export async function putGrant(data: GrantRow): Promise<void> {
  try {
    const database = await initializeDatabase();
    
    // Handle parameters (no optional fields in GrantRow, but maintaining consistency)
    const params = [
      data.grant_id, 
      data.owner_user_id, 
      data.book_id, 
      data.issuer_user_id, 
      data.bsk_wrap_for_me, 
      data.perms, 
      data.revoked, 
      data.issued_at, 
      data.updated_at
    ];
    
    await database.execute(
      `INSERT OR REPLACE INTO grants 
       (grant_id, owner_user_id, book_id, issuer_user_id, bsk_wrap_for_me, perms, revoked, issued_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );
    appLog.info('dal', 'Grant updated', { grantId: data.grant_id, bookId: data.book_id });
  } catch (error) {
    appLog.error('dal', 'Error saving grant to database', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      grantId: data.grant_id 
    });
    throw error;
  }
}

// Utility functions
export async function computeRevisionHash(content: any): Promise<string> {
  const contentString = JSON.stringify(content);
  const encoder = new TextEncoder();
  const data = encoder.encode(contentString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
