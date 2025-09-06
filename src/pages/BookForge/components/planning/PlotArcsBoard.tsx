import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Connection,
    ReactFlowProvider,
    ConnectionLineType,
    ReactFlowInstance,
    SmoothStepEdge,
    EdgeLabelRenderer
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Book, Version, Theme } from '../../../../types';

// Import encrypted scene editor
import SceneEditModal from './SceneEditModal';





// Import narrative components
import { 
    OutlineNodeComponent,
    ActNodeComponent,
    ChapterNodeComponent,
    SceneNodeComponent,
    CharacterArcNodeComponent,
    LocationArcNodeComponent,
    ObjectArcNodeComponent,
    LoreArcNodeComponent
} from './narrative/NarrativeNodes';
import { EnhancedCreateNodeModal } from './narrative/EnhancedCreateNodeModal';
import { CharacterPopup } from './narrative/CharacterPopup';
import { AISuggestions } from './narrative/AISuggestions';
import FloatingControls from './narrative/FloatingControls';
import NarrativeBreadcrumb from './narrative/NarrativeBreadcrumb';
import { 
    generateHierarchicalLayout,
    filterNodes,
    expandNode,
    collapseNode,
    createNewNode,
    generateEdges,
    getVisibleNodes,
    updateNodeExpansionStates,
    getNodeAncestors,
    getNodeDescendants
} from './narrative/narrativeUtils';

// Import specialized layout components
import CharacterScreenTimeLayout from './characterScreentime';
import CharacterAppearanceHeatMap from './characterScreentime/CharacterAppearanceHeatMap';
// Import world entity layout components
import LocationScreenTimeLayout from './worldEntityScreentime/LocationScreenTimeLayout';
import LocationAppearanceHeatMap from './worldEntityScreentime/LocationAppearanceHeatMap';
import ObjectScreenTimeLayout from './worldEntityScreentime/ObjectScreenTimeLayout';
// import ObjectAppearanceHeatMap from './worldEntityScreentime/ObjectAppearanceHeatMap';
import LoreScreenTimeLayout from './worldEntityScreentime/LoreScreenTimeLayout';
// import LoreAppearanceHeatMap from './worldEntityScreentime/LoreAppearanceHeatMap';
import { 
    NarrativeFlowNode, 
    NarrativeEdge, 
    NarrativeFilters, 
    NarrativeLayoutConfig,
    AISuggestion,
    CreateNodeModalData,
    NarrativeNode
} from '../../../../types/narrative-layout';

import { useBookContext, useCurrentBookAndVersion } from '../../../../contexts/BookContext';


interface PlotArcsBoardProps {
    book: Book;
    version: Version;
    theme: Theme;
    searchQuery?: string;
    viewMode?: 'board' | 'list';
    statusFilter?: 'all' | 'completed' | 'in-progress' | 'planning';
}

