import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handle, Position } from 'reactflow';
import { 
  PencilIcon, 
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  MapPinIcon,
  SparklesIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { NarrativeNode } from '../../../../../types/narrative-layout';

interface BaseNodeProps {
  data: NarrativeNode;
  selected?: boolean;
  onClick: (id: string) => void;
  onDoubleClick?: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string, nodeType: string) => void;
  onExpand?: (id: string) => void;
  onCollapse?: (id: string) => void;
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

// Enhanced 3D Compact Node Component
const CompactNode: React.FC<BaseNodeProps & { nodeType: string; color: string }> = ({ 
  data, onClick, onDoubleClick, onEdit, onExpand, nodeType, color 
}) => {
  const isMuted = data.isMuted || false;

  return (
    <motion.div
      className={`relative cursor-pointer group ${isMuted ? 'opacity-30' : 'opacity-100'}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onExpand) {
          onExpand(data.id);
        } else {
          onClick(data.id);
        }
      }}
      onDoubleClick={() => onDoubleClick?.(data.id)}
      whileHover={{ 
        scale: 1.08,
        rotateY: 8,
        rotateX: -4,
        z: 50,
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          duration: 0.4
        }
      }}
      whileTap={{ 
        scale: 0.95,
        rotateY: 0,
        rotateX: 0,
        transition: { duration: 0.1 }
      }}
      initial={{ 
        opacity: isMuted ? 0.3 : 0.8, 
        scale: 0.95,
        rotateX: 12,
        y: 15
      }}
      animate={{ 
        opacity: isMuted ? 0.3 : 1, 
        scale: isMuted ? 0.85 : 1,
        rotateX: 0,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Enhanced 3D card with glass morphism */}
      <motion.div
        className={`
          bg-gradient-to-br ${color} 
          rounded-xl shadow-2xl border border-white/30 p-4 w-[200px]
          relative backdrop-blur-sm transform-gpu
          before:absolute before:inset-0 before:rounded-xl
          before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-transparent
          before:opacity-0 before:transition-opacity before:duration-300
          group-hover:before:opacity-100
          after:absolute after:inset-0 after:rounded-xl after:shadow-inner
          after:bg-gradient-to-t after:from-black/10 after:to-transparent
        `}
        style={{
          boxShadow: `
            0 10px 25px -5px rgba(0, 0, 0, 0.4),
            0 20px 40px -5px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `
        }}
      >
        <motion.div
          className="relative z-10"
          whileHover={{ 
            y: -2,
            transition: { type: "spring", stiffness: 400 }
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-white/95 uppercase tracking-widest drop-shadow-sm">
              {nodeType}
            </div>
            <motion.div 
              className={`w-3 h-3 rounded-full shadow-lg ${
                data.status === 'completed' ? 'bg-green-400' :
                data.status === 'in-progress' ? 'bg-yellow-400' : 'bg-gray-400'
              }`}
              whileHover={{ scale: 1.2, boxShadow: '0 0 8px rgba(255,255,255,0.5)' }}
            />
          </div>
          
          <div className="text-white font-semibold text-sm mb-1 line-clamp-2 drop-shadow-sm">
            {(data as any).title}
          </div>
          
          <div className="text-white/80 text-xs line-clamp-3 drop-shadow-sm">
            {(data as any).description}
          </div>

          {/* Show basic stats */}
          <div className="flex gap-2 text-xs text-white/70 mt-2">
            {(data as any).childIds && (data as any).childIds.length > 0 && (
              <div>{(data as any).childIds.length} children</div>
            )}
            {(data as any).linkedNodeIds && (data as any).linkedNodeIds.length > 0 && (
              <div>{(data as any).linkedNodeIds.length} links</div>
            )}
          </div>

          {/* Edit button that's always visible */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(data.id);
            }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500/70 hover:bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PencilIcon className="w-3 h-3 text-white" />
          </motion.button>
        </motion.div>
        
        {/* Animated glow effect */}
        <motion.div
          className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"
          style={{
            background: `linear-gradient(45deg, ${color.replace('from-', '').replace('via-', '').replace('to-', '').split(' ').join(', ')})`,
            filter: 'blur(12px)',
            zIndex: -1
          }}
        />
        
        {/* Subtle shimmer effect */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
            backgroundSize: '200% 200%'
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
            transition: { duration: 2, repeat: Infinity, ease: 'linear' }
          }}
        />
      </motion.div>
      
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
}> = ({ 
  data, onClick, onDoubleClick, onEdit, onDelete, onAddChild, onCollapse,
  nodeType, color, icon: Icon 
}) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // Apply muted styling when node is muted (siblings of selected node)
  const opacity = data.isMuted ? 0.4 : 1;
  const brightness = data.isMuted ? 0.6 : 1;

  return (
    <motion.div
      className="relative cursor-pointer min-w-[280px] max-w-[320px] group"
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(data.id);
      }}
      onDoubleClick={() => onDoubleClick?.(data.id)}
      initial={{ 
        opacity: 0, 
        scale: 0.8, 
        rotateY: -20, 
        rotateX: 15,
        y: 30
      }}
      animate={{ 
        opacity, 
        scale: 1, 
        rotateY: 0,
        rotateX: 0,
        y: 0,
        filter: `brightness(${brightness})`,
        transition: { duration: 0.6, ease: "easeOut" }
      }}
      whileHover={{ 
        scale: 1.06,
        rotateY: 6,
        rotateX: -3,
        z: 60,
        transition: { 
          type: "spring", 
          stiffness: 250, 
          damping: 25,
          duration: 0.5
        }
      }}
      whileTap={{ 
        scale: 0.98,
        rotateY: 0,
        rotateX: 0,
        transition: { duration: 0.1 }
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1200px'
      }}
    >
      {/* Enhanced 3D expanded card */}
      <motion.div
        className={`
          bg-gradient-to-br ${color} 
          rounded-2xl shadow-2xl border border-white/30 p-6
          relative backdrop-blur-md transform-gpu
          before:absolute before:inset-0 before:rounded-2xl
          before:bg-gradient-to-br before:from-white/25 before:via-white/5 before:to-transparent
          before:opacity-0 before:transition-opacity before:duration-500
          group-hover:before:opacity-100
          after:absolute after:inset-0 after:rounded-2xl after:shadow-inner
          after:bg-gradient-to-t after:from-black/15 after:to-transparent
        `}
        style={{
          boxShadow: `
            0 15px 35px -5px rgba(0, 0, 0, 0.4),
            0 25px 50px -8px rgba(0, 0, 0, 0.3),
            inset 0 2px 0 rgba(255, 255, 255, 0.2),
            inset 0 -2px 0 rgba(0, 0, 0, 0.1)
          `
        }}
      >
        <motion.div
          className="relative z-10"
          whileHover={{ 
            y: -3,
            transition: { type: "spring", stiffness: 400 }
          }}
        >
          {/* Header with icon and node type */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <div className="text-sm font-bold text-white/95 uppercase tracking-widest drop-shadow-sm">
                {nodeType}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={data.status} />
              {/* Collapse button */}
              {onCollapse && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCollapse(data.id);
                  }}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Collapse node"
                >
                  <span className="text-white text-xs">−</span>
                </motion.button>
              )}
            </div>
          </div>
          
          {/* Title */}
          <h3 className="font-bold text-white text-lg mb-3 line-clamp-2 drop-shadow-sm">
            {(data as any).title}
          </h3>
          
          {/* Description */}
          <p className="text-white/90 text-sm line-clamp-4 leading-relaxed mb-4 drop-shadow-sm">
            {(data as any).description}
          </p>
          
          {/* Stats */}
          <div className="flex gap-4 text-sm text-white/80">
            {(data as any).childIds && (data as any).childIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">{(data as any).childIds.length}</span>
                <span>children</span>
              </div>
            )}
            {(data as any).linkedNodeIds && (data as any).linkedNodeIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">{(data as any).linkedNodeIds.length}</span>
                <span>connections</span>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Animated glow effect */}
        <motion.div
          className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-700"
          style={{
            background: `linear-gradient(45deg, ${color.replace('from-', '').replace('via-', '').replace('to-', '').split(' ').join(', ')})`,
            filter: 'blur(16px)',
            zIndex: -1
          }}
        />
        
        {/* Action buttons with enhanced hover */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-2 -right-2 flex gap-1"
            >
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(data.id);
                }}
                className="p-2 rounded-full bg-blue-500/30 hover:bg-blue-500/50 transition-colors backdrop-blur-sm"
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
              >
                <PencilIcon className="w-4 h-4 text-white drop-shadow-sm" />
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(data.id, 'scene');
                }}
                className="p-2 rounded-full bg-green-500/30 hover:bg-green-500/50 transition-colors backdrop-blur-sm"
                whileHover={{ scale: 1.1, rotate: -10 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusIcon className="w-4 h-4 text-white drop-shadow-sm" />
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(data.id);
                }}
                className="p-2 rounded-full bg-red-500/30 hover:bg-red-500/50 transition-colors backdrop-blur-sm"
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrashIcon className="w-4 h-4 text-white drop-shadow-sm" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Enhanced Handles with 3D styling */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="w-3 h-3 bg-white border-2 border-gray-300 shadow-lg hover:scale-125 transition-transform"
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
        }}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="w-3 h-3 bg-white border-2 border-gray-300 shadow-lg hover:scale-125 transition-transform"
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
        }}
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
    color: 'from-blue-600 via-indigo-600 to-purple-700',
    icon: SparklesIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
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
    color: 'from-teal-600 via-cyan-600 to-blue-700',
    icon: SparklesIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
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
    color: 'from-stone-600 via-amber-600 to-yellow-700',
    icon: BookOpenIcon
  };

  if (isExpanded) {
    return (
      <ExpandedNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
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
