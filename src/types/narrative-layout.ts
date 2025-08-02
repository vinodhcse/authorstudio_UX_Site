import { Node } from 'reactflow';

// Base narrative node interface
export interface BaseNarrativeNode {
  id: string;
  type: 'outline' | 'act' | 'chapter' | 'scene' | 'character-arc' | 'location-arc' | 'object-arc' | 'lore-arc';
  status: 'not-completed' | 'in-progress' | 'completed';
  position: { x: number; y: number };
  parentId: string | null;
  childIds: string[];
  linkedNodeIds: string[];
  isExpanded?: boolean;
  // UI state properties for selection and interaction
  isMuted?: boolean;
  isVisible?: boolean;
  isHighlighted?: boolean;
}

// AI Analysis interfaces
export interface EmotionalTone {
  tone: string;
  intensity: number;
  confidence?: number;
}

export interface PacingAnalysis {
  speed: 'Fast' | 'Moderate' | 'Slow';
  confidence: number;
}

export interface AIAnalysis {
  emotionalArc: {
    expected: EmotionalTone[];
    detected: EmotionalTone[];
  };
  pacing: {
    expected: 'Fast' | 'Moderate' | 'Slow';
    detected: PacingAnalysis;
  };
}

// Specific node data structures
export interface OutlineNodeData {
  title: string;
  description: string;
  goal: string;
  timelineEventIds: string[];
}

export interface ActNodeData {
  title: string;
  description: string;
  goal: string;
  timelineEventIds: string[];
}

export interface ChapterNodeData {
  title: string;
  description: string;
  goal: string;
  timelineEventIds: string[];
}

export interface SceneNodeData {
  title: string;
  description: string;
  goal: string;
  chapter: string;
  characters: string[];
  worlds: string[];
  timelineEventIds: string[];
  ai?: AIAnalysis;
}

export interface CharacterArcNodeData {
  title: string;
  description: string;
  goal: string;
  characterId: string;
  arcType: 'main' | 'secondary' | 'background';
  emotionalJourney: string[];
}

export interface LocationArcNodeData {
  title: string;
  description: string;
  goal: string; // Changed from significance to goal for consistency
  locationId: string;
  timelineEventIds: string[];
}

export interface ObjectArcNodeData {
  title: string;
  description: string;
  goal: string; // Changed from significance to goal for consistency
  objectId: string;
  timelineEventIds: string[];
}

export interface LoreArcNodeData {
  title: string;
  description: string;
  goal: string; // Changed from significance to goal for consistency
  loreId: string;
  timelineEventIds: string[];
}

// Typed narrative nodes
export interface OutlineNode extends BaseNarrativeNode {
  type: 'outline';
  data: OutlineNodeData;
}

export interface ActNode extends BaseNarrativeNode {
  type: 'act';
  data: ActNodeData;
}

export interface ChapterNode extends BaseNarrativeNode {
  type: 'chapter';
  data: ChapterNodeData;
}

export interface SceneNode extends BaseNarrativeNode {
  type: 'scene';
  data: SceneNodeData;
}

export interface CharacterArcNode extends BaseNarrativeNode {
  type: 'character-arc';
  data: CharacterArcNodeData;
}

export interface LocationArcNode extends BaseNarrativeNode {
  type: 'location-arc';
  data: LocationArcNodeData;
}

export interface ObjectArcNode extends BaseNarrativeNode {
  type: 'object-arc';
  data: ObjectArcNodeData;
}

export interface LoreArcNode extends BaseNarrativeNode {
  type: 'lore-arc';
  data: LoreArcNodeData;
}

// Union type for all narrative nodes
export type NarrativeNode = 
  | OutlineNode 
  | ActNode 
  | ChapterNode 
  | SceneNode 
  | CharacterArcNode 
  | LocationArcNode 
  | ObjectArcNode 
  | LoreArcNode;

// ReactFlow node with narrative data
export interface NarrativeFlowNode extends Node {
  id: string;
  type: string;
  data: NarrativeNode;
}

// Edge types for narrative connections
export interface NarrativeEdge {
  id: string;
  source: string;
  target: string;
  type?: string; // ReactFlow edge type: 'default', 'straight', 'step', 'smoothstep'
  sourceHandle?: string;
  targetHandle?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
  animated?: boolean;
  data?: {
    relationship: 'child' | 'linked';
    bundled?: boolean;
    bundleGroup?: string;
  };
}

// Filter options
export interface NarrativeFilters {
  characters: string[];
  objects: string[];
  locations: string[];
  timelineEvents: string[];
  nodeTypes: NarrativeNode['type'][];
  status: BaseNarrativeNode['status'][];
}

// Layout configuration
export interface NarrativeLayoutConfig {
  expandedNodes: Set<string>;
  selectedNode: string | null;
  filters: NarrativeFilters;
  viewMode: 'hierarchy' | 'character-centric' | 'timeline' | 'drill-down';
  autoLayout: boolean;
}

// AI suggestion types
export interface AISuggestion {
  id: string;
  type: 'character-balance' | 'pacing-anomaly' | 'lore-connection' | 'plot-hole';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affectedNodeIds: string[];
  suggestedAction: string;
}

// Node creation modal data
export interface CreateNodeModalData {
  parentId: string | null;
  nodeType: NarrativeNode['type'];
  position: { x: number; y: number };
  isVisible: boolean;
}

// Timeline event for narrative context
export interface NarrativeTimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  relatedNodeIds: string[];
  eventType: 'plot' | 'character' | 'world' | 'lore';
}

export interface NarrativeLayoutState {
  nodes: NarrativeFlowNode[];
  edges: NarrativeEdge[];
  config: NarrativeLayoutConfig;
  aiSuggestions: AISuggestion[];
  createNodeModal: CreateNodeModalData;
  timelineEvents: NarrativeTimelineEvent[];
}
