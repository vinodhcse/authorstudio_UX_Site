import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    UsersIcon, 
    PlusIcon, 
    SearchIcon, 
    LayoutGridIcon, 
    LayoutListIcon,
    NetworkIcon
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
}

type ViewMode = 'grid' | 'list' | 'timeline' | 'relationships';
type TabMode = 'Profile' | 'Arc Timeline' | 'Relationship Web';

const CharacterPage: React.FC<CharacterPageProps> = ({ theme }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [activeTab, setActiveTab] = useState<TabMode>('Profile');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'Primary' | 'Secondary' | 'Tertiary'>('all');
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

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

    const nodeTypes = React.useMemo(() => ({
        characterNode: CharacterNode,
    }), []);

    // Filter characters based on search and filter criteria
    const filteredCharacters = React.useMemo(() => {
        return sampleCharacters.filter(char => {
            const matchesSearch = searchQuery === '' || 
                char.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                char.role.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesFilter = selectedFilter === 'all' || char.characterType === selectedFilter;
            
            return matchesSearch && matchesFilter;
        });
    }, [searchQuery, selectedFilter]);

    // Group characters by type
    const groupedCharacters = React.useMemo(() => {
        return {
            Primary: filteredCharacters.filter(char => char.characterType === 'Primary'),
            Secondary: filteredCharacters.filter(char => char.characterType === 'Secondary'),
            Tertiary: filteredCharacters.filter(char => char.characterType === 'Tertiary')
        };
    }, [filteredCharacters]);

    const renderHeroSection = () => (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-800 dark:to-blue-800 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Character Gallery</h2>
                    <p className="text-purple-100 dark:text-purple-200">
                        Manage your story's characters and their development
                    </p>
                </div>
                <motion.button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <PlusIcon className="w-5 h-5" />
                    Create Character
                </motion.button>
            </div>
            
            {/* Primary Characters Slideshow */}
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                {groupedCharacters.Primary.map((character) => (
                    <motion.div
                        key={character.id}
                        className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-lg p-4 cursor-pointer"
                        whileHover={{ scale: 1.05, y: -5 }}
                        onClick={() => setSelectedCharacter(character)}
                    >
                        <img 
                            src={character.avatar} 
                            alt={character.fullName}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                        />
                        <h3 className="text-white font-medium text-center text-sm">
                            {character.fullName}
                        </h3>
                        <p className="text-purple-200 text-xs text-center">
                            {character.role}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderCharacterGrid = () => (
        <div className="space-y-6">
            {Object.entries(groupedCharacters).map(([type, characters]) => (
                characters.length > 0 && (
                    <div key={type}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            {type} Characters ({characters.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {characters.map((character) => (
                                <motion.div
                                    key={character.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-600 cursor-pointer"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setSelectedCharacter(character)}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <img 
                                            src={character.avatar} 
                                            alt={character.fullName}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                {character.fullName}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {character.role}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                        {character.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            character.characterType === 'Primary' 
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                : character.characterType === 'Secondary'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                        }`}>
                                            {character.characterType}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {character.arcs.length} arc{character.arcs.length !== 1 ? 's' : ''}
                                        </span>
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
                    onClick={() => setSelectedCharacter(character)}
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
                                    <div className="w-3 h-0.5 bg-purple-500"></div>
                                    <span>Mentor/Student</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-green-500"></div>
                                    <span>Alliance</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-red-500"></div>
                                    <span>Rivalry</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-yellow-500"></div>
                                    <span>Friendship</span>
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
            {/* Header with controls */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Characters
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg ${viewMode === 'grid' 
                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Grid View"
                            >
                                <LayoutGridIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg ${viewMode === 'list' 
                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="List View"
                            >
                                <LayoutListIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                                onClick={() => setViewMode('relationships')}
                                className={`p-2 rounded-lg ${viewMode === 'relationships' 
                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Relationship Web"
                            >
                                <NetworkIcon className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search characters..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter */}
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Types</option>
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                            <option value="Tertiary">Tertiary</option>
                        </select>

                        <motion.button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Character
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {viewMode !== 'relationships' && renderHeroSection()}
                {renderContent()}
            </div>

            {/* Character Detail Modal */}
            <AnimatePresence>
                {selectedCharacter && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedCharacter(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img 
                                            src={selectedCharacter.avatar} 
                                            alt={selectedCharacter.fullName}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {selectedCharacter.fullName}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {selectedCharacter.role} • {selectedCharacter.characterType}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedCharacter(null)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                {/* Tabs */}
                                <div className="flex gap-1 mt-4">
                                    {(['Profile', 'Arc Timeline', 'Relationship Web'] as TabMode[]).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                                activeTab === tab
                                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 overflow-auto max-h-96">
                                {activeTab === 'Profile' && (
                                    <div>
                                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                                            {selectedCharacter.description}
                                        </p>
                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                                    Character Arcs ({selectedCharacter.arcs.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {selectedCharacter.arcs.map((arc) => (
                                                        <div key={arc.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {arc.stage}
                                                                </h5>
                                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                                    arc.status === 'Completed' 
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                        : arc.status === 'In Progress'
                                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                                }`}>
                                                                    {arc.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                Goal: {arc.goal}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {arc.traits.map((trait, idx) => (
                                                                    <span 
                                                                        key={idx}
                                                                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                                                                    >
                                                                        {trait}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Arc Timeline' && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Character Development Timeline
                                        </h4>
                                        <div className="space-y-4">
                                            {selectedCharacter.arcs.map((arc, index) => (
                                                <div key={arc.id} className="relative">
                                                    {index < selectedCharacter.arcs.length - 1 && (
                                                        <div className="absolute left-4 top-8 w-0.5 h-12 bg-gray-300 dark:bg-gray-600"></div>
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                                            arc.status === 'Completed' ? 'bg-green-500' :
                                                            arc.status === 'In Progress' ? 'bg-yellow-500' : 'bg-gray-400'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                                                {arc.stage}
                                                            </h5>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {arc.goal}
                                                            </p>
                                                            <div className="flex gap-1 mt-1">
                                                                {arc.traits.map((trait, idx) => (
                                                                    <span 
                                                                        key={idx}
                                                                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                                                    >
                                                                        {trait}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Relationship Web' && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            Character Relationships
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedCharacter.arcs.flatMap(arc => arc.relationships).map((relId, index) => {
                                                const relatedChar = sampleCharacters.find(c => c.id === relId);
                                                if (!relatedChar) return null;
                                                
                                                return (
                                                    <div key={`${relId}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                        <img 
                                                            src={relatedChar.avatar} 
                                                            alt={relatedChar.fullName}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                        <div>
                                                            <h6 className="font-medium text-gray-900 dark:text-gray-100">
                                                                {relatedChar.fullName}
                                                            </h6>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {relatedChar.role}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Character Modal Placeholder */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Character Profile Builder
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                This will open the Character Profile Builder interface.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                                >
                                    Open Builder
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CharacterPage;
