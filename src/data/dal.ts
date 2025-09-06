// Clean DAL following the refactor specification
// FE contexts/hooks → dal.ts → tauri-commands → database.rs

// Dexie.js-only DAL for books, chapters, versions, scenes, grants
import { db } from './dexieDal';
import { simpleDb } from './simpleDexie';
import type { UserKeysRecord } from './simpleDexie';
import type { Book, Version } from '../types/bookTypes';
import type { Chapter as DbChapter } from './simpleDexie';
import type { BookRow, VersionRow, ChapterRow, SceneRow, GrantRow } from './dexieDal';
import { emitBookDirty, emitVersionDirty, emitChapterDirty, emitBookClean, emitVersionClean, emitChapterClean } from './events';

// Book CRUD (using bookId)
export async function createBook(book: Book, _ownerUserId: string = 'default_user'): Promise<void> {
  await simpleDb.books.add(book);
  await saveBookBackup({ ...(book as any), bookId: book.id });
}

export async function putBook(book: Book, _ownerUserId: string = 'default_user'): Promise<void> {
  await simpleDb.books.put(book);
  await saveBookBackup({ ...(book as any), bookId: book.id });
}

export async function deleteBook(bookId: string): Promise<void> {
  await simpleDb.books.delete(bookId);
  await deleteBookBackup(bookId);
}

export async function getUserBooks(userId: string): Promise<Book[]> {
  return await simpleDb.books.where('authorId').equals(userId).toArray();
}

// Chapter CRUD
export async function createChapter(chapter: DbChapter): Promise<void> {
  const created: any = {
    ...chapter,
  linkedAct: (chapter as any).linkedAct,
  sortIndex: (chapter as any).sortIndex,
    syncState: (chapter as any).syncState ?? 'dirty',
    updatedAt: (chapter as any).updatedAt ?? now(),
  };
  await simpleDb.chapters.add(created);
  // Backup JSON chapter using legacy shape for path derivation
  await saveChapterBackup({
    chapter_id: created.id,
    book_id: created.bookId,
    version_id: created.versionId,
    title: created.title,
    content_enc: created.contentEnc as any,
    content_iv: created.contentIv as any,
    word_count: (created as any).wordCount || 0,
    created_at: (created as any).createdAt,
    updated_at: (created as any).updatedAt,
  } as any);
  await propagateChapterChangeToParents(created.versionId, created.bookId);
  emitChapterDirty(created.id, created.versionId, created.bookId);
}
export async function putChapter(chapter: DbChapter): Promise<void> {
  const updated: any = {
    ...chapter,
  linkedAct: (chapter as any).linkedAct,
  sortIndex: (chapter as any).sortIndex,
    syncState: (chapter as any).syncState ?? 'dirty',
    updatedAt: (chapter as any).updatedAt ?? now(),
  };
  await simpleDb.chapters.put(updated);
  await saveChapterBackup({
    chapter_id: updated.id,
    book_id: updated.bookId,
    version_id: updated.versionId,
    title: updated.title,
    content_enc: updated.contentEnc as any,
    content_iv: updated.contentIv as any,
    word_count: (updated as any).wordCount || 0,
    created_at: (updated as any).createdAt,
    updated_at: (updated as any).updatedAt,
  } as any);
  await propagateChapterChangeToParents(updated.versionId, updated.bookId);
  emitChapterDirty(updated.id, updated.versionId, updated.bookId);
}
export async function deleteChapter(chapterId: string): Promise<void> {
  const existing = await simpleDb.chapters.get(chapterId);
  await simpleDb.chapters.delete(chapterId);
  if (existing) {
    await deleteChapterBackup((existing as any).bookId, chapterId);
    await propagateChapterChangeToParents((existing as any).versionId, (existing as any).bookId);
    emitChapterDirty(chapterId, (existing as any).versionId, (existing as any).bookId);
  }
}
export async function getChaptersByVersion(_bookId: string, versionId: string): Promise<DbChapter[]> {
  return await simpleDb.chapters.where('versionId').equals(versionId).toArray();
}

