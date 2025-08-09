import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDownIcon, 
    ChevronRightIcon, 
    FunnelIcon,
    ArrowsRightLeftIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
    NarrativeFlowNode
} from '../../../../../types/narrative-layout';

// Types for Lore Appearance Heat Map
interface LoreEntity {
    id: string;
    title: string;
    category: 'myth' | 'prophecy' | 'historical event' | 'legend';
    color: string;
    tag?: string;
    parentWorldId: string;
    group?: string;
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
    const demoLoreItem = demoLore.find(l => l.id === loreId);
    if (demoLoreItem) return demoLoreItem.title;
    
    return loreId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// Extract lore from narrative nodes
const extractLoreFromNodes = (_nodes: NarrativeFlowNode[]): LoreEntity[] => {
    return demoLore;
};

// Component props interface
interface LoreAppearanceHeatMapProps {
    narrativeNodes: NarrativeFlowNode[];
    selectedWorldId?: string;
    onSwapLayout?: () => void;
}

const LoreAppearanceHeatMap: React.FC<LoreAppearanceHeatMapProps> = ({ 
    narrativeNodes,
    selectedWorldId,
    onSwapLayout 
}) => {
    // Filter and selection state
    const [selectedLoreIds, setSelectedLoreIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Scrolling state
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();

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

    // Calculate column layout with proper positioning
    const calculateColumnLayout = () => {
        const columns: any[] = [];
        let currentPosition = 0;
        
        const processNode = (node: any, level: number): void => {
            // Check if node should be expanded and has children
            const hasValidChildren = node.children && node.children.length > 0;
            const isExpanded = expandedNodes.has(node.id);
            
            if (level === 0 || (hasValidChildren && isExpanded)) {
                // Add main column for this node
                columns.push({
                    id: node.id,
                    node: node,
                    position: currentPosition,
                    span: 1,
                    level: level,
                    type: 'main'
                });
                currentPosition++;
                
                // If expanded and has children, add sub-columns
                if (hasValidChildren && isExpanded && level < 3) {
                    node.children.forEach((child: any) => {
                        processNode(child, level + 1);
                    });
                }
            }
        };
        
        narrativeStructure.forEach(root => processNode(root, 0));
        return columns;
    };

    const columnLayout = useMemo(() => calculateColumnLayout(), [narrativeStructure, expandedNodes]);

    // Get final level nodes for lore intersection calculation
    const getFinalLevelNodes = () => {
        return columnLayout
            .filter(col => col.type === 'main')
            .map(col => col.node);
    };

    // Calculate lore presence in specific node
    const calculateLorePresence = (loreId: string, node: any): string => {
        if (node.type !== 'scene') return 'absent';
        
        const sceneData = node.data as any;
        const lore = sceneData?.lore || [];
        
        if (lore.includes(loreId)) {
            return lore[0] === loreId ? 'primary' : 'supporting';
        }
        
        // Check if mentioned in description
        const description = sceneData?.description || '';
        const loreTitle = getLoreTitle(loreId);
        if (description.toLowerCase().includes(loreTitle.toLowerCase())) {
            return 'mentioned';
        }
        
        return 'absent';
    };

    // Handle lore selection toggle
    const handleLoreToggle = useCallback((loreId: string) => {
        setSelectedLoreIds(prev => 
            prev.includes(loreId)
                ? prev.filter(id => id !== loreId)
                : [...prev, loreId]
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

    // Render hierarchical column headers
    const renderHierarchicalLayout = () => {
        const finalNodes = getFinalLevelNodes();
        const headerLevels = columnLayout.length;

        return (
            <div className="flex flex-col">
                {/* Multi-level headers */}
                <div className="flex">
                    {/* Lore header spanning all levels */}
                    <div 
                        className="w-80 min-w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center"
                        style={{ height: `${headerLevels * 64}px` }}
                    >
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Lore</span>
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
                    {/* Fixed first column - lore names */}
                    <div className="w-80 min-w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                        {filteredLore.map((lore) => (
                            <div key={lore.id} className="h-20 p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                                <div className="flex items-center gap-2 w-full">
                                    <div 
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: lore.color }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                            {lore.name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate capitalize">
                                            {lore.category}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Scrollable narrative columns with lore presence indicators */}
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
                                {filteredLore.map((lore) => {
                                    const presence = calculateLorePresence(lore.id, node);
                                    const cellColor = presence === 'primary' ? lore.color :
                                                    presence === 'supporting' ? `${lore.color}80` :
                                                    presence === 'mentioned' ? `${lore.color}40` : 'transparent';
                                    
                                    return (
                                        <div 
                                            key={`${lore.id}-${node.id}`}
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
                                    {title}
                                </div>
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
                
                {/* Lore rows */}
                {filteredLore.map((lore) => (
                    <React.Fragment key={lore.id}>
                        {/* Lore name cell */}
                        <div className="bg-white dark:bg-gray-900 p-3 border-r border-gray-200 dark:border-gray-700 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: lore.color }}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                        {lore.title}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate capitalize">
                                        {lore.category}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Lore presence cells */}
                        {finalNodes.map((node, nodeIndex) => {
                            const presence = calculateLorePresence(lore.id, node);
                            const cellColor = presence === 'primary' ? lore.color :
                                            presence === 'supporting' ? `${lore.color}80` :
                                            presence === 'mentioned' ? `${lore.color}40` : 'transparent';
                            
                            return (
                                <div 
                                    key={`${lore.id}-${node.id}`}
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
                                            <div className="font-medium">{lore.title}</div>
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
                        Lore Appearance Heat Map
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
                        <span className="text-gray-600 dark:text-gray-400">Primary Lore</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-300 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Supporting Lore</span>
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

export default LoreAppearanceHeatMap;
