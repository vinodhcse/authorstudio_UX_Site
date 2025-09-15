import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FunnelIcon,
    ArrowsRightLeftIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
    NarrativeFlowNode
} from '../../../../../types/narrative-layout';
import ChargingBarIndicator from '../characterScreentime/ChargingBarIndicator';

// Types for Object Appearance Heat Map
interface ObjectEntity {
    id: string;
    name: string;
    type: string;
    origin: string;
    color: string;
    tag?: string;
    parentWorldId: string;
    group?: string;
}

// Demo objects with proper grouping
const demoObjects: ObjectEntity[] = [
    // Primary Objects
    { id: 'elder-wand', name: 'Elder Wand', type: 'Magical Artifact', origin: 'Death', color: '#3B82F6', parentWorldId: 'wizarding-world', group: 'Primary' },
    { id: 'invisibility-cloak', name: 'Invisibility Cloak', type: 'Magical Artifact', origin: 'Potter Family', color: '#EF4444', parentWorldId: 'wizarding-world', group: 'Primary' },
    { id: 'philosophers-stone', name: 'Philosopher\'s Stone', type: 'Magical Artifact', origin: 'Nicolas Flamel', color: '#10B981', parentWorldId: 'wizarding-world', group: 'Primary' },
    
    // Secondary Objects
    { id: 'sorting-hat', name: 'Sorting Hat', type: 'Magical Object', origin: 'Godric Gryffindor', color: '#F59E0B', parentWorldId: 'wizarding-world', group: 'Secondary' },
    { id: 'marauders-map', name: 'Marauder\'s Map', type: 'Magical Document', origin: 'Marauders', color: '#8B5CF6', parentWorldId: 'wizarding-world', group: 'Secondary' },
    { id: 'time-turner', name: 'Time-Turner', type: 'Magical Device', origin: 'Ministry of Magic', color: '#EC4899', parentWorldId: 'wizarding-world', group: 'Secondary' },
    
    // Tertiary Objects  
    { id: 'nimbus-2000', name: 'Nimbus 2000', type: 'Broomstick', origin: 'Nimbus Racing Broom Company', color: '#06B6D4', parentWorldId: 'wizarding-world', group: 'Tertiary' },
    { id: 'remembrall', name: 'Remembrall', type: 'Magical Trinket', origin: 'Unknown', color: '#84CC16', parentWorldId: 'wizarding-world', group: 'Tertiary' },
    { id: 'chocolate-frog', name: 'Chocolate Frog Cards', type: 'Collectible', origin: 'Honeydukes', color: '#F97316', parentWorldId: 'wizarding-world', group: 'Tertiary' },
];

