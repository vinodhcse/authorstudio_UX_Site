// Clean DAL following the simple pattern:
// FE contexts/hooks → dal.ts → tauri-commands → database.rs

import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';
import { Version as LegacyVersion, Collaborator } from '../types';
import type { Book, FileRef, Version } from '../types/bookTypes';

// Re-export types for compatibility
export type { Book, FileRef, Version } from '../types/bookTypes';

// Sync utility functions
export const newRev = () => `rev_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
export const now = () => Date.now();

// Normalize helpers
export function normalizeVersions(versions: Version[] = []): Version[] {
  return versions.map(version => ({
    ...version,
    id: version.id || crypto.randomUUID(),
    revLocal: version.revLocal || newRev(),
    syncState: version.syncState || 'idle',
    conflictState: version.conflictState || 'none',
    updatedAt: version.updatedAt || now(),
    chapters: version.chapters || [],
    characters: version.characters || [],
    plotArcs: version.plotArcs || [],
    worlds: version.worlds || [],
    plotCanvas: version.plotCanvas || null
  }));
}

// Core Book DAL functions as specified in the requirements

/**
 * Creates new Book (full model, including free-form versions) in SurrealDB.
 */
export async function createBook(book: Book): Promise<void> {
  try {
    const bookToCreate = {
      ...book,
      versions: normalizeVersions(book.versions),
      revLocal: book.revLocal || newRev(),
      syncState: book.syncState || 'idle',
      conflictState: book.conflictState || 'none',
      updatedAt: book.updatedAt || now()
    };

    await appLog.info('dal', 'Creating book', { bookId: bookToCreate.id, title: bookToCreate.title });
    
    await invoke('create_book', {
      book: bookToCreate
    });

    await appLog.success('dal', 'Book created successfully', { bookId: bookToCreate.id });
  } catch (error) {
    await appLog.error('dal', 'Failed to create book', { bookId: book.id, error });
    throw error;
  }
}

/**
 * Upserts Book by book.id. Always overwrites versions with provided array.
 * Must set storage-level updated_at and persist rev_local.
 */
export async function putBook(book: Book): Promise<void> {
  try {
    const bookToUpdate = {
      ...book,
      versions: normalizeVersions(book.versions),
      updatedAt: now()
    };

    await appLog.info('dal', 'Updating book', { bookId: bookToUpdate.id, title: bookToUpdate.title });
    
    await invoke('put_book', {
      book: bookToUpdate
    });

    await appLog.success('dal', 'Book updated successfully', { bookId: bookToUpdate.id });
  } catch (error) {
    await appLog.error('dal', 'Failed to update book', { bookId: book.id, error });
    throw error;
  }
}

/**
 * Deletes book and all related rows/document roots by id.
 */
export async function deleteBook(bookId: string, userId: string): Promise<void> {
  try {
    await appLog.info('dal', 'Deleting book', { bookId, userId });
    
    await invoke('delete_book', {
      bookId,
      userId
    });

    await appLog.success('dal', 'Book deleted successfully', { bookId });
  } catch (error) {
    await appLog.error('dal', 'Failed to delete book', { bookId, error });
    throw error;
  }
}

/**
 * Reads all books for a user from local SurrealDB (primary source of truth offline).
 */
export async function getUserBooks(userId: string): Promise<Book[]> {
  try {
    await appLog.info('dal', 'Getting user books', { userId });
    
    const result = await invoke('get_user_books', { userId });
    const books = result as any[];

    const formattedBooks: Book[] = books.map(book => ({
      id: book.id || book.book_id,
      bookId: book.book_id || book.id,
      title: book.title || '',
      subtitle: book.subtitle,
      author: book.author,
      authorId: book.author_id || userId,
      coverImage: book.cover_image,
      coverImageRef: book.cover_image_ref,
      coverImages: book.cover_images || [],
      lastModified: book.last_modified || new Date().toISOString(),
      progress: book.progress || 0,
      wordCount: book.word_count || 0,
      genre: book.genre || '',
      subgenre: book.subgenre,
      collaboratorCount: book.collaborator_count || 0,
      collaborators: book.collaborators || [],
      featured: book.featured || false,
      bookType: book.book_type || '',
      prose: book.prose || '',
      language: book.language || '',
      publisher: book.publisher || '',
      publishedStatus: book.published_status || 'Unpublished',
      publisherLink: book.publisher_link,
      printISBN: book.print_isbn,
      ebookISBN: book.ebook_isbn,
      publisherLogo: book.publisher_logo,
      synopsis: book.synopsis || '',
      description: book.description,
      isShared: book.is_shared,
      revLocal: book.rev_local,
      revCloud: book.rev_cloud,
      syncState: book.sync_state || 'idle',
      conflictState: book.conflict_state || 'none',
      updatedAt: book.updated_at,
      versions: normalizeVersions(book.versions || [])
    }));

    await appLog.success('dal', 'Retrieved user books', { userId, count: formattedBooks.length });
    return formattedBooks;
  } catch (error) {
    await appLog.error('dal', 'Failed to get user books', { userId, error });
    throw error;
  }
}

/**
 * Optional helper to mark book sync state
 */
export async function markBookSyncState(bookId: string, userId: string, state: Book['syncState']): Promise<void> {
  try {
    await invoke('mark_book_sync_state', {
      bookId,
      userId,
      syncState: state
    });
  } catch (error) {
    await appLog.error('dal', 'Failed to mark book sync state', { bookId, state, error });
    throw error;
  }
}

/**
 * Optional helper to get a single book
 */
export async function getBook(bookId: string, userId: string): Promise<Book | null> {
  try {
    const result = await invoke('get_book', { bookId, userId });
    if (!result) return null;

    const book = result as any;
    return {
      id: book.id || book.book_id,
      bookId: book.book_id || book.id,
      title: book.title || '',
      subtitle: book.subtitle,
      author: book.author,
      authorId: book.author_id || userId,
      coverImage: book.cover_image,
      coverImageRef: book.cover_image_ref,
      coverImages: book.cover_images || [],
      lastModified: book.last_modified || new Date().toISOString(),
      progress: book.progress || 0,
      wordCount: book.word_count || 0,
      genre: book.genre || '',
      subgenre: book.subgenre,
      collaboratorCount: book.collaborator_count || 0,
      collaborators: book.collaborators || [],
      featured: book.featured || false,
      bookType: book.book_type || '',
      prose: book.prose || '',
      language: book.language || '',
      publisher: book.publisher || '',
      publishedStatus: book.published_status || 'Unpublished',
      publisherLink: book.publisher_link,
      printISBN: book.print_isbn,
      ebookISBN: book.ebook_isbn,
      publisherLogo: book.publisher_logo,
      synopsis: book.synopsis || '',
      description: book.description,
      isShared: book.is_shared,
      revLocal: book.rev_local,
      revCloud: book.rev_cloud,
      syncState: book.sync_state || 'idle',
      conflictState: book.conflict_state || 'none',
      updatedAt: book.updated_at,
      versions: normalizeVersions(book.versions || [])
    };
  } catch (error) {
    await appLog.error('dal', 'Failed to get book', { bookId, error });
    return null;
  }
}

export interface Version1 {
  id: string;
  name: string;
  status: string; // 'DRAFT' | 'IN_REVIEW' | 'FINAL'
  wordCount: number;
  createdAt: string;
  contributor: {
    name: string;
    avatar: string;
  };
  chapter: Chapter;
  // Sync fields
  revLocal?: string;
  revCloud?: string;
  syncState?: string;
  conflictState?: string;
  updatedAt?: number;
}



export interface Chapter {
  id: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  image?: string;
  
  // Plot structure references
  linkedPlotNodeId: string;
  linkedAct: string;
  linkedOutline: string;
  linkedScenes: string[];
  
  // Content metadata
  totalCharacters: number;
  totalWords: number;
  readingTime?: number;
  lastEditedBy?: string;
  lastEditedAt?: string;
  
  // Encryption and sync
  encScheme?: string; // 'udek' | 'bsk'
  contentEnc?: string; // base64 encrypted content
  contentIv?: string;  // base64 IV
  revLocal?: string;
  revCloud?: string;
  syncState?: string;
  conflictState?: string;
  
  // Chapter metadata
  wordCount: number;
  hasProposals: boolean;
  summary?: string;
  goals?: string;
  characters: string[];
  tags?: string[];
  notes?: string;
  isComplete: boolean;
  
  // Status tracking
  status: string; // 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'PUBLISHED'
  authorId: string;
  lastModifiedBy: string;
}

export interface Scene {
  id: string;
  title: string;
  encScheme: string; // 'udek' | 'bsk'
  syncState: string; // 'idle' | 'dirty' | 'syncing' | 'conflict'
  conflictState: string; // 'none' | 'local_wins' | 'cloud_wins'
  updatedAt: number;
  wordCount: number;
  hasProposals?: boolean;
}

export interface Session {
  id?: number;
  userId?: string;
  email?: string;
  name?: string;
  deviceId?: string;
  refreshTokenEnc?: Uint8Array;
  devicePrivateKeyEnc?: Uint8Array;
  appkeyWrapSalt?: Uint8Array;
  appkeyWrapIters?: number;
  appkeyProbe?: Uint8Array;
  accessExp?: number;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: number;
  subscriptionLastCheckedAt?: number;
  sessionState?: string;
  sealedAt?: number;
  updatedAt?: number;
}

export interface UserKeys {
  id?: number;
  userId: string;
  udekWrapAppkey: Uint8Array;
  kdfSalt: Uint8Array;
  kdfIters: number;
  updatedAt: number;
}

export type SurrealThing =
  | string
  | { tb: string; id: string | number | { String?: string; Number?: number } };

// Database record shape returned by app_surreal.rs (BookRecord)
export interface BookRow {
  // Surreal internal id (RecordId / Thing). Often "book:<id>".
  // Optional because you might not use it directly.
  id?: SurrealThing | null;

  // Explicit app-level id if present in the record
  book_id?: string | null;

  // Required in BookRecord
  title: string;

  // Option<> in Rust → can arrive as null
  subtitle?: string | null;
  author?: string | null;
  author_id?: string | null;

  cover_image?: string | null;
  cover_image_ref?: FileRef | null;
  cover_images?: string[] | null;

  // Required in BookRecord
  last_modified: string;

  // Required in BookRecord
  progress: number;
  word_count: number;
  genre: string;

  // Optional in BookRecord
  subgenre?: string | null;
  collaborator_count: number;   // required in BookRecord
  featured: boolean;            // required in BookRecord
  book_type: string;            // required in BookRecord
  prose: string;                // required in BookRecord
  language: string;             // required in BookRecord
  publisher: string;            // required in BookRecord
  published_status: string;     // required in BookRecord

  publisher_link?: string | null;
  print_isbn?: string | null;
  ebook_isbn?: string | null;
  publisher_logo?: string | null;

  // Required in BookRecord
  synopsis: string;

  description?: string | null;

  // Optional sync/sharing fields
  is_shared?: boolean | null;
  rev_local?: string | null;
  rev_cloud?: string | null;
  sync_state?: string | null;
  conflict_state?: string | null;
  updated_at?: number | null;

  // NEW: free-form JSON array coming from SurrealDB
  // (serde_json::Value[] in Rust → any[] in TS)
  versions?: any[] | null;

  // Present in your Rust BookRecord (Vec<String>) — keep if you need them
  characters?: string[] | null;
  worlds?: string[] | null;

  // Allow extra props just in case
  [key: string]: any;
}

export interface ChapterRow {
  chapter_id: string;
  title: string;
  book_id: string;
  version_id: string;
  sync_state?: string;
  conflict_state?: string;
  updated_at?: number;
  [key: string]: any;
}

export interface VersionRow {
  version_id: string;
  title: string;
  book_id: string;
  status: string;
  word_count: number;
  created_at: number;
  rev_local?: string;
  rev_cloud?: string;
  sync_state?: string;
  conflict_state?: string;
  updated_at?: number;
  [key: string]: any;
}

export interface SceneRow {
  scene_id: string;
  title: string;
  enc_scheme: string;
  sync_state: string;
  conflict_state: string;
  updated_at: number;
  word_count: number;
  has_proposals?: boolean;
  [key: string]: any;
}

export interface BookMetadata {
  [key: string]: any;
}

// Database initialization
export async function initializeDatabase(dataDir: string): Promise<void> {
  try {
    await invoke('init_database', { dataDir });
    appLog.info('dal', 'Database initialized successfully');
  } catch (error) {
    appLog.error('dal', 'Failed to initialize database', { error: String(error) });
    throw error;
  }
}

// Book operations
export async function getUserBooks(userId: string): Promise<Book[]> {
  try {
    const books = await invoke<BookRow[]>('get_user_books', { user_Id: userId });
    appLog.info('dal', 'Retrieved user books', { userId, count: books.length });
    let formattedBooks: Book[] = books.map(book => ({
      id: book.book_id ?? '',
      bookId: book.book_id ?? '',
      title: book.title,
      subtitle: book.subtitle ?? undefined,
      author: book.author ?? undefined,
      authorId: book.author_id ?? undefined,
      coverImage: book.cover_image ?? undefined,
      coverImageRef: book.cover_image_ref ?? undefined,
      coverImages: book.cover_images ?? undefined,
      lastModified: book.last_modified,
      progress: book.progress,
      wordCount: book.word_count,
      genre: book.genre,
      subgenre: book.subgenre ?? undefined,
      collaboratorCount: book.collaborator_count,
      featured: book.featured,
      bookType: book.book_type,
      prose: book.prose,
      language: book.language,
      publisher: book.publisher,
      publishedStatus: book.published_status,
      publisherLink: book.publisher_link ?? undefined,
      printISBN: book.print_isbn ?? undefined,
      ebookISBN: book.ebook_isbn ?? undefined,
      publisherLogo: book.publisher_logo ?? undefined,
      synopsis: book.synopsis,
      description: book.description ?? undefined,
      isShared: book.is_shared ?? undefined,
      revLocal: book.rev_local ?? undefined,
      revCloud: book.rev_cloud ?? undefined,
      syncState: book.sync_state ?? undefined,
      conflictState: book.conflict_state ?? undefined,
      updatedAt: book.updated_at ?? undefined,
      versions: book.versions ?? [],
    }));

    return formattedBooks
  } catch (error) {
    appLog.error('dal', 'Failed to get user books', { userId, error: String(error) });
    throw error;
  }
}

export async function getBook(bookId: string, userId: string): Promise<Book | null> {
  try {
    const book = await invoke<Book | null>('get_book', { book_Id: bookId, user_Id: userId });
    appLog.info('dal', 'Retrieved book', { bookId, userId, found: !!book });
    return book;
  } catch (error) {
    appLog.error('dal', 'Failed to get book', { bookId, userId, error: String(error) });
    throw error;
  }
}

export async function createBook(book: Book): Promise<Book> {
  try {
    const createdBook = await invoke<Book>('create_book', { book });
    appLog.info('dal', 'Created book', { bookId: createdBook.id });
    return createdBook;
  } catch (error) {
    appLog.error('dal', 'Failed to create book', { bookId: book.id, error: String(error) });
    throw error;
  }
}

export async function updateBook(book: Book): Promise<Book> {
  try {
    const updatedBook = await invoke<Book>('update_book', { book });
    appLog.info('dal', 'Updated book', { bookId: updatedBook.id });
    return updatedBook;
  } catch (error) {
    appLog.error('dal', 'Failed to update book', { bookId: book.id, error: String(error) });
    throw error;
  }
}

export async function deleteBook(bookId: string, userId: string): Promise<void> {
  try {
    await invoke('app_delete_book_by_user', { bookId, userId });
    appLog.info('dal', 'Deleted book', { bookId, userId });
  } catch (error) {
    appLog.error('dal', 'Failed to delete book', { bookId, userId, error: String(error) });
    throw error;
  }
}

// Session operations
export async function getSession(): Promise<Session | null> {
  try {
    const session = await invoke<Session | null>('app_get_session');
    appLog.info('dal', 'Retrieved session', { found: !!session });
    return session;
  } catch (error) {
    appLog.error('dal', 'Failed to get session', { error: String(error) });
    throw error;
  }
}

export async function saveSession(session: Session): Promise<void> {
  try {
    await invoke('app_save_session', { session });
    appLog.info('dal', 'Saved session', { userId: session.userId });
  } catch (error) {
    appLog.error('dal', 'Failed to save session', { userId: session.userId, error: String(error) });
    throw error;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await invoke('app_clear_session');
    appLog.info('dal', 'Cleared session');
  } catch (error) {
    appLog.error('dal', 'Failed to clear session', { error: String(error) });
    throw error;
  }
}

// User keys operations
export async function getUserKeys(userId: string): Promise<UserKeys | null> {
  try {
    const userKeys = await invoke<UserKeys | null>('app_get_user_keys', { userId });
    appLog.info('dal', 'Retrieved user keys', { userId, found: !!userKeys });
    return userKeys;
  } catch (error) {
    appLog.error('dal', 'Failed to get user keys', { userId, error: String(error) });
    throw error;
  }
}

export async function saveUserKeys(userKeys: any): Promise<void> {
  try {
    await invoke('app_save_user_keys', { userKeys });
    appLog.info('dal', 'User keys saved successfully', { userId: userKeys.userId });
  } catch (error) {
    appLog.error('dal', 'Failed to save user keys', { userId: userKeys.userId, error: String(error) });
    throw error;
  }
}

// Alias for compatibility
export async function setUserKeys(userKeys: any): Promise<void> {
  return saveUserKeys(userKeys);
}

// Version operations (placeholder implementations)
export async function getVersionsByBook(bookId: string): Promise<Version[]> {
  appLog.warn('dal', 'getVersionsByBook not implemented yet', { bookId });
  return [];
}

export async function getVersion(versionId: string): Promise<Version | null> {
  appLog.warn('dal', 'getVersion not implemented yet', { versionId });
  return null;
}

export async function createVersion(version: Version): Promise<Version> {
  appLog.warn('dal', 'createVersion not implemented yet', { versionId: version.id });
  return version;
}

export async function putVersion(version: Version): Promise<void> {
  appLog.warn('dal', 'putVersion not implemented yet', { versionId: version.id });
}

export async function getVersionContentData(versionId: string, userId: string): Promise<any> {
  appLog.warn('dal', 'getVersionContentData not implemented yet', { versionId, userId });
  return null;
}

// Chapter operations (placeholder implementations)
export async function getChaptersByVersion(bookId: string, versionId: string): Promise<Chapter[]> {
  appLog.warn('dal', 'getChaptersByVersion not implemented yet', { bookId, versionId });
  return [];
}

export async function getChapter(chapterId: string): Promise<Chapter | null> {
  appLog.warn('dal', 'getChapter not implemented yet', { chapterId });
  return null;
}

export async function createChapter(chapter: Chapter): Promise<Chapter> {
  appLog.warn('dal', 'createChapter not implemented yet', { chapterId: chapter.id });
  return chapter;
}

export async function putChapter(chapter: Chapter): Promise<void> {
  appLog.warn('dal', 'putChapter not implemented yet', { chapterId: chapter.id });
}

// Scene operations (placeholder implementations)
export async function getScenesByBook(bookId: string): Promise<Scene[]> {
  appLog.warn('dal', 'getScenesByBook not implemented yet', { bookId });
  return [];
}

export async function getScene(sceneId: string): Promise<Scene | null> {
  appLog.warn('dal', 'getScene not implemented yet', { sceneId });
  return null;
}

export async function putScene(scene: Scene): Promise<void> {
  appLog.warn('dal', 'putScene not implemented yet', { sceneId: scene.id });
}

// Dirty data operations (placeholder implementations)
export async function getDirtyChapters(userId: string): Promise<Chapter[]> {
  appLog.warn('dal', 'getDirtyChapters not implemented yet', { userId });
  return [];
}

// Legacy compatibility functions
export async function putBook(book: Book): Promise<void> {
  await updateBook(book);
}

export async function getBookFromDB(bookId: string, userId?: string): Promise<Book | null> {
  if (!userId) {
    appLog.warn('dal', 'getBookFromDB called without userId, using empty string');
    userId = '';
  }
  return getBook(bookId, userId);
}

export async function deleteBookFromDB(bookId: string, userId: string): Promise<void> {
  return deleteBook(bookId, userId);
}

export async function ensureDefaultVersion(_bookId: string): Promise<Version> {
  const defaultVersion: Version = {
    id: `version_${Date.now()}`,
    name: 'Draft',
    status: 'DRAFT',
    wordCount: 0,
    createdAt: new Date().toISOString(),
    contributor: {
      name: 'User',
      avatar: ''
    }
  };
  return defaultVersion;
}

// Additional placeholder functions needed for compatibility
export async function updateVersionContentData(versionId: string, userId: string, updates: any): Promise<void> {
  appLog.warn('dal', 'updateVersionContentData not implemented yet', { versionId, userId, updates });
}

export async function markBookSyncState(bookId: string, userId: string, syncState: string): Promise<void> {
  appLog.warn('dal', 'markBookSyncState not implemented yet', { bookId, userId, syncState });
}

export function computeRevisionHash(content: string): string {
  // Placeholder implementation - should compute SHA-256 hash of content
  appLog.warn('dal', 'computeRevisionHash using placeholder implementation');
  
  // Simple hash implementation for now
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Chapter atomic operations (simplified non-atomic implementations)
export async function createChapterAtomic(chapter: Chapter): Promise<Chapter> {
  appLog.info('dal', 'Creating chapter with transaction handling', { chapterId: chapter.id });
  
  // For now, use the regular createChapter function
  // In the future, this would include transaction handling
  return createChapter(chapter);
}

export async function deleteChapterAtomic(chapterId: string, userId: string): Promise<void> {
  appLog.info('dal', 'Deleting chapter with transaction handling', { chapterId, userId });
  
  // Placeholder implementation - would include transaction handling
  appLog.warn('dal', 'deleteChapterAtomic not fully implemented yet', { chapterId, userId });
}

export async function bumpChapterMetadataAtomic(chapterId: string, metadata: any): Promise<void> {
  appLog.info('dal', 'Updating chapter metadata with transaction handling', { chapterId, metadata });
  
  // Placeholder implementation - would include transaction handling
  appLog.warn('dal', 'bumpChapterMetadataAtomic not fully implemented yet', { chapterId });
}

// Version database operations
export async function ensureVersionInDatabase(version: Version): Promise<void> {
  appLog.info('dal', 'Ensuring version exists in database', { versionId: version.id });
  
  // Check if version exists, create if not
  const existingVersion = await getVersion(version.id);
  if (!existingVersion) {
    await createVersion(version);
  }
}

export async function syncChaptersToVersionData(versionId: string, chapters: Chapter[]): Promise<void> {
  appLog.info('dal', 'Syncing chapters to version data', { versionId, chapterCount: chapters.length });
  
  // Placeholder implementation - would sync chapter data to version
  appLog.warn('dal', 'syncChaptersToVersionData not fully implemented yet', { versionId });
}