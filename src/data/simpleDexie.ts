// Simplified Dexie setup - directly use Book and Version types without converters
import Dexie from 'dexie';
import type { Book, Version } from '../types/bookTypes';

// Chapter interface for the chapter table
export interface Chapter {
  id: string;
  bookId: string;
  versionId: string;
  title: string;
  // Ordering and grouping
  linkedAct?: string;
  sortIndex?: number;
  // Encrypted fields
  encScheme?: 'udek' | 'bsk';
  contentEnc?: Uint8Array;
  contentIv?: Uint8Array;
  // Metadata
  wordCount?: number;
  createdAt?: string;
  updatedAt?: string;
  // Revision/sync
  revLocal?: string;
  revCloud?: string;
  syncState?: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict' | 'error';
  conflictState?: 'none' | 'needs_review' | 'blocked';
}

// User encryption keys persisted locally
export interface UserKeysRecord {
  user_id: string; // primary key
  udek_wrap_appkey: Uint8Array | number[] | string;
  kdf_salt: Uint8Array | number[] | string;
  kdf_iters: number;
  updated_at: number;
}

// Local-only Chapter Revision record (device-specific history)
export interface LocalChapterRevision {
  rev_id: string;
  chapter_id: string;
  book_id: string;
  version_id: string;
  device_id?: string;
  parent_rev_id: string | null;
  base_cloud_rev_id: string | null;
  timestamp: number;
  author_id?: string;
  author_name?: string;
  is_minor: boolean;
  message?: string | null;
  snapshot: any; // TipTap JSON
  word_count?: number;
  char_count?: number;
}

// Outbox item for queued operations
export interface OutboxItem {
  id: string;
  entity: 'book' | 'version' | 'chapter';
  action: 'create' | 'update' | 'delete';
  bookId: string;
  versionId?: string;
  chapterId?: string;
  payload?: any; // optional payload snapshot
  status: 'pending' | 'sent' | 'error';
  error?: string;
  createdAt: number;
  updatedAt: number;
}

// Simple Dexie database using our actual types directly
class SimpleAuthorStudioDB extends Dexie {
  books!: Dexie.Table<Book, string>;
  versions!: Dexie.Table<Version, string>;
  chapters!: Dexie.Table<Chapter, string>;
  userKeys!: Dexie.Table<UserKeysRecord, string>;
  chapterRevisions!: Dexie.Table<LocalChapterRevision, string>;
  outbox!: Dexie.Table<OutboxItem, string>;

  constructor() {
    super('SimpleAuthorStudioDB');
    this.version(1).stores({
      books: 'id, title, authorId, lastModified, syncState',
      versions: 'id, name, createdAt, syncState', 
      chapters: 'id, bookId, versionId, title'
    });
    // Add userKeys store in a new version for key persistence
    this.version(2).stores({
      books: 'id, title, authorId, lastModified, syncState',
      versions: 'id, name, createdAt, syncState',
      chapters: 'id, bookId, versionId, title',
      userKeys: 'user_id'
    });
    // Index bookId on versions for queries like where('bookId')
    this.version(3).stores({
      books: 'id, title, authorId, lastModified, syncState',
      versions: 'id, bookId, name, createdAt, syncState',
      chapters: 'id, bookId, versionId, title',
      userKeys: 'user_id'
    });
    // Add chapterRevisions in version 4 (local-only history)
    this.version(4).stores({
      books: 'id, title, authorId, lastModified, syncState',
      versions: 'id, bookId, name, createdAt, syncState',
      chapters: 'id, bookId, versionId, title',
      userKeys: 'user_id',
      chapterRevisions: 'rev_id, chapter_id, version_id, book_id, timestamp'
    });
    // Add outbox table in version 5
    this.version(5).stores({
      books: 'id, title, authorId, lastModified, syncState',
      versions: 'id, bookId, name, createdAt, syncState',
      chapters: 'id, bookId, versionId, title',
      userKeys: 'user_id',
      chapterRevisions: 'rev_id, chapter_id, version_id, book_id, timestamp',
      outbox: 'id, entity, action, bookId, versionId, chapterId, status'
    });
  }
}

