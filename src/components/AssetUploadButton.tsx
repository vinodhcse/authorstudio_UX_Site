// AssetUploadButton - Reusable component for asset upload functionality
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AssetService } from '../services/AssetService';
import { SyncEngine } from '../services/SyncEngine';
import { AssetRole, EntityType } from '../types';

interface AssetUploadButtonProps {
  entityType: EntityType;
  entityId: string;
  bookId: string;
  role: AssetRole;
  currentAssetId?: string;
  onAssetChanged?: (assetId: string | null) => void;
  onAssetUploaded?: (assetId: string, assetUrl: string) => void;
  className?: string;
  children?: React.ReactNode;
  showProgress?: boolean;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

const AssetUploadButton: React.FC<AssetUploadButtonProps> = ({
  entityType,
  entityId,
  bookId,
  role,
  currentAssetId,
  onAssetChanged,
  onAssetUploaded,
  className = '',
  children,
  showProgress = true,
  acceptedTypes = ['image/*'],
  maxSizeMB = 25
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [reuseNotification, setReuseNotification] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size (${fileSizeMB.toFixed(1)}MB) exceeds limit of ${maxSizeMB}MB`);
      return;
    }

    // Validate file type if acceptedTypes is restrictive
    if (!acceptedTypes.includes('*/*') && !acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    })) {
      setError('File type not supported');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress('Importing file...');

      // Import the file as an asset
      const importResult = await AssetService.importLocalFile(file, {
        entityType,
        entityId,
        role,
        bookId,
        tags: [role, entityType],
        description: `${role} for ${entityType} ${entityId}`
      });

      // Show notification if asset was reused
      if (importResult.wasReused) {
        setReuseNotification(
          `This file was already uploaded. Using existing copy. ${
            importResult.uploadStatus === 'pending_upload' ? 'Will sync to cloud.' : 
            importResult.uploadStatus === 'failed' ? 'Previous upload failed, will retry.' :
            importResult.uploadStatus === 'uploaded' ? 'Already synced to cloud.' : ''
          }`
        );
        // Clear notification after 5 seconds
        setTimeout(() => setReuseNotification(null), 5000);
      }

      setUploadProgress('Syncing to cloud...');

      // Trigger upload to server
      try {
        await SyncEngine.uploadPending(bookId);
        
        // Get updated asset info after potential upload
        const updatedRef = await AssetService.getFileRef(importResult.assetId);
        const assetUrl = await AssetService.getLocalImageDataUrl(updatedRef || importResult);
        
        if (assetUrl) {
          onAssetUploaded?.(importResult.assetId, assetUrl);
        }
      } catch (syncError) {
        console.warn('Upload to server failed, asset saved locally:', syncError);
        // Still resolve the local asset URL
        const assetUrl = await AssetService.getLocalImageDataUrl(importResult);
        if (assetUrl) {
          onAssetUploaded?.(importResult.assetId, assetUrl);
        }
      }

      onAssetChanged?.(importResult.assetId);
      setUploadProgress('');

    } catch (err) {
      console.error('Failed to upload asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload asset');
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveAsset = async () => {
    if (!currentAssetId) return;

    try {
      setIsUploading(true);
      setError(null);

      await AssetService.unlinkAsset(currentAssetId, entityType, entityId, role);
      onAssetChanged?.(null);

    } catch (err) {
      console.error('Failed to remove asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove asset');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`asset-upload-button ${className}`}>
      <input
        id={`asset-upload-${entityType}-${entityId}-${role}`}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      {error && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {reuseNotification && (
        <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-600 dark:text-blue-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>{reuseNotification}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {children ? (
          <label
            htmlFor={`asset-upload-${entityType}-${entityId}-${role}`}
            className="cursor-pointer"
          >
            {children}
          </label>
        ) : (
          <label
            htmlFor={`asset-upload-${entityType}-${entityId}-${role}`}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg cursor-pointer transition-colors"
          >
            <UploadIcon className="w-4 h-4" />
            Upload {role}
          </label>
        )}

        {currentAssetId && (
          <button
            onClick={handleRemoveAsset}
            disabled={isUploading}
            className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors"
            title="Remove asset"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {showProgress && isUploading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-2"
        >
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {uploadProgress || 'Processing...'}
          </span>
        </motion.div>
      )}
    </div>
  );
};

// Icons
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default AssetUploadButton;
