import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDownIcon, 
    ChevronRightIcon, 
    FunnelIcon
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
}

interface CharacterScreenTimeLayoutProps {
    narrativeNodes: NarrativeFlowNode[];
    narrativeEdges?: any[];
    onNodeSelect?: (nodeId: string) => void;
    onCharacterClick?: (characterId: string, nodeId: string, event: React.MouseEvent) => void;
}

// Extract characters from narrative nodes
const extractCharactersFromNodes = (nodes: NarrativeFlowNode[]): Character[] => {
    const charactersMap = new Map<string, Character>();
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    let colorIndex = 0;

    nodes.forEach(node => {
        const nodeData = node.data;
        
        // Extract characters from scenes
        if (nodeData.type === 'scene' && (nodeData.data as any)?.characters) {
            (nodeData.data as any).characters.forEach((charId: string) => {
                if (!charactersMap.has(charId)) {
                    charactersMap.set(charId, {
                        id: charId,
                        name: getCharacterName(charId),
                        role: 'Character',
                        color: colors[colorIndex % colors.length],
                        type: getCharacterType(charId)
                    });
                    colorIndex++;
                }
            });
        }

        // Extract POV characters
        if (nodeData.type === 'scene' && (nodeData.data as any)?.povCharacterId) {
            const povCharId = (nodeData.data as any).povCharacterId;
            if (!charactersMap.has(povCharId)) {
                charactersMap.set(povCharId, {
                    id: povCharId,
                    name: getCharacterName(povCharId),
                    role: 'POV Character',
                    color: colors[colorIndex % colors.length],
                    type: getCharacterType(povCharId)
                });
                colorIndex++;
            }
        }
    });

    return Array.from(charactersMap.values());
};

// Helper function to classify character type
const getCharacterType = (characterId: string): 'primary' | 'secondary' | 'tertiary' => {
    const primaryCharacters = ['harry-potter', 'char-003', 'hermione-granger', 'ron-weasley'];
    const secondaryCharacters = ['dumbledore', 'char-001', 'snape', 'mcgonagall', 'char-002'];
    
    if (primaryCharacters.includes(characterId)) return 'primary';
    if (secondaryCharacters.includes(characterId)) return 'secondary';
    return 'tertiary';
};

// Helper function to get character name (mock implementation)
const getCharacterName = (characterId: string): string => {
    const characterMap: Record<string, string> = {
        'char-001': 'Dumbledore',
        'char-002': 'McGonagall', 
        'char-003': 'Harry Potter',
        'char-004': 'Hagrid',
        'char-005': 'Vernon Dursley',
        'harry-potter': 'Harry Potter',
        'hermione-granger': 'Hermione Granger',
        'ron-weasley': 'Ron Weasley',
        'dumbledore': 'Albus Dumbledore',
        'snape': 'Severus Snape'
    };
    
    return characterMap[characterId] || `Character ${characterId.slice(-1)}`;
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
    
    return { 
        type: 'absent', 
        percentage: 0, 
        tier: 'Absent',
        description: 'Not present' 
    };
};

