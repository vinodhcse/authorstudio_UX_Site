import { useState, useEffect, useCallback } from 'react';
import { Chapter, PlotNode } from '../types';
import { apiClient } from '../api/apiClient';
import { appLog } from '../auth/fileLogger';

// Utility function to generate unique IDs
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export interface UseChaptersReturn {
  chapters: Chapter[];
  plotNodes: PlotNode[];
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
  const [plotNodes, setPlotNodes] = useState<PlotNode[]>([]);
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

      // Load chapters and plot nodes in parallel
      const [chaptersResponse, plotNodesResponse] = await Promise.all([
        apiClient.getChapters(bookId, versionId),
        apiClient.getPlotNodes(bookId, versionId)
      ]);

      const chaptersData = chaptersResponse as Chapter[];
      const plotNodesData = plotNodesResponse as PlotNode[];
      appLog.info('useChapters', `chaptersData ${JSON.stringify(chaptersData)} chapters and plot nodes : ${JSON.stringify(plotNodesData)}`);
      setChapters(chaptersData);
      if (plotNodesData) {
        setPlotNodes(plotNodesData);
      }
      
      
      appLog.info('useChapters', `Loaded ${chaptersData.length} chapters and ${plotNodesData.length} plot nodes`);
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
      let outlineNode: PlotNode | null = null;
      let actNode: PlotNode | null = null;
      
      // Find or create outline node
      const existingOutline = plotNodes?.find(node => node.type === 'outline');
      if (existingOutline) {
        outlineNode = existingOutline;
      } else {
        const outlineId = generateId();
        const outlineResponse = await apiClient.createPlotNode(bookId, versionId, {
          id: outlineId,
          type: 'outline',
          title: 'Book Outline',
          description: 'Main story outline',
          position: 1
        });
        outlineNode = { ...outlineResponse as PlotNode, id: outlineId };
        setPlotNodes(prev => [...prev, outlineNode!]);
      }

      // Find or create Act 1 (for now, we'll create Act 1 by default)
      const existingAct = plotNodes.find(node => node.type === 'act' && node.parentId === outlineNode.id);
      if (existingAct) {
        actNode = existingAct;
      } else {
        const actId = generateId();
        const actResponse = await apiClient.createPlotNode(bookId, versionId, {
          id: actId,
          type: 'act',
          title: 'Act 1',
          description: 'First act of the story',
          parentId: outlineNode.id,
          position: 1
        });
        actNode = { ...actResponse as PlotNode, id: actId };
        setPlotNodes(prev => [...prev, actNode!]);
      }

      // Create chapter plot node
      const chapterNodeId = generateId();
      const chapterNodeResponse = await apiClient.createPlotNode(bookId, versionId, {
        id: chapterNodeId,
        type: 'chapter',
        title: title,
        description: `Chapter: ${title}`,
        parentId: actNode.id,
        position: position
      });
      const chapterNode = { ...chapterNodeResponse as PlotNode, id: chapterNodeId };

      // Create scene plot node
      const sceneNodeId = generateId();
      const sceneNodeResponse = await apiClient.createPlotNode(bookId, versionId, {
        id: sceneNodeId,
        type: 'scene',
        title: `${title} - Scene 1`,
        description: `Opening scene of ${title}`,
        parentId: chapterNode.id,
        position: 1
      });
      const sceneNode = { ...sceneNodeResponse as PlotNode, id: sceneNodeId };

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
        linkedActId: actNode.id,
        linkedOutlineId: outlineNode.id
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
      setPlotNodes(prev => [...prev, chapterNode, sceneNode]);
      
      appLog.info('useChapters', `Created chapter: ${title}`, { chapterId: newChapter.id });
      return newChapter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chapter';
      setError(errorMessage);
      appLog.error('useChapters', 'Failed to create chapter', err);
      return null;
    }
  }, [bookId, versionId, chapters.length, plotNodes]);

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
    plotNodes,
    isLoading,
    error,
    createChapter,
    updateChapter,
    deleteChapter,
    saveChapterContent,
    refreshChapters
  };
}
