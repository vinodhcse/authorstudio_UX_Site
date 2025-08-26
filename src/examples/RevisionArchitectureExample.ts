/**
 * Comprehensive Example: Revision-Based Sync Architecture
 * 
 * This example demonstrates how the enhanced revision system works
 * for complex scenarios involving books, versions, chapters, and child objects.
 */

import { EnhancedSyncEngine } from '../services/EnhancedSyncEngine';
import { RevisionManager } from '../services/RevisionManager';
import { BookWithRevisions } from '../types/revisionTypes';

/**
 * EXAMPLE SCENARIO:
 * 
 * 1. Author creates a book with initial version
 * 2. Author adds characters and chapters
 * 3. Collaborator modifies character details
 * 4. Author modifies same character offline
 * 5. Both sync - conflict detected and resolved
 * 6. Author wants to see what changed between revisions
 * 7. Author rolls back to previous version
 */

export class RevisionExampleDemo {
  
  /**
   * Example 1: Initial Book Creation with Revision Tracking
   */
  static async createBookWithRevisions(): Promise<void> {
    console.log('=== Example 1: Creating Book with Revision Tracking ===');
    
    // Step 1: Create initial book revision
    const initialRevision = await RevisionManager.createRevision(
      'book-123',
      'book',
      [{
        type: 'create',
        entityType: 'book',
        entityId: 'book-123',
        newValue: {
          title: 'The Great Adventure',
          subtitle: 'A Journey Begins',
          author: 'John Doe',
          genre: 'Fantasy'
        }
      }],
      {
        authorId: 'user-1',
        authorName: 'John Doe',
        message: 'Initial book creation'
      }
    );
    
    console.log('Created initial book revision:', initialRevision.header.id);
    
    // Step 2: Add a version with characters and chapters
    const versionRevision = await RevisionManager.createRevision(
      'book-123',
      'book',
      [
        {
          type: 'create',
          entityType: 'version',
          entityId: 'version-1',
          newValue: {
            name: 'First Draft',
            status: 'DRAFT'
          }
        },
        {
          type: 'create',
          entityType: 'character',
          entityId: 'char-1',
          newValue: {
            name: 'Aragorn',
            role: 'Protagonist',
            description: 'A brave warrior'
          }
        },
        {
          type: 'create',
          entityType: 'chapter',
          entityId: 'chapter-1',
          newValue: {
            title: 'The Beginning',
            content: 'Once upon a time...',
            wordCount: 500
          }
        }
      ],
      {
        authorId: 'user-1',
        authorName: 'John Doe',
        message: 'Added first version with character and chapter',
        parentRevisionId: initialRevision.header.id
      }
    );
    
    console.log('Created version revision:', versionRevision.header.id);
  }
  
  /**
   * Example 2: Collaborative Editing with Conflict Detection
   */
  static async demonstrateConflictResolution(): Promise<void> {
    console.log('=== Example 2: Collaborative Editing with Conflicts ===');
    
    // Simulate two users editing the same character
    
    // User 1 (Author) makes changes offline
    const authorRevision = await RevisionManager.createRevision(
      'book-123',
      'book',
      [{
        type: 'update',
        entityType: 'character',
        entityId: 'char-1',
        path: 'description',
        oldValue: 'A brave warrior',
        newValue: 'A brave warrior king with a noble heart',
        metadata: { wordCountDelta: 20 }
      }],
      {
        authorId: 'user-1',
        authorName: 'John Doe',
        message: 'Enhanced character description',
        parentRevisionId: 'rev_previous'
      }
    );
    
    // User 2 (Collaborator) makes different changes to same character
    const collaboratorRevision = await RevisionManager.createRevision(
      'book-123',
      'book',
      [{
        type: 'update',
        entityType: 'character',
        entityId: 'char-1',
        path: 'description',
        oldValue: 'A brave warrior',
        newValue: 'A skilled ranger and leader of men',
        metadata: { wordCountDelta: 15 }
      }],
      {
        authorId: 'user-2',
        authorName: 'Jane Smith',
        message: 'Updated character background',
        parentRevisionId: 'rev_previous'
      }
    );
    
    console.log('Author revision:', authorRevision.header.id);
    console.log('Collaborator revision:', collaboratorRevision.header.id);
    
    // Attempt to merge - will detect conflict
    const mergeResult = await RevisionManager.mergeRevisions(
      'book-123',
      'rev_previous',           // Common base
      authorRevision.header.id, // Local changes
      collaboratorRevision.header.id // Remote changes
    );
    
    if (mergeResult.conflicts && mergeResult.conflicts.length > 0) {
      console.log('Conflicts detected:');
      mergeResult.conflicts.forEach(conflict => {
        console.log(`- Entity: ${conflict.entityType}:${conflict.entityId}`);
        console.log(`  Path: ${conflict.path}`);
        console.log(`  Local: "${conflict.localValue}"`);
        console.log(`  Remote: "${conflict.remoteValue}"`);
      });
      
      // Demonstrate manual conflict resolution
      const resolvedRevision = await this.resolveConflictManually(mergeResult.conflicts[0]);
      console.log('Conflict resolved in revision:', resolvedRevision?.header.id);
    }
  }
  
