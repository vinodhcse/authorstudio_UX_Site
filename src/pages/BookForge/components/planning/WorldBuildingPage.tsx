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
import { PlusIcon, MapIcon, GlobeIcon, BookOpenIcon, Wand2Icon, ScrollIcon, MapPinIcon } from '../../../../constants';
import CreateWorldModal from './modals/CreateWorldModal';
import LocationDetailsModal from './modals/LocationDetailsModal';
import ObjectDetailsModal from './modals/ObjectDetailsModal';
import LoreDetailsModal from './modals/LoreDetailsModal';
import MagicSystemDetailsModal from './modals/MagicSystemDetailsModal';
import { WorldData, Location, WorldObject, Lore, MagicSystem } from './types/WorldBuildingTypes';
import { sampleWorldData } from './data/sampleWorldData';
import AssetImageCard from '../../../../components/AssetImageCard';

interface WorldBuildingPageProps {
    book: Book;
    version: Version;
    theme: Theme;
}

const WorldBuildingPage: React.FC<WorldBuildingPageProps> = ({ book, theme }) => {
    const [worlds] = useState<WorldData[]>([sampleWorldData]);
    const [selectedWorldId, setSelectedWorldId] = useState<string>(worlds[0]?.id || '');
    const [activeTab, setActiveTab] = useState<'details' | 'locations' | 'objects' | 'lore' | 'magic-systems' | 'maps' | 'visualization'>('details');
    const [isCreateWorldModalOpen, setIsCreateWorldModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [selectedObject, setSelectedObject] = useState<WorldObject | null>(null);
    const [selectedLore, setSelectedLore] = useState<Lore | null>(null);
    const [selectedMagicSystem, setSelectedMagicSystem] = useState<MagicSystem | null>(null);

    const selectedWorld = useMemo(() => 
        worlds.find(w => w.id === selectedWorldId), 
        [worlds, selectedWorldId]
    );

    const tabs = [
        { id: 'details', label: 'World Details', icon: GlobeIcon },
        { id: 'locations', label: 'Locations', icon: MapPinIcon },
        { id: 'objects', label: 'Objects', icon: BookOpenIcon },
        { id: 'lore', label: 'Lore', icon: ScrollIcon },
        { id: 'magic-systems', label: 'Magic Systems', icon: Wand2Icon },
        { id: 'maps', label: 'Maps', icon: MapIcon },
        { id: 'visualization', label: 'Visualization', icon: GlobeIcon },
    ];

    const renderWorldDetails = () => {
        if (!selectedWorld) return null;

        return (
            <div className="p-6 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        {selectedWorld.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {selectedWorld.description}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Themes</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedWorld.themes.map((themeItem: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                        {themeItem}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedWorld.tags.map((tag: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">History</h4>
                        <div className="space-y-2">
                            {selectedWorld.history.map((event: any, idx: number) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                    <div className="flex justify-between items-start">
                                        <h5 className="font-medium text-gray-900 dark:text-gray-100">{event.event}</h5>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{event.date}</span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{event.eventNote}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderLocations = () => {
        if (!selectedWorld) return null;

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Locations</h3>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Add Location
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorld.locations.map((location: Location) => (
                        <AssetImageCard
                            key={location.id}
                            id={location.id}
                            name={location.name}
                            description={location.description}
                            imageUrl={location.image}
                            assetId={undefined}
                            entityType="location"
                            role="gallery"
                            bookId={book.id}
                            badges={[
                                { label: location.type, color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' }
                            ]}
                            metadata={[
                                { label: 'Region', value: location.region },
                                { label: 'Type', value: location.type }
                            ]}
                            onClick={() => setSelectedLocation(location)}
                            onImageUpdated={(assetId, imageUrl) => {
                                // TODO: Update location with new asset
                                console.log('Location image updated:', location.id, assetId, imageUrl);
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const renderObjects = () => {
        if (!selectedWorld) return null;

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Objects</h3>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Add Object
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorld.objects.map((object: WorldObject) => (
                        <AssetImageCard
                            key={object.id}
                            id={object.id}
                            name={object.name}
                            description={object.description}
                            imageUrl={object.image}
                            assetId={undefined}
                            entityType="object"
                            role="attachment"
                            bookId={book.id}
                            badges={[
                                { label: object.type, color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' }
                            ]}
                            metadata={[
                                { label: 'Origin', value: object.origin },
                                { label: 'Type', value: object.type }
                            ]}
                            onClick={() => setSelectedObject(object)}
                            onImageUpdated={(assetId, imageUrl) => {
                                // TODO: Update object with new asset
                                console.log('Object image updated:', object.id, assetId, imageUrl);
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const renderLore = () => {
        if (!selectedWorld) return null;

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Lore</h3>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Add Lore Entry
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorld.lore.map((loreEntry: Lore) => (
                        <AssetImageCard
                            key={loreEntry.id}
                            id={loreEntry.id}
                            name={loreEntry.title}
                            description={loreEntry.description}
                            imageUrl={undefined} // Lore entries typically don't have images
                            assetId={undefined}
                            entityType="world"
                            role="lore"
                            bookId={book.id}
                            badges={[
                                { label: loreEntry.category, color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' }
                            ]}
                            metadata={[
                                { label: 'Period', value: loreEntry.timeline.age },
                                { label: 'Key Figures', value: `${loreEntry.keyFigures.length}` }
                            ]}
                            onClick={() => setSelectedLore(loreEntry)}
                            onImageUpdated={(assetId, imageUrl) => {
                                // TODO: Update lore with new asset
                                console.log('Lore image updated:', loreEntry.id, assetId, imageUrl);
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const renderMagicSystems = () => {
        if (!selectedWorld) return null;

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Magic Systems</h3>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Add Magic System
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {selectedWorld.magicSystems.map((magicSystem: MagicSystem) => (
                        <AssetImageCard
                            key={magicSystem.id}
                            id={magicSystem.id}
                            name={magicSystem.name}
                            description={`Source: ${magicSystem.sourceOfPower}`}
                            assetId={undefined}
                            entityType="object"
                            role="gallery"
                            bookId={book.id}
                            badges={[{ label: magicSystem.category, color: 'purple' }]}
                            metadata={magicSystem.rules.slice(0, 2).map((rule, idx) => ({ 
                                label: `Rule ${idx + 1}`, 
                                value: rule 
                            }))}
                            onClick={() => setSelectedMagicSystem(magicSystem)}
                            onImageUpdated={(assetId) => {
                                // Handle magic system image update
                                console.log('Magic system image updated:', assetId);
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const renderMaps = () => {
        if (!selectedWorld) return null;

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Maps</h3>
                    <div className="flex gap-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                            <Wand2Icon className="w-4 h-4" />
                            Generate Map
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                            <PlusIcon className="w-4 h-4" />
                            Upload Map
                        </button>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorld.maps.map((mapUrl: string, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                            <img 
                                src={mapUrl} 
                                alt={`Map ${idx + 1}`}
                                className="w-full h-64 object-cover"
                            />
                            <div className="p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    Map {idx + 1}
                                </h4>
                                <div className="flex gap-2 mt-2">
                                    <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                                        View Full Size
                                    </button>
                                    <button className="text-green-600 dark:text-green-400 hover:underline text-sm">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </div>
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

        const [visualNodes, , onNodesChange] = useNodesState(nodes);
        const [visualEdges, , onEdgesChange] = useEdgesState(edges);

        return (
            <div className="h-full">
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
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'details':
                return renderWorldDetails();
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
                return renderWorldDetails();
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <GlobeIcon className="w-6 h-6 text-green-600" />
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            World Building
                        </h1>
                        
                        {/* World Selector */}
                        <select
                            value={selectedWorldId}
                            onChange={(e) => setSelectedWorldId(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                        >
                            {worlds.map((world) => (
                                <option key={world.id} value={world.id}>
                                    {world.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setIsCreateWorldModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Create New World
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mt-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <motion.button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                                    activeTab === tab.id
                                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'visualization' ? (
                    <ReactFlowProvider>
                        {renderTabContent()}
                    </ReactFlowProvider>
                ) : (
                    renderTabContent()
                )}
            </div>

            {/* Modals */}
            <CreateWorldModal
                isOpen={isCreateWorldModalOpen}
                onClose={() => setIsCreateWorldModalOpen(false)}
                theme={theme}
            />

            {selectedLocation && (
                <LocationDetailsModal
                    isOpen={!!selectedLocation}
                    location={selectedLocation}
                    onClose={() => setSelectedLocation(null)}
                    theme={theme}
                />
            )}

            {selectedObject && (
                <ObjectDetailsModal
                    isOpen={!!selectedObject}
                    object={selectedObject}
                    onClose={() => setSelectedObject(null)}
                    theme={theme}
                />
            )}

            {selectedLore && (
                <LoreDetailsModal
                    isOpen={!!selectedLore}
                    lore={selectedLore}
                    onClose={() => setSelectedLore(null)}
                    theme={theme}
                />
            )}

            {selectedMagicSystem && (
                <MagicSystemDetailsModal
                    isOpen={!!selectedMagicSystem}
                    magicSystem={selectedMagicSystem}
                    onClose={() => setSelectedMagicSystem(null)}
                    theme={theme}
                />
            )}
        </div>
    );
};

export default WorldBuildingPage;
