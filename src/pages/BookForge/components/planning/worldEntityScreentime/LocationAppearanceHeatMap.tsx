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

// Types for Location Appearance Heat Map
interface LocationEntity {
    id: string;
    name: string;
    type: string;
    region: string;
    color: string;
    tag?: string;
    parentWorldId: string;
    group?: string;
}

// Demo locations with proper grouping
const demoLocations: LocationEntity[] = [
    // Primary Locations
    { id: 'hogwarts', name: 'Hogwarts School', type: 'School', region: 'Scotland', color: '#3B82F6', parentWorldId: 'wizarding-world', group: 'Primary' },
    { id: 'diagon-alley', name: 'Diagon Alley', type: 'Market Street', region: 'London', color: '#EF4444', parentWorldId: 'wizarding-world', group: 'Primary' },
    { id: 'privet-drive', name: 'Privet Drive', type: 'Residential', region: 'Surrey', color: '#10B981', parentWorldId: 'muggle-world', group: 'Primary' },
    
    // Secondary Locations
    { id: 'forbidden-forest', name: 'Forbidden Forest', type: 'Forest', region: 'Hogwarts Grounds', color: '#F59E0B', parentWorldId: 'wizarding-world', group: 'Secondary' },
    { id: 'hogsmeade', name: 'Hogsmeade Village', type: 'Village', region: 'Scotland', color: '#8B5CF6', parentWorldId: 'wizarding-world', group: 'Secondary' },
    { id: 'kings-cross', name: 'King\'s Cross Station', type: 'Transport Hub', region: 'London', color: '#EC4899', parentWorldId: 'muggle-world', group: 'Secondary' },
    
    // Tertiary Locations  
    { id: 'quidditch-pitch', name: 'Quidditch Pitch', type: 'Sports Ground', region: 'Hogwarts', color: '#06B6D4', parentWorldId: 'wizarding-world', group: 'Tertiary' },
    { id: 'gringotts', name: 'Gringotts Bank', type: 'Bank', region: 'Diagon Alley', color: '#84CC16', parentWorldId: 'wizarding-world', group: 'Tertiary' },
    { id: 'dursley-house', name: 'Dursley House', type: 'Residence', region: 'Privet Drive', color: '#F97316', parentWorldId: 'muggle-world', group: 'Tertiary' },
];

