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

// Types for Location Screen Time matrix layout
interface LocationEntity {
    id: string;
    name: string;
    type: string;
    region: string;
    color: string;
    tag?: string;
    parentWorldId: string;
    group?: string; // Location grouping for UI organization
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
    // First check demo locations
    const demoLocation = demoLocations.find(l => l.id === locationId);
    if (demoLocation) return demoLocation.name;
    
    // Fallback to formatted ID
    return locationId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// Extract locations from narrative nodes
const extractLocationsFromNodes = (_nodes: NarrativeFlowNode[]): LocationEntity[] => {
    // For now, return demo data - in production this would extract from actual node data
    return demoLocations;
};

// Analyze location presence in narrative structure with percentage and tier
const analyzeLocationPresence = (
    locationId: string, 
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
        const demoData = getDemoLocationPresence(locationId);
        return demoData;
    }

    let primary = 0;
    let supporting = 0; 
    let mentioned = 0;
    let absent = 0;

    sceneNodes.forEach(node => {
        const sceneData = node.data as any;
        const locations = sceneData?.locations || [];
        
        if (locations.includes(locationId)) {
            // For simplicity, consider main setting as primary, others as supporting
            if (locations[0] === locationId) {
                primary++;
            } else {
                supporting++;
            }
        } else {
            // Check if mentioned in description (simplified check)
            const description = sceneData?.description || '';
            const locationName = getLocationName(locationId);
            if (description.toLowerCase().includes(locationName.toLowerCase())) {
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
        tier = primary >= total * 0.3 ? 'Primary Setting' : 'Major Setting';
    } else if (supporting > 0) {
        tier = supporting >= total * 0.2 ? 'Supporting Setting' : 'Minor Setting';
    } else if (mentioned > 0) {
        tier = 'Mentioned Only';
    }

    return { percentage, tier, primary, supporting, mentioned, absent, total };
};

// Helper function to provide demo data for location presence
const getDemoLocationPresence = (locationId: string) => {
    const demoPresenceData: Record<string, any> = {
        'hogwarts': { percentage: 85, tier: 'Primary Setting', primary: 12, supporting: 3, mentioned: 2, absent: 1, total: 18 },
        'diagon-alley': { percentage: 45, tier: 'Supporting Setting', primary: 2, supporting: 8, mentioned: 4, absent: 4, total: 18 },
        'privet-drive': { percentage: 35, tier: 'Supporting Setting', primary: 1, supporting: 4, mentioned: 8, absent: 5, total: 18 },
        'forbidden-forest': { percentage: 25, tier: 'Minor Setting', primary: 0, supporting: 3, mentioned: 6, absent: 9, total: 18 },
        'hogsmeade': { percentage: 30, tier: 'Supporting Setting', primary: 1, supporting: 3, mentioned: 5, absent: 9, total: 18 },
        'kings-cross': { percentage: 15, tier: 'Mentioned Only', primary: 0, supporting: 1, mentioned: 4, absent: 13, total: 18 },
        'quidditch-pitch': { percentage: 20, tier: 'Minor Setting', primary: 0, supporting: 2, mentioned: 4, absent: 12, total: 18 },
        'gringotts': { percentage: 12, tier: 'Mentioned Only', primary: 0, supporting: 1, mentioned: 3, absent: 14, total: 18 },
        'dursley-house': { percentage: 8, tier: 'Mentioned Only', primary: 0, supporting: 0, mentioned: 3, absent: 15, total: 18 },
    };
    
    return demoPresenceData[locationId] || { percentage: 5, tier: 'Absent', primary: 0, supporting: 0, mentioned: 1, absent: 17, total: 18 };
};

// Component props interface
interface LocationScreenTimeLayoutProps {
    narrativeNodes: NarrativeFlowNode[];
    selectedWorldId?: string;
    onSwapLayout?: () => void;
}

const LocationScreenTimeLayout: React.FC<LocationScreenTimeLayoutProps> = ({ 
    narrativeNodes,
    selectedWorldId,
    onSwapLayout 
}) => {
    // Filter and selection state
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Scrolling state and carousel controls
    const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const contentScrollRef = useRef<HTMLDivElement>(null);
    const locationColumnWidth = 128; // 32 * 4 (w-32 in Tailwind)

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

    // Handle location selection toggle
    const handleLocationToggle = useCallback((locationId: string) => {
        setSelectedLocationIds(prev => 
            prev.includes(locationId)
                ? prev.filter(id => id !== locationId)
                : [...prev, locationId]
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
        const newPosition = Math.max(0, currentScrollPosition - locationColumnWidth * 3);
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
    }, [currentScrollPosition, locationColumnWidth]);

    const scrollRight = useCallback(() => {
        const totalVisibleWidth = filteredLocations.length * locationColumnWidth;
        const containerWidth = scrollContainerRef.current?.clientWidth || 0;
        const maxScroll = Math.max(0, totalVisibleWidth - containerWidth);
        const newPosition = Math.min(maxScroll, currentScrollPosition + locationColumnWidth * 3);
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
    }, [currentScrollPosition, filteredLocations.length, locationColumnWidth]);

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

    // Recursive function to render location columns for hierarchy
    const renderLocationColumns = useCallback((nodes: NarrativeFlowNode[], location: LocationEntity, level: number = 0): React.ReactElement[] => {
        return nodes.map(node => {
            const nodeData = node.data;
            const hasChildren = nodeData.childIds && nodeData.childIds.length > 0;
            const isExpanded = expandedNodes.has(node.id);
            const childNodes = hasChildren ? narrativeNodes.filter(n => 
                nodeData.childIds.includes(n.id) && 
                ['act', 'chapter', 'scene'].includes(n.data.type)
            ) : [];

            const presence = analyzeLocationPresence(location.id, [node]);

            return (
                <React.Fragment key={node.id}>
                    <div className="border-b border-gray-200 dark:border-gray-700 h-20 p-1">
                        <ChargingBarIndicator
                            percentage={presence.percentage}
                            characterColor={location.color}
                            characterName={location.name}
                            plotNode={(nodeData.data as any)?.title || nodeData.type}
                            tier={presence.tier}
                        />
                    </div>
                    
                    {isExpanded && childNodes.length > 0 && (
                        <AnimatePresence>
                            {renderLocationColumns(childNodes, location, level + 1)}
                        </AnimatePresence>
                    )}
                </React.Fragment>
            );
        });
    }, [narrativeNodes, expandedNodes]);

    // Recursive function to render hierarchy
    const renderNodeRows = useCallback((nodes: NarrativeFlowNode[], level: number = 0): React.ReactElement[] => {
        return nodes.map(node => {
            const nodeData = node.data;
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
                            {hasChildren ? (
                                <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded mr-2">
                                    {isExpanded ? (
                                        <ChevronDownIcon className="h-4 w-4" />
                                    ) : (
                                        <ChevronRightIcon className="h-4 w-4" />
                                    )}
                                </button>
                            ) : (
                                <div className="w-6 mr-2" />
                            )}
                            
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm truncate text-gray-900 dark:text-white">
                                    {(nodeData.data as any)?.title || `${nodeData.type} ${nodeData.id}`}
                                </div>
                                {nodeData.type === 'scene' && (
                                    <div className="text-xs text-gray-500 truncate">
                                        Scene • {(nodeData.data as any)?.chapter || 'Unassigned'}
                                    </div>
                                )}
                                {(nodeData.data as any)?.goal && (
                                    <div className="text-xs text-gray-400 mt-1 truncate">
                                        {(nodeData.data as any).goal}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>                    {isExpanded && childNodes.length > 0 && (
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
    }, [narrativeNodes, expandedNodes, handleNodeToggle]);    // Get nodes to display - start from Acts as top level, then Chapters and Scenes
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
                        Location Screen Time Analysis
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

            {/* Matrix Content */}
            <div className="flex-1 overflow-hidden">
                {/* Header row with fixed first column and scrollable location headers */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 relative">
                    {/* Fixed first column header */}
                    <div className="w-80 min-w-80 bg-gray-100 dark:bg-gray-800 p-3 font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                        Narrative Structure
                    </div>
                    
                    {/* Scrollable location headers */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 overflow-x-auto no-scrollbar"
                        onScroll={handleHeaderScroll}
                    >
                        <div className="flex">
                            {filteredLocations.map(location => (
                                <div 
                                    key={location.id}
                                    className="w-32 min-w-32 flex-shrink-0 p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: location.color }}
                                        />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                            {location.name}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {location.type}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate">
                                        {location.region}
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

                {/* Matrix content with fixed first column and scrollable location columns */}
                <div className="flex flex-1 overflow-y-auto max-h-[600px]">
                    {/* Fixed first column - narrative structure */}
                    <div className="w-80 min-w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                        {renderNodeRows(rootNodes)}
                    </div>

                    {/* Location columns - synchronized with headers above */}
                    <div 
                        ref={contentScrollRef}
                        className="flex-1 overflow-x-auto no-scrollbar"
                        onScroll={handleContentScroll}
                    >
                        <div className="flex-shrink-0">
                            {/* Individual location columns */}
                            <div className="flex">
                                {filteredLocations.map(location => (
                                    <AnimatePresence key={location.id}>
                                        <motion.div 
                                            className="w-32 min-w-32 border-r border-gray-200 dark:border-gray-700"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 128 }}
                                            exit={{ opacity: 0, width: 0 }}
                                        >
                                            {renderLocationColumns(rootNodes, location)}
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

export default LocationScreenTimeLayout;
