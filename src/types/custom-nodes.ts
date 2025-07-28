import { Node } from 'reactflow';

// Scene Beat Node Data Structure
export interface SceneBeatData {
  id: string;
  chapterName: string;
  sceneBeatIndex: number;
  summary: string;
  goal: string;
  characters: string[];
  worldEntities: string[];
  timelineEvent?: string;
  status: 'Draft' | 'Edited' | 'Finalized';
  isExpanded?: boolean;
}

export interface SceneBeatNode extends Node {
  id: string;
  type: 'sceneBeatNode';
  data: SceneBeatData;
}

// Note Section Data Structure
export interface NoteSectionData {
  id: string;
  content: string;
  labels: string[]; // @rewrite, @clarify, @expand, etc.
  isExpanded?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Character Impersonation Data Structure
export interface CharacterMessage {
  id: string;
  character: string;
  message: string;
  isAI: boolean;
  timestamp: string;
}

export interface CharacterImpersonationData {
  id: string;
  activeCharacter: string; // The "You" character
  conversation: CharacterMessage[];
  availableCharacters: string[];
  isExpanded?: boolean;
}

// React Flow Canvas State
export interface ReactFlowCanvasState {
  nodes: SceneBeatNode[];
  edges: any[];
}

// Character Database Interface
export interface CharacterDB {
  id: string;
  name: string;
  avatar?: string;
  description: string;
  voice: string; // Personality/tone for AI impersonation
  relationships: string[]; // Related character IDs
}

// World Entity Interface
export interface WorldEntity {
  id: string;
  name: string;
  type: 'location' | 'object' | 'concept' | 'organization';
  icon?: string;
  description: string;
}

// Timeline Event Interface  
export interface TimelineEvent {
  id: string;
  date: string;
  time?: string;
  beatNumber?: number;
  description: string;
}

// Custom Node Props for Tiptap Integration
export interface CustomNodeViewProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  editor: any;
}

// Available slash menu commands
export type SlashCommand = 
  | 'scene-beat'
  | 'note-section' 
  | 'character-impersonation';

export interface SlashMenuOption {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  command: SlashCommand;
  action: () => void;
}
