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

// Types for Lore Screen Time matrix layout
interface LoreEntity {
    id: string;
    title: string;
    category: 'myth' | 'prophecy' | 'historical event' | 'legend';
    color: string;
    tag?: string;
    parentWorldId: string;
    group?: string; // Lore grouping for UI organization
}

// Demo lore with proper grouping
const demoLore: LoreEntity[] = [
    // Primary Lore
    { id: 'prophecy-boy-lived', title: 'The Boy Who Lived', category: 'prophecy', color: '#3B82F6', parentWorldId: 'wizarding-world', group: 'Primary' },
    { id: 'deathly-hallows', title: 'Tale of the Three Brothers', category: 'legend', color: '#EF4444', parentWorldId: 'wizarding-world', group: 'Primary' },
    { id: 'chamber-secrets', title: 'Chamber of Secrets Legend', category: 'historical event', color: '#10B981', parentWorldId: 'wizarding-world', group: 'Primary' },
    
    // Secondary Lore
    { id: 'founders-story', title: 'Hogwarts Founders', category: 'historical event', color: '#F59E0B', parentWorldId: 'wizarding-world', group: 'Secondary' },
    { id: 'quidditch-history', title: 'Origins of Quidditch', category: 'historical event', color: '#8B5CF6', parentWorldId: 'wizarding-world', group: 'Secondary' },
    { id: 'patronus-legend', title: 'The Patronus Charm', category: 'legend', color: '#EC4899', parentWorldId: 'wizarding-world', group: 'Secondary' },
    
    // Tertiary Lore  
    { id: 'chocolate-frog-myth', title: 'Chocolate Frog Legends', category: 'myth', color: '#06B6D4', parentWorldId: 'wizarding-world', group: 'Tertiary' },
    { id: 'whomping-willow', title: 'The Whomping Willow Tale', category: 'legend', color: '#84CC16', parentWorldId: 'wizarding-world', group: 'Tertiary' },
    { id: 'sorting-hat-song', title: 'Sorting Hat\'s Songs', category: 'myth', color: '#F97316', parentWorldId: 'wizarding-world', group: 'Tertiary' },
];