export const simpleDb = new SimpleAuthorStudioDB();

// Simple CRUD operations without converters - using Book/Version types directly
export async function createBook(book: Book): Promise<void> {
  await simpleDb.books.add(book);
}

export async function putBook(book: Book): Promise<void> {
  await simpleDb.books.put(book);
}

export async function getBook(bookId: string): Promise<Book | undefined> {
  return await simpleDb.books.get(bookId);
}

export async function getUserBooks(authorId: string): Promise<Book[]> {
  return await simpleDb.books.where('authorId').equals(authorId).toArray();
}

export async function deleteBook(bookId: string): Promise<void> {
  await simpleDb.books.delete(bookId);
}

// Version operations - using Version type directly
export async function createVersion(version: Version): Promise<void> {
  await simpleDb.versions.add(version);
}

export async function putVersion(version: Version): Promise<void> {
  await simpleDb.versions.put(version);
}

export async function getVersion(versionId: string): Promise<Version | undefined> {
  return await simpleDb.versions.get(versionId);
}

export async function getVersionsByBook(bookId: string): Promise<Version[]> {
  // Query by indexed bookId to avoid relying on potentially stale/mixed book.versions arrays
  // This also prevents Dexie invalid key errors when book.versions contains non-string entries
  return await simpleDb.versions.where('bookId').equals(bookId).toArray();
}

export async function deleteVersion(versionId: string): Promise<void> {
  await simpleDb.versions.delete(versionId);
}

// Chapter operations
export async function createChapter(chapter: Chapter): Promise<void> {
  await simpleDb.chapters.add(chapter);
}

export async function putChapter(chapter: Chapter): Promise<void> {
  await simpleDb.chapters.put(chapter);
}

export async function getChapter(chapterId: string): Promise<Chapter | undefined> {
  return await simpleDb.chapters.get(chapterId);
}

export async function getChaptersByVersion(versionId: string): Promise<Chapter[]> {
  return await simpleDb.chapters.where('versionId').equals(versionId).toArray();
}

export async function deleteChapter(chapterId: string): Promise<void> {
  await simpleDb.chapters.delete(chapterId);
}

// Chapter revision operations (local-only)
export async function addLocalChapterRevision(rec: LocalChapterRevision): Promise<void> {
  // Use put so the same rev_id can be updated (session-based minor revisions)
  await simpleDb.chapterRevisions.put(rec);
}

export async function getLocalChapterRevisions(chapterId: string): Promise<LocalChapterRevision[]> {
  return await simpleDb.chapterRevisions.where('chapter_id').equals(chapterId).reverse().sortBy('timestamp').then(arr => arr.reverse());
}

export async function getLatestLocalChapterRevision(chapterId: string): Promise<LocalChapterRevision | undefined> {
  const items = await simpleDb.chapterRevisions.where('chapter_id').equals(chapterId).toArray();
  return items.sort((a,b)=> b.timestamp - a.timestamp)[0];
}

// Outbox helpers
export async function enqueueOutbox(item: Omit<OutboxItem, 'id' | 'status' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<OutboxItem> {
  const rec: OutboxItem = {
    id: item.id || `ob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    entity: item.entity,
    action: item.action,
    bookId: item.bookId,
    versionId: item.versionId,
    chapterId: item.chapterId,
    payload: item.payload,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await simpleDb.outbox.add(rec);
  return rec;
}

export async function getPendingOutbox(): Promise<OutboxItem[]> {
  const all = await simpleDb.outbox.toArray();
  return all.filter(i => i.status === 'pending');
}

export async function markOutboxDone(id: string): Promise<void> {
  await simpleDb.outbox.where('id').equals(id).modify({ status: 'sent', updatedAt: Date.now(), error: undefined });
}

export async function markOutboxError(id: string, error: any): Promise<void> {
  await simpleDb.outbox.where('id').equals(id).modify({ status: 'error', updatedAt: Date.now(), error: String(error) });
}
