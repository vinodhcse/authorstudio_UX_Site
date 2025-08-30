// FileAsset and FileAssetLink interfaces
export interface FileAsset {
  id: string;
  sha256: string;
  ext: string;
  mime: string;
  size_bytes: number;
  width?: number;
  height?: number;
  local_path?: string;
  remote_id?: string;
  remote_url?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface FileAssetLink {
  id?: string;
  asset_id: string;
  entity_type: string;
  entity_id: string;
  role: string;
  sort_order?: number;
  tags?: string;
  description?: string;
}
import Dexie from 'dexie';

// Interfaces from surrealDal.ts
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

export interface BookRow {
  bookId: string;
  owner_user_id: string;
  title: string;
  is_shared: number;
  cover_image?: string;
  cover_image_ref?: any;
  cover_images?: string[];
  enc_metadata?: Uint8Array;
  enc_schema?: string;
  is_authored?: number;
  is_editable?: number;
  is_reviewable?: number;
  access_role?: string;
  rev_local?: string;
  rev_cloud?: string;
  sync_state: string;
  conflict_state: string;
  last_local_change?: number;
  last_cloud_change?: number;
  updated_at?: number;
}

export interface VersionRow {
  version_id: string;
  bookId: string;
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
  // Added fields from Version interface
  characters?: any[];
  plotArcs?: any[];
  plotCanvas?: any;
  worlds?: any[];
  chapters?: any[];
  contributor?: {
    name: string;
    avatar: string;
  };
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

// Dexie database definition
class AuthorStudioDB extends Dexie {
  books!: Dexie.Table<BookRow, string>;
  versions!: Dexie.Table<VersionRow, string>;
  chapters!: Dexie.Table<ChapterRow, string>;
  scenes!: Dexie.Table<SceneRow, string>;
  revisionHistory!: Dexie.Table<any, string>;
  grants!: Dexie.Table<GrantRow, string>;
  file_assets!: Dexie.Table<FileAsset, string>;
  file_asset_links!: Dexie.Table<FileAssetLink, string>;

