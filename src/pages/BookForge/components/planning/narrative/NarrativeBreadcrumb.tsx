import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { NarrativeFlowNode } from '../../../../../types/narrative-layout';

interface BreadcrumbItem {
  id: string;
  label: string;
  type: string;
  isLast: boolean;
}

interface NarrativeBreadcrumbProps {
  selectedNodeId: string | null;
  allNodes: NarrativeFlowNode[];
  onNavigateToNode: (nodeId: string | null) => void;
  onGoBack: () => void;
}

const NarrativeBreadcrumb: React.FC<NarrativeBreadcrumbProps> = ({
  selectedNodeId,
  allNodes,
  onNavigateToNode,
  onGoBack
}) => {
  // Build breadcrumb path from root to selected node
  const getBreadcrumbPath = (): BreadcrumbItem[] => {
    if (!selectedNodeId) return [];

    const path: BreadcrumbItem[] = [];
    const nodeMap = new Map(allNodes.map(node => [node.id, node]));
    
    // Build path from selected node to root
    let currentNodeId: string | null = selectedNodeId;
    const pathIds: string[] = [];
    
    while (currentNodeId) {
      const node = nodeMap.get(currentNodeId);
      if (!node) break;
      
      pathIds.unshift(currentNodeId);
      currentNodeId = node.data.parentId;
    }

    // Convert path to breadcrumb items
    pathIds.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        path.push({
          id: nodeId,
          label: (node.data.data as any).title || nodeId,
          type: node.data.type,
          isLast: index === pathIds.length - 1
        });
      }
    });

    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  // Don't show breadcrumb if no selection or only one item
  if (!selectedNodeId || breadcrumbPath.length <= 1) {
    return null;
  }

  const getTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'outline': return 'Plot';
      case 'act': return 'Act';
      case 'chapter': return 'Chapter';
      case 'scene': return 'Scene';
      case 'character-arc': return 'Character Arc';
      case 'location-arc': return 'Location Arc';
      case 'object-arc': return 'Object Arc';
      case 'lore-arc': return 'Lore Arc';
      default: return type;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'outline': return 'text-purple-600 dark:text-purple-400';
      case 'act': return 'text-blue-600 dark:text-blue-400';
      case 'chapter': return 'text-green-600 dark:text-green-400';
      case 'scene': return 'text-orange-600 dark:text-orange-400';
      case 'character-arc': return 'text-pink-600 dark:text-pink-400';
      case 'location-arc': return 'text-cyan-600 dark:text-cyan-400';
      case 'object-arc': return 'text-gray-600 dark:text-gray-400';
      case 'lore-arc': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm"
    >
      {/* Back button */}
      <motion.button
        onClick={onGoBack}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Go back to overview"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </motion.button>

      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

      {/* Home/Overview button */}
      <motion.button
        onClick={() => onNavigateToNode(null)}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Go to overview"
      >
        <HomeIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Plot Arcs</span>
      </motion.button>

      {/* Breadcrumb path */}
      {breadcrumbPath.map((item) => (
        <React.Fragment key={item.id}>
          <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <motion.button
            onClick={() => !item.isLast && onNavigateToNode(item.id)}
            className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
              item.isLast
                ? 'text-gray-900 dark:text-gray-100 font-semibold bg-gray-100 dark:bg-gray-700'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
            }`}
            whileHover={!item.isLast ? { scale: 1.05 } : {}}
            whileTap={!item.isLast ? { scale: 0.95 } : {}}
            disabled={item.isLast}
          >
            <span className={`text-xs font-medium uppercase tracking-wide ${getTypeColor(item.type)}`}>
              {getTypeDisplayName(item.type)}
            </span>
            <span className="max-w-32 sm:max-w-48 truncate">
              {item.label}
            </span>
          </motion.button>
        </React.Fragment>
      ))}
    </motion.div>
  );
};

export default NarrativeBreadcrumb;
