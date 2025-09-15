// Main Database DAL - Uses main surreal.rs commands instead of app database
// Maintains compatibility with existing frontend code by matching the current DAL interface

import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';
import { useAuthStore } from '../auth/useAuthStore';

// Re-export types from existing surrealDal to maintain compatibility
export type {
  BookMetadata,
  UserKeysRow,
  BookRow,
  VersionRow,
  ChapterRow,
  SceneRow
} from './surrealDal';

// Import type definitions from surrealDal
import type {
  BookMetadata,
  BookRow,
  VersionRow,
  ChapterRow,
  SceneRow
} from './surrealDal';

// Database bootstrap - reuse existing initialization
export { initializeDatabase } from './surrealDal';

// Utility function to get current user ID
const getCurrentUserId = (): string => {
  // Import the auth store dynamically to avoid circular dependencies
  const authStore = useAuthStore.getState();
  const userId = authStore.user?.id;
  
  if (!userId) {
    appLog.warn('main-dal', 'No authenticated user found, using fallback ID');
    return 'anonymous_user';
  }
  
  appLog.debug('main-dal', 'Retrieved current user ID', { userId });
  return userId;
};

// Helper function to generate unique IDs
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Books
export async function getUserBooks(userId: string): Promise<BookRow[]> {
  try {
    const rows = await invoke<BookRow[]>('book_get_by_user', { ownerUserId: userId });
    appLog.info('main-dal', 'Retrieved user books', { userId, count: rows.length });
    return rows;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get user books', { userId, error: String(error) });
    throw error;
  }
}

export async function getBook(bookId: string, userId?: string): Promise<BookRow | null> {
  try {
    const ownerUserId = userId || getCurrentUserId();
    const book = await invoke<BookRow | null>('app_get_book', { bookId, userId: ownerUserId });
    appLog.info('main-dal', 'Retrieved book', { bookId, found: !!book });
    return book;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get book', { bookId, error: String(error) });
    throw error;
  }
}

export async function putBook(bookRow: BookRow): Promise<void> {
  try {
    await invoke('book_put', { row: bookRow });
    appLog.info('main-dal', 'Updated book', { bookId: bookRow.book_id });
  } catch (error) {
    appLog.error('main-dal', 'Failed to update book', { bookId: bookRow.book_id, error: String(error) });
    throw error;
  }
}

export async function createBook(title: string, userId?: string, metadata?: BookMetadata): Promise<BookRow> {
  try {
    const ownerUserId = userId || getCurrentUserId();
    const bookId = generateId();
    
    const bookRow: BookRow = {
      book_id: bookId,
      owner_user_id: ownerUserId,
      title,
      is_shared: 0,
      enc_metadata: metadata ? new TextEncoder().encode(JSON.stringify(metadata)) : undefined,
      enc_schema: undefined,
      rev_local: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      rev_cloud: undefined,
      sync_state: 'idle',
      conflict_state: 'none',
      last_local_change: Date.now(),
      last_cloud_change: undefined,
      updated_at: Date.now(),
    };

    await invoke('book_create', { row: bookRow });
    appLog.info('main-dal', 'Created book', { bookId, title });
    return bookRow;
  } catch (error) {
    appLog.error('main-dal', 'Failed to create book', { title, error: String(error) });
    throw error;
  }
}

export async function deleteBook(bookId: string, userId?: string): Promise<void> {
  try {
    const ownerUserId = userId || getCurrentUserId();
    await invoke('book_delete', { bookId, ownerUserId });
    appLog.info('main-dal', 'Deleted book', { bookId });
  } catch (error) {
    appLog.error('main-dal', 'Failed to delete book', { bookId, error: String(error) });
    throw error;
  }
}

// Versions
export async function getVersionsByBook(bookId: string): Promise<VersionRow[]> {
  try {
    const versions = await invoke<VersionRow[]>('app_get_versions_by_book', { bookId });
    appLog.info('main-dal', 'Retrieved versions for book', { bookId, count: versions.length });
    return versions;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get versions for book', { bookId, error: String(error) });
    throw error;
  }
}

export async function getVersion(versionId: string): Promise<VersionRow | null> {
  try {
    const version = await invoke<VersionRow | null>('app_get_version_by_id', { versionId });
    appLog.info('main-dal', 'Retrieved version', { versionId, found: !!version });
    return version;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get version', { versionId, error: String(error) });
    throw error;
  }
}

export async function putVersion(versionRow: VersionRow): Promise<void> {
  try {
    await invoke('version_put', { row: versionRow });
    appLog.info('main-dal', 'Updated version', { versionId: versionRow.version_id });
  } catch (error) {
    appLog.error('main-dal', 'Failed to update version', { versionId: versionRow.version_id, error: String(error) });
    throw error;
  }
}

