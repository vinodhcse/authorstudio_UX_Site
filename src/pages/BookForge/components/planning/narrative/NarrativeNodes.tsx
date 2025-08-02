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
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string, nodeType: string) => void;
  onExpand?: (id: string) => void;
  onCollapse?: (id: string) => void;
  onCharacterClick?: (characterId: string, nodeId: string, event: React.MouseEvent) => void;
  expandedNodes?: Set<string>;
  allNodes?: NarrativeNode[];
}

// Character Avatar Component
const CharacterAvatar: React.FC<{
  character: any;
  size?: 'sm' | 'md';
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}> = ({ character, size = 'sm', className = '', onClick }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg cursor-pointer ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={character.name}
    >
      {character.name?.charAt(0)?.toUpperCase() || '?'}
    </motion.div>
  );
};

// Character Avatars Group Component
const CharacterAvatarsGroup: React.FC<{
  characters: any[];
  povCharacterId?: string;
  maxVisible?: number;
  onCharacterClick?: (characterId: string, event: React.MouseEvent) => void;
  className?: string;
}> = ({ characters, povCharacterId, maxVisible = 2, onCharacterClick, className = '' }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!characters || characters.length === 0) return null;

  const visibleCharacters = showAll ? characters : characters.slice(0, maxVisible);
  const remainingCount = characters.length - maxVisible;
  const povCharacter = characters.find(char => char.id === povCharacterId);

  return (
    <div 
      className={`flex items-center gap-1 ${className}`}
      onMouseEnter={() => setShowAll(true)}
      onMouseLeave={() => setShowAll(false)}
    >
      {/* POV Character - always shown first if exists */}
      {povCharacter && (
        <div className="relative">
          <CharacterAvatar
            character={povCharacter}
            size="sm"
            className="ring-2 ring-yellow-400 ring-offset-1"
            onClick={(e) => onCharacterClick?.(povCharacter.id, e)}
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-xs text-black font-bold">P</span>
          </div>
        </div>
      )}
      
      {/* Other Characters */}
      {visibleCharacters
        .filter(char => char.id !== povCharacterId)
        .map((character, index) => (
          <CharacterAvatar
            key={character.id}
            character={character}
            size="sm"
            className={index > 0 ? '-ml-2' : ''}
            onClick={(e) => onCharacterClick?.(character.id, e)}
          />
        ))}
      
      {/* Remaining count indicator */}
      {!showAll && remainingCount > 0 && (
        <motion.div
          className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold -ml-2"
          whileHover={{ scale: 1.1 }}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
};

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
  data, onClick, onEdit, onExpand, onCharacterClick, nodeType, color, allNodes = [] 
}) => {
  const isMuted = data.isMuted || false;

  // Get characters for this node and its children
  const getNodeCharacters = (nodeData: any) => {
    const characters = [];
    
    // Direct characters from node data
    if (nodeData.characters) {
      characters.push(...nodeData.characters);
    }
    
    // For non-scene nodes, get characters from child scenes
    if (data.type !== 'scene' && (data as any).childIds) {
      (data as any).childIds.forEach((childId: string) => {
        const childNode = allNodes.find(n => n.id === childId);
        if (childNode && (childNode.data as any).characters) {
          characters.push(...(childNode.data as any).characters);
        }
      });
    }
    
    // Remove duplicates
    return [...new Set(characters)].map(charId => ({
      id: charId,
      name: `Character ${charId.slice(-1)}` // Mock character names
    }));
  };

  const nodeCharacters = getNodeCharacters(data.data);
  const povCharacterId = (data.data as any).povCharacterId;

  return (
    <motion.div
      className={`relative cursor-pointer group ${isMuted ? 'opacity-30' : 'opacity-100'}`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        // Add a small delay to ensure button clicks are processed first
        setTimeout(() => {
          if (onExpand) {
            onExpand(data.id);
          } else {
            onClick(data.id);
          }
        }, 10);
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      initial={{ 
        opacity: isMuted ? 0.3 : 0.8, 
        scale: 0.95,
        y: 15
      }}
      animate={{ 
        opacity: isMuted ? 0.3 : 1, 
        scale: isMuted ? 0.85 : 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
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
        <motion.div className="relative z-10">
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
            {(data.data as any).title}
          </div>
          
          <div className="text-white/80 text-xs line-clamp-2 drop-shadow-sm mb-2">
            {(data.data as any).description}
          </div>

          {/* Character Avatars */}
          {nodeCharacters.length > 0 && (
            <div className="mb-2">
              <CharacterAvatarsGroup
                characters={nodeCharacters}
                povCharacterId={povCharacterId}
                maxVisible={2}
                onCharacterClick={(charId, event) => onCharacterClick?.(charId, data.id, event)}
                className="mb-1"
              />
            </div>
          )}

          {/* POV Character indicator if no characters shown */}
          {povCharacterId && nodeCharacters.length === 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70">POV:</span>
                <CharacterAvatar
                  character={{ id: povCharacterId, name: `Character ${povCharacterId.slice(-1)}` }}
                  size="sm"
                  className="ring-2 ring-yellow-400 ring-offset-1"
                  onClick={(e) => onCharacterClick?.(povCharacterId, data.id, e)}
                />
              </div>
            </div>
          )}

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
              e.preventDefault();
              onEdit(data.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500/70 hover:bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PencilIcon className="w-3 h-3 text-white" />
          </motion.button>
        </motion.div>
        
        {/* Animated glow effect - reduced */}
        <motion.div
          className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"
          style={{
            background: `linear-gradient(45deg, ${color.replace('from-', '').replace('via-', '').replace('to-', '').split(' ').join(', ')})`,
            filter: 'blur(8px)',
            zIndex: -1
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
  data, onClick, onEdit, onDelete, onAddChild, onCollapse, onCharacterClick,
  nodeType, color, icon: Icon, allNodes = []
}) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // Apply muted styling when node is muted (siblings of selected node)
  const opacity = data.isMuted ? 0.4 : 1;
  const brightness = data.isMuted ? 0.6 : 1;

  // Get characters for this node and its children
  const getNodeCharacters = (nodeData: any) => {
    const characters = [];
    
    // Direct characters from node data
    if (nodeData.characters) {
      characters.push(...nodeData.characters);
    }
    
    // For non-scene nodes, get characters from child scenes
    if (data.type !== 'scene' && (data as any).childIds) {
      (data as any).childIds.forEach((childId: string) => {
        const childNode = allNodes.find(n => n.id === childId);
        if (childNode && (childNode.data as any).characters) {
          characters.push(...(childNode.data as any).characters);
        }
      });
    }
    
    // Remove duplicates
    return [...new Set(characters)].map(charId => ({
      id: charId,
      name: `Character ${charId.slice(-1)}` // Mock character names
    }));
  };

  const nodeCharacters = getNodeCharacters(data.data);
  const povCharacterId = (data.data as any).povCharacterId;

  return (
    <motion.div
      className="relative cursor-pointer min-w-[280px] max-w-[320px] group"
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        // Add a small delay to ensure button clicks are processed first
        setTimeout(() => {
          onClick(data.id);
        }, 10);
      }}
      initial={{ 
        opacity: 0, 
        scale: 0.8, 
        y: 30
      }}
      animate={{ 
        opacity, 
        scale: 1, 
        y: 0,
        filter: `brightness(${brightness})`,
        transition: { duration: 0.6, ease: "easeOut" }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
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
        <motion.div className="relative z-10">
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
                    e.preventDefault();
                    onCollapse(data.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-20"
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
            {(data.data as any).title}
          </h3>
          
          {/* Description */}
          <p className="text-white/90 text-sm line-clamp-4 leading-relaxed mb-4 drop-shadow-sm">
            {(data.data as any).description}
          </p>
          
          {/* Character Avatars Section */}
          {(nodeCharacters.length > 0 || povCharacterId) && (
            <div className="mb-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white/90">Characters</span>
                {povCharacterId && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/70">POV:</span>
                    <CharacterAvatar
                      character={{ id: povCharacterId, name: `Character ${povCharacterId.slice(-1)}` }}
                      size="sm"
                      className="ring-2 ring-yellow-400 ring-offset-1"
                      onClick={(e) => onCharacterClick?.(povCharacterId, data.id, e)}
                    />
                  </div>
                )}
              </div>
              
              {nodeCharacters.length > 0 && (
                <CharacterAvatarsGroup
                  characters={nodeCharacters}
                  povCharacterId={povCharacterId}
                  maxVisible={4}
                  onCharacterClick={(charId, event) => onCharacterClick?.(charId, data.id, event)}
                />
              )}
            </div>
          )}
          
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
        
        {/* Animated glow effect - reduced */}
        <motion.div
          className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
          style={{
            background: `linear-gradient(45deg, ${color.replace('from-', '').replace('via-', '').replace('to-', '').split(' ').join(', ')})`,
            filter: 'blur(12px)',
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
              className="absolute -top-2 -right-2 flex gap-1 z-30"
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit(data.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="p-2 rounded-full bg-blue-500/30 hover:bg-blue-500/50 transition-colors backdrop-blur-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <PencilIcon className="w-4 h-4 text-white drop-shadow-sm" />
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onAddChild(data.id, 'scene');
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="p-2 rounded-full bg-green-500/30 hover:bg-green-500/50 transition-colors backdrop-blur-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusIcon className="w-4 h-4 text-white drop-shadow-sm" />
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete(data.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="p-2 rounded-full bg-red-500/30 hover:bg-red-500/50 transition-colors backdrop-blur-sm"
                whileHover={{ scale: 1.1 }}
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
  const { data, selected, expandedNodes } = props;
  const isExpanded = selected || (expandedNodes && expandedNodes.has(data.id)) || data.isExpanded;
  
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
  const { data, selected, expandedNodes } = props;
  const isExpanded = selected || (expandedNodes && expandedNodes.has(data.id)) || data.isExpanded;
  
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
  const { data, selected, expandedNodes } = props;
  const isExpanded = selected || (expandedNodes && expandedNodes.has(data.id)) || data.isExpanded;
  
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
  const { data, selected, expandedNodes } = props;
  const isExpanded = selected || (expandedNodes && expandedNodes.has(data.id)) || data.isExpanded;
  
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
  const { data, selected, expandedNodes } = props;
  const isExpanded = selected || (expandedNodes && expandedNodes.has(data.id)) || data.isExpanded;
  
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
  const { data, selected, expandedNodes } = props;
  const isExpanded = selected || (expandedNodes && expandedNodes.has(data.id)) || data.isExpanded;
  
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
  const { data, selected, expandedNodes } = props;
  const isExpanded = selected || (expandedNodes && expandedNodes.has(data.id)) || data.isExpanded;
  
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
  const { data, selected, expandedNodes } = props;
  const isExpanded = selected || (expandedNodes && expandedNodes.has(data.id)) || data.isExpanded;
  
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
