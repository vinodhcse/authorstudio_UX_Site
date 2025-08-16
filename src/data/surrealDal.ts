// SurrealDB-backed DAL accessed via Tauri commands
// Mirrors original dal.ts signatures to minimize UI changes

import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { appLog } from '../auth/fileLogger';

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
export async function initializeDatabase(): Promise<void> {
  // Use Tauri's app dataDir for persistent SurrealDB storage
  const dir = await appDataDir();
  const dbPath = `${dir}surreal.db`;
  appLog.info('surreal-dal', 'Initializing SurrealDB', { dbPath });
  try {
    const res = await invoke('surreal_init_db', { path: dbPath });
    appLog.info('surreal-dal', 'surreal_init_db invoke returned', { res });
  } catch (err) {
    appLog.error('surreal-dal', 'surreal_init_db invoke failed', { error: String(err), dbPath });
    throw err;
  }
}

// Books
export async function getUserBooks(userId: string): Promise<BookRow[]> {
  appLog.info('surreal-dal', 'Calling book_get_by_user with userId', { userId });
  const rows = await invoke<BookRow[]>('book_get_by_user', { ownerUserId: userId });
  return rows;
}

export async function getBook(bookId: string, userId: string): Promise<BookRow | null> {
  const row = await invoke<BookRow | null>('book_get', { bookId, ownerUserId: userId });
  return row;
}

export async function putBook(data: BookRow): Promise<void> {
  // Convert number fields to i64-compatible where needed is handled in Rust via serde
  appLog.info('surreal-dal', 'Calling book_put with row', { bookId: data.book_id, title: data.title, hasCoverRef: Boolean((data as any).cover_image_ref) });
  await invoke('book_put', { row: data });
}

export async function deleteBook(bookId: string, userId: string): Promise<void> {
  await invoke('book_delete', { bookId, ownerUserId: userId });
}

export async function markBookSyncState(bookId: string, userId: string, syncState: SyncState): Promise<void> {
  await invoke('book_mark_sync', { bookId, ownerUserId: userId, syncState });
}

export async function getDirtyBooks(userId: string): Promise<BookRow[]> {
  return await invoke<BookRow[]>('book_get_dirty', { ownerUserId: userId });
}

export async function getConflictedBooks(userId: string): Promise<BookRow[]> {
  // Surreal query directly since a dedicated command isn't strictly necessary
  const rows = await invoke<any>('surreal_query', {
    query: "SELECT * FROM book WHERE owner_user_id = $uid AND conflict_state != 'none'",
    vars: { uid: userId },
  });
  return rows as BookRow[];
}

// Versions
export async function getVersion(versionId: string, userId: string): Promise<VersionRow | null> {
  return await invoke<VersionRow | null>('version_get', { versionId, ownerUserId: userId });
}

export async function getVersionsByBook(bookId: string, userId: string): Promise<VersionRow[]> {
  return await invoke<VersionRow[]>('versions_by_book', { bookId, ownerUserId: userId });
}

export async function putVersion(data: VersionRow): Promise<void> {
  await invoke('version_put', { row: data });
}

// Version content JSON helpers
export interface VersionContentData {
  version?: string;
  chapters?: any[];
  characters?: any[];
  worlds?: any[];
  plotArcs?: any[];
  [key: string]: any;
}

export async function getVersionContentData(versionId: string, userId: string): Promise<VersionContentData | null> {
  const v = await invoke<any>('version_content_get', { versionId, ownerUserId: userId });
  return v ?? null;
}

export async function updateVersionContentData(versionId: string, userId: string, updates: Partial<VersionContentData>): Promise<void> {
  await invoke('version_content_update', { versionId, ownerUserId: userId, updates });
}

// Chapters
export async function getChapter(chapterId: string, userId: string): Promise<ChapterRow | null> {
  return await invoke<ChapterRow | null>('chapter_get', { chapterId, ownerUserId: userId });
}

export async function putChapter(data: ChapterRow): Promise<void> {
  await invoke('chapter_put', { row: data });
}

export async function getChaptersByVersion(bookId: string, versionId: string, userId: string): Promise<ChapterRow[]> {
  return await invoke<ChapterRow[]>('chapters_by_version', { bookId, versionId, ownerUserId: userId });
}