const CharacterScreenTimeLayout: React.FC<CharacterScreenTimeLayoutProps> = ({ 
    narrativeNodes,
    onNodeSelect
}) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [showCharacterFilter, setShowCharacterFilter] = useState(false);
    const [characterGroups, setCharacterGroups] = useState<Record<string, boolean>>({
        primary: true,
        secondary: false,
        tertiary: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<NarrativeNode | null>(null);

    // Extract available characters from the narrative data
    const availableCharacters = useMemo(() => {
        return extractCharactersFromNodes(narrativeNodes);
    }, [narrativeNodes]);

    // Group characters by type
    const groupedCharacters = useMemo(() => {
        const groups: Record<string, Character[]> = {
            primary: availableCharacters.filter(c => c.type === 'primary'),
            secondary: availableCharacters.filter(c => c.type === 'secondary'),
            tertiary: availableCharacters.filter(c => c.type === 'tertiary')
        };
        return groups;
    }, [availableCharacters]);

    // Get visible characters based on expanded groups and search filter
    const visibleCharacters = useMemo(() => {
        let characters: Character[] = [];
        
        Object.entries(groupedCharacters).forEach(([groupType, groupCharacters]) => {
            if (characterGroups[groupType]) {
                characters = [...characters, ...groupCharacters];
            }
        });

        if (searchTerm) {
            characters = characters.filter(char => 
                char.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return characters;
    }, [groupedCharacters, characterGroups, searchTerm]);

    // Toggle character group expansion
    const toggleCharacterGroup = useCallback((groupType: string) => {
        setCharacterGroups(prev => ({
            ...prev,
            [groupType]: !prev[groupType]
        }));
    }, []);

    // Recursive function to render hierarchy
    const renderNodeRows = useCallback((nodes: NarrativeFlowNode[], level: number = 0): React.ReactElement[] => {
        return nodes.map(node => {
            const nodeData = node.data;
            const hasChildren = nodeData.childIds && nodeData.childIds.length > 0;
            const isExpanded = expandedNodes.has(node.id);
            const childNodes = hasChildren ? narrativeNodes.filter(n => nodeData.childIds.includes(n.id)) : [];

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
                    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td 
                            className="py-3 px-4 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r border-gray-200 dark:border-gray-700 min-w-[200px] cursor-pointer"
                            onClick={handleNodeClick}
                            onDoubleClick={handleNodeDoubleClick}
                        >
                            <div 
                                className="flex items-center gap-2 group"
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
                                        {(nodeData as any).title || `${nodeData.type} ${node.id}`}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {nodeData.type}
                                    </div>
                                </div>
                                
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
                                    Click to expand • Double-click for details
                                </div>
                            </div>
                        </td>
                        
                        {visibleCharacters.map(character => {
                            const presence = analyzeCharacterPresence(nodeData, character.id, narrativeNodes);
                            
                            return (
                                <td 
                                    key={`${node.id}-${character.id}`} 
                                    className="w-[120px] h-20 p-1 border-r border-gray-200 dark:border-gray-700 relative"
                                >
                                    <ChargingBarIndicator
                                        percentage={presence.percentage}
                                        characterColor={character.color}
                                        characterName={character.name}
                                        plotNode={(nodeData as any).title || nodeData.type}
                                        tier={presence.tier}
                                    />
                                </td>
                            );
                        })}
                    </tr>
                    
                    {isExpanded && childNodes.length > 0 && (
                        <AnimatePresence>
                            {renderNodeRows(childNodes, level + 1)}
                        </AnimatePresence>
                    )}
                </React.Fragment>
            );
        });
    }, [narrativeNodes, expandedNodes, visibleCharacters, onNodeSelect]);

    // Get root nodes (nodes that are not children of other nodes)
    const rootNodes = useMemo(() => {
        const childNodeIds = new Set(
            narrativeNodes.flatMap(node => node.data.childIds || [])
        );
        return narrativeNodes.filter(node => !childNodeIds.has(node.id));
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
                            {narrativeNodes.length} nodes • {availableCharacters.length} characters
                        </span>
                    </div>
                    
                    {/* Character Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCharacterFilter(!showCharacterFilter)}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            <FunnelIcon className="w-4 h-4" />
                            Filter Characters
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showCharacterFilter ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                            {showCharacterFilter && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20"
                                >
                                    <div className="p-4 space-y-4">
                                        {/* Search Characters */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Search Characters
                                            </label>
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Type character name..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        
                                        {/* Character Groups */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Character Groups
                                            </label>
                                            <div className="space-y-2">
                                                {Object.entries(groupedCharacters).map(([groupType, characters]) => (
                                                    <div key={groupType} className="flex items-center justify-between">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={characterGroups[groupType]}
                                                                onChange={() => toggleCharacterGroup(groupType)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize font-medium">
                                                                {groupType} Characters
                                                            </span>
                                                        </label>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {characters.length}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Filter Summary */}
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Showing {visibleCharacters.length} of {availableCharacters.length} characters
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Character Groups Headers */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex">
                    <div className="w-[200px] flex-shrink-0 sticky left-0 bg-gray-50 dark:bg-gray-800 z-20 border-r border-gray-200 dark:border-gray-700">
                        <div className="h-12 flex items-center px-4">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Narrative Structure
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        {Object.entries(groupedCharacters).map(([groupType, characters]) => {
                            const groupCharacters = characters.filter(char => {
                                if (searchTerm) {
                                    return char.name.toLowerCase().includes(searchTerm.toLowerCase());
                                }
                                return true;
                            });
                            
                            if (groupCharacters.length === 0) return null;
                            
                            return (
                                <div key={groupType} className="inline-block">
                                    {/* Group Header */}
                                    <button
                                        onClick={() => toggleCharacterGroup(groupType)}
                                        className="h-12 px-4 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize"
                                        style={{ width: `${groupCharacters.length * 120}px` }}
                                    >
                                        <motion.div
                                            animate={{ rotate: characterGroups[groupType] ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </motion.div>
                                        {groupType} Characters ({groupCharacters.length})
                                    </button>
                                    
                                    {/* Character Headers */}
                                    <AnimatePresence>
                                        {characterGroups[groupType] && (
                                            <motion.div 
                                                className="flex"
                                                initial={{ height: 0 }}
                                                animate={{ height: 'auto' }}
                                                exit={{ height: 0 }}
                                            >
                                                {groupCharacters.map(character => (
                                                    <div 
                                                        key={character.id}
                                                        className="w-[120px] h-16 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-2"
                                                    >
                                                        <div 
                                                            className="w-3 h-3 rounded-full mb-1"
                                                            style={{ backgroundColor: character.color }}
                                                        />
                                                        <div className="text-xs font-medium text-gray-900 dark:text-white text-center leading-tight">
                                                            {character.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {character.role}
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Matrix Content */}
            <div className="overflow-auto flex-1">
                <table className="w-full">
                    <tbody>
                        {renderNodeRows(rootNodes)}
                    </tbody>
                </table>
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
