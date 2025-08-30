// Sync utilities for BookContext - conflict resolution and merging logic

import type { Book, Version } from '../types/bookTypes';
import { newRev, now } from '../data/dal';
import { appLog } from '../auth/fileLogger';

/**
 * Merge book data between local and cloud versions
 * Implements Last Writer Wins (LWW) at book level and per-version level
 */
export function mergeBookLocalAndCloud(local: Book, cloud: Book): Book {
  const merged: Book = { ...local };
  
  // Book-level merge: prefer newer updatedAt for metadata fields
  const bookFields = [
    'title', 'subtitle', 'author', 'authorId', 'coverImage', 'coverImageRef',
    'coverImages', 'progress', 'wordCount', 'genre', 'subgenre', 
    'collaboratorCount', 'collaborators', 'featured', 'bookType', 'prose',
    'language', 'publisher', 'publishedStatus', 'publisherLink', 'printISBN',
    'ebookISBN', 'publisherLogo', 'synopsis', 'description', 'isShared'
  ];

  const localTime = local.updatedAt || 0;
  const cloudTime = cloud.updatedAt || 0;

  // If cloud is newer for book metadata, take cloud fields
  if (cloudTime > localTime) {
    bookFields.forEach(field => {
      if (cloud[field as keyof Book] !== undefined) {
        (merged as any)[field] = cloud[field as keyof Book];
      }
    });
    merged.lastModified = cloud.lastModified;
  }

  // Versions: keep IDs only; accept strings or objects defensively
  const toId = (v: any) => (typeof v === 'string' ? v : v?.id);
  const localIds = Array.isArray(local.versions) ? (local.versions as any[]).map(toId).filter(Boolean) : [];
  const cloudIds = Array.isArray(cloud.versions) ? (cloud.versions as any[]).map(toId).filter(Boolean) : [];
  const mergedIds = Array.from(new Set<string>([...localIds, ...cloudIds]));
  merged.versions = mergedIds;
  merged.revCloud = cloud.revCloud || cloud.revLocal;
  merged.syncState = 'idle';
  merged.conflictState = 'none';

  return merged;
}

/**
 * Determine sync action needed for a book
 */
export function determineSyncAction(local: Book, cloud?: Book): 'push' | 'pull' | 'conflict' | 'idle' {
  if (!cloud) {
    // No cloud version - push if dirty
    return local.syncState === 'dirty' ? 'push' : 'idle';
  }

  const localDirty = local.syncState === 'dirty';
  const localRevCloud = local.revCloud;
  const cloudRev = cloud.revCloud || cloud.revLocal;

  if (localDirty && localRevCloud !== cloudRev) {
    // Local is dirty and cloud has moved - conflict
    return 'conflict';
  }

  if (localDirty) {
    // Local is dirty and cloud hasn't moved - safe to push
    return 'push';
  }

  const cloudTime = cloud.updatedAt || 0;
  const localTime = local.updatedAt || 0;

  if (cloudTime > localTime) {
    // Cloud is newer - pull
    return 'pull';
  }

  return 'idle';
}

/**
 * Resolve conflict according to user choice
 */
export function resolveBookConflict(
  local: Book, 
  cloud: Book, 
  resolution: 'local' | 'cloud' | 'merge'
): Book {
  switch (resolution) {
    case 'local':
      // Force local version, bump revision for push
      return {
        ...local,
        revLocal: newRev(),
        syncState: 'dirty',
        conflictState: 'none',
        updatedAt: now()
      };

    case 'cloud':
      // Take cloud version, mark as synced
      return {
        ...cloud,
        revLocal: cloud.revCloud || cloud.revLocal || newRev(),
        revCloud: cloud.revCloud || cloud.revLocal,
        syncState: 'idle',
        conflictState: 'none',
        updatedAt: cloud.updatedAt || now()
      };

    case 'merge':
      // Use smart merge logic
      const merged = mergeBookLocalAndCloud(local, cloud);
      return {
        ...merged,
        revLocal: newRev(),
        syncState: merged.conflictState === 'needs_review' ? 'conflict' : 'dirty',
        updatedAt: now()
      };

    default:
      throw new Error(`Unknown resolution strategy: ${resolution}`);
  }
}

/**
 * Mark a book as dirty after local changes
 */
export function markBookDirty(book: Book, _versionId?: string): Book {
  const updatedBook = {
    ...book,
    revLocal: newRev(),
    syncState: 'dirty' as const,
    updatedAt: now()
  };

  return updatedBook;
}

/**
 * Update a specific version in a book's versions array
 */
export function updateVersionInBook(
  book: Book, 
  _versionId: string, 
  _updates: Partial<Version>
): Book {
  return {
    ...book,
  // No-op on versions array (string IDs only); version row is updated elsewhere
    revLocal: newRev(),
    syncState: 'dirty',
    updatedAt: now()
  };
}

/**
 * Add a new version to a book
 */
export function addVersionToBook(book: Book, _newVersion: Omit<Version, 'id'>): Book {
  const newId = crypto.randomUUID();
  return {
    ...book,
    versions: [...(Array.isArray(book.versions) ? book.versions : []), newId],
    revLocal: newRev(),
    syncState: 'dirty',
    updatedAt: now()
  };
}

/**
 * Remove a version from a book
 */
export function removeVersionFromBook(book: Book, versionId: string): Book {
  return {
    ...book,
  versions: (Array.isArray(book.versions) ? book.versions : []).filter(v => v !== versionId),
    revLocal: newRev(),
    syncState: 'dirty',
    updatedAt: now()
  };
}

/**
 * Get books that need syncing (dirty state)
 */
export function getDirtyBooks(books: Book[]): Book[] {
  return books.filter(book => book.syncState === 'dirty');
}

/**
 * Get books with conflicts
 */
export function getConflictedBooks(books: Book[]): Book[] {
  return books.filter(book => 
    book.conflictState === 'needs_review' || 
    book.syncState === 'conflict'
  );
}

/**
 * Log sync decisions for debugging
 */
export async function logSyncDecision(
  bookId: string, 
  action: string, 
  context: any
): Promise<void> {
  await appLog.info('sync', `Book sync decision: ${action}`, {
    bookId,
    action,
    ...context
  });
}
