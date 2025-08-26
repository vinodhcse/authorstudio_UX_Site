/**
 * Revision Management Service
 * 
 * Handles:
 * - Creating and storing revisions
 * - Computing diffs between revisions
 * - Managing revision history
 * - Conflict detection and resolution
 * - Merging strategies
 */

import { 
  Revision, 
  RevisionHeader, 
  ChangeOperation, 
  RevisionDiff, 
  RevisionHistory,
  ConflictRecord,
  BookWithRevisions,
  VersionWithRevisions,
  OperationalTransform
} from '../types/revisionTypes';
import { appLog } from '../auth/fileLogger';
import { invoke } from '@tauri-apps/api/core';

export class RevisionManager {
  private static revisionStore = new Map<string, RevisionHistory>(); // entityId -> history

  /**
   * Create a new revision for an entity
   */
  static async createRevision(
    entityId: string,
    entityType: string,
    changes: ChangeOperation[],
    options: {
      authorId: string;
      authorName: string;
      message?: string;
      isMinor?: boolean;
      parentRevisionId?: string;
      branchName?: string;
    }
  ): Promise<Revision> {
    const revisionId = this.generateRevisionId();
    
    const header: RevisionHeader = {
      id: revisionId,
      parentId: options.parentRevisionId,
      authorId: options.authorId,
      authorName: options.authorName,
      timestamp: Date.now(),
      message: options.message,
      isMinor: options.isMinor || false,
      branchName: options.branchName || 'main',
      tags: options.isMinor ? ['auto-save'] : ['manual']
    };

    // Compute checksum for integrity
    const checksum = await this.computeChecksum({ header, changes });

    const revision: Revision = {
      header,
      changes,
      checksum
    };

    // Store revision
    await this.storeRevision(entityId, revision);

    await appLog.info('revision-manager', 'Created revision', {
      entityId,
      revisionId,
      changesCount: changes.length,
      isMinor: options.isMinor
    });

    return revision;
  }

  /**
   * Get revision history for an entity
   */
  static async getRevisionHistory(entityId: string): Promise<RevisionHistory | null> {
    // Try memory cache first
    let history = this.revisionStore.get(entityId);
    
    if (!history) {
      // Load from storage
      try {
        const stored = await invoke<any>('get_revision_history', { entityId });
        if (stored) {
          history = this.deserializeHistory(stored);
          this.revisionStore.set(entityId, history);
        }
      } catch (error) {
        await appLog.error('revision-manager', 'Failed to load revision history', { 
          entityId, 
          error 
        });
        return null;
      }
    }

    return history || null;
  }

  /**
   * Compute diff between two revisions
   */
  static async computeDiff(
    entityId: string,
    fromRevisionId: string,
    toRevisionId: string
  ): Promise<RevisionDiff | null> {
    const history = await this.getRevisionHistory(entityId);
    if (!history) return null;

    const fromRevision = history.revisions.get(fromRevisionId);
    const toRevision = history.revisions.get(toRevisionId);

    if (!fromRevision || !toRevision) {
      throw new Error(`Revision not found: ${fromRevisionId} or ${toRevisionId}`);
    }

    // Get all changes between revisions
    const changes = await this.getChangesBetweenRevisions(
      history,
      fromRevisionId,
      toRevisionId
    );

    // Compute summary statistics
    const entitiesModified = [...new Set(changes.map(c => c.entityId))];
    const wordCountDelta = changes.reduce((sum, change) => {
      return sum + (change.metadata?.wordCountDelta || 0);
    }, 0);

    const diff: RevisionDiff = {
      fromRevision: fromRevisionId,
      toRevision: toRevisionId,
      changes,
      summary: {
        totalChanges: changes.length,
        entitiesModified,
        wordCountDelta,
        conflictsResolved: changes.filter(c => c.metadata?.conflictResolution).length
      }
    };

    return diff;
  }

