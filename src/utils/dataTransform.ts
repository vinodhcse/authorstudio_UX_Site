/**
 * Data Transformation Utilities for SurrealDB Integration
 * 
 * Purpose of Normalization Methods:
 * - SurrealDB uses snake_case naming convention
 * - Frontend uses camelCase naming convention
 * - Normalize: Convert from FE types (camelCase) to DB types (snake_case) + add entity_id
 * - Denormalize: Convert from DB types (snake_case) to FE types (camelCase)
 * - Enforce IDs using SurrealThing type for proper database record identification
 */

import type { Book, Version } from '../types/bookTypes';
import type { Collaborator } from '../types';

// SurrealDB Thing type for proper ID handling
export type SurrealThing =
  | string
  | { tb: string; id: string | number | { String?: string; Number?: number } };

/**
 * Helper function to ensure proper SurrealDB ID format
 */
function enforceSurrealId(id: string, table: string): SurrealThing {
  if (id.includes(':')) {
    return id; // Already has table prefix
  }
  return { tb: table, id: { String: id } };
}

// ================================
// BOOK NORMALIZATION METHODS
// ================================

/**
 * Normalize Book: Convert from FE camelCase to DB snake_case
 * Used when inserting/updating books in the database
 */
export function normalizeBook(book: Book) {
  return {
    book_id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    author: book.author,
    author_id: book.authorId,
    cover_image: book.coverImage,
    cover_image_ref: book.coverImageRef && (book.coverImageRef.id || (book.coverImageRef as any).assetId) ? {
      asset_id: book.coverImageRef.id || (book.coverImageRef as any).assetId,
      url: book.coverImageRef.url,
      meta: book.coverImageRef.meta,
    } : undefined,
    cover_images: book.coverImages,
    last_modified: book.lastModified,
    progress: book.progress,
    word_count: book.wordCount,
    genre: book.genre,
    subgenre: book.subgenre,
    collaborator_count: book.collaboratorCount,
    featured: book.featured,
    book_type: book.bookType,
    prose: book.prose,
    language: book.language,
    publisher: book.publisher,
    published_status: book.publishedStatus,
    publisher_link: book.publisherLink,
    print_isbn: book.printISBN,
    ebook_isbn: book.ebookISBN,
    publisher_logo: book.publisherLogo,
    synopsis: book.synopsis,
    description: book.description,
    is_shared: book.isShared,
    rev_local: book.revLocal,
    rev_cloud: book.revCloud,
    sync_state: book.syncState,
    conflict_state: book.conflictState,
    updated_at: book.updatedAt,
    versions: book.versions ? book.versions.map(normalizeVersion) : undefined,
    sha256: (book as any).sha256 || '', // Add required sha256 field with default empty string
    status: 'ACTIVE' // Default status for book records
  };
}

/**
 * Denormalize Book: Convert from DB snake_case to FE camelCase
 * Used when retrieving books from the database
 */
export function denormalizeBook(dbBook: any): Book {
  return {
    id: dbBook.book_id || dbBook.id,
    bookId: dbBook.book_id, // Keep for compatibility
    title: dbBook.title || '',
    subtitle: dbBook.subtitle,
    author: dbBook.author,
    authorId: dbBook.author_id,
    coverImage: dbBook.cover_image,
    coverImageRef: dbBook.cover_image_ref ? {
      id: dbBook.cover_image_ref.asset_id,
      url: dbBook.cover_image_ref.url,
      meta: dbBook.cover_image_ref.meta,
    } : undefined,
    coverImages: dbBook.cover_images || [],
    lastModified: dbBook.last_modified || new Date().toISOString(),
    progress: dbBook.progress || 0,
    wordCount: dbBook.word_count || 0,
    genre: dbBook.genre || '',
    subgenre: dbBook.subgenre,
    collaboratorCount: dbBook.collaborator_count || 0,
    featured: dbBook.featured || false,
    bookType: dbBook.book_type || '',
    prose: dbBook.prose || '',
    language: dbBook.language || '',
    publisher: dbBook.publisher || '',
    publishedStatus: dbBook.published_status || 'Unpublished',
    publisherLink: dbBook.publisher_link,
    printISBN: dbBook.print_isbn,
    ebookISBN: dbBook.ebook_isbn,
    publisherLogo: dbBook.publisher_logo,
    synopsis: dbBook.synopsis || '',
    description: dbBook.description,
    isShared: dbBook.is_shared,
    revLocal: dbBook.rev_local,
    revCloud: dbBook.rev_cloud,
    syncState: dbBook.sync_state || 'idle',
    conflictState: dbBook.conflict_state || 'none',
    updatedAt: dbBook.updated_at,
    versions: dbBook.versions ? dbBook.versions.map(denormalizeVersion) : [],
    collaborators: [] // Will be populated separately if needed
  };
}

// ================================
// VERSION NORMALIZATION METHODS
// ================================

/**
 * Normalize Version: Convert from FE camelCase to DB snake_case
 * Used when inserting/updating versions in the database
 */
