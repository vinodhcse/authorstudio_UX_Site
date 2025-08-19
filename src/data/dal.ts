// Clean DAL following the refactor specification
// FE contexts/hooks → dal.ts → tauri-commands → database.rs

import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';
import type { Book, Version } from '../types/bookTypes';
import { useAuthStore } from '../auth/useAuthStore';
import { Collaborator, CollaboratorRecord } from '@/types';
import { 
  normalizeBook as transformNormalizeBook,
  denormalizeBook,
  normalizeBookForDB,
  newRev as generateNewRev,
  now as getCurrentTimestamp
} from '../utils/dataTransform';

// Re-export types for compatibility
export type { Book, FileRef, Version } from '../types/bookTypes';

// Sync utility functions - use imported versions from dataTransform
export const newRev = generateNewRev;
export const now = getCurrentTimestamp;

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

export function normalizCollaborators(collobarators: CollaboratorRecord[] = []): Collaborator[] {
  return collobarators.map(collobarator => ({
    ...collobarator,
    id:collobarator.user_id,
    avatar: collobarator.avatar,
    name: collobarator.name,
    email: collobarator.email,
    role: collobarator.role,
    
  }));
}

/**
 * Normalize a Book object to ensure all required fields and defaults are set
 * Uses the new dataTransform utilities for proper snake_case conversion
 */
export function normalizeBook(book: Partial<Book>): Book {
  const normalized = transformNormalizeBook({
    id: book.id || crypto.randomUUID(),
    bookId: book.bookId || book.id || crypto.randomUUID(),
    title: book.title || '',
    subtitle: book.subtitle,
    author: book.author,
    authorId: book.authorId,
    coverImage: book.coverImage,
    coverImageRef: book.coverImageRef,
    coverImages: book.coverImages || [],
    lastModified: book.lastModified || new Date().toISOString(),
    progress: book.progress || 0,
    wordCount: book.wordCount || 0,
    genre: book.genre || '',
    subgenre: book.subgenre,
    collaboratorCount: book.collaboratorCount || 0,
    collaborators: book.collaborators || [],
    featured: book.featured || false,
    bookType: book.bookType || '',
    prose: book.prose || '',
    language: book.language || '',
    publisher: book.publisher || '',
    publishedStatus: book.publishedStatus || 'Unpublished',
    publisherLink: book.publisherLink,
    printISBN: book.printISBN,
    ebookISBN: book.ebookISBN,
    publisherLogo: book.publisherLogo,
    synopsis: book.synopsis || '',
    description: book.description,
    isShared: book.isShared,
    revLocal: book.revLocal || newRev(),
    revCloud: book.revCloud,
    syncState: book.syncState || 'idle',
    conflictState: book.conflictState || 'none',
    updatedAt: book.updatedAt || now(),
    versions: normalizeVersions(book.versions || [])
  } as Book);

  // Return the FE format for local use, DB normalization happens in DAL functions
  return denormalizeBook(normalized);
}

// Core Book DAL functions as specified in the requirements

/**
 * Creates new Book (full model, including free-form versions) in SurrealDB.
 * Uses normalization to convert from FE camelCase to DB snake_case format.
 */
