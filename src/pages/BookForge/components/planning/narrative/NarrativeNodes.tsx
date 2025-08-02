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
  BookOpenIcon,
  CursorArrowRaysIcon,
  ChevronUpIcon,
  MinusIcon
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
  onSelect?: (id: string) => void;
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
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white/20 cursor-pointer ${className}`}
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
            className="ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800"
            onClick={(e) => onCharacterClick?.(povCharacter.id, e)}
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
            <span className="text-xs text-black font-bold">P</span>
          </div>
        </div>
      )}
      
      {/* Other Characters (limit to maintain maxVisible total) */}
      {visibleCharacters
        .filter(char => char.id !== povCharacterId)
        .slice(0, povCharacter ? maxVisible - 1 : maxVisible)
        .map((character, index) => (
          <CharacterAvatar
            key={character.id}
            character={character}
            size="sm"
            className={index > 0 || povCharacter ? '-ml-2' : ''}
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
  data, onClick, onEdit, onExpand, onSelect, onCharacterClick, nodeType, color, allNodes = [] 
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

  // Get primary POV character from child scenes for chapters/acts
  const getPrimaryPovCharacter = (nodeData: any) => {
    // If node has its own POV character, use it
    if (nodeData.povCharacterId) {
      return nodeData.povCharacterId;
    }
    
    // For chapters and acts, get POV from most frequent child scene POV
    if ((data.type === 'chapter' || data.type === 'act') && (data as any).childIds) {
      const povCounts = new Map<string, number>();
      
      (data as any).childIds.forEach((childId: string) => {
        const childNode = allNodes.find(n => n.id === childId);
        if (childNode) {
          let povChar = null;
          
          // For scene children, get direct POV
          if (childNode.type === 'scene' && (childNode.data as any).povCharacterId) {
            povChar = (childNode.data as any).povCharacterId;
          }
          // For chapter children (in acts), recursively get their primary POV
          else if (childNode.type === 'chapter' && (childNode as any).childIds) {
            const chapterPovCounts = new Map<string, number>();
            (childNode as any).childIds.forEach((sceneId: string) => {
              const sceneNode = allNodes.find(n => n.id === sceneId);
              if (sceneNode && sceneNode.type === 'scene' && (sceneNode.data as any).povCharacterId) {
                const scenePov = (sceneNode.data as any).povCharacterId;
                chapterPovCounts.set(scenePov, (chapterPovCounts.get(scenePov) || 0) + 1);
              }
            });
            if (chapterPovCounts.size > 0) {
              povChar = Array.from(chapterPovCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
            }
          }
          
          if (povChar) {
            povCounts.set(povChar, (povCounts.get(povChar) || 0) + 1);
          }
        }
      });
      
      // Return the most frequent POV character
      if (povCounts.size > 0) {
        return Array.from(povCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      }
    }
    
    return null;
  };

  const nodeCharacters = getNodeCharacters(data.data);
  const povCharacterId = getPrimaryPovCharacter(data.data);

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
      {/* Large POV Character Avatar - positioned at top for all node types */}
      {povCharacterId && (
        <motion.div
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="relative">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${povCharacterId}`}
              alt={`Character ${povCharacterId.slice(-1)}`}
              className="w-12 h-12 rounded-full border-3 border-white shadow-lg bg-white cursor-pointer hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                onCharacterClick?.(povCharacterId, data.id, e);
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-xs px-1 py-0.5 rounded-full font-bold text-[10px]">
              POV
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced 3D card with glass morphism */}
      <motion.div
        className={`
          bg-gradient-to-br ${color} 
          rounded-xl shadow-2xl border border-white/30 p-4 w-[200px] ${povCharacterId ? 'pt-8' : 'pt-4'}
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

          {/* Action buttons */}
          <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Select button */}
            {onSelect && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onSelect(data.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="w-6 h-6 bg-green-500/70 hover:bg-green-500 rounded-full flex items-center justify-center transition-colors z-20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Select as root node"
              >
                <CursorArrowRaysIcon className="w-3 h-3 text-white" />
              </motion.button>
            )}
            
            {/* Edit button */}
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
              className="w-6 h-6 bg-blue-500/70 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors z-20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Edit node"
            >
              <PencilIcon className="w-3 h-3 text-white" />
            </motion.button>
          </div>
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
  data, onClick, onEdit, onDelete, onAddChild, onCollapse, onSelect, onCharacterClick,
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

  // Get primary POV character from child scenes for chapters/acts
  const getPrimaryPovCharacter = (nodeData: any) => {
    // If node has its own POV character, use it
    if (nodeData.povCharacterId) {
      return nodeData.povCharacterId;
    }
    
    // For chapters and acts, get POV from most frequent child scene POV
    if ((data.type === 'chapter' || data.type === 'act') && (data as any).childIds) {
      const povCounts = new Map<string, number>();
      
      (data as any).childIds.forEach((childId: string) => {
        const childNode = allNodes.find(n => n.id === childId);
        if (childNode) {
          let povChar = null;
          
          // For scene children, get direct POV
          if (childNode.type === 'scene' && (childNode.data as any).povCharacterId) {
            povChar = (childNode.data as any).povCharacterId;
          }
          // For chapter children (in acts), recursively get their primary POV
          else if (childNode.type === 'chapter' && (childNode as any).childIds) {
            const chapterPovCounts = new Map<string, number>();
            (childNode as any).childIds.forEach((sceneId: string) => {
              const sceneNode = allNodes.find(n => n.id === sceneId);
              if (sceneNode && sceneNode.type === 'scene' && (sceneNode.data as any).povCharacterId) {
                const scenePov = (sceneNode.data as any).povCharacterId;
                chapterPovCounts.set(scenePov, (chapterPovCounts.get(scenePov) || 0) + 1);
              }
            });
            if (chapterPovCounts.size > 0) {
              povChar = Array.from(chapterPovCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
            }
          }
          
          if (povChar) {
            povCounts.set(povChar, (povCounts.get(povChar) || 0) + 1);
          }
        }
      });
      
      // Return the most frequent POV character
      if (povCounts.size > 0) {
        return Array.from(povCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      }
    }
    
    return null;
  };

  const nodeCharacters = getNodeCharacters(data.data);
  const povCharacterId = getPrimaryPovCharacter(data.data);

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
              {/* Select button */}
              {onSelect && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onSelect(data.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="p-2 rounded-full bg-green-500/30 hover:bg-green-500/50 transition-colors backdrop-blur-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="Select as root node"
                >
                  <CursorArrowRaysIcon className="w-4 h-4 text-white drop-shadow-sm" />
                </motion.button>
              )}
              
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
                className="p-2 rounded-full bg-amber-500/30 hover:bg-amber-500/50 transition-colors backdrop-blur-sm"
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

export const ChapterNodeComponent: React.FC<BaseNodeProps & { allNodes?: any[] }> = (props) => {
  const { data, selected, expandedNodes, allNodes } = props;
  const isExpanded = selected || (expandedNodes && expandedNodes.has(data.id)) || data.isExpanded;
  
  const nodeConfig = {
    type: 'Chapter',
    color: 'from-teal-600 via-cyan-600 to-blue-700',
    icon: SparklesIcon
  };

  if (isExpanded) {
    return (
      <ExpandedChapterNode 
        {...props} 
        nodeType={nodeConfig.type}
        color={nodeConfig.color}
        icon={nodeConfig.icon}
        narrativeNodes={allNodes}
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

// Specialized expanded scene node with POV character and chips
const ExpandedSceneNode: React.FC<BaseNodeProps & { 
  nodeType: string; 
  color: string; 
  icon: React.ComponentType<{ className?: string }>;
}> = ({ 
  data, onClick, onEdit, onDelete, onAddChild, onCollapse, onSelect, onCharacterClick,
  nodeType, color, icon: Icon
}) => {
  
  // Apply muted styling when node is muted
  const opacity = data.isMuted ? 0.4 : 1;
  const brightness = data.isMuted ? 0.6 : 1;

  // Get scene data
  const sceneData = data.data as any;
  const povCharacterId = sceneData.povCharacterId;
  const characters = sceneData.characters || [];
  const locations = sceneData.locations || [];
  const objects = sceneData.objects || [];
  const lore = sceneData.lore || [];
  const timelineEvents = sceneData.timelineEvents || [];

  // Mock character data - in real app, this would come from context
  const getCharacterInfo = (characterId: string) => {
    // Enhanced character mock data that corresponds to modal selections
    const characterMap = {
      'char1': { 
        id: 'char1', 
        name: 'Aria Blackthorne', 
        role: 'protagonist',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char1`
      },
      'char2': { 
        id: 'char2', 
        name: 'Marcus Steel', 
        role: 'deuteragonist',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char2`
      },
      'char3': { 
        id: 'char3', 
        name: 'The Shadow King', 
        role: 'antagonist',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char3`
      },
      'char4': { 
        id: 'char4', 
        name: 'Elena Brightwater', 
        role: 'supporting',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char4`
      },
      'char5': { 
        id: 'char5', 
        name: 'Tobias the Wise', 
        role: 'mentor',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char5`
      }
    };
    
    return characterMap[characterId as keyof typeof characterMap] || {
      id: characterId,
      name: `Character ${characterId.slice(-1)}`,
      role: 'unknown',
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${characterId}`
    };
  };

  // Mock timeline event data - in real app, this would come from context
  const getTimelineEventInfo = (eventId: string) => {
    const eventMap = {
      'timeline-1': { 
        id: 'timeline-1', 
        name: 'The Dark Lord Returns', 
        tag: 'Present',
        note: 'The return of the ancient evil'
      },
      'timeline-2': { 
        id: 'timeline-2', 
        name: 'Battle of Shadowmere', 
        tag: 'Past',
        note: 'The decisive battle that changed everything'
      },
      'timeline-3': { 
        id: 'timeline-3', 
        name: 'Vision of the Chosen One', 
        tag: 'Future',
        note: 'A prophetic vision of what is to come'
      },
      'timeline-4': { 
        id: 'timeline-4', 
        name: 'Memory of First Love', 
        tag: 'Flashback',
        note: 'A cherished memory from the past'
      }
    };
    
    return eventMap[eventId as keyof typeof eventMap] || {
      id: eventId,
      name: `Timeline Event ${eventId.slice(-1)}`,
      tag: 'Present',
      note: 'A significant moment in the story'
    };
  };

  // Get tag color for timeline events
  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'past': return 'bg-amber-100 border-amber-400 text-amber-900 shadow-md';
      case 'present': return 'bg-blue-100 border-blue-400 text-blue-900 shadow-md';
      case 'future': return 'bg-green-100 border-green-400 text-green-900 shadow-md';
      case 'flashback': return 'bg-purple-100 border-purple-400 text-purple-900 shadow-md';
      case 'flashforward': return 'bg-pink-100 border-pink-400 text-pink-900 shadow-md';
      default: return 'bg-gray-100 border-gray-400 text-gray-900 shadow-md';
    }
  };

  const povCharacter = povCharacterId ? getCharacterInfo(povCharacterId) : null;

  // Debug log to check character data
  console.log('Scene Data:', { povCharacterId, characters, sceneData });

  return (
    <motion.div
      className="relative cursor-pointer min-w-[320px] max-w-[360px] group"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setTimeout(() => onClick(data.id), 10);
      }}
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={{ 
        opacity, 
        scale: 1, 
        y: 0,
        filter: `brightness(${brightness})`,
        transition: { duration: 0.6, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
    >
      {/* POV Character Avatar - positioned at left */}
      {povCharacter && (
        <motion.div
          className="absolute -left-10 top-1/2 transform -translate-y-1/2 z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="relative">
            <img
              src={povCharacter.image}
              alt={povCharacter.name}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white"
            />
            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
              POV
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced 3D expanded card */}
      <motion.div
        className={`
          bg-gradient-to-br ${color} 
          rounded-2xl shadow-2xl border border-white/30 p-6 ${povCharacter ? 'ml-6' : ''}
          relative backdrop-blur-md transform-gpu
          before:absolute before:inset-0 before:rounded-2xl
          before:bg-gradient-to-br before:from-white/25 before:via-white/5 before:to-transparent
          before:opacity-0 before:transition-opacity before:duration-500
          hover:before:opacity-100
        `}
        style={{
          background: `linear-gradient(135deg, ${color.split(' ')[1]}, ${color.split(' ')[3]}, ${color.split(' ')[5]})`,
          transform: 'perspective(1000px) rotateX(2deg) rotateY(-2deg)',
        }}
        whileHover={{
          y: -8,
          rotateX: 0,
          rotateY: 0,
          scale: 1.02,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          transition: { duration: 0.3 }
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-2">
              <Icon className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">
                {sceneData.title}
              </h3>
              <span className="text-white/80 text-sm font-medium">{nodeType}</span>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            data.status === 'completed' ? 'bg-green-500/90 text-white' :
            data.status === 'in-progress' ? 'bg-yellow-500/90 text-white' :
            'bg-gray-500/90 text-white'
          }`}>
            {data.status === 'completed' ? 'Done' : 
             data.status === 'in-progress' ? 'In Progress' : 'To Do'}
          </div>
        </div>

        {/* Description */}
        <p className="text-white/90 text-sm leading-relaxed mb-4 line-clamp-3">
          {sceneData.description}
        </p>

        {/* Chips for Characters, Locations, Objects, Lore */}
        <div className="space-y-3">
          {characters.length > 0 && (
            <div>
              <div className="text-white/80 text-xs font-semibold mb-2">Characters</div>
              <div className="flex flex-wrap gap-2">
                {characters.slice(0, 4).map((charId: string) => {
                  const character = getCharacterInfo(charId);
                  return (
                    <motion.button
                      key={charId}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCharacterClick) {
                          onCharacterClick(charId, data.id, e);
                        }
                      }}
                      className="group relative"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title={character.name}
                    >
                      <img
                        src={character.image}
                        alt={character.name}
                        className="w-8 h-8 rounded-full border-2 border-white/50 hover:border-white transition-colors"
                      />
                    </motion.button>
                  );
                })}
                {characters.length > 4 && (
                  <div 
                    className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full text-white/70 text-xs cursor-pointer border-2 border-white/30"
                    title={`Other characters: ${characters.slice(4).map((id: string) => getCharacterInfo(id).name).join(', ')}`}
                  >
                    +{characters.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}

          {locations.length > 0 && (
            <div>
              <div className="text-white/80 text-xs font-semibold mb-2">Locations</div>
              <div className="flex flex-wrap gap-2">
                {locations.slice(0, 3).map((locId: string) => (
                  <motion.button
                    key={locId}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Open location modal for:', locId);
                    }}
                    className="bg-green-500/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-green-300/30 hover:bg-green-500/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📍 Location {locId.slice(-1)}
                  </motion.button>
                ))}
                {locations.length > 3 && (
                  <div 
                    className="bg-green-500/20 text-white/70 text-xs px-2 py-1 rounded-full cursor-pointer"
                    title={`Other locations: ${locations.slice(3).map((id: string) => `Location ${id.slice(-1)}`).join(', ')}`}
                  >
                    +{locations.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {objects.length > 0 && (
            <div>
              <div className="text-white/80 text-xs font-semibold mb-2">Objects</div>
              <div className="flex flex-wrap gap-2">
                {objects.slice(0, 3).map((objId: string) => (
                  <motion.button
                    key={objId}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Open object modal for:', objId);
                    }}
                    className="bg-blue-500/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-blue-300/30 hover:bg-blue-500/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🔮 Object {objId.slice(-1)}
                  </motion.button>
                ))}
                {objects.length > 3 && (
                  <div 
                    className="bg-blue-500/20 text-white/70 text-xs px-2 py-1 rounded-full cursor-pointer"
                    title={`Other objects: ${objects.slice(3).map((id: string) => `Object ${id.slice(-1)}`).join(', ')}`}
                  >
                    +{objects.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {lore.length > 0 && (
            <div>
              <div className="text-white/80 text-xs font-semibold mb-2">Lore</div>
              <div className="flex flex-wrap gap-2">
                {lore.slice(0, 3).map((loreId: string) => (
                  <motion.button
                    key={loreId}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Open lore modal for:', loreId);
                    }}
                    className="bg-purple-500/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-purple-300/30 hover:bg-purple-500/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📜 Lore {loreId.slice(-1)}
                  </motion.button>
                ))}
                {lore.length > 3 && (
                  <div 
                    className="bg-purple-500/20 text-white/70 text-xs px-2 py-1 rounded-full cursor-pointer"
                    title={`Other lore: ${lore.slice(3).map((id: string) => `Lore ${id.slice(-1)}`).join(', ')}`}
                  >
                    +{lore.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {timelineEvents.length > 0 && (
            <div>
              <div className="text-white/80 text-xs font-semibold mb-2">Timeline Events</div>
              <div className="flex flex-wrap gap-2">
                {timelineEvents.slice(0, 3).map((eventId: string) => {
                  const event = getTimelineEventInfo(eventId);
                  return (
                    <motion.button
                      key={eventId}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Open timeline event modal for:', eventId);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border-2 hover:scale-105 transition-all font-medium ${getTagColor(event.tag)}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={`${event.name} (${event.tag})\n${event.note}`}
                    >
                      <span className="mr-1">⏱</span>
                      {event.tag}
                    </motion.button>
                  );
                })}
                {timelineEvents.length > 3 && (
                  <div 
                    className="bg-gray-500/20 text-white/70 text-xs px-2 py-1 rounded-full cursor-pointer border border-gray-300/30"
                    title={`Other timeline events: ${timelineEvents.slice(3).map((id: string) => getTimelineEventInfo(id).name).join(', ')}`}
                  >
                    +{timelineEvents.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons - top-right positioning for consistency */}
        <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Select button */}
          {onSelect && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSelect(data.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="w-6 h-6 bg-green-500/70 hover:bg-green-500 rounded-full flex items-center justify-center transition-colors z-20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Focus on this Scene"
            >
              <CursorArrowRaysIcon className="w-3 h-3 text-white" />
            </motion.button>
          )}
          
          {/* Edit button */}
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
            className="w-6 h-6 bg-blue-500/70 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors z-20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Edit Scene"
          >
            <PencilIcon className="w-3 h-3 text-white" />
          </motion.button>

          {/* Add Child button */}
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
            className="w-6 h-6 bg-purple-500/70 hover:bg-purple-500 rounded-full flex items-center justify-center transition-colors z-20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Add Child Scene"
          >
            <PlusIcon className="w-3 h-3 text-white" />
          </motion.button>

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
              className="w-6 h-6 bg-gray-500/70 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors z-20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Collapse"
            >
              <ChevronUpIcon className="w-3 h-3 text-white" />
            </motion.button>
          )}

          {/* Delete button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (window.confirm('Delete this scene?')) onDelete(data.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="w-6 h-6 bg-red-500/70 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors z-20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Delete Scene"
          >
            <TrashIcon className="w-3 h-3 text-white" />
          </motion.button>
        </div>

        {/* Floating connection handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="!bg-white/50 !border-2 !border-white !w-3 !h-3 !rounded-full hover:!bg-white transition-colors"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!bg-white/50 !border-2 !border-white !w-3 !h-3 !rounded-full hover:!bg-white transition-colors"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!bg-white/50 !border-2 !border-white !w-3 !h-3 !rounded-full hover:!bg-white transition-colors"
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!bg-white/50 !border-2 !border-white !w-3 !h-3 !rounded-full hover:!bg-white transition-colors"
        />
      </motion.div>
    </motion.div>
  );
};

// Specialized expanded chapter node with propagated POV characters and timeline event tags
const ExpandedChapterNode: React.FC<BaseNodeProps & { 
  nodeType: string; 
  color: string; 
  icon: React.ComponentType<{ className?: string }>;
  narrativeNodes?: any[]; // Add this to get access to all nodes for propagation
}> = ({ 
  data, onClick, onEdit, onDelete, onAddChild, onCollapse, onSelect, onCharacterClick,
  nodeType, color, icon: Icon, narrativeNodes = []
}) => {
  
  // Apply muted styling when node is muted
  const opacity = data.isMuted ? 0.4 : 1;
  const brightness = data.isMuted ? 0.6 : 1;

  // Get child scene nodes for propagation
  const childScenes = narrativeNodes.filter(node => 
    data.childIds && data.childIds.includes(node.id) && node.type === 'scene'
  );

  // Propagate POV characters from child scenes
  const propagatedPovCharacters = Array.from(
    new Set(
      childScenes
        .map(scene => scene.data?.povCharacterId)
        .filter(Boolean)
    )
  );

  // Propagate timeline event tags from child scenes
  const propagatedTimelineEventTags = Array.from(
    new Set(
      childScenes
        .flatMap(scene => scene.data?.timelineEvents || [])
        .map(eventId => {
          const event = getTimelineEventInfo(eventId);
          return event.tag;
        })
        .filter(Boolean)
    )
  );

  // Mock functions for timeline events (same as in ExpandedSceneNode)
  const getTimelineEventInfo = (eventId: string) => {
    const eventMap = {
      'timeline-1': { 
        id: 'timeline-1', 
        name: 'The Dark Lord Returns', 
        tag: 'Present',
        note: 'The return of the ancient evil'
      },
      'timeline-2': { 
        id: 'timeline-2', 
        name: 'Battle of Shadowmere', 
        tag: 'Past',
        note: 'The decisive battle that changed everything'
      },
      'timeline-3': { 
        id: 'timeline-3', 
        name: 'Vision of the Chosen One', 
        tag: 'Future',
        note: 'A prophetic vision of what is to come'
      },
      'timeline-4': { 
        id: 'timeline-4', 
        name: 'Memory of First Love', 
        tag: 'Flashback',
        note: 'A cherished memory from the past'
      }
    };
    
    return eventMap[eventId as keyof typeof eventMap] || {
      id: eventId,
      name: `Timeline Event ${eventId.slice(-1)}`,
      tag: 'Present',
      note: 'A significant moment in the story'
    };
  };

  const getCharacterInfo = (characterId: string) => {
    const characterMap = {
      'char1': { 
        id: 'char1', 
        name: 'Aria Blackthorne', 
        role: 'protagonist',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char1`
      },
      'char2': { 
        id: 'char2', 
        name: 'Marcus Steel', 
        role: 'deuteragonist',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char2`
      },
      'char3': { 
        id: 'char3', 
        name: 'The Shadow King', 
        role: 'antagonist',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char3`
      },
      'char4': { 
        id: 'char4', 
        name: 'Elena Brightwater', 
        role: 'supporting',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char4`
      },
      'char5': { 
        id: 'char5', 
        name: 'Tobias the Wise', 
        role: 'mentor',
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=char5`
      }
    };
    
    return characterMap[characterId as keyof typeof characterMap] || {
      id: characterId,
      name: `Character ${characterId.slice(-1)}`,
      role: 'unknown',
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${characterId}`
    };
  };

  // Get tag color for timeline events
  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'past': return 'bg-amber-100 border-amber-400 text-amber-900 shadow-md';
      case 'present': return 'bg-blue-100 border-blue-400 text-blue-900 shadow-md';
      case 'future': return 'bg-green-100 border-green-400 text-green-900 shadow-md';
      case 'flashback': return 'bg-purple-100 border-purple-400 text-purple-900 shadow-md';
      case 'flashforward': return 'bg-pink-100 border-pink-400 text-pink-900 shadow-md';
      default: return 'bg-gray-100 border-gray-400 text-gray-900 shadow-md';
    }
  };

  return (
    <motion.div
      className="group relative cursor-pointer select-none"
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onClick={() => onClick(data.id)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ opacity, filter: `brightness(${brightness})` }}
    >
      <motion.div
        className={`
          relative min-w-[300px] w-full h-auto rounded-2xl p-4 
          backdrop-blur-md border border-white/20 shadow-2xl
          bg-gradient-to-br ${color}
          transition-all duration-300 ease-out
          hover:shadow-3xl hover:border-white/30
        `}
        style={{
          boxShadow: `
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 15px 12px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `
        }}
      >
        <motion.div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-white/90" />
              <div className="text-xs font-bold text-white/95 uppercase tracking-widest drop-shadow-sm">
                {nodeType}
              </div>
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
          
          <div className="text-white/80 text-xs line-clamp-2 drop-shadow-sm mb-3">
            {(data.data as any).description}
          </div>

          {/* Propagated content from child scenes */}
          <div className="space-y-3">
            {/* Propagated POV Characters */}
            {propagatedPovCharacters.length > 0 && (
              <div>
                <div className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-1">
                  <span>📖</span>
                  POV Characters (from scenes)
                </div>
                <div className="flex flex-wrap gap-2">
                  {propagatedPovCharacters.slice(0, 4).map((charId: string) => {
                    const character = getCharacterInfo(charId);
                    return (
                      <motion.button
                        key={charId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onCharacterClick) {
                            onCharacterClick(charId, data.id, e);
                          }
                        }}
                        className="group relative"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        title={`${character.name} (POV Character)`}
                      >
                        <img
                          src={character.image}
                          alt={character.name}
                          className="w-8 h-8 rounded-full border-2 border-yellow-400 hover:border-yellow-300 transition-colors ring-2 ring-yellow-400/30"
                        />
                      </motion.button>
                    );
                  })}
                  {propagatedPovCharacters.length > 4 && (
                    <div 
                      className="flex items-center justify-center w-8 h-8 bg-yellow-400/20 rounded-full text-white/70 text-xs cursor-pointer border-2 border-yellow-400/50"
                      title={`Other POV characters: ${propagatedPovCharacters.slice(4).map((id: string) => getCharacterInfo(id).name).join(', ')}`}
                    >
                      +{propagatedPovCharacters.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Propagated Timeline Event Tags */}
            {propagatedTimelineEventTags.length > 0 && (
              <div>
                <div className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-1">
                  <span>⏱</span>
                  Timeline Themes (from scenes)
                </div>
                <div className="flex flex-wrap gap-2">
                  {propagatedTimelineEventTags.map((tag: string) => (
                    <motion.div
                      key={tag}
                      className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium ${getTagColor(tag)}`}
                      whileHover={{ scale: 1.05 }}
                      title={`Timeline events of type: ${tag}`}
                    >
                      <span className="mr-1">⏱</span>
                      {tag}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter-specific content stats */}
            <div className="flex gap-4 text-xs text-white/70 pt-2 border-t border-white/20">
              <div>{childScenes.length} scenes</div>
              {(data as any).linkedNodeIds && (data as any).linkedNodeIds.length > 0 && (
                <div>{(data as any).linkedNodeIds.length} links</div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Select button */}
            {onSelect && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onSelect(data.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="w-6 h-6 bg-green-500/70 hover:bg-green-500 rounded-full flex items-center justify-center transition-colors z-20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Focus on this Chapter"
              >
                <CursorArrowRaysIcon className="w-3 h-3 text-white" />
              </motion.button>
            )}
            
            {/* Edit button */}
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
              className="w-6 h-6 bg-blue-500/70 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors z-20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Edit Chapter"
            >
              <PencilIcon className="w-3 h-3 text-white" />
            </motion.button>

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
                className="w-6 h-6 bg-purple-500/70 hover:bg-purple-500 rounded-full flex items-center justify-center transition-colors z-20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Collapse Chapter"
              >
                <MinusIcon className="w-3 h-3 text-white" />
              </motion.button>
            )}

            {/* Add child button */}
            {onAddChild && (
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
                className="w-6 h-6 bg-green-600/70 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors z-20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Add Scene to Chapter"
              >
                <PlusIcon className="w-3 h-3 text-white" />
              </motion.button>
            )}

            {/* Delete button */}
            {onDelete && (
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
                className="w-6 h-6 bg-red-500/70 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors z-20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Delete Chapter"
              >
                <TrashIcon className="w-3 h-3 text-white" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Connection handles */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!bg-white/50 !border-2 !border-white !w-3 !h-3 !rounded-full hover:!bg-white transition-colors"
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="!bg-white/50 !border-2 !border-white !w-3 !h-3 !rounded-full hover:!bg-white transition-colors"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!bg-white/50 !border-2 !border-white !w-3 !h-3 !rounded-full hover:!bg-white transition-colors"
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!bg-white/50 !border-2 !border-white !w-3 !h-3 !rounded-full hover:!bg-white transition-colors"
        />
      </motion.div>
    </motion.div>
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
      <ExpandedSceneNode 
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