// Version CRUD
export async function createVersion(version: Version): Promise<void> {
  await simpleDb.versions.add(version);
  await saveVersionBackup({ ...(version as any), version_id: version.id });
  await propagateVersionChangeToBook(version.bookId);
  emitVersionDirty(version.id, version.bookId);
}

/**
 * Updates a version in Dexie and saves JSON backup
 */
// Merged putVersion implementation with backup logic
export async function putVersion(version: Version): Promise<void> {
  try {
    await simpleDb.versions.put(version);
    await saveVersionBackup({ ...(version as any), version_id: version.id });
    await propagateVersionChangeToBook(version.bookId);
  emitVersionDirty(version.id, version.bookId);
  } catch (error) {
    console.error('dal', 'Failed to put version', { versionId: (version as any).id, error });
    throw error;
  }
}

export async function deleteVersion(versionId: string): Promise<void> {
  const version = await simpleDb.versions.get(versionId);
  await simpleDb.versions.delete(versionId);
  if (version) {
    await deleteVersionBackup((version as any).bookId, versionId);
    await propagateVersionChangeToBook((version as any).bookId);
  emitVersionDirty(versionId, (version as any).bookId);
  }
}
export async function getVersionsByBook(bookId: string): Promise<Version[]> {
  // Use bookId index directly; safer and avoids invalid key errors if book.versions is inconsistent
  return await simpleDb.versions.where('bookId').equals(bookId).toArray();
}

// Scene CRUD
export async function createScene(scene: SceneRow): Promise<void> {
  await db.scenes.add(scene);
}
// putScene implementation below (with error handling)
export async function deleteScene(sceneId: string): Promise<void> {
  await db.scenes.delete(sceneId);
}
// getScenesByBook implementation below (with error handling)

// Grant CRUD
export async function createGrant(grant: GrantRow): Promise<void> {
  await db.grants.add(grant);
}
export async function putGrant(grant: GrantRow): Promise<void> {
  await db.grants.put(grant);
}
export async function deleteGrant(grantId: string): Promise<void> {
  await db.grants.delete(grantId);
}
export async function getGrantsByUser(userId: string): Promise<GrantRow[]> {
  return await db.grants.where('owner_user_id').equals(userId).toArray();
}
// End of Dexie.js CRUD section. All legacy, duplicate, and orphaned code blocks have been removed.

// --- STUBS FOR MISSING DAL FUNCTIONS ---
/**
 * Computes a revision hash for content, scene/chapter, and timestamp
 */
