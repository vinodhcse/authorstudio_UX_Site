import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
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
    ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Book, Version, Theme } from '../../../../types';




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
    generateSampleNarrativeData,
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
import { 
    NarrativeFlowNode, 
    NarrativeEdge, 
    NarrativeFilters, 
    NarrativeLayoutConfig,
    AISuggestion,
    CreateNodeModalData,
    NarrativeNode
} from '../../../../types/narrative-layout';

interface PlotArcsBoardProps {
    book: Book;
    version: Version;
    theme: Theme;
    searchQuery?: string;
    viewMode?: 'board' | 'list';
    statusFilter?: 'all' | 'completed' | 'in-progress' | 'planning';
}

const PlotArcsBoard: React.FC<PlotArcsBoardProps> = ({ 
    theme, 
    searchQuery = '', 
    viewMode = 'board', 
    statusFilter = 'all' 
}) => {
    // URL state management for drill-down mode and layout
    const [searchParams] = useSearchParams();
    
    // Get current layout from URL or default to 'narrative'
    const currentLayout = searchParams.get('layout') || 'narrative';

    // Layout change handler
    const handleLayoutChange = useCallback((layoutId: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('layout', layoutId);
        
        // Use history.pushState to preserve the full URL path and all params
        const currentPath = window.location.pathname;
        const newSearch = params.toString();
        window.history.pushState({}, '', `${currentPath}?${newSearch}`);
        
        // Trigger a state update or re-render if needed
        window.dispatchEvent(new PopStateEvent('popstate'));
    }, [searchParams]);

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

    // Custom onNodesChange that persists position changes
    const onNodesChange = useCallback((changes: any[]) => {
        // Apply the changes to the ReactFlow nodes
        defaultOnNodesChange(changes);
        
        // Update position changes in narrativeNodes
        changes.forEach(change => {
            if (change.type === 'position' && change.position) {
                setNarrativeNodes(prev => prev.map(node => 
                    node.id === change.id 
                        ? { ...node, data: { ...node.data, position: change.position } }
                        : node
                ));
            }
        });
    }, [defaultOnNodesChange]);

    // Initialize with sample data
    useEffect(() => {
        const { nodes: sampleNodes, edges: sampleEdges } = generateSampleNarrativeData();
        
        // Apply hierarchical layout with collision avoidance
        const layoutNodes = generateHierarchicalLayout(sampleNodes);
        
        setNarrativeNodes(layoutNodes);
        setNarrativeEdges(sampleEdges);
        // Don't load AI suggestions on initialization
        setAiSuggestions([]);
    }, []);

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
            type: narrativeEdge.type === 'child' ? 'smoothstep' : 'default',
            style: narrativeEdge.style,
            animated: narrativeEdge.animated
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
        const node = narrativeNodes.find(n => n.id === nodeId);
        if (node) {
            // Update selection states for all nodes based on relationships
            setNarrativeNodes(prev => updateNodeExpansionStates(prev, nodeId));

            // Update selected node for hierarchical loading
            setLayoutConfig(prev => ({
                ...prev,
                selectedNode: nodeId
            }));
        }
    }, [narrativeNodes]);

    const handleNodeEdit = useCallback((nodeId: string) => {
        const node = narrativeNodes.find(n => n.id === nodeId);
        if (node) {
            setEditingNode(node.data);
            setCreateNodeModal(prev => ({
                ...prev,
                isVisible: true,
                nodeType: node.data.type,
                parentId: node.data.parentId
            }));
        }
    }, [narrativeNodes]);

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
        // Update URL without page reload
        const params = new URLSearchParams(window.location.search);
        params.set('selectedNodeId', nodeId);
        params.set('mode', 'Planning');
        params.set('tab', 'PlotArcs');
        
        // Use history.pushState instead of navigate to avoid full reload
        window.history.pushState({}, '', `?${params.toString()}`);
        
        // Update the layout config to trigger re-render with new selected node
        setLayoutConfig(prev => ({
            ...prev,
            selectedNode: nodeId
        }));
    }, []);

    // Breadcrumb navigation handlers
    const handleBreadcrumbNavigate = useCallback((nodeId: string | null) => {
        const params = new URLSearchParams(window.location.search);
        
        if (nodeId) {
            // Navigate to specific node - only update node-related params
            params.set('selectedNodeId', nodeId);
            // Preserve mode and tab if they exist, otherwise set defaults
            if (!params.has('mode')) params.set('mode', 'Planning');
            if (!params.has('tab')) params.set('tab', 'PlotArcs');
        } else {
            // Navigate to overview (remove selectedNodeId but preserve other params)
            params.delete('selectedNodeId');
        }
        
        // Preserve existing book, version, and layout params
        const newSearch = params.toString();
        const currentPath = window.location.pathname;
        window.history.pushState({}, '', newSearch ? `${currentPath}?${newSearch}` : currentPath);
        
        // Update the layout config
        setLayoutConfig(prev => ({
            ...prev,
            selectedNode: nodeId
        }));
    }, []);

    const handleGoBack = useCallback(() => {
        // For now, go back to overview. Could be enhanced to go to parent node
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
        setNarrativeNodes(prev => {
            // Apply the hierarchical layout with collision avoidance
            const layoutNodes = generateHierarchicalLayout(prev);
            return layoutNodes;
        });
    }, []);

    // Custom node types mapping
    const nodeTypes = useMemo(() => ({
        outline: (props: any) => (
            <OutlineNodeComponent
                {...props}
                onExpand={handleExpandNode}
                onCollapse={handleCollapseNode}
                onClick={handleNodeClick}
                onEdit={handleNodeEdit}
                onAddChild={handleAddChildNode}
                onDelete={handleDeleteNode}
                onSelect={handleNodeSelect}
                onCharacterClick={handleCharacterClick}
                expandedNodes={layoutConfig.expandedNodes}
                allNodes={narrativeNodes}
            />
        ),
        act: (props: any) => (
            <ActNodeComponent
                {...props}
                onExpand={handleExpandNode}
                onCollapse={handleCollapseNode}
                onClick={handleNodeClick}
                onEdit={handleNodeEdit}
                onAddChild={handleAddChildNode}
                onDelete={handleDeleteNode}
                onSelect={handleNodeSelect}
                onCharacterClick={handleCharacterClick}
                expandedNodes={layoutConfig.expandedNodes}
                allNodes={narrativeNodes}
            />
        ),
        chapter: (props: any) => (
            <ChapterNodeComponent
                {...props}
                onExpand={handleExpandNode}
                onCollapse={handleCollapseNode}
                onClick={handleNodeClick}
                onEdit={handleNodeEdit}
                onAddChild={handleAddChildNode}
                onDelete={handleDeleteNode}
                onSelect={handleNodeSelect}
                onCharacterClick={handleCharacterClick}
                expandedNodes={layoutConfig.expandedNodes}
                allNodes={narrativeNodes}
            />
        ),
        scene: (props: any) => (
            <SceneNodeComponent
                {...props}
                onExpand={handleExpandNode}
                onCollapse={handleCollapseNode}
                onClick={handleNodeClick}
                onEdit={handleNodeEdit}
                onAddChild={handleAddChildNode}
                onDelete={handleDeleteNode}
                onSelect={handleNodeSelect}
                onCharacterClick={handleCharacterClick}
                expandedNodes={layoutConfig.expandedNodes}
                allNodes={narrativeNodes}
            />
        ),
        'character-arc': (props: any) => (
            <CharacterArcNodeComponent
                {...props}
                onExpand={handleExpandNode}
                onCollapse={handleCollapseNode}
                onClick={handleNodeClick}
                onEdit={handleNodeEdit}
                onAddChild={handleAddChildNode}
                onDelete={handleDeleteNode}
                onSelect={handleNodeSelect}
                onCharacterClick={handleCharacterClick}
                expandedNodes={layoutConfig.expandedNodes}
                allNodes={narrativeNodes}
            />
        ),
        'location-arc': (props: any) => (
            <LocationArcNodeComponent
                {...props}
                onExpand={handleExpandNode}
                onCollapse={handleCollapseNode}
                onClick={handleNodeClick}
                onEdit={handleNodeEdit}
                onAddChild={handleAddChildNode}
                onDelete={handleDeleteNode}
                onSelect={handleNodeSelect}
                onCharacterClick={handleCharacterClick}
                expandedNodes={layoutConfig.expandedNodes}
                allNodes={narrativeNodes}
            />
        ),
        'object-arc': (props: any) => (
            <ObjectArcNodeComponent
                {...props}
                onExpand={handleExpandNode}
                onCollapse={handleCollapseNode}
                onClick={handleNodeClick}
                onEdit={handleNodeEdit}
                onAddChild={handleAddChildNode}
                onDelete={handleDeleteNode}
                onSelect={handleNodeSelect}
                onCharacterClick={handleCharacterClick}
                expandedNodes={layoutConfig.expandedNodes}
                allNodes={narrativeNodes}
            />
        ),
        'lore-arc': (props: any) => (
            <LoreArcNodeComponent
                {...props}
                onExpand={handleExpandNode}
                onCollapse={handleCollapseNode}
                onClick={handleNodeClick}
                onEdit={handleNodeEdit}
                onAddChild={handleAddChildNode}
                onDelete={handleDeleteNode}
                onSelect={handleNodeSelect}
                onCharacterClick={handleCharacterClick}
                expandedNodes={layoutConfig.expandedNodes}
                allNodes={narrativeNodes}
            />
        ),
    }), [handleExpandNode, handleCollapseNode, handleNodeClick, handleNodeEdit, handleAddChildNode, handleNodeSelect, handleCharacterClick, layoutConfig.expandedNodes, narrativeNodes]);

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
            // Create new node
            const newFlowNode = createNewNode(
                createNodeModal.nodeType,
                createNodeModal.parentId,
                createNodeModal.position
            );
            
            if (nodeData.data) {
                // Update the node data safely
                (newFlowNode as any).data.data = nodeData.data;
            }
            
            setNarrativeNodes(prev => [...prev, newFlowNode]);

            // Update parent's childIds if this is a child node
            if (createNodeModal.parentId) {
                setNarrativeNodes(prev => prev.map(node => 
                    node.id === createNodeModal.parentId
                        ? { 
                            ...node, 
                            data: { 
                                ...node.data, 
                                childIds: [...node.data.childIds, newFlowNode.id] 
                            }
                        }
                        : node
                ));
            }
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

    const handleCloseModal = useCallback(() => {
        setCreateNodeModal(prev => ({ ...prev, isVisible: false }));
        setEditingNode(null);
    }, []);

    // AI suggestions handlers
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

        // Open create node modal with the dropped node type
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
            <div style={{ width: '100%', height: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}
                    onPaneClick={handlePaneClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    nodeTypes={nodeTypes}
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
                {/* Only show narrative layout for now, other layouts will be implemented later */}
                {currentLayout === 'narrative' && viewMode === 'board' ? (
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
        </div>
    );
};

export default PlotArcsBoard;
