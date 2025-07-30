import React, { useState, useEffect } from 'react';
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
  const { status, previewText, finalText, timestamp } = node.attrs;
  const [showActions, setShowActions] = useState(false);

  // Log when the component re-renders with new attributes
  useEffect(() => {
    console.log('🔄 DictationSectionNodeView updated:', { status, previewText, finalText });
  }, [status, previewText, finalText]);

  const acceptTranscription = () => {
    if (editor && acceptDictationSection(editor, node.attrs.id)) {
      console.log('✅ Successfully accepted transcription');
    }
    setShowActions(false);
  };

  const rejectTranscription = () => {
    if (editor && rejectDictationSection(editor, node.attrs.id)) {
      console.log('❌ Successfully rejected transcription');
    } else {
      // Fallback to deleteNode if helper fails
      deleteNode();
    }
    setShowActions(false);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'recording': 
      case 'preview': 
        return 'border-blue-400 bg-blue-50';
      case 'processing': return 'border-yellow-400 bg-yellow-50';
      case 'complete': return 'border-green-400 bg-green-50';
      default: return 'border-gray-400 bg-gray-50';
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

  return (
    <NodeViewWrapper className={`dictation-section-node ${selected ? 'ProseMirror-selectednode' : ''}`}>
      <div className={`border-2 rounded-lg p-4 my-4 transition-all duration-200 ${getStatusColor()}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon()}</span>
            <span className="font-medium text-sm text-gray-700">
              Dictation Section
            </span>
            <span className="text-xs text-gray-500">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          {status === 'complete' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowActions(!showActions)}
                className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50"
              >
                Options
              </button>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {(status === 'recording' || status === 'preview') && (
          <motion.div 
            className="text-sm text-blue-600 mb-2 italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            🎤 Recording... Speak naturally, pause for 4 seconds between paragraphs
          </motion.div>
        )}
        
        {status === 'processing' && (
          <motion.div 
            className="text-sm text-yellow-600 mb-2 italic flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
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

        {/* Content */}
        <div className="min-h-[2rem]">
          {(status === 'recording' || status === 'preview') && previewText && (
            <motion.div 
              className="text-blue-600 italic"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              key={previewText} // Re-animate when text changes
            >
              <strong>Live Preview:</strong> {previewText}
            </motion.div>
          )}
          
          {(status === 'recording' || status === 'preview') && !previewText && (
            <motion.div 
              className="text-gray-500 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Listening for your voice...
            </motion.div>
          )}
          
          {status === 'processing' && (
            <motion.div 
              className="text-gray-600"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <strong>Processing:</strong> {previewText || 'Analyzing your complete speech for optimal transcription...'}
              </motion.div>
            </motion.div>
          )}
          
          {status === 'complete' && (
            <motion.div 
              className="text-gray-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <strong>Final:</strong> {finalText || previewText || 'No transcription available'}
            </motion.div>
          )}
        </div>

        {/* Actions for completed transcription */}
        <AnimatePresence>
          {showActions && status === 'complete' && (
            <motion.div 
              className="mt-3 pt-3 border-t border-gray-200 flex gap-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                onClick={acceptTranscription}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✓ Accept
              </motion.button>
              <motion.button
                onClick={rejectTranscription}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✗ Delete
              </motion.button>
              <motion.button
                onClick={() => setShowActions(false)}
                className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