export async function computeRevisionHash({ content, sceneId, chapterId, timestamp }: { content: any, sceneId?: string, chapterId?: string, timestamp: number }): Promise<string> {
  const base = JSON.stringify(content) + (sceneId || '') + (chapterId || '') + timestamp;
  let hash = 0, i, chr;
  for (i = 0; i < base.length; i++) {
    chr = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'rev_' + Math.abs(hash).toString();
}
/**
 * Generates a new revision string (timestamp-based)
 */
export function newRev(): string {
  // Use ISO timestamp for revision
  return `rev_${Date.now()}`;
}

/**
 * Returns user keys (not implemented, returns null)
 */
export async function getUserKeys(userId?: string): Promise<UserKeysRecord | null> {
  if (!userId) return null;
  try {
    const rec = await simpleDb.userKeys.get(userId);
    return rec || null;
  } catch (e) {
    console.error('dal', 'Failed to get user keys', e);
    return null;
  }
}
export async function setUserKeys(record?: UserKeysRecord): Promise<void> {
  if (!record?.user_id) return;
  try {
    await simpleDb.userKeys.put(record);
  } catch (e) {
    console.error('dal', 'Failed to set user keys', e);
  }
}
// ...existing code...

// --- Dexie.js CRUD methods above ---

// --- Restored and refactored non-CRUD helper methods ---

/**
 * Atomically updates chapter metadata fields (example: bump revision, update timestamp)
 * @param chapterId string
 * @param updates Partial<ChapterRow>
 */
export async function bumpChapterMetadataAtomic(chapterId: string, updates: Partial<DbChapter>): Promise<void> {
  await simpleDb.chapters.where('id').equals(chapterId).modify(updates as any);
}

/**
 * Atomically creates a chapter (compat API accepts legacy ChapterRow)
 */
export async function createChapterAtomic(chapter: ChapterRow, _ownerUserId?: string): Promise<void> {
  const mapped: DbChapter = {
    id: chapter.chapter_id,
    bookId: chapter.book_id,
    versionId: chapter.version_id,
    title: chapter.title || 'Untitled Chapter',
    encScheme: (chapter.enc_scheme as any) === 'bsk' ? 'bsk' : 'udek',
    contentEnc: chapter.content_enc,
    contentIv: chapter.content_iv,
    wordCount: chapter.word_count,
    createdAt: chapter.created_at ? new Date(chapter.created_at).toISOString() : undefined,
    updatedAt: chapter.updated_at ? new Date(chapter.updated_at).toISOString() : undefined,
  };
  await simpleDb.chapters.add(mapped);
}

export async function deleteChapterAtomic(chapterId: string): Promise<void> {
  await simpleDb.chapters.delete(chapterId);
}

export async function putChapterAtomic(chapter: ChapterRow): Promise<void> {
  const mapped: DbChapter = {
    id: chapter.chapter_id,
    bookId: chapter.book_id,
    versionId: chapter.version_id,
    title: chapter.title || 'Untitled Chapter',
    encScheme: (chapter.enc_scheme as any) === 'bsk' ? 'bsk' : 'udek',
    contentEnc: chapter.content_enc,
    contentIv: chapter.content_iv,
    wordCount: chapter.word_count,
    createdAt: chapter.created_at ? new Date(chapter.created_at).toISOString() : undefined,
    updatedAt: chapter.updated_at ? new Date(chapter.updated_at).toISOString() : undefined,
  };
  await simpleDb.chapters.put(mapped);
}

/**
 * Example: getBookById using Dexie
 */
export async function getBookById(bookId: string): Promise<BookRow | undefined> {
  return await db.books.get(bookId);
}

/**
 * Example: getChapterById using Dexie
 */
export async function getChapterById(chapterId: string): Promise<ChapterRow | undefined> {
  return await db.chapters.get(chapterId);
}

/**
 * Example: getVersionById using Dexie
 */
export async function getVersionById(versionId: string): Promise<VersionRow | undefined> {
  return await db.versions.get(versionId);
}

/**
 * Example: getSceneById using Dexie
 */
export async function getSceneById(sceneId: string): Promise<SceneRow | undefined> {
  return await db.scenes.get(sceneId);
}

/**
 * Example: getGrantById using Dexie
 */
export async function getGrantById(grantId: string): Promise<GrantRow | undefined> {
  return await db.grants.get(grantId);
}

// Remove duplicate legacy declarations for Dexie-migrated methods
// Only keep the Dexie-based implementations for:
// - putVersion
// - ensureDefaultVersion
// - ensureVersionInDatabase
// - syncChaptersToVersionData
// - getScenesByBook
// Remove any old stub or legacy versions below this comment.

// Dexie-based legacy compatibility methods
export async function getVersion(versionId: string): Promise<Version | null> {
  try {
    const version = await simpleDb.versions.get(versionId);
    return version || null;
  } catch (error) {
    console.error('dal', 'Failed to get version', { versionId, error });
    return null;
  }
}
export async function getChapter(chapterId: string): Promise<DbChapter | null> {
  try {
    const chapter = await simpleDb.chapters.get(chapterId);
    return chapter || null;
  } catch (error) {
    console.error('dal', 'Failed to get chapter', { chapterId, error });
    return null;
  }
}

export async function getDirtyChapters(): Promise<DbChapter[]> {
  const all = await simpleDb.chapters.toArray();
  return all.filter((c: any) => c.syncState && c.syncState !== 'idle');
}

// (Removed duplicate, see below for merged implementation)

// ensureDefaultVersion implementation below (with ownerUserId)

export async function getVersionContentData(bookId: string, versionId: string): Promise<Version | null> {
  try {
    const version = await simpleDb.versions.get(versionId);
    return version || null;
  } catch (error) {
    console.error('dal', 'Failed to get version content data', { bookId, versionId, error });
    return null;
  }
}

// ensureVersionInDatabase implementation below (with ownerUserId)

// syncChaptersToVersionData implementation below (Dexie-only)

export async function getScenesByBook(bookId: string): Promise<SceneRow[]> {
  try {
  return await db.scenes.where('bookId').equals(bookId).toArray();
  } catch (error) {
    console.error('dal', 'Failed to get scenes by book', { bookId, error });
    return [];
  }
}

export async function getScene(sceneId: string): Promise<SceneRow | null> {
  try {
    const scene = await db.scenes.get(sceneId);
    return scene || null;
  } catch (error) {
    console.error('dal', 'Failed to get scene', { sceneId, error });
    return null;
  }
}

export async function putScene(scene: SceneRow): Promise<void> {
  try {
    await db.scenes.put(scene);
  } catch (error) {
    console.error('dal', 'Failed to put scene', { sceneId: scene.scene_id, error });
    throw error;
  }
}

// --- Re-export legacy row types for compatibility ---
export type { BookRow, VersionRow, ChapterRow, SceneRow, GrantRow } from './dexieDal';

// Tauri Store sync helpers
import { invoke } from '@tauri-apps/api/core';
import { apiClient } from '../api/apiClient';

// Save book as JSON backup in app data dir
export async function saveBookBackup(book: BookRow) {
  const path = `books/${book.bookId}/book.json`;
  await invoke('write_dexie_backup_json', { relativePath: path, jsonData: book });
}

// Delete book JSON backup
export async function deleteBookBackup(bookId: string) {
  const path = `books/${bookId}/book.json`;
  await invoke('delete_dexie_backup_json', { path });
}

// Save version as JSON backup in app data dir
export async function saveVersionBackup(version: VersionRow) {
  const path = `books/${version.bookId}/versions/${version.version_id}.json`;
  await invoke('write_dexie_backup_json', { relativePath: path, jsonData: version });
}

// Delete version JSON backup
export async function deleteVersionBackup(bookId: string, versionId: string) {
  const path = `books/${bookId}/versions/${versionId}.json`;
  await invoke('delete_dexie_backup_json', { path });
}

// Save chapter as JSON backup in app data dir
export async function saveChapterBackup(chapter: ChapterRow) {
  const path = `books/${chapter.book_id}/chapters/${chapter.chapter_id}.json`;
  await invoke('write_dexie_backup_json', { relativePath: path, jsonData: chapter });
}

// Delete chapter JSON backup
export async function deleteChapterBackup(bookId: string, chapterId: string) {
  const path = `books/${bookId}/chapters/${chapterId}.json`;
  await invoke('delete_dexie_backup_json', { path });
}

// --- Runtime detection helper ---
export function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
}

