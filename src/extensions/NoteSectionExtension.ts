import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import NoteSectionNode from '../components/custom-nodes/NoteSectionNode';
import { v4 as uuidv4 } from 'uuid';

export interface NoteSectionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteSection: {
      setNoteSection: (options?: {
        content?: string;
        labels?: string[];
      }) => ReturnType;
    };
  }
}

export const NoteSectionExtension = Node.create<NoteSectionOptions>({
  name: 'noteSection',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
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
      content: {
        default: '',
        parseHTML: element => element.getAttribute('data-content'),
        renderHTML: attributes => {
          return {
            'data-content': attributes.content,
          };
        },
      },
      labels: {
        default: [],
        parseHTML: element => {
          const labels = element.getAttribute('data-labels');
          return labels ? JSON.parse(labels) : [];
        },
        renderHTML: attributes => {
          return {
            'data-labels': JSON.stringify(attributes.labels),
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
      createdAt: {
        default: null,
        parseHTML: element => element.getAttribute('data-created-at'),
        renderHTML: attributes => {
          return {
            'data-created-at': attributes.createdAt,
          };
        },
      },
      updatedAt: {
        default: null,
        parseHTML: element => element.getAttribute('data-updated-at'),
        renderHTML: attributes => {
          return {
            'data-updated-at': attributes.updatedAt,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="note-section"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'note-section' }, this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteSectionNode);
  },

  addCommands() {
    return {
      setNoteSection: (options = {}) => ({ commands }) => {
        console.log('NoteSection command called with options:', options);
        const id = uuidv4();
        const now = new Date().toISOString();
        const attrs = {
          id,
          content: options.content || '',
          labels: options.labels || [],
          isExpanded: true, // Start expanded for new notes
          createdAt: now,
          updatedAt: now,
        };
        console.log('Inserting NoteSection with attrs:', attrs);
        return commands.insertContent({
          type: this.name,
          attrs,
        });
      },
    };
  },
});
