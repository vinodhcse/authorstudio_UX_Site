import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToolWindowStore, AVAILABLE_TOOLS, ToolType } from '../stores/toolWindowStore';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  XMarkIcon,
  WrenchScrewdriverIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface DockSidebarProps {
  bookId: string;
  versionId: string;
}

const DockSidebar: React.FC<DockSidebarProps> = ({ bookId, versionId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    getToolWindows,
    undockWindow,
    closeTool,
    closeAllTools,
    currentBookId,
    currentVersionId,
  } = useToolWindowStore();

  // Only show dock if we're in the correct context
  const isCorrectContext = currentBookId === bookId && currentVersionId === versionId;
  const dockedWindows = getToolWindows(bookId, versionId).filter(w => w.docked);
  
  console.log('DockSidebar Debug:', {
    bookId,
    versionId,
    currentBookId,
    currentVersionId,
    isCorrectContext,
    allWindows: getToolWindows(bookId, versionId),
    dockedWindows
  });

  const handleUndockWindow = async (windowId: string) => {
    await undockWindow(windowId);
  };

  const handleCloseWindow = async (windowId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    await closeTool(windowId);
  };

  const handleCloseAll = async () => {
    await closeAllTools();
  };

  // Hide dock if not in correct context or no docked windows
  if (!isCorrectContext || dockedWindows.length === 0) {
    return null;
  }

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isExpanded ? 300 : 80 
        }}
        exit={{ x: -100, opacity: 0 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 200,
          width: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
        }}
        className="group relative"
      >
        {/* Background with gradient border effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-75 transition-opacity duration-500 blur-sm rounded-2xl" />
        
        <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <WrenchScrewdriverIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-semibold text-sm">Docked Tools</span>
                    <div className="text-gray-400 text-xs">{dockedWindows.length} tools</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex items-center gap-2">
              {isExpanded && dockedWindows.length > 1 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={handleCloseAll}
                  className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 transition-all duration-200 group/btn"
                  title="Close All Tools"
                >
                  <TrashIcon className="w-4 h-4 text-red-400 group-hover/btn:text-red-300" />
                </motion.button>
              )}
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 transition-all duration-200"
              >
                {isExpanded ? (
                  <ChevronLeftIcon className="w-4 h-4 text-gray-300" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Docked Windows */}
          <div className="p-3 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {dockedWindows.map((window, index) => (
                <motion.div
                  key={window.id}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    transition: { delay: index * 0.1, type: "spring", damping: 25 }
                  }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group/item"
                >
                  {/* Tool Window Item */}
                  <div
                    className="relative"
                  >
                    {/* Hover gradient background */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-xl blur-sm" />
                    
                    <button
                      onClick={() => handleUndockWindow(window.id)}
                      className="relative w-full flex items-center gap-3 p-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:from-gray-700/80 hover:to-gray-800/80 rounded-xl transition-all duration-300 border border-gray-600/30 hover:border-blue-500/50 backdrop-blur-sm"
                      title={isExpanded ? undefined : window.title}
                    >
                      {/* Tool Icon */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg shadow-lg">
                          {AVAILABLE_TOOLS[window.tool_name as ToolType]?.icon || '🔧'}
                        </div>
                        {/* Status indicator */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 text-left overflow-hidden min-w-0"
                          >
                            <div className="text-white text-sm font-semibold truncate">
                              {window.title}
                            </div>
                            <div className="text-gray-400 text-xs truncate">
                              Click to restore
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Close Button */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            onClick={(e) => handleCloseWindow(window.id, e)}
                            className="flex-shrink-0 p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all duration-200 border border-red-500/30 hover:border-red-500/50"
                            title="Close Tool"
                          >
                            <XMarkIcon className="w-3 h-3 text-red-400" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DockSidebar;
