// Data Access Layer for encrypted book data
import Database from '@tauri-apps/plugin-sql';
import { appLog } from '../auth/fileLogger';
import { Book, Version, Chapter, Scene, Grant, UserKeys, SyncState, ConflictState } from '../types';
import { runMigrations } from './migrations';

let db: Database | null = null;

export async function initializeDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:data.db');
    await runMigrations(db);
    appLog.info('dal', 'Database initialized with migrations');
  }
  return db;
}


// Book metadata interface for encryption
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


// User Keys operations
export interface UserKeysRow {
  id: number;
  user_id: string;
  udek_wrap_appkey: Uint8Array;
  kdf_salt: Uint8Array;
  kdf_iters: number;
  updated_at: number;
}

export async function getUserKeys(userId: string): Promise<UserKeysRow | null> {
  const database = await initializeDatabase();
  const result = await database.select<UserKeysRow[]>('SELECT * FROM user_keys WHERE user_id = ?', [userId]);
  return result.length > 0 ? result[0] : null;
}

export async function setUserKeys(data: Omit<UserKeysRow, 'id'>): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    `INSERT OR REPLACE INTO user_keys (user_id, udek_wrap_appkey, kdf_salt, kdf_iters, updated_at) 
     VALUES (?, ?, ?, ?, ?)`,
    [data.user_id, data.udek_wrap_appkey, data.kdf_salt, data.kdf_iters, data.updated_at]
  );
  appLog.info('dal', 'User keys updated', { userId: data.user_id });
}

// Book operations
export interface BookRow {
  book_id: string;
  owner_user_id: string;
  title: string;
  is_shared: number;
  // Encrypted metadata fields
  enc_metadata?: Uint8Array; // Contains description, synopsis, genre, etc.
  enc_schema?: string; // Encryption scheme ('udek' | 'bsk')
  // Sync and revision tracking
  rev_local?: string;
  rev_cloud?: string;
  sync_state: string;
  conflict_state: string;
  last_local_change?: number;
  last_cloud_change?: number;
  updated_at?: number;
}

export async function getUserBooks(userId: string): Promise<BookRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<BookRow[]>('SELECT * FROM books WHERE owner_user_id = ?', [userId]);
  appLog.info('dal', `Retrieved ${result.length} books for user`, { userId });
  return result;
}

export async function getBook(bookId: string, userId: string): Promise<BookRow | null> {
  const database = await initializeDatabase();
  const result = await database.select<BookRow[]>('SELECT * FROM books WHERE book_id = ? AND owner_user_id = ?', [bookId, userId]);
  return result.length > 0 ? result[0] : null;
}

export async function putBook(data: BookRow): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    `INSERT OR REPLACE INTO books 
     (book_id, owner_user_id, title, is_shared, enc_metadata, enc_schema, rev_local, rev_cloud, sync_state, conflict_state, last_local_change, last_cloud_change, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.book_id, data.owner_user_id, data.title, data.is_shared, data.enc_metadata, data.enc_schema, data.rev_local, data.rev_cloud, data.sync_state, data.conflict_state, data.last_local_change, data.last_cloud_change, data.updated_at]
  );
  appLog.info('dal', 'Book updated', { bookId: data.book_id, syncState: data.sync_state });
}

// Get books that need syncing to cloud
export async function getDirtyBooks(userId: string): Promise<BookRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<BookRow[]>(
    'SELECT * FROM books WHERE owner_user_id = ? AND sync_state = ?', 
    [userId, 'dirty']
  );
  return result;
}

// Get books with conflicts
export async function getConflictedBooks(userId: string): Promise<BookRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<BookRow[]>(
    'SELECT * FROM books WHERE owner_user_id = ? AND conflict_state != ?', 
    [userId, 'none']
  );
  return result;
}

// Book metadata interface for encryption
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

export async function deleteBook(bookId: string, userId: string): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    'DELETE FROM books WHERE book_id = ? AND owner_user_id = ?',
    [bookId, userId]
  );
  appLog.info('dal', 'Book deleted from database', { bookId, userId });
}

export async function markBookSyncState(bookId: string, userId: string, syncState: SyncState): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    'UPDATE books SET sync_state = ?, updated_at = ? WHERE book_id = ? AND owner_user_id = ?',
    [syncState, Date.now(), bookId, userId]
  );
  appLog.info('dal', 'Book sync state updated', { bookId, syncState });
}

// Scene operations
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

export async function getScene(sceneId: string, userId: string): Promise<SceneRow | null> {
  const database = await initializeDatabase();
  const result = await database.select<SceneRow[]>('SELECT * FROM scenes WHERE scene_id = ? AND owner_user_id = ?', [sceneId, userId]);
  return result.length > 0 ? result[0] : null;
}

export async function putScene(data: SceneRow): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    `INSERT OR REPLACE INTO scenes 
     (scene_id, book_id, version_id, chapter_id, owner_user_id, enc_scheme, content_enc, content_iv, has_proposals, rev_local, rev_cloud, pending_ops, sync_state, conflict_state, word_count, title, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.scene_id, data.book_id, data.version_id, data.chapter_id, data.owner_user_id, data.enc_scheme, data.content_enc, data.content_iv, data.has_proposals, data.rev_local, data.rev_cloud, data.pending_ops, data.sync_state, data.conflict_state, data.word_count, data.title, data.updated_at]
  );
  appLog.info('dal', 'Scene updated', { sceneId: data.scene_id, syncState: data.sync_state });
}

export async function markSceneSyncState(sceneId: string, userId: string, syncState: SyncState): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    'UPDATE scenes SET sync_state = ?, updated_at = ? WHERE scene_id = ? AND owner_user_id = ?',
    [syncState, Date.now(), sceneId, userId]
  );
  appLog.info('dal', 'Scene sync state updated', { sceneId, syncState });
}

export async function markSceneConflict(sceneId: string, userId: string, conflictState: ConflictState): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    'UPDATE scenes SET conflict_state = ?, updated_at = ? WHERE scene_id = ? AND owner_user_id = ?',
    [conflictState, Date.now(), sceneId, userId]
  );
  appLog.info('dal', 'Scene conflict state updated', { sceneId, conflictState });
}

export async function getScenesByBook(bookId: string, userId: string): Promise<SceneRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<SceneRow[]>('SELECT * FROM scenes WHERE book_id = ? AND owner_user_id = ?', [bookId, userId]);
  return result;
}

export async function getDirtyScenes(userId: string): Promise<SceneRow[]> {
  const database = await initializeDatabase();
  const result = await database.select<SceneRow[]>('SELECT * FROM scenes WHERE owner_user_id = ? AND sync_state = ?', [userId, 'dirty']);
  return result;
}

// Grant operations
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
  const database = await initializeDatabase();
  const result = await database.select<GrantRow[]>('SELECT * FROM grants WHERE owner_user_id = ? AND revoked = 0', [userId]);
  return result;
}

export async function putGrant(data: GrantRow): Promise<void> {
  const database = await initializeDatabase();
  await database.execute(
    `INSERT OR REPLACE INTO grants 
     (grant_id, owner_user_id, book_id, issuer_user_id, bsk_wrap_for_me, perms, revoked, issued_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.grant_id, data.owner_user_id, data.book_id, data.issuer_user_id, data.bsk_wrap_for_me, data.perms, data.revoked, data.issued_at, data.updated_at]
  );
  appLog.info('dal', 'Grant updated', { grantId: data.grant_id, bookId: data.book_id });
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
