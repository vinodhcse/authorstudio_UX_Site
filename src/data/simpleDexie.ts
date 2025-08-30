// Simplified Dexie setup - directly use Book and Version types without converters
import Dexie from 'dexie';
import type { Book, Version } from '../types/bookTypes';

// Chapter interface for the chapter table
export interface Chapter {
  id: string;
  bookId: string;
  versionId: string;
  title: string;
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

// Simple Dexie database using our actual types directly
class SimpleAuthorStudioDB extends Dexie {
  books!: Dexie.Table<Book, string>;
  versions!: Dexie.Table<Version, string>;
  chapters!: Dexie.Table<Chapter, string>;
  userKeys!: Dexie.Table<UserKeysRecord, string>;

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
  // Since versions are stored by ID in book.versions array, we need to fetch them
  const book = await getBook(bookId);
  if (!book || !book.versions.length) return [];
  
  return await simpleDb.versions.where('id').anyOf(book.versions).toArray();
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