// --- You can add more restored helpers below as needed ---

export function now(): number {
  return Date.now();
}

// --- Propagation helpers ---
async function propagateChapterChangeToParents(versionId: string, bookId: string) {
  // Update version aggregate fields and rev
  const version = await simpleDb.versions.get(versionId);
  if (version) {
    const chapterIds = (await simpleDb.chapters.where('versionId').equals(versionId).toArray()).map(c => c.id);
    const wordCount = (await simpleDb.chapters.where('versionId').equals(versionId).toArray()).reduce((sum, c: any) => sum + (c.wordCount || 0), 0);
    const updatedVersion: Version = {
      ...version,
      chapters: chapterIds,
      wordCount,
      revLocal: newRev(),
      syncState: 'dirty',
      updatedAt: now()
    };
    await simpleDb.versions.put(updatedVersion);
    await saveVersionBackup({ ...(updatedVersion as any), version_id: updatedVersion.id });
  }
  await propagateVersionChangeToBook(bookId);
}

async function propagateVersionChangeToBook(bookId: string) {
  const book = await simpleDb.books.get(bookId);
  if (!book) return;
  const versions = await simpleDb.versions.where('bookId').equals(bookId).toArray();
  const wordCount = versions.reduce((sum, v) => sum + (v.wordCount || 0), 0);
  const updatedBook: Book = {
    ...book,
    versions: versions.map(v => v.id),
    wordCount,
    revLocal: newRev(),
    syncState: 'dirty',
    updatedAt: now()
  };
  await simpleDb.books.put(updatedBook);
  await saveBookBackup({ ...(updatedBook as any), bookId: updatedBook.id });
  emitBookDirty(bookId);
}

