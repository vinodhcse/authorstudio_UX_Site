import { Node } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    simpleNode: {
      setSimpleNode: (options?: { text?: string }) => ReturnType;
    };
  }
}

export const SimpleExtension = Node.create({
  name: 'simpleNode',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      text: {
        default: 'Simple Node',
        parseHTML: element => element.getAttribute('data-text') || 'Simple Node',
        renderHTML: attributes => ({
          'data-text': attributes.text,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-simple-node]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'div', 
      { 
        'data-simple-node': '',
        style: 'background: #f0f9ff; border: 2px solid #0ea5e9; padding: 1rem; margin: 1rem 0; border-radius: 0.5rem;',
        ...HTMLAttributes 
      },
      [
        'div',
        { style: 'font-weight: bold; color: #0ea5e9; margin-bottom: 0.5rem;' },
        '🔗 Simple Test Node'
      ],
      [
        'div',
        { style: 'color: #374151;' },
        node.attrs.text
      ]
    ];
  },

  addCommands() {
    return {
      setSimpleNode: (options = {}) => ({ commands }) => {
        console.log('SimpleNode command called with options:', options);
        return commands.insertContent({
          type: this.name,
          attrs: {
            text: options.text || 'This is a simple test node that works!',
          },
        });
      },
    };
  },
});