export async function getDirtyChapters(userId: string): Promise<ChapterRow[]> {
  return await invoke<ChapterRow[]>('chapters_get_dirty', { ownerUserId: userId });
}

export async function updateChapterSyncState(chapterId: string, userId: string, syncState: SyncState): Promise<void> {
  await invoke('chapter_mark_sync', { chapterId, ownerUserId: userId, syncState });
}

export async function updateChapterConflictState(chapterId: string, userId: string, conflictState: ConflictState): Promise<void> {
  await invoke('chapter_mark_conflict', { chapterId, ownerUserId: userId, conflictState });
}

// Scenes
export async function getScene(sceneId: string, userId: string): Promise<SceneRow | null> {
  return await invoke<SceneRow | null>('scene_get', { sceneId, ownerUserId: userId });
}

export async function putScene(data: SceneRow): Promise<void> {
  await invoke('scene_put', { row: data });
}

export async function getScenesByBook(bookId: string, userId: string): Promise<SceneRow[]> {
  return await invoke<SceneRow[]>('scenes_by_book', { bookId, ownerUserId: userId });
}

export async function getDirtyScenes(userId: string): Promise<SceneRow[]> {
  return await invoke<SceneRow[]>('scenes_get_dirty', { ownerUserId: userId });
}

export async function markSceneSyncState(sceneId: string, userId: string, syncState: SyncState): Promise<void> {
  await invoke('scene_mark_sync', { sceneId, ownerUserId: userId, syncState });
}

export async function markSceneConflict(sceneId: string, userId: string, conflictState: ConflictState): Promise<void> {
  await invoke('scene_mark_conflict', { sceneId, ownerUserId: userId, conflictState });
}

// User Keys (now stored in Surreal)
export async function getUserKeys(userId: string): Promise<UserKeysRow | null> {
  // ...existing code...
  return (await invoke<UserKeysRow | null>('user_keys_get', { userId })) ?? null;
}

// Overloaded to support both historical signatures:
// 1) setUserKeys({ user_id, udek_wrap_appkey, kdf_salt, kdf_iters, updated_at })
// 2) setUserKeys(userId, { udekWrapAppkey, kdfSalt, kdfIters })
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
  // ...existing code...
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
  await appLog.info('dal', 'User keys saved', { userId: row.user_id });
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

export async function getGrants(userId: string): Promise<GrantRow[]> {
  // ...existing code...
  const rows = await invoke<any>('surreal_query', {
    query: "SELECT * FROM grants WHERE owner_user_id = $uid AND revoked = 0",
    vars: { uid: userId },
  });
  return rows as GrantRow[];
}

export async function putGrant(data: GrantRow): Promise<void> {
  // ...existing code...
  await invoke('surreal_query', {
    query: "UPDATE grants SET owner_user_id = $ouid, book_id = $bid, issuer_user_id = $iuid, bsk_wrap_for_me = $wrap, perms = $perms, revoked = $rev, issued_at = $iat, updated_at = $uat WHERE grant_id = $gid; IF none(SELECT * FROM grants WHERE grant_id = $gid) THEN CREATE grants SET grant_id = $gid, owner_user_id = $ouid, book_id = $bid, issuer_user_id = $iuid, bsk_wrap_for_me = $wrap, perms = $perms, revoked = $rev, issued_at = $iat, updated_at = $uat;",
    vars: {
      gid: data.grant_id,
      ouid: data.owner_user_id,
      bid: data.book_id,
      iuid: data.issuer_user_id,
      wrap: data.bsk_wrap_for_me,
      perms: data.perms,
      rev: data.revoked,
      iat: data.issued_at,
      uat: data.updated_at,
    },
  });
  await appLog.info('dal', 'Grant saved', { grantId: data.grant_id });
}

