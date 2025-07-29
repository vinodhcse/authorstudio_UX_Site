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
  theme?: 'light' | 'dark';
}

const DockSidebar: React.FC<DockSidebarProps> = ({ bookId, versionId, theme = 'dark' }) => {
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

  const handleUndockWindow = async (windowId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Get the window data for animation
    const window = dockedWindows.find(w => w.id === windowId);
    if (!window) return;

    // Create animation effect
    const dockElement = event?.currentTarget as HTMLElement;
    if (dockElement) {
      const rect = dockElement.getBoundingClientRect();
      
      // Create a temporary element that animates from dock to window position
      const animationElement = document.createElement('div');
      animationElement.className = 'fixed z-[9999] pointer-events-none transition-all duration-500 ease-out';
      animationElement.style.cssText = `
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 12px;
        opacity: 0.8;
      `;
      
      document.body.appendChild(animationElement);
      
      // Animate to final position
      requestAnimationFrame(() => {
        animationElement.style.cssText = `
          left: ${window.last_position.x}px;
          top: ${window.last_position.y}px;
          width: ${window.last_size.width}px;
          height: ${window.last_size.height}px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 8px;
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        `;
      });
      
      // Remove element after animation
      setTimeout(() => {
        document.body.removeChild(animationElement);
      }, 500);
    }
    
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

  // Contrasting theme colors - use opposite of current theme for items
  const isDarkTheme = theme === 'dark';
  const containerTheme = {
    // Use chapter header oval colors (same as current theme)
    background: isDarkTheme 
      ? 'from-gray-800/95 via-gray-900/95 to-black/95' 
      : 'from-white/95 via-gray-50/95 to-gray-100/95',
    border: isDarkTheme ? 'border-gray-700/50' : 'border-gray-200/50',
    headerBg: isDarkTheme ? 'from-gray-800/80 to-gray-900/80' : 'from-gray-100/80 to-gray-200/80',
    headerBorder: isDarkTheme ? 'border-gray-700/50' : 'border-gray-300/50',
    text: isDarkTheme ? 'text-white' : 'text-gray-900',
    subText: isDarkTheme ? 'text-gray-400' : 'text-gray-600',
  };

  const itemTheme = {
    // Use book card colors (opposite theme for contrast)
    background: isDarkTheme 
      ? 'from-white/90 to-gray-100/90 hover:from-gray-50/90 hover:to-white/90' 
      : 'from-gray-800/90 to-gray-900/90 hover:from-gray-700/90 hover:to-gray-800/90',
    border: isDarkTheme ? 'border-gray-300/50 hover:border-blue-400/50' : 'border-gray-600/50 hover:border-blue-500/50',
    text: isDarkTheme ? 'text-gray-900' : 'text-white',
    subText: isDarkTheme ? 'text-gray-600' : 'text-gray-300',
    iconBg: isDarkTheme ? 'from-blue-600 to-purple-700' : 'from-blue-400 to-purple-500',
  };

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isExpanded ? 280 : 48 
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
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-sm rounded-2xl" />
        
        <div className={`relative bg-gradient-to-br ${containerTheme.background} backdrop-blur-xl border ${containerTheme.border} shadow-2xl rounded-2xl overflow-hidden`}>
          {/* Header */}
          <div className={`flex items-center justify-between ${isExpanded ? 'p-3' : 'p-1.5'} border-b ${containerTheme.headerBorder} bg-gradient-to-r ${containerTheme.headerBg}`}>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <WrenchScrewdriverIcon className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <span className={`${containerTheme.text} font-semibold text-sm`}>Tools</span>
                    <div className={`${containerTheme.subText} text-xs`}>{dockedWindows.length} docked</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex items-center gap-1">
              {isExpanded && dockedWindows.length > 1 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={handleCloseAll}
                  className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 transition-all duration-200 group/btn"
                  title="Close All Tools"
                >
                  <TrashIcon className="w-3 h-3 text-red-400 group-hover/btn:text-red-300" />
                </motion.button>
              )}
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1.5 rounded-lg bg-gray-600/20 hover:bg-gray-600/40 border ${containerTheme.border} transition-all duration-200`}
              >
                {isExpanded ? (
                  <ChevronLeftIcon className={`w-3 h-3 ${containerTheme.subText}`} />
                ) : (
                  <ChevronRightIcon className={`w-3 h-3 ${containerTheme.subText}`} />
                )}
              </button>
            </div>
          </div>

          {/* Docked Windows */}
          <div className={`${isExpanded ? 'p-2 space-y-2' : 'p-1 space-y-1'} max-h-80 overflow-y-auto custom-scrollbar`}>
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
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group/item"
                >
                  {/* Tool Window Item */}
                  <div className="relative">
                    {/* Hover gradient background */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-lg blur-sm" />
                    
                    <button
                      onClick={(e) => handleUndockWindow(window.id, e)}
                      className={`relative w-full flex items-center gap-2 ${isExpanded ? 'p-2' : 'p-1'} bg-gradient-to-br ${itemTheme.background} rounded-lg transition-all duration-300 border ${itemTheme.border} backdrop-blur-sm`}
                      title={isExpanded ? undefined : window.title}
                    >
                      {/* Tool Icon */}
                      <div className="flex-shrink-0 relative">
                        <div className={`${isExpanded ? 'w-8 h-8' : 'w-6 h-6'} bg-gradient-to-br ${itemTheme.iconBg} rounded-lg flex items-center justify-center text-white ${isExpanded ? 'text-sm' : 'text-xs'} shadow-lg`}>
                          {AVAILABLE_TOOLS[window.tool_name as ToolType]?.icon || '🔧'}
                        </div>
                        {/* Status indicator */}
                        <div className={`absolute -top-0.5 -right-0.5 ${isExpanded ? 'w-2 h-2' : 'w-1.5 h-1.5'} bg-green-500 rounded-full border border-gray-900`} />
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 text-left overflow-hidden min-w-0"
                          >
                            <div className={`${itemTheme.text} text-sm font-medium truncate`}>
                              {window.title}
                            </div>
                            <div className={`${itemTheme.subText} text-xs truncate`}>
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
                            className="flex-shrink-0 p-1 bg-red-600/20 hover:bg-red-600/40 rounded opacity-0 group-hover/item:opacity-100 transition-all duration-200 border border-red-500/30 hover:border-red-500/50"
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
