import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface ToolWindow {
  id: string;
  tool_name: string;
  book_id: string;
  version_id: string;
  docked: boolean;
  visible: boolean;
  last_position: WindowPosition;
  last_size: WindowSize;
  window_label: string;
  icon_path?: string;
  title: string;
}

interface ToolWindowState {
  toolWindows: ToolWindow[];
  dockVisible: boolean;
  currentBookId: string | null;
  currentVersionId: string | null;
  eventsSetup: boolean;
  
  // Actions
  setCurrentContext: (bookId: string, versionId: string) => void;
  clearContext: () => void;
  addToolWindow: (toolWindow: ToolWindow) => void;
  removeToolWindow: (windowId: string) => void;
  updateToolWindow: (windowId: string, updates: Partial<ToolWindow>) => void;
  dockWindow: (windowId: string) => void;
  undockWindow: (windowId: string) => void;
  toggleDockVisibility: () => void;
  syncWithTauri: () => Promise<void>;
  setupEventListeners: () => Promise<void>;
  openTool: (toolName: string, bookId: string, versionId: string) => Promise<void>;
  closeTool: (windowId: string) => Promise<void>;
  closeAllTools: () => Promise<void>;
  getToolWindows: (bookId?: string, versionId?: string) => ToolWindow[];
}

const DEFAULT_WINDOW_SIZE: WindowSize = { width: 800, height: 600 };
const DEFAULT_WINDOW_POSITION: WindowPosition = { x: 100, y: 100 };

