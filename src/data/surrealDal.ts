// SurrealDB-backed DAL accessed via Tauri commands
// Mirrors original dal.ts signatures to minimize UI changes

// Dexie migration: SurrealDB code removed. Use dexieDal.ts for DB operations.

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