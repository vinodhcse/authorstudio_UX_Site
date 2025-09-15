// Asset Image Extension for TipTap - uses asset system instead of direct image URLs
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import AssetImageNode from '../components/AssetImageNode.tsx';

export interface AssetImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    assetImage: {
      /**
       * Add an asset image
       */
      setAssetImage: (options: { assetId: string; alt?: string; title?: string; width?: number; height?: number }) => ReturnType;
    };
  }
}

export const AssetImageExtension = Node.create<AssetImageOptions>({
  name: 'assetImage',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      assetId: {
        default: null,
        parseHTML: element => element.getAttribute('data-asset-id'),
        renderHTML: attributes => ({
          'data-asset-id': attributes.assetId,
        }),
      },
      alt: {
        default: null,
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => ({
          alt: attributes.alt,
        }),
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => ({
          title: attributes.title,
        }),
      },
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('width');
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
      height: {
        default: null,
        parseHTML: element => {
          const height = element.getAttribute('height');
          return height ? parseInt(height, 10) : null;
        },
        renderHTML: attributes => ({
          height: attributes.height,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-asset-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AssetImageNode);
  },

  addCommands() {
    return {
      setAssetImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },

  addPasteRules() {
    // TODO: Add paste rules for file handling
    return [];
  },
});
