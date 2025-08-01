import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Book, Version, Theme } from '../../../../types';
import { PlusIcon, MapIcon, GlobeIcon, BookOpenIcon, Wand2Icon, ScrollIcon, MapPinIcon, EditIcon, SearchIcon, ChevronDownIcon } from '../../../../constants';
import { MOCK_WORLD_DATA } from '../../../../constants';
import CreateWorldModal from './modals/CreateWorldModal';
import LocationDetailsModal from './modals/LocationDetailsModal';
import ObjectDetailsModal from './modals/ObjectDetailsModal';
import LoreDetailsModal from './modals/LoreDetailsModal';
import MagicSystemDetailsModal from './modals/MagicSystemDetailsModal';
import { WorldData, Location, WorldObject, Lore, MagicSystem } from './types/WorldBuildingTypes';

interface WorldBuildingBoardProps {
    book: Book;
    version: Version;
    theme: Theme;
}

type WorldTab = 'locations' | 'objects' | 'lore' | 'magic-systems' | 'maps' | 'visualization';

const WorldBuildingBoard: React.FC<WorldBuildingBoardProps> = ({ theme }) => {
    const [worlds] = useState<WorldData[]>(MOCK_WORLD_DATA);
    const [selectedWorldId, setSelectedWorldId] = useState<string>(worlds[0]?.id || '');
    const [activeTab, setActiveTab] = useState<WorldTab>('locations');
    const [isCreateWorldModalOpen, setIsCreateWorldModalOpen] = useState(false);
    const [isWorldDropdownOpen, setIsWorldDropdownOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [selectedObject, setSelectedObject] = useState<WorldObject | null>(null);
    const [selectedLore, setSelectedLore] = useState<Lore | null>(null);
    const [selectedMagicSystem, setSelectedMagicSystem] = useState<MagicSystem | null>(null);
    const [isEditingWorld, setIsEditingWorld] = useState(false);

    const selectedWorld = useMemo(() => 
        worlds.find(w => w.id === selectedWorldId), 
        [worlds, selectedWorldId]
    );

    const tabs = [
        { id: 'locations', label: 'Locations', icon: MapPinIcon },
        { id: 'objects', label: 'Objects', icon: BookOpenIcon },
        { id: 'lore', label: 'Lore', icon: ScrollIcon },
        { id: 'magic-systems', label: 'Magic Systems', icon: Wand2Icon },
        { id: 'maps', label: 'Maps', icon: MapIcon },
        { id: 'visualization', label: 'Visualization', icon: GlobeIcon },
    ];

    // Header component similar to CharacterDetailsView
    const WorldHeader: React.FC = () => (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <button
                        onClick={() => setIsWorldDropdownOpen(!isWorldDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <GlobeIcon className="w-4 h-4" />
                        <span>{selectedWorld?.name || 'Select World'}</span>
                        <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    
                    {isWorldDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                            <div className="p-2">
                                {worlds.map((world) => (
                                    <button
                                        key={world.id}
                                        onClick={() => {
                                            setSelectedWorldId(world.id);
                                            setIsWorldDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                            selectedWorldId === world.id ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100' : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <div className="font-medium">{world.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{world.description}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-600 p-2">
                                <button
                                    onClick={() => {
                                        setIsCreateWorldModalOpen(true);
                                        setIsWorldDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Create New World
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Hero section for world details similar to CharacterDetailsView
    const WorldHeroSection: React.FC = () => {
        if (!selectedWorld) return null;

        return (
            <div className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl p-6 md:p-8 border border-black/10 dark:border-white/10 shadow-lg mb-8">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                    {/* Left Side: World Image/Icon */}
                    <motion.div
                        className="group w-full md:w-1/3 lg:w-1/4 flex-shrink-0 relative"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-green-600 via-blue-500 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl z-0"></div>
                        <motion.div className="relative aspect-[3/4] rounded-lg shadow-2xl overflow-hidden z-10 bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center">
                            <GlobeIcon className="w-24 h-24 text-white" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 cursor-pointer">
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setIsEditingWorld(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                    
                    {/* Right Side: World Details */}
                    <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                {selectedWorld.name}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                                {selectedWorld.description}
                            </p>
                        </div>
                        
                        {/* World Stats Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg p-4">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-black/10 dark:border-white/10 pb-2">Themes</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedWorld.themes.map((theme, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                            {theme}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg p-4">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-black/10 dark:border-white/10 pb-2">Statistics</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Locations</span>
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">{selectedWorld.locations.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Objects</span>
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">{selectedWorld.objects.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lore</span>
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">{selectedWorld.lore.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Magic Systems</span>
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">{selectedWorld.magicSystems.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Tab switcher similar to CharacterDetailsView
    const TabSwitcher: React.FC = () => (
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as WorldTab)}
                            className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'border-green-500 text-green-600 dark:text-green-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                            <IconComponent className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderLocations = () => {
        if (!selectedWorld) return null;

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Locations</h3>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Add Location
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorld.locations.map((location: Location) => (
                        <motion.div
                            key={location.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedLocation(location)}
                        >
                            {location.image && (
                                <img 
                                    src={location.image} 
                                    alt={location.name}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {location.name}
                                    </h4>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedLocation(location);
                                        }}
                                        className="text-gray-400 hover:text-green-600 transition-colors"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                                    {location.description}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {location.region}
                                    </span>
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                                        {location.type}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    const renderObjects = () => {
        if (!selectedWorld) return null;

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Objects</h3>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Add Object
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorld.objects.map((object: WorldObject) => (
                        <motion.div
                            key={object.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedObject(object)}
                        >
                            {object.image && (
                                <img 
                                    src={object.image} 
                                    alt={object.name}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {object.name}
                                    </h4>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedObject(object);
                                        }}
                                        className="text-gray-400 hover:text-green-600 transition-colors"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                                    {object.description}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {object.origin}
                                    </span>
                                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                                        {object.type}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    const renderLore = () => {
        if (!selectedWorld) return null;

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Lore</h3>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Add Lore
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorld.lore.map((loreItem: Lore) => (
                        <motion.div
                            key={loreItem.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedLore(loreItem)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {loreItem.title}
                                </h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLore(loreItem);
                                    }}
                                    className="text-gray-400 hover:text-green-600 transition-colors"
                                >
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-3">
                                {loreItem.description}
                            </p>
                            <div className="flex justify-between items-center">
                                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-xs">
                                    {loreItem.category}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {loreItem.timeline.age}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMagicSystems = () => {
        if (!selectedWorld) return null;

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Magic Systems</h3>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Add Magic System
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorld.magicSystems.map((magicSystem: MagicSystem) => (
                        <motion.div
                            key={magicSystem.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedMagicSystem(magicSystem)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {magicSystem.name}
                                </h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMagicSystem(magicSystem);
                                    }}
                                    className="text-gray-400 hover:text-green-600 transition-colors"
                                >
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                                {magicSystem.sourceOfPower}
                            </p>
                            <div className="flex justify-between items-center">
                                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded text-xs">
                                    {magicSystem.category}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {magicSystem.practitioners.length} practitioners
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMaps = () => {
        if (!selectedWorld) return null;

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Maps</h3>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Add Map
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorld.maps.map((map: string, idx: number) => (
                        <motion.div
                            key={idx}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <MapIcon className="w-12 h-12 text-gray-400" />
                            </div>
                            <div className="p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Map {idx + 1}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {map}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    const renderVisualization = () => {
        if (!selectedWorld) return null;

        // Create nodes for ReactFlow visualization
        const nodes: Node[] = [
            {
                id: 'world',
                type: 'default',
                position: { x: 400, y: 50 },
                data: { label: selectedWorld.name },
                style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
            },
            ...selectedWorld.locations.map((location: Location, idx: number) => ({
                id: location.id,
                type: 'default',
                position: { x: 100 + (idx % 3) * 300, y: 200 + Math.floor(idx / 3) * 150 },
                data: { label: location.name },
                style: { background: '#3b82f6', color: 'white' }
            })),
            ...selectedWorld.magicSystems.map((magic: MagicSystem, idx: number) => ({
                id: magic.id,
                type: 'default',
                position: { x: 150 + idx * 250, y: 400 },
                data: { label: magic.name },
                style: { background: '#8b5cf6', color: 'white' }
            }))
        ];

        const edges: Edge[] = [
            ...selectedWorld.locations.map((location: Location) => ({
                id: `world-${location.id}`,
                source: 'world',
                target: location.id,
                style: { stroke: '#10b981', strokeWidth: 2 }
            })),
            ...selectedWorld.magicSystems.map((magic: MagicSystem) => ({
                id: `world-${magic.id}`,
                source: 'world',
                target: magic.id,
                style: { stroke: '#8b5cf6', strokeWidth: 2 }
            }))
        ];

        return (
            <ReactFlowProvider>
                <div className="h-96">
                    <ReactFlowVisualization nodes={nodes} edges={edges} theme={theme} />
                </div>
            </ReactFlowProvider>
        );
    };

    // Separate component for ReactFlow to avoid hooks issues
    const ReactFlowVisualization: React.FC<{ nodes: Node[], edges: Edge[], theme: Theme }> = ({ nodes, edges, theme }) => {
        const [visualNodes, , onNodesChange] = useNodesState(nodes);
        const [visualEdges, , onEdgesChange] = useEdgesState(edges);

        return (
            <ReactFlow
                nodes={visualNodes}
                edges={visualEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
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
            </ReactFlow>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'locations':
                return renderLocations();
            case 'objects':
                return renderObjects();
            case 'lore':
                return renderLore();
            case 'magic-systems':
                return renderMagicSystems();
            case 'maps':
                return renderMaps();
            case 'visualization':
                return renderVisualization();
            default:
                return renderLocations();
        }
    };

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 min-h-screen`}>
            {/* Header moved to the planning page level */}
            <div className="p-6 space-y-6">
                {/* World Hero Section */}
                <WorldHeroSection />

                {/* Tab Navigation */}
                <TabSwitcher />

                {/* Tab Content */}
                <div className="min-h-96">
                    {renderTabContent()}
                </div>
            </div>

            {/* Modals */}
            {isCreateWorldModalOpen && (
                <CreateWorldModal
                    isOpen={isCreateWorldModalOpen}
                    onClose={() => setIsCreateWorldModalOpen(false)}
                    theme={theme}
                />
            )}

            {selectedLocation && (
                <LocationDetailsModal
                    location={selectedLocation}
                    isOpen={!!selectedLocation}
                    onClose={() => setSelectedLocation(null)}
                    theme={theme}
                />
            )}

            {selectedObject && (
                <ObjectDetailsModal
                    object={selectedObject}
                    isOpen={!!selectedObject}
                    onClose={() => setSelectedObject(null)}
                    theme={theme}
                />
            )}

            {selectedLore && (
                <LoreDetailsModal
                    lore={selectedLore}
                    isOpen={!!selectedLore}
                    onClose={() => setSelectedLore(null)}
                    theme={theme}
                />
            )}

            {selectedMagicSystem && (
                <MagicSystemDetailsModal
                    magicSystem={selectedMagicSystem}
                    isOpen={!!selectedMagicSystem}
                    onClose={() => setSelectedMagicSystem(null)}
                    theme={theme}
                />
            )}
        </div>
    );
};

export default WorldBuildingBoard;
