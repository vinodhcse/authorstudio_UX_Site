import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CharacterImpersonationNode from '../components/custom-nodes/CharacterImpersonationNode';
import { v4 as uuidv4 } from 'uuid';

export interface CharacterImpersonationOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    characterImpersonation: {
      setCharacterImpersonation: (options?: {
        activeCharacter?: string;
        availableCharacters?: string[];
      }) => ReturnType;
    };
  }
}

export const CharacterImpersonationExtension = Node.create<CharacterImpersonationOptions>({
  name: 'characterImpersonation',

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
      activeCharacter: {
        default: 'Nemar',
        parseHTML: element => element.getAttribute('data-active-character'),
        renderHTML: attributes => {
          return {
            'data-active-character': attributes.activeCharacter,
          };
        },
      },
      conversation: {
        default: [],
        parseHTML: element => {
          const conversation = element.getAttribute('data-conversation');
          return conversation ? JSON.parse(conversation) : [];
        },
        renderHTML: attributes => {
          return {
            'data-conversation': JSON.stringify(attributes.conversation),
          };
        },
      },
      availableCharacters: {
        default: ['Nemar', 'Attican', 'Elissa', 'Ferris', 'Garius'],
        parseHTML: element => {
          const chars = element.getAttribute('data-available-characters');
          return chars ? JSON.parse(chars) : ['Nemar', 'Attican', 'Elissa', 'Ferris', 'Garius'];
        },
        renderHTML: attributes => {
          return {
            'data-available-characters': JSON.stringify(attributes.availableCharacters),
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
        tag: 'div[data-type="character-impersonation"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'character-impersonation' }, this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CharacterImpersonationNode);
  },

  addCommands() {
    return {
      setCharacterImpersonation: (options = {}) => ({ commands }) => {
        console.log('CharacterImpersonation command called with options:', options);
        const id = uuidv4();
        const attrs = {
          id,
          activeCharacter: options.activeCharacter || 'Nemar',
          conversation: [],
          availableCharacters: options.availableCharacters || ['Nemar', 'Attican', 'Elissa', 'Ferris', 'Garius'],
          isExpanded: true, // Start expanded for new sessions
        };
        console.log('Inserting CharacterImpersonation with attrs:', attrs);
        return commands.insertContent({
          type: this.name,
          attrs,
        });
      },
    };
  },
});
