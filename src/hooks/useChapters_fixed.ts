import { useState, useEffect, useCallback } from 'react';
import { Chapter } from '../types';
import { NarrativeFlowNode, NarrativeEdge } from '../types/narrative-layout';
import { apiClient } from '../api/apiClient';
import { appLog } from '../auth/fileLogger';

// Utility function to generate unique IDs
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export interface UseChaptersReturn {
  chapters: Chapter[];
  narrativeNodes: NarrativeFlowNode[];
  narrativeEdges: NarrativeEdge[];
  isLoading: boolean;
  error: string | null;
  createChapter: (title: string) => Promise<Chapter | null>;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  saveChapterContent: (chapterId: string, content: any, isMinor?: boolean) => Promise<void>;
  refreshChapters: () => Promise<void>;
}

export function useChapters(bookId?: string, versionId?: string): UseChaptersReturn {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [narrativeNodes, setNarrativeNodes] = useState<NarrativeFlowNode[]>([]);
  const [narrativeEdges, setNarrativeEdges] = useState<NarrativeEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChapters = useCallback(async () => {
    if (!bookId || !versionId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load chapters and plot canvas in parallel
      const [chaptersResponse, plotCanvasResponse] = await Promise.all([
        apiClient.getChapters(bookId, versionId),
        apiClient.getPlotNodes(bookId, versionId)
      ]);

      const chaptersData = chaptersResponse as Chapter[];
      const plotCanvasData = plotCanvasResponse as { nodes: NarrativeFlowNode[], edges: NarrativeEdge[] };
      
      appLog.info('useChapters', `chaptersData ${JSON.stringify(chaptersData)} and plotCanvas: ${JSON.stringify(plotCanvasData)}`);
      
      setChapters(chaptersData);
      if (plotCanvasData?.nodes) {
        setNarrativeNodes(plotCanvasData.nodes);
      }
      if (plotCanvasData?.edges) {
        setNarrativeEdges(plotCanvasData.edges);
      }
      
      appLog.info('useChapters', `Loaded ${chaptersData.length} chapters and ${plotCanvasData?.nodes?.length || 0} narrative nodes`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapters';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to load chapters', err);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, versionId]);

  const createChapter = useCallback(async (title: string): Promise<Chapter | null> => {
    if (!bookId || !versionId) return null;

    try {
      setError(null);
      
      // Calculate position (add to end)
      const position = chapters.length + 1;
      
      // Create plot structure: Outline -> Act -> Chapter -> Scene
      let outlineNode: NarrativeFlowNode | null = null;
      let actNode: NarrativeFlowNode | null = null;
      
      // Find or create outline node
      const existingOutline = narrativeNodes?.find(node => node.data.type === 'outline');
      if (existingOutline) {
        outlineNode = existingOutline;
      } else {
        const outlineId = generateId();
        await apiClient.createPlotNode(bookId, versionId, {
          id: outlineId,
          type: 'outline',
          title: 'Book Outline',
          description: 'Main story outline',
          position: 1
        });
        
        // Convert API response to NarrativeFlowNode
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
        setNarrativeNodes(prev => [...prev, outlineNode!]);
      }

      // Find or create Act 1 (for now, we'll create Act 1 by default)
      const existingAct = narrativeNodes.find(node => 
        node.data.type === 'act' && node.data.parentId === outlineNode!.id
      );
      if (existingAct) {
        actNode = existingAct;
      } else {
        const actId = generateId();
        await apiClient.createPlotNode(bookId, versionId, {
          id: actId,
          type: 'act',
          title: 'Act 1',
          description: 'First act of the story',
          parentId: outlineNode!.id,
          position: 1
        });
        
        // Convert API response to NarrativeFlowNode
        actNode = {
          id: actId,
          type: 'act',
          position: { x: -300, y: 200 },
          data: {
            id: actId,
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
        setNarrativeNodes(prev => [...prev, actNode!]);
      }

      // Create chapter plot node
      const chapterNodeId = generateId();
      await apiClient.createPlotNode(bookId, versionId, {
        id: chapterNodeId,
        type: 'chapter',
        title: title,
        description: `Chapter: ${title}`,
        parentId: actNode!.id,
        position: position
      });
      
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

      // Create scene plot node
      const sceneNodeId = generateId();
      await apiClient.createPlotNode(bookId, versionId, {
        id: sceneNodeId,
        type: 'scene',
        title: `${title} - Scene 1`,
        description: `Opening scene of ${title}`,
        parentId: chapterNode.id,
        position: 1
      });
      
      const sceneNode: NarrativeFlowNode = {
        id: sceneNodeId,
        type: 'scene',
        position: { x: 300, y: 400 + (position * 150) },
        data: {
          id: sceneNodeId,
          type: 'scene',
          status: 'not-completed',
          position: { x: 300, y: 400 + (position * 150) },
          parentId: chapterNode.id,
          childIds: [],
          linkedNodeIds: [],
          isExpanded: true,
          data: {
            title: `${title} - Scene 1`,
            description: `Opening scene of ${title}`,
            goal: '',
            chapter: title,
            characters: [],
            worlds: [],
            timelineEventIds: []
          }
        }
      };

      // Create the chapter with initial TipTap content
      const initialContent = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: title }]
          },
          {
            type: 'sceneMetaSection',
            attrs: {
              summary: '',
              goals: '',
              characters: [],
              plotNodeId: sceneNode.id,
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

      const chapterId = generateId();
      const chapterResponse = await apiClient.createChapter(bookId, versionId, {
        id: chapterId,
        title,
        position,
        linkedActId: actNode!.id,
        linkedOutlineId: outlineNode!.id
      });

      const newChapter: Chapter = {
        ...chapterResponse as any,
        id: chapterId,
        content: initialContent,
        linkedPlotNodeId: chapterNode.id,
        linkedScenes: [sceneNode.id],
        wordCount: initialContent.metadata.totalWords,
        hasProposals: false,
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
      };

      setChapters(prev => [...prev, newChapter]);
      setNarrativeNodes(prev => [...prev, chapterNode, sceneNode]);
      
      appLog.info('useChapters', `Created chapter: ${title}`, { chapterId: newChapter.id });
      return newChapter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chapter';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to create chapter', err);
      return null;
    }
  }, [bookId, versionId, chapters.length, narrativeNodes]);

  const updateChapter = useCallback(async (chapterId: string, updates: Partial<Chapter>) => {
    if (!bookId || !versionId) return;

    try {
      setError(null);
      await apiClient.updateChapter(bookId, versionId, chapterId, updates);
      
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId ? { ...chapter, ...updates } : chapter
      ));
      
      appLog.info('useChapters', `Updated chapter: ${chapterId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update chapter';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to update chapter', err);
    }
  }, [bookId, versionId]);

  const deleteChapter = useCallback(async (chapterId: string) => {
    if (!bookId || !versionId) return;

    try {
      setError(null);
      await apiClient.deleteChapter(bookId, versionId, chapterId);
      
      setChapters(prev => prev.filter(chapter => chapter.id !== chapterId));
      
      appLog.info('useChapters', `Deleted chapter: ${chapterId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete chapter';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to delete chapter', err);
    }
  }, [bookId, versionId]);

  const saveChapterContent = useCallback(async (chapterId: string, content: any, isMinor = true) => {
    if (!bookId || !versionId) return;
    console.log('Saving chapter content:', { chapterId, isMinor, content });
    try {
      setError(null);
      
      // Save as revision
      const revisionId = generateId();
      await apiClient.saveRevision(bookId, versionId, chapterId, {
        id: revisionId,
        content,
        isMinor,
        message: isMinor ? undefined : 'Manual save'
      });

      // Update local chapter content
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { 
              ...chapter, 
              content, 
              updatedAt: new Date().toISOString(),
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
  }, [bookId, versionId]);

  const refreshChapters = useCallback(async () => {
    await loadChapters();
  }, [loadChapters]);

  // Load chapters on mount and when bookId/versionId changes
  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  return {
    chapters,
    narrativeNodes,
    narrativeEdges,
    isLoading,
    error,
    createChapter,
    updateChapter,
    deleteChapter,
    saveChapterContent,
    refreshChapters
  };
}