  /**
   * Example 3: Comparing Revisions to See Changes
   */
  static async demonstrateRevisionComparison(): Promise<void> {
    console.log('=== Example 3: Comparing Revisions ===');
    
    const fromRevision = 'rev_1642534567890_abc12';
    const toRevision = 'rev_1642534567990_def34';
    
    // Get detailed diff between two revisions
    const comparisonResult = await EnhancedSyncEngine.compareBookRevisions(
      'book-123',
      fromRevision,
      toRevision
    );
    
    console.log('Revision Comparison Results:');
    
    // Book-level changes
    if (comparisonResult.bookDiff) {
      console.log('Book Changes:');
      console.log(`- Total changes: ${comparisonResult.bookDiff.summary.totalChanges}`);
      console.log(`- Word count delta: ${comparisonResult.bookDiff.summary.wordCountDelta}`);
      console.log(`- Entities modified: ${comparisonResult.bookDiff.summary.entitiesModified.join(', ')}`);
    }
    
    // Version-level changes
    comparisonResult.versionDiffs.forEach((diff, versionId) => {
      console.log(`Version ${versionId} Changes:`, diff.summary);
    });
    
    // Chapter-level changes
    comparisonResult.chapterDiffs.forEach((diff, chapterId) => {
      console.log(`Chapter ${chapterId} Changes:`, diff.summary);
    });
    
    // Character changes
    comparisonResult.characterDiffs.forEach((diff, characterId) => {
      console.log(`Character ${characterId} Changes:`, diff.summary);
    });
  }
  
  /**
   * Example 4: Rolling Back to Previous Revision
   */
  static async demonstrateRollback(): Promise<void> {
    console.log('=== Example 4: Rolling Back to Previous Revision ===');
    
    const targetRevision = 'rev_1642534567890_abc12'; // Some previous revision
    
    // Soft rollback (creates new revision that undoes changes)
    const rollbackResult = await EnhancedSyncEngine.rollbackBook(
      'book-123',
      targetRevision,
      {
        rollbackStrategy: 'soft',
        affectChildren: true  // Also rollback versions, chapters, etc.
      }
    );
    
    if (rollbackResult.success) {
      console.log('Rollback successful!');
      console.log('New revision created:', rollbackResult.mergedRevision?.header.id);
      
      // Show what was rolled back
      const rollbackDiff = await RevisionManager.computeDiff(
        'book-123',
        rollbackResult.mergedRevision!.header.id,
        targetRevision
      );
      
      if (rollbackDiff) {
        console.log('Changes rolled back:');
        rollbackDiff.changes.forEach(change => {
          console.log(`- ${change.type} ${change.entityType}:${change.entityId}`);
          if (change.path) {
            console.log(`  Field: ${change.path}`);
            console.log(`  From: "${change.oldValue}" To: "${change.newValue}"`);
          }
        });
      }
    } else {
      console.log('Rollback failed:', rollbackResult.error);
    }
  }
  
  /**
   * Example 5: Distributed Sync with Revision History
   */
  static async demonstrateDistributedSync(): Promise<void> {
    console.log('=== Example 5: Distributed Sync with History ===');
    
    // Simulate a book that exists both locally and remotely
    const localBook: BookWithRevisions = {
      id: 'book-123',
      revisionId: 'rev_local_latest',
      revisionHistory: ['rev_1', 'rev_2', 'rev_local_latest'],
      syncState: 'dirty',
      conflictState: 'none',
      lastModifiedAt: Date.now(),
      lastModifiedBy: 'user-1',
      versions: [],
      fullRevisionHistory: {
        currentRevision: 'rev_local_latest',
        revisions: new Map(),
        branches: new Map(),
        conflicts: []
      }
    };
    
    // Perform sync with merge strategy
    const syncResult = await EnhancedSyncEngine.syncBookWithRevisions(
      localBook,
      {
        strategy: 'merge',
        autoResolveConflicts: false,
        createBackup: true
      }
    );
    
    if (syncResult.success) {
      console.log('Sync successful!');
      if (syncResult.mergedRevision) {
        console.log('New merged revision:', syncResult.mergedRevision.header.id);
      }
    } else if (syncResult.conflicts) {
      console.log('Sync conflicts detected:');
      syncResult.conflicts.forEach(conflict => {
        console.log(`- ${conflict.entityType}:${conflict.entityId} at ${conflict.path}`);
      });
    } else {
      console.log('Sync failed:', syncResult.error);
    }
  }
  
