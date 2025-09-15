import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Node } from '@tiptap/core';
import { motion, AnimatePresence } from 'framer-motion';
import { acceptDictationSection, rejectDictationSection } from '../../lib/dictationHelpers';

// Props interface for the React component
interface DictationSectionNodeProps {
  node: {
    attrs: {
      id: string;
      status: 'recording' | 'processing' | 'complete' | 'preview';
      previewText: string;
      finalText: string;
      timestamp: number;
      isExpanded?: boolean;
    };
  };
  updateAttributes: (attrs: any) => void;
  deleteNode: () => void;
  selected: boolean;
  editor: any; // Add editor instance
}

// React component for the dictation section
const DictationSectionNodeView: React.FC<DictationSectionNodeProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode,
  selected,
  editor
}) => {
  const { status, previewText, finalText, timestamp, isExpanded = true } = node.attrs;
  const [editableText, setEditableText] = useState(finalText || previewText || '');
  const [isEditing, setIsEditing] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Log when the component re-renders with new attributes
  useEffect(() => {
    console.log('🔄 DictationSectionNodeView updated:', { status, previewText, finalText });
    // Update editable text when finalText changes
    if (finalText && finalText !== editableText) {
      setEditableText(finalText);
    } else if (previewText && !finalText && previewText !== editableText) {
      setEditableText(previewText);
    }
  }, [status, previewText, finalText]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editableText, isEditing]);

  const acceptTranscription = () => {
    // Update the finalText before accepting
    updateAttributes({ finalText: editableText });
    if (editor && acceptDictationSection(editor, node.attrs.id)) {
      console.log('✅ Successfully accepted transcription');
    }
  };

  const rejectTranscription = () => {
    if (editor && rejectDictationSection(editor, node.attrs.id)) {
      console.log('❌ Successfully rejected transcription');
    } else {
      // Fallback to deleteNode if helper fails
      deleteNode();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleSaveEdit = () => {
    updateAttributes({ finalText: editableText });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditableText(finalText || previewText || '');
    setIsEditing(false);
  };

  const toggleExpanded = () => {
    const newExpanded = !localExpanded;
    setLocalExpanded(newExpanded);
    updateAttributes({ isExpanded: newExpanded });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'recording': 
      case 'preview': 
        return 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30';
      case 'processing': 
        return 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/30';
      case 'complete': 
        return 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30';
      default: 
        return 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/30';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'recording':
      case 'preview':
        return '🎤';
      case 'processing': return '⚙️';
      case 'complete': return '✅';
      default: return '📝';
    }
  };

  const getDisplayText = () => {
    if (status === 'complete') {
      return editableText || finalText || previewText || 'No transcription available';
    }
    return previewText || 'Listening for your voice...';
  };

  const shouldShowActions = status === 'complete' || (status === 'preview' && previewText);
  const hasTranscribedContent = previewText || finalText || editableText;

  return (
    <NodeViewWrapper className={`dictation-section-node ${selected ? 'ProseMirror-selectednode' : ''}`}>
      <motion.div 
        className={`relative border-2 rounded-xl my-4 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm ${getStatusColor()}`}
        style={{
          transform: 'perspective(1000px) rotateX(1deg)',
          transformStyle: 'preserve-3d',
        }}
        whileHover={{
          y: -2,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* 3D Card Inner Container */}
        <div className="relative z-10 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <motion.span 
                className="text-xl"
                animate={status === 'recording' || status === 'preview' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {getStatusIcon()}
              </motion.span>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  Dictation Section
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            {/* Expand/Collapse Button */}
            {hasTranscribedContent && (
              <motion.button
                onClick={toggleExpanded}
                className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: localExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ⌄
                </motion.div>
              </motion.button>
            )}
          </div>

          {/* Status Messages */}
          <AnimatePresence>
            {(status === 'recording' || status === 'preview') && (
              <motion.div 
                className="text-sm text-blue-600 dark:text-blue-400 mb-3 italic flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🎤
                </motion.div>
                Recording... Speak naturally, pause for 4 seconds between paragraphs
              </motion.div>
            )}
            
            {status === 'processing' && (
              <motion.div 
                className="text-sm text-yellow-600 dark:text-yellow-400 mb-3 italic flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div 
                  className="text-lg"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  ⚙️
                </motion.div>
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Processing complete transcription for better accuracy...
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content - Collapsible */}
          <AnimatePresence>
            {localExpanded && (
              <motion.div 
                className="min-h-[2rem] mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {status === 'complete' && isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      ref={textareaRef}
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Edit your transcription..."
                      style={{ minHeight: '80px' }}
                    />
                    <div className="flex gap-2">
                      <motion.button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        💾 Save
                      </motion.button>
                      <motion.button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ✖ Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    className="text-gray-800 dark:text-gray-200 leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {status === 'complete' ? (
                      <div className="group cursor-pointer" onClick={handleEdit}>
                        <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-600/50 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <p className="flex-1">{getDisplayText()}</p>
                            <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              ✏️ Click to edit
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-blue-600 dark:text-blue-400 italic">
                        <strong>Live Preview:</strong> {getDisplayText()}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed State Preview */}
          {!localExpanded && hasTranscribedContent && (
            <motion.div 
              className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {getDisplayText().slice(0, 60)}...
            </motion.div>
          )}

          {/* Always Visible Action Buttons */}
          {shouldShowActions && (
            <motion.div 
              className="flex gap-2 pt-3 border-t border-gray-200/50 dark:border-gray-600/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.button
                onClick={acceptTranscription}
                className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                ✓ Accept
              </motion.button>
              <motion.button
                onClick={rejectTranscription}
                className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                ✗ Delete
              </motion.button>
              {status === 'complete' && !isEditing && (
                <motion.button
                  onClick={handleEdit}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ✏️ Edit
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

        {/* 3D Card Shadow/Depth Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 dark:to-transparent rounded-xl pointer-events-none" />
      </motion.div>
    </NodeViewWrapper>
  );
};

// TipTap extension for the dictation section
export const DictationSectionNode = Node.create({
  name: 'dictationSection',
  group: 'block',
  content: 'block*',
  
  addAttributes() {
    return {
      id: {
        default: '',
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return { 'data-id': attributes.id };
        },
      },
      status: {
        default: 'recording',
        parseHTML: element => element.getAttribute('data-status'),
        renderHTML: attributes => {
          if (!attributes.status) {
            return {};
          }
          return { 'data-status': attributes.status };
        },
      },
      previewText: {
        default: '',
      },
      finalText: {
        default: '',
      },
      timestamp: {
        default: Date.now(),
      },
      isExpanded: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="dictation-section"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-type': 'dictation-section' }, 0];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-type', 'dictation-section');
      
      // Create React component mount point  
      const reactMount = document.createElement('div');
      dom.appendChild(reactMount);

      // Mount React component
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(reactMount);
        
        const updateAttributes = (attrs: any) => {
          if (typeof getPos === 'function') {
            editor.commands.updateAttributes('dictationSection', attrs);
          }
        };

        const deleteNode = () => {
          if (typeof getPos === 'function') {
            const pos = getPos();
            if (pos !== undefined) {
              editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
            }
          }
        };

        root.render(
          React.createElement(DictationSectionNodeView, {
            node: { 
              attrs: {
                id: node.attrs.id || '',
                status: node.attrs.status || 'recording',
                previewText: node.attrs.previewText || '',
                finalText: node.attrs.finalText || '',
                timestamp: node.attrs.timestamp || Date.now(),
              }
            },
            updateAttributes,
            deleteNode,
            selected: false, // You might want to track selection state
            editor, // Pass the editor instance
          })
        );
      });

      return { dom };
    };
  },
});

export default DictationSectionNode;
