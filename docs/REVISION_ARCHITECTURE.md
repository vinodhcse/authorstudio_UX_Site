# Comprehensive Revision History & Sync Architecture

## Overview

This document outlines a complete revision history and synchronization system for the AuthorStudio application that addresses the limitations of the current simple revision tracking system.

## Current System Limitations

The existing system only tracks:
- ❌ Current state with simple revision IDs (`revLocal`, `revCloud`)
- ❌ Basic conflict detection (Last-Writer-Wins)
- ❌ No historical versions or change tracking
- ❌ No ability to compare or rollback to previous versions
- ❌ No granular conflict resolution

## Proposed Architecture

### 1. **Hierarchical Revision Tracking**

```typescript
// Every entity now has comprehensive revision awareness
interface RevisionAwareEntity {
  id: string;
  revisionId: string;           // Current revision ID
  revisionHistory: string[];    // List of revisions that modified this entity
  syncState: SyncState;         // sync status
  conflictState: ConflictState; // conflict status
  lastModifiedAt: number;
  lastModifiedBy: string;
}

// Books contain full revision history
interface BookWithRevisions extends RevisionAwareEntity {
  versions: VersionWithRevisions[];
  fullRevisionHistory: RevisionHistory; // Complete revision system
}
```

### 2. **Granular Change Tracking**

```typescript
interface ChangeOperation {
  type: 'create' | 'update' | 'delete' | 'move' | 'rename';
  entityType: 'book' | 'version' | 'chapter' | 'character' | 'plotArc' | 'world';
  entityId: string;
  path?: string;        // JSON path for nested changes (e.g., "title", "characters.0.name")
  oldValue?: any;       // Previous value (for undo/diff)
  newValue?: any;       // New value (for redo/diff)
  metadata?: {
    wordCountDelta?: number;
    conflictResolution?: string;
  };
}

interface Revision {
  header: RevisionHeader;         // Who, when, why
  changes: ChangeOperation[];     // What changed
  snapshot?: any;                 // Optional full snapshot for major revisions
  checksum: string;               // Integrity verification
}
```

### 3. **Advanced Conflict Detection & Resolution**

```typescript
interface ConflictRecord {
  id: string;
  revisionId: string;
  entityType: string;
  entityId: string;
  path: string;                   // Specific field that conflicts
  localValue: any;
  remoteValue: any;
  baseValue?: any;                // Common ancestor value
  resolution?: 'local' | 'remote' | 'merge' | 'manual';
  resolvedValue?: any;
  resolvedBy?: string;
  resolvedAt?: number;
}
```

## How It Solves Your Questions

### **Question 1: Maintaining Revision History in Local and Cloud**

**Solution:**
- **Local Storage:** SQLite tables store complete revision history with change operations
- **Cloud Storage:** Same revision data synchronized to cloud with conflict resolution
- **Comparison:** Any two revisions can be compared by replaying change operations

```typescript
// Compare any two revisions
const diff = await RevisionManager.computeDiff(
  entityId,
  'rev_1642534567890_abc12',  // From revision
  'rev_1642534567990_def34'   // To revision
);

// Shows exactly what changed:
console.log(diff.changes); // Array of ChangeOperations
console.log(diff.summary.wordCountDelta); // Net word count change
console.log(diff.summary.entitiesModified); // Which entities were affected
```

### **Question 2: Jumping to Previous Revisions**

**Solution:**
- **Soft Rollback:** Creates new revision that undoes changes (preserves history)
- **Hard Rollback:** Directly sets current state to previous revision (destructive)
- **Entity Reconstruction:** Rebuild entity state at any revision by applying changes

```typescript
// Rollback to previous version
const rollbackResult = await EnhancedSyncEngine.rollbackBook(
  bookId,
  'rev_1642534567890_abc12', // Target revision
  {
    rollbackStrategy: 'soft',  // Creates new revision vs destructive
    affectChildren: true       // Also rollback versions, chapters, etc.
  }
);
```

### **Question 3: Understanding Changes Between Versions**

**Solution:**
- **Granular Change Tracking:** Every field change is recorded as a ChangeOperation
- **Hierarchical Diffs:** Compare changes at book, version, chapter, character, and plot arc levels
- **Rich Metadata:** Track word count changes, conflict resolutions, etc.

```typescript
// Get detailed comparison between two book states
const comparison = await EnhancedSyncEngine.compareBookRevisions(
  bookId,
  fromRevision,
  toRevision
);

// Results show changes at every level:
comparison.bookDiff;        // Book-level changes (title, author, etc.)
comparison.versionDiffs;    // Version-level changes
comparison.chapterDiffs;    // Chapter content changes
comparison.characterDiffs;  // Character modifications
comparison.plotArcDiffs;    // Plot structure changes
comparison.worldDiffs;      // World-building changes
```

### **Question 4: Managing Sub-data (Characters, Chapters, Plot Arcs)**

**Solution:**
- **Individual Revision Histories:** Each entity (character, chapter, plot arc) has its own revision history
- **Cascading Changes:** Changes propagate up the hierarchy (chapter change → version change → book change)
- **Selective Sync:** Can sync individual entities or entire hierarchies

```typescript
// Example: Character change creates revisions at multiple levels
const characterUpdate = await RevisionManager.createRevision(
  characterId,
  'character',
  [{
    type: 'update',
    entityType: 'character',
    entityId: 'char-123',
    path: 'description',
    oldValue: 'A brave warrior',
    newValue: 'A brave warrior king with a noble heart',
    metadata: { wordCountDelta: 20 }
  }],
  {
    authorId: 'user-1',
    authorName: 'John Doe',
    message: 'Enhanced character background'
  }
);

// This automatically creates cascading revisions:
// 1. Character revision: char-123 description changed
// 2. Version revision: version-456 updated (contains char-123)
// 3. Book revision: book-789 updated (contains version-456)
```