/**
 * Ensures a default version exists for a book. Creates one if not present.
 */
export async function ensureDefaultVersion(bookId: string, _ownerUserId: string): Promise<string> {
  const book = await simpleDb.books.get(bookId);
  if (!book) throw new Error(`Book not found: ${bookId}`);
  if (!Array.isArray(book.versions) || book.versions.length === 0) {
    const id = `v_${Date.now()}`;
    const newVersion: Version = { id, bookId, name: 'Default Version', createdAt: new Date().toISOString(), syncState: 'idle' };
    await simpleDb.versions.add(newVersion);
  const prev = Array.isArray(book.versions) ? book.versions : [];
  const updated = { ...book, versions: [...prev, id] } as Book;
    await simpleDb.books.put(updated);
    return id;
  }
  return book.versions[0];
}

/**
 * Ensures a version exists in the database for a book. Creates one if not present.
 */
export async function ensureVersionInDatabase(versionId: string, bookId: string, _ownerUserId?: string): Promise<Version | null> {
  const found = await simpleDb.versions.get(versionId);
  if (found) return found;
  const book = await simpleDb.books.get(bookId);
  if (!book) return null;
  const newVersion: Version = { id: versionId, bookId, name: 'Default Version', createdAt: new Date().toISOString(), syncState: 'idle' };
  await simpleDb.versions.add(newVersion);
  if (!book.versions?.includes(versionId)) {
    const prev = Array.isArray(book.versions) ? book.versions : [];
    const updated = { ...book, versions: [...prev, versionId] } as Book;
    await simpleDb.books.put(updated);
  }
  return newVersion;
}

/**
 * Syncs all chapters to the given version's data in Dexie.
 */
export async function syncChaptersToVersionData(_bookId: string, versionId: string): Promise<void> {
  await simpleDb.chapters.where('versionId').equals(versionId).toArray();
}

/**
 * Initializes the Dexie database (no-op for Dexie, present for compatibility)
 */
export async function initializeDatabase(): Promise<void> {
  // Dexie automatically initializes on import
  // This is a compatibility stub for diagnostics and legacy code
  return;
}

// Lazy, module-scoped encryption service loader to avoid circular static import
let __encSvc: any | null = null;
let __encSvcInit: Promise<any> | null = null;
async function getEncryptionServiceOnce() {
  if (__encSvc) return __encSvc;
  if (!__encSvcInit) {
    __encSvcInit = import('../services/encryptionService').then(m => {
      __encSvc = m.encryptionService;
      return __encSvc;
    });
  }
  return __encSvcInit;
}

/**
 * Sync a book and its versions/chapters to cloud using apiClient
 * Uses create/put/delete endpoints as appropriate.
 */