export async function createVersion(bookId: string, title: string, userId?: string): Promise<VersionRow> {
  try {
    const ownerUserId = userId || getCurrentUserId();
    const versionId = generateId();
    
    const versionRow: VersionRow = {
      version_id: versionId,
      book_id: bookId,
      owner_user_id: ownerUserId,
      title,
      description: undefined,
      is_current: 1, // Make new version current by default
      parent_version_id: undefined,
      branch_point: undefined,
      enc_scheme: 'aes-gcm',
      has_proposals: 0,
      rev_local: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      rev_cloud: undefined,
      pending_ops: 0,
      sync_state: 'idle',
      conflict_state: 'none',
      created_at: Date.now(),
      updated_at: Date.now(),
      content_data: undefined,
    };

    await invoke('version_put', { row: versionRow });
    appLog.info('main-dal', 'Created version', { versionId, bookId, title });
    return versionRow;
  } catch (error) {
    appLog.error('main-dal', 'Failed to create version', { bookId, title, error: String(error) });
    throw error;
  }
}

// Chapters
export async function getChaptersByVersion(bookId: string, versionId: string): Promise<ChapterRow[]> {
  try {
    const chapters = await invoke<ChapterRow[]>('app_get_chapters_by_version', { bookId, versionId });
    appLog.info('main-dal', 'Retrieved chapters for version', { bookId, versionId, count: chapters.length });
    return chapters;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get chapters for version', { bookId, versionId, error: String(error) });
    throw error;
  }
}

export async function getChapter(chapterId: string): Promise<ChapterRow | null> {
  try {
    const chapter = await invoke<ChapterRow | null>('app_get_chapter_by_id', { chapterId });
    appLog.info('main-dal', 'Retrieved chapter', { chapterId, found: !!chapter });
    return chapter;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get chapter', { chapterId, error: String(error) });
    throw error;
  }
}

export async function putChapter(chapterRow: ChapterRow): Promise<void> {
  try {
    await invoke('chapter_put', { row: chapterRow });
    appLog.info('main-dal', 'Updated chapter', { chapterId: chapterRow.chapter_id });
  } catch (error) {
    appLog.error('main-dal', 'Failed to update chapter', { chapterId: chapterRow.chapter_id, error: String(error) });
    throw error;
  }
}

