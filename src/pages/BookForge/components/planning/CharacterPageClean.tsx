import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Book, Version, Theme } from '../../../../types';
import { 
    PlusIcon
} from '../../../../constants';

// Sample Character Data based on your JSON structure
interface CharacterArc {
    id: string;
    sceneId: string;
    stage: string;
    status: string;
    traits: string[];
    goal: string;
    linkedEvents: string[];
    relationships: string[];
    images: string[];
    position: { x: number; y: number };
}

interface Character {
    id: string;
    fullName: string;
    role: string;
    characterType: 'Primary' | 'Secondary' | 'Tertiary';
    arcs: CharacterArc[];
    avatar?: string;
    description?: string;
}

// Sample data
const sampleCharacters: Character[] = [
    {
        id: 'char-001',
        fullName: 'Theron Veracious',
        role: 'Protagonist',
        characterType: 'Primary',
        avatar: 'https://picsum.photos/seed/theron/64/64',
        description: 'A young apprentice who discovers his true heritage and destiny',
        arcs: [
            {
                id: 'arc-001',
                sceneId: 'scene-123',
                stage: 'Apprentice',
                status: 'Completed',
                traits: ['Naive', 'Brave'],
                goal: 'Learn swordsmanship',
                linkedEvents: ['event-567'],
                relationships: ['char-002'],
                images: ['theron-child.png'],
                position: { x: 200, y: 150 }
            },
            {
                id: 'arc-002',
                sceneId: 'scene-124',
                stage: 'Awakening',
                status: 'In Progress',
                traits: ['Determined', 'Curious'],
                goal: 'Discover his magical abilities',
                linkedEvents: ['event-568'],
                relationships: ['char-002', 'char-003'],
                images: ['theron-teen.png'],
                position: { x: 400, y: 150 }
            }
        ]
    },
    {
        id: 'char-002',
        fullName: 'Nemar the Wise',
        role: 'Mentor',
        characterType: 'Primary',
        avatar: 'https://picsum.photos/seed/nemar/64/64',
        description: 'Ancient wizard and guide to the protagonist',
        arcs: [
            {
                id: 'arc-003',
                sceneId: 'scene-125',
                stage: 'Teacher',
                status: 'Completed',
                traits: ['Wise', 'Patient'],
                goal: 'Guide Theron',
                linkedEvents: ['event-567'],
                relationships: ['char-001'],
                images: ['nemar-mentor.png'],
                position: { x: 200, y: 300 }
            }
        ]
    },
    {
        id: 'char-003',
        fullName: 'Elissa Darkbane',
        role: 'Antagonist',
        characterType: 'Primary',
        avatar: 'https://picsum.photos/seed/elissa/64/64',
        description: 'Powerful sorceress seeking to control the ancient magic',
        arcs: [
            {
                id: 'arc-004',
                sceneId: 'scene-126',
                stage: 'Rising Power',
                status: 'Planning',
                traits: ['Ambitious', 'Ruthless'],
                goal: 'Obtain the Starlight Crystal',
                linkedEvents: ['event-569'],
                relationships: ['char-004'],
                images: ['elissa-dark.png'],
                position: { x: 600, y: 150 }
            }
        ]
    },
    {
        id: 'char-004',
        fullName: 'Attican Swift',
        role: 'Ally',
        characterType: 'Secondary',
        avatar: 'https://picsum.photos/seed/attican/64/64',
        description: 'Skilled ranger and loyal friend to the protagonist',
        arcs: [
            {
                id: 'arc-005',
                sceneId: 'scene-127',
                stage: 'Companion',
                status: 'In Progress',
                traits: ['Loyal', 'Skilled'],
                goal: 'Protect the group',
                linkedEvents: ['event-570'],
                relationships: ['char-001'],
                images: ['attican-ranger.png'],
                position: { x: 400, y: 300 }
            }
        ]
    },
    {
        id: 'char-005',
        fullName: 'Ferris Ironforge',
        role: 'Companion',
        characterType: 'Secondary',
        avatar: 'https://picsum.photos/seed/ferris/64/64',
        description: 'Dwarven blacksmith with a heart of gold',
        arcs: [
            {
                id: 'arc-006',
                sceneId: 'scene-128',
                stage: 'Craftsman',
                status: 'Planning',
                traits: ['Steadfast', 'Crafty'],
                goal: 'Forge legendary weapons',
                linkedEvents: ['event-571'],
                relationships: ['char-001', 'char-004'],
                images: ['ferris-forge.png'],
                position: { x: 600, y: 300 }
            }
        ]
    }
];

