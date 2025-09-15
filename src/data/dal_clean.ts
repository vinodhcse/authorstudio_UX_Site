// Clean DAL following the simple pattern:
// FE contexts/hooks → dal.ts → tauri-commands → database.rs

import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';

// Types matching frontend TypeScript interfaces
export interface FileRef {
  assetId: string;
  sha256: string;
  role: string; // AssetRole
  mime?: string;
  width?: number;
  height?: number;
  remoteId?: string;
  remoteUrl?: string;
  localPath?: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  authorId?: string;
  coverImage?: string; // Legacy field
  coverImageRef?: FileRef; // New asset reference
  coverImages?: string[];
  lastModified: string;
  progress: number;
  wordCount: number;
  genre: string;
  subgenre?: string;
  collaboratorCount: number;
  featured: boolean;
  bookType: string;
  prose: string;
  language: string;
  publisher: string;
  publishedStatus: string; // 'Published' | 'Unpublished' | 'Scheduled'
  publisherLink?: string;
  printISBN?: string;
  ebookISBN?: string;
  publisherLogo?: string;
  synopsis: string;
  description?: string;
  
  // Sync and sharing fields
  isShared?: boolean;
  revLocal?: string;
  revCloud?: string;
  syncState?: string; // 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict'
  conflictState?: string; // 'none' | 'needs_review' | 'blocked'
  updatedAt?: number;
}

export interface Version {
  id: string;
  name: string;
  status: string; // 'DRAFT' | 'IN_REVIEW' | 'FINAL'
  wordCount: number;
  createdAt: string;
  contributor: {
    name: string;
    avatar: string;
  };
  
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
  characters: string[]; // Character IDs
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

// Legacy compatibility types for gradual migration
export interface BookRow {
  book_id: string;
  title: string;
  author_id: string;
  rev_local?: string;
  rev_cloud?: string;
  sync_state?: string;
  conflict_state?: string;
  updated_at?: number;
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
    const books = await invoke<Book[]>('get_user_books', { userId });
    appLog.info('dal', 'Retrieved user books', { userId, count: books.length });
    return books;
  } catch (error) {
    appLog.error('dal', 'Failed to get user books', { userId, error: String(error) });
    throw error;
  }
}

export async function getBook(bookId: string, userId: string): Promise<Book | null> {
  try {
    const book = await invoke<Book | null>('get_book', { bookId, userId });
    appLog.info('dal', 'Retrieved book', { bookId, found: !!book });
    return book;
  } catch (error) {
    appLog.error('dal', 'Failed to get book', { bookId, error: String(error) });
    throw error;
  }
}

export async function createBook(book: Book): Promise<Book> {
  try {
    const createdBook = await invoke<Book>('create_book', { book });
    appLog.info('dal', 'Created book', { bookId: createdBook.id, title: createdBook.title });
    return createdBook;
  } catch (error) {
    appLog.error('dal', 'Failed to create book', { title: book.title, error: String(error) });
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
    appLog.info('dal', 'Deleted book', { bookId });
  } catch (error) {
    appLog.error('dal', 'Failed to delete book', { bookId, error: String(error) });
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
    appLog.info('dal', 'Session saved', { userId: session.userId });
  } catch (error) {
    appLog.error('dal', 'Failed to save session', { error: String(error) });
    throw error;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await invoke('app_clear_session');
    appLog.info('dal', 'Session cleared');
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
    appLog.info('dal', 'User keys saved', { userId: userKeys.userId });
  } catch (error) {
    appLog.error('dal', 'Failed to save user keys', { userId: userKeys.userId, error: String(error) });
    throw error;
  }
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