// Helper function to get lore title from ID
const getLoreTitle = (loreId: string): string => {
    // First check demo lore
    const demoLoreItem = demoLore.find(l => l.id === loreId);
    if (demoLoreItem) return demoLoreItem.title;
    
    // Fallback to formatted ID
    return loreId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// Extract lore from narrative nodes
const extractLoreFromNodes = (_nodes: NarrativeFlowNode[]): LoreEntity[] => {
    // For now, return demo data - in production this would extract from actual node data
    return demoLore;
};

// Analyze lore presence in narrative structure with percentage and tier
const analyzeLorePresence = (
    loreId: string, 
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
        const demoData = getDemoLorePresence(loreId);
        return demoData;
    }

    let primary = 0;
    let supporting = 0; 
    let mentioned = 0;
    let absent = 0;

    sceneNodes.forEach(node => {
        const sceneData = node.data as any;
        const lore = sceneData?.lore || [];
        
        if (lore.includes(loreId)) {
            // For simplicity, consider main lore as primary, others as supporting
            if (lore[0] === loreId) {
                primary++;
            } else {
                supporting++;
            }
        } else {
            // Check if mentioned in description (simplified check)
            const description = sceneData?.description || '';
            const loreTitle = getLoreTitle(loreId);
            if (description.toLowerCase().includes(loreTitle.toLowerCase())) {
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
        tier = primary >= total * 0.3 ? 'Primary Lore' : 'Major Lore';
    } else if (supporting > 0) {
        tier = supporting >= total * 0.2 ? 'Supporting Lore' : 'Minor Lore';
    } else if (mentioned > 0) {
        tier = 'Mentioned Only';
    }

    return { percentage, tier, primary, supporting, mentioned, absent, total };
};

// Helper function to provide demo data for lore presence
const getDemoLorePresence = (loreId: string) => {
    const demoPresenceData: Record<string, any> = {
        'prophecy-boy-lived': { percentage: 70, tier: 'Primary Lore', primary: 6, supporting: 8, mentioned: 3, absent: 1, total: 18 },
        'deathly-hallows': { percentage: 55, tier: 'Primary Lore', primary: 4, supporting: 6, mentioned: 6, absent: 2, total: 18 },
        'chamber-secrets': { percentage: 45, tier: 'Supporting Lore', primary: 3, supporting: 4, mentioned: 7, absent: 4, total: 18 },
        'founders-story': { percentage: 30, tier: 'Supporting Lore', primary: 1, supporting: 3, mentioned: 8, absent: 6, total: 18 },
        'quidditch-history': { percentage: 25, tier: 'Minor Lore', primary: 0, supporting: 3, mentioned: 6, absent: 9, total: 18 },
        'patronus-legend': { percentage: 35, tier: 'Supporting Lore', primary: 2, supporting: 2, mentioned: 8, absent: 6, total: 18 },
        'chocolate-frog-myth': { percentage: 15, tier: 'Mentioned Only', primary: 0, supporting: 1, mentioned: 4, absent: 13, total: 18 },
        'whomping-willow': { percentage: 18, tier: 'Mentioned Only', primary: 0, supporting: 1, mentioned: 5, absent: 12, total: 18 },
        'sorting-hat-song': { percentage: 12, tier: 'Mentioned Only', primary: 0, supporting: 0, mentioned: 4, absent: 14, total: 18 },
    };
    
    return demoPresenceData[loreId] || { percentage: 5, tier: 'Absent', primary: 0, supporting: 0, mentioned: 1, absent: 17, total: 18 };
};

// Component props interface
interface LoreScreenTimeLayoutProps {
    narrativeNodes: NarrativeFlowNode[];
    selectedWorldId?: string;
    onSwapLayout?: () => void;
}

const LoreScreenTimeLayout: React.FC<LoreScreenTimeLayoutProps> = ({ 
    narrativeNodes,
    selectedWorldId,
    onSwapLayout 
}) => {
    // Filter and selection state
    const [selectedLoreIds, setSelectedLoreIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Scrolling state and carousel controls
    const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const contentScrollRef = useRef<HTMLDivElement>(null);
    const loreColumnWidth = 128; // 32 * 4 (w-32 in Tailwind)

    // Extract and filter lore
    const allLore = useMemo(() => {
        const extracted = extractLoreFromNodes(narrativeNodes);
        // Filter by selected world if specified
        if (selectedWorldId) {
            return extracted.filter(lore => lore.parentWorldId === selectedWorldId);
        }
        return extracted;
    }, [narrativeNodes, selectedWorldId]);

    // Filter lore based on search and selection
    const filteredLore = useMemo(() => {
        let filtered = allLore;
        
        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(lore =>
                lore.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lore.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply selection filter
        if (selectedLoreIds.length > 0) {
            filtered = filtered.filter(lore => selectedLoreIds.includes(lore.id));
        }
        
        return filtered;
    }, [allLore, searchQuery, selectedLoreIds]);

    // Group lore by category for filtering UI
    const loreByGroup = useMemo(() => {
        return allLore.reduce((acc, lore) => {
            const group = lore.group || 'Other';
            if (!acc[group]) acc[group] = [];
            acc[group].push(lore);
            return acc;
        }, {} as Record<string, LoreEntity[]>);
    }, [allLore]);

    // Handle lore selection toggle
    const handleLoreToggle = useCallback((loreId: string) => {
        setSelectedLoreIds(prev => 
            prev.includes(loreId)
                ? prev.filter(id => id !== loreId)
                : [...prev, loreId]
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
        const newPosition = Math.max(0, currentScrollPosition - loreColumnWidth * 3);
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
    }, [currentScrollPosition, loreColumnWidth]);

    const scrollRight = useCallback(() => {
        const totalVisibleWidth = filteredLore.length * loreColumnWidth;
        const containerWidth = scrollContainerRef.current?.clientWidth || 0;
        const maxScroll = Math.max(0, totalVisibleWidth - containerWidth);
        const newPosition = Math.min(maxScroll, currentScrollPosition + loreColumnWidth * 3);
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
    }, [currentScrollPosition, filteredLore.length, loreColumnWidth]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSelectedLoreIds([]);
        setSearchQuery('');
    }, []);

    // Quick filter functions
    const selectPrimaryLore = useCallback(() => {
        const primaryIds = allLore
            .filter(lore => lore.group === 'Primary')
            .map(lore => lore.id);
        setSelectedLoreIds(primaryIds);
    }, [allLore]);

    const selectSecondaryLore = useCallback(() => {
        const secondaryIds = allLore
            .filter(lore => lore.group === 'Secondary')
            .map(lore => lore.id);
        setSelectedLoreIds(secondaryIds);
    }, [allLore]);

    const selectAllLore = useCallback(() => {
        setSelectedLoreIds(allLore.map(lore => lore.id));
    }, [allLore]);

    // Filter by category
    const selectByCategory = useCallback((category: string) => {
        const categoryIds = allLore
            .filter(lore => lore.category === category)
            .map(lore => lore.id);
        setSelectedLoreIds(categoryIds);
    }, [allLore]);

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

    // Recursive function to render lore columns for hierarchy
    const renderLoreColumns = useCallback((nodes: NarrativeFlowNode[], lore: LoreEntity, level: number = 0): React.ReactElement[] => {
        return nodes.map(node => {
            const nodeData = node.data as any;
            const hasChildren = nodeData.childIds && nodeData.childIds.length > 0;
            const isExpanded = expandedNodes.has(node.id);
            
            const childNodes = hasChildren ? narrativeNodes.filter(n => 
                nodeData.childIds.includes(n.id) && 
                ['act', 'chapter', 'scene'].includes(n.data.type)
            ) : [];

            return (
                <React.Fragment key={`${lore.id}-${node.id}`}>
                    {/* Lore presence indicator for this node */}
                    <div className="w-[120px] flex-shrink-0 p-2 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <ChargingBarIndicator
                            percentage={analyzeLorePresence(lore.id, [node]).percentage}
                            tier={analyzeLorePresence(lore.id, [node]).tier}
                            characterColor={lore.color}
                            characterName={lore.title}
                            plotNode={nodeData?.title || `${node.data.type} ${node.id}`}
                        />
                    </div>
                    
                    {/* Child node columns if expanded */}
                    {hasChildren && isExpanded && renderLoreColumns(childNodes, lore, level + 1)}
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
    }, [narrativeNodes, expandedNodes, filteredLore, handleNodeToggle]);

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
                        Lore Screen Time Analysis
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
                            placeholder="Search lore..."
                            className="w-64 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors
                                ${selectedLoreIds.length > 0 
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }
                            `}
                        >
                            <FunnelIcon className="h-4 w-4" />
                            Filter ({selectedLoreIds.length})
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
                                            <h3 className="font-medium text-gray-900 dark:text-white">Filter Lore</h3>
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
                                                onClick={selectAllLore}
                                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                            >
                                                All Lore
                                            </button>
                                            <button
                                                onClick={selectPrimaryLore}
                                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                            >
                                                Primary
                                            </button>
                                            <button
                                                onClick={selectSecondaryLore}
                                                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                                            >
                                                Secondary
                                            </button>
                                        </div>

                                        {/* Category Filters */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <button
                                                onClick={() => selectByCategory('myth')}
                                                className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
                                            >
                                                Myths
                                            </button>
                                            <button
                                                onClick={() => selectByCategory('prophecy')}
                                                className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800"
                                            >
                                                Prophecies
                                            </button>
                                            <button
                                                onClick={() => selectByCategory('historical event')}
                                                className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                                            >
                                                History
                                            </button>
                                            <button
                                                onClick={() => selectByCategory('legend')}
                                                className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800"
                                            >
                                                Legends
                                            </button>
                                        </div>

                                        {/* Lore Groups */}
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {Object.entries(loreByGroup).map(([group, loreItems]) => (
                                                <div key={group}>
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {group} ({loreItems.length})
                                                    </h4>
                                                    <div className="space-y-1 pl-2">
                                                        {loreItems.map(lore => (
                                                            <label 
                                                                key={lore.id}
                                                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedLoreIds.includes(lore.id)}
                                                                    onChange={() => handleLoreToggle(lore.id)}
                                                                    className="rounded border-gray-300 dark:border-gray-600"
                                                                />
                                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                    <div 
                                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                                        style={{ backgroundColor: lore.color }}
                                                                    />
                                                                    <span className="text-sm text-gray-900 dark:text-white truncate">
                                                                        {lore.title}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 truncate capitalize">
                                                                        {lore.category}
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
                {/* Header row with fixed first column and scrollable lore headers */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 relative">
                    {/* Fixed first column header */}
                    <div className="w-80 min-w-80 bg-gray-100 dark:bg-gray-800 p-3 font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                        Narrative Structure
                    </div>
                    
                    {/* Scrollable lore headers */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 overflow-x-auto no-scrollbar"
                        onScroll={handleHeaderScroll}
                    >
                        <div className="flex">
                            {filteredLore.map(lore => (
                                <div 
                                    key={lore.id}
                                    className="w-32 min-w-32 flex-shrink-0 p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: lore.color }}
                                        />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                            {lore.title}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate capitalize">
                                        {lore.category}
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

                {/* Matrix content with fixed first column and scrollable lore columns */}
                <div className="flex flex-1 overflow-y-auto max-h-[600px]">
                    {/* Fixed first column - narrative structure */}
                    <div className="w-80 min-w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                        {renderNodeRows(rootNodes)}
                    </div>

                    {/* Lore columns - synchronized with headers above */}
                    <div 
                        ref={contentScrollRef}
                        className="flex-1 overflow-x-auto no-scrollbar"
                        onScroll={handleContentScroll}
                    >
                        <div className="flex-shrink-0">
                            {/* Individual lore columns */}
                            <div className="flex">
                                {filteredLore.map(lore => (
                                    <AnimatePresence key={lore.id}>
                                        <motion.div 
                                            className="w-32 min-w-32 border-r border-gray-200 dark:border-gray-700"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 128 }}
                                            exit={{ opacity: 0, width: 0 }}
                                        >
                                            {renderLoreColumns(rootNodes, lore)}
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

export default LoreScreenTimeLayout;
