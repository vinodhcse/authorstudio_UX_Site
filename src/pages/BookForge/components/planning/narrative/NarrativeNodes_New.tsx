import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handle, Position } from 'reactflow';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PencilIcon, 
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  MapPinIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { NarrativeNode } from '../../../../../types/narrative-layout';

interface BaseNodeProps {
  data: NarrativeNode;
  selected: boolean;
  onExpand: (nodeId: string) => void;
  onCollapse: (nodeId: string) => void;
  onClick: (nodeId: string) => void;
  onEdit: (nodeId: string) => void;
  onAddChild: (parentId: string, nodeType: NarrativeNode['type']) => void;
  onDelete: (nodeId: string) => void;
}

// Status Badge Component
const StatusBadge: React.FC<{ status: NarrativeNode['status'] }> = ({ status }) => {
  const statusConfig = {
    completed: { color: 'bg-green-500', text: 'Done', ring: 'ring-green-200' },
    'in-progress': { color: 'bg-amber-500', text: 'Working', ring: 'ring-amber-200' },
    'not-completed': { color: 'bg-gray-400', text: 'Planning', ring: 'ring-gray-200' }
  };

  const config = statusConfig[status];
  
  return (
    <motion.div 
      className={`${config.color} ${config.ring} ring-2 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {config.text}
    </motion.div>
  );
};

// Compact Node Component for non-selected/related nodes
const CompactNode: React.FC<BaseNodeProps & { nodeType: string; color: string }> = ({ 
  data, onClick, nodeType, color 
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.div
      className={`relative cursor-pointer min-w-[160px] max-w-[180px]`}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      onClick={() => onClick(data.id)}
      whileHover={{ scale: 1.05, z: 10 }}
      initial={{ opacity: 0.6, scale: 0.9 }}
      animate={{ 
        opacity: isHovering ? 1 : 0.6, 
        scale: isHovering ? 1.02 : 0.9,
        transition: { duration: 0.2 }
      }}
    >
      <AnimatePresence>
        {isHovering ? (
          // Expanded state on hover
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            transition={{ duration: 0.3 }}
            className={`bg-gradient-to-br ${color} rounded-xl shadow-2xl border-2 border-white/20 backdrop-blur-sm p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-white/90 uppercase tracking-wide">
                {nodeType}
              </div>
              <StatusBadge status={data.status} />
            </div>
            <h3 className="font-bold text-white text-sm mb-2 line-clamp-2">
              {data.data.title}
            </h3>
            <p className="text-white/80 text-xs line-clamp-3 leading-relaxed">
              {data.data.description}
            </p>
            {data.childIds.length > 0 && (
              <div className="text-xs text-white/70 mt-2">
                {data.childIds.length} children
              </div>
            )}
          </motion.div>
        ) : (
          // Compact state
          <motion.div
            key="compact"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2 }}
            className={`bg-gradient-to-r ${color} rounded-lg shadow-lg p-3 border border-white/20`}
          >
            <div className="text-xs font-bold text-white/90 uppercase tracking-wide mb-1">
              {nodeType}
            </div>
            <h3 className="font-semibold text-white text-sm line-clamp-1">
              {data.data.title}
            </h3>
            {data.childIds.length > 0 && (
              <div className="text-xs text-white/70 mt-1">
                {data.childIds.length} items
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Handles for compact nodes */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="w-2 h-2 bg-white/50 border border-white"
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="w-2 h-2 bg-white/50 border border-white"
      />
    </motion.div>
  );
};

// Enhanced Expanded Node Component for selected/focused nodes
const ExpandedNode: React.FC<BaseNodeProps & { 
  nodeType: string; 
  color: string; 
  icon: React.ComponentType<{ className?: string }>;
  expanded?: boolean;
}> = ({ 
  data, selected, onClick, onEdit, onDelete, onAddChild, onExpand, onCollapse, 
  nodeType, color, icon: Icon, expanded = false 
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.div
      className="relative cursor-pointer min-w-[280px] max-w-[320px]"
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      onClick={() => onClick(data.id)}
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotateY: 0,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
      whileHover={{ 
        scale: 1.03, 
        rotateY: 2,
        transition: { duration: 0.2 }
      }}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className={`bg-gradient-to-br ${color} rounded-2xl shadow-2xl border-2 ${
          selected ? 'border-white ring-4 ring-blue-300/50' : 'border-white/30'
        } backdrop-blur-sm p-5 relative overflow-hidden`}
        animate={{
          boxShadow: isHovering 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
            : '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Background glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"
          animate={{
            opacity: isHovering ? 0.3 : 0.1,
            scale: isHovering ? 1.05 : 1
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-white" />
            <div className="text-xs font-bold text-white/90 uppercase tracking-wide">
              {nodeType}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={data.status} />
            {data.childIds.length > 0 && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  expanded ? onCollapse(data.id) : onExpand(data.id);
                }}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {expanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-white" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-white" />
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-white text-lg mb-3 line-clamp-2 relative z-10">
          {data.data.title}
        </h3>

        {/* Description */}
        <p className="text-white/90 text-sm line-clamp-4 leading-relaxed mb-4 relative z-10">
          {data.data.description}
        </p>

        {/* Meta information */}
        {data.childIds.length > 0 && (
          <div className="space-y-2 relative z-10">
            <div className="text-sm text-white/80">
              <span className="font-medium">{data.childIds.length}</span> children
            </div>
          </div>
        )}

        {/* Action buttons */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex justify-end gap-2 mt-4 relative z-10"
            >
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(data.id);
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <PencilIcon className="w-4 h-4 text-white" />
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(data.id, 'scene');
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusIcon className="w-4 h-4 text-white" />
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(data.id);
                }}
                className="p-2 rounded-full bg-red-500/30 hover:bg-red-500/50 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrashIcon className="w-4 h-4 text-white" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Enhanced Handles */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="w-3 h-3 bg-white border-2 border-gray-300 shadow-lg"
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="w-3 h-3 bg-white border-2 border-gray-300 shadow-lg"
      />
    </motion.div>
  );
};

// Main node type components using the new design system
export const OutlineNodeComponent: React.FC<BaseNodeProps> = (props) => {
  const { data, selected } = props;
  const isExpanded = selected || data.isExpanded;
  
  const nodeConfig = {
    type: 'Outline',
    color: 'from-violet-600 via-purple-600 to-indigo-700',
    icon: SparklesIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
        expanded={data.isExpanded}
      />
    );
  }

  return (
    <CompactNode 
      {...props} 
      nodeType={nodeConfig.type}
      color={nodeConfig.color}
    />
  );
};

export const ActNodeComponent: React.FC<BaseNodeProps> = (props) => {
  const { data, selected } = props;
  const isExpanded = selected || data.isExpanded;
  
  const nodeConfig = {
    type: 'Act',
    color: 'from-emerald-600 via-teal-600 to-cyan-700',
    icon: UserGroupIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
        expanded={data.isExpanded}
      />
    );
  }

  return (
    <CompactNode 
      {...props} 
      nodeType={nodeConfig.type}
      color={nodeConfig.color}
    />
  );
};

export const ChapterNodeComponent: React.FC<BaseNodeProps> = (props) => {
  const { data, selected } = props;
  const isExpanded = selected || data.isExpanded;
  
  const nodeConfig = {
    type: 'Chapter',
    color: 'from-blue-600 via-indigo-600 to-purple-700',
    icon: PencilIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
        expanded={data.isExpanded}
      />
    );
  }

  return (
    <CompactNode 
      {...props} 
      nodeType={nodeConfig.type}
      color={nodeConfig.color}
    />
  );
};

export const SceneNodeComponent: React.FC<BaseNodeProps> = (props) => {
  const { data, selected } = props;
  const isExpanded = selected || data.isExpanded;
  
  const nodeConfig = {
    type: 'Scene',
    color: 'from-amber-500 via-orange-600 to-red-700',
    icon: MapPinIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
        expanded={data.isExpanded}
      />
    );
  }

  return (
    <CompactNode 
      {...props} 
      nodeType={nodeConfig.type}
      color={nodeConfig.color}
    />
  );
};

