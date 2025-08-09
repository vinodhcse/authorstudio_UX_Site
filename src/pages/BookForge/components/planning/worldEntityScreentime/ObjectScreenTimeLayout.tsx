import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDownIcon, 
    ChevronRightIcon, 
    ChevronLeftIcon,
    FunnelIcon,
    ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import ChargingBarIndicator from '../characterScreentime/ChargingBarIndicator';
import { 
    NarrativeFlowNode
} from '../../../../../types/narrative-layout';

// Types for Object Screen Time matrix layout
interface ObjectEntity {
    id: string;
    name: string;
    type: string;
    origin: string;
    color: string;
    tag?: string;
    parentWorldId: string;
    group?: string; // Object grouping for UI organization
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
    // First check demo objects
    const demoObject = demoObjects.find(o => o.id === objectId);
    if (demoObject) return demoObject.name;
    
    // Fallback to formatted ID
    return objectId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// Extract objects from narrative nodes
const extractObjectsFromNodes = (_nodes: NarrativeFlowNode[]): ObjectEntity[] => {
    // For now, return demo data - in production this would extract from actual node data
    return demoObjects;
};

// Analyze object presence in narrative structure with percentage and tier
const analyzeObjectPresence = (
    objectId: string, 
    narrativeNodes: NarrativeFlowNode[]
): { 
    percentage: number; 
    tier: string;
    primary: number; 
    supporting: number; 
    mentioned: number; 
    absent: number; 
    total: number; 
} => {
    const sceneNodes = narrativeNodes.filter(node => node.type === 'scene');
    const total = sceneNodes.length;
    
    if (total === 0) {
        // Return demo data for visualization
        const demoData = getDemoObjectPresence(objectId);
        return demoData;
    }

    let primary = 0;
    let supporting = 0; 
    let mentioned = 0;
    let absent = 0;

    sceneNodes.forEach(node => {
        const sceneData = node.data as any;
        const objects = sceneData?.objects || [];
        
        if (objects.includes(objectId)) {
            // For simplicity, consider main object as primary, others as supporting
            if (objects[0] === objectId) {
                primary++;
            } else {
                supporting++;
            }
        } else {
            // Check if mentioned in description (simplified check)
            const description = sceneData?.description || '';
            const objectName = getObjectName(objectId);
            if (description.toLowerCase().includes(objectName.toLowerCase())) {
                mentioned++;
            } else {
                absent++;
            }
        }
    });

    // Calculate percentage and determine tier
    const presenceCount = primary + supporting + mentioned;
    const percentage = Math.round((presenceCount / total) * 100);
    
    let tier = 'Absent';
    if (primary > 0) {
        tier = primary >= total * 0.3 ? 'Primary Object' : 'Major Object';
    } else if (supporting > 0) {
        tier = supporting >= total * 0.2 ? 'Supporting Object' : 'Minor Object';
    } else if (mentioned > 0) {
        tier = 'Mentioned Only';
    }

    return { percentage, tier, primary, supporting, mentioned, absent, total };
};

// Helper function to provide demo data for object presence
const getDemoObjectPresence = (objectId: string) => {
    const demoPresenceData: Record<string, any> = {
        'elder-wand': { percentage: 75, tier: 'Primary Object', primary: 8, supporting: 6, mentioned: 2, absent: 2, total: 18 },
        'invisibility-cloak': { percentage: 60, tier: 'Primary Object', primary: 5, supporting: 7, mentioned: 3, absent: 3, total: 18 },
        'philosophers-stone': { percentage: 40, tier: 'Supporting Object', primary: 3, supporting: 4, mentioned: 5, absent: 6, total: 18 },
        'sorting-hat': { percentage: 25, tier: 'Minor Object', primary: 1, supporting: 2, mentioned: 6, absent: 9, total: 18 },
        'marauders-map': { percentage: 35, tier: 'Supporting Object', primary: 2, supporting: 3, mentioned: 7, absent: 6, total: 18 },
        'time-turner': { percentage: 20, tier: 'Minor Object', primary: 1, supporting: 1, mentioned: 5, absent: 11, total: 18 },
        'nimbus-2000': { percentage: 15, tier: 'Mentioned Only', primary: 0, supporting: 2, mentioned: 4, absent: 12, total: 18 },
        'remembrall': { percentage: 8, tier: 'Mentioned Only', primary: 0, supporting: 0, mentioned: 3, absent: 15, total: 18 },
        'chocolate-frog': { percentage: 12, tier: 'Mentioned Only', primary: 0, supporting: 1, mentioned: 3, absent: 14, total: 18 },
    };
    
    return demoPresenceData[objectId] || { percentage: 5, tier: 'Absent', primary: 0, supporting: 0, mentioned: 1, absent: 17, total: 18 };
};

// Component props interface
interface ObjectScreenTimeLayoutProps {
    narrativeNodes: NarrativeFlowNode[];
    selectedWorldId?: string;
    onSwapLayout?: () => void;
}

const ObjectScreenTimeLayout: React.FC<ObjectScreenTimeLayoutProps> = ({ 
    narrativeNodes,
    selectedWorldId,
    onSwapLayout 
}) => {
    // Filter and selection state
    const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Scrolling state and carousel controls
    const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const contentScrollRef = useRef<HTMLDivElement>(null);
    const objectColumnWidth = 128; // 32 * 4 (w-32 in Tailwind)

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

    // Handle object selection toggle
    const handleObjectToggle = useCallback((objectId: string) => {
        setSelectedObjectIds(prev => 
            prev.includes(objectId)
                ? prev.filter(id => id !== objectId)
                : [...prev, objectId]
        );
    }, []);

    // Handle content scroll synchronization  
    const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        if (scrollContainerRef.current && scrollContainerRef.current.scrollLeft !== scrollLeft) {
            scrollContainerRef.current.scrollLeft = scrollLeft;
        }
        setCurrentScrollPosition(scrollLeft);
    }, []);

    // Handle header scroll synchronization
    const handleHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        if (contentScrollRef.current && contentScrollRef.current.scrollLeft !== scrollLeft) {
            contentScrollRef.current.scrollLeft = scrollLeft;
        }
        setCurrentScrollPosition(scrollLeft);
    }, []);

    // Carousel navigation functions
    const scrollLeft = useCallback(() => {
        const newPosition = Math.max(0, currentScrollPosition - objectColumnWidth * 3);
        if (scrollContainerRef.current && contentScrollRef.current) {
            scrollContainerRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
            contentScrollRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
            setCurrentScrollPosition(newPosition);
        }
    }, [currentScrollPosition, objectColumnWidth]);

    const scrollRight = useCallback(() => {
        const totalVisibleWidth = filteredObjects.length * objectColumnWidth;
        const containerWidth = scrollContainerRef.current?.clientWidth || 0;
        const maxScroll = Math.max(0, totalVisibleWidth - containerWidth);
        const newPosition = Math.min(maxScroll, currentScrollPosition + objectColumnWidth * 3);
        if (scrollContainerRef.current && contentScrollRef.current) {
            scrollContainerRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
            contentScrollRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
            setCurrentScrollPosition(newPosition);
        }
    }, [currentScrollPosition, filteredObjects.length, objectColumnWidth]);

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

    // Recursive function to render object columns for hierarchy
    const renderObjectColumns = useCallback((nodes: NarrativeFlowNode[], object: ObjectEntity, level: number = 0): React.ReactElement[] => {
        return nodes.map(node => {
            const nodeData = node.data as any;
            const hasChildren = nodeData.childIds && nodeData.childIds.length > 0;
            const isExpanded = expandedNodes.has(node.id);
            
            const childNodes = hasChildren ? narrativeNodes.filter(n => 
                nodeData.childIds.includes(n.id) && 
                ['act', 'chapter', 'scene'].includes(n.data.type)
            ) : [];

            return (
                <React.Fragment key={`${object.id}-${node.id}`}>
                    {/* Object presence indicator for this node */}
                    <div className="w-[120px] flex-shrink-0 p-2 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <ChargingBarIndicator
                            percentage={analyzeObjectPresence(object.id, [node]).percentage}
                            tier={analyzeObjectPresence(object.id, [node]).tier}
                            characterColor={object.color}
                            characterName={object.name}
                            plotNode={nodeData?.title || `${node.data.type} ${node.id}`}
                        />
                    </div>
                    
                    {/* Child node columns if expanded */}
                    {hasChildren && isExpanded && renderObjectColumns(childNodes, object, level + 1)}
                </React.Fragment>
            );
        });
    }, [narrativeNodes, expandedNodes]);

    // Render hierarchical node rows with expandable structure  
    const renderNodeRows = useCallback((nodes: NarrativeFlowNode[], level: number = 0): React.ReactElement[] => {
        return nodes.map(node => {
            const nodeData = node.data as any;
            const hasChildren = nodeData.childIds && nodeData.childIds.length > 0;
            const isExpanded = expandedNodes.has(node.id);
            
            const childNodes = hasChildren ? narrativeNodes.filter(n => 
                nodeData.childIds.includes(n.id) && 
                ['act', 'chapter', 'scene'].includes(n.data.type)
            ) : [];

            const handleNodeClick = () => {
                if (hasChildren) {
                    handleNodeToggle(node.id);
                }
            };

            return (
                <React.Fragment key={node.id}>
                    {/* Node row */}
                    <div 
                        className="border-b border-gray-200 dark:border-gray-700 p-4 cursor-pointer h-20 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={handleNodeClick}
                        style={{ paddingLeft: `${level * 20 + 16}px` }}
                    >
                        <div className="flex items-center min-w-0 flex-1">
                            {hasChildren && (
                                <div className="flex-shrink-0 mr-2">
                                    {isExpanded ? (
                                        <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    ) : (
                                        <ChevronRightIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    )}
                                </div>
                            )}
                            
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                    {nodeData?.title || `${node.data.type} ${node.id}`}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {node.data.type === 'scene' ? `Scene • ${nodeData?.chapter || 'Unassigned'}` : node.data.type}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Child rows if expanded */}
                    {hasChildren && isExpanded && (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderNodeRows(childNodes, level + 1)}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </React.Fragment>
            );
        });
    }, [narrativeNodes, expandedNodes, filteredObjects, handleNodeToggle]);

    // Get nodes to display - start from Acts as top level, then Chapters and Scenes
    const rootNodes = useMemo(() => {
        // Find the outline node first
        const outlineNode = narrativeNodes.find(node => node.data.type === 'outline');
        
        if (outlineNode && outlineNode.data.childIds) {
            // Get Acts as root nodes (children of outline)
            return narrativeNodes.filter(node => 
                outlineNode.data.childIds.includes(node.id) && 
                node.data.type === 'act'
            ).sort((a, b) => a.position.y - b.position.y);
        }
        
        // Fallback to acts if no outline found
        return narrativeNodes.filter(node => node.data.type === 'act')
            .sort((a, b) => a.position.y - b.position.y);
    }, [narrativeNodes]);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header with controls */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Object Screen Time Analysis
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

            {/* Matrix Content */}
            <div className="flex-1 overflow-hidden">
                {/* Header row with fixed first column and scrollable object headers */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 relative">
                    {/* Fixed first column header */}
                    <div className="w-80 min-w-80 bg-gray-100 dark:bg-gray-800 p-3 font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                        Narrative Structure
                    </div>
                    
                    {/* Scrollable object headers */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 overflow-x-auto no-scrollbar"
                        onScroll={handleHeaderScroll}
                    >
                        <div className="flex">
                            {filteredObjects.map(object => (
                                <div 
                                    key={object.id}
                                    className="w-32 min-w-32 flex-shrink-0 p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: object.color }}
                                        />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                            {object.name}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {object.type}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate">
                                        {object.origin}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Overlay carousel buttons - positioned over the entire header row */}
                    <button
                        onClick={scrollLeft}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all opacity-80 hover:opacity-100"
                        title="Scroll Left"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                        onClick={scrollRight}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all opacity-80 hover:opacity-100"
                        title="Scroll Right"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Matrix content with fixed first column and scrollable object columns */}
                <div className="flex flex-1 overflow-y-auto max-h-[600px]">
                    {/* Fixed first column - narrative structure */}
                    <div className="w-80 min-w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                        {renderNodeRows(rootNodes)}
                    </div>

                    {/* Object columns - synchronized with headers above */}
                    <div 
                        ref={contentScrollRef}
                        className="flex-1 overflow-x-auto no-scrollbar"
                        onScroll={handleContentScroll}
                    >
                        <div className="flex-shrink-0">
                            {/* Individual object columns */}
                            <div className="flex">
                                {filteredObjects.map(object => (
                                    <AnimatePresence key={object.id}>
                                        <motion.div 
                                            className="w-32 min-w-32 border-r border-gray-200 dark:border-gray-700"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 128 }}
                                            exit={{ opacity: 0, width: 0 }}
                                        >
                                            {renderObjectColumns(rootNodes, object)}
                                        </motion.div>
                                    </AnimatePresence>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator - removed as not needed with carousel controls */}
        </div>
    );
};

export default ObjectScreenTimeLayout;
