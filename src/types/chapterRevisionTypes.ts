/**
 * Chapter Revision Types
 * 
 * Types for the chapter revision system following the PRD requirements
 */

export interface ChapterRevision {
  rev_id: string;
  chapter_id: string;
  book_id: string;
  version_id: string;
  device_id: string;
  parent_rev_id: string | null;
  base_cloud_rev_id: string | null;
  timestamp: number;
  author_id: string;
  author_name: string;
  is_minor: boolean;
  message: string | null;
  snapshot: TipTapDoc; // Full TipTap JSON
  word_count: number;
  char_count: number;
  // Phase 4: Sync integration properties
  sync_state?: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';
  cloud_rev_id?: string | null; // Latest cloud revision ID
  conflict_state?: 'none' | 'pending' | 'resolved';
  last_sync_timestamp?: number;
}

export interface TipTapDoc {
  type: 'doc';
  content?: any[];
}

export interface ChapterRevisionRecord extends ChapterRevision {
  // Database record version with additional metadata
  created_at?: string;
  updated_at?: string;
}

export interface RevisionHistoryEntry {
  revision: ChapterRevision;
  isWorkingMinor: boolean;
  isCurrent: boolean;
  branches: string[];
}

export interface RevisionCompareResult {
  leftRevision: ChapterRevision;
  rightRevision: ChapterRevision;
  diffs: RevisionDiff[];
  wordCountDelta: number;
  conflictCount: number;
}

export interface RevisionDiff {
  type: 'insert' | 'delete' | 'replace' | 'move';
  path: number[]; // Node path in TipTap document
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface RevisionConflict {
  id: string;
  chapterId: string;
  localRevision: ChapterRevision;
  cloudRevision: ChapterRevision;
  baseRevision: ChapterRevision | null;
  conflictDiffs: RevisionDiff[];
  status: 'pending' | 'resolved' | 'abandoned';
  resolutionStrategy?: 'local' | 'cloud' | 'manual';
}

export interface RevisionSaveOptions {
  chapterId: string;
  content: TipTapDoc;
  isMinor?: boolean;
  message?: string;
  authorId?: string;
  authorName?: string;
}

export type RevisionSyncState = 'idle' | 'pushing' | 'pulling' | 'conflict';

export interface ChapterRevisionMetadata {
  chapterId: string;
  currentRevisionId: string;
  latestMajorRevisionId: string | null;
  workingMinorRevisionId: string | null;
  revisionCount: number;
  lastModified: number;
  syncState: RevisionSyncState;
}

// Phase 4: Enhanced sync integration types
export interface ChapterSyncState {
  chapterId: string;
  localRevId: string;
  cloudRevId: string | null;
  baseCloudRevId: string | null;
  syncState: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';
  conflictState: 'none' | 'pending' | 'resolved';
  lastSyncTimestamp: number;
  pendingChanges: number;
}

export interface ChapterSyncResult {
  success: boolean;
  conflicts?: ChapterConflict[];
  mergedRevision?: ChapterRevision;
  error?: string;
  newCloudRevId?: string;
}

export interface ChapterConflict {
  path: string; // JSON path to conflicted content
  localValue: any;
  remoteValue: any;
  baseValue: any;
  conflictType: 'content' | 'structure' | 'metadata';
  autoResolvable: boolean;
}

export interface ChapterSyncOptions {
  strategy: 'fast-forward' | 'merge' | 'rebase';
  autoResolveConflicts: boolean;
  createBackup: boolean;
  forceSync?: boolean;
}
