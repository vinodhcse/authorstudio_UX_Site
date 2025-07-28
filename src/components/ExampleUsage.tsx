import React, { useState } from 'react';
import { ReactFlow, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { ReactFlowIntegration, CustomNodeStorage } from '../pages/BookForge/components/EditorEnhancements';

const ExampleUsage: React.FC = () => {
  const [flowNodes, setFlowNodes] = useState<any[]>([]);
  const [flowEdges, setFlowEdges] = useState<any[]>([]);
  const [showFlow, setShowFlow] = useState(false);

  React.useEffect(() => {
    // Subscribe to React Flow integration updates
    const flowIntegration = ReactFlowIntegration.getInstance();
    const unsubscribe = flowIntegration.subscribe((nodes, edges) => {
      setFlowNodes(nodes);
      setFlowEdges(edges);
    });

    return unsubscribe;
  }, []);

  const exportData = () => {
    const data = CustomNodeStorage.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-nodes-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          CustomNodeStorage.importData(data);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data: ' + error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Tiptap Custom Nodes Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Demonstration of Scene Beat, Note Section, and Character Impersonation components
        </p>
      </header>

      {/* Usage Instructions */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700"
      >
        <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-3">
          🚀 How to Use
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-300">
          <li>Go to the Book Forge editor page</li>
          <li>Type <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-sm">/</code> to open the slash menu</li>
          <li>Select one of the new options:
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li><strong>🔗 Scene Beat</strong> - Interactive scene planning</li>
              <li><strong>🗒️ Note Section</strong> - Persistent notes with labels</li>
              <li><strong>🎭 Character Impersonation</strong> - AI character roleplay</li>
            </ul>
          </li>
        </ol>
      </motion.section>

      {/* Feature Showcase */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Scene Beat Features */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🔗</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Scene Beat Section
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Expand/collapse detailed view</li>
            <li>• Edit scene summary and goals</li>
            <li>• AI character detection</li>
            <li>• Status management (Draft → Published)</li>
            <li>• React Flow canvas integration</li>
          </ul>
        </motion.div>

        {/* Note Section Features */}
        <motion.div 
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🗒️</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Note Section
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Auto-save functionality</li>
            <li>• @label system for organization</li>
            <li>• Color-coded label categories</li>
            <li>• Quick label insertion</li>
            <li>• Persistent reminders</li>
          </ul>
        </motion.div>

        {/* Character Impersonation Features */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🎭</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Character Impersonation
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Character selection dropdown</li>
            <li>• AI-powered character responses</li>
            <li>• Conversation history display</li>
            <li>• Character avatars and personalities</li>
            <li>• Context-aware dialogue</li>
          </ul>
        </motion.div>
      </div>

      {/* React Flow Integration */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            React Flow Canvas Integration
          </h3>
          <button
            onClick={() => setShowFlow(!showFlow)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showFlow ? 'Hide Canvas' : 'Show Canvas'}
          </button>
        </div>
        
        {showFlow && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 400 }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
          >
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              className="bg-gray-50 dark:bg-gray-900"
            >
              <Controls />
              <Background />
            </ReactFlow>
          </motion.div>
        )}
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          Scene Beat nodes automatically appear on this canvas for visual story mapping.
          {flowNodes.length === 0 && ' Add Scene Beat sections to see them here!'}
        </p>
      </motion.section>

      {/* Data Management */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Data Management
        </h3>
        <div className="flex gap-4">
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Export Data
          </button>
          <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          Export your custom node data for backup or import previously saved data.
        </p>
      </motion.section>

      {/* Character Database Preview */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Available Characters
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: 'Nemar', avatar: '⚔️', role: 'Protagonist' },
            { name: 'Attican', avatar: '🧙‍♂️', role: 'Mentor' },
            { name: 'Elissa', avatar: '🏹', role: 'Archer' },
            { name: 'Ferris', avatar: '🛡️', role: 'Companion' },
            { name: 'Garius', avatar: '👑', role: 'Leader' }
          ].map((character) => (
            <div key={character.name} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">{character.avatar}</div>
              <div className="font-medium text-gray-800 dark:text-gray-200">{character.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{character.role}</div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default ExampleUsage;
