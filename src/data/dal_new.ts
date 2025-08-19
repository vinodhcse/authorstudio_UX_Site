// Clean DAL following the refactor specification
// FE contexts/hooks → dal.ts → tauri-commands → database.rs

import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';
import type { Book, Version } from '../types/bookTypes';

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

/**
 * Normalize a Book object to ensure all required fields and defaults are set
 */
export function normalizeBook(book: Partial<Book>): Book {
  return {
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
  };
}

// Core Book DAL functions as specified in the requirements

/**
 * Creates new Book (full model, including free-form versions) in SurrealDB.
 */
export async function createBook(book: Book): Promise<void> {
  try {
    const bookToCreate = normalizeBook(book);

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
      ...normalizeBook(book),
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

    const formattedBooks: Book[] = books.map(book => normalizeBook({
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
      syncState: (book.sync_state as Book['syncState']) || 'idle',
      conflictState: (book.conflict_state as Book['conflictState']) || 'none',
      updatedAt: book.updated_at,
      versions: book.versions || []
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
    return normalizeBook({
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
      syncState: (book.sync_state as Book['syncState']) || 'idle',
      conflictState: (book.conflict_state as Book['conflictState']) || 'none',
      updatedAt: book.updated_at,
      versions: book.versions || []
    });
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
    const userKeys = await invoke<UserKeys | null>('app_get_user_keys', { userId });
    appLog.info('dal', 'Retrieved user keys', { userId, found: !!userKeys });
    return userKeys;
  } catch (error) {
    appLog.error('dal', 'Failed to get user keys', { userId, error: String(error) });
    throw error;
  }
}

export async function saveUserKeys(userKeys: UserKeys): Promise<void> {
  try {
    await invoke('app_save_user_keys', { userKeys });
    appLog.info('dal', 'User keys saved successfully', { userId: userKeys.userId });
  } catch (error) {
    appLog.error('dal', 'Failed to save user keys', { userId: userKeys.userId, error: String(error) });
    throw error;
  }
}