// Custom Character Node for ReactFlow
const CharacterNode: React.FC<any> = ({ data, selected }) => {
    const character = data.character as Character;
    
    return (
        <motion.div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 min-w-[200px] ${
                selected ? 'border-blue-500' : 'border-gray-200 dark:border-gray-600'
            }`}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                    <img 
                        src={character.avatar} 
                        alt={character.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {character.fullName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {character.role}
                        </p>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                    {character.description}
                </p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                    character.characterType === 'Primary' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : character.characterType === 'Secondary'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                    {character.characterType}
                </span>
            </div>
        </motion.div>
    );
};

interface CharacterPageProps {
    book: Book;
    version: Version;
    theme: Theme;
    searchQuery?: string;
    statusFilter?: 'all' | 'Primary' | 'Secondary' | 'Tertiary';
    viewMode?: 'grid' | 'list' | 'relationships';
}

const CharacterPage: React.FC<CharacterPageProps> = ({ 
    book,
    version,
    theme, 
    searchQuery = '', 
    statusFilter = 'all',
    viewMode = 'grid' 
}) => {
    const navigate = useNavigate();

    // Character nodes for ReactFlow (relationship web)
    const characterNodes: Node[] = sampleCharacters.map((char, index) => ({
        id: char.id,
        type: 'characterNode',
        position: { x: (index % 3) * 300 + 100, y: Math.floor(index / 3) * 200 + 100 },
        data: { character: char }
    }));

    const relationshipEdges: Edge[] = [
        { id: 'e1-2', source: 'char-001', target: 'char-002', animated: true, style: { stroke: '#8b5cf6' } },
        { id: 'e1-4', source: 'char-001', target: 'char-004', animated: true, style: { stroke: '#10b981' } },
        { id: 'e3-4', source: 'char-003', target: 'char-004', animated: true, style: { stroke: '#ef4444' } },
        { id: 'e4-5', source: 'char-004', target: 'char-005', animated: true, style: { stroke: '#f59e0b' } }
    ];

    const [nodes, , onNodesChange] = useNodesState(characterNodes);
    const [edges, , onEdgesChange] = useEdgesState(relationshipEdges);

    const nodeTypes = useMemo(() => ({
        characterNode: CharacterNode,
    }), []);

    // Filter characters based on search and filter criteria
    const filteredCharacters = useMemo(() => {
        return sampleCharacters.filter(char => {
            const matchesSearch = searchQuery === '' || 
                char.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                char.role.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesFilter = statusFilter === 'all' || char.characterType === statusFilter;
            
            return matchesSearch && matchesFilter;
        });
    }, [searchQuery, statusFilter]);

    // Group characters by type
    const groupedCharacters = useMemo(() => {
        return {
            Primary: filteredCharacters.filter(char => char.characterType === 'Primary'),
            Secondary: filteredCharacters.filter(char => char.characterType === 'Secondary'),
            Tertiary: filteredCharacters.filter(char => char.characterType === 'Tertiary')
        };
    }, [filteredCharacters]);

    const renderHeroSection = () => (
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 dark:from-purple-800 dark:via-blue-800 dark:to-indigo-900 rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-32 translate-y-32"></div>
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-3">Character Gallery</h2>
                        <p className="text-purple-100 dark:text-purple-200 text-lg">
                            Manage your story's characters and their development
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-purple-100">
                            <span className="text-sm">
                                {filteredCharacters.length} Characters Total
                            </span>
                            <span className="text-sm">•</span>
                            <span className="text-sm">
                                {groupedCharacters.Primary.length} Primary
                            </span>
                            <span className="text-sm">•</span>
                            <span className="text-sm">
                                {groupedCharacters.Secondary.length} Secondary
                            </span>
                        </div>
                    </div>
                    <motion.button
                        onClick={() => navigate('/tools/character-profile-builder')}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl flex items-center gap-3 font-medium shadow-lg hover:shadow-xl transition-all"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <PlusIcon className="w-6 h-6" />
                        Create Character
                    </motion.button>
                </div>
                
                {/* Primary Characters Slideshow */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-white">Featured Characters</h3>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {groupedCharacters.Primary.map((character, index) => (
                            <motion.div
                                key={character.id}
                                className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-6 cursor-pointer min-w-[320px] border border-white/20"
                                whileHover={{ scale: 1.02, y: -5 }}
                                onClick={() => navigate(`/book/${book?.id}/version/${version?.id}/character/${character.id}`)}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <img 
                                            src={character.avatar} 
                                            alt={character.fullName}
                                            className="w-20 h-20 rounded-full object-cover border-3 border-white/30"
                                        />
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                                            <span className="text-xs font-bold text-white">
                                                {character.characterType === 'Primary' ? '1' : character.characterType === 'Secondary' ? '2' : '3'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-lg mb-1">
                                            {character.fullName}
                                        </h4>
                                        <p className="text-purple-200 text-sm mb-2">
                                            {character.role}
                                        </p>
                                        <blockquote className="text-white/90 text-sm italic">
                                            "{character.description || 'A mysterious character with untold stories...'}"
                                        </blockquote>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                character.characterType === 'Primary' 
                                                    ? 'bg-purple-400/30 text-purple-100 border border-purple-300/30'
                                                    : 'bg-blue-400/30 text-blue-100 border border-blue-300/30'
                                            }`}>
                                                {character.characterType}
                                            </span>
                                            <span className="text-xs text-purple-200">
                                                {character.arcs.length} arc{character.arcs.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        {groupedCharacters.Primary.length === 0 && (
                            <div className="flex-shrink-0 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-6 min-w-[320px] flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-white/70 mb-2">No primary characters yet</p>
                                    <motion.button
                                        onClick={() => navigate('/tools/character-profile-builder')}
                                        className="text-white underline hover:text-purple-200 transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        Create your first character
                                    </motion.button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCharacterGrid = () => (
        <div className="space-y-8">
            {Object.entries(groupedCharacters).map(([type, characters]) => (
                characters.length > 0 && (
                    <div key={type}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {type} Characters
                            </h3>
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-sm font-medium">
                                {characters.length} character{characters.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {characters.map((character) => (
                                <motion.div
                                    key={character.id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 dark:border-gray-700 cursor-pointer group relative overflow-hidden"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    onClick={() => navigate(`/book/${book?.id}/version/${version?.id}/character/${character.id}`)}
                                >
                                    {/* Background Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    
                                    <div className="relative z-10">
                                        {/* Header with Avatar and Basic Info */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="relative">
                                                <img 
                                                    src={character.avatar} 
                                                    alt={character.fullName}
                                                    className="w-16 h-16 rounded-xl object-cover border-3 border-gray-200 dark:border-gray-600 group-hover:border-purple-300 dark:group-hover:border-purple-500 transition-colors"
                                                />
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-bold text-white">
                                                        {character.characterType === 'Primary' ? '1' : character.characterType === 'Secondary' ? '2' : '3'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                    {character.fullName}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                    {character.role}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                                                        character.characterType === 'Primary' 
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                                            : character.characterType === 'Secondary'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                        {character.characterType}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                            {character.description}
                                        </p>

                                        {/* Character Stats */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Character Arcs</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {character.arcs.length} arc{character.arcs.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Completed</span>
                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                    {character.arcs.filter(arc => arc.status === 'Completed').length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">In Progress</span>
                                                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                                    {character.arcs.filter(arc => arc.status === 'In Progress').length}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Relationships Preview */}
                                        {character.arcs.some(arc => arc.relationships.length > 0) && (
                                            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Connected to:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {character.arcs
                                                        .flatMap(arc => arc.relationships)
                                                        .slice(0, 3)
                                                        .map((relId, idx) => {
                                                            const relatedChar = sampleCharacters.find(c => c.id === relId);
                                                            return relatedChar ? (
                                                                <span 
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                                                                >
                                                                    {relatedChar.fullName.split(' ')[0]}
                                                                </span>
                                                            ) : null;
                                                        })
                                                    }
                                                    {character.arcs.flatMap(arc => arc.relationships).length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                                            +{character.arcs.flatMap(arc => arc.relationships).length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Indicators */}
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg">
                                                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );

    const renderCharacterList = () => (
        <div className="space-y-2">
            {filteredCharacters.map((character) => (
                <motion.div
                    key={character.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-600 cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate(`/book/${book?.id}/version/${version?.id}/character/${character.id}`)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img 
                                src={character.avatar} 
                                alt={character.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {character.fullName}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {character.role} • {character.characterType}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {character.arcs.length} arc{character.arcs.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                {character.arcs.filter(arc => arc.status === 'Completed').length} completed
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderRelationshipWeb = () => (
        <div className="h-[600px]">
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    className={theme === 'dark' ? 'dark' : ''}
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
                    <Panel position="top-left">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-sm">
                            <h4 className="font-semibold mb-2">Relationship Types</h4>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5 bg-purple-500"></div>
                                    <span>Mentor/Student</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5 bg-green-500"></div>
                                    <span>Allies</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5 bg-red-500"></div>
                                    <span>Conflict</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5 bg-yellow-500"></div>
                                    <span>Companions</span>
                                </div>
                            </div>
                        </div>
                    </Panel>
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );

    const renderContent = () => {
        switch (viewMode) {
            case 'grid':
                return renderCharacterGrid();
            case 'list':
                return renderCharacterList();
            case 'relationships':
                return renderRelationshipWeb();
            default:
                return renderCharacterGrid();
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Content - Header removed since search/controls are now in PlanningHeader */}
            <div className="flex-1 overflow-auto p-6">
                {viewMode !== 'relationships' && renderHeroSection()}
                {renderContent()}
            </div>
        </div>
    );
};

export default CharacterPage;
