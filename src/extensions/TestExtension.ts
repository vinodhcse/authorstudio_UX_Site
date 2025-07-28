import { Node } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    testNode: {
      setTestNode: (options?: { text?: string }) => ReturnType;
    };
  }
}

export const TestExtension = Node.create({
  name: 'testNode',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      text: {
        default: 'Hello World',
        parseHTML: element => element.getAttribute('data-text'),
        renderHTML: attributes => ({
          'data-text': attributes.text,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-test-node]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['div', { 'data-test-node': '', ...HTMLAttributes }, node.attrs.text];
  },

  addCommands() {
    return {
      setTestNode: (options = {}) => ({ commands }) => {
        console.log('TestNode command called');
        return commands.insertContent({
          type: this.name,
          attrs: {
            text: options.text || 'Test Node Inserted!',
          },
        });
      },
    };
  },
});
