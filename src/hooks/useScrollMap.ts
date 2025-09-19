import { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';

// Simple throttle function
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  const throttledFunc = (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };

  throttledFunc.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttledFunc;
};

export interface ScrollMapItem {
  id: string;
  type: 'sceneBeat' | 'note' | 'impersonation' | 'bookmark';
  y: number;
  label: string;
  element: HTMLElement;
  relativeY: number; // 0-1 percentage of document height
}

interface UseScrollMapOptions {
  editor: Editor | null;
  selector: string;
  types: string[];
  throttleMs?: number;
}

export const useScrollMap = ({
  editor,
  selector = '[data-node-type]',
  types = ['sceneBeat', 'note', 'impersonation', 'bookmark'],
  throttleMs = 16 // ~60fps
}: UseScrollMapOptions) => {
  const [scrollMapItems, setScrollMapItems] = useState<ScrollMapItem[]>([]);
  const [currentViewY, setCurrentViewY] = useState(0);
  const [documentHeight, setDocumentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Create a stable dependency key for the types array to avoid re-creating callbacks/effects
  // Default param creates a new array each render; using a string key prevents infinite loops
  const typesKey = useMemo(() => {
    try {
      return JSON.stringify(types);
    } catch {
      return '';
    }
  }, [JSON.stringify(types)]);

  // Update scroll map items
  const updateScrollMap = useCallback(() => {
    if (!editor?.view?.dom) return;

    const editorElement = editor.view.dom;
    const editorContainer = editorElement.closest('.prose') || editorElement.parentElement;
    
    if (!editorContainer) return;

    const elements = editorContainer.querySelectorAll(selector) as NodeListOf<HTMLElement>;
    const items: ScrollMapItem[] = [];

    // Get document dimensions
  const documentHeight = editorContainer.scrollHeight;
  const viewportHeight = window.innerHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const editorRect = editorContainer.getBoundingClientRect();
  const editorTopAbs = editorRect.top + scrollTop; // absolute Y of the editor container in page coords

    elements.forEach((element, index) => {
      const nodeType = element.getAttribute('data-node-type');
      const nodeId = element.getAttribute('data-node-id') || `${nodeType}-${index}`;
      
  if (!nodeType || !types.includes(nodeType)) return;

  const rect = element.getBoundingClientRect();
  const absoluteY = rect.top + scrollTop; // absolute in page
  const yWithinEditor = Math.max(0, absoluteY - editorTopAbs);
  const relativeY = documentHeight > 0 ? yWithinEditor / documentHeight : 0;

      // Generate label inline to avoid dependency issues
      let label = 'Unknown';
      switch (nodeType) {
        case 'sceneBeat':
          const sceneTitle = element.getAttribute('data-scene-title');
          const chapterName = element.getAttribute('data-chapter-name');
          const sceneBeatIndex = element.getAttribute('data-scene-beat-index');
          if (sceneTitle) label = sceneTitle;
          else if (chapterName && sceneBeatIndex) label = `${chapterName} – Beat ${sceneBeatIndex}`;
          else label = 'Scene Beat';
          break;
        case 'note':
          const noteContent = element.getAttribute('data-content');
          label = noteContent ? `Note: ${noteContent.substring(0, 30)}...` : 'Note Section';
          break;
        case 'impersonation':
          const character = element.getAttribute('data-active-character');
          label = character ? `Impersonation: ${character}` : 'Character Impersonation';
          break;
        case 'bookmark':
          const bookmarkLabel = element.getAttribute('data-bookmark-label');
          label = bookmarkLabel || 'Bookmark';
          break;
        default:
          label = 'Custom Section';
      }

      items.push({
        id: nodeId,
        type: nodeType as ScrollMapItem['type'],
    y: yWithinEditor,
        label,
        element,
        relativeY
      });
    });

    setScrollMapItems(items);
    setDocumentHeight(documentHeight);
    setViewportHeight(viewportHeight);
  // Current top of viewport within the editor doc (not the page)
  const currentY = Math.max(0, Math.min(documentHeight, scrollTop - editorTopAbs));
  setCurrentViewY(currentY);
  }, [editor, selector, typesKey]); // depend on stable key, not array identity

  // Throttled scroll handler - use useMemo to prevent recreation
  const throttledUpdateScrollMap = useMemo(
    () => throttle(updateScrollMap, throttleMs),
    [updateScrollMap, throttleMs]
  );

  // Scroll to specific item
  const scrollToItem = useCallback((item: ScrollMapItem) => {
    item.element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!editor?.view?.dom) return;

    // Initial update
    updateScrollMap();
    // Re-run after paint and shortly after mount to catch late DOM
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => updateScrollMap());
    }
    const t1 = setTimeout(() => updateScrollMap(), 80);

    // Listen for scroll events
    const handleScroll = () => {
      throttledUpdateScrollMap();
    };

    // Listen for editor content changes
    const handleTransaction = () => {
      // Delay to allow DOM updates
      setTimeout(updateScrollMap, 100);
    };

    // Listen for window resize
    const handleResize = () => {
      updateScrollMap();
    };

    // Observe editor container DOM and size changes to refresh markers
    const editorElement = editor.view.dom;
    const editorContainer = editorElement.closest('.prose') || editorElement.parentElement;
    let mo: MutationObserver | null = null;
    let ro: ResizeObserver | null = null;
    if (editorContainer) {
      try {
        mo = new MutationObserver(() => throttledUpdateScrollMap());
        mo.observe(editorContainer, { childList: true, subtree: true, attributes: true, characterData: true });
      } catch {}
      try {
        ro = new (window as any).ResizeObserver(() => throttledUpdateScrollMap());
        if (ro) ro.observe(editorContainer as Element);
      } catch {}
    }

    const onVisibility = () => updateScrollMap();
    document.addEventListener('visibilitychange', onVisibility);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    editor.on('transaction', handleTransaction);

    return () => {
      clearTimeout(t1);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      editor.off('transaction', handleTransaction);
      document.removeEventListener('visibilitychange', onVisibility);
      if (mo) try { mo.disconnect(); } catch {}
      if (ro) try { ro.disconnect(); } catch {}
      throttledUpdateScrollMap.cancel();
    };
  }, [editor, updateScrollMap]); // Keep updateScrollMap since it's memoized with useCallback

  return {
    scrollMapItems,
    currentViewY,
    documentHeight,
    viewportHeight,
    scrollToItem,
    updateScrollMap
  };
};