// Helpers used around chapters/versions
export async function syncChaptersToVersionData(
  bookId: string,
  versionId: string,
  userId: string
): Promise<void> {
  const chapterRows = await getChaptersByVersion(bookId, versionId, userId);
  const chapterMetadata = chapterRows
    .map((row) => ({
      id: row.chapter_id,
      title: row.title || 'Untitled Chapter',
      position: row.order_index || 0,
      createdAt: new Date(row.created_at || Date.now()).toISOString(),
      updatedAt: new Date(row.updated_at || Date.now()).toISOString(),
      linkedPlotNodeId: '',
      linkedAct: '',
      linkedOutline: '',
      linkedScenes: [],
      content: {
        type: 'doc' as const,
        content: [],
        metadata: {
          totalWords: row.word_count || 0,
          totalCharacters: row.character_count || 0,
        },
      },
      revisions: [],
      currentRevisionId: '',
      collaborativeState: {
        pendingChanges: [],
        needsReview: false,
        reviewerIds: [],
        approvedBy: [],
        rejectedBy: [],
        mergeConflicts: [],
      },
      syncState: row.sync_state as SyncState,
      conflictState: row.conflict_state as ConflictState,
      wordCount: row.word_count || 0,
      hasProposals: row.has_proposals === 1,
      characters: [],
      isComplete: false,
      status: 'DRAFT' as const,
      authorId: userId,
      lastModifiedBy: userId,
    }))
    .sort((a, b) => a.position - b.position);

  await updateVersionContentData(versionId, userId, { chapters: chapterMetadata });
  await appLog.info('dal', 'Synced chapters to version content_data', {
    bookId,
    versionId,
    chapterCount: chapterMetadata.length,
  });
}

export async function ensureDefaultVersion(bookId: string, userId: string): Promise<string> {
  const versions = await getVersionsByBook(bookId, userId);
  if (versions.length > 0) {
    await appLog.info('dal', 'Using existing version', { bookId, versionId: versions[0].version_id });
    return versions[0].version_id;
  }
  const versionId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();
  const defaultRow: VersionRow = {
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
    updated_at: now,
  } as VersionRow;
  await putVersion(defaultRow);
  await appLog.success('dal', 'Created default version', { bookId, versionId });
  return versionId;
}

export async function ensureVersionInDatabase(versionId: string, bookId: string, userId: string): Promise<boolean> {
  try {
    const v = await getVersion(versionId, userId);
    if (v) {
      await appLog.info('dal', 'Version exists', { versionId });
      return true;
    }
    const now = Date.now();
    const row: VersionRow = {
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
      updated_at: now,
    } as VersionRow;
    await putVersion(row);
    await appLog.success('dal', 'Created missing version', { versionId, bookId });
    return true;
  } catch (error) {
    await appLog.error('dal', 'Failed to ensure version', { versionId, error });
    return false;
  }
}

export async function forceUnlockDatabase(): Promise<void> {
  // ...existing code...
  await appLog.info('dal', 'forceUnlockDatabase is a no-op under SurrealDB');
}

// Atomic helpers for chapters
export async function createChapterAtomic(row: ChapterRow, userId: string): Promise<void> {
  await putChapter(row);
  await syncChaptersToVersionData(row.book_id, row.version_id, userId);
}

export async function deleteChapterAtomic(chapterId: string, versionId: string, userId: string): Promise<void> {
  const row = await getChapter(chapterId, userId);
  const bookId = row?.book_id;
  // Delete from Surreal
  await invoke('surreal_query', {
    query: "DELETE chapter WHERE chapter_id = $cid AND owner_user_id = $uid",
    vars: { cid: chapterId, uid: userId },
  });
  if (bookId) {
    await syncChaptersToVersionData(bookId, versionId, userId);
  }
}

export async function bumpChapterMetadataAtomic(
  chapterId: string,
  versionId: string,
  userId: string,
  opts: { wordCount?: number; charCount?: number; revLocal?: string }
): Promise<void> {
  await invoke('surreal_query', {
    query:
      "UPDATE chapter SET word_count = coalesce($wc, word_count), character_count = coalesce($cc, character_count), sync_state = 'dirty', rev_local = coalesce($rl, rev_local), updated_at = time::now() WHERE chapter_id = $cid AND owner_user_id = $uid;" +
      "UPDATE version SET updated_at = time::now() WHERE version_id = $vid AND owner_user_id = $uid;",
    vars: {
      wc: opts.wordCount ?? null,
      cc: opts.charCount ?? null,
      rl: opts.revLocal ?? null,
      cid: chapterId,
      vid: versionId,
      uid: userId,
    },
  });
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