## Storage Architecture

### Database Schema

```sql
-- Main revision headers
CREATE TABLE revisions (
  id TEXT PRIMARY KEY,              -- rev_1642534567890_abc12
  entity_id TEXT NOT NULL,          -- book-123, version-456, etc.
  entity_type TEXT NOT NULL,        -- book, version, chapter, character, etc.
  parent_id TEXT,                   -- Parent revision for branching
  author_id TEXT NOT NULL,          -- Who made this change
  author_name TEXT NOT NULL,        -- Display name
  timestamp INTEGER NOT NULL,       -- When created
  message TEXT,                     -- Commit message
  tags JSON,                        -- ['auto-save', 'manual', etc.]
  is_minor BOOLEAN DEFAULT FALSE,   -- Auto-save vs manual
  branch_name TEXT DEFAULT 'main',  -- Support for branching
  checksum TEXT NOT NULL,           -- Integrity check
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual change operations
CREATE TABLE revision_changes (
  id TEXT PRIMARY KEY,
  revision_id TEXT REFERENCES revisions(id),
  change_type TEXT NOT NULL,        -- create, update, delete, move, rename
  entity_type TEXT NOT NULL,        -- book, version, chapter, etc.
  entity_id TEXT NOT NULL,          -- ID of entity being changed
  json_path TEXT,                   -- Path for nested changes
  old_value JSON,                   -- Previous value
  new_value JSON,                   -- New value
  metadata JSON,                    -- Additional metadata
  sort_order INTEGER                -- Order within revision
);

-- Conflict tracking
CREATE TABLE revision_conflicts (
  id TEXT PRIMARY KEY,
  revision_id TEXT REFERENCES revisions(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  json_path TEXT NOT NULL,
  local_value JSON,
  remote_value JSON,
  base_value JSON,                  -- Common ancestor value
  resolution TEXT,                  -- local, remote, merge, manual
  resolved_value JSON,
  resolved_by TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Sync Strategies

### 1. **Fast-Forward Sync**
- Local is behind remote with no conflicts
- Simply update local to remote state
- Used when: `local.revCloud === remote.revLocal`

### 2. **Three-Way Merge**
- Both local and remote have changes since common ancestor
- Merge changes automatically where possible
- Flag conflicts for manual resolution
- Used when: Both sides have diverged

### 3. **Rebase Sync**
- Replay local changes on top of remote changes
- Creates linear history (like Git rebase)
- Used when: Want to maintain clean history

## Example Workflows

### Workflow 1: Author & Collaborator Conflict

```typescript
// 1. Initial state: Both have rev_100
book = { revLocal: 'rev_100', revCloud: 'rev_100' }

// 2. Author modifies character offline
authorRevision = await RevisionManager.createRevision('book-123', 'book', [
  {
    type: 'update',
    entityType: 'character',
    entityId: 'char-1',
    path: 'description',
    oldValue: 'A brave warrior',
    newValue: 'A brave warrior king',
    metadata: { wordCountDelta: 5 }
  }
], { authorId: 'author-1', message: 'Enhanced character' });

// 3. Collaborator modifies same character
collabRevision = await RevisionManager.createRevision('book-123', 'book', [
  {
    type: 'update',
    entityType: 'character', 
    entityId: 'char-1',
    path: 'description',
    oldValue: 'A brave warrior',
    newValue: 'A skilled ranger',
    metadata: { wordCountDelta: 3 }
  }
], { authorId: 'collab-1', message: 'Updated background' });

// 4. Sync detects conflict
const mergeResult = await RevisionManager.mergeRevisions(
  'book-123',
  'rev_100',                    // Common base
  authorRevision.header.id,     // Local changes
  collabRevision.header.id      // Remote changes
);

// 5. Conflict detected for char-1.description
// UI shows both values for manual resolution
```

### Workflow 2: Revision Comparison

```typescript
// Show what changed between two versions
const comparison = await EnhancedSyncEngine.compareBookRevisions(
  'book-123',
  'rev_yesterday',
  'rev_today'
);

// Results:
{
  bookDiff: {
    changes: [
      {
        type: 'update',
        entityType: 'book',
        entityId: 'book-123',
        path: 'title',
        oldValue: 'Working Title',
        newValue: 'The Great Adventure'
      }
    ],
    summary: {
      totalChanges: 15,
      entitiesModified: ['book-123', 'char-1', 'char-2', 'chapter-3'],
      wordCountDelta: 1247,
      conflictsResolved: 2
    }
  },
  chapterDiffs: new Map([
    ['chapter-3', {
      changes: [
        {
          type: 'update',
          entityType: 'chapter',
          entityId: 'chapter-3',
          path: 'content',
          oldValue: '[TipTap JSON]',
          newValue: '[Updated TipTap JSON]',
          metadata: { wordCountDelta: 156 }
        }
      ]
    }]
  ])
}
```

## Benefits of This Architecture

1. **Complete History:** Never lose any changes, can see evolution over time
2. **Granular Diffs:** Understand exactly what changed at any level
3. **Smart Conflicts:** Detect and resolve conflicts at field level, not entity level
4. **Rollback Safety:** Soft rollbacks preserve history, hard rollbacks for clean slate
5. **Collaborative:** Multiple users can work simultaneously with proper conflict resolution
6. **Performance:** Incremental changes are more efficient than full snapshots
7. **Debugging:** Complete audit trail of who changed what and when
8. **Branching:** Support for experimental changes and feature branches

This architecture transforms the AuthorStudio from a simple sync system into a full-featured distributed version control system tailored for creative writing workflows.