  /**
   * Rollback to a specific revision
   */
  static async rollbackToRevision(
    entityId: string,
    targetRevisionId: string,
    options: {
      authorId: string;
      authorName: string;
      createNewRevision?: boolean;
    }
  ): Promise<Revision | null> {
    const history = await this.getRevisionHistory(entityId);
    if (!history) return null;

    const targetRevision = history.revisions.get(targetRevisionId);
    if (!targetRevision) {
      throw new Error(`Target revision not found: ${targetRevisionId}`);
    }

    // Compute reverse operations to rollback
    const currentRevisionId = history.currentRevision;
    const rollbackChanges = await this.computeRollbackOperations(
      history,
      currentRevisionId,
      targetRevisionId
    );

    if (options.createNewRevision) {
      // Create a new revision that represents the rollback
      return await this.createRevision(entityId, 'rollback', rollbackChanges, {
        authorId: options.authorId,
        authorName: options.authorName,
        message: `Rollback to revision ${targetRevisionId}`,
        parentRevisionId: currentRevisionId
      });
    } else {
      // Direct rollback (destructive)
      history.currentRevision = targetRevisionId;
      await this.storeRevisionHistory(entityId, history);
      return targetRevision;
    }
  }

  /**
   * Merge two revisions with conflict detection
   */
  static async mergeRevisions(
    entityId: string,
    baseRevisionId: string,
    localRevisionId: string,
    remoteRevisionId: string,
    strategy: 'auto' | 'manual' = 'auto'
  ): Promise<{
    mergedRevision?: Revision;
    conflicts: ConflictRecord[];
  }> {
    const history = await this.getRevisionHistory(entityId);
    if (!history) throw new Error('No revision history found');

    // Get all three revisions
    const baseRevision = history.revisions.get(baseRevisionId);
    const localRevision = history.revisions.get(localRevisionId);
    const remoteRevision = history.revisions.get(remoteRevisionId);

    if (!baseRevision || !localRevision || !remoteRevision) {
      throw new Error('One or more revisions not found for merge');
    }

    // Detect conflicts
    const conflicts = await this.detectConflicts(
      baseRevision,
      localRevision,
      remoteRevision
    );

    if (conflicts.length > 0 && strategy === 'auto') {
      // Return conflicts for manual resolution
      return { conflicts };
    }

    // Perform three-way merge
    const mergedChanges = await this.performThreeWayMerge(
      baseRevision,
      localRevision,
      remoteRevision,
      conflicts
    );

    // Create merged revision
    const mergedRevision = await this.createRevision(entityId, 'merge', mergedChanges, {
      authorId: 'system',
      authorName: 'Merge System',
      message: `Merge ${localRevisionId} and ${remoteRevisionId}`,
      parentRevisionId: localRevisionId
    });

    return { mergedRevision, conflicts };
  }

  /**
   * Apply operational transforms for real-time collaboration
   */
  static async applyOperationalTransform(
    entityId: string,
    transform: OperationalTransform
  ): Promise<OperationalTransform> {
    // This would implement operational transform algorithm
    // for real-time collaborative editing
    // See: https://en.wikipedia.org/wiki/Operational_transformation
    
    await appLog.info('revision-manager', 'Applying operational transform', {
      entityId,
      baseRevision: transform.baseRevision,
      operationsCount: transform.operations.length
    });

    // Transform operations against concurrent changes
    const transformedOps = await this.transformOperations(transform);
    
    return transformedOps;
  }

  // Private helper methods