export function normalizeVersion(version: Version) {
  return {
    version_id: version.id,
    book_id: undefined, // Will be set by the calling context
    name: version.name,
    status: version.status,
    word_count: version.wordCount,
    created_at: version.createdAt,
    contributor: version.contributor,
    rev_local: version.revLocal,
    rev_cloud: version.revCloud,
    sync_state: version.syncState,
    conflict_state: version.conflictState,
    updated_at: version.updatedAt,
    // Free-form content arrays
    chapters: version.chapters,
    plot_canvas: version.plotCanvas,
    characters: version.characters,
    plot_arcs: version.plotArcs,
    worlds: version.worlds
  };
}

/**
 * Denormalize Version: Convert from DB snake_case to FE camelCase
 * Used when retrieving versions from the database
 */
export function denormalizeVersion(dbVersion: any): Version {
  return {
    id: dbVersion.version_id || dbVersion.id,
    name: dbVersion.name || '',
    status: dbVersion.status || 'active',
    wordCount: dbVersion.word_count || 0,
    createdAt: dbVersion.created_at || new Date().toISOString(),
    contributor: dbVersion.contributor || { name: '', avatar: '' },
    revLocal: dbVersion.rev_local,
    revCloud: dbVersion.rev_cloud,
    syncState: dbVersion.sync_state || 'idle',
    conflictState: dbVersion.conflict_state || 'none',
    updatedAt: dbVersion.updated_at,
    // Free-form content arrays
    chapters: dbVersion.chapters || [],
    plotCanvas: dbVersion.plot_canvas || null,
    characters: dbVersion.characters || [],
    plotArcs: dbVersion.plot_arcs || [],
    worlds: dbVersion.worlds || []
  };
}

// ================================
// COLLABORATOR NORMALIZATION METHODS
// ================================

/**
 * Normalize Collaborator: Convert from FE camelCase to DB snake_case
 * Used when inserting/updating collaborators in the database
 */
export function normalizeCollaborator(collaborator: Collaborator, bookId: string) {
  return {
    collaborator_id: collaborator.id,
    book_id: bookId,
    user_id: collaborator.id, // The actual user ID
    avatar: collaborator.avatar,
    name: collaborator.name,
    email: collaborator.email,
    role: collaborator.role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'ACTIVE' // Default status for collaborator records
  };
}

/**
 * Denormalize Collaborator: Convert from DB snake_case to FE camelCase
 * Used when retrieving collaborators from the database
 */
export function denormalizeCollaborator(dbCollaborator: any): Collaborator {
  return {
    id: dbCollaborator.user_id || dbCollaborator.collaborator_id,
    avatar: dbCollaborator.avatar || '',
    name: dbCollaborator.name,
    email: dbCollaborator.email,
    role: dbCollaborator.role
  };
}

// ================================
// BATCH NORMALIZATION HELPERS
// ================================

/**
 * Normalize an array of books for batch operations
 */
export function normalizeBooks(books: Book[]) {
  return books.map(normalizeBook);
}

/**
 * Denormalize an array of books from database results
 */
export function denormalizeBooks(dbBooks: any[]): Book[] {
  return dbBooks.map(denormalizeBook);
}

/**
 * Normalize an array of versions for batch operations
 */
export function normalizeVersions(versions: Version[], bookId: string) {
  return versions.map(version => ({
    ...normalizeVersion(version),
    book_id: bookId
  }));
}

/**
 * Denormalize an array of versions from database results
 */
export function denormalizeVersions(dbVersions: any[]): Version[] {
  return dbVersions.map(denormalizeVersion);
}

/**
 * Normalize an array of collaborators for batch operations
 */
export function normalizeCollaborators(collaborators: Collaborator[], bookId: string) {
  return collaborators.map(collaborator => normalizeCollaborator(collaborator, bookId));
}

/**
 * Denormalize an array of collaborators from database results
 */
export function denormalizeCollaborators(dbCollaborators: any[]): Collaborator[] {
  return dbCollaborators.map(denormalizeCollaborator);
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Generate a new revision ID
 */
export function newRev(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Get current timestamp
 */
export function now(): number {
  return Date.now();
}

/**
 * Ensure SurrealDB compatible ID format for books
 */
export function enforceBookId(bookId: string): SurrealThing {
  return enforceSurrealId(bookId, 'book');
}

/**
 * Ensure SurrealDB compatible ID format for versions
 */
export function enforceVersionId(versionId: string): SurrealThing {
  return enforceSurrealId(versionId, 'version');
}

/**
 * Ensure SurrealDB compatible ID format for collaborators
 */
export function enforceCollaboratorId(collaboratorId: string): SurrealThing {
  return enforceSurrealId(collaboratorId, 'collaborator');
}

/**
 * Normalize book data for database insertion with enforced IDs
 */
export function normalizeBookForDB(book: Book) {
  const normalized = normalizeBook(book);
  return {
    ...normalized,
    id: enforceBookId(book.id)
  };
}

/**
 * Normalize version data for database insertion with enforced IDs
 */
export function normalizeVersionForDB(version: Version, bookId: string) {
  const normalized = normalizeVersion(version);
  return {
    ...normalized,
    id: enforceVersionId(version.id),
    book_id: enforceBookId(bookId)
  };
}

/**
 * Normalize collaborator data for database insertion with enforced IDs
 */
export function normalizeCollaboratorForDB(collaborator: Collaborator, bookId: string) {
  const normalized = normalizeCollaborator(collaborator, bookId);
  return {
    ...normalized,
    id: enforceCollaboratorId(collaborator.id),
    book_id: enforceBookId(bookId)
  };
}
