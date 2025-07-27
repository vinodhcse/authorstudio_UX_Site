import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeViewWrapper } from '@tiptap/react';
import { NoteSectionData } from '../../types/custom-nodes';
import { 
  StickyNotePlusIcon, 
  CheckIcon, 
  TrashIcon
} from '../../constants';

interface NoteSectionNodeProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
}

const NoteSectionNode: React.FC<NoteSectionNodeProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode 
}) => {
  const data: NoteSectionData = node.attrs;
  const [isExpanded, setIsExpanded] = useState(data.isExpanded || false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(data.content);
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges && editContent !== data.content) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [editContent, hasChanges]);

  // Parse labels from content
  const parseLabels = (content: string): string[] => {
    const labelRegex = /@(\w+)/g;
    const matches = content.match(labelRegex);
    return matches ? matches.map(match => match.toLowerCase()) : [];
  };

  // Handle auto-save
  const handleAutoSave = () => {
    const labels = parseLabels(editContent);
    const updatedData: NoteSectionData = {
      ...data,
      content: editContent,
      labels,
      updatedAt: new Date().toISOString()
    };
    updateAttributes(updatedData);
    setHasChanges(false);
  };

  // Handle manual save
  const handleSave = () => {
    handleAutoSave();
    setIsEditing(false);
  };

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setEditContent(newContent);
    setHasChanges(true);
  };

  // Toggle expansion
  const toggleExpansion = (e?: React.MouseEvent) => {
    // Prevent text selection when clicking to expand/collapse
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    updateAttributes({ ...data, isExpanded: newExpanded });
  };

  // Get label color based on type
  const getLabelColor = (label: string) => {
    const labelColors: Record<string, string> = {
      '@rewrite': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      '@clarify': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      '@expand': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      '@fix': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      '@check': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      '@research': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return labelColors[label] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  // Get preview text
  const getPreview = () => {
    if (!data.content) return 'Empty note';
    const textWithoutLabels = data.content.replace(/@\w+/g, '').trim();
    return textWithoutLabels.length > 50 
      ? textWithoutLabels.substring(0, 50) + '...' 
      : textWithoutLabels || 'Note with labels only';
  };

  return (
    <NodeViewWrapper>
      <motion.div
        className="note-section-node my-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200"
        data-node-type="note"
        data-node-id={data.id}
        data-content={data.content}
        data-labels={data.labels?.join(',')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      {/* Collapsed Header */}
      <div 
        className="node-header flex items-center justify-between p-3 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-t-2xl"
        onClick={toggleExpansion}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <StickyNotePlusIcon className="w-4 h-4 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                🗒️ Note
              </span>
              {data.labels.length > 0 && (
                <div className="flex gap-1">
                  {data.labels.slice(0, 3).map((label, index) => (
                    <span
                      key={index}
                      className={`px-1.5 py-0.5 text-xs rounded-full ${getLabelColor(label)}`}
                    >
                      {label}
                    </span>
                  ))}
                  {data.labels.length > 3 && (
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      +{data.labels.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {!isExpanded && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {getPreview()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Unsaved changes" />
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            ▶
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
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
              {/* Labels Display */}
              {data.labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.labels.map((label, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded-full ${getLabelColor(label)}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Content Area */}
              <div className="relative">
                <textarea
                  value={editContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onFocus={() => setIsEditing(true)}
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-gray-200 resize-none min-h-[120px]"
                  placeholder="Write your note here... Use @rewrite, @clarify, @expand, @fix, @check, @research for quick labels"
                />
                
                {/* Auto-save indicator */}
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {hasChanges ? (
                    <span className="text-orange-500">Auto-saving...</span>
                  ) : (
                    <span>Saved</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Created: {new Date(data.createdAt).toLocaleDateString()}
                  {data.updatedAt !== data.createdAt && (
                    <span className="ml-2">• Updated: {new Date(data.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {isEditing && (
                    <motion.button
                      onClick={handleSave}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CheckIcon className="w-4 h-4" />
                      Save
                    </motion.button>
                  )}

                  <motion.button
                    onClick={deleteNode}
                    className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 rounded-lg text-sm transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>
              </div>

              {/* Quick Label Suggestions */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick labels:</p>
                <div className="flex flex-wrap gap-2">
                  {['@rewrite', '@clarify', '@expand', '@fix', '@check', '@research'].map((label) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (!editContent.includes(label)) {
                          handleContentChange(editContent + (editContent ? ' ' : '') + label + ' ');
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors ${getLabelColor(label)}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </NodeViewWrapper>
  );
};

export default NoteSectionNode;