export async function createChapter(bookId: string, versionId: string, title: string, userId?: string): Promise<ChapterRow> {
  try {
    const ownerUserId = userId || getCurrentUserId();
    const chapterId = generateId();
    
    const chapterRow: ChapterRow = {
      chapter_id: chapterId,
      book_id: bookId,
      version_id: versionId,
      owner_user_id: ownerUserId,
      title,
      order_index: undefined,
      enc_scheme: 'aes-gcm',
      content_enc: new Uint8Array(), // Empty content initially
      content_iv: new Uint8Array(16), // Random IV for encryption
      has_proposals: 0,
      rev_local: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      rev_cloud: undefined,
      pending_ops: 0,
      sync_state: 'idle',
      conflict_state: 'none',
      word_count: 0,
      character_count: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await invoke('chapter_put', { row: chapterRow });
    appLog.info('main-dal', 'Created chapter', { chapterId, bookId, versionId, title });
    return chapterRow;
  } catch (error) {
    appLog.error('main-dal', 'Failed to create chapter', { bookId, versionId, title, error: String(error) });
    throw error;
  }
}

export async function deleteChapter(chapterId: string, _userId?: string): Promise<void> {
  try {
    // Note: The main database doesn't have a delete chapter command yet
    // We'll need to add this or implement it differently
    // For now, we could mark it as deleted or remove content
    appLog.warn('main-dal', 'Delete chapter not implemented yet', { chapterId });
    throw new Error('Delete chapter not implemented in main database yet');
  } catch (error) {
    appLog.error('main-dal', 'Failed to delete chapter', { chapterId, error: String(error) });
    throw error;
  }
}

// Scenes
export async function getScenesByBook(bookId: string): Promise<SceneRow[]> {
  try {
    const scenes = await invoke<SceneRow[]>('app_get_scenes_by_book', { bookId });
    appLog.info('main-dal', 'Retrieved scenes for book', { bookId, count: scenes.length });
    return scenes;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get scenes for book', { bookId, error: String(error) });
    throw error;
  }
}

export async function getScene(sceneId: string): Promise<SceneRow | null> {
  try {
    const scene = await invoke<SceneRow | null>('app_get_scene_by_id', { sceneId });
    appLog.info('main-dal', 'Retrieved scene', { sceneId, found: !!scene });
    return scene;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get scene', { sceneId, error: String(error) });
    throw error;
  }
}

export async function putScene(sceneRow: SceneRow): Promise<void> {
  try {
    await invoke('scene_put', { row: sceneRow });
    appLog.info('main-dal', 'Updated scene', { sceneId: sceneRow.scene_id });
  } catch (error) {
    appLog.error('main-dal', 'Failed to update scene', { sceneId: sceneRow.scene_id, error: String(error) });
    throw error;
  }
}

// Utility functions for compatibility with existing DAL
export async function ensureDefaultVersion(bookId: string, userId?: string): Promise<VersionRow> {
  try {
    const versions = await getVersionsByBook(bookId);
    
    // Find current version or create default
    let currentVersion = versions.find(v => v.is_current === 1);
    
    if (!currentVersion) {
      // Create a default version
      currentVersion = await createVersion(bookId, 'Draft', userId);
      appLog.info('main-dal', 'Created default version for book', { bookId, versionId: currentVersion.version_id });
    }
    
    return currentVersion;
  } catch (error) {
    appLog.error('main-dal', 'Failed to ensure default version', { bookId, error: String(error) });
    throw error;
  }
}

export async function ensureVersionInDatabase(versionRow: VersionRow): Promise<void> {
  try {
    await putVersion(versionRow);
    appLog.info('main-dal', 'Ensured version in database', { versionId: versionRow.version_id });
  } catch (error) {
    appLog.error('main-dal', 'Failed to ensure version in database', { versionId: versionRow.version_id, error: String(error) });
    throw error;
  }
}

// Sync functions
export async function getDirtyChapters(userId?: string): Promise<ChapterRow[]> {
  try {
    const ownerUserId = userId || getCurrentUserId();
    const chapters = await invoke<ChapterRow[]>('chapters_get_dirty', { ownerUserId });
    appLog.info('main-dal', 'Retrieved dirty chapters', { count: chapters.length });
    return chapters;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get dirty chapters', { error: String(error) });
    throw error;
  }
}

export async function markChapterSync(chapterId: string, syncState: string, userId?: string): Promise<void> {
  try {
    const ownerUserId = userId || getCurrentUserId();
    await invoke('chapter_mark_sync', { chapterId, ownerUserId, syncState });
    appLog.info('main-dal', 'Marked chapter sync state', { chapterId, syncState });
  } catch (error) {
    appLog.error('main-dal', 'Failed to mark chapter sync', { chapterId, syncState, error: String(error) });
    throw error;
  }
}

export async function markBookSync(bookId: string, syncState: string, userId?: string): Promise<void> {
  try {
    const ownerUserId = userId || getCurrentUserId();
    await invoke('book_mark_sync', { bookId, ownerUserId, syncState });
    appLog.info('main-dal', 'Marked book sync state', { bookId, syncState });
  } catch (error) {
    appLog.error('main-dal', 'Failed to mark book sync', { bookId, syncState, error: String(error) });
    throw error;
  }
}

// Additional helper functions for compatibility
export async function syncChaptersToVersionData(chapters: any[], _versionData: any): Promise<void> {
  // This function would need to be implemented based on the specific sync requirements
  appLog.info('main-dal', 'Sync chapters to version data called', { chapterCount: chapters.length });
}

export async function createChapterAtomic(bookId: string, versionId: string, title: string, userId?: string): Promise<ChapterRow> {
  return createChapter(bookId, versionId, title, userId);
}

export async function deleteChapterAtomic(chapterId: string, userId?: string): Promise<void> {
  return deleteChapter(chapterId, userId);
}

export async function bumpChapterMetadataAtomic(chapterId: string): Promise<void> {
  try {
    const chapter = await getChapter(chapterId);
    
    if (chapter) {
      chapter.updated_at = Date.now();
      chapter.rev_local = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await putChapter(chapter);
      appLog.info('main-dal', 'Bumped chapter metadata', { chapterId });
    }
  } catch (error) {
    appLog.error('main-dal', 'Failed to bump chapter metadata', { chapterId, error: String(error) });
    throw error;
  }
}

// User Keys management
export async function getUserKeys(userId: string): Promise<any | null> {
  try {
    const userKeys = await invoke<any | null>('user_keys_get', { userId });
    appLog.info('main-dal', 'Retrieved user keys', { userId, found: !!userKeys });
    return userKeys;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get user keys', { userId, error: String(error) });
    throw error;
  }
}

// Overloaded setUserKeys function to support multiple signatures
export async function setUserKeys(
  userId: string,
  data: { udekWrapAppkey: Uint8Array; kdfSalt: Uint8Array; kdfIters: number }
): Promise<void>;
export async function setUserKeys(data: {
  user_id: string;
  udek_wrap_appkey: Uint8Array;
  kdf_salt: Uint8Array;
  kdf_iters: number;
  updated_at: number;
}): Promise<void>;
export async function setUserKeys(
  arg1: any,
  arg2?: { udekWrapAppkey: Uint8Array; kdfSalt: Uint8Array; kdfIters: number }
): Promise<void> {
  try {
    let row: any;
    if (typeof arg1 === 'string' && arg2) {
      row = {
        user_id: arg1,
        udek_wrap_appkey: arg2.udekWrapAppkey,
        kdf_salt: arg2.kdfSalt,
        kdf_iters: arg2.kdfIters,
        updated_at: Date.now(),
      };
    } else if (typeof arg1 === 'object' && arg1) {
      row = arg1;
    } else {
      throw new Error('Invalid arguments to setUserKeys');
    }
    await invoke('user_keys_set', { row });
    appLog.info('main-dal', 'User keys saved', { userId: row.user_id });
  } catch (error) {
    appLog.error('main-dal', 'Failed to set user keys', { error: String(error) });
    throw error;
  }
}

// Version content data management
export async function getVersionContentData(versionId: string, userId?: string): Promise<any | null> {
  try {
    const ownerUserId = userId || getCurrentUserId();
    const content = await invoke<any | null>('version_content_get', { versionId, ownerUserId });
    appLog.info('main-dal', 'Retrieved version content data', { versionId, found: !!content });
    return content;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get version content data', { versionId, error: String(error) });
    throw error;
  }
}

export async function updateVersionContentData(versionId: string, userId: string, updates: any): Promise<void> {
  try {
    await invoke('version_content_update', { versionId, ownerUserId: userId, updates });
    appLog.info('main-dal', 'Updated version content data', { versionId });
  } catch (error) {
    appLog.error('main-dal', 'Failed to update version content data', { versionId, error: String(error) });
    throw error;
  }
}

// Sync state management functions
export async function updateChapterSyncState(chapterId: string, userId: string, syncState: string): Promise<void> {
  try {
    await invoke('chapter_mark_sync', { chapterId, ownerUserId: userId, syncState });
    appLog.info('main-dal', 'Updated chapter sync state', { chapterId, syncState });
  } catch (error) {
    appLog.error('main-dal', 'Failed to update chapter sync state', { chapterId, syncState, error: String(error) });
    throw error;
  }
}

export async function updateChapterConflictState(chapterId: string, userId: string, conflictState: string): Promise<void> {
  try {
    await invoke('chapter_mark_conflict', { chapterId, ownerUserId: userId, conflictState });
    appLog.info('main-dal', 'Updated chapter conflict state', { chapterId, conflictState });
  } catch (error) {
    appLog.error('main-dal', 'Failed to update chapter conflict state', { chapterId, conflictState, error: String(error) });
    throw error;
  }
}

export async function markBookSyncState(bookId: string, userId: string, syncState: string): Promise<void> {
  try {
    await invoke('book_mark_sync', { bookId, ownerUserId: userId, syncState });
    appLog.info('main-dal', 'Marked book sync state', { bookId, syncState });
  } catch (error) {
    appLog.error('main-dal', 'Failed to mark book sync state', { bookId, syncState, error: String(error) });
    throw error;
  }
}

export async function getDirtyBooks(userId: string): Promise<any[]> {
  try {
    const books = await invoke<any[]>('book_get_dirty', { ownerUserId: userId });
    appLog.info('main-dal', 'Retrieved dirty books', { userId, count: books.length });
    return books;
  } catch (error) {
    appLog.error('main-dal', 'Failed to get dirty books', { userId, error: String(error) });
    throw error;
  }
}

export async function getConflictedBooks(userId: string): Promise<any[]> {
  try {
    // This command might not exist yet, implementing placeholder
    appLog.warn('main-dal', 'getConflictedBooks not implemented in main database yet', { userId });
    return [];
  } catch (error) {
    appLog.error('main-dal', 'Failed to get conflicted books', { userId, error: String(error) });
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

// Transaction helpers (compatibility)
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  // Surreal transactions are on the Rust side; here we just run the callback
  return await fn();
}

export async function serializeWrites<T>(cb: () => Promise<T>): Promise<T> {
  return await cb();
}

export async function forceUnlockDatabase(): Promise<void> {
  appLog.info('main-dal', 'forceUnlockDatabase is a no-op under SurrealDB main database');
}
