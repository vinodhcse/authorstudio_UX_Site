# Chapter Content & Revision Management Guide

## Overview

The updated chapter management system now properly follows the `Chapter` interface from `types.ts` and implements a sophisticated revision management system with local-first sync strategy.

## Key Changes Made

### 1. ✅ Local-First Saving Strategy

- **Changed**: No longer saves to API immediately on every keystroke
- **Now**: Saves locally first, marks content as `dirty`, syncs to cloud only when:
  - User manually clicks "Sync to Cloud"
  - Auto-sync after 60 minutes of accumulated changes (can be implemented)
  - Major revision (non-minor saves)

### 2. ✅ Proper Chapter Structure

The chapter content now follows the correct `Chapter` interface:

```json
{
  "id": "1755059597254_fy73944al",
  "title": "Chapter 1",
  "position": 1,
  "createdAt": "2025-08-13T04:33:17.556Z",
  "updatedAt": "2025-08-13T04:35:22.123Z",
  
  "linkedPlotNodeId": "1755059595427_plotnode123",
  "linkedAct": "1755059595427_ocqxiluua", 
  "linkedOutline": "1755059594820_uiitzyxyl",
  "linkedScenes": ["1755059595428_scene456"], // ✅ Now includes scene nodes
  
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Chapter 1" }]
      },
      {
        "type": "sceneMetaSection",
        "attrs": {
          "summary": "",
          "goals": "",
          "characters": [],
          "plotNodeId": "1755059595428_scene456",
          "collapsed": false
        }
      },
      {
        "type": "paragraph", 
        "content": [{ "type": "text", "text": "Chapter content here..." }]
      }
    ],
    "metadata": {
      "totalCharacters": 245,
      "totalWords": 42,
      "readingTime": 1,
      "lastEditedBy": "user123",
      "lastEditedAt": "2025-08-13T04:35:22.123Z"
    }
  },
  
  "revisions": [
    {
      "id": "rev_1755059598001_abc123",
      "timestamp": "2025-08-13T04:33:17.556Z",
      "authorId": "user123",
      "authorName": "John Author",
      "content": { /* TipTap content snapshot */ },
      "changes": [],
      "isMinor": true,
      "message": null
    },
    {
      "id": "rev_1755059600234_def456", 
      "timestamp": "2025-08-13T04:35:22.123Z",
      "authorId": "user123",
      "authorName": "John Author", 
      "content": { /* Updated TipTap content */ },
      "changes": [],
      "isMinor": false,
      "message": "Added character dialogue"
    }
  ],
  "currentRevisionId": "rev_1755059600234_def456",
  
  "collaborativeState": {
    "pendingChanges": [],
    "needsReview": false,
    "reviewerIds": [],
    "approvedBy": [],
    "rejectedBy": [],
    "mergeConflicts": []
  },
  
  "syncState": "dirty", // idle | dirty | pushing | pulling | conflict
  "revLocal": "1755059600234", // local revision timestamp
  "revCloud": "1755059598001", // last cloud sync timestamp
  
  "wordCount": 42,
  "hasProposals": false,
  "characters": ["char123", "char456"],
  "isComplete": false,
  "status": "DRAFT",
  "authorId": "user123",
  "lastModifiedBy": "user123"
}
```

### 3. ✅ Scene Plot Node Creation

- **Fixed**: New chapters now create a scene plot node and add it to `linkedScenes[]`
- **Structure**: Chapter creation now generates both chapter and scene narrative nodes
- **References**: Proper linking between outline → act → chapter → scene

### 4. ✅ Revision Management System

#### Revision Types:
- **Minor Revisions** (`isMinor: true`): Auto-saves, keystroke captures, draft changes
- **Major Revisions** (`isMinor: false`): Manual saves, significant milestones, collaborator submissions

#### Sample Revision Data:

```typescript
interface Revision {
  id: string;                    // "rev_1755059598001_abc123"
  timestamp: string;             // ISO string
  authorId: string;              // User who made the change
  authorName: string;            // Display name
  content: any;                  // Full TipTap JSON content snapshot
  changes: ChangeEvent[];        // Granular change tracking (future)
  isMinor: boolean;              // true = auto-save, false = manual
  parentRevisionId?: string;     // For branching/merging
  message?: string;              // Optional commit message
}
```

