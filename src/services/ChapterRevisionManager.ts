/**
 * Phase 2: Chapter Revision Manager
 * 
 * Manages chapter-specific revision creation, auto-save, and restoration
 * following the PRD requirements for "offline-first chapter revision history"
 */

import { invoke } from '@tauri-apps/api/core';
import type { 
  ChapterRevision, 
  TipTapDoc,
  ChapterSyncState,
  ChapterSyncResult,
  ChapterSyncOptions 
} from '../types/chapterRevisionTypes.ts';

export interface ChapterRevisionOptions {
  chapterId: string;
  bookId: string;
  versionId: string;
  content: TipTapDoc;
  authorId: string;
  authorName: string;
  isMinor?: boolean;
  message?: string;
  deviceId?: string;
}

export interface ChapterSession {
  chapterId: string;
  baseCloudRevId?: string;
  currentWorkingRevId?: string;
  lastAutoSave: number;
  changeCount: number;
  isAutoSaveEnabled: boolean;
}

/**
 * ChapterRevisionManager - Handles chapter revision lifecycle
 */
export class ChapterRevisionManager {
  private static instance: ChapterRevisionManager;
  private sessions = new Map<string, ChapterSession>();
  private autoSaveDelay = 2000; // 2 seconds debounce
  // private autoSaveInterval = 30000; // 30 seconds (unused for now)
  private changeThreshold = 10; // Minimum changes before auto-save
  private autoSaveTimeouts = new Map<string, NodeJS.Timeout>();
  
  // Phase 4: Sync Integration properties
  private syncStates = new Map<string, ChapterSyncState>();
  
  private constructor() {
    // Listen for auto-save events
    this.setupAutoSaveListener();
  }
  
  public static getInstance(): ChapterRevisionManager {
    if (!ChapterRevisionManager.instance) {
      ChapterRevisionManager.instance = new ChapterRevisionManager();
    }
    return ChapterRevisionManager.instance;
  }

  /**
   * Start a revision session for a chapter
   */
  public async startSession(
    chapterId: string, 
    baseCloudRevId?: string
  ): Promise<ChapterSession> {
    console.log('🚀 Starting revision session for chapter:', chapterId);
    
    const session: ChapterSession = {
      chapterId,
      baseCloudRevId,
      lastAutoSave: Date.now(),
      changeCount: 0,
      isAutoSaveEnabled: true,
    };
    
    this.sessions.set(chapterId, session);
    console.log('✅ Session started:', session);
    return session;
  }

