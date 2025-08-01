import React, { useState, useMemo, useEffect } from 'react';
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
import { PlusIcon, MapIcon, GlobeIcon, BookOpenIcon, Wand2Icon, ScrollIcon, MapPinIcon, EditIcon } from '../../../../constants';
import { useBookContext, useCurrentBookAndVersion } from '../../../../contexts/BookContext';
import CreateWorldModal from './modals/CreateWorldModal';
import CreateLocationModal from './modals/CreateLocationModal';
import CreateObjectModal from './modals/CreateObjectModal';
import CreateLoreModal from './modals/CreateLoreModal';
import CreateMagicSystemModal from './modals/CreateMagicSystemModal';
import WorldEditModal from './modals/WorldEditModal';
import LocationDetailsModal from './modals/LocationDetailsModal';
import ObjectDetailsModal from './modals/ObjectDetailsModal';
import LoreDetailsModal from './modals/LoreDetailsModal';
import MagicSystemDetailsModal from './modals/MagicSystemDetailsModal';
import { Location, WorldObject, Lore, MagicSystem } from './types/WorldBuildingTypes';

interface WorldBuildingBoardProps {
    book: Book;
    version: Version;
    theme: Theme;
    searchQuery?: string;
}

type WorldTab = 'locations' | 'objects' | 'lore' | 'magic-systems' | 'maps' | 'visualization';

