import { NarrativeFlowNode, NarrativeEdge, NarrativeNode, NarrativeFilters } from '../../../../../types/narrative-layout';

// Generate hierarchical tree layout positions with collision avoidance
export const generateHierarchicalLayout = (nodes: NarrativeFlowNode[]): NarrativeFlowNode[] => {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const positionedNodes = new Map<string, { x: number; y: number }>();
  
  // Enhanced configuration for better spacing and collision avoidance
  const config = {
    levelHeight: 450,      // Increased vertical spacing between levels
    nodeSpacing: 500,      // Much larger horizontal spacing between siblings to prevent overlap
    arcSpacing: 600,       // Spacing for arc nodes from main tree
    sceneOffset: 250,      // Additional spacing for scenes
    minNodeWidth: 320,     // Minimum node width for collision calculation
    collisionPadding: 50,  // Extra padding to prevent visual overlap
    arcStartX: 1200,       // Starting X position for arc columns
    arcStartY: 50          // Starting Y position for arc nodes
  };

  // Find root nodes and categorize nodes
  const rootNodes = nodes.filter(node => !node.data.parentId);
  const plotNodes = nodes.filter(node => 
    ['outline', 'act', 'chapter', 'scene'].includes(node.type)
  );
  const arcNodes = nodes.filter(node => 
    ['character-arc', 'location-arc', 'object-arc', 'lore-arc'].includes(node.type)
  );

  // Track occupied spaces to avoid collisions
  const occupiedSpaces = new Set<string>();
  
  const isSpaceOccupied = (x: number, y: number): boolean => {
    const key = `${Math.round(x/50)}-${Math.round(y/50)}`; // Grid-based collision detection
    return occupiedSpaces.has(key);
  };
  
  const markSpaceOccupied = (x: number, y: number): void => {
    // Mark a 3x3 grid around the position as occupied
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${Math.round((x + dx * 50)/50)}-${Math.round((y + dy * 50)/50)}`;
        occupiedSpaces.add(key);
      }
    }
  };

  // Find next available position if collision occurs
  const findAvailablePosition = (preferredX: number, preferredY: number): { x: number, y: number } => {
    let x = preferredX;
    let y = preferredY;
    
    // Try the preferred position first
    if (!isSpaceOccupied(x, y)) {
      markSpaceOccupied(x, y);
      return { x, y };
    }
    
    // Spiral outward to find available space
    for (let radius = 1; radius <= 10; radius++) {
      const step = config.nodeSpacing / 2;
      
      // Try positions in expanding circles
      for (let angle = 0; angle < 360; angle += 45) {
        const newX = preferredX + Math.cos(angle * Math.PI / 180) * radius * step;
        const newY = preferredY + Math.sin(angle * Math.PI / 180) * radius * step;
        
        if (!isSpaceOccupied(newX, newY)) {
          markSpaceOccupied(newX, newY);
          return { x: newX, y: newY };
        }
      }
    }
    
    // Fallback to preferred position if no space found
    markSpaceOccupied(x, y);
    return { x, y };
  };

  // Calculate tree layout for plot structure with proper hierarchy
  const calculateTreeLayout = (nodeId: string, level: number, siblingIndex: number, siblingCount: number, parentX: number = 0) => {
    const node = nodeMap.get(nodeId);
    if (!node || positionedNodes.has(nodeId)) return;

    const children = nodes.filter(n => n.data.parentId === nodeId);
    
    let preferredX: number;
    let preferredY = level * config.levelHeight;

    if (level === 0) {
      // Root node (outline) - center it
      preferredX = 0;
    } else {
      // All other levels - position relative to parent
      if (siblingCount === 1) {
        // Single child stays centered under parent
        preferredX = parentX;
      } else {
        // Multiple siblings - spread them evenly
        const totalWidth = (siblingCount - 1) * config.nodeSpacing;
        const startX = parentX - totalWidth / 2;
        preferredX = startX + siblingIndex * config.nodeSpacing;
      }
      
      // Add extra spacing for scenes to create clear hierarchy
      if (node.type === 'scene') {
        preferredY += config.sceneOffset;
      }
    }

    // Find available position to avoid collisions
    const position = findAvailablePosition(preferredX, preferredY);
    positionedNodes.set(nodeId, position);

    // Sort children for consistent positioning
    const sortedChildren = children.sort((a, b) => a.data.data.title.localeCompare(b.data.data.title));
    
    // Recursively position children
    sortedChildren.forEach((child, index) => {
      calculateTreeLayout(child.id, level + 1, index, sortedChildren.length, position.x);
    });
  };

  // Position outline nodes first (main story structure)
  const outlineNodes = plotNodes.filter(node => node.type === 'outline');
  outlineNodes.forEach((outline, index) => {
    const startX = index * config.nodeSpacing * 2; // Space out multiple outlines
    calculateTreeLayout(outline.id, 0, index, outlineNodes.length);
  });

  // Position arc nodes in organized columns at the bottom-right
  const arcTypes: ('character-arc' | 'location-arc' | 'object-arc' | 'lore-arc')[] = ['character-arc', 'location-arc', 'object-arc', 'lore-arc'];
  const arcTypeColors: Record<'character-arc' | 'location-arc' | 'object-arc' | 'lore-arc', { x: number; name: string }> = {
    'character-arc': { x: config.arcStartX, name: 'Characters' },
    'location-arc': { x: config.arcStartX + config.arcSpacing, name: 'Locations' },
    'object-arc': { x: config.arcStartX + config.arcSpacing * 2, name: 'Objects' },
    'lore-arc': { x: config.arcStartX + config.arcSpacing * 3, name: 'Lore' }
  };
  
  // Find the maximum Y position from plot nodes to position arcs below
  const maxPlotY = Math.max(
    ...Array.from(positionedNodes.values()).map(pos => pos.y),
    0
  );
  const arcStartY = maxPlotY + config.levelHeight; // Position arcs below all plot nodes
  
  arcTypes.forEach(type => {
    const typeNodes = arcNodes.filter(node => node.type === type);
    const columnConfig = arcTypeColors[type];
    
    typeNodes.forEach((node, nodeIndex) => {
      const x = columnConfig.x;
      const y = arcStartY + nodeIndex * (config.nodeSpacing + config.collisionPadding);
      
      const position = findAvailablePosition(x, y);
      positionedNodes.set(node.id, position);
    });
  });

  // Apply calculated positions
  return nodes.map(node => {
    const position = positionedNodes.get(node.id);
    if (position) {
      return {
        ...node,
        position,
        data: {
          ...node.data,
          position
        }
      };
    }
    return node;
  });
};

// Generate edges with improved routing and smart bundling
export const generateEdges = (
  nodes: NarrativeFlowNode[], 
  selectedNodeId?: string,
  selectedNodeAncestors: string[] = [],
  selectedNodeDescendants: string[] = []
): { edges: NarrativeEdge[], hubNodes: NarrativeFlowNode[] } => {
  const edges: NarrativeEdge[] = [];
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  // Helper to determine if edge should be highlighted
  const isEdgeHighlighted = (sourceId: string, targetId: string): boolean => {
    if (!selectedNodeId) return false;
    
    const isAncestorPath = selectedNodeAncestors.includes(sourceId) && 
                          (selectedNodeAncestors.includes(targetId) || targetId === selectedNodeId);
    const isDescendantPath = (sourceId === selectedNodeId || selectedNodeDescendants.includes(sourceId)) && 
                            selectedNodeDescendants.includes(targetId);
    
    return isAncestorPath || isDescendantPath;
  };

  // Track ONLY linked incoming connections for hub creation
  const incomingLinkedConnections = new Map<string, string[]>();
  
  // Collect only linked connections (not parent-child)
  nodes.forEach(node => {
    node.data.linkedNodeIds.forEach(linkedId => {
      if (!incomingLinkedConnections.has(linkedId)) {
        incomingLinkedConnections.set(linkedId, []);
      }
      incomingLinkedConnections.get(linkedId)!.push(node.id);
    });
  });

  // Helper function to get edge styling
  const getEdgeStyle = (
    targetNode: NarrativeFlowNode,
    isHighlighted: boolean,
    relationship: 'child' | 'linked' = 'child'
  ) => {
    let strokeColor = '#64748b';
    let strokeWidth = relationship === 'linked' ? 2 : 3;
    let animated = false;
    let strokeDasharray = relationship === 'linked' ? '8,4' : undefined;

    if (isHighlighted) {
      strokeWidth = relationship === 'linked' ? 3 : 4;
      animated = true;
      
      // Color based on target status
      switch (targetNode.data.status) {
        case 'completed':
          strokeColor = '#10b981'; // green
          break;
        case 'in-progress':
          strokeColor = '#f59e0b'; // amber
          break;
        case 'not-completed':
          strokeColor = '#6366f1'; // indigo
          break;
      }
    } else if (selectedNodeId) {
      // Dim non-highlighted edges when a node is selected
      strokeColor = '#e2e8f0';
      strokeWidth = Math.max(1, strokeWidth - 1);
      strokeDasharray = relationship === 'linked' ? '4,4' : '6,6';
    } else {
      // Default colors based on status
      switch (targetNode.data.status) {
        case 'completed':
          strokeColor = '#10b981';
          break;
        case 'in-progress':
          strokeColor = '#f59e0b';
          break;
        case 'not-completed':
          strokeColor = '#94a3b8';
          break;
      }
    }

    return {
      animated,
      style: {
        stroke: strokeColor,
        strokeWidth,
        strokeDasharray
      }
    };
  };

  // Create hub nodes for targets with multiple linked connections (>1 source)
  const hubNodes = new Map<string, NarrativeFlowNode>();
  const nodesWithHubs = [...nodes];
  
  incomingLinkedConnections.forEach((sourceIds, targetId) => {
    if (sourceIds.length > 1) {
      console.log(`Target ${targetId} has ${sourceIds.length} linked sources:`, sourceIds);
      
      const targetNode = nodeMap.get(targetId);
      if (!targetNode) return;
      
      // Create hub node positioned between sources and target
      const sourceNodes = sourceIds.map(id => nodeMap.get(id)).filter(Boolean) as NarrativeFlowNode[];
      const avgSourceX = sourceNodes.reduce((sum, node) => sum + node.position.x, 0) / sourceNodes.length;
      const avgSourceY = sourceNodes.reduce((sum, node) => sum + node.position.y, 0) / sourceNodes.length;
      
      const hubId = `hub-${targetId}`;
      const hubNode: NarrativeFlowNode = {
        id: hubId,
        type: 'default', // Use default type to avoid NarrativeNodes component
        position: {
          x: avgSourceX + (targetNode.position.x - avgSourceX) * 0.7,
          y: avgSourceY + (targetNode.position.y - avgSourceY) * 0.7
        },
        data: {
          isHub: true
        } as any,
        style: {
          opacity: 0,
          pointerEvents: 'none',
          width: 1,
          height: 1
        }
      };
      
      hubNodes.set(hubId, hubNode);
      nodesWithHubs.push(hubNode);
    }
  });

  // Generate edges with smart bundling
  nodes.forEach(node => {
    // Parent-child edges (no bundling for these)
    node.data.childIds.forEach(childId => {
      const targetNode = nodeMap.get(childId);
      if (!targetNode) return;

      const edgeStyle = getEdgeStyle(targetNode, isEdgeHighlighted(node.id, childId));

      edges.push({
        id: `${node.id}-${childId}`,
        source: node.id,
        target: childId,
        type: 'smoothstep',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        ...edgeStyle,
        data: {
          relationship: 'child',
          bundled: false
        }
      });
    });

    // Linked edges with hub bundling
    node.data.linkedNodeIds.forEach(linkedId => {
      const targetNode = nodeMap.get(linkedId);
      if (!targetNode) return;

      const linkedSources = incomingLinkedConnections.get(linkedId) || [];
      const shouldBundle = linkedSources.length > 1;
      const hubId = `hub-${linkedId}`;

      if (shouldBundle && hubNodes.has(hubId)) {
        // Create edge from source to hub
        const edgeToHub: NarrativeEdge = {
          id: `${node.id}-to-hub-${linkedId}`,
          source: node.id,
          target: hubId,
          type: 'smoothstep',
          sourceHandle: 'right',
          targetHandle: 'left',
          ...getEdgeStyle(targetNode, isEdgeHighlighted(node.id, linkedId), 'linked'),
          data: {
            relationship: 'linked' as const,
            bundled: true,
            bundleGroup: `bundle-${linkedId}`
          }
        };
        
        edges.push(edgeToHub);
        
        // Create edge from hub to target (only once)
        const hubToTargetId = `hub-${linkedId}-to-${linkedId}`;
        if (!edges.find(e => e.id === hubToTargetId)) {
          const edgeFromHub: NarrativeEdge = {
            id: hubToTargetId,
            source: hubId,
            target: linkedId,
            type: 'smoothstep',
            sourceHandle: 'right',
            targetHandle: 'left',
            ...getEdgeStyle(targetNode, isEdgeHighlighted(hubId, linkedId), 'linked'),
            data: {
              relationship: 'linked' as const,
              bundled: true,
              bundleGroup: `bundle-${linkedId}`
            }
          };
          
          edges.push(edgeFromHub);
        }
      } else {
        // Direct edge without bundling
        const edgeStyle = getEdgeStyle(targetNode, isEdgeHighlighted(node.id, linkedId), 'linked');

        edges.push({
          id: `${node.id}-link-${linkedId}`,
          source: node.id,
          target: linkedId,
          type: 'smoothstep',
          sourceHandle: 'right',
          targetHandle: 'left',
          ...edgeStyle,
          data: {
            relationship: 'linked',
            bundled: false
          }
        });
      }
    });
  });

  return { edges, hubNodes: Array.from(hubNodes.values()) };
};

// Get all ancestors of a node (walking up the parent chain)
export const getNodeAncestors = (nodeId: string, nodes: NarrativeFlowNode[]): string[] => {
  const ancestors: string[] = [];
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  
  const findAncestors = (currentId: string) => {
    const node = nodeMap.get(currentId);
    if (node?.data.parentId) {
      ancestors.push(node.data.parentId);
      findAncestors(node.data.parentId);
    }
  };
  
  findAncestors(nodeId);
  return ancestors;
};

// Get all descendants of a node (walking down the child tree)
export const getNodeDescendants = (nodeId: string, nodes: NarrativeFlowNode[]): string[] => {
  const descendants: string[] = [];
  
  const findDescendants = (currentId: string) => {
    const node = nodes.find(n => n.id === currentId);
    if (node) {
      node.data.childIds.forEach(childId => {
        descendants.push(childId);
        findDescendants(childId);
      });
    }
  };
  
  findDescendants(nodeId);
  return descendants;
};

// Get siblings of a node (nodes with the same parent)
export const getNodeSiblings = (nodeId: string, nodes: NarrativeFlowNode[]): string[] => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node?.data.parentId) return [];
  
  return nodes
    .filter(n => n.data.parentId === node.data.parentId && n.id !== nodeId)
    .map(n => n.id);
};

// Update node expansion states based on selection
export const updateNodeExpansionStates = (
  nodes: NarrativeFlowNode[],
  selectedNodeId: string | null,
  drillDownMode: boolean = false
): NarrativeFlowNode[] => {
  if (!selectedNodeId) {
    // No selection - show all nodes in their default state
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isExpanded: false,
        isMuted: false
      }
    }));
  }

  const ancestors = getNodeAncestors(selectedNodeId, nodes);
  const descendants = getNodeDescendants(selectedNodeId, nodes);
  const siblings = getNodeSiblings(selectedNodeId, nodes);

  return nodes.map(node => {
    const isSelected = node.id === selectedNodeId;
    const isAncestor = ancestors.includes(node.id);
    const isDescendant = descendants.includes(node.id);
    const isSibling = siblings.includes(node.id);
    
    if (drillDownMode) {
      // Drill-down mode: show only selected node tree
      const shouldShow = isSelected || isDescendant || isSibling;
      
      return {
        ...node,
        data: {
          ...node.data,
          isExpanded: isSelected,
          isMuted: !shouldShow,
          isVisible: shouldShow
        }
      };
    } else {
      // Single-click mode: highlight path, mute others
      const isInPath = isSelected || isAncestor || isDescendant;
      
      return {
        ...node,
        data: {
          ...node.data,
          isExpanded: isSelected || isDescendant,
          isMuted: !isInPath,
          isVisible: true
        }
      };
    }
  });
};

// Load all nodes with smart expansion state (show all nodes but control their visual representation)
export const getVisibleNodes = (
  allNodes: NarrativeFlowNode[], 
  selectedNodeId: string | null = null
): NarrativeFlowNode[] => {
  if (!selectedNodeId) {
    // No selection - show all nodes with default expansion logic
    return allNodes.map(node => {
      let shouldBeExpanded = false;
      
      // Expand outline and acts by default
      if (node.data.type === 'outline' || node.data.type === 'act') {
        shouldBeExpanded = true;
      }

      return {
        ...node,
        data: {
          ...node.data,
          isExpanded: shouldBeExpanded,
          isMuted: false,
          isSelectedOrRelated: true
        }
      };
    });
  }

  // Get ancestors and descendants of selected node
  const ancestors = getNodeAncestors(selectedNodeId, allNodes);
  const descendants = getNodeDescendants(selectedNodeId, allNodes);
  
  // Get the selected node to check its type
  const selectedNode = allNodes.find(node => node.id === selectedNodeId);
  
  // Create set of nodes to show: selected + ancestors + descendants
  const visibleNodeIds = new Set([
    selectedNodeId,
    ...ancestors,
    ...descendants
  ]);

  // For chapters and scenes, also include linked arc nodes (character, location, object, lore arcs)
  if (selectedNode && (selectedNode.data.type === 'chapter' || selectedNode.data.type === 'scene')) {
    // Add linked nodes from the selected node
    selectedNode.data.linkedNodeIds.forEach(linkedId => {
      const linkedNode = allNodes.find(n => n.id === linkedId);
      if (linkedNode && ['character-arc', 'location-arc', 'object-arc', 'lore-arc'].includes(linkedNode.data.type)) {
        visibleNodeIds.add(linkedId);
      }
    });

    // Also check descendants for linked nodes
    descendants.forEach(descendantId => {
      const descendantNode = allNodes.find(n => n.id === descendantId);
      if (descendantNode && descendantNode.data.type === 'scene') {
        descendantNode.data.linkedNodeIds.forEach(linkedId => {
          const linkedNode = allNodes.find(n => n.id === linkedId);
          if (linkedNode && ['character-arc', 'location-arc', 'object-arc', 'lore-arc'].includes(linkedNode.data.type)) {
            visibleNodeIds.add(linkedId);
          }
        });
      }
    });
  }

  // Filter nodes to only show visible ones
  const visibleNodes = allNodes.filter(node => visibleNodeIds.has(node.id));

  // Apply expansion and muting logic
  return visibleNodes.map(node => {
    let shouldBeExpanded = false;
    let isSelectedOrRelated = true;

    // Current node is selected (should be expanded)
    if (node.id === selectedNodeId) {
      shouldBeExpanded = true;
    }
    // Node is ancestor of selected (should be expanded to show path)
    else if (ancestors.includes(node.id)) {
      shouldBeExpanded = true;
    }
    // Node is descendant of selected (children expanded, grandchildren collapsed)
    else if (descendants.includes(node.id)) {
      // Only expand immediate children
      shouldBeExpanded = node.data.parentId === selectedNodeId;
    }
    // Arc nodes should be collapsed by default when linked
    else if (['character-arc', 'location-arc', 'object-arc', 'lore-arc'].includes(node.data.type)) {
      shouldBeExpanded = false;
    }

    return {
      ...node,
      data: {
        ...node.data,
        isExpanded: shouldBeExpanded,
        isMuted: false,
        isSelectedOrRelated
      }
    };
  });
};

// Filter nodes based on search criteria
export const filterNodes = (
  nodes: NarrativeFlowNode[], 
  filters: NarrativeFilters, 
  searchQuery: string = ''
): NarrativeFlowNode[] => {
  const filtered = nodes.filter(node => {
    // Search query filter
    const matchesSearch = searchQuery === '' || 
      node.data.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.data.data.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Node type filter
    const matchesNodeType = filters.nodeTypes.length === 0 || 
      filters.nodeTypes.includes(node.data.type);

    // Status filter
    const matchesStatus = filters.status.length === 0 || 
      filters.status.includes(node.data.status);

    // Character filter (for scenes and character arcs)
    const matchesCharacters = filters.characters.length === 0 || (() => {
      if (node.data.type === 'scene') {
        const sceneData = node.data.data as any;
        return sceneData.characters?.some((char: string) => 
          filters.characters.includes(char)
        );
      }
      if (node.data.type === 'character-arc') {
        const charArcData = node.data.data as any;
        return filters.characters.includes(charArcData.characterId);
      }
      return true;
    })();

    // Location filter (for scenes and location arcs)
    const matchesLocations = filters.locations.length === 0 || (() => {
      if (node.data.type === 'scene') {
        const sceneData = node.data.data as any;
        return sceneData.worlds?.some((world: string) => 
          filters.locations.includes(world)
        );
      }
      if (node.data.type === 'location-arc') {
        const locArcData = node.data.data as any;
        return filters.locations.includes(locArcData.locationId);
      }
      return true;
    })();

    // Timeline events filter
    const matchesTimelineEvents = filters.timelineEvents.length === 0 || (() => {
      const hasTimelineEvents = 'timelineEventIds' in node.data.data;
      if (hasTimelineEvents) {
        const timelineEventIds = (node.data.data as any).timelineEventIds || [];
        return timelineEventIds.some((eventId: string) => 
          filters.timelineEvents.includes(eventId)
        );
      }
      return true;
    })();

    return matchesSearch && matchesNodeType && matchesStatus && 
           matchesCharacters && matchesLocations && matchesTimelineEvents;
  });

  // Include ancestors to preserve hierarchy context
  const filteredWithAncestors = new Set<string>();
  
  filtered.forEach(node => {
    filteredWithAncestors.add(node.id);
    
    // Add all ancestors
    let currentNode = node;
    while (currentNode.data.parentId) {
      filteredWithAncestors.add(currentNode.data.parentId);
      const parentNode = nodes.find(n => n.id === currentNode.data.parentId);
      if (!parentNode) break;
      currentNode = parentNode;
    }
  });

  return nodes.filter(node => filteredWithAncestors.has(node.id));
};

// Expand/collapse utilities
export const expandNode = (nodes: NarrativeFlowNode[], nodeId: string): NarrativeFlowNode[] => {
  return nodes.map(node => 
    node.id === nodeId 
      ? { ...node, data: { ...node.data, isExpanded: true } }
      : node
  );
};

export const collapseNode = (nodes: NarrativeFlowNode[], nodeId: string): NarrativeFlowNode[] => {
  return nodes.map(node => 
    node.id === nodeId 
      ? { ...node, data: { ...node.data, isExpanded: false } }
      : node
  );
};

export const expandAllDescendants = (nodes: NarrativeFlowNode[], nodeId: string): NarrativeFlowNode[] => {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const toExpand = new Set<string>();

  const collectDescendants = (id: string) => {
    toExpand.add(id);
    const node = nodeMap.get(id);
    if (node) {
      node.data.childIds.forEach(childId => collectDescendants(childId));
    }
  };

  collectDescendants(nodeId);

  return nodes.map(node => 
    toExpand.has(node.id)
      ? { ...node, data: { ...node.data, isExpanded: true } }
      : node
  );
};

// Create new node utility
export const createNewNode = (
  nodeType: NarrativeNode['type'],
  parentId: string | null,
  position: { x: number; y: number }
): NarrativeFlowNode => {
  const id = `${nodeType}-${Date.now()}`;
  
  const baseNodeData = {
    id,
    type: nodeType,
    status: 'not-completed' as const,
    position,
    parentId,
    childIds: [],
    linkedNodeIds: [],
    isExpanded: false
  };

  // Create type-specific data
  const createNodeData = (): any => {
    switch (nodeType) {
      case 'outline':
        return {
          title: 'New Outline',
          description: 'Click to edit this outline...',
          goal: 'Define the overall story structure',
          timelineEventIds: []
        };
      case 'act':
        return {
          title: 'New Act',
          description: 'Click to edit this act...',
          goal: 'Advance the story arc',
          timelineEventIds: []
        };
      case 'chapter':
        return {
          title: 'New Chapter',
          description: 'Click to edit this chapter...',
          goal: 'Complete chapter objectives',
          timelineEventIds: []
        };
      case 'scene':
        return {
          title: 'New Scene',
          description: 'Click to edit this scene...',
          goal: 'Achieve scene purpose',
          chapter: 'TBD',
          characters: [],
          worlds: [],
          timelineEventIds: []
        };
      case 'character-arc':
        return {
          title: 'New Character Arc',
          description: 'Click to edit this character arc...',
          goal: 'Develop character growth',
          characterId: '',
          arcType: 'secondary' as const,
          emotionalJourney: []
        };
      case 'location-arc':
        return {
          title: 'New Location Arc',
          description: 'Click to edit this location arc...',
          goal: 'Establish location significance',
          locationId: '',
          timelineEventIds: []
        };
      case 'object-arc':
        return {
          title: 'New Object Arc',
          description: 'Click to edit this object arc...',
          goal: 'Define object importance',
          objectId: '',
          timelineEventIds: []
        };
      case 'lore-arc':
        return {
          title: 'New Lore Arc',
          description: 'Click to edit this lore arc...',
          goal: 'Establish lore relevance',
          loreId: '',
          timelineEventIds: []
        };
      default:
        return {
          title: 'New Node',
          description: 'Click to edit...',
          goal: 'Define purpose'
        };
    }
  };

  const narrativeNode: NarrativeNode = {
    ...baseNodeData,
    data: createNodeData()
  } as NarrativeNode;

  return {
    id,
    type: nodeType,
    position,
    data: narrativeNode
  };
};

// Sample data generator with Harry Potter: Philosopher's Stone content
export const generateSampleNarrativeData = (): { nodes: NarrativeFlowNode[], edges: NarrativeEdge[] } => {
  const sampleNodes: NarrativeFlowNode[] = [
    {
      id: 'outline-1',
      type: 'outline',
      position: { x: 0, y: 0 },
      data: {
        id: 'outline-1',
        type: 'outline',
        status: 'completed',
        position: { x: 0, y: 0 },
        parentId: null,
        childIds: ['act-1', 'act-2', 'act-3'],
        linkedNodeIds: [],
        isExpanded: true,
        data: {
          title: 'Harry Potter and the Philosopher\'s Stone',
          description: 'A boy wizard discovers his magical heritage and faces the dark wizard who killed his parents',
          goal: 'Establish Harry\'s journey from mundane orphan to hero wizard, introducing the magical world and Voldemort threat',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'act-1',
      type: 'act',
      position: { x: -300, y: 200 },
      data: {
        id: 'act-1',
        type: 'act',
        status: 'completed',
        position: { x: -300, y: 200 },
        parentId: 'outline-1',
        childIds: ['chapter-1', 'chapter-2', 'chapter-3'],
        linkedNodeIds: [],
        isExpanded: true,
        data: {
          title: 'Act I: The Ordinary World',
          description: 'Harry\'s life with the Dursleys and discovery of his wizarding heritage',
          goal: 'Establish Harry\'s miserable ordinary world and introduce the magical world',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'act-2',
      type: 'act',
      position: { x: 0, y: 200 },
      data: {
        id: 'act-2',
        type: 'act',
        status: 'completed',
        position: { x: 0, y: 200 },
        parentId: 'outline-1',
        childIds: ['chapter-4', 'chapter-5', 'chapter-6'],
        linkedNodeIds: [],
        isExpanded: true,
        data: {
          title: 'Act II: Learning and Growing',
          description: 'Harry\'s education at Hogwarts and growing mysteries about the Philosopher\'s Stone',
          goal: 'Develop Harry\'s magical education and build the central mystery',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'act-3',
      type: 'act',
      position: { x: 300, y: 200 },
      data: {
        id: 'act-3',
        type: 'act',
        status: 'completed',
        position: { x: 300, y: 200 },
        parentId: 'outline-1',
        childIds: ['chapter-7'],
        linkedNodeIds: [],
        isExpanded: false,
        data: {
          title: 'Act III: The Final Challenge',
          description: 'Harry confronts the truth about the Philosopher\'s Stone and faces Voldemort',
          goal: 'Climactic confrontation and Harry\'s first victory over evil',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'chapter-1',
      type: 'chapter',
      position: { x: -500, y: 400 },
      data: {
        id: 'chapter-1',
        type: 'chapter',
        status: 'completed',
        position: { x: -500, y: 400 },
        parentId: 'act-1',
        childIds: ['scene-1', 'scene-2'],
        linkedNodeIds: ['char-arc-harry', 'loc-arc-privet'],
        isExpanded: true,
        data: {
          title: 'Chapter 1: The Boy Who Lived',
          description: 'The wizarding world celebrates Voldemort\'s defeat and baby Harry is left with the Dursleys',
          goal: 'Establish the backstory and show Harry being placed with his relatives',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'chapter-2',
      type: 'chapter',
      position: { x: -300, y: 400 },
      data: {
        id: 'chapter-2',
        type: 'chapter',
        status: 'completed',
        position: { x: -300, y: 400 },
        parentId: 'act-1',
        childIds: ['scene-3', 'scene-4'],
        linkedNodeIds: ['char-arc-harry', 'char-arc-hagrid'],
        isExpanded: false,
        data: {
          title: 'Chapter 2: The Vanishing Glass',
          description: 'Harry\'s 11th birthday and first signs of magic with the snake at the zoo',
          goal: 'Show Harry\'s magical abilities emerging and his terrible treatment by the Dursleys',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'chapter-3',
      type: 'chapter',
      position: { x: -100, y: 400 },
      data: {
        id: 'chapter-3',
        type: 'chapter',
        status: 'completed',
        position: { x: -100, y: 400 },
        parentId: 'act-1',
        childIds: ['scene-5'],
        linkedNodeIds: ['char-arc-hagrid', 'loc-arc-diagon'],
        isExpanded: false,
        data: {
          title: 'Chapter 3: The Letters from No One',
          description: 'Hogwarts letters arrive and Hagrid rescues Harry from the Dursleys',
          goal: 'Harry discovers his wizarding heritage and enters the magical world',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'chapter-4',
      type: 'chapter',
      position: { x: -200, y: 400 },
      data: {
        id: 'chapter-4',
        type: 'chapter',
        status: 'completed',
        position: { x: -200, y: 400 },
        parentId: 'act-2',
        childIds: ['scene-6'],
        linkedNodeIds: ['char-arc-ron', 'char-arc-hermione', 'loc-arc-hogwarts'],
        isExpanded: false,
        data: {
          title: 'Chapter 4: The Keeper of the Keys',
          description: 'Diagon Alley shopping and learning about the wizarding world',
          goal: 'Introduce the magical world\'s depth and complexity',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'chapter-5',
      type: 'chapter',
      position: { x: 0, y: 400 },
      data: {
        id: 'chapter-5',
        type: 'chapter',
        status: 'completed',
        position: { x: 0, y: 400 },
        parentId: 'act-2',
        childIds: ['scene-7'],
        linkedNodeIds: ['char-arc-harry', 'char-arc-ron', 'char-arc-hermione'],
        isExpanded: false,
        data: {
          title: 'Chapter 5: Platform Nine and Three-Quarters',
          description: 'Harry\'s first trip to Hogwarts and meeting Ron and Hermione',
          goal: 'Establish the core friendship trio and Harry\'s entry into Hogwarts',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'chapter-6',
      type: 'chapter',
      position: { x: 200, y: 400 },
      data: {
        id: 'chapter-6',
        type: 'chapter',
        status: 'in-progress',
        position: { x: 200, y: 400 },
        parentId: 'act-2',
        childIds: ['scene-8'],
        linkedNodeIds: ['obj-arc-stone', 'char-arc-snape'],
        isExpanded: false,
        data: {
          title: 'Chapter 6: The Journey from Platform Nine and Three-Quarters',
          description: 'Hogwarts classes begin and mysteries about the Philosopher\'s Stone emerge',
          goal: 'Develop magical education and introduce the central mystery',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'chapter-7',
      type: 'chapter',
      position: { x: 300, y: 400 },
      data: {
        id: 'chapter-7',
        type: 'chapter',
        status: 'not-completed',
        position: { x: 300, y: 400 },
        parentId: 'act-3',
        childIds: ['scene-9'],
        linkedNodeIds: ['char-arc-voldemort', 'obj-arc-stone'],
        isExpanded: false,
        data: {
          title: 'Chapter 7: Through the Trapdoor',
          description: 'Harry and friends confront the challenges protecting the Stone and face Quirrell/Voldemort',
          goal: 'Climactic confrontation where Harry saves the Stone and defeats Voldemort\'s return attempt',
          timelineEventIds: []
        }
      }
    },
    // Scenes
    {
      id: 'scene-1',
      type: 'scene',
      position: { x: -600, y: 600 },
      data: {
        id: 'scene-1',
        type: 'scene',
        status: 'completed',
        position: { x: -600, y: 600 },
        parentId: 'chapter-1',
        childIds: [],
        linkedNodeIds: ['char-arc-dumbledore', 'char-arc-mcgonagall'],
        isExpanded: false,
        data: {
          title: 'McGonagall and Dumbledore on Privet Drive',
          description: 'Professor McGonagall watches the Dursleys all day, then meets Dumbledore to discuss Harry\'s placement',
          goal: 'Establish the gravity of Voldemort\'s defeat and show wizard world\'s concern for Harry',
          chapter: 'Chapter 1: The Boy Who Lived',
          characters: ['char-001', 'char-002', 'char-003'],
          povCharacterId: 'char-002',
          locations: ['loc-001'],
          objects: ['obj-001'],
          lore: ['lore-001'],
          worlds: ['Privet Drive'],
          timelineEventIds: []
        }
      }
    },
    {
      id: 'scene-2',
      type: 'scene',
      position: { x: -400, y: 600 },
      data: {
        id: 'scene-2',
        type: 'scene',
        status: 'completed',
        position: { x: -400, y: 600 },
        parentId: 'chapter-1',
        childIds: [],
        linkedNodeIds: ['char-arc-hagrid', 'char-arc-harry'],
        isExpanded: false,
        data: {
          title: 'Hagrid Delivers Baby Harry',
          description: 'Hagrid arrives with baby Harry and the three professors leave him with the Dursleys',
          goal: 'Show Harry\'s tragic beginning and the sacrifice made for his protection',
          chapter: 'Chapter 1: The Boy Who Lived',
          characters: ['char-004', 'char-005'],
          povCharacterId: 'char-004',
          locations: ['loc-001'],
          objects: ['obj-002', 'obj-003'],
          lore: ['lore-002'],
          worlds: ['Privet Drive'],
          timelineEventIds: []
        }
      }
    },
    // Character Arcs
    {
      id: 'char-arc-harry',
      type: 'character-arc',
      position: { x: 800, y: 100 },
      data: {
        id: 'char-arc-harry',
        type: 'character-arc',
        status: 'completed',
        position: { x: 800, y: 100 },
        parentId: null,
        childIds: [],
        linkedNodeIds: ['chapter-1', 'chapter-2', 'chapter-5'],
        isExpanded: false,
        data: {
          title: 'Harry Potter\'s Hero Journey',
          description: 'From unloved orphan to confident young wizard who defeats evil',
          goal: 'Transform Harry from victim to hero through courage and friendship',
          characterId: 'harry-potter',
          arcType: 'main',
          emotionalJourney: ['Loneliness', 'Wonder', 'Belonging', 'Courage', 'Triumph']
        }
      }
    },
    {
      id: 'char-arc-hermione',
      type: 'character-arc',
      position: { x: 800, y: 250 },
      data: {
        id: 'char-arc-hermione',
        type: 'character-arc',
        status: 'completed',
        position: { x: 800, y: 250 },
        parentId: null,
        childIds: [],
        linkedNodeIds: ['chapter-5', 'chapter-6'],
        isExpanded: false,
        data: {
          title: 'Hermione Granger\'s Integration',
          description: 'From know-it-all outcast to valued friend and team member',
          goal: 'Show that true friendship comes from loyalty, not just intelligence',
          characterId: 'hermione-granger',
          arcType: 'secondary',
          emotionalJourney: ['Isolation', 'Eagerness', 'Vulnerability', 'Acceptance', 'Loyalty']
        }
      }
    },
    {
      id: 'char-arc-ron',
      type: 'character-arc',
      position: { x: 800, y: 400 },
      data: {
        id: 'char-arc-ron',
        type: 'character-arc',
        status: 'in-progress',
        position: { x: 800, y: 400 },
        parentId: null,
        childIds: [],
        linkedNodeIds: ['chapter-4', 'chapter-5'],
        isExpanded: false,
        data: {
          title: 'Ron Weasley\'s Friendship',
          description: 'From insecure youngest son to brave loyal friend',
          goal: 'Demonstrate the power of loyalty and courage over insecurity',
          characterId: 'ron-weasley',
          arcType: 'secondary',
          emotionalJourney: ['Insecurity', 'Friendship', 'Jealousy', 'Courage', 'Confidence']
        }
      }
    },
    // Location Arcs
    {
      id: 'loc-arc-hogwarts',
      type: 'location-arc',
      position: { x: 1100, y: 100 },
      data: {
        id: 'loc-arc-hogwarts',
        type: 'location-arc',
        status: 'completed',
        position: { x: 1100, y: 100 },
        parentId: null,
        childIds: [],
        linkedNodeIds: ['chapter-4', 'chapter-5', 'chapter-6'],
        isExpanded: false,
        data: {
          title: 'Hogwarts School of Witchcraft and Wizardry',
          description: 'The magical school becomes Harry\'s first true home',
          goal: 'Establish Hogwarts as a place of wonder, learning, and belonging',
          locationId: 'hogwarts-castle',
          timelineEventIds: []
        }
      }
    },
    {
      id: 'loc-arc-diagon',
      type: 'location-arc',
      position: { x: 1100, y: 250 },
      data: {
        id: 'loc-arc-diagon',
        type: 'location-arc',
        status: 'completed',
        position: { x: 1100, y: 250 },
        parentId: null,
        childIds: [],
        linkedNodeIds: ['chapter-3', 'chapter-4'],
        isExpanded: false,
        data: {
          title: 'Diagon Alley',
          description: 'Harry\'s first glimpse into the wizarding world\'s commerce and culture',
          goal: 'Introduce the scope and wonder of magical society',
          locationId: 'diagon-alley',
          timelineEventIds: []
        }
      }
    },
    // Object Arc
    {
      id: 'obj-arc-stone',
      type: 'object-arc',
      position: { x: 1400, y: 100 },
      data: {
        id: 'obj-arc-stone',
        type: 'object-arc',
        status: 'completed',
        position: { x: 1400, y: 100 },
        parentId: null,
        childIds: [],
        linkedNodeIds: ['chapter-6', 'chapter-7'],
        isExpanded: false,
        data: {
          title: 'The Philosopher\'s Stone',
          description: 'The legendary stone that grants immortality becomes the center of conflict',
          goal: 'Drive the central plot and represent the choice between life and death',
          objectId: 'philosophers-stone',
          timelineEventIds: []
        }
      }
    }
  ];

  const { edges } = generateEdges(sampleNodes);
  
  return { nodes: sampleNodes, edges };
};
