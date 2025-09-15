// Asset Image Node Component - renders images from the asset system
import React, { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { AssetService } from '../services/AssetService';
import { FileRef } from '../types';

interface AssetImageNodeProps {
  node: ProseMirrorNode;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  editor: any;
  selected: boolean;
}

const AssetImageNode: React.FC<AssetImageNodeProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode, 
  selected 
}) => {
  const [fileRef, setFileRef] = useState<FileRef | null>(null);
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAsset = async () => {
      if (!node.attrs.assetId) {
        setError('No asset ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the asset reference
        const ref = await AssetService.getFileRef(node.attrs.assetId);
        if (!ref) {
          setError('Asset not found');
          setLoading(false);
          return;
        }

        setFileRef(ref);

        // Resolve the source URL with offline support
        const src = await AssetService.getLocalImageDataUrl(ref);
        setImageSrc(src);

        // Update node attributes with asset metadata if not already set
        if (!node.attrs.width && ref.width) {
          updateAttributes({ width: ref.width });
        }
        if (!node.attrs.height && ref.height) {
          updateAttributes({ height: ref.height });
        }

      } catch (err) {
        console.error('Failed to load asset:', err);
        setError(err instanceof Error ? err.message : 'Failed to load asset');
      } finally {
        setLoading(false);
      }
    };

    loadAsset();
  }, [node.attrs.assetId, updateAttributes]);

  const handleImageError = () => {
    setError('Failed to load image');
  };

  const handleImageLoad = () => {
    setError(null);
  };

  if (loading) {
    return (
      <NodeViewWrapper className="asset-image-node">
        <div className={`asset-image-loading ${selected ? 'selected' : ''}`}>
          <div className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading image...</span>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  if (error || !imageSrc) {
    return (
      <NodeViewWrapper className="asset-image-node">
        <div className={`asset-image-error ${selected ? 'selected' : ''}`}>
          <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-dashed border-red-300 dark:border-red-600">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">
                {error || 'Image not available'}
              </p>
              <button
                onClick={deleteNode}
                className="mt-2 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="asset-image-node">
      <div className={`asset-image-wrapper ${selected ? 'selected' : ''}`}>
        <img
          src={imageSrc}
          alt={node.attrs.alt || 'Image'}
          title={node.attrs.title}
          width={node.attrs.width}
          height={node.attrs.height}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="max-w-full h-auto rounded-lg shadow-sm"
          style={{
            ...(node.attrs.width && { width: `${node.attrs.width}px` }),
            ...(node.attrs.height && { height: `${node.attrs.height}px` }),
          }}
        />
        
        {selected && (
          <div className="absolute top-2 right-2 flex space-x-1">
            <button
              onClick={() => {
                const newAlt = prompt('Enter alt text:', node.attrs.alt || '');
                if (newAlt !== null) {
                  updateAttributes({ alt: newAlt });
                }
              }}
              className="px-2 py-1 text-xs bg-black bg-opacity-70 text-white rounded hover:bg-opacity-90"
              title="Edit alt text"
            >
              Alt
            </button>
            <button
              onClick={deleteNode}
              className="px-2 py-1 text-xs bg-red-600 bg-opacity-70 text-white rounded hover:bg-opacity-90"
              title="Delete image"
            >
              ×
            </button>
          </div>
        )}

        {fileRef && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Asset: {fileRef.assetId.slice(0, 8)}...</span>
            {fileRef.mime && <span className="ml-2">{fileRef.mime}</span>}
            {fileRef.width && fileRef.height && (
              <span className="ml-2">{fileRef.width}×{fileRef.height}</span>
            )}
          </div>
        )}
      </div>


    </NodeViewWrapper>
  );
};

export default AssetImageNode;
