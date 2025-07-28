import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@tiptap/react';
import { useScrollMap, ScrollMapItem } from '../hooks/useScrollMap';

interface ScrollMinimapProps {
  editor: Editor;
  className?: string;
}

const ScrollMinimap: React.FC<ScrollMinimapProps> = ({ editor, className = '' }) => {
  const [hoveredItem, setHoveredItem] = useState<ScrollMapItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const {
    scrollMapItems,
    currentViewY,
    documentHeight,
    viewportHeight,
    scrollToItem
  } = useScrollMap({
    editor,
    selector: '[data-node-type]',
    types: ['sceneBeat', 'noteSection', 'characterImpersonation', 'bookmark']
  });

  // Color mapping for different node types
  const getNodeColor = (type: ScrollMapItem['type']) => {
    switch (type) {
      case 'scene':
        return 'bg-yellow-400'; // #FFD166
      case 'note':
        return 'bg-green-400'; // #06D6A0
      case 'conversation':
        return 'bg-blue-500'; // #118AB2
      case 'bookmark':
        return 'bg-red-400'; // #EF476F
      default:
        return 'bg-gray-400';
    }
  };

  // Get dark mode color variants
  const getNodeColorDark = (type: ScrollMapItem['type']) => {
    switch (type) {
      case 'scene':
        return 'dark:bg-yellow-500';
      case 'note':
        return 'dark:bg-green-500';
      case 'conversation':
        return 'dark:bg-blue-400';
      case 'bookmark':
        return 'dark:bg-red-500';
      default:
        return 'dark:bg-gray-500';
    }
  };

  // Calculate viewport indicator position and height
  const viewportIndicator = documentHeight > 0 ? {
    top: (currentViewY / documentHeight) * 100,
    height: (viewportHeight / documentHeight) * 100
  } : { top: 0, height: 100 };

  // Handle marker click
  const handleMarkerClick = (item: ScrollMapItem) => {
    scrollToItem(item);
  };

  // Handle marker hover
  const handleMarkerHover = (item: ScrollMapItem, event: React.MouseEvent) => {
    setHoveredItem(item);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left - 10,
      y: rect.top + rect.height / 2
    });
  };

  // Handle marker leave
  const handleMarkerLeave = () => {
    setHoveredItem(null);
  };

  if (!editor || scrollMapItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Main scroll minimap */}
      <div className={`fixed right-2 top-16 bottom-16 w-3 z-40 ${className}`}>
        {/* Background track */}
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full opacity-60" />
        
        {/* Viewport indicator */}
        <motion.div
          className="absolute right-0 w-full bg-gray-400 dark:bg-gray-500 rounded-full opacity-50"
          style={{
            top: `${Math.min(95, Math.max(0, viewportIndicator.top))}%`,
            height: `${Math.min(100 - viewportIndicator.top, Math.max(2, viewportIndicator.height))}%`
          }}
          animate={{
            top: `${Math.min(95, Math.max(0, viewportIndicator.top))}%`,
            height: `${Math.min(100 - viewportIndicator.top, Math.max(2, viewportIndicator.height))}%`
          }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        />

        {/* Node markers */}
        <AnimatePresence>
          {scrollMapItems.map((item: ScrollMapItem, index: number) => {
            const markerY = Math.min(95, Math.max(2, item.relativeY * 100));
            
            return (
              <motion.div
                key={item.id}
                className={`absolute w-full h-2 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 ${getNodeColor(item.type)} ${getNodeColorDark(item.type)} bg-opacity-80 hover:bg-opacity-100`}
                style={{
                  top: `${markerY}%`,
                  transform: 'translateY(-50%)'
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.2, 
                  delay: index * 0.05,
                  ease: 'easeOut'
                }}
                whileHover={{ 
                  scale: 1.2,
                  x: -2,
                  transition: { duration: 0.1 }
                }}
                onClick={() => handleMarkerClick(item)}
                onMouseEnter={(e) => handleMarkerHover(item, e)}
                onMouseLeave={handleMarkerLeave}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredItem && (
          <motion.div
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-100%, -50%)'
            }}
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg border border-gray-700 dark:border-gray-300 text-sm font-medium max-w-xs">
              {/* Arrow pointing right */}
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 dark:border-l-gray-100 border-t-4 border-b-4 border-t-transparent border-b-transparent" />
              
              {/* Content */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getNodeColor(hoveredItem.type)} ${getNodeColorDark(hoveredItem.type)}`} />
                <span className="truncate">{hoveredItem.label}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScrollMinimap;
