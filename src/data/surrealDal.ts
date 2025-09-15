// SurrealDB-backed DAL accessed via Tauri commands
// Mirrors original dal.ts signatures to minimize UI changes

// Dexie migration: SurrealDB code removed. Use dexieDal.ts for DB operations.

// Types mirrored from existing DAL
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

export interface UserKeysRow {
  id: number;
  user_id: string;
  udek_wrap_appkey: Uint8Array;
  kdf_salt: Uint8Array;
  kdf_iters: number;
  updated_at: number;
}

export interface BookRow {
  book_id: string;
  owner_user_id: string;
  title: string;
  is_shared: number;
  // Optional cover fields to store asset references
  cover_image?: string;
  cover_image_ref?: any;
  cover_images?: string[];
  enc_metadata?: Uint8Array;
  enc_schema?: string;
  // Access permissions
  is_authored?: number;    // User is the author
  is_editable?: number;    // User can edit
  is_reviewable?: number;  // User can review
  access_role?: string;    // "author", "editor", "reviewer", "reader"
  // Sync fields
  rev_local?: string;
  rev_cloud?: string;
  sync_state: string;
  conflict_state: string;
  last_local_change?: number;
  last_cloud_change?: number;
  updated_at?: number;
}

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
  content_data?: string;
}

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

export type SyncState = 'idle' | 'dirty' | 'syncing' | 'error';
export type ConflictState = 'none' | 'local' | 'remote' | 'both';

// Database bootstrap
// Database bootstrap
  // Dexie migration: No DB bootstrap needed. Dexie handles DB creation automatically.
  return;
}

// Books
  // Dexie migration: Use dexieDal.ts
  // return await db.books.where('owner_user_id').equals(userId).toArray();
  throw new Error('getUserBooks: migrated to dexieDal.ts');
}

  throw new Error('getBook: migrated to dexieDal.ts');
}

  throw new Error('putBook: migrated to dexieDal.ts');
}

  throw new Error('deleteBook: migrated to dexieDal.ts');
}

  throw new Error('markBookSyncState: migrated to dexieDal.ts');
}

  throw new Error('getDirtyBooks: migrated to dexieDal.ts');
}

  throw new Error('getConflictedBooks: migrated to dexieDal.ts');
// ...existing code...
}

  throw new Error('getDirtyChapters: migrated to dexieDal.ts');
}

  throw new Error('updateChapterSyncState: migrated to dexieDal.ts');
}

  throw new Error('updateChapterConflictState: migrated to dexieDal.ts');
}

// Scenes
  throw new Error('getScene: migrated to dexieDal.ts');
}

  throw new Error('putScene: migrated to dexieDal.ts');
}

  throw new Error('getScenesByBook: migrated to dexieDal.ts');
}

  throw new Error('getDirtyScenes: migrated to dexieDal.ts');
}

  throw new Error('markSceneSyncState: migrated to dexieDal.ts');
}

  throw new Error('markSceneConflict: migrated to dexieDal.ts');
}

// User Keys (now stored in Surreal)
  throw new Error('getUserKeys: migrated to Tauri Store or local storage');
}

// Overloaded to support both historical signatures:
// 1) setUserKeys({ user_id, udek_wrap_appkey, kdf_salt, kdf_iters, updated_at })
// 2) setUserKeys(userId, { udekWrapAppkey, kdfSalt, kdfIters })
  throw new Error('setUserKeys: migrated to Tauri Store or local storage');
}

// Compatibility helpers used by existing DAL
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  // Surreal transactions are on the Rust side; here we just run the callback.
  return await fn();
}

export async function serializeWrites<T>(cb: () => Promise<T>): Promise<T> {
  return await cb();
}

// Grants
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

  throw new Error('getGrants: migrated to dexieDal.ts');
}

  throw new Error('putGrant: migrated to dexieDal.ts');
}

// Helpers used around chapters/versions
  throw new Error('syncChaptersToVersionData: migrated to dexieDal.ts');
}

  throw new Error('ensureDefaultVersion: migrated to dexieDal.ts');
}

  throw new Error('ensureVersionInDatabase: migrated to dexieDal.ts');
}

  throw new Error('forceUnlockDatabase: migrated to dexieDal.ts');
}

// Atomic helpers for chapters
  throw new Error('createChapterAtomic: migrated to dexieDal.ts');
}

  throw new Error('deleteChapterAtomic: migrated to dexieDal.ts');
}

  throw new Error('bumpChapterMetadataAtomic: migrated to dexieDal.ts');
}


// ---------------------------------------------------------------------------
// Utility functions
export async function computeRevisionHash(content: any): Promise<string> {
  const contentString = JSON.stringify(content);
  const encoder = new TextEncoder();
  const data = encoder.encode(contentString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}