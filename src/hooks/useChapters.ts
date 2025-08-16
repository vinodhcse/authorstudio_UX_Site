import { useState, useEffect, useCallback } from 'react';
import { Chapter } from '../types';
import { NarrativeFlowNode } from '../types/narrative-layout';
import { appLog } from '../auth/fileLogger';
import { 
  getChaptersByVersion, 
  getChapter,
  putChapter, 
  ChapterRow,
  ensureDefaultVersion,
  ensureVersionInDatabase,
  syncChaptersToVersionData
,
  createChapterAtomic,
  deleteChapterAtomic,
  bumpChapterMetadataAtomic
} from '../data/dal';
import { useAuthStore } from '../auth/useAuthStore';
// Note: encryptionService is imported dynamically to ensure singleton consistency
import { useBookContext } from '../contexts/BookContext';

// Utility function to generate unique IDs
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export interface UseChaptersReturn {
  chapters: Chapter[];
  isLoading: boolean;
  error: string | null;
  createChapter: (title: string, actId?: string) => Promise<Chapter | null>;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  saveChapterContent: (chapterId: string, content: any, isMinor?: boolean) => Promise<void>;
  refreshChapters: () => Promise<void>;
  createAct: (title: string) => Promise<void>;
  deleteAct: (actId: string) => Promise<void>;
  reorderChapter: (chapterId: string, newPosition: number, newActId?: string) => Promise<void>;
  // Navigation helpers
  getChaptersByAct: (actId: string) => Chapter[];
  getCurrentActs: () => NarrativeFlowNode[];
  moveChapterToAct: (chapterId: string, targetActId: string) => Promise<void>;
}