  // Helper method for manual conflict resolution
  private static async resolveConflictManually(conflict: any): Promise<any> {
    // In a real app, this would show a UI for the user to choose resolution
    // For demo, we'll automatically choose a merge strategy
    
    const mergedValue = `${conflict.localValue} (merged with: ${conflict.remoteValue})`;
    
    return await RevisionManager.createRevision(
      conflict.entityId,
      conflict.entityType,
      [{
        type: 'update',
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        path: conflict.path,
        oldValue: conflict.baseValue,
        newValue: mergedValue,
        metadata: {
          conflictResolution: 'manual-merge',
          originalLocal: conflict.localValue,
          originalRemote: conflict.remoteValue
        }
      }],
      {
        authorId: 'system',
        authorName: 'Conflict Resolution System',
        message: `Manually resolved conflict in ${conflict.entityType}:${conflict.entityId}`
      }
    );
  }
}

/**
 * SUGGESTED STORAGE ARCHITECTURE
 */

export const RevisionStorageArchitecture = {
  
  // Database Schema for Revision Storage
  tables: {
    
    // Main revision headers table
    revisions: {
      id: 'string PRIMARY KEY',              // rev_1642534567890_abc12
      entity_id: 'string',                   // book-123, version-456, etc.
      entity_type: 'string',                 // book, version, chapter, character, etc.
      parent_id: 'string NULLABLE',          // Parent revision for branching
      author_id: 'string',                   // Who made this change
      author_name: 'string',                 // Display name
      timestamp: 'integer',                  // When created
      message: 'text NULLABLE',              // Commit message
      tags: 'json',                          // ['auto-save', 'manual', etc.]
      is_minor: 'boolean',                   // Auto-save vs manual
      branch_name: 'string DEFAULT main',    // Support for branching
      checksum: 'string',                    // Integrity check
      created_at: 'timestamp',
      updated_at: 'timestamp'
    },
    
    // Individual change operations within a revision
    revision_changes: {
      id: 'string PRIMARY KEY',
      revision_id: 'string REFERENCES revisions(id)',
      change_type: 'string',                 // create, update, delete, move, rename
      entity_type: 'string',                 // book, version, chapter, etc.
      entity_id: 'string',                   // ID of entity being changed
      json_path: 'string NULLABLE',          // Path for nested changes
      old_value: 'json NULLABLE',            // Previous value
      new_value: 'json NULLABLE',            // New value
      metadata: 'json',                      // Additional metadata
      sort_order: 'integer'                  // Order within revision
    },
    
    // Optional snapshots for major revisions
    revision_snapshots: {
      id: 'string PRIMARY KEY',
      revision_id: 'string REFERENCES revisions(id)',
      entity_id: 'string',
      entity_type: 'string',
      snapshot_data: 'json',                 // Full entity state
      compressed: 'boolean',                 // Whether data is compressed
      size_bytes: 'integer'
    },
    
    // Conflict records for resolution tracking
    revision_conflicts: {
      id: 'string PRIMARY KEY',
      revision_id: 'string REFERENCES revisions(id)',
      entity_type: 'string',
      entity_id: 'string',
      json_path: 'string',
      local_value: 'json',
      remote_value: 'json',
      base_value: 'json NULLABLE',
      resolution: 'string NULLABLE',         // local, remote, merge, manual
      resolved_value: 'json NULLABLE',
      resolved_by: 'string NULLABLE',
      resolved_at: 'timestamp NULLABLE',
      created_at: 'timestamp'
    }
  },
  
  // Indexes for performance
  indexes: [
    'CREATE INDEX idx_revisions_entity ON revisions(entity_id, entity_type)',
    'CREATE INDEX idx_revisions_timestamp ON revisions(timestamp)',
    'CREATE INDEX idx_revisions_branch ON revisions(entity_id, branch_name)',
    'CREATE INDEX idx_revision_changes_revision ON revision_changes(revision_id)',
    'CREATE INDEX idx_revision_changes_entity ON revision_changes(entity_id, entity_type)',
    'CREATE INDEX idx_conflicts_entity ON revision_conflicts(entity_id, entity_type)'
  ]
};

console.log('Revision Architecture Example loaded. Usage:');
console.log('await RevisionExampleDemo.createBookWithRevisions()');
console.log('await RevisionExampleDemo.demonstrateConflictResolution()');
console.log('await RevisionExampleDemo.demonstrateRevisionComparison()');
console.log('await RevisionExampleDemo.demonstrateRollback()');
console.log('await RevisionExampleDemo.demonstrateDistributedSync()');