const PlotArcsBoard: React.FC<PlotArcsBoardProps> = ({ 
    book,
    version,
    theme, 
    searchQuery = '', 
    viewMode = 'board', 
    statusFilter = 'all' 
}) => {
    // URL state management for drill-down mode and layout
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { getPlotCanvas, updatePlotCanvas } = useBookContext();
    const { bookId, versionId } = useCurrentBookAndVersion();

    const [plotCanvas, setPlotCanvas] = useState<any>(null);

    useEffect(() => {
        const fetchPlotCanvas = async () => {
            if (bookId && versionId) {
                const canvas = await getPlotCanvas(bookId, versionId);
                setPlotCanvas(canvas);
            } else {
                setPlotCanvas(null);
            }
        };
        fetchPlotCanvas();
    }, [bookId, versionId, getPlotCanvas]);
    
    
    
    // Get current layout from URL or default to 'narrative'
    const currentLayout = searchParams.get('layout') || 'narrative';

    // Layout change handler
    const handleLayoutChange = useCallback((layoutId: string) => {
        const params = new URLSearchParams(searchParams);
        console.log('searchParams before:', params.toString(), 'searchParams', searchParams);
        params.set('layout', layoutId);
        
        // Use navigate to preserve the full URL path and all params
        navigate({
            pathname: location.pathname,
            search: params.toString(),
            hash: location.hash
        }, { replace: true });
    }, [searchParams, navigate, location]);

    // Narrative layout state
    const [narrativeNodes, setNarrativeNodes] = useState<NarrativeFlowNode[]>([]);
    const [narrativeEdges, setNarrativeEdges] = useState<NarrativeEdge[]>([]);
    const [layoutConfig, setLayoutConfig] = useState<NarrativeLayoutConfig>({
        expandedNodes: new Set(),
        selectedNode: searchParams.get('selectedNodeId') || null, // Initialize from URL
        filters: {
            characters: [],
            objects: [],
            locations: [],
            timelineEvents: [],
            nodeTypes: [],
            status: []
        },
        viewMode: 'hierarchy',
        autoLayout: true
    });

    // Modal and AI state
    const [createNodeModal, setCreateNodeModal] = useState<CreateNodeModalData>({
        parentId: null,
        nodeType: 'scene',
        position: { x: 0, y: 0 },
        isVisible: false
    });
    const [editingNode, setEditingNode] = useState<NarrativeNode | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
    
    // Encrypted scene editor modal state
    const [sceneEditModal, setSceneEditModal] = useState<{
        isOpen: boolean;
        sceneId?: string;
        sceneName?: string;
    }>({
        isOpen: false,
        sceneId: undefined,
        sceneName: undefined,
    });
    
    const [characterPopup, setCharacterPopup] = useState<{
        isVisible: boolean;
        characterId: string;
        nodeId: string;
        position: { x: number; y: number };
    }>({
        isVisible: false,
        characterId: '',
        nodeId: '',
        position: { x: 0, y: 0 }
    });

    // ReactFlow hooks
    const [nodes, setNodes, defaultOnNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
    const prevNodeCountRef = useRef<number>(0);
    const reactFlowPaneRef = useRef<HTMLDivElement | null>(null);
    const connectStartNodeIdRef = useRef<string | null>(null);
    const lastConnectParentRef = useRef<string | null>(null);

    // Mock data for filters
    const availableCharacters = [
        { id: 'char-1', name: 'Emma Harrison' },
        { id: 'char-2', name: 'Marcus Vale' },
        { id: 'char-3', name: 'Aria Blackwood' },
        { id: 'char-4', name: 'The Mentor' }
    ];

    const availableLocations = [
        { id: 'loc-1', name: 'The Academy' },
        { id: 'loc-2', name: 'Shadow Realm' },
        { id: 'loc-3', name: 'Crystal Caverns' },
        { id: 'loc-4', name: 'Ancient Library' }
    ];

    const availableObjects = [
        { id: 'obj-1', name: 'Crystal of Power' },
        { id: 'obj-2', name: 'Ancient Scroll' },
        { id: 'obj-3', name: 'Mystic Blade' },
        { id: 'obj-4', name: 'Portal Key' }
    ];

    const availableTimelineEvents = [
        { id: 'timeline-1', name: 'The Dark Lord Returns', tag: 'Present' },
        { id: 'timeline-2', name: 'Battle of Shadowmere', tag: 'Past' },
        { id: 'timeline-3', name: 'Vision of the Chosen One', tag: 'Future' },
        { id: 'timeline-4', name: 'Memory of First Love', tag: 'Flashback' }
    ];

    // Minimal: keep UI updates; persist position only when dragging stops via changes
    const onNodesChange = useCallback((changes: any[]) => {
        // update ReactFlow internal state first so the UI stays responsive
        defaultOnNodesChange(changes);

        // persist final positions when we receive a non-dragging position change
        const positionCommits = changes.filter((ch: any) => ch.type === 'position' && ch.dragging === false);
        if (positionCommits.length === 0) return;

        // build a map of final positions from the changes
        const posById = new Map<string, { x: number; y: number }>();
        const inst = reactFlowInstanceRef.current;
        for (const ch of positionCommits) {
            if (!ch?.id) continue;
            let pos = ch.position as { x: number; y: number } | undefined;
            // Some React Flow versions omit position on commit; read from instance
            if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
                const n = (inst && (inst as any).getNode) ? (inst as any).getNode(ch.id) : undefined;
                if (n && n.position) pos = n.position;
                // Fallback to local ReactFlow nodes state (updated by defaultOnNodesChange)
                if ((!pos || typeof pos.x !== 'number') && Array.isArray(nodes)) {
                    const local = (nodes as any[]).find(nn => nn.id === ch.id);
                    if (local?.position) pos = local.position;
                }
            }
            if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
                posById.set(ch.id, pos);
            }
        }
        if (posById.size === 0) return;

        // Update local narrativeNodes state (single render) so future mappings use the latest position
        setNarrativeNodes(prev => prev.map(n => posById.has(n.id)
            ? { ...n, data: { ...n.data, position: posById.get(n.id)! } }
            : n
        ));

    // Also persist immediately without waiting for debounce, using a snapshot to avoid extra renders
        const snapshotForSave = (narrativeNodesRef.current || []).map(n => posById.has(n.id)
            ? { ...n, data: { ...n.data, position: posById.get(n.id)! } }
            : n
        );
        // Guarded immediate save
        (async () => {
            try {
        if (!didHydrateRef.current) return;
                if (!bookId || !versionId || !updatePlotCanvas) return;
                if (!snapshotForSave.length) return;
                const nodesToSave = snapshotForSave.map(n => ({
                    ...n,
                    data: { ...n.data, position: (n as any).data?.position ?? (n as any).position }
                })) as NarrativeFlowNode[];
                const edgesToSave = buildEdgesForPersistence(nodesToSave);
                const hash = JSON.stringify({
                    nodes: nodesToSave.map(n => ({ id: n.id, type: n.data.type, position: n.data.position, parentId: n.data.parentId, childIds: n.data.childIds, linkedNodeIds: n.data.linkedNodeIds })),
                    edges: edgesToSave.map(e => ({ s: e.source, t: e.target, ty: e.type }))
                });
                if (hash === lastSavedHashRef.current) return;
                lastSavedHashRef.current = hash;
        console.log('Immediate persist on drag end', { nodes: nodesToSave.length, edges: edgesToSave.length });
                await updatePlotCanvas(bookId, versionId, { nodes: nodesToSave, edges: edgesToSave });
            } catch {}
        })();
    }, [defaultOnNodesChange, setNarrativeNodes, bookId, versionId, updatePlotCanvas]);

    // Keep a ref to latest nodes and expanded set to avoid recreating handlers
    const narrativeNodesRef = useRef<NarrativeFlowNode[]>([]);
    useEffect(() => { narrativeNodesRef.current = narrativeNodes; }, [narrativeNodes]);

    // Initialize from persisted plot canvas when it loads
    useEffect(() => {
        if (!plotCanvas) return;
        const persistedNodes = plotCanvas.nodes || [];
        const persistedEdges = plotCanvas.edges || [];
        console.log('Initialized narrative nodes and edges', persistedNodes, persistedEdges);

        const hasPositions = persistedNodes.length > 0 && persistedNodes.every((n: any) => {
            const p = (n as any).data?.position;
            return p && typeof p.x === 'number' && typeof p.y === 'number';
        });

        const seededNodes: NarrativeFlowNode[] = hasPositions
            ? (persistedNodes as any).map((n: any) => ({ ...n, data: { ...n.data, position: n.data.position } }))
            : generateHierarchicalLayout(persistedNodes).map((n: any) => ({ ...n, data: { ...n.data, position: n.position } }));

    setNarrativeNodes(seededNodes);
    setNarrativeEdges(persistedEdges);
    setAiSuggestions([]);
    // Allow subsequent saves; debounced saver has guards against empty wipes
    didHydrateRef.current = true;
    }, [plotCanvas]);

    

    

    // Helper: build edges from node relationships for persistence
    const buildEdgesForPersistence = useCallback((nodesForEdges: NarrativeFlowNode[]): NarrativeEdge[] => {
        const seen = new Set<string>();
        const out: NarrativeEdge[] = [];
        for (const n of nodesForEdges) {
            const childIds = (n as any).data?.childIds || [];
            const linkedIds = (n as any).data?.linkedNodeIds || [];
            for (const c of childIds) {
                const id = `child-${n.id}-${c}`;
                if (seen.has(id)) continue; seen.add(id);
                out.push({ id, source: n.id, target: c, type: 'child' } as NarrativeEdge);
            }
            for (const l of linkedIds) {
                const id = `link-${n.id}-${l}`;
                if (seen.has(id)) continue; seen.add(id);
                out.push({ id, source: n.id, target: l, type: 'link' } as NarrativeEdge);
            }
        }
        return out;
    }, []);

    

    // Debounced persistence of plotCanvas when narrative nodes change (create/delete/edit/position/link)
    const didHydrateRef = React.useRef(false);
    const persistTimerRef = React.useRef<number | undefined>(undefined);
    const lastSavedHashRef = React.useRef<string>('');
    useEffect(() => {
        if (!didHydrateRef.current) return; // skip first hydration
        if (!bookId || !versionId || !updatePlotCanvas) return;
        if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = window.setTimeout(async () => {
            try {
                // Ensure positions live under data.position
                const nodesToSave = narrativeNodes.map(n => ({
                    ...n,
                    data: { ...n.data, position: (n as any).data?.position ?? (n as any).position }
                })) as NarrativeFlowNode[];
                const edgesToSave = buildEdgesForPersistence(nodesToSave);
                // Compute current hash of state
                const hash = JSON.stringify({
                    nodes: nodesToSave.map(n => ({ id: n.id, type: n.data.type, position: n.data.position, parentId: n.data.parentId, childIds: n.data.childIds, linkedNodeIds: n.data.linkedNodeIds })),
                    edges: edgesToSave.map(e => ({ s: e.source, t: e.target, ty: e.type }))
                });
                // On first run after hydration, initialize the baseline hash and skip persisting
                if (lastSavedHashRef.current === '') {
                    lastSavedHashRef.current = hash;
                    // If there is nothing to save, also bail early
                    if (nodesToSave.length === 0) return;
                    // Don't persist immediately on hydration baseline
                    return;
                }
                // Avoid wiping DB with an empty state
                if (nodesToSave.length === 0) {
                    return;
                }
                // Skip if nothing changed since last save
                if (hash === lastSavedHashRef.current) {
                    return;
                }
                lastSavedHashRef.current = hash;
                await updatePlotCanvas(bookId, versionId, { nodes: nodesToSave, edges: edgesToSave });
                console.log('PlotCanvas persisted', { nodes: nodesToSave.length, edges: edgesToSave.length });
            } catch (e) {
                console.warn('Failed to persist plotCanvas', e);
            }
        }, 600);
        return () => { if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current); };
    }, [narrativeNodes, bookId, versionId, updatePlotCanvas, buildEdgesForPersistence]);

    // Update ReactFlow nodes when narrative data changes
    useEffect(() => {
        // Get visible nodes based on selection hierarchy
        const visibleNodes = getVisibleNodes(narrativeNodes, layoutConfig.selectedNode);
        
        // Apply additional filters
        const filters: NarrativeFilters = {
            ...layoutConfig.filters,
            status: statusFilter === 'all' ? [] : [statusFilter as any]
        };

        const filteredNodes = filterNodes(visibleNodes, filters, searchQuery);
        
        // Preserve positions when filtering - don't regenerate layout
        // Only use existing positions from the original nodes
        const layoutNodes = filteredNodes.map(node => ({
            ...node,
            position: node.data.position // Use stored position
        }));
        
        // Convert to ReactFlow format
        const reactFlowNodes: Node[] = layoutNodes.map(narrativeNode => ({
            id: narrativeNode.id,
            type: narrativeNode.data.type,
            position: narrativeNode.position,
            data: narrativeNode.data,
            selected: layoutConfig.selectedNode === narrativeNode.id
        }));

        // Generate edges for visible nodes with selection state
        const selectedNodeAncestors = layoutConfig.selectedNode ? 
            getNodeAncestors(layoutConfig.selectedNode, layoutNodes) : [];
        const selectedNodeDescendants = layoutConfig.selectedNode ? 
            getNodeDescendants(layoutConfig.selectedNode, layoutNodes) : [];
            
        const { edges: narrativeEdges, hubNodes } = generateEdges(
            layoutNodes, 
            layoutConfig.selectedNode || undefined,
            selectedNodeAncestors,
            selectedNodeDescendants
        );
        
        const reactFlowEdges: Edge[] = narrativeEdges.map(narrativeEdge => ({
            id: narrativeEdge.id,
            source: narrativeEdge.source,
            target: narrativeEdge.target,
            type: 'toggle',
            style: narrativeEdge.style,
            animated: narrativeEdge.animated,
            data: { relationship: (narrativeEdge as any).data?.relationship, onToggle: toggleEdgeType }
        }));

        // Include hub nodes with regular nodes for ReactFlow
        const allReactFlowNodes: Node[] = [
            ...reactFlowNodes,
            ...hubNodes.map(hubNode => ({
                id: hubNode.id,
                type: 'default',
                position: hubNode.position,
                data: hubNode.data,
                style: hubNode.style
            }))
        ];

        console.log('Generated edges:', reactFlowEdges.length, reactFlowEdges);
        console.log('Layout nodes with relationships:', layoutNodes.map(n => ({
            id: n.id,
            type: n.data.type,
            childIds: n.data.childIds,
            linkedNodeIds: n.data.linkedNodeIds
        })));

        setNodes(allReactFlowNodes);
        setEdges(reactFlowEdges);
    }, [narrativeNodes, narrativeEdges, layoutConfig, searchQuery, statusFilter, setNodes, setEdges]);

    // Fit view when nodes are first loaded (after hydration) or when transitioning from 0 -> N
    useEffect(() => {
        const inst = reactFlowInstanceRef.current;
        if (!inst) return;
        const prev = prevNodeCountRef.current;
        const curr = nodes.length;
        if (curr > 0 && prev === 0) {
            requestAnimationFrame(() => {
                try { inst.fitView({ padding: 0.2 }); } catch {}
            });
        }
        prevNodeCountRef.current = curr;
    }, [nodes.length]);

    // Event handlers
    const handleExpandNode = useCallback((nodeId: string) => {
        setNarrativeNodes(prev => expandNode(prev, nodeId));
        setLayoutConfig(prev => ({
            ...prev,
            expandedNodes: new Set([...prev.expandedNodes, nodeId])
        }));
    }, []);

    const handleCollapseNode = useCallback((nodeId: string) => {
        setNarrativeNodes(prev => collapseNode(prev, nodeId));
        setLayoutConfig(prev => {
            const newExpanded = new Set(prev.expandedNodes);
            newExpanded.delete(nodeId);
            return { ...prev, expandedNodes: newExpanded };
        });
    }, []);

    const handleNodeClick = useCallback((nodeId: string) => {
        const node = narrativeNodesRef.current.find(n => n.id === nodeId);
        if (node) {
            // Update selection states for all nodes based on relationships
            setNarrativeNodes(prev => updateNodeExpansionStates(prev, nodeId));

            // Update selected node for hierarchical loading
            setLayoutConfig(prev => ({
                ...prev,
                selectedNode: nodeId
            }));
        }
    }, []);

    const handleNodeEdit = useCallback((nodeId: string) => {
        const node = narrativeNodesRef.current.find(n => n.id === nodeId);
        if (node) {
            // If it's a scene, open the encrypted scene editor
            if (node.data.type === 'scene') {
                setSceneEditModal({
                    isOpen: true,
                    sceneId: nodeId,
                    sceneName: (node.data as any).title || 'Untitled Scene'
                });
            } else {
                // For other node types, use the standard edit modal
                setEditingNode(node.data);
                setCreateNodeModal(prev => ({
                    ...prev,
                    isVisible: true,
                    nodeType: node.data.type,
                    parentId: node.data.parentId
                }));
            }
        }
    }, []);

    const handleCharacterClick = useCallback((characterId: string, nodeId: string, event: React.MouseEvent) => {
        // Get click position relative to the viewport
        const position = {
            x: event.clientX,
            y: event.clientY
        };
        
        setCharacterPopup({
            isVisible: true,
            characterId,
            nodeId,
            position
        });
    }, []);

    const handleNodeSelect = useCallback((nodeId: string) => {
        // Update URL without touching global mode/tab; only set selectedNodeId
        const params = new URLSearchParams(location.search);
        params.set('selectedNodeId', nodeId);
        navigate({
            pathname: location.pathname,
            search: params.toString(),
            hash: location.hash
        }, { replace: true });
        // Update local state
        setLayoutConfig(prev => ({
            ...prev,
            selectedNode: nodeId
        }));
    }, [navigate, location]);

    // Breadcrumb navigation handlers
    const handleBreadcrumbNavigate = useCallback((nodeId: string | null) => {
        const params = new URLSearchParams(location.search);
        console.log('handleBreadcrumbNavigate - nodeId:', nodeId);
        console.log('handleBreadcrumbNavigate - current search params:', params.toString());
        if (nodeId) {
            // Navigate to specific node - only update node-related params
            params.set('selectedNodeId', nodeId);
        } else {
            // Navigate to overview (remove selectedNodeId but preserve other params)
            params.delete('selectedNodeId');
        }
        
        // Use navigate to preserve existing book, version, and layout params
        navigate({
            pathname: location.pathname,
            search: params.toString(),
            hash: location.hash
        }, { replace: true });
        
        // Update the layout config
        setLayoutConfig(prev => ({
            ...prev,
            selectedNode: nodeId
        }));
    }, [navigate, location]);

    const handleGoBack = useCallback(() => {
        // Back to overview/root
        handleBreadcrumbNavigate(null);
    }, [handleBreadcrumbNavigate]);

    const handleAddChildNode = useCallback((parentId: string, nodeType: NarrativeNode['type']) => {
        setCreateNodeModal({
            parentId,
            nodeType,
            position: { x: Math.random() * 500 + 100, y: Math.random() * 400 + 100 },
            isVisible: true
        });
        setEditingNode(null);
    }, []);

    // Expand/Collapse All handlers
    const handleExpandAll = useCallback(() => {
        const allNodeIds = narrativeNodes.map(node => node.id);
        setLayoutConfig(prev => ({
            ...prev,
            expandedNodes: new Set(allNodeIds)
        }));
        // Update all nodes to expanded state
        setNarrativeNodes(prev => prev.map(node => ({
            ...node,
            data: { ...node.data, isExpanded: true }
        })));
    }, [narrativeNodes]);

    const handleCollapseAll = useCallback(() => {
        setLayoutConfig(prev => ({
            ...prev,
            expandedNodes: new Set()
        }));
        // Update all nodes to collapsed state
        setNarrativeNodes(prev => prev.map(node => ({
            ...node,
            data: { ...node.data, isExpanded: false }
        })));
    }, []);

    const handleShowAll = useCallback(() => {
        // Show all nodes (disable hierarchical loading)
        setLayoutConfig(prev => ({
            ...prev,
            selectedNode: null // null means show all
        }));
    }, []);

    const handleResetToHierarchy = useCallback(() => {
        // Reset to hierarchical view starting with outline
        const outlineNode = narrativeNodes.find(node => node.data.type === 'outline');
        setLayoutConfig(prev => ({
            ...prev,
            selectedNode: outlineNode?.id || null
        }));
    }, [narrativeNodes]);

    // Auto-layout adjustment function with collision avoidance
    const adjustLayout = useCallback(() => {
        console.debug('[PlotArcsBoard] adjustLayout called');
        setNarrativeNodes(prev => {
            const layoutNodes = generateHierarchicalLayout(prev);
            return layoutNodes;
        });
    }, []);

    // Refresh from persisted plotCanvas (BookContext) and optionally auto-layout afterward
    const refreshFromStore = useCallback(async (doAdjust: boolean = true) => {
        try {
            if (!bookId || !versionId) return;
            const latest = await getPlotCanvas(bookId, versionId);
            const latestNodes = (latest?.nodes || []).map((n: any) => ({ ...n, data: { ...n.data, position: (n as any).data?.position ?? (n as any).position } }));
            const latestEdges = latest?.edges || [];
            setNarrativeNodes(latestNodes);
            setNarrativeEdges(latestEdges);
            if (doAdjust) {
                // Defer to next frame so RF can mount nodes
                requestAnimationFrame(() => adjustLayout());
            }
        } catch (e) {
            console.warn('Failed to refresh plotCanvas on event', e);
        }
    }, [bookId, versionId, getPlotCanvas, adjustLayout]);

    // On first mount after hydration, auto-layout once so structure changes made elsewhere reflect immediately
    const didAutoLayoutOnHydrateRef = useRef(false);
    useEffect(() => {
        if (!didHydrateRef.current) return;
        if (didAutoLayoutOnHydrateRef.current) return;
        if ((narrativeNodes?.length || 0) > 0 && (currentLayout === 'narrative')) {
            didAutoLayoutOnHydrateRef.current = true;
            // Defer to next frame so ReactFlow has nodes
            requestAnimationFrame(() => adjustLayout());
        }
    }, [narrativeNodes?.length, currentLayout, adjustLayout]);

    // Listen for external auto-arrange triggers (e.g., after reorders in header) and key data-change events
    useEffect(() => {
    const onAutoArrange = () => { console.debug('[PlotArcsBoard] plotAutoArrange'); refreshFromStore(true); };
    const onActUpdated = () => { console.debug('[PlotArcsBoard] actUpdated'); refreshFromStore(true); };
    const onChapterUpdated = () => { console.debug('[PlotArcsBoard] chapterUpdated'); refreshFromStore(true); };
        window.addEventListener('plotAutoArrange', onAutoArrange as any);
        window.addEventListener('actUpdated', onActUpdated as any);
        window.addEventListener('chapterUpdated', onChapterUpdated as any);
        return () => {
            window.removeEventListener('plotAutoArrange', onAutoArrange as any);
            window.removeEventListener('actUpdated', onActUpdated as any);
            window.removeEventListener('chapterUpdated', onChapterUpdated as any);
        };
    }, [refreshFromStore]);

    // Custom node types mapping
    // nodeTypes memo is declared later, after all handlers exist

    const handleConnect = useCallback(
        (params: Connection) => {
            // Create connection between nodes
            if (params.source && params.target) {
                // Prevent self-connections
                if (params.source === params.target) {
                    console.log('Cannot connect node to itself');
                    return;
                }

                // Check if this is a parent-child relationship or a cross-reference
                const sourceNode = narrativeNodes.find(n => n.id === params.source);
                const targetNode = narrativeNodes.find(n => n.id === params.target);
                
                if (sourceNode && targetNode) {
                    // Check if connection already exists
                    const hasLinkedConnection = sourceNode.data.linkedNodeIds.includes(params.target);
                    const hasChildConnection = sourceNode.data.childIds.includes(params.target);
                    
                    if (hasLinkedConnection || hasChildConnection) {
                        console.log('Connection already exists between these nodes');
                        return;
                    }

                    // If connecting different types, create a linked relationship
                    if (sourceNode.data.type !== targetNode.data.type || 
                        params.sourceHandle === 'right' || params.targetHandle === 'left') {
                        // Update source node's linkedNodeIds
                        setNarrativeNodes(prev => prev.map(node => 
                            node.id === params.source
                                ? { 
                                    ...node, 
                                    data: { 
                                        ...node.data, 
                                        linkedNodeIds: [...node.data.linkedNodeIds, params.target!] 
                                    }
                                }
                                : node
                        ));
                        
                        // Create the visual edge will be handled by generateEdges function
                        console.log(`Created linked relationship: ${(sourceNode.data as any).title} -> ${(targetNode.data as any).title}`);
                    } else {
                        // For same-type connections (parent-child), update childIds and parentId
                        setNarrativeNodes(prev => prev.map(node => {
                            if (node.id === params.source) {
                                // Add child to source node
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        childIds: [...node.data.childIds, params.target!]
                                    }
                                };
                            } else if (node.id === params.target) {
                                // Set parent for target node
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        parentId: params.source
                                    }
                                };
                            }
                            return node;
                        }));
                        
                        console.log(`Created parent-child relationship: ${(sourceNode.data as any).title} -> ${(targetNode.data as any).title}`);
                    }
                }
            }
        },
        [narrativeNodes]
    );

    // Inline toggle utility used by custom edge
    const toggleEdgeType = useCallback((sourceId: string, targetId: string) => {
        if (!sourceId || !targetId) return;
        const source = narrativeNodesRef.current.find(n => n.id === sourceId);
        const target = narrativeNodesRef.current.find(n => n.id === targetId);
        if (!source || !target) return;
        const isLinked = source.data.linkedNodeIds.includes(targetId);
        const isChild = source.data.childIds.includes(targetId);
        if (!isLinked && !isChild) return;
        setNarrativeNodes(prev => {
            const currentTarget = prev.find(nn => nn.id === targetId);
            const oldParentId = currentTarget?.data.parentId || null;
            return prev.map(n => {
                if (n.id === sourceId) {
                    const linked = n.data.linkedNodeIds.filter(id => id !== targetId);
                    const child = n.data.childIds.filter(id => id !== targetId);
                    return isLinked
                        ? { ...n, data: { ...n.data, linkedNodeIds: linked, childIds: [...child, targetId] } }
                        : { ...n, data: { ...n.data, childIds: child, linkedNodeIds: [...linked, targetId] } };
                }
                if (n.id === targetId) {
                    if (isLinked) {
                        return { ...n, data: { ...n.data, parentId: sourceId } };
                    } else {
                        return { ...n, data: { ...n.data, parentId: n.data.parentId === sourceId ? null : n.data.parentId } } as any;
                    }
                }
                if (isLinked && oldParentId && n.id === oldParentId && oldParentId !== sourceId) {
                    return { ...n, data: { ...n.data, childIds: n.data.childIds.filter(id => id !== targetId) } };
                }
                return n;
            });
        });
        adjustLayout();
    }, [adjustLayout]);

    // Custom edge with inline toggle icon; hide icon for hub edges
    const ToggleEdge = useCallback((edgeProps: any) => {
        const { id, source, target, sourceX, sourceY, targetX, targetY, data } = edgeProps;
        const cx = (sourceX + targetX) / 2;
        const cy = (sourceY + targetY) / 2;
        const hideToggle = String(source).startsWith('hub-') || String(target).startsWith('hub-');
        return (
            <>
                <SmoothStepEdge id={id} {...edgeProps} />
                {!hideToggle && (
                    <EdgeLabelRenderer>
                        <div
                            style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${cx}px, ${cy}px)`, pointerEvents: 'all', zIndex: 5 }}
                            className="react-flow__edge-label"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); (data?.onToggle || toggleEdgeType)(source, target); }}
                                title="Toggle edge type"
                                className="text-[10px] leading-none px-1.5 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 shadow"
                            >
                                ⇄
                            </button>
                        </div>
                    </EdgeLabelRenderer>
                )}
            </>
        );
    }, [toggleEdgeType]);

    const edgeTypes = useMemo(() => ({ toggle: ToggleEdge as any }), [ToggleEdge]);

    // Track when a user starts dragging a connection from a node
    const onConnectStart = useCallback((_: any, params: any) => {
        connectStartNodeIdRef.current = (params && 'nodeId' in params) ? (params.nodeId ?? null) : null;
    }, []);

    // If user ended dragging on empty space, open create modal with parentId = source node
    const onConnectEnd = useCallback((event: any) => {
        const target = event.target as Element | null;
        if (!target?.classList.contains('react-flow__pane')) return;
        const bounds = reactFlowPaneRef.current?.getBoundingClientRect();
        const client = bounds ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top } : { x: event.clientX, y: event.clientY };
        const rf = reactFlowInstanceRef.current;
        const position = rf ? rf.project(client) : client;
        const parentId = connectStartNodeIdRef.current;
        if (!parentId) return;
        console.log('Creating new node from connection drag:', parentId, position);
        lastConnectParentRef.current = parentId;
        setCreateNodeModal({ parentId, nodeType: 'scene', position, isVisible: true });
        setEditingNode(null);
        connectStartNodeIdRef.current = null;
    }, []);

    const handleCreateNode = useCallback((nodeData: Partial<NarrativeNode>) => {
        if (editingNode) {
            // Update existing node - simplified update
            setNarrativeNodes(prev => prev.map(node => {
                if (node.id === editingNode.id && nodeData.data) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            data: nodeData.data
                        } as NarrativeNode
                    };
                }
                return node;
            }));
        } else {
            // Create new node using type and parent from modal or provided nodeData
            // Prefer explicit parentId from modal submission; treat empty string as missing
            let parentId = ((nodeData as any)?.parentId || createNodeModal.parentId || '') as string;
            if (!parentId && lastConnectParentRef.current) parentId = lastConnectParentRef.current;
            const newType = (nodeData as any)?.type ?? createNodeModal.nodeType;
            const newFlowNode = createNewNode(
                newType,
                parentId,
                createNodeModal.position
            );

            console.log('Creating new node:', newFlowNode, 'with data:', nodeData);
            
            if (nodeData.data) {
                // Update the node data safely
                (newFlowNode as any).data.data = nodeData.data;
            }
            
            // Apply both: add the new node and update parent's childIds (if any) in a single update
            setNarrativeNodes(prev => {
                const updated = [...prev, newFlowNode];
                if (!parentId) return updated;
                return updated.map(node => node.id === parentId
                    ? { ...node, data: { ...node.data, childIds: [...node.data.childIds, newFlowNode.id] } }
                    : node
                );
            });
        }
    }, [editingNode, createNodeModal]);

    const handleDeleteNode = useCallback((nodeId: string) => {
        // Show confirmation dialog
        if (confirm('Are you sure you want to delete this node? This action cannot be undone.')) {
            setNarrativeNodes(prev => {
                // Remove the node and update parent's childIds
                const nodeToDelete = prev.find(n => n.id === nodeId);
                if (!nodeToDelete) return prev;

                // Remove node from parent's childIds
                const updatedNodes = prev.map(node => {
                    if (node.data.childIds.includes(nodeId)) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                childIds: node.data.childIds.filter(id => id !== nodeId)
                            }
                        };
                    }
                    return node;
                }).filter(node => node.id !== nodeId); // Remove the actual node

                return updatedNodes;
            });

            // Remove related edges
            setNarrativeEdges(prev => prev.filter(edge => 
                edge.source !== nodeId && edge.target !== nodeId
            ));
        }
    }, []);

    // Stable handlers and nodeTypes to avoid React Flow warning and render loops
    const handlersRef = useRef({
        handleExpandNode,
        handleCollapseNode,
        handleNodeClick,
        handleNodeEdit,
        handleAddChildNode,
        handleDeleteNode,
        handleNodeSelect,
        handleCharacterClick,
        getExpandedNodes: () => layoutConfig.expandedNodes,
        getAllNodes: () => narrativeNodesRef.current,
    });
    useEffect(() => {
        handlersRef.current = {
            handleExpandNode,
            handleCollapseNode,
            handleNodeClick,
            handleNodeEdit,
            handleAddChildNode,
            handleDeleteNode,
            handleNodeSelect,
            handleCharacterClick,
            getExpandedNodes: () => layoutConfig.expandedNodes,
            getAllNodes: () => narrativeNodesRef.current,
        };
    }, [handleExpandNode, handleCollapseNode, handleNodeClick, handleNodeEdit, handleAddChildNode, handleDeleteNode, handleNodeSelect, handleCharacterClick, layoutConfig.expandedNodes]);

    const nodeTypes = useMemo(() => {
        const wrap = (Component: any) => (props: any) => {
            const h = handlersRef.current;
            return (
                <Component
                    {...props}
                    onExpand={h.handleExpandNode}
                    onCollapse={h.handleCollapseNode}
                    onClick={h.handleNodeClick}
                    onEdit={h.handleNodeEdit}
                    onAddChild={h.handleAddChildNode}
                    onDelete={h.handleDeleteNode}
                    onSelect={h.handleNodeSelect}
                    onCharacterClick={h.handleCharacterClick}
                    expandedNodes={h.getExpandedNodes()}
                    allNodes={h.getAllNodes()}
                />
            );
        };
        return {
            outline: wrap(OutlineNodeComponent),
            act: wrap(ActNodeComponent),
            chapter: wrap(ChapterNodeComponent),
            scene: wrap(SceneNodeComponent),
            'character-arc': wrap(CharacterArcNodeComponent),
            'location-arc': wrap(LocationArcNodeComponent),
            'object-arc': wrap(ObjectArcNodeComponent),
            'lore-arc': wrap(LoreArcNodeComponent),
        } as const;
    }, []);

    const handleCloseModal = useCallback(() => {
        setCreateNodeModal(prev => ({ ...prev, isVisible: false }));
        setEditingNode(null);
    }, []);

    const handleDismissSuggestion = useCallback((suggestionId: string) => {
        setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    }, []);


    const handleApplySuggestion = useCallback((suggestionId: string) => {
        // Implement AI suggestion application logic
        console.log('Applying AI suggestion:', suggestionId);
        setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    }, []);

    // Drag & Drop handlers for creating nodes on empty canvas
    const handlePaneClick = useCallback((event: any) => {
        // Check if click is on empty canvas (not on a node)
        if (event.target.classList.contains('react-flow__pane')) {
            const reactFlowBounds = event.currentTarget.getBoundingClientRect();
            const position = {
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            };
            
            // Open create node modal with node type selection
            setCreateNodeModal({
                parentId: null,
                nodeType: 'scene', // Default but will show type selector
                position,
                isVisible: true
            });
            setEditingNode(null);
        }
    }, []);

    const handleDragOver = useCallback((event: any) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((event: any) => {
        event.preventDefault();
        const nodeType = event.dataTransfer.getData('application/reactflow');
        if (!nodeType) return;
        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const position = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        };
        setCreateNodeModal({
            parentId: null,
            nodeType: nodeType as NarrativeNode['type'],
            position,
            isVisible: true
        });
        setEditingNode(null);
    }, []);

    // Node type creation shortcuts
    const createNodeShortcuts = [
        { type: 'outline' as const, label: 'Outline', color: 'purple' },
        { type: 'act' as const, label: 'Act', color: 'blue' },
        { type: 'chapter' as const, label: 'Chapter', color: 'green' },
        { type: 'scene' as const, label: 'Scene', color: 'orange' },
        { type: 'character-arc' as const, label: 'Character Arc', color: 'pink' },
        { type: 'location-arc' as const, label: 'Location Arc', color: 'cyan' },
    ];

    const renderBoardView = () => {
        return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={reactFlowPaneRef}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
                    onInit={(instance) => { reactFlowInstanceRef.current = instance; }}
                    onPaneClick={handlePaneClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    className={`${theme === 'dark' ? 'dark' : ''}`}
                    minZoom={0.1}
                    maxZoom={2}
                    defaultEdgeOptions={{
                        style: { stroke: '#64748b', strokeWidth: 3 },
                        type: 'smoothstep',
                        animated: false,
                    }}
                    connectionLineStyle={{ stroke: '#8b5cf6', strokeWidth: 2 }}
                    connectionLineType={ConnectionLineType.SmoothStep}
                >
                    <Background 
                        color={theme === 'dark' ? '#374151' : '#d1d5db'} 
                        gap={20} 
                    />
                    <Controls />
                    <MiniMap 
                        nodeColor={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                        className={theme === 'dark' ? 'dark' : ''}
                    />
                </ReactFlow>

                {/* Inline edge toggle handled by custom edge component */}

                {/* Floating Controls - replaces the old Panel controls */}
                <FloatingControls
                    // View Controls
                    onExpandAll={handleExpandAll}
                    onCollapseAll={handleCollapseAll}
                    onShowAll={handleShowAll}
                    onResetToHierarchy={handleResetToHierarchy}
                    onAdjustLayout={adjustLayout}
                    
                    // Quick Create
                    createNodeShortcuts={createNodeShortcuts}
                    onCreateNode={(modalData) => {
                        setCreateNodeModal(modalData);
                        setEditingNode(null);
                    }}
                    onDragStart={(event: any, type) => {
                        event.dataTransfer.setData('application/reactflow', type);
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    
                    // Filters
                    filters={layoutConfig.filters}
                    onFiltersChange={(newFilters) => {
                        setLayoutConfig(prev => ({
                            ...prev,
                            filters: newFilters
                        }));
                    }}
                    
                    // Mock data
                    availableCharacters={availableCharacters}
                    availableLocations={availableLocations}
                    availableObjects={availableObjects}
                    availableTimelineEvents={availableTimelineEvents}
                />
            </div>
        );
    };

    const renderListView = () => {
        // Filter nodes for list view
        const filters: NarrativeFilters = {
            ...layoutConfig.filters,
            status: statusFilter === 'all' ? [] : [statusFilter as any]
        };

        const filteredNodes = filterNodes(narrativeNodes, filters, searchQuery);

        return (
            <div className="p-6 space-y-4">
                <div className="grid gap-4">
                    {filteredNodes.map((node) => (
                        <motion.div
                            key={node.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-600"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleNodeClick(node.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-semibold">
                                            {node.data.type.toUpperCase()}
                                        </span>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {node.data.data.title}
                                        </h3>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                        {node.data.data.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span>Goal: {node.data.data.goal}</span>
                                        {node.data.childIds.length > 0 && (
                                            <>
                                                <span>•</span>
                                                <span>{node.data.childIds.length} children</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs rounded-full ${
                                    node.data.status === 'completed' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : node.data.status === 'in-progress'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                    {node.data.status}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Breadcrumb Navigation */}
            <NarrativeBreadcrumb
                selectedNodeId={layoutConfig.selectedNode}
                allNodes={narrativeNodes}
                onNavigateToNode={handleBreadcrumbNavigate}
                onGoBack={handleGoBack}
            />
            
            {/* Content */}
            <div className="flex-1 min-h-0">
                {/* Character Screen Time Layout */}
                {currentLayout === 'character-screentime' ? (
                    <CharacterScreenTimeLayout 
                        narrativeNodes={narrativeNodes}
                        narrativeEdges={narrativeEdges}
                        onNodeSelect={handleNodeSelect}
                        onCharacterClick={handleCharacterClick}
                        onSwapLayout={() => handleLayoutChange('character-heatmap')}
                    />
                                ) : currentLayout === 'character-heatmap' ? (
                    <CharacterAppearanceHeatMap 
                        narrativeNodes={narrativeNodes}
                        narrativeEdges={narrativeEdges}
                        onNodeSelect={handleNodeSelect}
                        onCharacterClick={handleCharacterClick}
                        onSwapLayout={() => handleLayoutChange('character-screentime')}
                    />
                ) : /* Location Layouts */
                currentLayout === 'location-screentime' ? (
                    <LocationScreenTimeLayout 
                        narrativeNodes={narrativeNodes}
                        onSwapLayout={() => handleLayoutChange('location-heatmap')}
                    />
                ) : currentLayout === 'location-heatmap' ? (
                    <LocationAppearanceHeatMap 
                        narrativeNodes={narrativeNodes}
                        onSwapLayout={() => handleLayoutChange('location-screentime')}
                    />
                ) : /* Object Layouts */
                currentLayout === 'object-screentime' ? (
                    <ObjectScreenTimeLayout 
                        narrativeNodes={narrativeNodes}
                        onSwapLayout={() => handleLayoutChange('object-heatmap')}
                    />
                ) : currentLayout === 'object-heatmap' ? (
                    <div className="p-8 text-center text-gray-500">
                        Object Heat Map temporarily disabled for fixes
                    </div>
                    // <ObjectAppearanceHeatMap 
                    //     narrativeNodes={narrativeNodes}
                    //     onSwapLayout={() => handleLayoutChange('object-screentime')}
                    // />
                ) : /* Lore Layouts */
                currentLayout === 'lore-screentime' ? (
                    <LoreScreenTimeLayout 
                        narrativeNodes={narrativeNodes}
                        onSwapLayout={() => handleLayoutChange('lore-heatmap')}
                    />
                ) : currentLayout === 'lore-heatmap' ? (
                    <div className="p-8 text-center text-gray-500">
                        Lore Heat Map temporarily disabled for fixes
                    </div>
                    // <LoreAppearanceHeatMap 
                    //     narrativeNodes={narrativeNodes}
                    //     onSwapLayout={() => handleLayoutChange('lore-screentime')}
                    // />
                ) : /* Narrative layout */
                currentLayout === 'narrative' && viewMode === 'board' ? (
                    <ReactFlowProvider>
                        <div className="w-full h-full">
                            {renderBoardView()}
                        </div>
                    </ReactFlowProvider>
                ) : currentLayout === 'narrative' && viewMode === 'list' ? (
                    <div className="w-full h-full overflow-auto">
                        {renderListView()}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {currentLayout.charAt(0).toUpperCase() + currentLayout.slice(1)} Layout
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                This layout is coming soon!
                            </p>
                            <motion.button
                                onClick={() => handleLayoutChange('narrative')}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Return to Narrative Layout
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>

            {/* Character Details Popup */}
            {characterPopup.isVisible && characterPopup.characterId && (
                <CharacterPopup
                    isVisible={characterPopup.isVisible}
                    characterId={characterPopup.characterId}
                    nodeId={characterPopup.nodeId}
                    position={characterPopup.position}
                    onClose={() => setCharacterPopup({ 
                        isVisible: false, 
                        characterId: '', 
                        nodeId: '', 
                        position: { x: 0, y: 0 } 
                    })}
                />
            )}

            {/* Create/Edit Node Modal */}
            <EnhancedCreateNodeModal
                isVisible={createNodeModal.isVisible}
                modalData={createNodeModal}
                onClose={handleCloseModal}
                onCreate={handleCreateNode}
                existingNode={editingNode}
                availableNodes={narrativeNodes.map(n => n.data)}
            />

            {/* AI Suggestions */}
            <AISuggestions
                suggestions={aiSuggestions}
                onDismiss={handleDismissSuggestion}
                onApply={handleApplySuggestion}
            />

            {/* Encrypted Scene Editor Modal */}
            <SceneEditModal
                isOpen={sceneEditModal.isOpen}
                onClose={() => setSceneEditModal({ isOpen: false })}
                sceneId={sceneEditModal.sceneId}
                bookId={book.id}
                versionId={version.id}
                chapterId="demo-chapter-123" // Demo chapter ID
                sceneName={sceneEditModal.sceneName}
            />
        </div>
    );
};

export default PlotArcsBoard;