const WorldBuildingBoard: React.FC<WorldBuildingBoardProps> = ({ theme, searchQuery: externalSearchQuery = '' }) => {
    const { bookId, versionId } = useCurrentBookAndVersion();
    const { 
        getWorlds, 
        selectedWorldId, 
        setSelectedWorldId,
        updateWorld,
        getLocations,
        createLocation,
        updateLocation,
        deleteLocation,
        getWorldObjects,
        createWorldObject,
        updateWorldObject,
        deleteWorldObject,
        getLore,
        createLore,
        updateLore,
        deleteLore,
        getMagicSystems,
        createMagicSystem,
        updateMagicSystem,
        deleteMagicSystem
    } = useBookContext();
    
    const worlds = useMemo(() => {
        const result = bookId && versionId ? getWorlds(bookId, versionId) : [];
        return result;
    }, [bookId, versionId, getWorlds]);

    // Auto-select first world if none selected and worlds exist
    React.useEffect(() => {
        if (worlds.length > 0 && !selectedWorldId) {
            setSelectedWorldId(worlds[0].id);
        }
    }, [worlds, selectedWorldId, setSelectedWorldId]);
    const [activeTab, setActiveTab] = useState<WorldTab>('locations');
    const [isCreateWorldModalOpen, setIsCreateWorldModalOpen] = useState(false);
    const [isEditWorldModalOpen, setIsEditWorldModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [selectedObject, setSelectedObject] = useState<WorldObject | null>(null);
    const [selectedLore, setSelectedLore] = useState<Lore | null>(null);
    const [selectedMagicSystem, setSelectedMagicSystem] = useState<MagicSystem | null>(null);
    
    // Create modals state
    const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
    const [isCreateObjectModalOpen, setIsCreateObjectModalOpen] = useState(false);
    const [isCreateLoreModalOpen, setIsCreateLoreModalOpen] = useState(false);
    const [isCreateMagicSystemModalOpen, setIsCreateMagicSystemModalOpen] = useState(false);
    
    // Use external search query instead of internal state
    const searchQuery = externalSearchQuery;

    // Listen for create world events from header
    useEffect(() => {
        const handleCreateWorld = () => {
            setIsCreateWorldModalOpen(true);
        };

        window.addEventListener('triggerCreateWorld', handleCreateWorld);
        return () => window.removeEventListener('triggerCreateWorld', handleCreateWorld);
    }, []);

    // Filter functions for search
    const filterBySearch = (items: any[], searchFields: string[]) => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter(item => 
            searchFields.some(field => {
                const value = field.split('.').reduce((obj, key) => obj?.[key], item);
                return typeof value === 'string' && value.toLowerCase().includes(query);
            })
        );
    };

    const selectedWorld = useMemo(() => 
        worlds.find(w => w.id === selectedWorldId), 
        [worlds, selectedWorldId]
    );

    // Save handlers
    const handleSaveWorld = (updatedWorld: any) => {
        if (bookId && versionId && selectedWorldId) {
            updateWorld(bookId, versionId, selectedWorldId, updatedWorld);
        }
    };

    const handleSaveLocation = (updatedLocation: Location) => {
        if (bookId && versionId && selectedWorldId) {
            updateLocation(bookId, versionId, selectedWorldId, updatedLocation.id, updatedLocation);
        }
    };

    const handleSaveObject = (updatedObject: WorldObject) => {
        if (bookId && versionId && selectedWorldId) {
            updateWorldObject(bookId, versionId, selectedWorldId, updatedObject.id, updatedObject);
        }
    };

    const handleSaveLore = (updatedLore: Lore) => {
        if (bookId && versionId && selectedWorldId) {
            updateLore(bookId, versionId, selectedWorldId, updatedLore.id, updatedLore);
        }
    };

    const handleSaveMagicSystem = (updatedMagicSystem: MagicSystem) => {
        if (bookId && versionId && selectedWorldId) {
            updateMagicSystem(bookId, versionId, selectedWorldId, updatedMagicSystem.id, updatedMagicSystem);
        }
    };

    // Create handlers
    const handleCreateLocation = (locationData: any) => {
        if (bookId && versionId && selectedWorldId) {
            createLocation(bookId, versionId, selectedWorldId, locationData);
        }
    };

    const handleCreateObject = (objectData: any) => {
        if (bookId && versionId && selectedWorldId) {
            createWorldObject(bookId, versionId, selectedWorldId, objectData);
        }
    };

    const handleCreateLore = (loreData: any) => {
        if (bookId && versionId && selectedWorldId) {
            createLore(bookId, versionId, selectedWorldId, loreData);
        }
    };

    const handleCreateMagicSystem = (magicSystemData: any) => {
        if (bookId && versionId && selectedWorldId) {
            createMagicSystem(bookId, versionId, selectedWorldId, magicSystemData);
        }
    };

    const tabs = [
        { id: 'locations', label: 'Locations', icon: MapPinIcon },
        { id: 'objects', label: 'Objects', icon: BookOpenIcon },
        { id: 'lore', label: 'Lore', icon: ScrollIcon },
        { id: 'magic-systems', label: 'Magic Systems', icon: Wand2Icon },
        { id: 'maps', label: 'Maps', icon: MapIcon },
        { id: 'visualization', label: 'Visualization', icon: GlobeIcon },
    ];


    // Hero section for world details similar to CharacterDetailsView
    const WorldHeroSection: React.FC = () => {
        if (!selectedWorld) return null;

        return (
            <div className="space-y-6">
                {/* Hero Section - Reduced Size */}
                <div className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-xl p-4 md:p-6 border border-black/10 dark:border-white/10 shadow-lg">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                        {/* Left Side: World Image/Icon - Smaller */}
                        <motion.div
                            className="group w-full md:w-1/4 lg:w-1/5 flex-shrink-0 relative"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="absolute -inset-2 bg-gradient-to-r from-green-600 via-blue-500 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg z-0"></div>
                            <motion.div className="relative aspect-[4/5] rounded-lg shadow-xl overflow-hidden z-10 bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center">
                                <GlobeIcon className="w-16 h-16 text-white" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 cursor-pointer">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setIsEditWorldModalOpen(true)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            {/* World Selector and Create Button */}
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <select
                                            value={selectedWorldId || ''}
                                            onChange={(e) => setSelectedWorldId(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        >
                                            {worlds.map((world) => (
                                                <option key={world.id} value={world.id}>
                                                    {world.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setIsCreateWorldModalOpen(true)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            Create World
                                        </button>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                        {selectedWorld.name}
                                    </h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                                        {selectedWorld.description}
                                    </p>
                                </div>
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
            </div>
        );
    };

    // Tab switcher similar to CharacterDetailsView
    const TabSwitcher: React.FC = () => (
        <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-1 p-1 rounded-full bg-gray-200/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50">
                {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as WorldTab)}
                            className="relative px-4 py-2 text-sm font-medium rounded-full focus:outline-none transition-colors"
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    className="absolute inset-0 bg-white dark:bg-black rounded-full shadow-md"
                                    layoutId="activeWorldBuildingTabPill"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className={`relative z-10 flex items-center gap-2 ${
                                activeTab === tab.id 
                                    ? 'text-black dark:text-white' 
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}>
                                <IconComponent className="w-4 h-4" />
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderLocations = () => {
        if (!selectedWorld) return null;

        const filteredLocations = filterBySearch(selectedWorld.locations, ['name', 'description', 'type', 'region']);

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Locations {searchQuery && `(${filteredLocations.length} found)`}
                    </h3>
                    <button 
                        onClick={() => setIsCreateLocationModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Location
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLocations.map((location: Location) => (
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

        const filteredObjects = filterBySearch(selectedWorld.objects, ['name', 'description', 'type']);

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Objects {searchQuery && `(${filteredObjects.length} found)`}
                    </h3>
                    <button 
                        onClick={() => setIsCreateObjectModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Object
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredObjects.map((object: WorldObject) => (
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

        const filteredLore = filterBySearch(selectedWorld.lore, ['name', 'description', 'category']);

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Lore {searchQuery && `(${filteredLore.length} found)`}
                    </h3>
                    <button 
                        onClick={() => setIsCreateLoreModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Lore
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLore.map((loreItem: Lore) => (
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

        const filteredMagicSystems = filterBySearch(selectedWorld.magicSystems, ['name', 'description', 'type']);

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Magic Systems {searchQuery && `(${filteredMagicSystems.length} found)`}
                    </h3>
                    <button 
                        onClick={() => setIsCreateMagicSystemModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Magic System
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMagicSystems.map((magicSystem: MagicSystem) => (
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

    // Empty state when no worlds exist
    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center min-h-96 p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6 max-w-md"
            >
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center">
                    <GlobeIcon className="w-12 h-12 text-white" />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        No Worlds Created Yet
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Start building your story's universe by creating your first world. 
                        Define locations, objects, lore, and magic systems to bring your narrative to life.
                    </p>
                </div>
                
                <button 
                    onClick={() => setIsCreateWorldModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    Create Your First World
                </button>
            </motion.div>
        </div>
    );

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 min-h-screen`}>
            {/* Header moved to the planning page level */}
            <div className="p-6 space-y-6">
                {worlds.length === 0 ? (
                    // Show empty state when no worlds exist
                    renderEmptyState()
                ) : (
                    <>
                        {/* World Hero Section - conditional, hide when searching */}
                        {!searchQuery?.trim() && <WorldHeroSection />}

                        {/* Tab Navigation */}
                        <TabSwitcher />

                        {/* Tab Content */}
                        <motion.div 
                            key={activeTab}
                            className="min-h-96"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </>
                )}
            </div>

            {/* Modals */}
            {isCreateWorldModalOpen && (
                <CreateWorldModal
                    isOpen={isCreateWorldModalOpen}
                    onClose={() => setIsCreateWorldModalOpen(false)}
                    theme={theme}
                />
            )}

            {isCreateLocationModalOpen && (
                <CreateLocationModal
                    isOpen={isCreateLocationModalOpen}
                    onClose={() => setIsCreateLocationModalOpen(false)}
                    onSave={handleCreateLocation}
                    theme={theme}
                    existingLocations={selectedWorld?.locations || []}
                />
            )}

            {isCreateObjectModalOpen && (
                <CreateObjectModal
                    isOpen={isCreateObjectModalOpen}
                    onClose={() => setIsCreateObjectModalOpen(false)}
                    onSave={handleCreateObject}
                    theme={theme}
                    existingCharacters={[]} // TODO: Add actual characters when character system is implemented
                />
            )}

            {isEditWorldModalOpen && selectedWorld && (
                <WorldEditModal
                    world={selectedWorld}
                    isOpen={isEditWorldModalOpen}
                    onClose={() => setIsEditWorldModalOpen(false)}
                    onSave={handleSaveWorld}
                    theme={theme}
                />
            )}

            {selectedLocation && (
                <LocationDetailsModal
                    location={selectedLocation}
                    isOpen={!!selectedLocation}
                    onClose={() => setSelectedLocation(null)}
                    onSave={handleSaveLocation}
                    theme={theme}
                    allLocations={selectedWorld?.locations || []}
                />
            )}

            {selectedObject && (
                <ObjectDetailsModal
                    object={selectedObject}
                    isOpen={!!selectedObject}
                    onClose={() => setSelectedObject(null)}
                    onSave={handleSaveObject}
                    theme={theme}
                />
            )}

            {selectedLore && (
                <LoreDetailsModal
                    lore={selectedLore}
                    isOpen={!!selectedLore}
                    onClose={() => setSelectedLore(null)}
                    onSave={handleSaveLore}
                    theme={theme}
                />
            )}

            {selectedMagicSystem && (
                <MagicSystemDetailsModal
                    magicSystem={selectedMagicSystem}
                    isOpen={!!selectedMagicSystem}
                    onClose={() => setSelectedMagicSystem(null)}
                    onSave={handleSaveMagicSystem}
                    theme={theme}
                />
            )}

            {isCreateLoreModalOpen && (
                <CreateLoreModal
                    isOpen={isCreateLoreModalOpen}
                    onClose={() => setIsCreateLoreModalOpen(false)}
                    onSave={handleCreateLore}
                    theme={theme}
                />
            )}

            {isCreateMagicSystemModalOpen && (
                <CreateMagicSystemModal
                    isOpen={isCreateMagicSystemModalOpen}
                    onClose={() => setIsCreateMagicSystemModalOpen(false)}
                    onSave={handleCreateMagicSystem}
                    theme={theme}
                />
            )}
        </div>
    );
};

export default WorldBuildingBoard;
