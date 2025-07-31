import React, { useCallback, useMemo } from 'react';
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
import { PlusIcon } from '../../../../constants';

// Custom node types for plot elements
const PlotNode: React.FC<any> = ({ data, selected }) => {
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
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {data.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                        data.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : data.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                        {data.status}
                    </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                    {data.description}
                </p>
                {data.characters && data.characters.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {data.characters.map((char: string, idx: number) => (
                            <span 
                                key={idx} 
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs"
                            >
                                {char}
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
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
    type: 'smoothstep',
    animated: true,
};

interface PlotArcsBoardProps {
    book: Book;
    version: Version;
    theme: Theme;
    searchQuery?: string;
    viewMode?: 'board' | 'list';
    statusFilter?: 'all' | 'completed' | 'in-progress' | 'planning';
}

const PlotArcsBoard: React.FC<PlotArcsBoardProps> = ({ 
    theme, 
    searchQuery = '', 
    viewMode = 'board', 
    statusFilter = 'all' 
}) => {

    // Sample plot arc data
    const initialNodes: Node[] = [
        {
            id: '1',
            type: 'plotNode',
            position: { x: 100, y: 100 },
            data: {
                title: 'Inciting Incident',
                description: 'Nemar discovers the ancient tome that changes everything',
                status: 'completed',
                characters: ['Nemar', 'Elissa'],
                chapter: 'Chapter 1'
            }
        },
        {
            id: '2',
            type: 'plotNode',
            position: { x: 400, y: 100 },
            data: {
                title: 'First Challenge',
                description: 'The party encounters their first major obstacle',
                status: 'in-progress',
                characters: ['Nemar', 'Attican', 'Ferris'],
                chapter: 'Chapter 3'
            }
        },
        {
            id: '3',
            type: 'plotNode',
            position: { x: 700, y: 100 },
            data: {
                title: 'Midpoint Twist',
                description: 'A shocking revelation changes the characters perspective',
                status: 'planning',
                characters: ['Garius', 'Nemar'],
                chapter: 'Chapter 6'
            }
        },
        {
            id: '4',
            type: 'plotNode',
            position: { x: 250, y: 300 },
            data: {
                title: 'Character Development',
                description: 'Nemar learns about his true heritage',
                status: 'completed',
                characters: ['Nemar'],
                chapter: 'Chapter 2'
            }
        },
        {
            id: '5',
            type: 'plotNode',
            position: { x: 550, y: 300 },
            data: {
                title: 'Climax',
                description: 'The final confrontation with the main antagonist',
                status: 'planning',
                characters: ['Nemar', 'Attican', 'Elissa', 'Ferris', 'Garius'],
                chapter: 'Chapter 8'
            }
        }
    ];

    const initialEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2', ...defaultEdgeOptions },
        { id: 'e2-3', source: '2', target: '3', ...defaultEdgeOptions },
        { id: 'e1-4', source: '1', target: '4', ...defaultEdgeOptions },
        { id: 'e4-5', source: '4', target: '5', ...defaultEdgeOptions },
        { id: 'e3-5', source: '3', target: '5', ...defaultEdgeOptions },
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const nodeTypes = useMemo(() => ({
        plotNode: PlotNode,
    }), []);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // Filter nodes based on search and filter criteria
    const filteredNodes = useMemo(() => {
        return nodes.filter(node => {
            const matchesSearch = searchQuery === '' || 
                node.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.data.description.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesFilter = statusFilter === 'all' || node.data.status === statusFilter;
            
            return matchesSearch && matchesFilter;
        });
    }, [nodes, searchQuery, statusFilter]);

    const handleAddPlotPoint = () => {
        const newId = `${nodes.length + 1}`;
        const newNode: Node = {
            id: newId,
            type: 'plotNode',
            position: { x: Math.random() * 500 + 100, y: Math.random() * 400 + 100 },
            data: {
                title: 'New Plot Point',
                description: 'Click to edit this plot point...',
                status: 'planning',
                characters: [],
                chapter: 'TBD'
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
                                        {node.data.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                        {node.data.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span>Chapter: {node.data.chapter}</span>
                                        <span>•</span>
                                        <span>Characters: {node.data.characters.join(', ')}</span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs rounded-full ${
                                    node.data.status === 'completed' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : node.data.status === 'in-progress'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                    {node.data.status}
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
                            onClick={handleAddPlotPoint}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Plot Point
                        </motion.button>
                    </Panel>
                </ReactFlow>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Content - Header removed since search/controls are now in PlanningHeader */}
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

export default PlotArcsBoard;