// Helper function to get location name from ID
const getLocationName = (locationId: string): string => {
    const demoLocation = demoLocations.find(l => l.id === locationId);
    if (demoLocation) return demoLocation.name;
    
    return locationId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// Extract locations from narrative nodes
const extractLocationsFromNodes = (_nodes: NarrativeFlowNode[]): LocationEntity[] => {
    return demoLocations;
};

// Component props interface
interface LocationAppearanceHeatMapProps {
    narrativeNodes: NarrativeFlowNode[];
    selectedWorldId?: string;
    onSwapLayout?: () => void;
}

const LocationAppearanceHeatMap: React.FC<LocationAppearanceHeatMapProps> = ({ 
    narrativeNodes,
    selectedWorldId,
    onSwapLayout 
}) => {
    // Filter and selection state
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Scrolling state
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();

    // Extract and filter locations
    const allLocations = useMemo(() => {
        const extracted = extractLocationsFromNodes(narrativeNodes);
        // Filter by selected world if specified
        if (selectedWorldId) {
            return extracted.filter(location => location.parentWorldId === selectedWorldId);
        }
        return extracted;
    }, [narrativeNodes, selectedWorldId]);

    // Filter locations based on search and selection
    const filteredLocations = useMemo(() => {
        let filtered = allLocations;
        
        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(location =>
                location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                location.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                location.region.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply selection filter
        if (selectedLocationIds.length > 0) {
            filtered = filtered.filter(location => selectedLocationIds.includes(location.id));
        }
        
        return filtered;
    }, [allLocations, searchQuery, selectedLocationIds]);

    // Group locations by category for filtering UI
    const locationsByGroup = useMemo(() => {
        return allLocations.reduce((acc, location) => {
            const group = location.group || 'Other';
            if (!acc[group]) acc[group] = [];
            acc[group].push(location);
            return acc;
        }, {} as Record<string, LocationEntity[]>);
    }, [allLocations]);

    // Get root nodes (nodes without parent)
    const rootNodes = useMemo(() => {
        return narrativeNodes
            .filter(node => !node.parentId)
            .sort((a, b) => a.position.y - b.position.y);
    }, [narrativeNodes]);

    // Calculate column spans for each node at each level (proper hierarchical structure)
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

    // Get final level nodes for location intersection calculation
    const getFinalLevelNodes = useCallback(() => {
        const finalNodes: NarrativeFlowNode[] = [];
        
        const processNode = (node: NarrativeFlowNode) => {
            const isExpanded = expandedNodes.has(node.id);
            const hasChildren = node.data.childIds && node.data.childIds.length > 0;
            const childNodes = hasChildren ? narrativeNodes.filter(n => node.data.childIds.includes(n.id)) : [];
            
            if (isExpanded && childNodes.length > 0) {
                // Process all children
                childNodes.forEach(child => processNode(child));
            } else {
                // This is a final node (either leaf or collapsed)
                finalNodes.push(node);
            }
        };
        
        rootNodes.forEach(root => processNode(root));
        return finalNodes;
    }, [expandedNodes, narrativeNodes, rootNodes]);

    const columnLayout = useMemo(() => calculateColumnLayout(), [calculateColumnLayout]);

    // Calculate location presence in specific node
    const calculateLocationPresence = (locationId: string, node: any): string => {
        if (node.type !== 'scene') return 'absent';
        
        const sceneData = node.data as any;
        const locations = sceneData?.locations || [];
        
        if (locations.includes(locationId)) {
            return locations[0] === locationId ? 'primary' : 'supporting';
        }
        
        // Check if mentioned in description
        const description = sceneData?.description || '';
        const locationName = getLocationName(locationId);
        if (description.toLowerCase().includes(locationName.toLowerCase())) {
            return 'mentioned';
        }
        
        return 'absent';
    };

    // Handle location selection toggle
    const handleLocationToggle = useCallback((locationId: string) => {
        setSelectedLocationIds(prev => 
            prev.includes(locationId)
                ? prev.filter(id => id !== locationId)
                : [...prev, locationId]
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

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSelectedLocationIds([]);
        setSearchQuery('');
    }, []);

    // Quick filter functions
    const selectPrimaryLocations = useCallback(() => {
        const primaryIds = allLocations
            .filter(location => location.group === 'Primary')
            .map(location => location.id);
        setSelectedLocationIds(primaryIds);
    }, [allLocations]);

    const selectSecondaryLocations = useCallback(() => {
        const secondaryIds = allLocations
            .filter(location => location.group === 'Secondary')
            .map(location => location.id);
        setSelectedLocationIds(secondaryIds);
    }, [allLocations]);

    const selectAllLocations = useCallback(() => {
        setSelectedLocationIds(allLocations.map(location => location.id));
    }, [allLocations]);

    // Render hierarchical column headers
    const renderHierarchicalLayout = () => {
        const finalNodes = getFinalLevelNodes();
        const headerLevels = columnLayout.length;

        return (
            <div className="flex flex-col">
                {/* Multi-level headers */}
                <div className="flex">
                    {/* Location header spanning all levels */}
                    <div 
                        className="w-80 min-w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center"
                        style={{ height: `${headerLevels * 64}px` }}
                    >
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Locations</span>
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

                {/* Location rows */}
                <div className="flex flex-col">
                    {filteredLocations.map(location => {
                        const totalColumns = finalNodes.length;
                        return (
                            <div key={location.id} className="flex h-16 border-b border-gray-200 dark:border-gray-700">
                                {/* Location name column */}
                                <div className="w-80 min-w-80 p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: location.color }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {location.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {location.type}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Location presence cells using grid layout */}
                                <div 
                                    className="flex-1"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${totalColumns}, 128px)`,
                                        minWidth: `${totalColumns * 128}px`
                                    }}
                                >
                                    {finalNodes.map((node, nodeIndex) => {
                                        const presence = calculateLocationPresence(location.id, node.data);
                                        
                                        return (
                                            <div 
                                                key={`${node.id}-${location.id}`} 
                                                className="p-1 border-r border-gray-200 dark:border-gray-700"
                                                style={{
                                                    gridColumnStart: nodeIndex + 1,
                                                    gridColumnEnd: nodeIndex + 2,
                                                }}
                                            >
                                                <ChargingBarIndicator
                                                    percentage={presence === 'primary' ? 100 : presence === 'supporting' ? 75 : presence === 'mentioned' ? 40 : 0}
                                                    characterColor={location.color}
                                                    characterName={location.name}
                                                    plotNode={(node.data.data as any)?.title || node.data.type}
                                                    tier={presence === 'primary' ? 'Primary POV' : presence === 'supporting' ? 'Major Supporting' : presence === 'mentioned' ? 'Minor Presence' : 'Mentioned Only'}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
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
                        Location Appearance Heat Map
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
                            placeholder="Search locations..."
                            className="w-64 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors
                                ${selectedLocationIds.length > 0 
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }
                            `}
                        >
                            <FunnelIcon className="h-4 w-4" />
                            Filter ({selectedLocationIds.length})
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
                                            <h3 className="font-medium text-gray-900 dark:text-white">Filter Locations</h3>
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
                                                onClick={selectAllLocations}
                                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                            >
                                                All Locations
                                            </button>
                                            <button
                                                onClick={selectPrimaryLocations}
                                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                            >
                                                Primary
                                            </button>
                                            <button
                                                onClick={selectSecondaryLocations}
                                                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                                            >
                                                Secondary
                                            </button>
                                        </div>

                                        {/* Location Groups */}
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {Object.entries(locationsByGroup).map(([group, locations]) => (
                                                <div key={group}>
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {group} ({locations.length})
                                                    </h4>
                                                    <div className="space-y-1 pl-2">
                                                        {locations.map(location => (
                                                            <label 
                                                                key={location.id}
                                                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedLocationIds.includes(location.id)}
                                                                    onChange={() => handleLocationToggle(location.id)}
                                                                    className="rounded border-gray-300 dark:border-gray-600"
                                                                />
                                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                    <div 
                                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                                        style={{ backgroundColor: location.color }}
                                                                    />
                                                                    <span className="text-sm text-gray-900 dark:text-white truncate">
                                                                        {location.name}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 truncate">
                                                                        {location.type}
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
                        <span className="text-gray-600 dark:text-gray-400">Primary Setting</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-300 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Supporting Setting</span>
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

export default LocationAppearanceHeatMap;