export async function createBook(book: Book): Promise<void> {
  try {
    const bookToCreate = normalizeBook(book);
    // Convert to DB format using normalization
    const dbBook = normalizeBookForDB(bookToCreate);

    await appLog.info('dal', 'Creating book', { bookId: bookToCreate.id, title: bookToCreate.title });
    
    await invoke('app_create_book', {
      book: dbBook
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
 * Uses normalization to convert from FE camelCase to DB snake_case format.
 */
export async function putBook(book: Book): Promise<void> {
  try {
    const bookToUpdate = {
      ...normalizeBook(book),
      updatedAt: now()
    };
    
    // Convert to DB format using normalization
    const dbBook = normalizeBookForDB(bookToUpdate);

    await appLog.info('dal', 'Updating book', { bookId: bookToUpdate.id, title: bookToUpdate.title });
    
    await invoke('app_update_book', {
      bookId: bookToUpdate.id,
      book: dbBook
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
    
    await invoke('app_delete_book_by_user', {
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
    
    const result = await invoke('app_get_user_books', { userId });
    const books = result as any[];

    // Use denormalization to convert from DB snake_case to FE camelCase
    const formattedBooks: Book[] = books.map(book => denormalizeBook(book));

    await appLog.success('dal', 'Retrieved user books', { userId, count: formattedBooks.length, books: formattedBooks });
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
    await invoke('book_mark_sync', {
      bookId,
      ownerUserId: userId,
      syncState: state
    });
  } catch (error) {
    await appLog.error('dal', 'Failed to mark book sync state', { bookId, state, error });
    throw error;
  }
}

/**
 * Optional helper to get a single book
 * Uses denormalization to convert from DB snake_case to FE camelCase
 */
export async function getBook(bookId: string, userId: string): Promise<Book | null> {
  try {
    const result = await invoke('app_get_book', { bookId: bookId, userId: userId });
    if (!result) return null;

    const book = result as any;
    return denormalizeBook(book);
  } catch (error) {
    await appLog.error('dal', 'Failed to get book', { bookId, error });
    return null;
  }
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

// Legacy compatibility types and functions for existing code
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
    const userKeys = await invoke<UserKeys | null>('app_get_user_keys', { user_id: userId });
    appLog.info('dal', 'Retrieved user keys', { userId, found: !!userKeys });
    return userKeys;
  } catch (error) {
    appLog.error('dal', 'Failed to get user keys', { userId, error: String(error) });
    throw error;
  }
}

export async function saveUserKeys(userKeys: UserKeys): Promise<void> {
  try {
    await invoke('app_save_user_keys', { user_keys: userKeys });
    appLog.info('dal', 'User keys saved successfully', { userId: userKeys.userId });
  } catch (error) {
    appLog.error('dal', 'Failed to save user keys', { userId: userKeys.userId, error: String(error) });
    throw error;
  }
}

// Legacy alias for compatibility
export const setUserKeys = saveUserKeys;

// Legacy chapter and version functions for backward compatibility
// These are simplified stubs - in the new architecture, this data is embedded in Book.versions
export async function getVersionsByBook(bookId: string): Promise<any[]> {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');
    
    const book = await getBook(bookId, userId);
    return book?.versions || [];
  } catch (error) {
    appLog.error('dal', 'Failed to get versions by book', { bookId, error: String(error) });
    return [];
  }
}

export async function createVersion(bookId: string, versionData: any): Promise<any> {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');
    
    const book = await getBook(bookId, userId);
    if (!book) throw new Error('Book not found');

    const newVersion = {
      id: crypto.randomUUID(),
      ...versionData,
      revLocal: newRev(),
      syncState: 'dirty',
      conflictState: 'none',
      updatedAt: now()
    };

    const updatedBook = {
      ...book,
      versions: [...book.versions, newVersion],
      revLocal: newRev(),
      syncState: 'dirty' as const,
      updatedAt: now()
    };

    await putBook(updatedBook);
    return newVersion;
  } catch (error) {
    appLog.error('dal', 'Failed to create version', { bookId, error: String(error) });
    throw error;
  }
}

export async function getChaptersByVersion(bookId: string, versionId: string): Promise<any[]> {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');
    
    const book = await getBook(bookId, userId);
    const version = book?.versions.find(v => v.id === versionId);
    return version?.chapters || [];
  } catch (error) {
    appLog.error('dal', 'Failed to get chapters by version', { bookId, versionId, error: String(error) });
    return [];
  }
}

export async function createChapter(bookId: string, versionId: string, chapterData: any): Promise<any> {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');
    
    const book = await getBook(bookId, userId);
    if (!book) throw new Error('Book not found');

    const versionIndex = book.versions.findIndex(v => v.id === versionId);
    if (versionIndex === -1) throw new Error('Version not found');

    const newChapter = {
      id: crypto.randomUUID(),
      ...chapterData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedVersions = [...book.versions];
    updatedVersions[versionIndex] = {
      ...updatedVersions[versionIndex],
      chapters: [...(updatedVersions[versionIndex].chapters || []), newChapter],
      revLocal: newRev(),
      syncState: 'dirty' as const,
      updatedAt: now()
    };

    const updatedBook = {
      ...book,
      versions: updatedVersions,
      revLocal: newRev(),
      syncState: 'dirty' as const,
      updatedAt: now()
    };

    await putBook(updatedBook);
    return newChapter;
  } catch (error) {
    appLog.error('dal', 'Failed to create chapter', { bookId, versionId, error: String(error) });
    throw error;
  }
}

export async function getChapter(chapterId: string): Promise<any> {
  try {
    // TODO: Implement chapter retrieval from versions
    appLog.warn('dal', 'getChapter not yet implemented in new architecture', { chapterId });
    return null;
  } catch (error) {
    appLog.error('dal', 'Failed to get chapter', { chapterId, error: String(error) });
    throw error;
  }
}

export async function putChapter(chapter: any): Promise<void> {
  try {
    // TODO: Implement chapter update in versions
    appLog.warn('dal', 'putChapter not yet implemented in new architecture', { chapterId: chapter.id });
  } catch (error) {
    appLog.error('dal', 'Failed to put chapter', { chapterId: chapter.id, error: String(error) });
    throw error;
  }
}

export async function computeRevisionHash(data: any): Promise<string> {
  try {
    // Simple revision hash based on content
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    appLog.error('dal', 'Failed to compute revision hash', { error: String(error) });
    throw error;
  }
}

// Legacy types for compatibility
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

// Additional legacy functions
export async function getDirtyChapters(): Promise<ChapterRow[]> {
  try {
    // TODO: Implement dirty chapters retrieval from versions
    appLog.warn('dal', 'getDirtyChapters not yet implemented in new architecture');
    return [];
  } catch (error) {
    appLog.error('dal', 'Failed to get dirty chapters', { error: String(error) });
    return [];
  }
}

export async function putVersion(version: any): Promise<void> {
  try {
    // TODO: Implement version update in new architecture
    appLog.warn('dal', 'putVersion not yet implemented in new architecture', { versionId: version.id });
  } catch (error) {
    appLog.error('dal', 'Failed to put version', { versionId: version.id, error: String(error) });
    throw error;
  }
}

export async function ensureDefaultVersion(bookId: string): Promise<any> {
  try {
    // TODO: Implement default version creation in new architecture
    appLog.warn('dal', 'ensureDefaultVersion not yet implemented in new architecture', { bookId });
    return null;
  } catch (error) {
    appLog.error('dal', 'Failed to ensure default version', { bookId, error: String(error) });
    throw error;
  }
}

export async function getVersionContentData(bookId: string, versionId: string): Promise<any> {
  try {
    // TODO: Implement version content data retrieval
    appLog.warn('dal', 'getVersionContentData not yet implemented in new architecture', { bookId, versionId });
    return null;
  } catch (error) {
    appLog.error('dal', 'Failed to get version content data', { bookId, versionId, error: String(error) });
    throw error;
  }
}

export async function updateBook(book: Book): Promise<Book> {
  // Alias for putBook for backward compatibility
  await putBook(book);
  return book;
}

export async function ensureVersionInDatabase(bookId: string, versionId: string): Promise<any> {
  try {
    // TODO: Implement version database creation in new architecture
    appLog.warn('dal', 'ensureVersionInDatabase not yet implemented in new architecture', { bookId, versionId });
    return null;
  } catch (error) {
    appLog.error('dal', 'Failed to ensure version in database', { bookId, versionId, error: String(error) });
    throw error;
  }
}

export async function syncChaptersToVersionData(bookId: string, versionId: string): Promise<void> {
  try {
    // TODO: Implement chapter sync to version data
    appLog.warn('dal', 'syncChaptersToVersionData not yet implemented in new architecture', { bookId, versionId });
  } catch (error) {
    appLog.error('dal', 'Failed to sync chapters to version data', { bookId, versionId, error: String(error) });
    throw error;
  }
}

export async function getScenesByBook(bookId: string): Promise<SceneRow[]> {
  try {
    // TODO: Implement scenes retrieval from versions
    appLog.warn('dal', 'getScenesByBook not yet implemented in new architecture', { bookId });
    return [];
  } catch (error) {
    appLog.error('dal', 'Failed to get scenes by book', { bookId, error: String(error) });
    return [];
  }
}

// Legacy scene functions - these need to be implemented based on your encryption requirements
export async function getScene(sceneId: string): Promise<any> {
  try {
    // TODO: Implement scene retrieval from versions
    appLog.warn('dal', 'getScene not yet implemented in new architecture', { sceneId });
    return null;
  } catch (error) {
    appLog.error('dal', 'Failed to get scene', { sceneId, error: String(error) });
    throw error;
  }
}

export async function putScene(scene: any): Promise<void> {
  try {
    // TODO: Implement scene update in versions
    appLog.warn('dal', 'putScene not yet implemented in new architecture', { sceneId: scene.id });
  } catch (error) {
    appLog.error('dal', 'Failed to put scene', { sceneId: scene.id, error: String(error) });
    throw error;
  }
}

export async function createChapterAtomic(chapter: any): Promise<any> {
  try {
    // TODO: Implement atomic chapter creation in new architecture
    appLog.warn('dal', 'createChapterAtomic not yet implemented in new architecture', { chapterId: chapter.id });
    return chapter;
  } catch (error) {
    appLog.error('dal', 'Failed to create chapter atomically', { chapterId: chapter.id, error: String(error) });
    throw error;
  }
}

export async function deleteChapterAtomic(chapterId: string): Promise<void> {
  try {
    // TODO: Implement atomic chapter deletion in new architecture
    appLog.warn('dal', 'deleteChapterAtomic not yet implemented in new architecture', { chapterId });
  } catch (error) {
    appLog.error('dal', 'Failed to delete chapter atomically', { chapterId, error: String(error) });
    throw error;
  }
}

export async function bumpChapterMetadataAtomic(chapterId: string, metadata: any): Promise<void> {
  try {
    // TODO: Implement atomic chapter metadata update in new architecture
    appLog.warn('dal', 'bumpChapterMetadataAtomic not yet implemented in new architecture', { chapterId, metadata });
  } catch (error) {
    appLog.error('dal', 'Failed to bump chapter metadata atomically', { chapterId, error: String(error) });
    throw error;
  }
}

export async function getVersion(versionId: string): Promise<any> {
  try {
    // TODO: Implement version retrieval from new architecture
    appLog.warn('dal', 'getVersion not yet implemented in new architecture', { versionId });
    return null;
  } catch (error) {
    appLog.error('dal', 'Failed to get version', { versionId, error: String(error) });
    throw error;
  }
}
