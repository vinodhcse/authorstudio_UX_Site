import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDownIcon, 
    ChevronRightIcon, 
    FunnelIcon,
    ChevronLeftIcon,
    ArrowsRightLeftIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import ChargingBarIndicator from './ChargingBarIndicator';
import { 
    NarrativeFlowNode, 
    NarrativeNode 
} from '../../../../../types/narrative-layout';

// Import PlotNodeDetailsModal for information popup
const PlotNodeDetailsModal = React.lazy(() => import('./PlotNodeDetailsModal'));

// Types for Character Appearance Heat Map layout
interface Character {
    id: string;
    name: string;
    role: string;
    color: string;
    tag?: string;
    type: 'primary' | 'secondary' | 'tertiary'; // Character classification
    group?: string; // Character grouping for UI organization
}

// Demo characters with proper grouping
const demoCharacters: Character[] = [
    // Primary Characters
    { id: 'harry-potter', name: 'Harry Potter', role: 'Protagonist', color: '#3B82F6', type: 'primary', group: 'Primary' },
    { id: 'hermione-granger', name: 'Hermione Granger', role: 'Main Character', color: '#EF4444', type: 'primary', group: 'Primary' },
    { id: 'ron-weasley', name: 'Ron Weasley', role: 'Main Character', color: '#10B981', type: 'primary', group: 'Primary' },
    
    // Secondary Characters
    { id: 'dumbledore', name: 'Albus Dumbledore', role: 'Mentor', color: '#F59E0B', type: 'secondary', group: 'Secondary' },
    { id: 'mcgonagall', name: 'Professor McGonagall', role: 'Teacher', color: '#8B5CF6', type: 'secondary', group: 'Secondary' },
    { id: 'hagrid', name: 'Rubeus Hagrid', role: 'Ally', color: '#EC4899', type: 'secondary', group: 'Secondary' },
    { id: 'snape', name: 'Severus Snape', role: 'Antagonist', color: '#06B6D4', type: 'secondary', group: 'Secondary' },
    
    // Tertiary Characters  
    { id: 'vernon-dursley', name: 'Vernon Dursley', role: 'Guardian', color: '#84CC16', type: 'tertiary', group: 'Tertiary' },
    { id: 'draco-malfoy', name: 'Draco Malfoy', role: 'Rival', color: '#F97316', type: 'tertiary', group: 'Tertiary' },
    { id: 'neville-longbottom', name: 'Neville Longbottom', role: 'Friend', color: '#EAB308', type: 'tertiary', group: 'Tertiary' },
];

// Helper function to get character name from ID
const getCharacterName = (characterId: string): string => {
    // First check demo characters
    const demoChar = demoCharacters.find(c => c.id === characterId);
    if (demoChar) return demoChar.name;

    // Fallback to mapping for backwards compatibility
    const characterNames: Record<string, string> = {
        'harry': 'Harry Potter',
        'hermione': 'Hermione Granger',
        'ron': 'Ron Weasley',
        'dumbledore': 'Dumbledore',
        'snape': 'Severus Snape',
        'voldemort': 'Voldemort',
        'hagrid': 'Hagrid',
        'mcgonagall': 'McGonagall',
        'draco': 'Draco Malfoy',
        'neville': 'Neville Longbottom',
        'luna': 'Luna Lovegood',
        'sirius': 'Sirius Black',
        'lupin': 'Remus Lupin',
        'vernon': 'Vernon Dursley',
        // Additional mappings for the data structure
        'char-001': 'Dumbledore',
        'char-002': 'McGonagall', 
        'char-003': 'Harry Potter',
        'char-004': 'Hagrid',
        'char-005': 'Vernon Dursley',
    };
    
    return characterNames[characterId] || characterId.charAt(0).toUpperCase() + characterId.slice(1);
};