#### Sync States:

```typescript
type SyncState = 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';
type ConflictState = 'none' | 'needs_review' | 'blocked';
```

- **idle**: Content is synced with cloud
- **dirty**: Local changes not yet synced to cloud  
- **pushing**: Currently uploading to cloud
- **pulling**: Currently downloading from cloud
- **conflict**: Merge conflict needs resolution

## Revision Management Across Different Modes

### 1. Offline Mode
```typescript
// All saves go to local storage/IndexedDB
// Revisions accumulate locally
// syncState = 'dirty' for modified chapters
// When online: batch sync all dirty chapters
```

### 2. Online Mode  
```typescript
// Minor revisions: Save locally only
// Major revisions: Save locally + mark for sync
// Manual sync: Push all dirty chapters to cloud
// Periodic sync: Every 60 minutes for dirty chapters
```

### 3. Conflict Resolution
```typescript
// When cloud version newer than local:
// syncState = 'conflict'
// conflictState = 'needs_review'
// Show conflict resolution UI
// Allow user to choose: local wins, cloud wins, or manual merge
```

### 4. Collaborator Mode
```typescript
// Each collaborator change creates revision with their authorId
// Collaborative state tracks pending changes
// Review process:
//   - needsReview = true
//   - reviewerIds = ['user1', 'user2'] 
//   - approvedBy/rejectedBy track decisions
//   - mergeConflicts store unresolved issues
```

## API Integration

### Chapter Route Enhancement
Instead of separate revision endpoints, revisions are now part of the chapter object:

```typescript
// GET /books/{bookId}/versions/{versionId}/chapters/{chapterId}
// Returns full Chapter object with revisions[] array

// PUT /books/{bookId}/versions/{versionId}/chapters/{chapterId}
// Accepts full Chapter object, updates everything including revisions

// POST /books/{bookId}/versions/{versionId}/chapters/{chapterId}/sync
// Manual sync endpoint for cloud synchronization
```

## Revision Squashing Strategy

To prevent revision bloat:

```typescript
// Auto-squash minor revisions older than X hours
// Keep last 10 minor revisions + all major revisions
// Squash before cloud sync to reduce data transfer
// Example: 100 minor revisions → 10 recent + major revisions

useChapters.squashRevisions(chapterId, maxMinorRevisions = 10)
```

## Usage Examples

### 1. Auto-Save (Minor Revision)
```typescript
const { saveChapterContent } = useChapters(bookId, versionId);

// Called every 2 seconds by editor
await saveChapterContent(chapterId, tiptapContent, true); // isMinor=true
```

### 2. Manual Save (Major Revision)  
```typescript
// Called when user hits Ctrl+S or clicks Save
await saveChapterContent(chapterId, tiptapContent, false); // isMinor=false
```

### 3. Manual Cloud Sync
```typescript
const { syncToCloud } = useChapters(bookId, versionId);

// Sync specific chapter
await syncToCloud(chapterId);

// Sync all dirty chapters  
await syncToCloud();
```

### 4. Revision History Access
```typescript
const { chapters } = useChapters(bookId, versionId);
const chapter = chapters.find(ch => ch.id === chapterId);

// Access all revisions
const revisions = chapter.revisions;

// Get major revisions only
const majorRevisions = revisions.filter(rev => !rev.isMinor);

// Get current content
const currentContent = chapter.content;
```

## Benefits of This Approach

1. **Performance**: No API calls on every keystroke
2. **Offline-First**: Works without internet connection
3. **Granular Control**: Users control when to sync to cloud
4. **Revision History**: Complete audit trail of changes
5. **Collaboration Ready**: Supports multiple authors with conflict resolution
6. **Efficient Sync**: Squashing prevents revision bloat
7. **Type Safety**: Proper TypeScript interfaces throughout

This system provides a robust foundation for collaborative editing while maintaining performance and offline capabilities.
