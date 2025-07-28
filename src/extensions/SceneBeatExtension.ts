import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import SceneBeatNode from '../components/custom-nodes/SceneBeatNode';
import { v4 as uuidv4 } from 'uuid';

export interface SceneBeatOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sceneBeat: {
      setSceneBeat: (options?: {
        chapterName?: string;
        sceneBeatIndex?: number;
        summary?: string;
        goal?: string;
        characters?: string[];
        worldEntities?: string[];
        timelineEvent?: string;
        status?: 'Draft' | 'Edited' | 'Finalized';
      }) => ReturnType;
    };
  }
}

export const SceneBeatExtension = Node.create<SceneBeatOptions>({
  name: 'sceneBeat',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      selectable: false,
      draggable: false,
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-id': attributes.id,
          };
        },
      },
      chapterName: {
        default: 'Chapter 1',
        parseHTML: element => element.getAttribute('data-chapter-name'),
        renderHTML: attributes => {
          return {
            'data-chapter-name': attributes.chapterName,
          };
        },
      },
      sceneBeatIndex: {
        default: 1,
        parseHTML: element => parseInt(element.getAttribute('data-scene-beat-index') || '1'),
        renderHTML: attributes => {
          return {
            'data-scene-beat-index': attributes.sceneBeatIndex,
          };
        },
      },
      summary: {
        default: '',
        parseHTML: element => element.getAttribute('data-summary'),
        renderHTML: attributes => {
          return {
            'data-summary': attributes.summary,
          };
        },
      },
      goal: {
        default: '',
        parseHTML: element => element.getAttribute('data-goal'),
        renderHTML: attributes => {
          return {
            'data-goal': attributes.goal,
          };
        },
      },
      characters: {
        default: [],
        parseHTML: element => {
          const chars = element.getAttribute('data-characters');
          return chars ? JSON.parse(chars) : [];
        },
        renderHTML: attributes => {
          return {
            'data-characters': JSON.stringify(attributes.characters),
          };
        },
      },
      worldEntities: {
        default: [],
        parseHTML: element => {
          const entities = element.getAttribute('data-world-entities');
          return entities ? JSON.parse(entities) : [];
        },
        renderHTML: attributes => {
          return {
            'data-world-entities': JSON.stringify(attributes.worldEntities),
          };
        },
      },
      timelineEvent: {
        default: '',
        parseHTML: element => element.getAttribute('data-timeline-event'),
        renderHTML: attributes => {
          return {
            'data-timeline-event': attributes.timelineEvent,
          };
        },
      },
      status: {
        default: 'Draft',
        parseHTML: element => element.getAttribute('data-status') as 'Draft' | 'Edited' | 'Finalized',
        renderHTML: attributes => {
          return {
            'data-status': attributes.status,
          };
        },
      },
      isExpanded: {
        default: false,
        parseHTML: element => element.getAttribute('data-expanded') === 'true',
        renderHTML: attributes => {
          return {
            'data-expanded': attributes.isExpanded ? 'true' : 'false',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="scene-beat"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'scene-beat' }, this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SceneBeatNode);
  },

  addCommands() {
    return {
      setSceneBeat: (options = {}) => ({ commands }) => {
        console.log('SceneBeat command called with options:', options);
        const id = uuidv4();
        const attrs = {
          id,
          chapterName: options.chapterName || 'Chapter 1',
          sceneBeatIndex: options.sceneBeatIndex || 1,
          summary: options.summary || '',
          goal: options.goal || '',
          characters: options.characters || [],
          worldEntities: options.worldEntities || [],
          timelineEvent: options.timelineEvent || '',
          status: options.status || 'Draft',
          isExpanded: false,
          selectanle: false,
          draggable: false,
        };
        console.log('Inserting SceneBeat with attrs:', attrs);
        return commands.insertContent({
          type: this.name,
          attrs,
        });
      },
    };
  },
});
