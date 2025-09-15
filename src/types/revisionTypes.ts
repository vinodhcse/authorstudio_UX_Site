/**
 * Comprehensive Revision History System
 * 
 * This system provides:
 * - Full revision history tracking
 * - Granular change detection and diffing
 * - Version comparison and rollback
 * - Conflict resolution with merge strategies
 * - Distributed sync with operational transforms
 */

export interface RevisionHeader {
  id: string;                    // "rev_1642534567890_abc12"
  parentId?: string;             // Parent revision ID (for branching)
  authorId: string;              // Who made this change
  authorName: string;            // Display name
  timestamp: number;             // When this revision was created
  message?: string;              // Optional commit message
  tags?: string[];               // Tags like "major", "auto-save", "manual"
  isMinor: boolean;              // true for auto-saves, false for major commits
  branchName?: string;           // Support for branching ("main", "user-123", etc.)
  mergeStrategy?: 'fast-forward' | 'merge-commit' | 'rebase';
}

export interface ChangeOperation {
  type: 'create' | 'update' | 'delete' | 'move' | 'rename';
  entityType: 'book' | 'version' | 'chapter' | 'character' | 'plotArc' | 'world';
  entityId: string;              // ID of the entity being changed
  path?: string;                 // JSON path for nested changes (e.g., "versions.0.chapters.2.title")
  oldValue?: any;                // Previous value (for undo/diff)
  newValue?: any;                // New value (for redo/diff)
  metadata?: {
    wordCountDelta?: number;     // Change in word count
    conflictResolution?: string; // How conflicts were resolved
    [key: string]: any;
  };
}

export interface RevisionDiff {
  fromRevision: string;
  toRevision: string;
  changes: ChangeOperation[];
  summary: {
    totalChanges: number;
    entitiesModified: string[];
    wordCountDelta: number;
    conflictsResolved: number;
  };
}

export interface Revision {
  header: RevisionHeader;
  changes: ChangeOperation[];    // What changed in this revision
  snapshot?: any;                // Optional full snapshot for major revisions
  checksum: string;              // Integrity verification
}

export interface RevisionHistory {
  currentRevision: string;
  revisions: Map<string, Revision>;
  branches: Map<string, string>; // branch name -> latest revision ID
  conflicts: ConflictRecord[];
}

export interface ConflictRecord {
  id: string;
  revisionId: string;
  entityType: string;
  entityId: string;
  path: string;
  localValue: any;
  remoteValue: any;
  baseValue?: any;               // Common ancestor value
  resolution?: 'local' | 'remote' | 'merge' | 'manual';
  resolvedValue?: any;
  resolvedBy?: string;
  resolvedAt?: number;
}

// Enhanced entity interfaces with revision history
export interface RevisionAwareEntity {
  id: string;
  revisionId: string;            // Current revision ID
  revisionHistory?: string[];    // List of revision IDs that modified this entity
  syncState: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';
  conflictState: 'none' | 'needs_review' | 'blocked';
  lastModifiedAt: number;
  lastModifiedBy: string;
}

export interface BookWithRevisions extends RevisionAwareEntity {
  // ... existing book fields
  versions: VersionWithRevisions[];
  fullRevisionHistory: RevisionHistory;  // Full revision system for the book
}

export interface VersionWithRevisions extends RevisionAwareEntity {
  // ... existing version fields
  chapters: ChapterWithRevisions[];
  characters: CharacterWithRevisions[];
  plotArcs: PlotArcWithRevisions[];
  worlds: WorldWithRevisions[];
}

export interface ChapterWithRevisions extends RevisionAwareEntity {
  // ... existing chapter fields
  contentRevisions: ContentRevision[];
}

export interface CharacterWithRevisions extends RevisionAwareEntity {
  // ... existing character fields
}

export interface PlotArcWithRevisions extends RevisionAwareEntity {
  // ... existing plot arc fields
}

export interface WorldWithRevisions extends RevisionAwareEntity {
  // ... existing world fields
}

export interface ContentRevision {
  id: string;
  chapterId: string;
  revisionId: string;
  content: any;                  // TipTap JSON content
  wordCount: number;
  createdAt: number;
  createdBy: string;
  isAutoSave: boolean;
}

// Operational Transform types for real-time collaboration
export interface Operation {
  type: 'retain' | 'insert' | 'delete' | 'format';
  length?: number;               // For retain/delete
  content?: any;                 // For insert
  attributes?: any;              // For format
}

export interface OperationalTransform {
  operations: Operation[];
  baseRevision: string;
  authorId: string;
  timestamp: number;
}