// Helper function to determine character type
const getCharacterType = (characterId: string): 'primary' | 'secondary' | 'tertiary' => {
    const primaryCharacters = ['harry', 'hermione', 'ron', 'harry-potter', 'hermione-granger', 'ron-weasley', 'char-003'];
    const secondaryCharacters = ['dumbledore', 'snape', 'voldemort', 'hagrid', 'char-001', 'char-002', 'char-004', 'mcgonagall'];
    
    if (primaryCharacters.includes(characterId)) return 'primary';
    if (secondaryCharacters.includes(characterId)) return 'secondary';
    return 'tertiary';
};

interface CharacterAppearanceHeatMapProps {
    narrativeNodes: NarrativeFlowNode[];
    narrativeEdges?: any[];
    onNodeSelect?: (nodeId: string) => void;
    onCharacterClick?: (characterId: string, nodeId: string, event: React.MouseEvent) => void;
    onSwapLayout?: () => void;
}

// Extract characters from narrative nodes
const extractCharactersFromNodes = (_nodes: NarrativeFlowNode[]): Character[] => {
    // Return demo characters for now - in a real app, you'd extract from nodes
    return demoCharacters;
};

// Character presence result interface
interface PresenceResult {
    type: string;
    percentage: number;
    tier: string;
    description: string;
}

// Character presence analysis with percentage
const analyzeCharacterPresence = (node: NarrativeNode, characterId: string, narrativeNodes: NarrativeFlowNode[]): PresenceResult => {
    if (node.type === 'scene' && node.data) {
        const sceneData = node.data as any;
        
        // Check if character is POV - Primary influence
        if (sceneData.povCharacterId === characterId) {
            return { 
                type: 'primary-pov', 
                percentage: Math.floor(Math.random() * 31) + 70, // 70-100%
                tier: 'Primary POV',
                description: 'Point of view character' 
            };
        }
        
        // Check if character is actively in scene - Major supporting
        if (sceneData.characters?.includes(characterId)) {
            return { 
                type: 'major-supporting', 
                percentage: Math.floor(Math.random() * 30) + 40, // 40-69%
                tier: 'Major Supporting',
                description: 'Active in scene' 
            };
        }
        
        // Sometimes characters are mentioned but not actively present
        if (Math.random() > 0.7) { // 30% chance of being mentioned
            return { 
                type: 'mentioned', 
                percentage: Math.floor(Math.random() * 14) + 1, // 1-14%
                tier: 'Mentioned Only',
                description: 'Referenced in dialogue or narration' 
            };
        }
    }
    
    // For chapters and acts, calculate average based on child scenes
    if ((node.type === 'chapter' || node.type === 'act') && node.childIds && node.childIds.length > 0) {
        const childNodes = narrativeNodes.filter(n => node.childIds.includes(n.id));
        const childPresences = childNodes.map(childNode => 
            analyzeCharacterPresence(childNode.data, characterId, narrativeNodes)
        ).filter(p => p.percentage > 0);
        
        if (childPresences.length > 0) {
            const avgPercentage = Math.floor(
                childPresences.reduce((sum, p) => sum + p.percentage, 0) / childPresences.length
            );
            return {
                type: 'aggregate',
                percentage: avgPercentage,
                tier: avgPercentage >= 70 ? 'Primary Arc' : avgPercentage >= 40 ? 'Supporting Arc' : 'Minor Presence',
                description: `Average presence across ${childPresences.length} scenes`
            };
        }
    }
    
    // Fallback: Generate some demo presence data if no specific data found
    const characterType = getCharacterType(characterId);
    const basePercentage = characterType === 'primary' ? 60 : characterType === 'secondary' ? 35 : 15;
    const randomVariation = Math.floor(Math.random() * 20) - 10; // ±10
    const finalPercentage = Math.max(0, Math.min(100, basePercentage + randomVariation));
    
    if (finalPercentage > 0) {
        return {
            type: 'demo-presence',
            percentage: finalPercentage,
            tier: finalPercentage >= 70 ? 'Primary POV' : finalPercentage >= 40 ? 'Major Supporting' : 'Minor Presence',
            description: `${characterType} character presence`
        };
    }

    return { 
        type: 'absent', 
        percentage: 0, 
        tier: 'Absent',
        description: 'Not present' 
    };
};