export const useToolWindowStore = create<ToolWindowState>()(
  subscribeWithSelector((set, get) => ({
    toolWindows: [],
    dockVisible: false,
    currentBookId: null,
    currentVersionId: null,
    eventsSetup: false,

    setCurrentContext: (bookId: string, versionId: string) => {
      set({ currentBookId: bookId, currentVersionId: versionId });
      // Setup event listeners if not already done
      if (!get().eventsSetup) {
        get().setupEventListeners();
      }
      // Sync with Tauri when context changes
      get().syncWithTauri();
    },

    clearContext: () => {
      set({ 
        currentBookId: null, 
        currentVersionId: null, 
        dockVisible: false 
      });
    },

    addToolWindow: (toolWindow: ToolWindow) => {
      set((state) => ({
        toolWindows: [...state.toolWindows.filter(w => w.id !== toolWindow.id), toolWindow],
      }));
    },

    removeToolWindow: (windowId: string) => {
      set((state) => ({
        toolWindows: state.toolWindows.filter(w => w.id !== windowId),
      }));
    },

    updateToolWindow: (windowId: string, updates: Partial<ToolWindow>) => {
      set((state) => ({
        toolWindows: state.toolWindows.map(w => 
          w.id === windowId ? { ...w, ...updates } : w
        ),
      }));
    },

    dockWindow: async (windowId: string) => {
      console.log('Docking window:', windowId);
      const toolWindow = get().toolWindows.find(w => w.id === windowId);
      if (!toolWindow) return;

      try {
        await invoke('minimize_tool_window', {
          bookId: toolWindow.book_id,
          versionId: toolWindow.version_id,
          toolName: toolWindow.tool_name,
        });

        get().updateToolWindow(windowId, { docked: true, visible: false });
        set({ dockVisible: true });
      } catch (error) {
        console.error('Failed to dock window:', error);
      }
    },

    undockWindow: async (windowId: string) => {
      const toolWindow = get().toolWindows.find(w => w.id === windowId);
      if (!toolWindow) return;

      try {
        await invoke('restore_tool_window', {
          bookId: toolWindow.book_id,
          versionId: toolWindow.version_id,
          toolName: toolWindow.tool_name,
          position: toolWindow.last_position,
          size: toolWindow.last_size,
        });

        get().updateToolWindow(windowId, { docked: false, visible: true });
      } catch (error) {
        console.error('Failed to undock window:', error);
      }
    },

    toggleDockVisibility: () => {
      set((state) => ({ dockVisible: !state.dockVisible }));
    },

    syncWithTauri: async () => {
      const { currentBookId, currentVersionId } = get();
      if (!currentBookId || !currentVersionId) return;

      try {
        const tauriWindows = await invoke<ToolWindow[]>('get_tool_windows_state', {
          bookId: currentBookId,
          versionId: currentVersionId,
        });

        // Update our store with the backend state
        set({ toolWindows: tauriWindows });
        console.log('Synced tool windows from backend:', tauriWindows);
      } catch (error) {
        console.error('Failed to sync with Tauri:', error);
      }
    },

    setupEventListeners: async () => {
      if (get().eventsSetup) return;

      try {
        // Listen for tool window dock events
        await listen('tool-window-docked', (event: any) => {
          const dockedWindow = event.payload as ToolWindow;
          console.log('Received tool-window-docked event:', dockedWindow);
          
          // Check if window exists in store, if not add it, otherwise update it
          const existingWindow = get().toolWindows.find(w => w.id === dockedWindow.id);
          console.log('Existing window found:', existingWindow);
          
          if (existingWindow) {
            // Update existing window
            console.log('Updating existing window with docked=true');
            get().updateToolWindow(dockedWindow.id, { 
              docked: true, 
              visible: false 
            });
          } else {
            // Add new window to store
            console.log('Adding new window to store');
            get().addToolWindow(dockedWindow);
          }
          
          // Set dock visible and log current state
          set({ dockVisible: true });
          const currentState = get();
          console.log('Current store state after dock event:', {
            toolWindows: currentState.toolWindows,
            dockVisible: currentState.dockVisible,
            currentBookId: currentState.currentBookId,
            currentVersionId: currentState.currentVersionId
          });
        });

        // Listen for tool window undock events
        await listen('tool-window-undocked', (event: any) => {
          const undockedWindow = event.payload as ToolWindow;
          console.log('Received tool-window-undocked event:', undockedWindow);
          
          // Update the window in our store
          get().updateToolWindow(undockedWindow.id, { 
            docked: false, 
            visible: true 
          });
        });

        // Listen for tool window close events
        await listen('tool-window-closed', (event: any) => {
          const closedWindow = event.payload as ToolWindow;
          console.log('Received tool-window-closed event:', closedWindow);
          
          // Remove the window from our store
          get().removeToolWindow(closedWindow.id);
        });

        set({ eventsSetup: true });
        console.log('Tool window event listeners setup complete');
      } catch (error) {
        console.error('Failed to setup event listeners:', error);
      }
    },

    openTool: async (toolName: string, bookId: string, versionId: string) => {
      try {
        const windowId = `${bookId}-${versionId}-${toolName}`;
        
        // Check if tool is already open
        const existingWindow = get().toolWindows.find(w => w.id === windowId);
        if (existingWindow) {
          if (existingWindow.docked) {
            await get().undockWindow(windowId);
          }
          return;
        }

        const result = await invoke<ToolWindow>('open_tool_window', {
          bookId,
          versionId,
          toolName,
          position: DEFAULT_WINDOW_POSITION,
          size: DEFAULT_WINDOW_SIZE,
        });

        get().addToolWindow(result);
      } catch (error) {
        console.error('Failed to open tool:', error);
      }
    },

    closeTool: async (windowId: string) => {
      const toolWindow = get().toolWindows.find(w => w.id === windowId);
      if (!toolWindow) return;

      try {
        await invoke('close_tool_window', {
          bookId: toolWindow.book_id,
          versionId: toolWindow.version_id,
          toolName: toolWindow.tool_name,
        });

        get().removeToolWindow(windowId);
      } catch (error) {
        console.error('Failed to close tool:', error);
      }
    },

    closeAllTools: async () => {
      const { currentBookId, currentVersionId } = get();
      if (!currentBookId || !currentVersionId) return;

      try {
        await invoke('close_all_tools', {
          bookId: currentBookId,
          versionId: currentVersionId,
        });

        set({ toolWindows: [] });
      } catch (error) {
        console.error('Failed to close all tools:', error);
      }
    },

    getToolWindows: (bookId?: string, versionId?: string) => {
      const { toolWindows, currentBookId, currentVersionId } = get();
      const targetBookId = bookId || currentBookId;
      const targetVersionId = versionId || currentVersionId;

      return toolWindows.filter(w => 
        w.book_id === targetBookId && w.version_id === targetVersionId
      );
    },
  }))
);

// Available tools configuration
export const AVAILABLE_TOOLS = {
  'name-generator': {
    title: 'Name Generator',
    icon: '👤',
    route: '/tool/name-generator',
    defaultSize: { width: 600, height: 500 },
  },
  'plot-assistant': {
    title: 'Plot Assistant',
    icon: '📚',
    route: '/tool/plot-assistant',
    defaultSize: { width: 800, height: 700 },
  },
  'character-tracker': {
    title: 'Character Tracker',
    icon: '🎭',
    route: '/tool/character-tracker',
    defaultSize: { width: 700, height: 600 },
  },
  'world-builder': {
    title: 'World Builder',
    icon: '🌍',
    route: '/tool/world-builder',
    defaultSize: { width: 900, height: 650 },
  },
  'timeline': {
    title: 'Timeline',
    icon: '⏰',
    route: '/tool/timeline',
    defaultSize: { width: 1000, height: 400 },
  },
} as const;

export type ToolType = keyof typeof AVAILABLE_TOOLS;
