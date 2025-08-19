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

  // Version-level merge by ID
  const localVersionsMap = new Map(local.versions.map(v => [v.id, v]));
  const cloudVersionsMap = new Map(cloud.versions.map(v => [v.id, v]));
  const allVersionIds = new Set([...localVersionsMap.keys(), ...cloudVersionsMap.keys()]);

  const mergedVersions: Version[] = [];

  for (const versionId of allVersionIds) {
    const localVersion = localVersionsMap.get(versionId);
    const cloudVersion = cloudVersionsMap.get(versionId);

    if (localVersion && cloudVersion) {
      // Both exist - merge by Last Writer Wins
      const localVersionTime = localVersion.updatedAt || 0;
      const cloudVersionTime = cloudVersion.updatedAt || 0;

      let mergedVersion: Version;
      if (cloudVersionTime > localVersionTime) {
        mergedVersion = { ...cloudVersion };
        // If both were dirty, mark as conflict for user review
        if (localVersion.syncState === 'dirty' && cloudVersion.syncState === 'dirty') {
          mergedVersion.conflictState = 'needs_review';
        }
      } else {
        mergedVersion = { ...localVersion };
      }

      mergedVersions.push(mergedVersion);
    } else if (localVersion) {
      // Only local exists - keep it
      mergedVersions.push(localVersion);
    } else if (cloudVersion) {
      // Only cloud exists - add it
      mergedVersions.push(cloudVersion);
    }
  }

  merged.versions = mergedVersions;
  merged.revCloud = cloud.revCloud || cloud.revLocal;
  merged.syncState = 'idle';

  // Check if any versions still have conflicts
  const hasConflicts = mergedVersions.some(v => v.conflictState === 'needs_review');
  if (hasConflicts) {
    merged.conflictState = 'needs_review';
  } else {
    merged.conflictState = 'none';
  }

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
export function markBookDirty(book: Book, versionId?: string): Book {
  const updatedBook = {
    ...book,
    revLocal: newRev(),
    syncState: 'dirty' as const,
    updatedAt: now()
  };

  // If a specific version was changed, mark it dirty too
  if (versionId) {
    updatedBook.versions = book.versions.map(version => {
      if (version.id === versionId) {
        return {
          ...version,
          revLocal: newRev(),
          syncState: 'dirty' as const,
          updatedAt: now()
        };
      }
      return version;
    });
  }

  return updatedBook;
}

/**
 * Update a specific version in a book's versions array
 */
export function updateVersionInBook(
  book: Book, 
  versionId: string, 
  updates: Partial<Version>
): Book {
  const updatedVersions = book.versions.map(version => {
    if (version.id === versionId) {
      return {
        ...version,
        ...updates,
        updatedAt: now()
      };
    }
    return version;
  });

  return {
    ...book,
    versions: updatedVersions,
    revLocal: newRev(),
    syncState: 'dirty',
    updatedAt: now()
  };
}

/**
 * Add a new version to a book
 */
export function addVersionToBook(book: Book, newVersion: Omit<Version, 'id'>): Book {
  const version: Version = {
    ...newVersion,
    id: crypto.randomUUID(),
    revLocal: newRev(),
    syncState: 'dirty',
    conflictState: 'none',
    updatedAt: now(),
    chapters: newVersion.chapters || [],
    characters: newVersion.characters || [],
    plotArcs: newVersion.plotArcs || [],
    worlds: newVersion.worlds || [],
    plotCanvas: newVersion.plotCanvas || null
  };

  return {
    ...book,
    versions: [...book.versions, version],
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
    versions: book.versions.filter(v => v.id !== versionId),
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