export function useChapters(bookId?: string, versionId?: string): UseChaptersReturn {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { getPlotCanvas, updatePlotCanvas, updateVersion, getVersion } = useBookContext();

  // Log hook initialization and parameter changes
  useEffect(() => {
    appLog.info('useChapters', 'Hook initialized or parameters changed', {
      bookId,
      versionId,
      userId: user?.id,
      currentChapterCount: chapters.length,
      isLoading
    });
  }, [bookId, versionId, user?.id]);

  const loadChapters = useCallback(async () => {
    if (!bookId || !versionId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load chapters from local database
      const chapterRows = user?.id ? await getChaptersByVersion(bookId, versionId, user.id) : [];

      // Dynamic import to ensure singleton consistency
      const { encryptionService } = await import('../services/encryptionService');

      // Convert chapter rows to Chapter objects
      const chaptersData: Chapter[] = [];
      for (const row of chapterRows) {
        try {
          let decryptedContent = null;
          
          // Only try to decrypt if there's actually encrypted content
          if (user?.id && row.content_enc && row.content_enc.length > 0) {
            try {
              decryptedContent = await encryptionService.loadChapterContent(row.chapter_id, user.id);
            } catch (decryptError) {
              console.warn('Failed to decrypt chapter content, using fallback:', decryptError);
              // Use fallback content for chapters with empty/corrupted content
              decryptedContent = {
                type: "doc" as const,
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: row.title || 'Untitled Chapter' }]
                  },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Start writing your chapter here...' }]
                  }
                ],
                metadata: {
                  totalCharacters: 0,
                  totalWords: 0,
                  lastEditedAt: new Date().toISOString()
                }
              };
            }
          } else {
            // No encrypted content, use default content
            decryptedContent = {
              type: "doc" as const,
              content: [
                {
                  type: 'heading',
                  attrs: { level: 2 },
                  content: [{ type: 'text', text: row.title || 'Untitled Chapter' }]
                },
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Start writing your chapter here...' }]
                }
              ],
              metadata: {
                totalCharacters: 0,
                totalWords: 0,
                lastEditedAt: new Date().toISOString()
              }
            };
          }
          
          console.log('🔓 [LOAD] Decrypted chapter content:', decryptedContent);
          chaptersData.push({
            id: row.chapter_id,
            title: row.title || 'Untitled Chapter',
            position: row.order_index || 0,
            createdAt: new Date(row.updated_at || Date.now()).toISOString(),
            updatedAt: new Date(row.updated_at || Date.now()).toISOString(),
            authorId: row.owner_user_id,
            lastModifiedBy: row.owner_user_id,
            linkedPlotNodeId: '', // TODO: Link to actual narrative nodes
            linkedAct: '', // TODO: Link to actual narrative nodes
            linkedOutline: '', // TODO: Link to actual narrative nodes
            linkedScenes: [], // TODO: Link to actual narrative nodes
            content: decryptedContent,
            wordCount: row.word_count || 0,
            hasProposals: Boolean(row.has_proposals),
            characters: [],
            isComplete: false,
            status: 'DRAFT',
            revisions: [],
            currentRevisionId: '',
            collaborativeState: {
              pendingChanges: [],
              needsReview: false,
              reviewerIds: [],
              approvedBy: [],
              rejectedBy: [],
              mergeConflicts: []
            }
          });
        } catch (error) {
          // If decryption fails, add chapter with basic data
          chaptersData.push({
            id: row.chapter_id,
            title: row.title || 'Untitled Chapter',
            position: row.order_index || 0,
            createdAt: new Date(row.updated_at || Date.now()).toISOString(),
            updatedAt: new Date(row.updated_at || Date.now()).toISOString(),
            authorId: row.owner_user_id,
            lastModifiedBy: row.owner_user_id,
            linkedPlotNodeId: '',
            linkedAct: '',
            linkedOutline: '',
            linkedScenes: [],
            content: { 
              type: 'doc' as const, 
              content: [], 
              metadata: { 
                totalCharacters: 0, 
                totalWords: 0, 
                lastEditedAt: new Date().toISOString() 
              } 
            },
            wordCount: row.word_count || 0,
            hasProposals: Boolean(row.has_proposals),
            characters: [],
            isComplete: false,
            status: 'DRAFT',
            revisions: [],
            currentRevisionId: '',
            collaborativeState: {
              pendingChanges: [],
              needsReview: false,
              reviewerIds: [],
              approvedBy: [],
              rejectedBy: [],
              mergeConflicts: []
            }
          });
        }
      }

      setChapters(chaptersData);
      
      appLog.info('useChapters', 'Loaded chapters from local storage', {
        bookId,
        versionId,
        chapterCount: chaptersData.length,
        chapterTitles: chaptersData.map(ch => ({ id: ch.id, title: ch.title, position: ch.position }))
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapters';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to load chapters', err);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, versionId, user?.id, getPlotCanvas]);

  const createChapter = useCallback(async (title: string, actId?: string): Promise<Chapter | null> => {
    appLog.info('useChapters', 'createChapter called', { title, actId, bookId, userId: user?.id, versionId });
    
    if (!bookId || !user?.id) {
      appLog.warn('useChapters', 'createChapter: Missing required parameters', { bookId, userId: user?.id });
      return null;
    }

    try {
      setError(null);
      
      // Ensure we have a valid version - create one if needed
      let finalVersionId = versionId;
      if (!finalVersionId) {
        finalVersionId = await ensureDefaultVersion(bookId, user.id);
        appLog.info('useChapters', 'Created default version for book', { bookId, versionId: finalVersionId });
      } else {
        // Ensure the version exists in the database (handle UI/cloud vs database sync)
        await ensureVersionInDatabase(finalVersionId, bookId, user.id);
        appLog.info('useChapters', 'Ensured version exists in database', { bookId, versionId: finalVersionId });
      }
      
      appLog.info('useChapters', 'Version validation completed', { finalVersionId });
      
      // Generate IDs early
      const chapterId = generateId();
      appLog.info('useChapters', 'Generated chapter ID', { chapterId });
      
      // Get current plot canvas
      const plotCanvas = getPlotCanvas(bookId, finalVersionId);
      appLog.info('useChapters', 'Retrieved plot canvas', { 
        hasPlotCanvas: !!plotCanvas, 
        nodeCount: plotCanvas?.nodes?.length || 0 
      });
      let narrativeNodes = plotCanvas?.nodes || [];
      let narrativeEdges = plotCanvas?.edges || [];
      
      // Calculate position (add to end)
      const position = chapters.length + 1;
      
      // Create narrative flow structure: Outline -> Act -> Chapter -> Scene
      let outlineNode: NarrativeFlowNode | null = null;
      let actNode: NarrativeFlowNode | null = null;
      
      // Find or create outline node
      const existingOutline = narrativeNodes.find(node => node.data.type === 'outline');
      if (existingOutline) {
        outlineNode = existingOutline;
      } else {
        const outlineId = generateId();
        outlineNode = {
          id: outlineId,
          type: 'outline',
          position: { x: 0, y: 0 },
          data: {
            id: outlineId,
            type: 'outline',
            status: 'not-completed',
            position: { x: 0, y: 0 },
            parentId: null,
            childIds: [],
            linkedNodeIds: [],
            isExpanded: true,
            data: {
              title: 'Book Outline',
              description: 'Main story outline',
              goal: '',
              timelineEventIds: []
            }
          }
        };
        narrativeNodes = [...narrativeNodes, outlineNode];
      }

      // Find existing act or create new one
      if (actId) {
        // Use specified act
        const existingAct = narrativeNodes.find(node => node.id === actId && node.data.type === 'act');
        if (existingAct) {
          actNode = existingAct;
        } else {
          throw new Error(`Specified act not found: ${actId}`);
        }
      } else {
        // Find or create Act 1 (default act for new chapters)
        const existingAct = narrativeNodes.find(node => 
          node.data.type === 'act' && node.data.parentId === outlineNode!.id
        );
        if (existingAct) {
          actNode = existingAct;
        } else {
          const newActId = generateId();
          actNode = {
            id: newActId,
            type: 'act',
            position: { x: -300, y: 200 },
            data: {
              id: newActId,
              type: 'act',
              status: 'not-completed',
              position: { x: -300, y: 200 },
              parentId: outlineNode!.id,
              childIds: [],
              linkedNodeIds: [],
              isExpanded: true,
              data: {
                title: 'Act 1',
                description: 'First act of the story',
                goal: '',
                timelineEventIds: []
              }
            }
          };
          narrativeNodes = [...narrativeNodes, actNode];
          
          // Update outline node to include new act
          narrativeNodes = narrativeNodes.map(node => 
            node.id === outlineNode!.id 
              ? { ...node, data: { ...node.data, childIds: [...node.data.childIds, newActId] } }
              : node
          );
        }
      }

      // Create chapter narrative node
      const chapterNodeId = generateId();
      const chapterNode: NarrativeFlowNode = {
        id: chapterNodeId,
        type: 'chapter',
        position: { x: 0, y: 400 + (position * 150) },
        data: {
          id: chapterNodeId,
          type: 'chapter',
          status: 'not-completed',
          position: { x: 0, y: 400 + (position * 150) },
          parentId: actNode!.id,
          childIds: [],
          linkedNodeIds: [],
          isExpanded: true,
          data: {
            title: title,
            description: `Chapter: ${title}`,
            goal: '',
            timelineEventIds: []
          }
        }
      };

      // Create scene narrative node
      const sceneNodeId = generateId();
      const sceneNode: NarrativeFlowNode = {
        id: sceneNodeId,
        type: 'scene',
        position: { x: 300, y: 400 + (position * 150) },
        data: {
          id: sceneNodeId,
          type: 'scene',
          status: 'not-completed',
          position: { x: 300, y: 400 + (position * 150) },
          parentId: chapterNodeId,
          childIds: [],
          linkedNodeIds: [],
          isExpanded: true,
          data: {
            title: `${title} - Scene 1`,
            description: `Opening scene of ${title}`,
            goal: '',
            chapter: chapterId, // Link to chapter
            characters: [],
            worlds: [],
            timelineEventIds: []
          }
        }
      };

      // Add new nodes to narrative nodes
      narrativeNodes = [...narrativeNodes, chapterNode, sceneNode];
      
      // Update act node to include new chapter
      narrativeNodes = narrativeNodes.map(node => 
        node.id === actNode!.id 
          ? { ...node, data: { ...node.data, childIds: [...node.data.childIds, chapterNodeId] } }
          : node
      );
      
      // Update chapter node to include new scene
      narrativeNodes = narrativeNodes.map(node => 
        node.id === chapterNodeId 
          ? { ...node, data: { ...node.data, childIds: [...node.data.childIds, sceneNodeId] } }
          : node
      );

      // Save updated plot canvas to BookContext
      updatePlotCanvas(bookId, finalVersionId, { nodes: narrativeNodes, edges: narrativeEdges });
      
      // Create the chapter with initial TipTap content
      const initialContent = {
        type: "doc" as const,
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: title }]
          },
          {
            type: 'sceneBeatExtension',
            attrs: {
              sceneId: sceneNodeId,
              summary: '',
              goals: '',
              characters: [],
              collapsed: false
            }
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Start writing your chapter here...' }]
          }
        ],
        metadata: {
          totalCharacters: title.length + 'Start writing your chapter here...'.length,
          totalWords: title.split(' ').length + 'Start writing your chapter here...'.split(' ').length,
          lastEditedAt: new Date().toISOString()
        }
      };

      const chapterRow: ChapterRow = {
        chapter_id: chapterId,
        book_id: bookId,
        version_id: finalVersionId,
        owner_user_id: user.id,
        title,
        order_index: position,
        enc_scheme: 'udek',
        content_enc: new Uint8Array(), // Will be set by encryptionService
        content_iv: new Uint8Array(),  // Will be set by encryptionService
        has_proposals: 0,
        rev_local: '',  // Will be set by encryptionService
        rev_cloud: undefined,
        pending_ops: 0,
        sync_state: 'dirty',
        conflict_state: 'none',
        word_count: initialContent.metadata.totalWords,
        character_count: initialContent.metadata.totalCharacters,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      // Save to local database (will be updated by encryptionService)
      appLog.info('useChapters', 'About to save chapter to database', { 
        chapterId, 
        title: chapterRow.title,
        titleFromInput: title,
        bookId,
        versionId: finalVersionId
      });
      await createChapterAtomic(chapterRow, user.id);
      appLog.info('useChapters', 'Chapter saved to database successfully', { 
        chapterId, 
        titleSaved: chapterRow.title 
      });
      
      // Dynamic import to ensure singleton consistency
      const { encryptionService } = await import('../services/encryptionService');
      console.log('🔓 [CREATE] Encryption service state:', {
        isInitialized: encryptionService.isInitialized(),
        chapterId,
        timestamp: new Date().toISOString()
      });
      
      // Always try to save content, but handle errors gracefully
      try {
        if (encryptionService.isInitialized()) {
          await encryptionService.saveChapterContent(chapterId, bookId, finalVersionId, user.id, initialContent);
        } else {
          // If encryption service isn't ready, log warning and skip content save
          appLog.warn('useChapters', 'Encryption service not ready - skipping content save', {
            chapterId,
            bookId,
            userId: user.id
          });
        }
      } catch (contentError) {
        appLog.error('useChapters', 'Failed to save chapter content - continuing with chapter creation', {
          chapterId,
          bookId,
          userId: user.id,
          error: contentError
        });
      }

      // Create Chapter object for UI state
      const newChapter: Chapter = {
        id: chapterId,
        title,
        position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedPlotNodeId: chapterNodeId, // Link to chapter narrative node
        linkedAct: actNode!.id,          // Link to act narrative node
        linkedOutline: outlineNode!.id,  // Link to outline narrative node
        linkedScenes: [sceneNodeId],     // Link to scene narrative node
        content: initialContent,
        revisions: [],
        currentRevisionId: '',
        collaborativeState: {
          pendingChanges: [],
          needsReview: false,
          reviewerIds: [],
          approvedBy: [],
          rejectedBy: [],
          mergeConflicts: []
        },
        wordCount: initialContent.metadata.totalWords,
        hasProposals: false,
        characters: [],
        isComplete: false,
        status: 'DRAFT',
        authorId: user.id,
        lastModifiedBy: user.id
      };

      // Update local state immediately
      const newChaptersState = [...chapters, newChapter];
      setChapters(newChaptersState);
      
      appLog.info('useChapters', 'Updated local state with new chapter', {
        chapterId: newChapter.id,
        title: newChapter.title,
        totalChapters: newChaptersState.length,
        chapterTitles: newChaptersState.map(ch => ch.title)
      });
      
      // Sync chapters to version content_data so BookContext can see them
      if (bookId && finalVersionId) {
        try {
          /* createChapterAtomic already syncs chapters to version content_data */
appLog.info('useChapters', 'Synced chapters to version content_data', { 
            bookId, 
            versionId: finalVersionId,
            chapterId: newChapter.id,
            title: newChapter.title
          });

          // Mark chapter as properly synced locally since it was successfully saved and synced
          const syncedChapterRow: ChapterRow = {
            ...chapterRow,
            sync_state: 'idle' // Mark as successfully committed locally
          };
          await putChapter(syncedChapterRow);
          
          appLog.info('useChapters', 'Chapter marked as locally synced', {
            chapterId: newChapter.id,
            title: newChapter.title
          });
        } catch (error) {
          appLog.warn('useChapters', 'Failed to sync chapters to version data, but chapter was created', { 
            bookId, 
            versionId: finalVersionId,
            chapterId: newChapter.id,
            error 
          });
        }
      }
      
      appLog.info('useChapters', `Created chapter: ${title} with narrative nodes`, { 
        chapterId: newChapter.id,
        chapterNodeId,
        sceneNodeId,
        actId: actNode!.id,
        outlineId: outlineNode!.id
      });
      
      // Dispatch event to notify other components (like EditorHeader) to refresh
      window.dispatchEvent(new CustomEvent('chapterCreated', { 
        detail: { 
          chapter: newChapter,
          bookId,
          versionId: finalVersionId
        } 
      }));

      // Trigger immediate sync to cloud in background (don't wait for it)
      setTimeout(async () => {
        try {
          // For now, just log the intent to sync
          // TODO: Implement background chapter sync when cloud API is ready
          appLog.info('useChapters', 'Chapter ready for background sync', { chapterId: newChapter.id });
        } catch (error) {
          appLog.warn('useChapters', 'Background chapter sync setup failed', { chapterId: newChapter.id, error });
        }
      }, 1000); // Delay to ensure local save is complete
      
      return newChapter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chapter';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to create chapter', { 
        error: err,
        errorMessage,
        title,
        actId,
        bookId,
        versionId,
        userId: user?.id,
        stack: err instanceof Error ? err.stack : undefined
      });
      console.error('Chapter creation failed:', err);
      return null;
    }
  }, [bookId, versionId, user?.id, chapters.length, getPlotCanvas, updatePlotCanvas]);

  const updateChapter = useCallback(async (chapterId: string, updates: Partial<Chapter>) => {
    if (!bookId || !versionId || !user?.id) return;

    try {
      setError(null);
      
      const existingChapter = chapters.find(c => c.id === chapterId);
      if (!existingChapter) {
        throw new Error(`Chapter not found: ${chapterId}`);
      }
      
      // Update the chapter in local database if needed
      if (updates.title || updates.position) {
        const chapterRow = await getChapter(chapterId, user.id);
        if (chapterRow) {
          const updatedRow: ChapterRow = {
            ...chapterRow,
            title: updates.title || chapterRow.title,
            order_index: updates.position || chapterRow.order_index,
            updated_at: Date.now()
          };
          await putChapter(updatedRow);
        }
      }
      
      // TODO: Update related narrative flow nodes when title/position changes
      
      // Update local state
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { ...chapter, ...updates, updatedAt: new Date().toISOString() } 
          : chapter
      ));
      
      // Sync chapters to version content_data after update
      if (bookId && versionId) {
        try {
          await syncChaptersToVersionData(bookId, versionId, user.id);
          appLog.info('useChapters', 'Synced chapters to version content_data after update', { 
            bookId, 
            versionId,
            chapterId,
            updates
          });
        } catch (error) {
          appLog.warn('useChapters', 'Failed to sync chapters to version data after update', { 
            bookId, 
            versionId,
            chapterId,
            updates,
            error 
          });
        }
      }
      
      appLog.info('useChapters', `Updated chapter: ${chapterId}`, { updates });
      
      // Dispatch event to notify other components to refresh
      window.dispatchEvent(new CustomEvent('chapterUpdated', { 
        detail: { 
          chapterId,
          updates,
          bookId,
          versionId
        } 
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update chapter';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to update chapter', err);
    }
  }, [bookId, versionId, user?.id, chapters]);

  const deleteChapter = useCallback(async (chapterId: string) => {
    if (!bookId || !versionId || !user?.id) return;

    try {
      setError(null);
      
      // Remove from local database
      await deleteChapterAtomic(chapterId, versionId, user.id);
// Update local state
      setChapters(prev => prev.filter(chapter => chapter.id !== chapterId));
      
      // Sync chapters to version content_data after deletion
      if (bookId && versionId) {
        try {
          await syncChaptersToVersionData(bookId, versionId, user.id);
          appLog.info('useChapters', 'Synced chapters to version content_data after deletion', { 
            bookId, 
            versionId,
            deletedChapterId: chapterId
          });
        } catch (error) {
          appLog.warn('useChapters', 'Failed to sync chapters to version data after deletion', { 
            bookId, 
            versionId,
            deletedChapterId: chapterId,
            error 
          });
        }
      }
      
      appLog.info('useChapters', `Deleted chapter: ${chapterId}`);
      
      // Dispatch event to notify other components to refresh
      window.dispatchEvent(new CustomEvent('chapterDeleted', { 
        detail: { 
          chapterId,
          bookId,
          versionId
        } 
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete chapter';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to delete chapter', err);
    }
  }, [bookId, versionId, user?.id]);

  const saveChapterContent = useCallback(async (chapterId: string, content: any, isMinor = true) => {
    if (!bookId || !versionId || !user?.id) return;

    try {
      setError(null);
      
      // Dynamic import to ensure singleton consistency
      const { encryptionService } = await import('../services/encryptionService');
      
      console.log('💾 [saveChapterContent] Checking encryption service state:', {
        isInitialized: encryptionService.isInitialized(),
        chapterId,
        timestamp: new Date().toISOString()
      });
      
      // Check if encryption service is initialized
      if (!encryptionService.isInitialized()) {
        appLog.error('useChapters', 'Encryption service not initialized - cannot save chapter content', {
          chapterId,
          bookId,
          userId: user.id
        });
        throw new Error('Encryption service not initialized. Please unlock your account.');
      }
      
      // Save content to encrypted local storage
      await encryptionService.saveChapterContent(chapterId, bookId, versionId, user.id, content);

      // Update database row to mark as dirty (needs sync)
      const existingChapterRow = await getChapter(chapterId, user.id);
      if (existingChapterRow) {
        const updatedChapterRow: ChapterRow = {
          ...existingChapterRow,
          word_count: content.metadata?.totalWords || 0,
          character_count: content.metadata?.totalCharacters || 0,
          updated_at: Date.now(),
          sync_state: 'dirty' // Mark as needing sync after content change
        };
        await bumpChapterMetadataAtomic(chapterId, versionId, user.id, {
          wordCount: content.metadata?.totalWords || 0,
          charCount: content.metadata?.totalCharacters || 0
        });
        
        appLog.info('useChapters', 'Chapter database row updated after content save', {
          chapterId,
          wordCount: updatedChapterRow.word_count,
          syncState: updatedChapterRow.sync_state
        });
      }

      // Update local chapter content
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { 
              ...chapter, 
              content, 
              updatedAt: new Date().toISOString(),
              lastModifiedBy: user.id,
              wordCount: content.metadata?.totalWords || 0
            } 
          : chapter
      ));
      
      if (!isMinor) {
        appLog.info('useChapters', `Saved major revision for chapter: ${chapterId}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save chapter content';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to save chapter content', err);
    }
  }, [bookId, versionId, user?.id]);

  const refreshChapters = useCallback(async () => {
    await loadChapters();
  }, [loadChapters]);

  const createAct = useCallback(async (title: string) => {
    if (!bookId || !versionId) return;

    try {
      setError(null);
      
      // Get current plot canvas
      const plotCanvas = getPlotCanvas(bookId, versionId);
      let narrativeNodes = plotCanvas?.nodes || [];
      let narrativeEdges = plotCanvas?.edges || [];
      
      // Find existing acts to calculate position
      const existingActs = narrativeNodes.filter(node => node.data.type === 'act');
      
      const actId = generateId();
      const newActNode: NarrativeFlowNode = {
        id: actId,
        type: 'act',
        position: { x: -300, y: 200 + (existingActs.length * 150) },
        data: {
          id: actId,
          type: 'act',
          status: 'not-completed',
          position: { x: -300, y: 200 + (existingActs.length * 150) },
          parentId: 'outline-1', // TODO: Find actual outline node
          childIds: [],
          linkedNodeIds: [],
          isExpanded: true,
          data: {
            title,
            description: `Act: ${title}`,
            goal: '',
            timelineEventIds: []
          }
        }
      };

      // Add new act to narrative nodes
      narrativeNodes = [...narrativeNodes, newActNode];
      
      // Save updated plot canvas
      updatePlotCanvas(bookId, versionId, { nodes: narrativeNodes, edges: narrativeEdges });
      
      appLog.info('useChapters', `Created act: ${title}`, { actId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create act';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to create act', err);
    }
  }, [bookId, versionId, getPlotCanvas, updatePlotCanvas]);

  const deleteAct = useCallback(async (actId: string) => {
    if (!bookId || !versionId) return;

    try {
      setError(null);
      
      // Get current plot canvas
      const plotCanvas = getPlotCanvas(bookId, versionId);
      let narrativeNodes = plotCanvas?.nodes || [];
      let narrativeEdges = plotCanvas?.edges || [];
      
      // Find chapters linked to this act
      const actChapters = chapters.filter(chapter => chapter.linkedAct === actId);
      
      if (actChapters.length > 0) {
        // Find next available act
        const availableActs = narrativeNodes.filter(node => node.data.type === 'act' && node.id !== actId);
        const nextAct = availableActs[0];
        
        if (nextAct) {
          // Move chapters to next act
          setChapters(prev => prev.map(chapter => 
            chapter.linkedAct === actId 
              ? { ...chapter, linkedAct: nextAct.id }
              : chapter
          ));
          
          appLog.info('useChapters', `Moved ${actChapters.length} chapters from deleted act ${actId} to act ${nextAct.id}`);
        }
      }
      
      // Remove act from narrative nodes
      narrativeNodes = narrativeNodes.filter(node => node.id !== actId);
      
      // Save updated plot canvas
      updatePlotCanvas(bookId, versionId, { nodes: narrativeNodes, edges: narrativeEdges });
      
      appLog.info('useChapters', `Deleted act: ${actId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete act';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to delete act', err);
    }
  }, [bookId, versionId, chapters, getPlotCanvas, updatePlotCanvas]);

  const reorderChapter = useCallback(async (chapterId: string, newPosition: number, newActId?: string) => {
    if (!bookId || !versionId) return;

    try {
      setError(null);
      
      setChapters(prev => {
        const updatedChapters = prev.map(chapter => {
          if (chapter.id === chapterId) {
            return {
              ...chapter,
              position: newPosition,
              linkedAct: newActId || chapter.linkedAct,
              updatedAt: new Date().toISOString()
            };
          }
          return chapter;
        });
        
        // Reorder positions
        return updatedChapters.sort((a, b) => a.position - b.position);
      });
      
      appLog.info('useChapters', `Reordered chapter: ${chapterId} to position ${newPosition}`, { newActId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder chapter';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to reorder chapter', err);
    }
  }, [bookId, versionId]);

  // Helper function to get chapters by act
  const getChaptersByAct = useCallback((actId: string): Chapter[] => {
    return chapters.filter(chapter => chapter.linkedAct === actId).sort((a, b) => a.position - b.position);
  }, [chapters]);

  // Helper function to get current acts from narrative flow
  const getCurrentActs = useCallback((): NarrativeFlowNode[] => {
    if (!bookId || !versionId) return [];
    
    const plotCanvas = getPlotCanvas(bookId, versionId);
    return (plotCanvas?.nodes || [])
      .filter(node => node.data.type === 'act')
      .sort((a, b) => a.position.y - b.position.y);
  }, [bookId, versionId, getPlotCanvas]);

  // Helper function to move chapter to different act
  const moveChapterToAct = useCallback(async (chapterId: string, targetActId: string) => {
    if (!bookId || !versionId || !user?.id) return;

    try {
      setError(null);

      // Update chapter in local state
      const targetChapters = getChaptersByAct(targetActId);
      const newPosition = targetChapters.length + 1; // Add at end of target act

      await updateChapter(chapterId, { 
        linkedAct: targetActId,
        position: newPosition
      });

      appLog.info('useChapters', `Moved chapter ${chapterId} to act ${targetActId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move chapter to act';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to move chapter to act', err);
    }
  }, [bookId, versionId, user?.id, getChaptersByAct, updateChapter]);

  // Load chapters on mount and when bookId/versionId changes
  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  return {
    chapters,
    isLoading,
    error,
    createChapter,
    updateChapter,
    deleteChapter,
    saveChapterContent,
    refreshChapters,
    createAct,
    deleteAct,
    reorderChapter,
    getChaptersByAct,
    getCurrentActs,
    moveChapterToAct
  };
}