const CharacterAppearanceHeatMap: React.FC<CharacterAppearanceHeatMapProps> = ({ 
    narrativeNodes,
    onNodeSelect,
    onSwapLayout
}) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [showCharacterFilter, setShowCharacterFilter] = useState(false);
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(
        demoCharacters.map(char => char.id) // Start with all characters selected
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<NarrativeNode | null>(null);
    const [showNodeDetails, setShowNodeDetails] = useState(false);
    
    // Carousel state and refs for scroll synchronization
    const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
    const contentScrollRef = useRef<HTMLDivElement>(null);
    const narrativeColumnWidth = 128; // Width for each narrative structure column

    // Extract available characters from the narrative data
    const availableCharacters = useMemo(() => {
        return extractCharactersFromNodes(narrativeNodes);
    }, [narrativeNodes]);

    // Get visible characters based on selected character IDs
    const visibleCharacters = useMemo(() => {
        return availableCharacters.filter(char => 
            selectedCharacterIds.includes(char.id)
        );
    }, [availableCharacters, selectedCharacterIds]);

    // Add handler for character selection
    const handleCharacterToggle = useCallback((characterId: string) => {
        setSelectedCharacterIds(prev => 
            prev.includes(characterId)
                ? prev.filter(id => id !== characterId)
                : [...prev, characterId]
        );
    }, []);

    // Filter available characters for search dropdown
    const filteredCharacters = useMemo(() => {
        if (!searchTerm) return [];
        return availableCharacters.filter(char => 
            char.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !selectedCharacterIds.includes(char.id)
        );
    }, [availableCharacters, searchTerm, selectedCharacterIds]);

    // Handle opening plot node details modal
    const handleShowNodeDetails = useCallback((node: NarrativeFlowNode) => {
        setSelectedNode(node.data);
        setShowNodeDetails(true);
    }, []);

    // Carousel navigation functions
    const scrollToPosition = useCallback((targetPosition: number) => {
        if (contentScrollRef.current) {
            contentScrollRef.current.scrollTo({
                left: targetPosition,
                behavior: 'smooth'
            });
            setCurrentScrollPosition(targetPosition);
        }
    }, []);

    // Animate scroll position changes with smooth transitions
    useEffect(() => {
        if (contentScrollRef.current) {
            const contentElement = contentScrollRef.current;
            const startPosition = contentElement.scrollLeft;
            const targetPosition = currentScrollPosition;
            const distance = targetPosition - startPosition;
            
            // If the distance is small or zero, skip animation
            if (Math.abs(distance) < 5) {
                contentElement.scrollLeft = targetPosition;
                return;
            }
            
            // Create smooth animation using requestAnimationFrame with slower speed
            const duration = 1200; // 1.2 seconds for very visible animation
            const startTime = performance.now();
            
            const animateScroll = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function for smooth animation (ease-in-out for more visible motion)
                const easeInOut = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                const currentPosition = startPosition + (distance * easeInOut);
                
                contentElement.scrollLeft = currentPosition;
                
                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            };
            
            requestAnimationFrame(animateScroll);
        }
    }, [currentScrollPosition])

    const scrollLeft = useCallback(() => {
        const newPosition = Math.max(0, currentScrollPosition - narrativeColumnWidth * 3);
        scrollToPosition(newPosition);
    }, [currentScrollPosition, narrativeColumnWidth, scrollToPosition]);

    const scrollRight = useCallback(() => {
        // Calculate based on expanded narrative nodes
        const totalVisibleWidth = calculateTotalNarrativeWidth();
        const containerWidth = contentScrollRef.current?.clientWidth || 0;
        const maxScroll = Math.max(0, totalVisibleWidth - containerWidth);
        const newPosition = Math.min(maxScroll, currentScrollPosition + narrativeColumnWidth * 3);
        scrollToPosition(newPosition);
    }, [currentScrollPosition, narrativeColumnWidth, scrollToPosition]);

    // Calculate total width of expanded narrative structure
    const calculateTotalNarrativeWidth = useCallback(() => {
        const rootNodes = getRootNodes();
        let totalWidth = 0;
        
        const calculateNodeWidth = (node: NarrativeFlowNode): number => {
            let width = narrativeColumnWidth; // Base width for this node
            
            if (expandedNodes.has(node.id) && node.data.childIds.length > 0) {
                const childNodes = narrativeNodes.filter(n => node.data.childIds.includes(n.id));
                const childrenWidth = childNodes.reduce((sum, child) => sum + calculateNodeWidth(child), 0);
                width += childrenWidth;
            }
            
            return width;
        };
        
        rootNodes.forEach(node => {
            totalWidth += calculateNodeWidth(node);
        });
        
        return totalWidth;
    }, [expandedNodes, narrativeNodes, narrativeColumnWidth]);

    // Synchronize scroll between header and content (simplified - just content scroll)
    const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        setCurrentScrollPosition(scrollLeft);
    }, []);

    // Get nodes to display - start from Acts as top level, then Chapters and Scenes
    const getRootNodes = useCallback(() => {
        // Find the outline node first
        const outlineNode = narrativeNodes.find(node => node.data.type === 'outline');
        
        if (outlineNode && outlineNode.data.childIds) {
            // Get Acts as root nodes (children of outline)
            const actNodes = narrativeNodes.filter(node => 
                outlineNode.data.childIds.includes(node.id) && 
                node.data.type === 'act'
            );
            return actNodes;
        }
        
        // Fallback: look for any acts that exist
        const fallbackNodes = narrativeNodes.filter(node => 
            node.data.type === 'act'
        );
        return fallbackNodes;
    }, [narrativeNodes]);

    const rootNodes = useMemo(() => getRootNodes(), [getRootNodes]);

    // Calculate column spans for each node at each level
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

    // Get the final level nodes for character intersection calculation
    const getFinalLevelNodes = useCallback((): NarrativeFlowNode[] => {
        const finalNodes: NarrativeFlowNode[] = [];
        
        const collectFinalNodes = (nodes: NarrativeFlowNode[]) => {
            for (const node of nodes) {
                const isExpanded = expandedNodes.has(node.id);
                const hasChildren = node.data.childIds && node.data.childIds.length > 0;
                const childNodes = hasChildren ? narrativeNodes.filter(n => node.data.childIds.includes(n.id)) : [];
                const hasValidChildren = childNodes.length > 0;
                
                if (isExpanded && hasValidChildren) {
                    collectFinalNodes(childNodes);
                } else {
                    finalNodes.push(node);
                }
            }
        };
        
        collectFinalNodes(rootNodes);
        return finalNodes;
    }, [expandedNodes, narrativeNodes, rootNodes]);

    // Render hierarchical headers and character intersections
    const renderHierarchicalLayout = useCallback(() => {
        const columnLayout = calculateColumnLayout();
        const finalNodes = getFinalLevelNodes();
        const headerLevels = columnLayout.length;

        return (
            <div className="flex flex-col">
                {/* Multi-level headers */}
                <div className="flex">
                    {/* Character header spanning all levels */}
                    <div 
                        className="w-80 min-w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center"
                        style={{ height: `${headerLevels * 64}px` }}
                    >
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Characters</span>
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
                                            // Extract scene index from title or use a fallback
                                            const sceneMatch = title.match(/scene\s*(\d+)/i);
                                            if (sceneMatch) {
                                                displayTitle = `Scene - ${sceneMatch[1]}`;
                                            } else {
                                                // Fallback: use the last part after any separator
                                                const parts = title.split(/[-:]/);
                                                const lastPart = parts[parts.length - 1].trim();
                                                displayTitle = `Scene - ${lastPart}`;
                                            }
                                        }

                                        const handleNodeClick = () => {
                                            // Check if there are actual valid children before allowing expansion
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
                                            onNodeSelect?.(node.id);
                                        };

                                        return (
                                            <div 
                                                key={`${node.id}-${levelIndex}`}
                                                className="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex"
                                                style={{
                                                    gridColumnStart: position + 1,
                                                    gridColumnEnd: position + span + 1,
                                                }}
                                            >
                                                <div className="flex-1 p-2 flex items-center justify-between min-w-0">
                                                    <div 
                                                        className="flex items-center gap-1 cursor-pointer flex-1 min-w-0"
                                                        onClick={handleNodeClick}
                                                    >
                                                        {(() => {
                                                            // Check if there are actual valid children before showing chevron
                                                            const childNodes = hasChildren ? narrativeNodes.filter(n => nodeData.childIds.includes(n.id)) : [];
                                                            const hasValidChildren = childNodes.length > 0;
                                                            
                                                            return hasValidChildren && (
                                                                <motion.div
                                                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    <ChevronRightIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                                                </motion.div>
                                                            );
                                                        })()}
                                                        <span 
                                                            className="text-xs font-medium text-gray-900 dark:text-white truncate"
                                                            title={title}
                                                        >
                                                            {displayTitle}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleShowNodeDetails(node);
                                                        }}
                                                        className="ml-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"
                                                        title={`Show details for ${title}`}
                                                    >
                                                        <InformationCircleIcon className="w-3 h-3 text-gray-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Character rows */}
                <div className="flex flex-col">
                    {visibleCharacters.map(character => {
                        const totalColumns = finalNodes.length;
                        return (
                            <div key={character.id} className="flex h-16 border-b border-gray-200 dark:border-gray-700">
                                {/* Character name column */}
                                <div className="w-80 min-w-80 p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: character.color }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {character.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {character.type}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Character presence cells using grid layout */}
                                <div 
                                    className="flex-1"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${totalColumns}, 128px)`,
                                        minWidth: `${totalColumns * 128}px`
                                    }}
                                >
                                    {finalNodes.map((node, nodeIndex) => {
                                        const presence = analyzeCharacterPresence(node.data, character.id, narrativeNodes);
                                        
                                        return (
                                            <div 
                                                key={`${node.id}-${character.id}`} 
                                                className="p-1 border-r border-gray-200 dark:border-gray-700"
                                                style={{
                                                    gridColumnStart: nodeIndex + 1,
                                                    gridColumnEnd: nodeIndex + 2,
                                                }}
                                            >
                                                <ChargingBarIndicator
                                                    percentage={presence.percentage}
                                                    characterColor={character.color}
                                                    characterName={character.name}
                                                    plotNode={(node.data.data as any)?.title || node.data.type}
                                                    tier={presence.tier}
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
    }, [
        calculateColumnLayout, 
        getFinalLevelNodes, 
        expandedNodes, 
        visibleCharacters, 
        narrativeNodes, 
        onNodeSelect, 
        handleShowNodeDetails
    ]);

    return (
        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            {/* Header with title and controls */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Character Appearance Heat Map
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {narrativeNodes.length} nodes • {availableCharacters.length} characters • {visibleCharacters.length} visible
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Swap Layout Button */}
                        <button
                            onClick={onSwapLayout}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                            title="Switch to Character Screen Time Layout"
                        >
                            <ArrowsRightLeftIcon className="w-4 h-4" />
                            Swap Layout
                        </button>

                        {/* Character Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCharacterFilter(!showCharacterFilter)}
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <FunnelIcon className="w-4 h-4" />
                                Select Characters ({visibleCharacters.length})
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showCharacterFilter ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                                {showCharacterFilter && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20"
                                    >
                                        <div className="p-4 space-y-4">
                                            {/* Search Characters */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Add Characters
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        placeholder="Type to search for characters..."
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                    
                                                    {/* Search Results Dropdown */}
                                                    {searchTerm && filteredCharacters.length > 0 && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto z-30">
                                                            {filteredCharacters.map(character => (
                                                                <button
                                                                    key={character.id}
                                                                    onClick={() => {
                                                                        handleCharacterToggle(character.id);
                                                                        setSearchTerm('');
                                                                    }}
                                                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white flex items-center gap-2"
                                                                >
                                                                    <div 
                                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                                        style={{ backgroundColor: character.color }}
                                                                    />
                                                                    <span className="flex-1">{character.name}</span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                                                                        {character.type}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* No results message */}
                                                    {searchTerm && filteredCharacters.length === 0 && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3 z-30">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                                                {availableCharacters.filter(char => 
                                                                    char.name.toLowerCase().includes(searchTerm.toLowerCase())
                                                                ).length === 0 
                                                                    ? 'No characters found'
                                                                    : 'All matching characters are already selected'
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Selected Characters */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Selected Characters ({selectedCharacterIds.length})
                                                    </label>
                                                    {selectedCharacterIds.length > 0 && (
                                                        <button
                                                            onClick={() => setSelectedCharacterIds([])}
                                                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                                        >
                                                            Clear All
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {selectedCharacterIds.length === 0 ? (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                                                        No characters selected. Search above to add characters.
                                                    </div>
                                                ) : (
                                                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-600 rounded-md p-2">
                                                        {selectedCharacterIds.map(characterId => {
                                                            const character = availableCharacters.find(c => c.id === characterId);
                                                            if (!character) return null;
                                                            
                                                            return (
                                                                <div
                                                                    key={character.id}
                                                                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-600 rounded-md group"
                                                                >
                                                                    <div 
                                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                                        style={{ backgroundColor: character.color }}
                                                                    />
                                                                    <span className="flex-1 text-sm text-gray-900 dark:text-white">
                                                                        {character.name}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded">
                                                                        {character.type}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleCharacterToggle(character.id)}
                                                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all p-1 rounded"
                                                                        title="Remove character"
                                                                    >
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick Filter Buttons */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Quick Filters
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => setSelectedCharacterIds(availableCharacters.map(c => c.id))}
                                                        className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedCharacterIds(
                                                            availableCharacters.filter(c => c.type === 'primary').map(c => c.id)
                                                        )}
                                                        className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                                    >
                                                        Primary Only
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedCharacterIds(
                                                            availableCharacters.filter(c => c.type === 'secondary').map(c => c.id)
                                                        )}
                                                        className="px-3 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                                                    >
                                                        Secondary Only
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedCharacterIds(
                                                            availableCharacters.filter(c => c.type !== 'tertiary').map(c => c.id)
                                                        )}
                                                        className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                                                    >
                                                        Main Characters
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Apply/Close Buttons */}
                                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                <button
                                                    onClick={() => setShowCharacterFilter(false)}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heat Map Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Scrollable narrative structure columns */}
                <div 
                    ref={contentScrollRef}
                    className="flex-1 overflow-x-auto no-scrollbar"
                    onScroll={handleContentScroll}
                >
                    {renderHierarchicalLayout()}
                </div>
            </div>

            {/* Overlay carousel buttons */}
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

            {/* Node Details Modal */}
            {selectedNode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {(selectedNode.data as any)?.title || `${selectedNode.type} Details`}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                        {selectedNode.type} • ID: {selectedNode.id}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(selectedNode.data as any)?.description && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                                        <p className="text-gray-700 dark:text-gray-300">{(selectedNode.data as any).description}</p>
                                    </div>
                                )}

                                {(selectedNode.data as any)?.characters && (selectedNode.data as any).characters.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Characters</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedNode.data as any).characters.map((charId: string) => (
                                                <span
                                                    key={charId}
                                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                                                >
                                                    {getCharacterName(charId)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(selectedNode.data as any)?.povCharacterId && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">POV Character</h3>
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">
                                            {getCharacterName((selectedNode.data as any).povCharacterId)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Node Details Modal */}
            {selectedNode && showNodeDetails && (
                <React.Suspense fallback={<div>Loading...</div>}>
                    <PlotNodeDetailsModal 
                        node={selectedNode}
                        isOpen={showNodeDetails}
                        onClose={() => {
                            setShowNodeDetails(false);
                            setSelectedNode(null);
                        }}
                        getCharacterName={getCharacterName}
                    />
                </React.Suspense>
            )}
        </div>
    );
};

export default CharacterAppearanceHeatMap;
