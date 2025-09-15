import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDownIcon, 
    ChevronRightIcon, 
    FunnelIcon,
    ChevronLeftIcon,
    ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import ChargingBarIndicator from './ChargingBarIndicator';
import { 
    NarrativeFlowNode, 
    NarrativeNode 
} from '../../../../../types/narrative-layout';

// Types for Character Screen Time matrix layout
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

interface CharacterScreenTimeLayoutProps {
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

const CharacterScreenTimeLayout: React.FC<CharacterScreenTimeLayoutProps> = ({ 
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
    
    // Carousel state and refs for scroll synchronization
    const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
    const headerScrollRef = useRef<HTMLDivElement>(null);
    const contentScrollRef = useRef<HTMLDivElement>(null);
    const characterColumnWidth = 128; // 32 * 4 (w-32 in Tailwind)

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

    // Carousel navigation functions with smooth animation
    const scrollToPosition = useCallback((targetPosition: number) => {
        if (headerScrollRef.current && contentScrollRef.current) {
            // Use smooth scrolling for animated transitions
            headerScrollRef.current.scrollTo({
                left: targetPosition,
                behavior: 'smooth'
            });
            contentScrollRef.current.scrollTo({
                left: targetPosition,
                behavior: 'smooth'
            });
            console.log(`Scrolled to position: ${targetPosition}`); 
            setCurrentScrollPosition(targetPosition);
        }
    }, []);

    // Animate scroll position changes with smooth transitions
    useEffect(() => {
        if (headerScrollRef.current && contentScrollRef.current) {
            const headerElement = headerScrollRef.current;
            const contentElement = contentScrollRef.current;
            const startPosition = headerElement.scrollLeft;
            const targetPosition = currentScrollPosition;
            const distance = targetPosition - startPosition;
            
            // If the distance is small or zero, skip animation
            if (Math.abs(distance) < 5) {
                headerElement.scrollLeft = targetPosition;
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
                
                headerElement.scrollLeft = currentPosition;
                contentElement.scrollLeft = currentPosition;
                
                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            };
            
            requestAnimationFrame(animateScroll);
        }
    }, [currentScrollPosition])

    const scrollLeft = useCallback(() => {
        const newPosition = Math.max(0, currentScrollPosition - characterColumnWidth * 3);
        scrollToPosition(newPosition);
    }, [currentScrollPosition, characterColumnWidth, scrollToPosition]);

    const scrollRight = useCallback(() => {
        // Use a simple calculation based on visible characters only
        const totalVisibleWidth = visibleCharacters.length * characterColumnWidth;
        const containerWidth = headerScrollRef.current?.clientWidth || 0;
        const maxScroll = Math.max(0, totalVisibleWidth - containerWidth);
        const newPosition = Math.min(maxScroll, currentScrollPosition + characterColumnWidth * 3);
        scrollToPosition(newPosition);
    }, [currentScrollPosition, visibleCharacters.length, characterColumnWidth, scrollToPosition]);

    // Synchronize scroll between header and content (for manual scrolling)
    const handleHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        if (contentScrollRef.current && contentScrollRef.current.scrollLeft !== scrollLeft) {
            contentScrollRef.current.scrollLeft = scrollLeft;
        }
        setCurrentScrollPosition(scrollLeft);
    }, []);