export const CharacterArcNodeComponent: React.FC<BaseNodeProps> = (props) => {
  const { data, selected } = props;
  const isExpanded = selected || data.isExpanded;
  
  const nodeConfig = {
    type: 'Character Arc',
    color: 'from-pink-600 via-rose-600 to-red-700',
    icon: UserGroupIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
        expanded={data.isExpanded}
      />
    );
  }

  return (
    <CompactNode 
      {...props} 
      nodeType={nodeConfig.type}
      color={nodeConfig.color}
    />
  );
};

export const LocationArcNodeComponent: React.FC<BaseNodeProps> = (props) => {
  const { data, selected } = props;
  const isExpanded = selected || data.isExpanded;
  
  const nodeConfig = {
    type: 'Location Arc',
    color: 'from-green-600 via-emerald-600 to-teal-700',
    icon: MapPinIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
        expanded={data.isExpanded}
      />
    );
  }

  return (
    <CompactNode 
      {...props} 
      nodeType={nodeConfig.type}
      color={nodeConfig.color}
    />
  );
};

export const ObjectArcNodeComponent: React.FC<BaseNodeProps> = (props) => {
  const { data, selected } = props;
  const isExpanded = selected || data.isExpanded;
  
  const nodeConfig = {
    type: 'Object Arc',
    color: 'from-slate-600 via-gray-600 to-zinc-700',
    icon: SparklesIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
        expanded={data.isExpanded}
      />
    );
  }

  return (
    <CompactNode 
      {...props} 
      nodeType={nodeConfig.type}
      color={nodeConfig.color}
    />
  );
};

export const LoreArcNodeComponent: React.FC<BaseNodeProps> = (props) => {
  const { data, selected } = props;
  const isExpanded = selected || data.isExpanded;
  
  const nodeConfig = {
    type: 'Lore Arc',
    color: 'from-yellow-600 via-amber-600 to-orange-700',
    icon: SparklesIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
        expanded={data.isExpanded}
      />
    );
  }

  return (
    <CompactNode 
      {...props} 
      nodeType={nodeConfig.type}
      color={nodeConfig.color}
    />
  );
};