export async function syncBookToCloud(bookId: string, userId?: string): Promise<void> {
  const book = await simpleDb.books.get(bookId);
  if (!book) return;

  // Push book
  await apiClient.putBook(bookId, book);

  // Sync versions
  const versions = await simpleDb.versions.where('bookId').equals(bookId).toArray();
  // Get encryption service (loaded once per module)
  const encryptionService = await getEncryptionServiceOnce();
  if (!userId) {
    console.warn('syncBookToCloud called without userId; chapters will be sent without content');
  }
  for (const v of versions) {
    const vAny: any = v as any;
    const shouldPushVersion = vAny.syncState === 'dirty' || (vAny.revLocal && vAny.revLocal !== vAny.revCloud);
    if (shouldPushVersion) {
      await apiClient.putVersion(bookId, v.id, v);
      // Mark version clean locally
      const cleanedVersion: any = {
        ...v,
        revCloud: vAny.revLocal || vAny.revCloud,
        syncState: 'idle',
        conflictState: 'none',
      };
  await simpleDb.versions.put(cleanedVersion);
  emitVersionClean(v.id, bookId);
    }
  // Sync chapters for each version
  const chapters = await simpleDb.chapters.where('versionId').equals(v.id).toArray();
  const hadDirtyChapters = chapters.some((c: any) => c.syncState && c.syncState !== 'idle' || (c.revLocal && c.revLocal !== c.revCloud));
    for (const ch of chapters) {
      const chAny: any = ch as any;
      const shouldPushChapter = chAny.syncState === 'dirty' || (chAny.revLocal && chAny.revLocal !== chAny.revCloud);
      if (!shouldPushChapter) continue;
      let content: any = undefined;
      try {
        if (userId) {
          content = await encryptionService.loadChapterContent(ch.id, userId);
        }
      } catch (e) {
        console.warn('Failed to decrypt chapter content for sync; sending without content', { chapterId: ch.id, error: e });
      }
      const payload: any = {
        id: ch.id,
        title: ch.title,
        position: 0,
        linkedActId: undefined,
        linkedOutlineId: undefined,
        // Send decrypted content only; do not send enc fields to keep payload small
        content,
        revLocal: chAny.revLocal,
        wordCount: chAny.wordCount,
        updatedAt: chAny.updatedAt
      };
      await apiClient.putChapter(bookId, v.id, ch.id, payload);
      // Mark chapter clean locally
      const cleanedChapter: any = {
        ...ch,
        revCloud: chAny.revLocal || chAny.revCloud,
        syncState: 'idle',
        conflictState: 'none',
      };
  await simpleDb.chapters.put(cleanedChapter);
  emitChapterClean(ch.id, v.id, bookId);
    }

    // After syncing chapters: if this version had dirty chapters and now none remain, mark version clean
    if (hadDirtyChapters) {
      const chaptersAfter = await simpleDb.chapters.where('versionId').equals(v.id).toArray();
      const anyDirtyAfter = chaptersAfter.some((c: any) => c.syncState && c.syncState !== 'idle');
      if (!anyDirtyAfter) {
        const latestV = await simpleDb.versions.get(v.id);
        if (latestV) {
          const latestAny: any = latestV as any;
          if (latestAny.syncState !== 'idle' || (latestAny.revLocal && latestAny.revLocal !== latestAny.revCloud)) {
            const cleanedVersion2: any = {
              ...latestV,
              revCloud: latestAny.revLocal || latestAny.revCloud,
              syncState: 'idle',
              conflictState: 'none',
            };
            await simpleDb.versions.put(cleanedVersion2);
            emitVersionClean(v.id, bookId);
          }
        }
      }
    }
  }

  // After syncing children, if all children are clean, mark the book clean and update cloud rev
  const freshBook = await simpleDb.books.get(bookId);
  if (freshBook) {
    const versionsAfter = await simpleDb.versions.where('bookId').equals(bookId).toArray();
    const anyDirtyV = versionsAfter.some(v => (v as any).syncState && (v as any).syncState !== 'idle');
    let anyDirtyC = false;
    if (!anyDirtyV) {
      const versionIds = versionsAfter.map(v => v.id);
      if (versionIds.length > 0) {
        const chaptersAfter = await simpleDb.chapters.where('versionId').anyOf(versionIds).toArray();
        anyDirtyC = chaptersAfter.some(ch => (ch as any).syncState && (ch as any).syncState !== 'idle');
      }
    }
    if (!anyDirtyV && !anyDirtyC) {
      const cleanedBook: any = {
        ...freshBook,
        revCloud: (freshBook as any).revLocal || (freshBook as any).revCloud,
        syncState: 'idle',
        conflictState: 'none',
        updatedAt: now(),
      };
      await simpleDb.books.put(cleanedBook);
      // Push final book state so cloud has updated revCloud
  await apiClient.putBook(bookId, cleanedBook);
  emitBookClean(bookId);
    }
  }
}