    const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        if (headerScrollRef.current && headerScrollRef.current.scrollLeft !== scrollLeft) {
            headerScrollRef.current.scrollLeft = scrollLeft;
        }
        setCurrentScrollPosition(scrollLeft);
    }, []);

    // Recursive function to render character columns for hierarchy
    const renderCharacterColumns = useCallback((nodes: NarrativeFlowNode[], character: Character, level: number = 0): React.ReactElement[] => {
        return nodes.map(node => {
            const nodeData = node.data;
            const hasChildren = nodeData.childIds && nodeData.childIds.length > 0;
            const isExpanded = expandedNodes.has(node.id);
            const childNodes = hasChildren ? narrativeNodes.filter(n => 
                nodeData.childIds.includes(n.id) && 
                ['act', 'chapter', 'scene'].includes(n.data.type)
            ) : [];

            return (
                <React.Fragment key={node.id}>
                    <div className="border-b border-gray-200 dark:border-gray-700 h-20 p-1">
                        <ChargingBarIndicator
                            percentage={analyzeCharacterPresence(nodeData, character.id, narrativeNodes).percentage}
                            characterColor={character.color}
                            characterName={character.name}
                            plotNode={(nodeData.data as any)?.title || nodeData.type}
                            tier={analyzeCharacterPresence(nodeData, character.id, narrativeNodes).tier}
                        />
                    </div>
                    
                    {isExpanded && childNodes.length > 0 && (
                        <AnimatePresence>
                            {renderCharacterColumns(childNodes, character, level + 1)}
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

            const handleNodeDoubleClick = () => {
                setSelectedNode(nodeData);
            };

            return (
                <React.Fragment key={node.id}>
                    <div className="flex">
                        {/* First column - narrative structure */}
                        <div 
                            className="w-full py-3 px-4 cursor-pointer h-20 flex items-center"
                            onClick={handleNodeClick}
                            onDoubleClick={handleNodeDoubleClick}
                        >
                            <div 
                                className="flex items-center gap-2 group w-full"
                                style={{ paddingLeft: `${level * 20}px` }}
                            >
                                {hasChildren && (
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-shrink-0"
                                    >
                                        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                    </motion.div>
                                )}
                                {!hasChildren && <div className="w-4" />}
                                
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                        {(nodeData.data as any)?.title || `${nodeData.type} ${node.id}`}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">
                                        {nodeData.type}
                                        {(nodeData.data as any)?.description && (
                                            <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                                                • {(nodeData.data as any).description.substring(0, 40)}
                                                {(nodeData.data as any).description.length > 40 ? '...' : ''}
                                            </span>
                                        )}
                                    </div>
                                    {/* Additional metadata for different node types */}
                                    {nodeData.type === 'scene' && (
                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                            {(nodeData.data as any)?.povCharacterId && (
                                                <span className="inline-block mr-2">
                                                    POV: {getCharacterName((nodeData.data as any).povCharacterId)}
                                                </span>
                                            )}
                                            {(nodeData.data as any)?.characters && (nodeData.data as any).characters.length > 0 && (
                                                <span className="inline-block">
                                                    {(nodeData.data as any).characters.length} characters
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {(nodeData.type === 'chapter' || nodeData.type === 'act') && nodeData.childIds && (
                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                            {nodeData.childIds.length} {nodeData.type === 'act' ? 'chapters' : 'scenes'}
                                            {(nodeData.data as any)?.goal && (
                                                <span className="ml-2">
                                                    • {(nodeData.data as any).goal.substring(0, 30)}
                                                    {(nodeData.data as any).goal.length > 30 ? '...' : ''}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
                                    Click to expand • Double-click for details
                                </div>
                            </div>
                        </div>
                        
                        {/* Character columns */}
                        {visibleCharacters.map(character => {
                            const presence = analyzeCharacterPresence(nodeData, character.id, narrativeNodes);
                            
                            return (
                                <div 
                                    key={`${node.id}-${character.id}`} 
                                    className="w-[120px] h-20 p-1 border-r border-gray-200 dark:border-gray-700 relative flex-shrink-0"
                                >
                                    <ChargingBarIndicator
                                        percentage={presence.percentage}
                                        characterColor={character.color}
                                        characterName={character.name}
                                        plotNode={(nodeData.data as any)?.title || nodeData.type}
                                        tier={presence.tier}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    
                    {isExpanded && childNodes.length > 0 && (
                        <AnimatePresence>
                            {renderNodeRows(childNodes, level + 1)}
                        </AnimatePresence>
                    )}
                </React.Fragment>
            );
        });
    }, [narrativeNodes, expandedNodes, visibleCharacters, onNodeSelect]);

    // Get nodes to display - start from Acts as top level, then Chapters and Scenes
    const rootNodes = useMemo(() => {
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

    return (
        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            {/* Header with title and controls */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Character Screen Time Matrix
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {narrativeNodes.length} nodes • {availableCharacters.length} characters • {visibleCharacters.length} visible • Scroll: {currentScrollPosition}px
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Swap Layout Button */}
                        <button
                            onClick={onSwapLayout}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                            title="Switch to Character Appearance Heat Map"
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

            {/* Header row with fixed first column and scrollable character headers */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex relative">
                {/* Fixed first column header */}
                <div className="w-80 min-w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Narrative Structure
                    </span>
                </div>
                
                {/* Character headers container */}
                <div ref={headerScrollRef}
                        className="flex-1 overflow-x-auto no-scrollbar"
                        onScroll={handleHeaderScroll}>
                    {/* Scrollable character headers */}
                    <div 
                        
                    >
                        <div className="flex-shrink-0">
                            {/* Individual character headers only - simplified structure */}
                            <div className="flex">
                                {visibleCharacters.map((character) => (
                                    <AnimatePresence key={character.id}>
                                        <motion.div 
                                            className="w-32 min-w-32 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-center relative"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 128 }}
                                            exit={{ opacity: 0, width: 0 }}
                                        >
                                                {/* Group indicator stripe */}
                                                <div 
                                                    className={`absolute top-0 left-0 right-0 h-1 ${
                                                        character.type === 'primary' ? 'bg-blue-500' : 
                                                        character.type === 'secondary' ? 'bg-green-500' : 'bg-yellow-500'
                                                    }`}
                                                />
                                                <div 
                                                    className="w-3 h-3 rounded-full mx-auto mb-1"
                                                    style={{ backgroundColor: character.color }}
                                                />
                                                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                                    {character.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {character.type}
                                                </div>
                                            </motion.div>
                                    </AnimatePresence>
                                ))}
                            </div>
                        </div>
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

            {/* Matrix content with fixed first column and scrollable character columns */}
            <div className="flex flex-1 overflow-y-auto max-h-[600px]">
                {/* Fixed first column - narrative structure */}
                <div className="w-80 min-w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {rootNodes.map((node) => {
                            const nodeData = node.data;
                            const hasChildren = nodeData.childIds && nodeData.childIds.length > 0;
                            const isExpanded = expandedNodes.has(node.id);
                            const childNodes = hasChildren ? narrativeNodes.filter(n => 
                                nodeData.childIds.includes(n.id) && 
                                ['act', 'chapter', 'scene'].includes(n.data.type)
                            ) : [];

                            const handleNodeClick = () => {
                                if (hasChildren) {
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
                                <React.Fragment key={node.id}>
                                    <div className="border-b border-gray-200 dark:border-gray-700 p-4 cursor-pointer h-20 flex items-center" onClick={handleNodeClick}>
                                        <div className="flex items-center gap-2 w-full">
                                            {hasChildren && (
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                </motion.div>
                                            )}
                                            {!hasChildren && <div className="w-4" />}
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {(nodeData.data as any)?.title || `${nodeData.type} ${node.id}`}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                    {nodeData.type}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {isExpanded && childNodes.length > 0 && (
                                        <AnimatePresence>
                                            {childNodes.map(childNode => {
                                                const childNodeData = childNode.data;
                                                const childHasChildren = childNodeData.childIds && childNodeData.childIds.length > 0;
                                                const childIsExpanded = expandedNodes.has(childNode.id);
                                                const grandChildNodes = childHasChildren ? narrativeNodes.filter(n => 
                                                    childNodeData.childIds.includes(n.id) && 
                                                    ['scene'].includes(n.data.type)
                                                ) : [];

                                                const handleChildClick = () => {
                                                    if (childHasChildren) {
                                                        setExpandedNodes(prev => {
                                                            const newSet = new Set(prev);
                                                            if (childIsExpanded) {
                                                                newSet.delete(childNode.id);
                                                            } else {
                                                                newSet.add(childNode.id);
                                                            }
                                                            return newSet;
                                                        });
                                                    }
                                                    onNodeSelect?.(childNode.id);
                                                };

                                                return (
                                                    <React.Fragment key={childNode.id}>
                                                        <motion.div 
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="border-b border-gray-200 dark:border-gray-700 p-4 pl-8 bg-gray-50 dark:bg-gray-800 cursor-pointer h-20 flex items-center"
                                                            onClick={handleChildClick}
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                {childHasChildren && (
                                                                    <motion.div
                                                                        animate={{ rotate: childIsExpanded ? 90 : 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                    >
                                                                        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                                    </motion.div>
                                                                )}
                                                                {!childHasChildren && <div className="w-4" />}
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                                        {(childNodeData.data as any)?.title || `${childNodeData.type} ${childNode.id}`}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                                        {childNodeData.type}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>

                                                        {/* Scenes level (grandchildren) */}
                                                        {childIsExpanded && grandChildNodes.length > 0 && (
                                                            <AnimatePresence>
                                                                {grandChildNodes.map(sceneNode => {
                                                                    const sceneNodeData = sceneNode.data;
                                                                    
                                                                    return (
                                                                        <motion.div 
                                                                            key={sceneNode.id}
                                                                            initial={{ opacity: 0, height: 0 }}
                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                            exit={{ opacity: 0, height: 0 }}
                                                                            className="border-b border-gray-200 dark:border-gray-700 p-4 pl-12 bg-gray-100 dark:bg-gray-750 h-20 flex items-center"
                                                                        >
                                                                            <div className="flex items-center gap-2 w-full">
                                                                                <div className="w-4" />
                                                                                <div className="flex-1">
                                                                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                                                        {(sceneNodeData.data as any)?.title || `${sceneNodeData.type} ${sceneNode.id}`}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                                                        {sceneNodeData.type}
                                                                                        {(sceneNodeData.data as any)?.povCharacterId && (
                                                                                            <span className="ml-2">
                                                                                                • POV: {getCharacterName((sceneNodeData.data as any).povCharacterId)}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                            </AnimatePresence>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </AnimatePresence>
                                    )}
                                </React.Fragment>
                            );
                        })}
                </div>

                {/* Character columns - synchronized with headers above */}
                <div 
                    ref={contentScrollRef}
                    className="flex-1 overflow-x-auto no-scrollbar"
                    onScroll={handleContentScroll}
                >
                    <div className="flex-shrink-0">
                        {/* Individual character columns only - matching simplified header structure */}
                        <div className="flex">
                            {visibleCharacters.map(character => (
                                <AnimatePresence key={character.id}>
                                    <motion.div 
                                        className="w-32 min-w-32 border-r border-gray-200 dark:border-gray-700"
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 128 }}
                                        exit={{ opacity: 0, width: 0 }}
                                    >
                                        {renderCharacterColumns(rootNodes, character)}
                                    </motion.div>
                                </AnimatePresence>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
    );
};

export default CharacterScreenTimeLayout;
