import { useMemo } from 'react';
import { Chapter } from '../types';
import { NarrativeFlowNode } from '../types/narrative-layout';
import { useBookContext } from '../contexts/BookContext';

export interface ActWithChapters {
  id: string;
  name: string;
  description?: string;
  node?: NarrativeFlowNode;
  chapters: Chapter[];
  position: number;
}

export interface ChapterNavigationData {
  acts: ActWithChapters[];
  totalChapters: number;
  completedChapters: number;
  completionPercentage: number;
  currentActIndex: number;
  currentChapterIndex: number;
}

/**
 * Hook for organizing chapters into acts based on narrative flow structure
 * and providing navigation utilities for the chapter progress bar
 */
export function useChapterNavigation(
  bookId?: string, 
  versionId?: string, 
  chapters: Chapter[] = [], 
  currentChapter?: Chapter
): ChapterNavigationData {
  const { getPlotCanvas } = useBookContext();

  const navigationData = useMemo((): ChapterNavigationData => {
    if (!bookId || !versionId) {
      return {
        acts: [],
        totalChapters: 0,
        completedChapters: 0,
        completionPercentage: 0,
        currentActIndex: -1,
        currentChapterIndex: -1
      };
    }

    // Get narrative flow nodes
    const plotCanvas = getPlotCanvas(bookId, versionId);
    const narrativeNodes = plotCanvas?.nodes || [];
    
    // Find all act nodes from narrative flow
    const actNodes = narrativeNodes
      .filter(node => node.data.type === 'act')
      .sort((a, b) => a.position.y - b.position.y); // Sort by Y position (vertical order)

    // Create acts structure
    const actsWithChapters: ActWithChapters[] = [];
    
    if (actNodes.length === 0) {
      // No narrative flow acts found, create default structure
      const defaultActs: ActWithChapters[] = [
        { id: 'act-1', name: 'Act I', chapters: [], position: 0 },
        { id: 'act-2', name: 'Act II', chapters: [], position: 1 },
        { id: 'act-3', name: 'Act III', chapters: [], position: 2 }
      ];

      // Distribute chapters across default acts based on position
      const sortedChapters = [...chapters].sort((a, b) => a.position - b.position);
      const chaptersPerAct = Math.ceil(sortedChapters.length / 3);
      
      sortedChapters.forEach((chapter, index) => {
        const actIndex = Math.floor(index / chaptersPerAct);
        const targetActIndex = Math.min(actIndex, 2); // Ensure we don't exceed 3 acts
        defaultActs[targetActIndex].chapters.push(chapter);
      });

      return {
        acts: defaultActs,
        totalChapters: chapters.length,
        completedChapters: chapters.filter(ch => ch.isComplete).length,
        completionPercentage: chapters.length > 0 ? (chapters.filter(ch => ch.isComplete).length / chapters.length) * 100 : 0,
        currentActIndex: currentChapter ? defaultActs.findIndex(act => act.chapters.some(ch => ch.id === currentChapter.id)) : -1,
        currentChapterIndex: currentChapter ? chapters.findIndex(ch => ch.id === currentChapter.id) : -1
      };
    }

    // Build acts from narrative flow nodes
    actNodes.forEach((actNode, index) => {
      const actTitle = (actNode.data.data as any)?.title || `Act ${index + 1}`;
      const actDescription = (actNode.data.data as any)?.description || '';
      
      // Find chapters linked to this act
      const actChapters = chapters
        .filter(chapter => chapter.linkedAct === actNode.id)
        .sort((a, b) => a.position - b.position);

      actsWithChapters.push({
        id: actNode.id,
        name: actTitle,
        description: actDescription,
        node: actNode,
        chapters: actChapters,
        position: index
      });
    });

    // Handle chapters without linked acts (orphaned chapters)
    const orphanedChapters = chapters.filter(chapter => 
      !chapter.linkedAct || !actNodes.find(node => node.id === chapter.linkedAct)
    );

    if (orphanedChapters.length > 0) {
      // Add orphaned chapters to the first act, or create a default act
      if (actsWithChapters.length > 0) {
        actsWithChapters[0].chapters.push(...orphanedChapters);
        actsWithChapters[0].chapters.sort((a, b) => a.position - b.position);
      } else {
        // Create a default act for orphaned chapters
        actsWithChapters.push({
          id: 'default-act',
          name: 'Act I',
          description: 'Default act for chapters',
          chapters: orphanedChapters.sort((a, b) => a.position - b.position),
          position: 0
        });
      }
    }

    // Calculate statistics
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter(ch => ch.isComplete).length;
    const completionPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    
    // Find current act and chapter indices
    let currentActIndex = -1;
    let currentChapterIndex = -1;
    
    if (currentChapter) {
      currentActIndex = actsWithChapters.findIndex(act => 
        act.chapters.some(ch => ch.id === currentChapter.id)
      );
      currentChapterIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
    }

    return {
      acts: actsWithChapters,
      totalChapters,
      completedChapters,
      completionPercentage,
      currentActIndex,
      currentChapterIndex
    };
  }, [bookId, versionId, chapters, currentChapter, getPlotCanvas]);

  return navigationData;
}

/**
 * Utility function to get the next chapter in the sequence
 */
export function getNextChapter(chapters: Chapter[], currentChapter?: Chapter): Chapter | undefined {
  if (!currentChapter || chapters.length === 0) return chapters[0];
  
  const sortedChapters = [...chapters].sort((a, b) => a.position - b.position);
  const currentIndex = sortedChapters.findIndex(ch => ch.id === currentChapter.id);
  
  if (currentIndex === -1 || currentIndex === sortedChapters.length - 1) return undefined;
  
  return sortedChapters[currentIndex + 1];
}

/**
 * Utility function to get the previous chapter in the sequence
 */
export function getPreviousChapter(chapters: Chapter[], currentChapter?: Chapter): Chapter | undefined {
  if (!currentChapter || chapters.length === 0) return undefined;
  
  const sortedChapters = [...chapters].sort((a, b) => a.position - b.position);
  const currentIndex = sortedChapters.findIndex(ch => ch.id === currentChapter.id);
  
  if (currentIndex <= 0) return undefined;
  
  return sortedChapters[currentIndex - 1];
}

/**
 * Utility function to get act name from narrative flow node or generate default
 */
export function getActName(actNode?: NarrativeFlowNode, fallbackIndex: number = 1): string {
  if (actNode?.data.data && (actNode.data.data as any).title) {
    return (actNode.data.data as any).title;
  }
  
  // Generate Roman numeral for act number
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const romanIndex = Math.min(fallbackIndex - 1, romanNumerals.length - 1);
  return `Act ${romanNumerals[romanIndex]}`;
}