// Helper function to get object name from ID
const getObjectName = (objectId: string): string => {
    const demoObject = demoObjects.find(o => o.id === objectId);
    if (demoObject) return demoObject.name;
    
    return objectId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// Extract objects from narrative nodes
const extractObjectsFromNodes = (_nodes: NarrativeFlowNode[]): ObjectEntity[] => {
    return demoObjects;
};

// Component props interface
interface ObjectAppearanceHeatMapProps {
    narrativeNodes: NarrativeFlowNode[];
    selectedWorldId?: string;
    onSwapLayout?: () => void;
}

const ObjectAppearanceHeatMap: React.FC<ObjectAppearanceHeatMapProps> = ({ 
    narrativeNodes,
    selectedWorldId,
    onSwapLayout 
}) => {
    // Filter and selection state
    const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Scrolling state
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();

    // Extract and filter objects
    const allObjects = useMemo(() => {
        const extracted = extractObjectsFromNodes(narrativeNodes);
        // Filter by selected world if specified
        if (selectedWorldId) {
            return extracted.filter(object => object.parentWorldId === selectedWorldId);
        }
        return extracted;
    }, [narrativeNodes, selectedWorldId]);

    // Filter objects based on search and selection
    const filteredObjects = useMemo(() => {
        let filtered = allObjects;
        
        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(object =>
                object.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                object.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                object.origin.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply selection filter
        if (selectedObjectIds.length > 0) {
            filtered = filtered.filter(object => selectedObjectIds.includes(object.id));
        }
        
        return filtered;
    }, [allObjects, searchQuery, selectedObjectIds]);

    // Group objects by category for filtering UI
    const objectsByGroup = useMemo(() => {
        return allObjects.reduce((acc, object) => {
            const group = object.group || 'Other';
            if (!acc[group]) acc[group] = [];
            acc[group].push(object);
            return acc;
        }, {} as Record<string, ObjectEntity[]>);
    }, [allObjects]);

    // Build hierarchical narrative structure for columns
    const narrativeStructure = useMemo(() => {
        // Create a hierarchical structure: Outline -> Acts -> Chapters -> Scenes
        const rootNodes = narrativeNodes.filter(node => !node.parentId);
        
        const buildHierarchy = (parentNode: NarrativeFlowNode): any => {
            const children = narrativeNodes
                .filter(node => node.parentId === parentNode.id)
                .sort((a, b) => a.position.y - b.position.y);
            
            return {
                ...parentNode,
                children: children.map(child => buildHierarchy(child))
            };
        };
        
        return rootNodes
            .sort((a, b) => a.position.y - b.position.y)
            .map(root => buildHierarchy(root));
    }, [narrativeNodes]);

    // Calculate hierarchical column layout
    const calculateColumnLayout = useCallback(() => {
        const layout: Array<Array<{ node: NarrativeFlowNode; span: number; level: number; parentPath: string[]; position: number }>> = [];
        
        const processNodes = (nodes: NarrativeFlowNode[], level: number, parentPath: string[] = [], startPosition: number = 0) => {
            let currentPosition = startPosition;
            
            for (const node of nodes) {
                const isExpanded = expandedNodes.has(node.id);
                const hasChildren = node.data.childIds && node.data.childIds.length > 0;
                const childNodes = hasChildren ? narrativeNodes.filter(n => node.data.childIds.includes(n.id)) : [];
                const hasValidChildren = childNodes.length > 0;
                
                if (isExpanded && hasValidChildren) {
                    // Calculate total span for this expanded node based on its children
                    let totalChildSpan = 0;
                    
                    // First pass: calculate spans for all children
                    for (const child of childNodes) {
                        const childIsExpanded = expandedNodes.has(child.id);
                        const childHasChildren = child.data.childIds && child.data.childIds.length > 0;
                        const grandChildNodes = childHasChildren ? narrativeNodes.filter(n => child.data.childIds.includes(n.id)) : [];
                        const childSpan = (childIsExpanded && grandChildNodes.length > 0) ? grandChildNodes.length : 1;
                        totalChildSpan += childSpan;
                    }
                    
                    // Add parent node to this level
                    if (!layout[level]) layout[level] = [];
                    layout[level].push({ 
                        node, 
                        span: totalChildSpan, 
                        level,
                        parentPath: [...parentPath],
                        position: currentPosition
                    });
                    
                    // Process children at next level with proper positioning
                    processNodes(childNodes, level + 1, [...parentPath, node.id], currentPosition);
                    currentPosition += totalChildSpan;
                } else {
                    // Add node to this level with span of 1 (either not expanded or no valid children)
                    if (!layout[level]) layout[level] = [];
                    layout[level].push({ 
                        node, 
                        span: 1, 
                        level,
                        parentPath: [...parentPath],
                        position: currentPosition
                    });
                    currentPosition += 1;
                }
            }
        };
        
        processNodes(rootNodes, 0);
        return layout;
    }, [expandedNodes, narrativeNodes, rootNodes]);

    // Get nodes that should appear at the final level
    const getFinalLevelNodes = useCallback((): NarrativeFlowNode[] => {
        const finalNodes: NarrativeFlowNode[] = [];
        
        const processNode = (node: NarrativeFlowNode): void => {
            const isExpanded = expandedNodes.has(node.id);
            const hasChildren = node.data.childIds && node.data.childIds.length > 0;
            const childNodes = hasChildren ? narrativeNodes.filter(n => node.data.childIds.includes(n.id)) : [];
            
            if (isExpanded && childNodes.length > 0) {
                // Process children instead of adding this node
                childNodes.forEach(child => processNode(child));
            } else {
                // This is a final node (either leaf or collapsed)
                finalNodes.push(node);
            }
        };
        
        rootNodes.forEach(root => processNode(root));
        return finalNodes;
    }, [expandedNodes, narrativeNodes, rootNodes]);

    // Add rootNodes definition
    const rootNodes = useMemo(() => {
        return narrativeNodes.filter(node => !node.data.parentId);
    }, [narrativeNodes]);

    const columnLayout = useMemo(() => calculateColumnLayout(), [calculateColumnLayout]);

    // Calculate object presence in specific node
    const calculateObjectPresence = (objectId: string, node: any): string => {
        if (node.type !== 'scene') return 'absent';
        
        const sceneData = node.data as any;
        const objects = sceneData?.objects || [];
        
        if (objects.includes(objectId)) {
            return objects[0] === objectId ? 'primary' : 'supporting';
        }
        
        // Check if mentioned in description
        const description = sceneData?.description || '';
        const objectName = getObjectName(objectId);
        if (description.toLowerCase().includes(objectName.toLowerCase())) {
            return 'mentioned';
        }
        
        return 'absent';
    };

    // Handle object selection toggle
    const handleObjectToggle = useCallback((objectId: string) => {
        setSelectedObjectIds(prev => 
            prev.includes(objectId)
                ? prev.filter(id => id !== objectId)
                : [...prev, objectId]
        );
    }, []);

    // Handle scroll events
    const handleScroll = useCallback(() => {
        setIsScrolling(true);
        
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 150);
    }, []);

    // Handle node expansion
    const handleNodeToggle = useCallback((nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSelectedObjectIds([]);
        setSearchQuery('');
    }, []);

    // Quick filter functions
    const selectPrimaryObjects = useCallback(() => {
        const primaryIds = allObjects
            .filter(object => object.group === 'Primary')
            .map(object => object.id);
        setSelectedObjectIds(primaryIds);
    }, [allObjects]);

    const selectSecondaryObjects = useCallback(() => {
        const secondaryIds = allObjects
            .filter(object => object.group === 'Secondary')
            .map(object => object.id);
        setSelectedObjectIds(secondaryIds);
    }, [allObjects]);

    const selectAllObjects = useCallback(() => {
        setSelectedObjectIds(allObjects.map(object => object.id));
    }, [allObjects]);

    // Render hierarchical column headers
    const renderHierarchicalLayout = () => {
        const finalNodes = getFinalLevelNodes();
        const headerLevels = columnLayout.length;

        return (
            <div className="flex flex-col">
                {/* Multi-level headers */}
                <div className="flex">
                    {/* Object header spanning all levels */}
                    <div 
                        className="w-80 min-w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center"
                        style={{ height: `${headerLevels * 64}px` }}
                    >
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Objects</span>
                    </div>
                    
                    {/* Narrative structure headers */}
                    <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 flex-1">
                        {columnLayout.map((levelNodes, levelIndex) => {
                            const totalColumns = finalNodes.length;
                            return (
                                <div 
                                    key={levelIndex} 
                                    className="h-16 bg-gray-50 dark:bg-gray-800"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${totalColumns}, 128px)`,
                                        minWidth: `${totalColumns * 128}px`
                                    }}
                                >
                                    {levelNodes.map((layoutItem) => {
                                        const { node, span, position } = layoutItem;
                                        const nodeData = node.data;
                                        const hasChildren = nodeData.childIds && nodeData.childIds.length > 0;
                                        const isExpanded = expandedNodes.has(node.id);
                                        const title = (nodeData.data as any)?.title || `${nodeData.type} ${node.id}`;
                                        
                                        // For scenes, show "Scene - [index]" format
                                        let displayTitle = title;
                                        if (nodeData.type === 'scene') {
                                            const sceneMatch = title.match(/scene\s*(\d+)/i);
                                            if (sceneMatch) {
                                                displayTitle = `Scene - ${sceneMatch[1]}`;
                                            } else {
                                                const parts = title.split(/[-:]/);
                                                const lastPart = parts[parts.length - 1].trim();
                                                displayTitle = `Scene - ${lastPart}`;
                                            }
                                        }

                                        const handleNodeClick = () => {
                                            const childNodes = hasChildren ? narrativeNodes.filter(n => nodeData.childIds.includes(n.id)) : [];
                                            const hasValidChildren = childNodes.length > 0;
                                            
                                            if (hasValidChildren) {
                                                setExpandedNodes(prev => {
                                                    const newSet = new Set(prev);
                                                    if (isExpanded) {
                                                        newSet.delete(node.id);
                                                    } else {
                                                        newSet.add(node.id);
                                                    }
                                                    return newSet;
                                                });
                                            }
                                        };

                                        return (
                                            <div
                                                key={`${levelIndex}-${node.id}`}
                                                className={`relative flex items-center justify-center p-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                    nodeData.type === 'act' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                                    nodeData.type === 'chapter' ? 'bg-green-50 dark:bg-green-900/20' :
                                                    'bg-orange-50 dark:bg-orange-900/20'
                                                }`}
                                                style={{
                                                    gridColumnStart: position + 1,
                                                    gridColumnEnd: position + span + 1
                                                }}
                                                onClick={handleNodeClick}
                                            >
                                                <div className="flex items-center gap-1 text-xs font-medium truncate">
                                                    {hasChildren && (
                                                        <span className="text-gray-400">
                                                            {isExpanded ? '▼' : '▶'}
                                                        </span>
                                                    )}
                                                    <span className="truncate">{displayTitle}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Matrix content with scrollable narrative columns */}
                <div className="flex flex-1 overflow-y-auto max-h-[600px]">
                    {/* Fixed first column - object names */}
                    <div className="w-80 min-w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                        {filteredObjects.map((object) => (
                            <div key={object.id} className="h-20 p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                                <div className="flex items-center gap-2 w-full">
                                    <div 
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: object.color }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                            {object.name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {object.type} • {object.origin}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Scrollable narrative columns with object presence indicators */}
                    <div 
                        className="flex-1 overflow-x-auto"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${finalNodes.length}, 128px)`,
                            minWidth: `${finalNodes.length * 128}px`
                        }}
                    >
                        {finalNodes.map((node, nodeIndex) => (
                            <div key={node.id} className="border-r border-gray-200 dark:border-gray-700">
                                {filteredObjects.map((object) => {
                                    const presence = calculateObjectPresence(object.id, node);
                                    const cellColor = presence === 'primary' ? object.color :
                                                    presence === 'supporting' ? `${object.color}80` :
                                                    presence === 'mentioned' ? `${object.color}40` : 'transparent';
                                    
                                    return (
                                        <div 
                                            key={`${object.id}-${node.id}`}
                                            className="h-20 border-b border-gray-200 dark:border-gray-700 relative group flex items-center justify-center"
                                            style={{ backgroundColor: cellColor }}
                                        >
                                            {presence !== 'none' && (
                                                <div className="w-full h-full flex items-center justify-center opacity-75 group-hover:opacity-100 transition-opacity">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        presence === 'primary' ? 'bg-white' :
                                                        presence === 'supporting' ? 'bg-white/80' :
                                                        'bg-white/60'
                                                    }`} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header with controls */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                <div className="text-xs text-gray-500 capitalize">
                                    {node.type}
                                </div>
                                {node.type === 'scene' && (
                                    <div className="text-xs text-gray-400">
                                        Scene
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {/* Object rows */}
                {filteredObjects.map((object) => (
                    <React.Fragment key={object.id}>
                        {/* Object name cell */}
                        <div className="bg-white dark:bg-gray-900 p-3 border-r border-gray-200 dark:border-gray-700 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: object.color }}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                        {object.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {object.type} • {object.origin}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Object presence cells */}
                        {finalNodes.map((node, nodeIndex) => {
                            const presence = calculateObjectPresence(object.id, node);
                            const cellColor = presence === 'primary' ? object.color :
                                            presence === 'supporting' ? `${object.color}80` :
                                            presence === 'mentioned' ? `${object.color}40` : 'transparent';
                            
                            return (
                                <div 
                                    key={`${object.id}-${node.id}`}
                                    className="border-r border-gray-200 dark:border-gray-700 border-b border-gray-100 dark:border-gray-800 h-16 relative group"
                                    style={{
                                        gridColumnStart: nodeIndex + 2,
                                        gridColumnEnd: nodeIndex + 3,
                                        backgroundColor: cellColor
                                    }}
                                >
                                    {presence !== 'absent' && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className={`
                                                w-2 h-2 rounded-full
                                                ${presence === 'primary' ? 'bg-white shadow-lg' : 
                                                  presence === 'supporting' ? 'bg-white/80' : 
                                                  'bg-white/60'}
                                            `} />
                                        </div>
                                    )}
                                    
                                    {/* Hover tooltip */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-xs p-2 flex items-center justify-center text-center pointer-events-none z-10">
                                        <div>
                                            <div className="font-medium">{object.name}</div>
                                            <div>in {(node.data as any)?.title || node.type}</div>
                                            <div className="capitalize text-gray-300">{presence}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header with controls */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Object Appearance Heat Map
                    </h2>
                    
                    {/* Swap Layout Button */}
                    {onSwapLayout && (
                        <button
                            onClick={onSwapLayout}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                            <ArrowsRightLeftIcon className="h-4 w-4" />
                            Swap Layout
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search objects..."
                            className="w-64 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors
                                ${selectedObjectIds.length > 0 
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }
                            `}
                        >
                            <FunnelIcon className="h-4 w-4" />
                            Filter ({selectedObjectIds.length})
                        </button>

                        {/* Filter Dropdown */}
                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                                >
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium text-gray-900 dark:text-white">Filter Objects</h3>
                                            <button
                                                onClick={clearAllFilters}
                                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                            >
                                                Clear All
                                            </button>
                                        </div>

                                        {/* Quick Filters */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <button
                                                onClick={selectAllObjects}
                                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                            >
                                                All Objects
                                            </button>
                                            <button
                                                onClick={selectPrimaryObjects}
                                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                            >
                                                Primary
                                            </button>
                                            <button
                                                onClick={selectSecondaryObjects}
                                                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                                            >
                                                Secondary
                                            </button>
                                        </div>

                                        {/* Object Groups */}
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {Object.entries(objectsByGroup).map(([group, objects]) => (
                                                <div key={group}>
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {group} ({objects.length})
                                                    </h4>
                                                    <div className="space-y-1 pl-2">
                                                        {objects.map(object => (
                                                            <label 
                                                                key={object.id}
                                                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedObjectIds.includes(object.id)}
                                                                    onChange={() => handleObjectToggle(object.id)}
                                                                    className="rounded border-gray-300 dark:border-gray-600"
                                                                />
                                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                    <div 
                                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                                        style={{ backgroundColor: object.color }}
                                                                    />
                                                                    <span className="text-sm text-gray-900 dark:text-white truncate">
                                                                        {object.name}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 truncate">
                                                                        {object.type}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Heat Map Content */}
            <div className="flex-1 overflow-auto" onScroll={handleScroll}>
                <div className="min-w-max">
                    {renderHierarchicalLayout()}
                </div>
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <InformationCircleIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">Legend:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Primary Object</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-300 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Supporting Object</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-100 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Mentioned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Absent</span>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <AnimatePresence>
                {isScrolling && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-4 right-4 bg-black/75 text-white px-3 py-1 rounded-full text-sm"
                    >
                        Scrolling...
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ObjectAppearanceHeatMap;