  private static generateRevisionId(): string {
    return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private static async computeChecksum(revision: { header: RevisionHeader; changes: ChangeOperation[] }): Promise<string> {
    const content = JSON.stringify(revision);
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static async storeRevision(entityId: string, revision: Revision): Promise<void> {
    let history = this.revisionStore.get(entityId);
    
    if (!history) {
      history = {
        currentRevision: revision.header.id,
        revisions: new Map(),
        branches: new Map([['main', revision.header.id]]),
        conflicts: []
      };
    }

    history.revisions.set(revision.header.id, revision);
    history.currentRevision = revision.header.id;
    
    // Update branch pointer
    const branchName = revision.header.branchName || 'main';
    history.branches.set(branchName, revision.header.id);

    this.revisionStore.set(entityId, history);

    // Persist to storage
    await this.storeRevisionHistory(entityId, history);
  }

  private static async storeRevisionHistory(entityId: string, history: RevisionHistory): Promise<void> {
    try {
      const serialized = this.serializeHistory(history);
      await invoke('store_revision_history', { entityId, history: serialized });
    } catch (error) {
      await appLog.error('revision-manager', 'Failed to store revision history', {
        entityId,
        error
      });
      throw error;
    }
  }

  private static serializeHistory(history: RevisionHistory): any {
    return {
      currentRevision: history.currentRevision,
      revisions: Array.from(history.revisions.entries()),
      branches: Array.from(history.branches.entries()),
      conflicts: history.conflicts
    };
  }

  private static deserializeHistory(stored: any): RevisionHistory {
    return {
      currentRevision: stored.currentRevision,
      revisions: new Map(stored.revisions),
      branches: new Map(stored.branches),
      conflicts: stored.conflicts || []
    };
  }

  private static async getChangesBetweenRevisions(
    history: RevisionHistory,
    fromId: string,
    toId: string
  ): Promise<ChangeOperation[]> {
    // Walk the revision graph from fromId to toId
    // and collect all changes
    const changes: ChangeOperation[] = [];
    
    // This is a simplified implementation
    // In practice, you'd need to traverse the revision graph
    const path = this.findRevisionPath(history, fromId, toId);
    
    for (const revisionId of path) {
      const revision = history.revisions.get(revisionId);
      if (revision) {
        changes.push(...revision.changes);
      }
    }

    return changes;
  }

  private static findRevisionPath(history: RevisionHistory, fromId: string, toId: string): string[] {
    // Simplified: return path through revision graph
    // In practice, implement proper graph traversal
    return [toId]; // Placeholder
  }

  private static async computeRollbackOperations(
    history: RevisionHistory,
    currentId: string,
    targetId: string
  ): Promise<ChangeOperation[]> {
    // Compute inverse operations to rollback changes
    const changes = await this.getChangesBetweenRevisions(history, targetId, currentId);
    
    return changes.map(change => ({
      ...change,
      type: this.getInverseOperationType(change.type),
      oldValue: change.newValue,
      newValue: change.oldValue
    }));
  }

  private static getInverseOperationType(type: ChangeOperation['type']): ChangeOperation['type'] {
    const inverseMap: Record<ChangeOperation['type'], ChangeOperation['type']> = {
      'create': 'delete',
      'delete': 'create',
      'update': 'update',
      'move': 'move',
      'rename': 'rename'
    };
    return inverseMap[type];
  }

  private static async detectConflicts(
    base: Revision,
    local: Revision,
    remote: Revision
  ): Promise<ConflictRecord[]> {
    const conflicts: ConflictRecord[] = [];
    
    // Find overlapping changes
    for (const localChange of local.changes) {
      for (const remoteChange of remote.changes) {
        if (this.changesConflict(localChange, remoteChange)) {
          conflicts.push({
            id: crypto.randomUUID(),
            revisionId: local.header.id,
            entityType: localChange.entityType,
            entityId: localChange.entityId,
            path: localChange.path || '',
            localValue: localChange.newValue,
            remoteValue: remoteChange.newValue,
            baseValue: this.findBaseValue(base, localChange.path || '')
          });
        }
      }
    }

    return conflicts;
  }

  private static changesConflict(local: ChangeOperation, remote: ChangeOperation): boolean {
    return local.entityId === remote.entityId && 
           local.path === remote.path &&
           local.newValue !== remote.newValue;
  }

  private static findBaseValue(base: Revision, path: string): any {
    // Find the value at the given path in the base revision
    // This would implement JSON path lookup
    return null; // Placeholder
  }

  private static async performThreeWayMerge(
    base: Revision,
    local: Revision,
    remote: Revision,
    conflicts: ConflictRecord[]
  ): Promise<ChangeOperation[]> {
    // Implement three-way merge algorithm
    const mergedChanges: ChangeOperation[] = [];
    
    // Add non-conflicting changes from both sides
    for (const change of [...local.changes, ...remote.changes]) {
      const hasConflict = conflicts.some(c => 
        c.entityId === change.entityId && c.path === change.path
      );
      
      if (!hasConflict) {
        mergedChanges.push(change);
      }
    }

    // Handle conflicts (simplified - use local by default)
    for (const conflict of conflicts) {
      mergedChanges.push({
        type: 'update',
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        path: conflict.path,
        oldValue: conflict.baseValue,
        newValue: conflict.localValue, // Default to local
        metadata: {
          conflictResolution: 'local-wins'
        }
      });
    }

    return mergedChanges;
  }

  private static async transformOperations(transform: OperationalTransform): Promise<OperationalTransform> {
    // Implement operational transform algorithm
    // This is a complex algorithm for real-time collaboration
    return transform; // Placeholder
  }
}
