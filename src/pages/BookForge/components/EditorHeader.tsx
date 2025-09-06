import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Book, Version, Theme, Chapter } from '../../../types';
import { SunIcon, MoonIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon, UserIcon, MagnifyingGlassIcon, Squares2X2Icon, GlobeAltIcon, PencilIcon, CogIcon, ComputerDesktopIcon, Bars3BottomLeftIcon, SparklesIcon, PlusIcon, DocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ChapterSettingsModal from './ChapterSettingsModal';
import CreateChapterModal from './CreateChapterModal';
import CreateActModal from './CreateActModal';
import ActSettingsModal from './ActSettingsModal';
import { useToolWindowStore } from '../../../stores/toolWindowStore';
import { useBookContext, useCurrentBookAndVersion } from '../../../contexts/BookContext';
import { useAuthStore } from '../../../auth';
import { appLog } from '../../../auth/fileLogger';
import { createPortal } from 'react-dom';

const DropdownMenu: React.FC<{
    trigger: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    menuClassName?: string;
    portalToBody?: boolean;
    align?: 'left' | 'right';
}> = ({ trigger, children, className, menuClassName, portalToBody = false, align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const t = event.target as HTMLElement;
            // Don't close if clicking inside the wrapper (trigger) or any portal menu
            if (wrapperRef.current && wrapperRef.current.contains(t)) return;
            if ((t.closest && t.closest('.dropdown-portal-menu')) as any) return;
            setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Compute portal position so the menu appears directly below the trigger
    useEffect(() => {
        if (!isOpen || !portalToBody) return;
        const compute = () => {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (!rect) return;
            // Use expected menu width (w-56 => 224px) for alignment; avoids ref writes
            const menuWidth = 224;
            const desiredLeft = align === 'right' ? rect.right - menuWidth : rect.left;
            // Clamp to viewport
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const clampedLeft = Math.max(8, Math.min(desiredLeft, vw - menuWidth - 8));
            setPos({ top: rect.bottom + 8, left: clampedLeft });
        };
        compute();
        const onScrollOrResize = () => compute();
        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);
        return () => {
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, [isOpen, portalToBody, align]);

    const menu = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    className={`dropdown-portal-menu mt-2 min-w-[12rem] rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 z-[100] ${menuClassName ?? 'bg-white dark:bg-gray-900'}`}
                    style={
                        portalToBody && pos
                            ? {
                                  position: 'fixed',
                                  top: pos.top,
                                  left: pos.left,
                              }
                            : { position: 'absolute', [align]: 0 as any }
                    }
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
    <div className={`relative ${className || ''}`} ref={wrapperRef}>
            <div className="flex items-center" onClick={() => setIsOpen(!isOpen)} ref={triggerRef}>
                {trigger}
            </div>
            {!portalToBody ? menu : createPortal(menu, document.body)}
        </div>
    );
};

const ChapterProgressBar: React.FC<{ 
    book: Book, 
    currentChapter?: Chapter,
    chapters?: Chapter[],
    onOpenSettings: () => void, 
    onOpenTypographySettings: () => void,
    onCreateChapter?: (title: string, actId?: string) => Promise<void>,
    onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => Promise<void>,
    onDeleteChapter?: (chapterId: string) => Promise<void>,
    onCreateAct?: (title: string) => Promise<void>,
    onDeleteAct?: (actId: string) => Promise<void>,
    onReorderChapter?: (chapterId: string, newPosition: number, newActId?: string) => Promise<void>,
    onNavigateToChapter?: (chapterId: string) => void,
    isChapterLoading?: boolean
}> = ({ 
    book, 
    currentChapter,
    chapters = [],
    onOpenSettings, 
    onOpenTypographySettings, 
    onCreateChapter, 
    onUpdateChapter,
    onDeleteChapter,
    onCreateAct,
    onDeleteAct,
    onReorderChapter,
    onNavigateToChapter,
    isChapterLoading = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isChapterSettingsOpen, setChapterSettingsOpen] = useState(false);
    const [selectedChapterForSettings, setSelectedChapterForSettings] = useState<Chapter | null>(null);
    const [showCreateChapterModal, setShowCreateChapterModal] = useState(false);
    const [selectedActForNewChapter, setSelectedActForNewChapter] = useState<string>('');
    const triggerRef = useRef<HTMLDivElement>(null);
    const { bookId, versionId } = useCurrentBookAndVersion();
    const { getPlotCanvas, updatePlotCanvas } = useBookContext();
    const [actNodes, setActNodes] = useState<any[]>([]);
    const [narrativeNodes, setNarrativeNodes] = useState<any[]>([]);
    const [showCreateActModal, setShowCreateActModal] = useState(false);
    const [showActSettingsModal, setShowActSettingsModal] = useState(false);
    const [selectedActForSettings, setSelectedActForSettings] = useState<string | null>(null);
    const [draggingChapter, setDraggingChapter] = useState<{ id: string; sourceActId: string } | null>(null);
    const [draggingActId, setDraggingActId] = useState<string | null>(null);
    const [hoverActId, setHoverActId] = useState<string | null>(null);
    const [hoverChapterId, setHoverChapterId] = useState<string | null>(null);
    // Visual insertion indicator for consistent drop position
    const [insertTarget, setInsertTarget] = useState<{ actId: string; index: number } | null>(null);
    // Page-level spinner when persisting reorder
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const isDraggingRef = useRef(false);
    const actRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const pointerDragRef = useRef<{ active: boolean; started: boolean; startX: number; startY: number; chapterId: string; sourceActId: string } | null>(null);
    // Create a guaranteed drag image (1x1 transparent) to avoid browser quirks
    const dragImgRef = useRef<HTMLDivElement | null>(null);
    const getDragImage = () => {
        if (dragImgRef.current) return dragImgRef.current;
        const el = document.createElement('div');
        el.style.width = '1px';
        el.style.height = '1px';
        el.style.opacity = '0';
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        document.body.appendChild(el);
        dragImgRef.current = el;
        return el;
    };
    // DnD debug helpers
    const DEBUG_DND = true;
    const dlog = (...args: any[]) => { if (DEBUG_DND) console.log('[EditorHeader DnD]', ...args); };
    const readDT = (dt: DataTransfer | null | undefined) => {
        if (!dt) return { types: [], effectAllowed: 'n/a', dropEffect: 'n/a' };
        try {
            return {
                types: Array.from(dt.types || []),
                effectAllowed: dt.effectAllowed,
                dropEffect: dt.dropEffect
            };
        } catch {
            return { types: [], effectAllowed: 'err', dropEffect: 'err' };
        }
    };
    // Centralized act drop handler used by both container and header
    const handleActDrop = (
        e: React.DragEvent<HTMLElement>,
        targetActId: string,
        actGroup: { chapters: Chapter[] }
    ) => {
        e.preventDefault();
        try { (e.dataTransfer as DataTransfer).dropEffect = 'move'; } catch {}
        setHoverActId(null);
        const run = async (chapterId: string) => {
            const targetLen = actGroup.chapters.length;
            try {
                setIsSavingOrder(true);
                await moveChapterNodeBetweenActs(chapterId, targetActId, targetLen);
                if (onReorderChapter) await onReorderChapter(chapterId, targetLen + 1, targetActId);
                window.dispatchEvent(new CustomEvent('chapterUpdated'));
                window.dispatchEvent(new CustomEvent('plotAutoArrange'));
            } finally {
                setIsSavingOrder(false);
                setInsertTarget(null);
            }
        };
        (async () => {
            try {
                const raw = (e.dataTransfer as DataTransfer).getData('text/plain');
                const data = raw ? JSON.parse(raw) : null;
                if (data?.type === 'act' && data.actId && data.actId !== targetActId) {
                    reorderActs(data.actId, targetActId);
                } else if (data?.type === 'chapter' && data.chapterId) {
                    await run(data.chapterId);
                }
            } catch {
                if (draggingActId && draggingActId !== targetActId) reorderActs(draggingActId, targetActId);
                if (draggingChapter) await run(draggingChapter.id);
            }
        })();
        setDraggingActId(null);
        setDraggingChapter(null);
    };

    // Helper: update plotCanvas nodes for chapter move between acts or within an act
    const moveChapterNodeBetweenActs = async (chapterId: string, targetActId: string, targetIndex?: number) => {
        if (!bookId || !versionId) return;
        try {
            const plotCanvas = await getPlotCanvas(bookId, versionId);
            if (!plotCanvas) return;
            const nodes = [...(plotCanvas.nodes || [])];
            // find scene linked to chapter
            const scene = nodes.find((n: any) => n.type === 'scene' && n.data?.data?.chapter === chapterId) as any;
            if (!scene?.data?.parentId) return;
            const chapterNodeId = scene.data.parentId;
            const chapterNodeIdx = nodes.findIndex((n: any) => n.id === chapterNodeId && n.type === 'chapter');
            if (chapterNodeIdx < 0) return;
            const chapterNode = { ...(nodes[chapterNodeIdx] as any) };
            const currentActId = chapterNode.data?.parentId;
            if (!currentActId) return;

            // If moving within same act and targetIndex provided: reorder childIds only
            if (currentActId === targetActId) {
                const act = nodes.find((n: any) => n.id === currentActId && n.type === 'act') as any;
                if (!act) return;
                const childIds: string[] = [...(act.data?.childIds || [])];
                const curIdx = childIds.indexOf(chapterNodeId);
                if (curIdx >= 0) childIds.splice(curIdx, 1);
                // Adjust target index if moving downward within the same list (after removal target shifts left by 1)
                let desiredIndex = targetIndex ?? childIds.length;
                if (typeof targetIndex === 'number' && curIdx >= 0 && targetIndex > curIdx) {
                    desiredIndex = targetIndex - 1;
                }
                const insertAt = Math.max(0, Math.min(desiredIndex, childIds.length));
                childIds.splice(insertAt, 0, chapterNodeId);
                const nextNodes = nodes.map((n: any) => n.id === act.id ? { ...act, data: { ...(act.data || {}), childIds } } : n);
                // Reset positions for act subtree to let auto-layout place children
                const resetIdsWithin = new Set<string>([act.id]);
                const enqueueChildrenWithin = (parentId: string) => {
                    const kids = nextNodes.filter((n: any) => n.data?.parentId === parentId);
                    for (const k of kids) {
                        if (!resetIdsWithin.has(k.id)) {
                            resetIdsWithin.add(k.id);
                            enqueueChildrenWithin(k.id);
                        }
                    }
                };
                enqueueChildrenWithin(act.id);
                const nodesWithResetWithin = nextNodes.map((n: any) => resetIdsWithin.has(n.id)
                    ? ({ ...n, position: { x: 0, y: 0 }, data: { ...(n.data || {}), position: { x: 0, y: 0 } } })
                    : n);
                await updatePlotCanvas(bookId, versionId, { nodes: nodesWithResetWithin, edges: plotCanvas.edges || [] });
                return;
            }

            // Moving across acts: remove from old act, add to new act, update chapterNode parentId
            const sourceAct = nodes.find((n: any) => n.id === currentActId && n.type === 'act') as any;
            const targetAct = nodes.find((n: any) => n.id === targetActId && n.type === 'act') as any;
            if (!sourceAct || !targetAct) return;
            const sourceChildIds: string[] = [...(sourceAct.data?.childIds || [])].filter((id) => id !== chapterNodeId);
            const targetChildIds: string[] = [...(targetAct.data?.childIds || [])];
            const insertAt = Math.max(0, Math.min(targetIndex ?? targetChildIds.length, targetChildIds.length));
            targetChildIds.splice(insertAt, 0, chapterNodeId);
            const updatedChapterNode = { ...chapterNode, data: { ...(chapterNode.data || {}), parentId: targetActId } };
            const nextNodes = nodes.map((n: any) => {
                if (n.id === sourceAct.id) return { ...sourceAct, data: { ...(sourceAct.data || {}), childIds: sourceChildIds } };
                if (n.id === targetAct.id) return { ...targetAct, data: { ...(targetAct.data || {}), childIds: targetChildIds } };
                if (n.id === updatedChapterNode.id) return updatedChapterNode;
                return n;
            });
            await updatePlotCanvas(bookId, versionId, { nodes: nextNodes, edges: plotCanvas.edges || [] });
            // Reset positions for both source and target act subtrees to allow clean reflow
            const resetIdsCross = new Set<string>([sourceAct.id, targetAct.id]);
            const enqueueChildrenCross = (parentId: string) => {
                const kids = nextNodes.filter((n: any) => n.data?.parentId === parentId);
                for (const k of kids) {
                    if (!resetIdsCross.has(k.id)) {
                        resetIdsCross.add(k.id);
                        enqueueChildrenCross(k.id);
                    }
                }
            };
            enqueueChildrenCross(sourceAct.id);
            enqueueChildrenCross(targetAct.id);
            const nodesWithResetCross = nextNodes.map((n: any) => resetIdsCross.has(n.id)
                ? ({ ...n, position: { x: 0, y: 0 }, data: { ...(n.data || {}), position: { x: 0, y: 0 } } })
                : n);
            await updatePlotCanvas(bookId, versionId, { nodes: nodesWithResetCross, edges: plotCanvas.edges || [] });
        } catch (err) {
            console.error('Failed to move chapter node between acts', err);
        }
    };

    // Sort chapters from props by position
    const allChapters = [...chapters].sort((a, b) => a.position - b.position);

    // Fetch narrative nodes for acts
    useEffect(() => {
        const fetchActData = async () => {
            if (!bookId || !versionId) return;
            
            try {
                // Get narrative flow nodes to resolve act titles
                const plotCanvas = await getPlotCanvas(bookId, versionId);
                console.log('Debug - plotCanvas:', plotCanvas);
                
                const nodesAll = plotCanvas?.nodes || [];
                const acts = nodesAll.filter((node: any) => node.type === 'act');
                console.log('Debug - actNodes:', acts);
                setActNodes(acts);
                setNarrativeNodes(nodesAll);
            } catch (error) {
                console.error('Error fetching act data:', error);
            }
        };

        fetchActData();
    }, [bookId, versionId]);

    // Listen for act CRUD events to refresh act data and normalize outline order
    useEffect(() => {
        const handleActRefresh = () => {
            // Refresh act data when acts are created/updated/deleted
            if (bookId && versionId) {
                const refreshActData = async () => {
                    try {
                        const plotCanvas = await getPlotCanvas(bookId, versionId);
                        const nodesAll = plotCanvas?.nodes || [];
                        // Normalize outline.childIds to include all current acts
                        const outlineIdx = nodesAll.findIndex((n: any) => n.type === 'outline');
                        if (outlineIdx >= 0) {
                            const outline = { ...nodesAll[outlineIdx] } as any;
                            const actIds = nodesAll.filter((n: any) => n.type === 'act').map((a: any) => a.id);
                            let childIds: string[] = Array.isArray(outline.data?.childIds) ? [...outline.data.childIds] : [];
                            const before = JSON.stringify(childIds);
                            // Add any missing acts to the end; remove stray ids
                            childIds = [...childIds.filter(id => actIds.includes(id)), ...actIds.filter(id => !childIds.includes(id))];
                            const after = JSON.stringify(childIds);
                            if (before !== after) {
                                const updated = nodesAll.map((n: any) => n.type === 'outline' ? ({ ...outline, data: { ...(outline.data || {}), childIds } }) : n);
                                await updatePlotCanvas(bookId, versionId, { nodes: updated, edges: plotCanvas?.edges || [] });
                                // Also let listeners re-layout
                                window.dispatchEvent(new CustomEvent('actUpdated'));
                                window.dispatchEvent(new CustomEvent('plotAutoArrange'));
                            }
                        }
                        const acts = nodesAll.filter((node: any) => node.type === 'act');
                        setActNodes(acts);
                        setNarrativeNodes(nodesAll);
                    } catch (error) {
                        console.error('Error refreshing act data:', error);
                    }
                };
                refreshActData();
            }
        };

        // Listen for custom events from act CRUD operations
        window.addEventListener('chapterCreated', handleActRefresh);
        window.addEventListener('chapterDeleted', handleActRefresh);
        window.addEventListener('chapterUpdated', handleActRefresh);
    window.addEventListener('actCreated', handleActRefresh);
    window.addEventListener('actDeleted', handleActRefresh);
    window.addEventListener('actUpdated', handleActRefresh);

        return () => {
            window.removeEventListener('chapterCreated', handleActRefresh);
            window.removeEventListener('chapterDeleted', handleActRefresh);
            window.removeEventListener('chapterUpdated', handleActRefresh);
            window.removeEventListener('actCreated', handleActRefresh);
            window.removeEventListener('actDeleted', handleActRefresh);
            window.removeEventListener('actUpdated', handleActRefresh);
        };
    }, [bookId, versionId]); // Only depend on stable IDs
    // Group chapters by Act using narrative nodes (source of truth):
    // scene.data.data.chapter -> chapterNode (parentId) -> actNode (parentId)
    const groupedChapters = useMemo(() => {
        const groups: Record<string, { actNode: any; chapters: Chapter[] }> = {};

        // Prepare fast lookup maps
        const sceneByChapterId = new Map<string, any>();
        const chapterNodeById = new Map<string, any>();
        const actById = new Map<string, any>();
        const actChildOrder = new Map<string, string[]>(); // actId -> chapterNodeIds order

        narrativeNodes.forEach((n: any) => {
            if (n.type === 'scene' && n?.data?.data?.chapter) {
                sceneByChapterId.set(n.data.data.chapter, n);
            } else if (n.type === 'chapter') {
                chapterNodeById.set(n.id, n);
            } else if (n.type === 'act') {
                actById.set(n.id, n);
                const ids = (n.data?.childIds || []).filter((cid: string) => cid);
                actChildOrder.set(n.id, ids);
            }
        });

        // Initialize groups for all acts; prefer outline.childIds order for iteration stability
        // Build ordered act list
        const outline = narrativeNodes.find((n: any) => n.type === 'outline');
        const outlineOrder: string[] = Array.isArray(outline?.data?.childIds) ? outline!.data!.childIds! : [];
        const actsOrdered: any[] = (outlineOrder.length > 0
            ? outlineOrder.map(id => actNodes.find(a => a.id === id)).filter(Boolean)
            : actNodes
        ) as any[];
        actsOrdered.forEach((actNode: any) => {
            groups[actNode.id] = { actNode, chapters: [] };
        });

        // Assign chapters to the act that contains their chapter node
        for (const ch of allChapters) {
            const scene = sceneByChapterId.get(ch.id);
            const chapterNodeId = scene?.data?.parentId;
            const chNode = chapterNodeId ? chapterNodeById.get(chapterNodeId) : undefined;
            const actId = chNode?.data?.parentId;
            if (actId && groups[actId]) {
                groups[actId].chapters.push(ch);
            } else if (actNodes.length > 0) {
                // Fallback to first act if linkage missing
                const firstActId = actNodes[0].id;
                groups[firstActId]?.chapters.push(ch);
            }
        }

        // Sort chapters within each act by the order of act.data.childIds (chapter node IDs)
        Object.entries(groups).forEach(([aid, group]) => {
            const order = actChildOrder.get(aid) || [];
            const indexOfChapter = (chapterId: string) => {
                const scene = sceneByChapterId.get(chapterId);
                const chNodeId = scene?.data?.parentId;
                const idx = chNodeId ? order.indexOf(chNodeId) : -1;
                return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
            };
            group.chapters.sort((a, b) => indexOfChapter(a.id) - indexOfChapter(b.id));
        });

    console.log('Debug - groupedChapters (from narrative nodes):', groups);
        return groups;
    }, [allChapters, actNodes, narrativeNodes]);

    // Compute insert index within an act based on pointer Y position
    const computeInsertIndex = (actId: string, clientY: number): number => {
        const group = groupedChapters[actId];
        if (!group) return 0;
        // Default to end of list
        let index = group.chapters.length;
        for (let i = 0; i < group.chapters.length; i++) {
            const ch = group.chapters[i];
            const el = chapterRefs.current[ch.id];
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (clientY < mid) { index = i; break; }
        }
        return index;
    };

    // Reorder act within the outline's childIds (no drag), delta = -1 up, +1 down
    const moveActInOutline = async (actId: string, delta: number) => {
        if (!bookId || !versionId) return;
        try {
            setIsSavingOrder(true);
            const plotCanvas = await getPlotCanvas(bookId, versionId);
            if (!plotCanvas) return;
            const nodes = [...(plotCanvas.nodes || [])];
            const outlineIdx = nodes.findIndex((n: any) => n.type === 'outline');
            if (outlineIdx === -1) return;
            const outline = { ...nodes[outlineIdx] } as any;
            const allActIds: string[] = nodes.filter((n: any) => n.type === 'act').map((a: any) => a.id);
            // Seed or normalize outline.childIds to include all acts in current array order
            let childIds: string[] = Array.isArray(outline.data?.childIds) ? [...outline.data.childIds] : [];
            if (childIds.length === 0) {
                childIds = [...allActIds];
            } else {
                // Ensure any new/missing acts are appended preserving their current order
                const missing = allActIds.filter(id => !childIds.includes(id));
                if (missing.length) childIds = [...childIds, ...missing];
                // Remove any stray ids not present anymore
                childIds = childIds.filter(id => allActIds.includes(id));
            }
            console.debug('[EditorHeader] moveActInOutline before', { actId, delta, childIds: [...childIds] });
            const index = childIds.indexOf(actId);
            if (index === -1) return;
            const newIndex = Math.max(0, Math.min(childIds.length - 1, index + delta));
            if (newIndex === index) return;
            childIds.splice(index, 1);
            childIds.splice(newIndex, 0, actId);
            outline.data = { ...outline.data, childIds };
            // Reset positions for all acts and their descendants so auto-layout can place them per new order
            const resetIds = new Set<string>(childIds);
            const enqueueChildren = (parentId: string) => {
                const kids = nodes.filter((n: any) => n.data?.parentId === parentId);
                for (const k of kids) {
                    if (!resetIds.has(k.id)) {
                        resetIds.add(k.id);
                        enqueueChildren(k.id);
                    }
                }
            };
            childIds.forEach(enqueueChildren);
            const nodesReset = nodes.map((n: any) => {
                if (n.type === 'outline') return (n.id === outline.id ? outline : n);
                if (resetIds.has(n.id)) {
                    return { ...n, position: { x: 0, y: 0 }, data: { ...(n.data || {}), position: { x: 0, y: 0 } } };
                }
                return n;
            });
            console.debug('[EditorHeader] moveActInOutline after', { childIds: [...childIds] });
            await updatePlotCanvas(bookId, versionId, { nodes: nodesReset, edges: plotCanvas.edges || [] });
            window.dispatchEvent(new CustomEvent('actUpdated'));
            // Ask PlotArcs board (if open) to auto-arrange for clarity
            window.dispatchEvent(new CustomEvent('plotAutoArrange'));
        } catch (e) {
            console.error('Failed to move act in outline', e);
        } finally {
            setIsSavingOrder(false);
        }
    };

    // Pointer-based fallback DnD for chapters (works even if HTML5 DnD is blocked)
    useEffect(() => {
        const onPointerMove = (e: PointerEvent) => {
            const pd = pointerDragRef.current;
            if (!pd) return;
            const dx = Math.abs(e.clientX - pd.startX);
            const dy = Math.abs(e.clientY - pd.startY);
            if (!pd.started && (dx > 6 || dy > 6)) {
                pd.started = true;
                isDraggingRef.current = true;
                setDraggingChapter({ id: pd.chapterId, sourceActId: pd.sourceActId });
                dlog('pointer DnD start', { chapterId: pd.chapterId });
            }
            if (pd.started) {
                e.preventDefault();
                // Hit test act under cursor
                const y = e.clientY;
                let foundAct: string | null = null;
                for (const [id, el] of Object.entries(actRefs.current)) {
                    if (!el) continue;
                    const rect = el.getBoundingClientRect();
                    if (y >= rect.top && y <= rect.bottom) { foundAct = id; break; }
                }
                if (foundAct) setHoverActId(foundAct);
                // Hit test chapter under cursor
                let foundChapter: string | null = null;
                for (const [id, el] of Object.entries(chapterRefs.current)) {
                    if (!el) continue;
                    const rect = el.getBoundingClientRect();
                    if (y >= rect.top && y <= rect.bottom) { foundChapter = id; break; }
                }
                if (foundChapter) setHoverChapterId(foundChapter);
                // Update insertion target for visual line and consistent drop
                const actForIndex = foundAct || hoverActId || Object.keys(groupedChapters)[0];
                if (actForIndex) {
                    const idx = computeInsertIndex(actForIndex, y);
                    setInsertTarget({ actId: actForIndex, index: idx });
                }
                dlog('pointer move', { y, foundAct, foundChapter });
            }
        };
        const onPointerUp = async (e: PointerEvent) => {
            const pd = pointerDragRef.current;
            if (!pd) return;
            const wasActive = pd.started;
            pointerDragRef.current = null;
            if (!wasActive) return;
            e.preventDefault();
            // Determine drop targets
            const y = e.clientY;
            let targetAct: string | null = null;
            for (const [id, el] of Object.entries(actRefs.current)) {
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                if (y >= rect.top && y <= rect.bottom) { targetAct = id; break; }
            }
            // We rely on insertTarget for index; no need to resolve a specific chapter id here
            const targetActId = targetAct || hoverActId || Object.keys(groupedChapters)[0];
            const actGroup = targetActId ? groupedChapters[targetActId] : undefined;
            // Use insertTarget if present, else compute based on pointer
            let targetPosition = insertTarget && insertTarget.actId === targetActId
                ? insertTarget.index + 1
                : (actGroup ? computeInsertIndex(targetActId!, y) + 1 : 1);
            dlog('pointer drop', { chapterId: pd.chapterId, targetActId, targetPosition });
            setHoverActId(null);
            setHoverChapterId(null);
            setInsertTarget(null);
            isDraggingRef.current = false;
            if (targetActId) {
                try {
                    setIsSavingOrder(true);
                    // Update narrative nodes first
                    await moveChapterNodeBetweenActs(pd.chapterId, targetActId, Math.max(0, targetPosition - 1));
                    // Then any minimal chapter bookkeeping
                    if (onReorderChapter) {
                        await onReorderChapter(pd.chapterId, targetPosition, targetActId);
                    }
                    window.dispatchEvent(new CustomEvent('chapterUpdated'));
                    window.dispatchEvent(new CustomEvent('plotAutoArrange'));
                } catch (err) {
                    console.error('Pointer DnD reorder failed', err);
                } finally {
                    setIsSavingOrder(false);
                    setDraggingChapter(null);
                }
            }
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [groupedChapters, onReorderChapter, hoverActId]);

    // Global debug: while dropdown is open and dragging, make window a permissive drop zone
    useEffect(() => {
        if (!isOpen) return;
        const onWindowDragOver = (e: DragEvent) => {
            if (draggingChapter || draggingActId) {
                e.preventDefault();
                dlog('window dragover', readDT(e.dataTransfer as any));
            }
        };
        const onWindowDrop = (e: DragEvent) => {
            if (draggingChapter || draggingActId) {
                e.preventDefault();
                dlog('window drop', readDT(e.dataTransfer as any));
            }
        };
        const onDocumentDragOver = (e: DragEvent) => {
            if (draggingChapter || draggingActId) {
                e.preventDefault();
                dlog('document dragover', readDT(e.dataTransfer as any));
            }
        };
        const onDocumentDrop = (e: DragEvent) => {
            if (draggingChapter || draggingActId) {
                e.preventDefault();
                dlog('document drop', readDT(e.dataTransfer as any));
            }
        };
        window.addEventListener('dragover', onWindowDragOver, { capture: true } as any);
        window.addEventListener('drop', onWindowDrop, { capture: true } as any);
        document.addEventListener('dragover', onDocumentDragOver, { capture: true } as any);
        document.addEventListener('drop', onDocumentDrop, { capture: true } as any);
        return () => {
            window.removeEventListener('dragover', onWindowDragOver, { capture: true } as any);
            window.removeEventListener('drop', onWindowDrop, { capture: true } as any);
            document.removeEventListener('dragover', onDocumentDragOver, { capture: true } as any);
            document.removeEventListener('drop', onDocumentDrop, { capture: true } as any);
        };
    }, [isOpen, draggingChapter, draggingActId]);

    // Calculate completion percentage based on chapters with content
    const chapterCompletion = useMemo(() => {
        if (allChapters.length === 0) return 10;
        const chaptersWithContent = allChapters.filter(chapter => 
            chapter.content?.content && chapter.content.content.length > 0
        );
        return Math.max(10, Math.round((chaptersWithContent.length / allChapters.length) * 20));
    }, [allChapters]);

    // Navigation data for current chapter
    const currentChapterIndex = allChapters.findIndex(ch => ch.id === currentChapter?.id);
    const totalChapters = allChapters.length;

    const handleCreateChapterInAct = async (actKey: string) => {
        if (onCreateChapter) {
            // Check if we have any acts, if not create one
            if (actNodes.length === 0) {
                // Create default act firsthandleChapterChange
                if (onCreateAct) {
                    try {
                        await onCreateAct('Act 1');
                        // Dispatch event to refresh data
                        window.dispatchEvent(new CustomEvent('actCreated'));
                        // Wait a bit for the act to be created, then proceed with chapter creation
                        setTimeout(() => {
                            setSelectedActForNewChapter(actKey);
                            setShowCreateChapterModal(true);
                        }, 100);
                        return;
                    } catch (error) {
                        console.error('Failed to create default act:', error);
                    }
                }
            }
            
            // Use the modal instead of prompt
            setSelectedActForNewChapter(actKey);
            setShowCreateChapterModal(true);
        }
    };

    const handleCreateNewAct = async () => {
        setShowCreateActModal(true);
    };

    const handleOpenActSettings = (actId: string) => {
        setSelectedActForSettings(actId);
        setShowActSettingsModal(true);
    };

    const handleUpdateActDetails = async (
        actId: string,
        updates: { title?: string; description?: string }
    ) => {
        if (!bookId || !versionId) return;
        try {
            const plotCanvas = await getPlotCanvas(bookId, versionId);
            if (!plotCanvas) return;
            const nodes = [...(plotCanvas.nodes || [])];
            const idx = nodes.findIndex((n: any) => n.id === actId);
            if (idx === -1) return;
            const node = { ...nodes[idx] } as any;
            node.data = { ...(node.data || {}) };
            // Support both data.title and data.data.title shapes
            if (updates.title !== undefined) {
                (node.data as any).title = updates.title;
                if (node.data.data) {
                    node.data.data = { ...(node.data.data || {}), title: updates.title };
                }
            }
            if (updates.description !== undefined) {
                if (node.data.data) {
                    node.data.data = { ...(node.data.data || {}), description: updates.description };
                } else {
                    (node.data as any).description = updates.description;
                }
            }
            nodes[idx] = node;
            await updatePlotCanvas(bookId, versionId, { nodes, edges: plotCanvas.edges || [] });
            window.dispatchEvent(new CustomEvent('actUpdated'));
        } catch (e) {
            console.error('Failed to update act details', e);
        }
    };

    const reorderActs = async (sourceActId: string, targetActId: string) => {
        if (!bookId || !versionId) return;
        try {
            const plotCanvas = await getPlotCanvas(bookId, versionId);
            if (!plotCanvas) return;
            const nodes = [...(plotCanvas.nodes || [])];
            const acts = nodes.filter((n: any) => n.type === 'act');
            const nonActs = nodes.filter((n: any) => n.type !== 'act');
            const outlineIdx = nodes.findIndex((n: any) => n.type === 'outline');
            const outline = outlineIdx >= 0 ? { ...nodes[outlineIdx] } : null;

            const actOrder = acts.map((a: any) => a.id);
            const fromIdx = actOrder.indexOf(sourceActId);
            const toIdx = actOrder.indexOf(targetActId);
            if (fromIdx === -1 || toIdx === -1) return;
            // Move source to the target index (before target)
            actOrder.splice(toIdx, 0, actOrder.splice(fromIdx, 1)[0]);

            // Update outline.childIds to match new order (if outline exists)
            let updatedOutline = outline;
            if (updatedOutline) {
                // Set outline childIds to the full new order of acts
                updatedOutline = { ...updatedOutline, data: { ...(updatedOutline as any).data, childIds: [...actOrder] } } as any;
            }

            // Recompose nodes array with ordered acts and updated outline
            const orderedActs = actOrder.map((id, i) => {
                const base = acts.find((a: any) => a.id === id)!;
                return { ...base, position: { ...(base.position || {}), y: 200 + i * 150 } };
            });
            const nonActsWithOutline = nonActs.map((n: any) => (updatedOutline && n.type === 'outline' ? updatedOutline : n));
            const updatedNodes = [...nonActsWithOutline, ...orderedActs];
            await updatePlotCanvas(bookId, versionId, { nodes: updatedNodes, edges: plotCanvas.edges || [] });
            window.dispatchEvent(new CustomEvent('actUpdated'));
            window.dispatchEvent(new CustomEvent('plotAutoArrange'));
        } catch (e) {
            console.error('Failed to reorder acts', e);
        }
    };

    const handleReorderChapter = async (chapter: Chapter) => {
        if (!onReorderChapter) return;
        
        const options = [
            'Move to Top',
            'Move Up',
            'Move Down', 
            'Move to Bottom',
            'Move to Different Act'
        ];
        
        const choice = prompt(`Choose reorder option for "${chapter.title}":\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEnter number (1-${options.length}):`);
        const choiceNum = parseInt(choice || '');
        
        if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > options.length) return;
        
        const currentPosition = chapter.position;
        const totalChapters = allChapters.length;
        
        try {
            switch (choiceNum) {
                case 1: // Move to Top
                    await onReorderChapter(chapter.id, 1);
                    break;
                case 2: // Move Up
                    if (currentPosition > 1) {
                        await onReorderChapter(chapter.id, currentPosition - 1);
                    }
                    break;
                case 3: // Move Down
                    if (currentPosition < totalChapters) {
                        await onReorderChapter(chapter.id, currentPosition + 1);
                    }
                    break;
                case 4: // Move to Bottom
                    await onReorderChapter(chapter.id, totalChapters);
                    break;
                case 5: // Move to Different Act
                    const actNames = actNodes.map((act, index) => `${index + 1}. ${act.data?.title || `Act ${index + 1}`}`).join('\n');
                    const actChoice = prompt(`Choose target act:\n${actNames}\n\nEnter number:`);
                    const actIndex = parseInt(actChoice || '') - 1;
                    if (actIndex >= 0 && actIndex < actNodes.length) {
                        await onReorderChapter(chapter.id, currentPosition, actNodes[actIndex].id);
                    }
                    break;
            }
            // Dispatch event to refresh
            window.dispatchEvent(new CustomEvent('chapterUpdated'));
        } catch (error) {
            console.error('Failed to reorder chapter:', error);
        }
    };

    const handleDeleteAct = async (actId: string) => {
        const actGroup = groupedChapters[actId];
        const actChapters = actGroup?.chapters || [];
        if (actChapters.length > 0) {
            const confirmed = confirm(`This act contains ${actChapters.length} chapter(s). They will be moved to the next act. Continue?`);
            if (!confirmed) return;
        } else {
            const confirmed = confirm('Are you sure you want to delete this act?');
            if (!confirmed) return;
        }
        
        if (onDeleteAct) {
            await onDeleteAct(actId);
            // Dispatch event to refresh the dropdown
            window.dispatchEvent(new CustomEvent('actDeleted'));
        }
    };

    const handleOpenChapterSettings = (chapter: Chapter) => {
        setSelectedChapterForSettings(chapter);
        setChapterSettingsOpen(true);
    };

    const handleUpdateChapterFromModal = async (chapterId: string, updates: Partial<Chapter>) => {
        if (onUpdateChapter) {
            await onUpdateChapter(chapterId, updates);
            // Dispatch event to refresh the dropdown
            window.dispatchEvent(new CustomEvent('chapterUpdated'));
            if (updates.title) {
                await syncChapterTitleToPlotCanvas(chapterId, updates.title);
            }
        }
        setChapterSettingsOpen(false);
        setSelectedChapterForSettings(null);
    };

    const handleDeleteChapter = async (chapter: Chapter) => {
        const confirmed = confirm(`Are you sure you want to delete "${chapter.title}"?`);
        if (confirmed && onDeleteChapter) {
            // Check if this is the current chapter
            const isCurrentChapter = currentChapter?.id === chapter.id;
            
            // Find next chapter to navigate to
            let nextChapter: Chapter | null = null;
            if (isCurrentChapter) {
                const currentIndex = allChapters.findIndex(ch => ch.id === chapter.id);
                // Try next chapter first, then previous, then null
                if (currentIndex < allChapters.length - 1) {
                    nextChapter = allChapters[currentIndex + 1];
                } else if (currentIndex > 0) {
                    nextChapter = allChapters[currentIndex - 1];
                }
            }
            
            await onDeleteChapter(chapter.id);
            
            // Dispatch custom event to refresh the dropdown
            window.dispatchEvent(new CustomEvent('chapterDeleted'));
            
            // Navigate to next chapter or back to book state
            if (isCurrentChapter && onNavigateToChapter) {
                if (nextChapter) {
                    onNavigateToChapter(nextChapter.id);
                } else {
                    // Navigate to fresh book state (no chapter selected)
                    onNavigateToChapter('');
                }
            }
        }
    };

    // Sync chapter title to its corresponding chapter narrative node (via the scene -> chapter link)
    const syncChapterTitleToPlotCanvas = async (chapterId: string, title: string) => {
        if (!bookId || !versionId) return;
        try {
            const plotCanvas = await getPlotCanvas(bookId, versionId);
            if (!plotCanvas) return;
            const nodes = [...(plotCanvas.nodes || [])];
            // Find scene node that links to this chapter
            const scene = nodes.find((n: any) => n.type === 'scene' && (n.data?.data?.chapter === chapterId));
            if (!scene || !scene.data?.parentId) return;
            const chapterNodeId = scene.data.parentId;
            const idx = nodes.findIndex((n: any) => n.id === chapterNodeId && n.type === 'chapter');
            if (idx === -1) return;
            const chNode = { ...nodes[idx] } as any;
            chNode.data = { ...(chNode.data || {}) };
            // Support both data.title and nested data.data.title
            (chNode.data as any).title = title;
            if (chNode.data.data) {
                chNode.data.data = { ...(chNode.data.data || {}), title };
            }
            nodes[idx] = chNode;
            await updatePlotCanvas(bookId, versionId, { nodes, edges: plotCanvas.edges || [] });
            window.dispatchEvent(new CustomEvent('actUpdated'));
        } catch (e) {
            console.error('Failed to sync chapter title to plot canvas', e);
        }
    };

    const getCurrentChapterDisplay = () => {
        // Always show the stored title; do not auto-number untitled chapters
        if (currentChapter) {
            return currentChapter.title || 'Untitled Chapter';
        }

        // Show first chapter title if available
        const firstChapter = allChapters[0];
        if (firstChapter) {
            return firstChapter.title || 'Untitled Chapter';
        }

        return 'No chapters yet';
    };

    return (
    <div className="relative group w-full" ref={triggerRef}>
            <div className="relative w-full h-10 bg-gradient-to-br from-black to-gray-800 dark:from-gray-50 dark:to-slate-200 rounded-full overflow-hidden border border-gray-700 dark:border-gray-300 shadow-inner">
                 <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-300 via-teal-400 to-emerald-500 bg-[length:200%_200%] animate-shimmer-effect"
                    initial={{ width: '0%' }}
                    animate={{ width: `${chapterCompletion}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                  />
                <div className="absolute inset-0 flex items-center justify-between px-2 text-white dark:text-black">
                    <motion.button 
                        onClick={onOpenSettings} 
                        className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors z-10"
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                        <CogIcon className="h-5 w-5" />
                    </motion.button>

                    {/* Enhanced Chapter Navigation */}
                    <div className="flex-grow flex items-center justify-center gap-3 min-w-0">
                        {/* Previous Chapter Button */}
                       

                      

                      

                        {/* Current Chapter Title and Counter */}
                        <div className="flex items-center gap-2 min-w-0">
                            <div onClick={() => setIsOpen(!isOpen)} className="flex items-center cursor-pointer min-w-0">
                                <p className="font-bold truncate text-sm leading-tight text-shadow-sm">
                                    <span className="mr-2">{book.title}:</span>
                                    <span className="font-normal opacity-80">
                                        {getCurrentChapterDisplay()}
                                    </span>
                                </p>
                                {isChapterLoading && (
                                    <ArrowPathIcon className="w-3 h-3 ml-2 animate-spin text-white/60 dark:text-black/60" />
                                )}
                            </div>
                            <div className="text-xs text-white/60 dark:text-black/60 whitespace-nowrap">
                                {currentChapterIndex >= 0 ? currentChapterIndex + 1 : 0} / {totalChapters}
                            </div>
                        </div>
                    </div>

                    <motion.button 
                        onClick={() => {
                            onOpenTypographySettings();
                        }}
                        className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors z-10"
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        title="Typography & Formatting Settings"
                    >
                        <Bars3BottomLeftIcon className="h-5 w-5" />
                    </motion.button>
                    <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors z-10">
                        <ChevronDownIcon className="h-5 w-5 flex-shrink-0" />
                    </button>
                </div>
            </div>
                        <AnimatePresence>
                        {isOpen && (
                            <>
                                {/* Page-level saving overlay for reorders */}
                                <AnimatePresence>
                                    {isSavingOrder && (
                                        <motion.div
                                            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 dark:bg-black/30"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-black/60 dark:bg-white/80 text-white dark:text-black shadow-lg">
                                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">Saving order…</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full -translate-x-1/2 mt-2 w-[30rem] bg-gradient-to-br from-black to-gray-800 dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-lg p-2 z-50 border border-gray-700/50 dark:border-gray-200/50 max-h-[36rem] overflow-y-auto overflow-x-hidden overscroll-contain no-scrollbar"
                        onDragEnter={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {}; dlog('container dragenter', readDT(e.dataTransfer)); }}
                        onDragOverCapture={(e) => { e.preventDefault(); dlog('container dragover CAPTURE', readDT((e as any).dataTransfer)); }}
                        onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {}; dlog('container dragover', readDT(e.dataTransfer)); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            try { e.dataTransfer.dropEffect = 'move'; } catch {}
                            dlog('container drop', readDT(e.dataTransfer));
                            // Fallback: if dropping over container, route to the last hovered act if any
                            const targetActId = hoverActId || Object.keys(groupedChapters)[0];
                            const actGroup = groupedChapters[targetActId];
                            dlog('container drop resolved target', { hoverActId, keys: Object.keys(groupedChapters), targetActId });
                            if (targetActId && actGroup) {
                                handleActDrop(e as any, targetActId, actGroup as any);
                            }
                        }}
                                 >
                    {(draggingActId || draggingChapter) && (
                        <div
                            className="absolute inset-0 z-[60]"
                            onDragOver={(e) => {
                                e.preventDefault();
                                const y = e.clientY;
                                let found: string | null = null;
                                for (const [id, el] of Object.entries(actRefs.current)) {
                                    if (!el) continue;
                                    const rect = el.getBoundingClientRect();
                                    if (y >= rect.top && y <= rect.bottom) { found = id; break; }
                                }
                                if (found) {
                                    setHoverActId(found);
                                    try { e.dataTransfer.dropEffect = 'move'; } catch {}
                                }
                                dlog('panel overlay dragover', { y, found });
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                try { e.dataTransfer.dropEffect = 'move'; } catch {}
                                const y = e.clientY;
                                let found: string | null = null;
                                for (const [id, el] of Object.entries(actRefs.current)) {
                                    if (!el) continue;
                                    const rect = el.getBoundingClientRect();
                                    if (y >= rect.top && y <= rect.bottom) { found = id; break; }
                                }
                                const targetId = found || hoverActId || Object.keys(groupedChapters)[0];
                                const actGroup = targetId ? groupedChapters[targetId] : undefined;
                                dlog('panel overlay drop', { y, targetId });
                                if (targetId && actGroup) {
                                    handleActDrop(e, targetId, actGroup as any);
                                }
                                setHoverActId(null);
                            }}
                        />
                    )}
                     {Object.entries(groupedChapters).length > 0 ? (
                                 Object.entries(groupedChapters).map(([actId, actGroup], index) => (
                                     <motion.div key={actId} layout ref={(el) => { actRefs.current[actId] = el; }} className={`relative mb-1 rounded select-none w-full ${hoverActId === actId ? 'ring-1 ring-blue-400/60' : ''}`}
                                 onDragEnter={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {}; setHoverActId(actId); dlog('act dragenter', { actId, dt: readDT(e.dataTransfer) }); }}
                                 onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {}; setHoverActId(actId); const idx = computeInsertIndex(actId, e.clientY); setInsertTarget({ actId, index: idx }); dlog('act dragover', { actId, insertIndex: idx, dt: readDT(e.dataTransfer) }); }}
                                 onDragLeave={() => { dlog('act dragleave', { actId }); setHoverActId(null); }}
                                 onDrop={(e) => { dlog('act drop', { actId, dt: readDT(e.dataTransfer) }); handleActDrop(e, actId, actGroup as any); }}
                            >
                                {(draggingActId || draggingChapter) && (
                                    <div
                                        className="absolute inset-0 z-10 w-4"
                                        onDragEnter={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {}; setHoverActId(actId); dlog('act overlay dragenter', { actId, dt: readDT(e.dataTransfer) }); }}
                                        onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {}; setHoverActId(actId); const idx = computeInsertIndex(actId, e.clientY); setInsertTarget({ actId, index: idx }); dlog('act overlay dragover', { actId, insertIndex: idx, dt: readDT(e.dataTransfer) }); }}
                                        onDrop={(e) => { dlog('act overlay drop', { actId, dt: readDT(e.dataTransfer) }); handleActDrop(e, actId, actGroup as any); }}
                                    />
                                )}
                                <div
                                    className="flex items-center px-2 py-1 group/act"
                                    onDragEnterCapture={(e) => { dlog('act header dragenter CAPTURE', { actId, dt: readDT((e as any).dataTransfer) }); }}
                                    onDragEnter={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {}; setHoverActId(actId); dlog('act header dragenter', { actId, dt: readDT(e.dataTransfer) }); }}
                                    onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {}; setHoverActId(actId); dlog('act header dragover', { actId, dt: readDT(e.dataTransfer) }); }}
                                    onDrop={(e) => { dlog('act header drop', { actId, dt: readDT(e.dataTransfer) }); handleActDrop(e, actId, actGroup as any); }}
                                >
                                   <div className="flex items-center gap-2 flex-1">
                                        <span
                                            title="Drag act"
                                            className="inline-flex"
                                            draggable
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                isDraggingRef.current = true;
                                                setDraggingActId(actId);
                                                try {
                                                    e.dataTransfer.effectAllowed = 'all';
                                                    e.dataTransfer.dropEffect = 'move';
                                                    const payload = JSON.stringify({ type: 'act', actId });
                                                    e.dataTransfer.setData('text/plain', payload);
                                                    e.dataTransfer.setData('text', payload);
                                                    e.dataTransfer.setData('application/json', payload);
                                                    const img = getDragImage();
                                                    e.dataTransfer.setDragImage(img, 0, 0);
                                                } catch {}
                                                dlog('act dragstart', { actId, dt: readDT(e.dataTransfer) });
                                            }}
                                            onDragEnd={(e) => { e.stopPropagation(); dlog('act dragend', { actId }); setDraggingActId(null); setHoverActId(null); isDraggingRef.current = false; }}
                                        >
                                            <Bars3BottomLeftIcon
                                                className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing"
                                            />
                                        </span>
                                       <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                           {actGroup.actNode.data?.title || actGroup.actNode.data?.data?.title || `Act ${index + 1}`}
                                       </h4>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/act:opacity-100 transition-opacity">
                                        <button
                                            className="p-1 rounded-md hover:bg-white/10 dark:hover:bg-black/10"
                                            title="Move Act Up"
                                            onClick={(e) => { e.stopPropagation(); moveActInOutline(actId, -1); }}
                                            disabled={index === 0}
                                        >
                                            <ChevronUpIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        </button>
                                        <button
                                            className="p-1 rounded-md hover:bg-white/10 dark:hover:bg-black/10"
                                            title="Move Act Down"
                                            onClick={(e) => { e.stopPropagation(); moveActInOutline(actId, 1); }}
                                            disabled={index === Object.keys(groupedChapters).length - 1}
                                        >
                                            <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        </button>
                                        <DropdownMenu 
                                            className="w-56"
                                            portalToBody
                                            align="right"
                                            menuClassName="w-56 rounded-md bg-gradient-to-br from-gray-900 to-black dark:from-slate-100 dark:to-slate-200 shadow-lg ring-1 ring-black/10 dark:ring-white/10 p-1"
                                            trigger={<button className="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:bg-white/10 dark:hover:bg-black/10 hover:text-white dark:hover:text-black"><CogIcon className="w-4 h-4"/></button>}
                                        >
                                            <button 
                                                onClick={() => handleOpenActSettings(actId)}
                                                className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                            >
                                                <CogIcon className="w-4 h-4" />
                                                Edit Act
                                            </button>
                                            <button 
                                                onClick={() => handleCreateChapterInAct(actId)}
                                                className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Add New Chapter
                                            </button>
                                            <button className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">
                                                <DocumentIcon className="w-4 h-4" />
                                                Import Chapter
                                            </button>
                                            <button 
                                                onClick={handleCreateNewAct}
                                                className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Add New Act
                                            </button>
                                            <div className="my-1 h-px bg-gray-600 dark:bg-gray-300/50"></div>
                                            <button 
                                                onClick={() => handleDeleteAct(actId)}
                                                className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-red-400 dark:text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/20"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                Delete Act
                                            </button>
                                        </DropdownMenu>
                                    </div>
                           </div>
                                  {actGroup.chapters.map((chapter: Chapter, chIndex: number) => (
                                        <motion.div 
                                            layout
                                                      key={chapter.id}
                                                      ref={(el) => { chapterRefs.current[chapter.id] = el; }} 
                                         className={`group/chapter flex items-center justify-between pl-8 pr-2 py-1.5 text-sm rounded-md hover:bg-white/10 dark:hover:bg-black/10 cursor-pointer cursor-grab active:cursor-grabbing ${
                                             currentChapter?.id === chapter.id ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'text-gray-300 dark:text-gray-700'
                                         } ${hoverChapterId === chapter.id ? 'ring-1 ring-blue-400/60' : ''}`}
                                         data-chapter-row
                                 style={{ WebkitUserDrag: 'element' } as any}
                                 whileHover={{ x: 2 }}
                                 whileTap={{ scale: 0.995 }}
                                         onClick={(e) => { if (isDraggingRef.current) { dlog('chapter click suppressed due to dragging', { chapterId: chapter.id }); e.preventDefault(); return; } dlog('chapter click', { chapterId: chapter.id }); onNavigateToChapter && onNavigateToChapter(chapter.id); }}
                                                      onPointerDown={(e) => {
                                                          // set up fallback pointer drag; don't block normal click yet
                                                          pointerDragRef.current = { active: true, started: false, startX: e.clientX, startY: e.clientY, chapterId: chapter.id, sourceActId: actId };
                                                          dlog('pointer down init', { chapterId: chapter.id });
                                                      }}
                                         draggable
                                         onDragStart={(e) => {
                                             e.stopPropagation();
                                             isDraggingRef.current = true;
                                             setDraggingChapter({ id: chapter.id, sourceActId: actId });
                                             try {
                                                 const de = e as unknown as React.DragEvent<HTMLDivElement>;
                                                 de.dataTransfer.effectAllowed = 'all';
                                                 de.dataTransfer.dropEffect = 'move';
                                                 const payload = JSON.stringify({ type: 'chapter', chapterId: chapter.id, sourceActId: actId });
                                                 de.dataTransfer.setData('text/plain', payload);
                                                 de.dataTransfer.setData('text', payload);
                                                 de.dataTransfer.setData('application/json', payload);
                                                 const img = getDragImage();
                                                 de.dataTransfer.setDragImage(img, 0, 0);
                                             } catch {}
                                             dlog('chapter dragstart', { chapterId: chapter.id, actId });
                                         }}
                                         onDragEnterCapture={(e) => { dlog('chapter dragenter CAPTURE', { chapterId: chapter.id, actId, dt: readDT((e as any).dataTransfer) }); }}
                                         onDragEnd={(e) => { e.stopPropagation(); dlog('chapter dragend', { chapterId: chapter.id }); setDraggingChapter(null); setHoverChapterId(null); setHoverActId(null); isDraggingRef.current = false; }}
                                         onDragOver={(e) => { e.stopPropagation(); e.preventDefault(); try { (e as unknown as React.DragEvent<HTMLDivElement>).dataTransfer.dropEffect = 'move'; } catch {}; setHoverChapterId(chapter.id); setHoverActId(actId); const rect = (chapterRefs.current[chapter.id] as HTMLDivElement).getBoundingClientRect(); const mid = rect.top + rect.height / 2; const idx = e.clientY < mid ? chIndex : chIndex + 1; setInsertTarget({ actId, index: idx }); dlog('chapter dragover', { overChapterId: chapter.id, actId, insertIndex: idx }); }}
                                         onDragLeave={(e) => { e.stopPropagation(); dlog('chapter dragleave', { chapterId: chapter.id }); setHoverChapterId(null); }}
                                         onDrop={async (e) => {
                                             e.preventDefault();
                                             e.stopPropagation();
                                             try { (e as unknown as React.DragEvent<HTMLDivElement>).dataTransfer.dropEffect = 'move'; } catch {}
                                             dlog('chapter drop', { targetChapterId: chapter.id, actId });
                                             setHoverChapterId(null);
                                             setHoverActId(null);
                                             // Resolve target index consistently
                                             const rect = (chapterRefs.current[chapter.id] as HTMLDivElement).getBoundingClientRect();
                                             const mid = rect.top + rect.height / 2;
                                             const targetIdx = insertTarget && insertTarget.actId === actId ? insertTarget.index : (e.clientY < mid ? chIndex : chIndex + 1);
                                             const targetPosition = targetIdx + 1;
                                             // Resolve source chapter id
                                             let sourceChapterId: string | null = null;
                                             try {
                                                 const data = JSON.parse((e as unknown as React.DragEvent<HTMLDivElement>).dataTransfer.getData('text/plain'));
                                                 if (data?.type === 'chapter' && data.chapterId) {
                                                     sourceChapterId = data.chapterId;
                                                 }
                                             } catch {}
                                             if (!sourceChapterId && draggingChapter) {
                                                 sourceChapterId = draggingChapter.id;
                                             }
                                             if (sourceChapterId) {
                                                 setIsSavingOrder(true);
                                                 dlog('reorderChapter via drop', { fromChapterId: sourceChapterId, toActId: actId, toPosition: targetPosition });
                                                 try {
                                                     // Update narrative nodes first
                                                     await moveChapterNodeBetweenActs(sourceChapterId, actId, Math.max(0, targetPosition - 1));
                                                     // Minimal bookkeeping next
                                                     if (onReorderChapter) {
                                                         await onReorderChapter(sourceChapterId, targetPosition, actId);
                                                     }
                                                     window.dispatchEvent(new CustomEvent('chapterUpdated'));
                                                     window.dispatchEvent(new CustomEvent('plotAutoArrange'));
                                                 } finally {
                                                     setIsSavingOrder(false);
                                                     setInsertTarget(null);
                                                 }
                                             }
                                             setDraggingChapter(null);
                                             isDraggingRef.current = false;
                                         }}
                                     >
                                         {/* insertion line before this row */}
                                         <AnimatePresence>
                                         {draggingChapter && insertTarget && insertTarget.actId === actId && insertTarget.index === chIndex && (
                                             <motion.div layout initial={{ opacity: 0, scaleX: 0.8 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, scaleX: 0.8 }} className="h-0.5 bg-red-500 rounded-full opacity-90 -mt-0.5 mb-1 mr-2 ml-6" />
                                         )}
                                         </AnimatePresence>
                                         <span className="flex-1 truncate">{chapter.title || 'Untitled Chapter'}</span>
                                         <div className="flex items-center gap-1 opacity-0 group-hover/chapter:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleReorderChapter(chapter)}
                                                className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/20"
                                                title="Reorder Chapter"
                                                draggable
                                                onDragStart={(e) => {
                                                    e.stopPropagation();
                                                    setDraggingChapter({ id: chapter.id, sourceActId: actId });
                                                    try {
                                                        e.dataTransfer.effectAllowed = 'all';
                                                        e.dataTransfer.dropEffect = 'move';
                                                        const payload = JSON.stringify({ type: 'chapter', chapterId: chapter.id, sourceActId: actId });
                                                        e.dataTransfer.setData('text/plain', payload);
                                                        e.dataTransfer.setData('text', payload);
                                                        e.dataTransfer.setData('application/json', payload);
                                                        const img = getDragImage();
                                                        e.dataTransfer.setDragImage(img, 0, 0);
                                                    } catch {}
                                                    dlog('chapter handle dragstart', { chapterId: chapter.id, actId, dt: readDT(e.dataTransfer) });
                                                }}
                                            >
                                                <Bars3BottomLeftIcon className="w-4 h-4 text-gray-400 dark:text-gray-500"/>
                                            </button>
                                            <button 
                                                onClick={() => handleOpenChapterSettings(chapter)}
                                                className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/20"
                                                title="Chapter Settings"
                                            >
                                                <CogIcon className="w-4 h-4 text-gray-400 dark:text-gray-500"/>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteChapter(chapter)}
                                                className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/20"
                                                title="Delete Chapter"
                                            >
                                                <TrashIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-500"/>
                                            </button>
                                         </div>
                                         {/* insertion line at the end */}
                                         {draggingChapter && insertTarget && insertTarget.actId === actId && insertTarget.index === actGroup.chapters.length && (
                                             <motion.div layout initial={{ opacity: 0, scaleX: 0.8 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, scaleX: 0.8 }} className="h-0.5 bg-red-500 rounded-full opacity-90 mt-1 mr-2 ml-6" />
                                         )}
                                     </motion.div>
                                 ))}
                             </motion.div>
                         ))
                     ) : (
                         // Empty state - no chapters exist yet
                         <div className="p-4 text-center">
                             <div className="text-gray-400 dark:text-gray-500 mb-4">
                                 <DocumentIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                 <p className="text-sm font-medium">No chapters yet</p>
                                 <p className="text-xs opacity-75">Start by creating your first act and chapter</p>
                             </div>
                             <div className="space-y-2">
                                 <button 
                                     onClick={handleCreateNewAct}
                                     className="flex items-center gap-2 w-full justify-center px-3 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                 >
                                     <PlusIcon className="w-4 h-4" />
                                     Create First Act
                                 </button>
                                 <button 
                                     onClick={() => handleCreateChapterInAct('')}
                                     className="flex items-center gap-2 w-full justify-center px-3 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 border border-gray-600 dark:border-gray-300"
                                 >
                                     <DocumentIcon className="w-4 h-4" />
                                     Create Chapter (Default Act)
                                 </button>
                             </div>
                         </div>
                     )}
                      </motion.div>
                  </>
            )}
            </AnimatePresence>
            
            {/* Create Chapter Modal */}
            <AnimatePresence>
                {showCreateChapterModal && (
                    <CreateChapterModal
                        isOpen={showCreateChapterModal}
                        onClose={() => {
                            setShowCreateChapterModal(false);
                            setSelectedActForNewChapter('');
                        }}
                        onCreateChapter={async (title: string, actId?: string) => {
                            const targetActId = actId || selectedActForNewChapter;
                            if (onCreateChapter) {
                                await onCreateChapter(title, targetActId);
                                // Dispatch event to refresh the dropdown
                                window.dispatchEvent(new CustomEvent('chapterCreated'));
                            }
                            setShowCreateChapterModal(false);
                            setSelectedActForNewChapter('');
                        }}
                        actId={selectedActForNewChapter}
                    />
                )}
            </AnimatePresence>

            {/* Create Act Modal */}
            <AnimatePresence>
                {showCreateActModal && (
                    <CreateActModal
                        isOpen={showCreateActModal}
                        onClose={() => setShowCreateActModal(false)}
                        onCreateAct={async (title: string) => {
                            if (onCreateAct) {
                                await onCreateAct(title);
                                window.dispatchEvent(new CustomEvent('actCreated'));
                            }
                            setShowCreateActModal(false);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Act Settings Modal */}
            <AnimatePresence>
        {showActSettingsModal && selectedActForSettings && (
                    <ActSettingsModal
                        isOpen={showActSettingsModal}
                        onClose={() => { setShowActSettingsModal(false); setSelectedActForSettings(null); }}
            actId={selectedActForSettings as string}
            initialTitle={(actNodes.find((a) => a.id === (selectedActForSettings as string))?.data?.title) || (actNodes.find((a) => a.id === (selectedActForSettings as string))?.data?.data?.title) || ''}
            initialDescription={(actNodes.find((a) => a.id === (selectedActForSettings as string))?.data?.data?.description) || ''}
                        onUpdateAct={async (actId, updates) => {
                            await handleUpdateActDetails(actId, updates);
                            setShowActSettingsModal(false);
                            setSelectedActForSettings(null);
                        }}
                    />
                )}
            </AnimatePresence>
            
            <AnimatePresence>
        {isChapterSettingsOpen && selectedChapterForSettings && (
                    <ChapterSettingsModal
                        isOpen={isChapterSettingsOpen}
                        onClose={() => {
                            setChapterSettingsOpen(false);
                            setSelectedChapterForSettings(null);
                        }}
            chapter={selectedChapterForSettings as Chapter}
                        onUpdateChapter={handleUpdateChapterFromModal}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};


const EditorTab: React.FC<{ name: string; isActive: boolean; onClick: () => void; className?: string; }> = ({ name, isActive, onClick, className }) => {
    return (
      <button
        onClick={onClick}
        className={`group relative px-4 py-2 text-sm font-medium transition-colors rounded-full focus:outline-none ${className}`}
      >
                <span className={`relative z-10 transition-colors ${
                    isActive
                        ? 'text-white dark:text-black'
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                }`}>
                    {name}
                </span>
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-black dark:bg-white rounded-full"
            layoutId="editorHeaderTabPill"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </button>
    );
};

// Separate component for World Building header to use hooks properly
const WorldBuildingHeader: React.FC<{
    searchQuery: string;
    onSearchChange: (query: string) => void;
}> = ({ searchQuery, onSearchChange }) => {
    const { bookId, versionId } = useCurrentBookAndVersion();
    const { getWorlds, selectedWorldId, setSelectedWorldId } = useBookContext();
    const [isWorldSelectorOpen, setIsWorldSelectorOpen] = useState(false);
    
    type World = { id: string; name?: string; description?: string };
    const rawWorlds = bookId && versionId ? getWorlds(bookId, versionId) : [];
    const worlds: World[] = Array.isArray(rawWorlds)
        ? (rawWorlds as World[])
        : (rawWorlds ? (Object.values(rawWorlds as any) as World[]) : []);
    const selectedWorld = worlds.find((w) => w.id === selectedWorldId);
    
    return (
        <div className="relative w-full h-10 bg-gradient-to-br from-black to-gray-800 dark:from-gray-50 dark:to-slate-200 rounded-full overflow-visible border border-gray-700 dark:border-gray-300 shadow-inner">
            <div className="absolute inset-0 flex items-center justify-between px-4 text-white dark:text-black">
                <div className="flex items-center gap-3 flex-1 mr-4">
                    <MagnifyingGlassIcon className="h-4 w-4 text-white/70 dark:text-black/70" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search locations, objects, lore, magic systems..."
                        className="bg-transparent border-none outline-none text-sm placeholder-white/50 dark:placeholder-black/50 text-white dark:text-black flex-1 min-w-0"
                    />
                </div>
                
                {/* World Selector and Create World Button */}
                <div className="flex items-center gap-2">
                    {/* Create World Button - Always visible */}
                    <motion.button
                        onClick={() => {
                            // Dispatch a custom event that WorldBuildingBoard can listen to
                            window.dispatchEvent(new CustomEvent('triggerCreateWorld'));
                        }}
                        className="flex items-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Create New World"
                    >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-xs">Create</span>
                    </motion.button>

                    {/* World Selector - Only show when worlds exist */}
                    {worlds.length > 0 && (
                        <div className="relative">
                            <motion.button
                                onClick={() => setIsWorldSelectorOpen(!isWorldSelectorOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <GlobeAltIcon className="h-4 w-4" />
                                <span className="text-xs max-w-24 truncate">{selectedWorld?.name ?? 'Select World'}</span>
                                <ChevronDownIcon className="h-4 w-4" />
                            </motion.button>

                            <AnimatePresence>
                                {isWorldSelectorOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-64 bg-gradient-to-br from-gray-800 to-black dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-xl border border-gray-600 dark:border-gray-300 z-50"
                                    >
                                        <div className="p-2">
                        {worlds.map((world: World) => (
                                                <motion.button
                                                    key={world.id}
                                                    onClick={() => {
                                                        setSelectedWorldId(world.id);
                                                        setIsWorldSelectorOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                                        selectedWorldId === world.id
                                                            ? 'bg-green-500 text-white'
                                                            : 'text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10'
                                                    }`}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                            <div className="font-medium">{world.name ?? 'Untitled World'}</div>
                            <div className="text-xs opacity-70 truncate">{world.description ?? ''}</div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PlanningHeader: React.FC<{
    activePlanningTab: string;
    planningLayout: string;
    planningSubview: string;
    onPlanningLayoutChange: (layout: string) => void;
    onPlanningSubviewChange: (subview: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}> = ({ activePlanningTab, searchQuery, onSearchChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Always declare hooks at the top level
    const [isLayoutOpen, setIsLayoutOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Handle click outside for layout dropdown - only active when Plot Arcs tab is selected
    useEffect(() => {
        if (activePlanningTab !== 'Plot Arcs') {
            setIsLayoutOpen(false); // Reset dropdown state when not on Plot Arcs
            return;
        }
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
                setIsLayoutOpen(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activePlanningTab]);
    
    // Only show layout controls for Plot Arcs
    if (activePlanningTab === 'Plot Arcs') {

        // Layout definitions matching PlotArcsBoard
        const layoutOptions = [
            {
                category: 'Outline Layouts',
                items: [
                    { id: 'narrative', label: 'Narrative Layout', description: 'Hierarchical story structure view' },
                    { id: 'character-screentime', label: 'Character Screen Time', description: 'Character presence analysis' },
                    { id: 'location-screentime', label: 'Location Screen Time', description: 'Location usage analysis' },
                    { id: 'object-screentime', label: 'Object Screen Time', description: 'Object appearance frequency' },
                    { id: 'lore-screentime', label: 'Lore Screen Time', description: 'Lore element frequency' }
                ]
            },
            {
                category: 'Character Layouts',
                items: [
                    { id: 'character-progression', label: 'Character Progression', description: 'Character development arcs' },
                    { id: 'character-heatmap', label: 'Character Appearance Heat Map', description: 'Visual character frequency' },
                    { id: 'character-journey', label: 'Character Journey', description: 'Character path through story' },
                    { id: 'character-possession', label: 'Character Possession Arc', description: 'Character asset relationships' }
                ]
            },
            {
                category: 'World Entity Layouts',
                items: [
                    { id: 'location-heatmap', label: 'Location Appearance Heat Map', description: 'Visual location frequency matrix' },
                    { id: 'object-heatmap', label: 'Object Appearance Heat Map', description: 'Visual object frequency matrix' },
                    { id: 'lore-heatmap', label: 'Lore Appearance Heat Map', description: 'Visual lore frequency matrix' }
                ]
            },
            {
                category: 'World Layouts',
                items: [
                    { id: 'world-map', label: 'World Map Layout', description: 'Spatial story relationships' },
                    { id: 'world-affinity', label: 'World Affinity Layout', description: 'Location relationship mapping' }
                ]
            },
            {
                category: 'Lore & Symbolic Layouts',
                items: [
                    { id: 'lore-web', label: 'Lore Web Layout', description: 'Knowledge interconnections' },
                    { id: 'symbolic-connections', label: 'Symbolic Connections Layout', description: 'Thematic element links' }
                ]
            },
            {
                category: 'Themes & Analytical Layouts',
                items: [
                    { id: 'emotional-arc', label: 'Emotional Arc Layout', description: 'Story emotional progression' },
                    { id: 'pacing-layout', label: 'Pacing Layout', description: 'Story rhythm analysis' }
                ]
            }
        ];

        // Get current layout from URL params
        const currentLayout = new URLSearchParams(location.search).get('layout') || 'narrative';
        const currentLayoutItem = layoutOptions
            .flatMap(category => category.items)
            .find(item => item.id === currentLayout) || layoutOptions[0].items[0];

        // Handle layout change by updating URL params
        const handleLayoutChange = (layoutId: string) => {
            const params = new URLSearchParams(location.search);
            params.set('layout', layoutId);
            navigate({
                pathname: location.pathname,
                search: params.toString(),
                hash: location.hash
            }, { replace: true });
            setIsLayoutOpen(false);
        };

        return (
            <div className="relative w-full h-10 bg-gradient-to-br from-black to-gray-800 dark:from-gray-50 dark:to-slate-200 rounded-full overflow-visible border border-gray-700 dark:border-gray-300 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-between px-4 text-white dark:text-black">
                    {/* Left: Search Bar */}
                    <div className="flex items-center gap-3 flex-1 mr-4">
                        <MagnifyingGlassIcon className="h-4 w-4 text-white/70 dark:text-black/70" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search for Scenes, Characters, events..."
                            className="bg-transparent border-none outline-none text-sm placeholder-white/50 dark:placeholder-black/50 text-white dark:text-black flex-1 min-w-0"
                        />
                    </div>

                    {/* Right: Layout Selector */}
                    <div className="relative" ref={dropdownRef}>
                        <motion.button
                            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Squares2X2Icon className="h-4 w-4" />
                            <span className="text-xs max-w-24 truncate">{currentLayoutItem.label}</span>
                            <ChevronDownIcon className="h-4 w-4" />
                        </motion.button>

                        <AnimatePresence>
                            {isLayoutOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full right-0 mt-2 w-[30rem] bg-gradient-to-br from-black to-gray-800 dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-lg p-2 z-50 border border-gray-700/50 dark:border-gray-200/50 max-h-80 overflow-y-auto no-scrollbar"
                                >
                                    {layoutOptions.map((category) => (
                                        <div key={category.category} className="mb-1">
                                            <div className="flex items-center justify-between px-2 py-1 group/category">
                                                <div className="flex items-center gap-2">
                                                    <Bars3BottomLeftIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-grab" />
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{category.category}</h4>
                                                </div>
                                            </div>
                                            {category.items.map((item) => (
                                                <motion.button
                                                    key={item.id}
                                                    onClick={() => handleLayoutChange(item.id)}
                                                    className={`group/layout flex items-center justify-between pl-8 pr-2 py-1.5 text-sm rounded-md w-full text-left transition-colors ${
                                                        currentLayout === item.id 
                                                            ? 'bg-blue-500/20 text-blue-200 dark:text-blue-700' 
                                                            : 'text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10'
                                                    }`}
                                                    whileHover={{ x: 4 }}
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium truncate">
                                                            {item.label}
                                                        </span>
                                                        <span className="text-xs opacity-70 truncate">
                                                            {item.description}
                                                        </span>
                                                    </div>
                                                    {currentLayout === item.id && (
                                                        <div className="w-2 h-2 bg-blue-400 rounded-full ml-2 flex-shrink-0"></div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    }

    // For World Building page - search + world selector
    if (activePlanningTab === 'World Building') {
        return (
            <WorldBuildingHeader 
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
            />
        );
    }

    // For Characters page - simple search
    if (activePlanningTab === 'Characters') {
        return (
            <div className="relative w-full h-10 bg-gradient-to-br from-black to-gray-800 dark:from-gray-50 dark:to-slate-200 rounded-full overflow-visible border border-gray-700 dark:border-gray-300 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-between px-4 text-white dark:text-black">
                    <div className="flex items-center gap-3 flex-1">
                        <MagnifyingGlassIcon className="h-4 w-4 text-white/70 dark:text-black/70" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search characters, relationships, arcs..."
                            className="bg-transparent border-none outline-none text-sm placeholder-white/50 dark:placeholder-black/50 text-white dark:text-black flex-1 min-w-0"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

interface EditorHeaderProps {
    book: Book;
    version: Version;
    currentChapter?: Chapter;
    chapters?: Chapter[];
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onOpenTypographySettings: () => void;
    activeMode: string;
    setActiveMode: (mode: string) => void;
    activePlanningTab?: string;
    planningLayout?: string;
    planningSubview?: string;
    onPlanningLayoutChange?: (layout: string) => void;
    onPlanningSubviewChange?: (subview: string) => void;
    planningSearchQuery?: string;
    onPlanningSearchChange?: (query: string) => void;
    onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => Promise<void>;
    onCreateChapter?: (title: string, actId?: string) => Promise<void>;
    onDeleteChapter?: (chapterId: string) => Promise<void>;
    onCreateAct?: (title: string) => Promise<void>;
    onDeleteAct?: (actId: string) => Promise<void>;
    onReorderChapter?: (chapterId: string, newPosition: number, newActId?: string) => Promise<void>;
    onNavigateToChapter?: (chapterId: string) => void;
    isChapterLoading?: boolean;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ 
    book, 
    version, 
    currentChapter,
    chapters = [],
    theme, 
    setTheme, 
    onOpenTypographySettings, 
    activeMode, 
    setActiveMode,
    activePlanningTab = 'Plot Arcs',
    planningLayout = 'Plot Layout',
    planningSubview = 'by character',
    onPlanningLayoutChange,
    onPlanningSubviewChange,
    planningSearchQuery = '',
    onPlanningSearchChange,
    onUpdateChapter,
    onCreateChapter,
    onDeleteChapter,
    onCreateAct,
    onDeleteAct,
    onReorderChapter,
    onNavigateToChapter,
    isChapterLoading = false
}) => {
    const [isChapterSettingsOpen, setChapterSettingsOpen] = useState(false);
    const { openTool, broadcastThemeChange } = useToolWindowStore();
    const { logout, lock } = useAuthStore();

    const handleOpenTool = async (toolName: string) => {
        try {
            appLog.info('editor-header', `Opening tool: ${toolName} for book ${book.id}, version ${version.id} with theme ${theme}`);
            await openTool(toolName, book.id, version.id, theme);
        } catch (error) {
            appLog.error('editor-header', `Failed to open ${toolName}`, error);
        }
    };

    const handleThemeChange = async (newTheme: Theme) => {
        setTheme(newTheme);
        await broadcastThemeChange(newTheme);
    };

    const handleLogout = async () => {
        try {
            await appLog.info('editor-header', 'Starting logout process...');
            await logout();
            await appLog.success('editor-header', 'Logout successful');
            // No need to navigate as logout will reload the page
        } catch (error) {
            await appLog.error('editor-header', 'Logout failed', error);
        }
    };

    const handleLock = async () => {
        try {
            await appLog.info('editor-header', 'Starting lock process...');
            await lock();
            await appLog.success('editor-header', 'Lock successful');
        } catch (error) {
            await appLog.error('editor-header', 'Lock failed', error);
        }
    };

    return (
        <header className="sticky top-0 z-40 flex-shrink-0">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center h-20">
                    <div className="flex justify-start">
                         <Link to={`/book/${book.id}`} className="flex items-center gap-2 cursor-pointer">
                            <PencilIcon className="h-6 w-6 text-gray-900 dark:text-white"/>
                            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                AuthorStudio
                            </h1>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center justify-center">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-4">
                            <div className="flex gap-2 justify-end">
                                <EditorTab name="Writing" isActive={activeMode === 'Writing'} onClick={() => setActiveMode('Writing')} />
                                <EditorTab name="Planning" isActive={activeMode === 'Planning'} onClick={() => setActiveMode('Planning')} />
                            </div>

                            <div className="w-[32rem]">
                                {activeMode === 'Planning' ? (
                                    <PlanningHeader
                                        activePlanningTab={activePlanningTab}
                                        planningLayout={planningLayout}
                                        planningSubview={planningSubview}
                                        onPlanningLayoutChange={onPlanningLayoutChange || (() => {})}
                                        onPlanningSubviewChange={onPlanningSubviewChange || (() => {})}
                                        searchQuery={planningSearchQuery}
                                        onSearchChange={onPlanningSearchChange || (() => {})}
                                    />
                                ) : (
                                    <ChapterProgressBar 
                                        book={book} 
                                        currentChapter={currentChapter}
                                        chapters={chapters}
                                        onOpenSettings={() => setChapterSettingsOpen(true)}
                                        onOpenTypographySettings={onOpenTypographySettings}
                                        onCreateChapter={onCreateChapter}
                                        onUpdateChapter={onUpdateChapter}
                                        onDeleteChapter={onDeleteChapter}
                                        onCreateAct={onCreateAct}
                                        onDeleteAct={onDeleteAct}
                                        onReorderChapter={onReorderChapter}
                                        onNavigateToChapter={onNavigateToChapter}
                                        isChapterLoading={isChapterLoading}
                                    />
                                )}
                            </div>

                            <div className="flex gap-2 justify-start">
                                <EditorTab name="Formatting" isActive={activeMode === 'Formatting'} onClick={() => setActiveMode('Formatting')} />
                                <EditorTab name="Brainstorming" isActive={activeMode === 'Brainstorming'} onClick={() => setActiveMode('Brainstorming')} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <div className="flex items-center gap-4 flex-shrink-0">
                            {/* Tools Menu */}
                            <DropdownMenu trigger={
                                <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
                                    <SparklesIcon className="h-5 w-5" />
                                    <span className="text-sm font-medium">Tools</span>
                                </button>
                            }>
                                <button 
                                    onClick={() => handleOpenTool('name-generator')}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                >
                                    <SparklesIcon className="h-4 w-4" />
                                    Name Generator
                                </button>
                                <button 
                                    onClick={() => handleOpenTool('character-tracker')}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                >
                                    <UserIcon className="h-4 w-4" />
                                    Character Profile Builder
                                </button>
                            </DropdownMenu>

                             <DropdownMenu trigger={<button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">{theme === 'dark' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}</button>}>
                                <button onClick={() => handleThemeChange('light')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <SunIcon className="h-4 w-4"/> Light</button>
                                <button onClick={() => handleThemeChange('dark')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <MoonIcon className="h-4 w-4"/> Dark</button>
                                <button onClick={() => handleThemeChange('system')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <ComputerDesktopIcon className="h-4 w-4"/> System</button>
                            </DropdownMenu>

                            <DropdownMenu trigger={<img src="https://picsum.photos/seed/user/40/40" alt="User Avatar" className="w-9 h-9 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900 ring-transparent hover:ring-purple-500 transition-all"/>}>
                                <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">My Account</a>
                                <button 
                                    onClick={handleLock}
                                    className="w-full text-left block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                >
                                    Lock App
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="w-full text-left block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                >
                                    Logout
                                </button>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
             </div>
             <AnimatePresence>
                {isChapterSettingsOpen && (
                    <ChapterSettingsModal
                        isOpen={isChapterSettingsOpen}
                        onClose={() => setChapterSettingsOpen(false)}
                        chapter={currentChapter}
                        onUpdateChapter={onUpdateChapter}
                    />
                )}
            </AnimatePresence>
        </header>
    );
};

export default EditorHeader;
