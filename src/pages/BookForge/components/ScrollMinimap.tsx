import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollMap, ScrollMapItem } from '../../../hooks/useScrollMap';
import { Editor } from '@tiptap/react';

interface ScrollMinimapProps {
  editor: Editor | null;
}

const ScrollMinimap: React.FC<ScrollMinimapProps> = ({ editor }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const {
    scrollMapItems,
    currentViewY,
    documentHeight,
    scrollToItem
  } = useScrollMap({
    editor,
    selector: '[data-node-type]',
    types: ['sceneBeat', 'note', 'impersonation', 'bookmark']
  });

  // If no editor is available, return null or a placeholder
  if (!editor) {
    return null;
  }

  // Colors for different node types
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'sceneBeat':
        return '#FFD166'; // Yellow for scene beats
      case 'note':
        return '#06D6A0'; // Green for notes
      case 'impersonation':
        return '#118AB2'; // Blue for character impersonation
      case 'bookmark':
        return '#EF476F'; // Red for bookmarks
      default:
        return '#9CA3AF'; // Gray for unknown
    }
  };

  const handleMarkerClick = (item: ScrollMapItem) => {
    scrollToItem(item);
  };

  // Calculate scroll position percentage
  const scrollPercentage = documentHeight > 0 ? (currentViewY / documentHeight) * 100 : 0;

  return (
    <div className="hidden lg:block w-4 h-full flex-shrink-0 bg-gray-100 dark:bg-gray-800/50 border-l border-gray-200 dark:border-gray-800 relative overflow-visible">
      {/* Scroll track */}
      <div className="absolute inset-0 w-full h-full">
        {/* Current scroll indicator */}
        <motion.div
          className="absolute left-0 w-full bg-gray-300 dark:bg-gray-600 opacity-50"
          style={{
            top: `${scrollPercentage}%`,
            height: '2px',
            zIndex: 10
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.2 }}
        />

        {/* Node markers */}
        {scrollMapItems.map((item: ScrollMapItem, index: number) => (
          <motion.div
            key={item.id}
            className="absolute left-0 w-full cursor-pointer"
            style={{
              top: `${item.relativeY * 100}%`,
              height: '3px',
              backgroundColor: getNodeColor(item.type),
              zIndex: hoveredItem === item.id ? 100 : 5
            }}
            onClick={() => handleMarkerClick(item)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            whileHover={{ 
              scale: 1.2,
              x: -2,
              transition: { duration: 0.1 }
            }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.02 
            }}
          >
            {/* Tooltip - positioned to the left of the scroll map */}
            {hoveredItem === item.id && (
                <>
               
                <motion.div 
                className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 bg-black text-white text-xs px-2 py-1 rounded shadow-xl pointer-events-none whitespace-nowrap"
                style={{ zIndex: 1000 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                {item.label}
                {/* Arrow pointing to the marker */}
                <div className="absolute left-full top-1/2 transform -translate-y-1/2">
                  <div className="w-0 h-0 border-t-2 border-b-2 border-l-4 border-transparent border-l-black"></div>
                </div>
              </motion.div>
                </>
                
              
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ScrollMinimap;
