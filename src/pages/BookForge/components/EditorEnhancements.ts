import { SceneBeatExtension } from '../../../extensions/SceneBeatExtension';
import { NoteSectionExtension } from '../../../extensions/NoteSectionExtension';
import { CharacterImpersonationExtension } from '../../../extensions/CharacterImpersonationExtension';
import { StickyNoteIcon, TheaterIcon, SparklesIcon, PenIcon, PlusIcon } from '../../../constants';

// Updated floating menu options for the enhanced editor
export const getEnhancedFloatingMenuOptions = (editor: any) => [
  { 
    name: 'Continue writing', 
    icon: PenIcon, 
    action: () => {
      // Remove the "/" and add a line break to continue writing
      editor.chain().focus().deleteRange({ 
        from: editor.state.selection.from - 1, 
        to: editor.state.selection.from 
      }).insertContent('<p></p>').run();
    },
    description: 'Continue with regular text'
  },
  { 
    name: '🔗 Scene Beat', 
    icon: SparklesIcon, 
    action: () => {
      // Remove the "/" and insert a scene beat node
      editor.chain().focus().deleteRange({ 
        from: editor.state.selection.from - 1, 
        to: editor.state.selection.from 
      }).setSceneBeat({
        chapterName: 'Chapter 1',
        sceneBeatIndex: 1,
        summary: '',
        goal: '',
        characters: [],
        worldEntities: [],
        status: 'Draft'
      }).run();
    },
    description: 'Add a scene beat section with React Flow integration'
  },
  { 
    name: '🗒️ Note Section', 
    icon: StickyNoteIcon, 
    action: () => {
      // Remove the "/" and insert a note section
      editor.chain().focus().deleteRange({ 
        from: editor.state.selection.from - 1, 
        to: editor.state.selection.from 
      }).setNoteSection({
        content: '',
        labels: []
      }).run();
    },
    description: 'Add a persistent note/reminder section'
  },
  { 
    name: '🎭 Character Impersonation', 
    icon: TheaterIcon, 
    action: () => {
      // Remove the "/" and insert a character impersonation section
      editor.chain().focus().deleteRange({ 
        from: editor.state.selection.from - 1, 
        to: editor.state.selection.from 
      }).setCharacterImpersonation({
        activeCharacter: 'Nemar',
        availableCharacters: ['Nemar', 'Attican', 'Elissa', 'Ferris', 'Garius']
      }).run();
    },
    description: 'Start an AI-powered character roleplay session'
  },
  { 
    name: 'Add section', 
    icon: PlusIcon, 
    action: () => {
      // Remove the "/" and insert a new section
      editor.chain().focus().deleteRange({ 
        from: editor.state.selection.from - 1, 
        to: editor.state.selection.from 
      }).insertContent('<h2>New Section</h2><p></p>').run();
    },
    description: 'Add a new section to your manuscript'
  },
  { 
    name: 'Add note section', 
    icon: StickyNoteIcon, 
    action: () => {
      // Remove the "/" and insert a note section
      editor.chain().focus().deleteRange({ 
        from: editor.state.selection.from - 1, 
        to: editor.state.selection.from 
      }).insertContent('<blockquote><strong>Note:</strong> </blockquote><p></p>').run();
    },
    description: 'Add a note or annotation section (legacy)'
  }
];

// Enhanced extensions array
export const getEnhancedExtensions = () => [
  SceneBeatExtension,
  NoteSectionExtension,
  CharacterImpersonationExtension,
];

// React Flow integration helper
export class ReactFlowIntegration {
  private static instance: ReactFlowIntegration;
  private nodes: any[] = [];
  private edges: any[] = [];
  private callbacks: ((nodes: any[], edges: any[]) => void)[] = [];

  static getInstance(): ReactFlowIntegration {
    if (!ReactFlowIntegration.instance) {
      ReactFlowIntegration.instance = new ReactFlowIntegration();
    }
    return ReactFlowIntegration.instance;
  }

  addNode(node: any) {
    this.nodes = [...this.nodes, node];
    this.notifyCallbacks();
  }

  updateNodeData(nodeId: string, data: any) {
    this.nodes = this.nodes.map(node => 
      node.id === nodeId ? { ...node, data } : node
    );
    this.notifyCallbacks();
  }

  removeNode(nodeId: string) {
    this.nodes = this.nodes.filter(node => node.id !== nodeId);
    this.notifyCallbacks();
  }

  getNodes() {
    return this.nodes;
  }

  getEdges() {
    return this.edges;
  }

  subscribe(callback: (nodes: any[], edges: any[]) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.nodes, this.edges));
  }
}

// Save/Load functionality for custom nodes
export class CustomNodeStorage {
  private static STORAGE_KEY = 'tiptap-custom-nodes';

  static saveNodeData(nodeId: string, data: any) {
    const stored = this.getAllStoredData();
    stored[nodeId] = {
      ...data,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
  }

  static loadNodeData(nodeId: string) {
    const stored = this.getAllStoredData();
    return stored[nodeId] || null;
  }

  static getAllStoredData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading custom node data:', error);
      return {};
    }
  }

  static clearNodeData(nodeId: string) {
    const stored = this.getAllStoredData();
    delete stored[nodeId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
  }

  static exportAllData() {
    return this.getAllStoredData();
  }

  static importData(data: any) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}
