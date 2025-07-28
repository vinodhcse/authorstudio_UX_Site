import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeViewWrapper } from '@tiptap/react';
import { SceneBeatData, CharacterDB, WorldEntity } from '../../types/custom-nodes';

interface SceneBeatNodeProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  editor: any;
  reactFlowCanvas?: any;
  characterDB?: CharacterDB[];
  worldEntities?: WorldEntity[];
}

const SceneBeatNode: React.FC<SceneBeatNodeProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode, 
  reactFlowCanvas,
  characterDB = []
}) => {
  const data: SceneBeatData = node.attrs;
  const [isExpanded, setIsExpanded] = useState(data.isExpanded || false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SceneBeatData>(data);
  const [isDetecting, setIsDetecting] = useState(false);

  // Status configuration
  const statusConfig = {
    Draft: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300' },
    Edited: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300' },
    Finalized: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300' }
  };

  const currentStatus = statusConfig[data.status];

  // Sync React Flow node data
  useEffect(() => {
    if (reactFlowCanvas && reactFlowCanvas.updateNodeData) {
      reactFlowCanvas.updateNodeData(data.id, data);
    }
  }, [data, reactFlowCanvas]);

  // Handle expansion
  const toggleExpansion = (e?: React.MouseEvent) => {
    console.log('Toggling expansion', e);
    // Prevent text selection when clicking to expand/collapse
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    updateAttributes({ ...data, isExpanded: newExpanded });
    console.log('Node expanded state:', newExpanded);
  };

  // Save changes
  const handleSave = () => {
    updateAttributes(editData);
    setIsEditing(false);
    
    // Sync with React Flow
    if (reactFlowCanvas && reactFlowCanvas.updateNodeData) {
      reactFlowCanvas.updateNodeData(editData.id, editData);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  

  // Detect characters using AI (mock implementation)
  const detectCharacters = async () => {
    setIsDetecting(true);
    // Mock AI detection - in real implementation, send summary to AI
    setTimeout(() => {
      const mockDetectedChars = characterDB
        .filter(char => data.summary.toLowerCase().includes(char.name.toLowerCase()))
        .map(char => char.name);
      setEditData((prev: SceneBeatData) => ({ 
        ...prev, 
        characters: [...new Set([...prev.characters, ...mockDetectedChars])] 
      }));
      setIsDetecting(false);
    }, 1500);
  };

  // Summarize scene using AI (mock implementation)
  const summarizeScene = async () => {
    // Mock AI summarization
    const mockSummary = "AI-generated summary based on the scene content and context.";
    setEditData((prev: SceneBeatData) => ({ ...prev, summary: mockSummary }));
  };

  // Validate consistency (mock implementation)
  const validateConsistency = async () => {
    // Mock consistency check
    alert("Consistency check: All characters and world entities are consistent with previous scenes.");
  };

  return (
    <NodeViewWrapper>
      <motion.div
        className="scene-beat-node my-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200"
        data-node-type="sceneBeat"
        data-node-id={data.id || `scene-beat-${data.sceneBeatIndex}`}
        data-chapter-name={data.chapterName}
        data-scene-beat-index={data.sceneBeatIndex}
        data-scene-title={data.summary}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      {/* Header - Collapsed View */}
      <div 
        className="node-header flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-2xl"
        onClick={toggleExpansion}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-gray-500 text-lg">▶</span>
          </motion.div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🔗</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {data.chapterName} – SceneBeat_{data.sceneBeatIndex}
              </h3>
              {!isExpanded && data.summary && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                  {data.summary}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
            {data.status}
          </span>
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-4">
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Summary
                    </label>
                    <textarea
                      value={editData.summary}
                      onChange={(e) => setEditData((prev: SceneBeatData) => ({ ...prev, summary: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 resize-none"
                      rows={3}
                      placeholder="What happens in this scene beat..."
                    />
                  </div>

                  {/* Goal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Goal
                    </label>
                    <input
                      type="text"
                      value={editData.goal}
                      onChange={(e) => setEditData((prev: SceneBeatData) => ({ ...prev, goal: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                      placeholder="Character or story goal driving this beat..."
                    />
                  </div>

                  {/* Characters */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Characters Involved
                      </label>
                      <motion.button
                        onClick={detectCharacters}
                        disabled={isDetecting}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-purple-600">✨</span>
                        {isDetecting ? 'Detecting...' : '🧠 Detect Characters'}
                      </motion.button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editData.characters.map((char: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                        >
                          <span className="text-blue-600">👤</span>
                          {char}
                          <button
                            onClick={() => setEditData((prev: SceneBeatData) => ({
                              ...prev,
                              characters: prev.characters.filter((_: string, i: number) => i !== index)
                            }))}
                            className="ml-1 hover:text-red-500"
                          >
                            <span className="text-red-500">✕</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* World Entities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      World Entities / Locations
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {editData.worldEntities.map((entity: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs"
                        >
                          <span className="text-green-600">📍</span>
                          {entity}
                          <button
                            onClick={() => setEditData((prev: SceneBeatData) => ({
                              ...prev,
                              worldEntities: prev.worldEntities.filter((_: string, i: number) => i !== index)
                            }))}
                            className="ml-1 hover:text-red-500"
                          >
                            <span className="text-red-500">✕</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Event */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timeline Event (Optional)
                    </label>
                    <input
                      type="text"
                      value={editData.timelineEvent || ''}
                      onChange={(e) => setEditData((prev: SceneBeatData) => ({ ...prev, timelineEvent: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                      placeholder="Date/time or beat number..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData((prev: SceneBeatData) => ({ 
                        ...prev, 
                        status: e.target.value as 'Draft' | 'Edited' | 'Finalized' 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Edited">Edited</option>
                      <option value="Finalized">Finalized</option>
                    </select>
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-2 pt-2">
                    <motion.button
                      onClick={handleSave}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-white">✓</span>
                      Save
                    </motion.button>
                    <motion.button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-white">✕</span>
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {data.summary || 'No summary provided'}
                    </p>
                  </div>

                  {/* Goal */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data.goal || 'No goal defined'}
                    </p>
                  </div>

                  {/* Characters */}
                  {data.characters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Characters Involved</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.characters.map((char: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                          >
                            <span className="text-blue-600">👤</span>
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* World Entities */}
                  {data.worldEntities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">World Entities</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.worldEntities.map((entity: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs"
                          >
                            <span className="text-green-600">📍</span>
                            {entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline Event */}
                  {data.timelineEvent && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timeline Event</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-lg">🕒</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{data.timelineEvent}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <motion.button
                      onClick={detectCharacters}
                      disabled={isDetecting}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-purple-600">✨</span>
                      {isDetecting ? 'Detecting...' : '🧠 Detect Characters'}
                    </motion.button>

                    <motion.button
                      onClick={summarizeScene}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ✍️ Summarize Scene
                    </motion.button>

                    <motion.button
                      onClick={validateConsistency}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-700 dark:text-green-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🧩 Validate Consistency
                    </motion.button>

                    <motion.button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-gray-600">✏️</span>
                      Edit
                    </motion.button>

                    <motion.button
                      onClick={deleteNode}
                      className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-red-600">🗑️</span>
                      Delete Section
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </NodeViewWrapper>
  );
};

export default SceneBeatNode;
