// AssetImageCard - Reusable card component for entities with image upload functionality
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AssetUploadButton from './AssetUploadButton';
import { AssetService } from '../services/AssetService';
import { AssetRole, EntityType } from '../types';

interface AssetImageCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  assetId?: string;
  entityType: EntityType;
  role: AssetRole;
  bookId: string;
  badges?: { label: string; color: string }[];
  metadata?: { label: string; value: string }[];
  onClick?: () => void;
  onImageUpdated?: (assetId: string | null, imageUrl?: string) => void;
  className?: string;
}

const AssetImageCard: React.FC<AssetImageCardProps> = ({
  id,
  name,
  description,
  imageUrl,
  assetId,
  entityType,
  role,
  bookId,
  badges = [],
  metadata = [],
  onClick,
  onImageUpdated,
  className = ''
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    // Load image from asset if assetId is provided but no imageUrl
    const loadImageFromAsset = async () => {
      if (assetId && !imageUrl) {
        setIsLoadingImage(true);
        try {
          const fileRef = await AssetService.getFileRef(assetId);
          if (fileRef) {
            const url = await AssetService.getLocalImageDataUrl(fileRef);
            setCurrentImageUrl(url);
          }
        } catch (error) {
          console.error('Failed to load image from asset:', error);
        } finally {
          setIsLoadingImage(false);
        }
      }
    };

    loadImageFromAsset();
  }, [assetId, imageUrl]);

  const handleImageUpload = (newAssetId: string, newImageUrl: string) => {
    setCurrentImageUrl(newImageUrl);
    onImageUpdated?.(newAssetId, newImageUrl);
    setShowUpload(false);
  };

  const handleRemoveImage = async () => {
    try {
      if (assetId) {
        await AssetService.unlinkAsset(assetId, entityType, id, role);
      }
      setCurrentImageUrl(undefined);
      onImageUpdated?.(null);
    } catch (error) {
      console.error('Failed to remove image:', error);
    }
  };

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden group cursor-pointer relative ${className}`}
      whileHover={{ scale: 1.02 }}
      layout
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {isLoadingImage ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : currentImageUrl ? (
          <img 
            src={currentImageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No image</p>
            </div>
          </div>
        )}

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUpload(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {currentImageUrl ? 'Change' : 'Upload'}
            </button>
            {currentImageUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4" onClick={onClick}>
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
            {name}
          </h4>
          {badges.length > 0 && (
            <div className="flex gap-1 ml-2">
              {badges.map((badge, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs rounded-full ${badge.color}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            {metadata.map((item, index) => (
              <div key={index}>
                <span className="font-medium">{item.label}:</span> {item.value}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload {role} image
              </h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <AssetUploadButton
              entityType={entityType}
              entityId={id}
              bookId={bookId}
              role={role}
              currentAssetId={assetId}
              onAssetUploaded={handleImageUpload}
              acceptedTypes={['image/*']}
              className="w-full"
            >
              <div className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  PNG, JPG, WebP up to 25MB
                </p>
              </div>
            </AssetUploadButton>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AssetImageCard;
