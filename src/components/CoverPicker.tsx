// Cover Picker Component - allows users to select and manage book covers
import React, { useState, useEffect } from 'react';
import { AssetService } from '../services/AssetService';
import { SyncEngine } from '../services/SyncEngine';
import { FileRef } from '../types';

interface CoverPickerProps {
  bookId: string;
  currentCoverId?: string;
  onCoverChanged?: (coverId: string | null) => void;
  className?: string;
}

const CoverPicker: React.FC<CoverPickerProps> = ({
  bookId,
  currentCoverId,
  onCoverChanged,
  className = ''
}) => {
  const [coverRef, setCoverRef] = useState<FileRef | null>(null);
  const [coverSrc, setCoverSrc] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const loadCurrentCover = async () => {
      if (!currentCoverId) {
        setCoverRef(null);
        setCoverSrc(undefined);
        return;
      }

      try {
        const ref = await AssetService.getFileRef(currentCoverId);
        if (ref) {
          setCoverRef(ref);
          const coverUrl = await AssetService.getLocalImageDataUrl(ref);
          setCoverSrc(coverUrl);
          // Debug: log the resolved cover source for diagnostics
          console.info('[CoverPicker] Resolved coverSrc', { assetId: ref.assetId, coverSrc: coverUrl ? coverUrl.slice(0, 120) : null });
        }
      } catch (err) {
        console.error('Failed to load current cover:', err);
        setError('Failed to load current cover');
      }
    };

    loadCurrentCover();
  }, [currentCoverId]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress('Importing file...');

      // Import the file as a cover asset
      const importResult = await AssetService.importLocalFile(file, {
        entityType: 'book',
        entityId: bookId,
        role: 'cover',
        bookId: bookId,
        tags: ['cover', 'image'],
        description: `Cover for book ${bookId}`
      });

      setUploadProgress('Uploading...');

      // First, notify about the cover change to mark book as dirty
      onCoverChanged?.(importResult.assetId);

      // Then trigger upload (which will sync when online)
      await SyncEngine.uploadPending(bookId);

      // Use the import result
      const fileRef = importResult;

      setUploadProgress('Finalizing...');

      // Get updated asset info after upload (which might include remote URL)
      const updatedFileRef = await AssetService.getFileRef(fileRef.assetId);
      const finalFileRef = updatedFileRef || fileRef;

      // Update state with the most current asset info using data URL
      setCoverRef(finalFileRef);
      const imageUrl = await AssetService.getLocalImageDataUrl(finalFileRef);
      setCoverSrc(imageUrl);

      setUploadProgress('');
    } catch (err) {
      console.error('Failed to set cover:', err);
      setError(err instanceof Error ? err.message : 'Failed to set cover');
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

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemoveCover = async () => {
    if (!currentCoverId) return;

    try {
      setIsUploading(true);
      setError(null);

      // Unlink the asset from the book
      await AssetService.unlinkAsset(currentCoverId, 'book', bookId, 'cover');

      // Update state
      setCoverRef(null);
      setCoverSrc(undefined);
      onCoverChanged?.(null);

    } catch (err) {
      console.error('Failed to remove cover:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove cover');
    } finally {
      setIsUploading(false);
    }
  };

  const renderUploadArea = () => (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center
        transition-colors duration-200 cursor-pointer
        ${isDragOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }
        ${isUploading ? 'pointer-events-none opacity-50' : ''}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('cover-file-input')?.click()}
    >
      <input
        id="cover-file-input"
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex flex-col items-center">
        <svg
          className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          Choose a cover image
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Drag and drop an image file or click to browse
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Supports JPG, PNG, GIF, WebP
        </p>
      </div>

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {uploadProgress || 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentCover = () => (
    <div className="relative group">
      <img
        src={coverSrc}
        alt="Book cover"
        className="w-full h-auto rounded-lg shadow-md max-h-96 object-cover"
      />

      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
          <button
            onClick={() => document.getElementById('cover-file-input')?.click()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
            disabled={isUploading}
          >
            Change
          </button>
          <button
            onClick={handleRemoveCover}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
            disabled={isUploading}
          >
            Remove
          </button>
        </div>
      </div>

      <input
        id="cover-file-input"
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {uploadProgress || 'Processing...'}
            </span>
          </div>
        </div>
      )}

      {coverRef && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div>Asset: {coverRef.assetId.slice(0, 8)}...</div>
          <div>{coverRef.mime} • {coverRef.width}×{coverRef.height}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`cover-picker ${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {coverSrc ? renderCurrentCover() : renderUploadArea()}
    </div>
  );
};

export default CoverPicker;
