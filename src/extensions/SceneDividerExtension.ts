import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { v4 as uuidv4 } from 'uuid';
import SceneDividerNode from '../components/custom-nodes/SceneDividerNode';

export interface SceneDividerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sceneDivider: {
      setSceneDivider: () => ReturnType;
    };
  }
}

export const SceneDividerExtension = Node.create<SceneDividerOptions>({
  name: 'sceneDivider',

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
          if (!attributes.id) return {};
          return { 'data-id': attributes.id };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="scene-divider"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'scene-divider' }, this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SceneDividerNode);
  },

  addCommands() {
    return {
      setSceneDivider: () => ({ commands }) => {
        const id = uuidv4();
        return commands.insertContent({ type: this.name, attrs: { id } });
      },
    };
  },
});