  constructor() {
    super('AuthorStudioDB');
    this.version(1).stores({
      books: 'bookId, owner_user_id, title, sync_state, conflict_state',
      versions: 'version_id, bookId, owner_user_id, is_current, sync_state, conflict_state',
      chapters: 'chapter_id, book_id, version_id, owner_user_id, sync_state, conflict_state',
      scenes: 'scene_id, book_id, version_id, chapter_id, owner_user_id, sync_state, conflict_state',
      revisionHistory: 'id',
      grants: 'grant_id, owner_user_id, book_id, issuer_user_id, revoked',
      file_assets: 'id, sha256, status, remote_id, remote_url',
      file_asset_links: '++id, asset_id, entity_type, entity_id, role',
    });
    this.books = this.table('books');
    this.versions = this.table('versions');
    this.chapters = this.table('chapters');
    this.scenes = this.table('scenes');
    this.revisionHistory = this.table('revisionHistory');
    this.grants = this.table('grants');
    this.file_assets = this.table('file_assets');
    this.file_asset_links = this.table('file_asset_links');
  }
}

export const db = new AuthorStudioDB();

// Type conversion utilities
import { Book } from '../types/bookTypes';

// Convert Book to BookRow for database storage
export function bookToBookRow(book: Book, ownerUserId: string): BookRow {
  return {
    bookId: book.id,
    owner_user_id: ownerUserId,
    title: book.title,
    is_shared: book.isShared ? 1 : 0,
    cover_image: book.coverImage,
    cover_image_ref: book.coverImageRef,
    cover_images: book.coverImages,
    sync_state: book.syncState || 'idle',
    conflict_state: book.conflictState || 'none',
    last_local_change: Date.now(),
    updated_at: book.updatedAt || Date.now(),
    rev_local: book.revLocal,
    rev_cloud: book.revCloud,
    is_authored: 1,
    is_editable: 1,
    is_reviewable: 1,
    access_role: 'AUTHOR'
  };
}

// Convert BookRow to Book for application use
export function bookRowToBook(bookRow: BookRow): Book {
  return {
    id: bookRow.bookId,
    bookId: bookRow.bookId,
    title: bookRow.title,
    subtitle: '',
    author: '',
    authorId: bookRow.owner_user_id,
    coverImage: bookRow.cover_image,
    coverImageRef: bookRow.cover_image_ref,
    coverImages: bookRow.cover_images,
    lastModified: new Date(bookRow.updated_at || Date.now()).toISOString(),
    progress: 0,
    wordCount: 0,
    genre: '',
    subgenre: '',
    collaboratorCount: 0,
    featured: false,
    bookType: 'novel',
    prose: '',
    language: 'en',
    publisher: '',
    publishedStatus: 'draft',
    publisherLink: '',
    printISBN: '',
    ebookISBN: '',
    publisherLogo: '',
    synopsis: '',
    description: '',
    versions: [],
    isShared: bookRow.is_shared === 1,
    revLocal: bookRow.rev_local,
    revCloud: bookRow.rev_cloud,
    syncState: bookRow.sync_state as any,
    conflictState: bookRow.conflict_state as any,
    updatedAt: bookRow.updated_at
  };
}

// FileAsset CRUD and query methods
export async function createFileAsset(asset: FileAsset): Promise<string> {
  await db.file_assets.add(asset);
  return asset.id;
}

export async function getFileAssetById(id: string): Promise<FileAsset | undefined> {
  return db.file_assets.get(id);
}

export async function getFileAssetBySha256(sha256: string): Promise<FileAsset | undefined> {
  return db.file_assets.where('sha256').equals(sha256).first();
}

export async function updateFileAsset(id: string, updates: Partial<FileAsset>): Promise<void> {
  await db.file_assets.update(id, updates);
}

export async function getFileAssetsByStatus(status: string): Promise<FileAsset[]> {
  return db.file_assets.where('status').equals(status).toArray();
}

export async function deleteFileAsset(id: string): Promise<void> {
  await db.file_assets.delete(id);
}

// FileAssetLink CRUD and query methods

export async function createFileAssetLink(link: FileAssetLink): Promise<string> {
  return db.file_asset_links.add(link);
}

export async function upsertFileAssetLink(link: FileAssetLink): Promise<string> {
  // Upsert: update if exists, else add
  const existing = await db.file_asset_links
    .where(['asset_id', 'entity_type', 'entity_id', 'role'])
    .equals([link.asset_id, link.entity_type, link.entity_id, link.role])
    .first();
  if (existing && existing.id) {
    await db.file_asset_links.update(existing.id, link);
    return existing.id;
  } else {
    return db.file_asset_links.add(link);
  }
}

export async function getFileAssetLinksByEntity(entityType: string, entityId: string): Promise<FileAssetLink[]> {
  return db.file_asset_links
    .where(['entity_type', 'entity_id'])
    .equals([entityType, entityId])
    .toArray();
}

export async function getFileAssetLinksByEntityRole(entityType: string, entityId: string, role: string): Promise<FileAssetLink[]> {
  return db.file_asset_links
    .where(['entity_type', 'entity_id', 'role'])
    .equals([entityType, entityId, role])
    .toArray();
}

export async function getFileAssetLinksByAsset(assetId: string): Promise<FileAssetLink[]> {
  return db.file_asset_links.where('asset_id').equals(assetId).toArray();
}

export async function deleteFileAssetLink(id: string): Promise<void> {
  await db.file_asset_links.delete(id);
}

export async function deleteFileAssetLinksByEntityRole(entityType: string, entityId: string, role: string): Promise<void> {
  const links = await getFileAssetLinksByEntityRole(entityType, entityId, role);
  for (const link of links) {
    if (link.id !== undefined) {
      await db.file_asset_links.delete(link.id as string);
    }
  }
}

export async function deleteFileAssetLinksByAsset(assetId: string): Promise<void> {
  const links = await getFileAssetLinksByAsset(assetId);
  for (const link of links) {
    if (link.id !== undefined) {
      await db.file_asset_links.delete(link.id as string);
    }
  }
}