  /**
   * Handle content changes from the editor
   */
  public onContentChange = (chapterId: string, content: TipTapDoc): void => {
    const session = this.sessions.get(chapterId);
    if (!session || !session.isAutoSaveEnabled) return;

    session.changeCount++;
    console.log(`📝 Content change tracked for ${chapterId}:`, {
      changeCount: session.changeCount,
      threshold: this.changeThreshold
    });

    // Clear existing timeout
    const existingTimeout = this.autoSaveTimeouts.get(chapterId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new debounced auto-save
    const timeout = setTimeout(() => {
      this.triggerAutoSave(chapterId, content);
    }, this.autoSaveDelay);

    this.autoSaveTimeouts.set(chapterId, timeout);
  };

  /**
   * Trigger auto-save for a chapter
   */
  private async triggerAutoSave(chapterId: string, content: TipTapDoc): Promise<void> {
    const session = this.sessions.get(chapterId);
    if (!session) return;

    try {
      console.log('💾 Triggering auto-save for:', chapterId);
      
      // Emit event for UI to handle
      const event = new CustomEvent('chapter-autosave-start', { 
        detail: { chapterId } 
      });
      window.dispatchEvent(event);

      // const options: ChapterRevisionOptions = {
      //   chapterId,
      //   bookId: '', // Will be provided by BookContext
      //   versionId: '', // Will be provided by BookContext
      //   content,
      //   authorId: '', // Will be provided by auth context
      //   authorName: '', // Will be provided by auth context
      //   isMinor: true,
      //   message: 'Auto-save',
      // };

      // Emit event with full options for BookContext to handle
      const saveEvent = new CustomEvent('chapter-revision-save', { 
        detail: { 
          chapterId,
          content,
          isMinor: true,
          message: 'Auto-save'
        } 
      });
      window.dispatchEvent(saveEvent);

    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      
      const errorEvent = new CustomEvent('chapter-autosave-error', { 
        detail: { chapterId, error } 
      });
      window.dispatchEvent(errorEvent);
    }
  }

  /**
   * Create a working minor revision (called by BookContext)
   */
  public async createWorkingMinor(
    options: ChapterRevisionOptions
  ): Promise<ChapterRevision> {
    const session = this.sessions.get(options.chapterId);
    
    const revisionData: Omit<ChapterRevision, 'rev_id'> = {
      chapter_id: options.chapterId,
      book_id: options.bookId,
      version_id: options.versionId,
      device_id: options.deviceId || await this.getDeviceId(),
      parent_rev_id: session?.currentWorkingRevId || null,
      base_cloud_rev_id: session?.baseCloudRevId || null,
      timestamp: Date.now(),
      author_id: options.authorId,
      author_name: options.authorName,
      is_minor: true,
      message: options.message || null,
      snapshot: options.content,
      word_count: this.countWords(options.content),
      char_count: this.countCharacters(options.content),
    };

    // Generate revision ID
    const revId = await this.generateRevisionId(revisionData);
    const revision: ChapterRevision = { ...revisionData, rev_id: revId };

    console.log('💾 Creating working minor revision:', revId);

    // Save to database
    const savedRevision = await invoke<ChapterRevision>('app_create_chapter_revision', {
      revision
    });

    // Update chapter's current revision pointer
    await invoke('app_update_chapter_current_revision', {
      chapterId: options.chapterId,
      revisionId: savedRevision.rev_id
    });

    // Update session
    if (session) {
      session.currentWorkingRevId = savedRevision.rev_id;
      session.lastAutoSave = Date.now();
      session.changeCount = 0;
    }

    console.log('✅ Working minor revision created:', savedRevision.rev_id);
    return savedRevision;
  }

  /**
   * Commit a major revision (Ctrl+Shift+S)
   */
  public async commitMajorRevision(
    options: ChapterRevisionOptions & { message: string }
  ): Promise<ChapterRevision> {
    const session = this.sessions.get(options.chapterId);
    
    const revisionData: Omit<ChapterRevision, 'rev_id'> = {
      chapter_id: options.chapterId,
      book_id: options.bookId,
      version_id: options.versionId,
      device_id: options.deviceId || await this.getDeviceId(),
      parent_rev_id: session?.currentWorkingRevId || null,
      base_cloud_rev_id: session?.baseCloudRevId || null,
      timestamp: Date.now(),
      author_id: options.authorId,
      author_name: options.authorName,
      is_minor: false, // Major revision
      message: options.message,
      snapshot: options.content,
      word_count: this.countWords(options.content),
      char_count: this.countCharacters(options.content),
    };

    const revId = await this.generateRevisionId(revisionData);
    const revision: ChapterRevision = { ...revisionData, rev_id: revId };

    console.log('🏷️ Creating major revision:', revId, 'with message:', options.message);

    // Save major revision
    const savedRevision = await invoke<ChapterRevision>('app_create_chapter_revision', {
      revision
    });

    // Update chapter's current revision pointer
    await invoke('app_update_chapter_current_revision', {
      chapterId: options.chapterId,
      revisionId: savedRevision.rev_id
    });

    // Reset session for new working minor
    if (session) {
      session.currentWorkingRevId = undefined;
      session.changeCount = 0;
      session.lastAutoSave = Date.now();
    }

    console.log('✅ Major revision committed:', savedRevision.rev_id);
    return savedRevision;
  }

  /**
   * Get revision history for a chapter
   */
  public async getRevisionHistory(chapterId: string): Promise<ChapterRevision[]> {
    return await invoke<ChapterRevision[]>('app_get_chapter_revisions', {
      chapterId
    });
  }

  /**
   * Get a specific revision
   */
  public async getRevision(revId: string): Promise<ChapterRevision | null> {
    return await invoke<ChapterRevision | null>('app_get_chapter_revision', {
      revId
    });
  }

  /**
   * Restore chapter to a specific revision
   */
  public async restoreToRevision(
    chapterId: string,
    revId: string
  ): Promise<TipTapDoc> {
    const revision = await this.getRevision(revId);
    if (!revision) {
      throw new Error(`Revision not found: ${revId}`);
    }

    console.log('🔄 Restoring chapter to revision:', revId);

    // Temporarily disable auto-save during restore
    const session = this.sessions.get(chapterId);
    if (session) {
      session.isAutoSaveEnabled = false;
    }

    // Re-enable after a short delay
    setTimeout(() => {
      if (session) {
        session.isAutoSaveEnabled = true;
      }
    }, 1000);

    return revision.snapshot;
  }

  /**
   * Clean up old revisions
   */
  public async cleanupOldRevisions(
    chapterId: string, 
    keepCount: number = 50
  ): Promise<number> {
    return await invoke<number>('app_cleanup_old_revisions', {
      chapterId,
      keepCount
    });
  }

  /**
   * End a revision session
   */
  public endSession(chapterId: string): void {
    console.log('🛑 Ending revision session for:', chapterId);
    
    // Clear auto-save timeout
    const timeout = this.autoSaveTimeouts.get(chapterId);
    if (timeout) {
      clearTimeout(timeout);
      this.autoSaveTimeouts.delete(chapterId);
    }
    
    // Remove session
    this.sessions.delete(chapterId);
  }

  /**
   * Get current session
   */
  public getSession(chapterId: string): ChapterSession | undefined {
    return this.sessions.get(chapterId);
  }

  /**
   * Manual save trigger (from UI)
   */
  public async manualSave(chapterId: string, content: TipTapDoc): Promise<void> {
    const session = this.sessions.get(chapterId);
    if (!session) return;

    console.log('🖐️ Manual save triggered for:', chapterId);
    
    const saveEvent = new CustomEvent('chapter-revision-save', { 
      detail: { 
        chapterId,
        content,
        isMinor: true,
        message: 'Manual save'
      } 
    });
    window.dispatchEvent(saveEvent);
  }

  // Private utility methods

  private async getDeviceId(): Promise<string> {
    let deviceId = localStorage.getItem('author_studio_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('author_studio_device_id', deviceId);
    }
    return deviceId;
  }

  private async generateRevisionId(revision: Omit<ChapterRevision, 'rev_id'>): Promise<string> {
    const contentString = JSON.stringify({
      snapshot: revision.snapshot,
      timestamp: revision.timestamp,
      chapter_id: revision.chapter_id,
      author_id: revision.author_id
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(contentString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `rev_${hashHex.substring(0, 16)}`;
  }

  private countWords(doc: TipTapDoc): number {
    const text = this.extractTextFromDoc(doc);
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private countCharacters(doc: TipTapDoc): number {
    return this.extractTextFromDoc(doc).length;
  }

  public extractTextFromDoc(doc: TipTapDoc): string {
    if (!doc.content) return '';
    return doc.content.map((node: any) => this.extractTextFromNode(node)).join('\n');
  }

  private extractTextFromNode(node: any): string {
    if (node.type === 'text') {
      return node.text || '';
    }
    
    if (node.content) {
      return node.content.map((child: any) => this.extractTextFromNode(child)).join('');
    }
    
    return '';
  }

  private setupAutoSaveListener(): void {
    // Listen for editor content changes
    document.addEventListener('tiptap-content-change', (event: any) => {
      const { chapterId, content } = event.detail;
      this.onContentChange(chapterId, content);
    });
  }

  // ===== Phase 4: Sync Integration Methods =====

  /**
   * Sync a chapter with the cloud, handling conflicts
   */
  public async syncChapter(
    chapterId: string,
    options: ChapterSyncOptions = {
      strategy: 'merge',
      autoResolveConflicts: false,
      createBackup: true
    }
  ): Promise<ChapterSyncResult> {
    try {
      // Get current local revisions
      const localRevisions = await this.getRevisionHistory(chapterId);
      
      if (!localRevisions.length) {
        return {
          success: false,
          error: `No local revisions found for chapter ${chapterId}`
        };
      }

      const currentLocal = localRevisions[0]; // Latest revision
      
      // Get or create sync state
      let syncState = this.syncStates.get(chapterId);
      if (!syncState) {
        syncState = {
          chapterId,
          localRevId: currentLocal.rev_id,
          cloudRevId: null,
          baseCloudRevId: null,
          syncState: 'dirty',
          conflictState: 'none',
          lastSyncTimestamp: 0,
          pendingChanges: 1
        };
        this.syncStates.set(chapterId, syncState);
      }

      // Update sync state to pushing
      syncState.syncState = 'pushing';
      syncState.localRevId = currentLocal.rev_id;
      this.syncStates.set(chapterId, syncState);

      // For now, implement a simple push strategy
      // In a full implementation, this would include conflict detection and resolution
      const cloudRevId = await this.pushRevisionToCloud(currentLocal);
      
      if (cloudRevId) {
        // Update sync state to idle
        syncState.syncState = 'idle';
        syncState.cloudRevId = cloudRevId;
        syncState.conflictState = 'none';
        syncState.lastSyncTimestamp = Date.now();
        syncState.pendingChanges = 0;
        this.syncStates.set(chapterId, syncState);

        return {
          success: true,
          newCloudRevId: cloudRevId
        };
      } else {
        // Sync failed
        syncState.syncState = 'idle';
        this.syncStates.set(chapterId, syncState);
        
        return {
          success: false,
          error: 'Failed to push revision to cloud'
        };
      }
    } catch (error) {
      // Update sync state to idle on error
      const syncState = this.syncStates.get(chapterId);
      if (syncState) {
        syncState.syncState = 'idle';
        this.syncStates.set(chapterId, syncState);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    }
  }

  /**
   * Push a revision to the cloud (simplified implementation)
   */
  private async pushRevisionToCloud(revision: ChapterRevision): Promise<string | null> {
    try {
      // Update revision with sync info
      const cloudRevision: ChapterRevision = {
        ...revision,
        sync_state: 'idle', // Use valid sync state
        cloud_rev_id: `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        last_sync_timestamp: Date.now()
      };

      // Push to cloud using Tauri command
      await invoke('create_cloud_chapter_revision', {
        chapterId: revision.chapter_id,
        revision: cloudRevision
      });

      // Update local revision with cloud info
      await invoke('update_chapter_revision_sync_info', {
        revisionId: revision.rev_id,
        cloudRevId: cloudRevision.cloud_rev_id,
        syncState: 'idle',
        lastSyncTimestamp: cloudRevision.last_sync_timestamp
      });

      return cloudRevision.cloud_rev_id || null;
    } catch (error) {
      console.error('Failed to push revision to cloud:', error);
      return null;
    }
  }

  /**
   * Get current sync state for a chapter
   */
  public getSyncState(chapterId: string): ChapterSyncState | null {
    return this.syncStates.get(chapterId) || null;
  }

  /**
   * Initialize sync state for a chapter
   */
  public async initializeSyncState(chapterId: string): Promise<ChapterSyncState> {
    const revisions = await this.getRevisionHistory(chapterId);
    const currentRevision = revisions[0];

    const syncState: ChapterSyncState = {
      chapterId,
      localRevId: currentRevision?.rev_id || '',
      cloudRevId: currentRevision?.cloud_rev_id || null,
      baseCloudRevId: null,
      syncState: 'idle',
      conflictState: 'none',
      lastSyncTimestamp: currentRevision?.last_sync_timestamp || 0,
      pendingChanges: 0
    };

    this.syncStates.set(chapterId, syncState);
    return syncState;
  }

  /**
   * Mark chapter as having pending changes for sync
   */
  public markChapterDirty(chapterId: string): void {
    let syncState = this.syncStates.get(chapterId);
    if (!syncState) {
      // Create basic sync state if none exists
      syncState = {
        chapterId,
        localRevId: '',
        cloudRevId: null,
        baseCloudRevId: null,
        syncState: 'dirty',
        conflictState: 'none',
        lastSyncTimestamp: 0,
        pendingChanges: 1
      };
    } else {
      syncState.syncState = 'dirty';
      syncState.pendingChanges += 1;
    }
    this.syncStates.set(chapterId, syncState);
  }

  /**
   * Check if chapter has pending sync changes
   */
  public hasUnsyncedChanges(chapterId: string): boolean {
    const syncState = this.syncStates.get(chapterId);
    return syncState ? syncState.syncState !== 'idle' || syncState.pendingChanges > 0 : false;
  }
}

// Export singleton instance
export const chapterRevisionManager = ChapterRevisionManager.getInstance();
