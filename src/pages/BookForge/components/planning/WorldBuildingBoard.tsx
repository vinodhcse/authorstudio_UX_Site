import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    ReactFlowProvider,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Book, Version, Theme } from '../../../../types';
import { PlusIcon, SearchIcon, LayoutGridIcon, LayoutListIcon, MapIcon } from '../../../../constants';

// Custom node types for world building elements
const WorldElementNode: React.FC<any> = ({ data, selected }) => {
    const getNodeStyle = () => {
        switch (data.type) {
            case 'location':
                return 'border-green-500 bg-green-50 dark:bg-green-900/20';
            case 'culture':
                return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
            case 'magic-system':
                return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
            case 'technology':
                return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
            case 'politics':
                return 'border-red-500 bg-red-50 dark:bg-red-900/20';
            default:
                return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    return (
        <motion.div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 min-w-[200px] ${
                selected ? 'border-blue-500' : getNodeStyle()
            }`}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {data.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        data.type === 'location' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : data.type === 'culture'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : data.type === 'magic-system'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : data.type === 'technology'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : data.type === 'politics'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                        {data.type.replace('-', ' ')}
                    </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                    {data.description}
                </p>
                {data.tags && data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {data.tags.map((tag: string, idx: number) => (
                            <span 
                                key={idx} 
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Custom edge styles
const defaultEdgeOptions = {
    style: { stroke: '#10b981', strokeWidth: 2 },
    type: 'smoothstep',
    animated: true,
};

interface WorldBuildingBoardProps {
    book: Book;
    version: Version;
    theme: Theme;
}

const WorldBuildingBoard: React.FC<WorldBuildingBoardProps> = ({ theme }) => {
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'location' | 'culture' | 'magic-system' | 'technology' | 'politics'>('all');

    // Sample world building data
    const initialNodes: Node[] = [
        {
            id: '1',
            type: 'worldElement',
            position: { x: 100, y: 100 },
            data: {
                name: 'Kingdom of Aethros',
                description: 'A floating island kingdom powered by crystalline magic',
                type: 'location',
                tags: ['floating', 'kingdom', 'crystal-magic']
            }
        },
        {
            id: '2',
            type: 'worldElement',
            position: { x: 400, y: 100 },
            data: {
                name: 'The Voidwalkers',
                description: 'Ancient nomadic tribe that can travel between dimensions',
                type: 'culture',
                tags: ['nomadic', 'dimensional-travel', 'ancient']
            }
        },
        {
            id: '3',
            type: 'worldElement',
            position: { x: 700, y: 100 },
            data: {
                name: 'Starlight Manipulation',
                description: 'Magic system based on capturing and redirecting starlight',
                type: 'magic-system',
                tags: ['starlight', 'celestial', 'energy-based']
            }
        },
        {
            id: '4',
            type: 'worldElement',
            position: { x: 250, y: 300 },
            data: {
                name: 'Crystal Resonance Tech',
                description: 'Technology that amplifies magical crystals for various purposes',
                type: 'technology',
                tags: ['crystal', 'amplification', 'magitech']
            }
        },
        {
            id: '5',
            type: 'worldElement',
            position: { x: 550, y: 300 },
            data: {
                name: 'The Council of Stars',
                description: 'Governing body that oversees inter-dimensional politics',
                type: 'politics',
                tags: ['council', 'inter-dimensional', 'governance']
            }
        }
    ];

    const initialEdges: Edge[] = [
        { id: 'e1-4', source: '1', target: '4', ...defaultEdgeOptions },
        { id: 'e2-5', source: '2', target: '5', ...defaultEdgeOptions },
        { id: 'e3-1', source: '3', target: '1', ...defaultEdgeOptions },
        { id: 'e4-3', source: '4', target: '3', ...defaultEdgeOptions },
        { id: 'e5-2', source: '5', target: '2', ...defaultEdgeOptions },
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const nodeTypes = useMemo(() => ({
        worldElement: WorldElementNode,
    }), []);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // Filter nodes based on search and filter criteria
    const filteredNodes = useMemo(() => {
        return nodes.filter(node => {
            const matchesSearch = searchQuery === '' || 
                node.data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.data.description.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesFilter = selectedFilter === 'all' || node.data.type === selectedFilter;
            
            return matchesSearch && matchesFilter;
        });
    }, [nodes, searchQuery, selectedFilter]);

    const handleAddWorldElement = () => {
        const newId = `${nodes.length + 1}`;
        const newNode: Node = {
            id: newId,
            type: 'worldElement',
            position: { x: Math.random() * 500 + 100, y: Math.random() * 400 + 100 },
            data: {
                name: 'New World Element',
                description: 'Click to edit this world element...',
                type: 'location',
                tags: []
            }
        };
        setNodes(nds => [...nds, newNode]);
    };

    const renderListView = () => {
        return (
            <div className="p-6 space-y-4">
                <div className="grid gap-4">
                    {filteredNodes.map((node) => (
                        <motion.div
                            key={node.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-600"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        {node.data.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                        {node.data.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span>Tags: {node.data.tags.join(', ')}</span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs rounded-full capitalize ${
                                    node.data.type === 'location' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : node.data.type === 'culture'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : node.data.type === 'magic-system'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                        : node.data.type === 'technology'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                        : node.data.type === 'politics'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                    {node.data.type.replace('-', ' ')}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    const renderBoardView = () => {
        return (
            <div className="h-full">
                <ReactFlow
                    nodes={filteredNodes}
                    edges={edges.filter(edge => 
                        filteredNodes.some(n => n.id === edge.source) && 
                        filteredNodes.some(n => n.id === edge.target)
                    )}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
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
                    <Panel position="top-right">
                        <motion.button
                            onClick={handleAddWorldElement}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add World Element
                        </motion.button>
                    </Panel>
                </ReactFlow>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header with controls */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <MapIcon className="w-5 h-5 text-green-600" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                World Building Board
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setViewMode('board')}
                                className={`p-2 rounded-lg ${viewMode === 'board' 
                                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <LayoutGridIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg ${viewMode === 'list' 
                                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <LayoutListIcon className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search world elements..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter */}
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                        >
                            <option value="all">All Types</option>
                            <option value="location">Locations</option>
                            <option value="culture">Cultures</option>
                            <option value="magic-system">Magic Systems</option>
                            <option value="technology">Technology</option>
                            <option value="politics">Politics</option>
                        </select>

                        {viewMode === 'list' && (
                            <motion.button
                                onClick={handleAddWorldElement}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add World Element
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'board' ? (
                    <ReactFlowProvider>
                        {renderBoardView()}
                    </ReactFlowProvider>
                ) : (
                    renderListView()
                )}
            </div>
        </div>
    );
};

export default WorldBuildingBoard;
