import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EncryptedSceneEditor from '../EncryptedSceneEditor';

interface SceneEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneId?: string;
  bookId: string;
  versionId: string;
  chapterId: string;
  sceneName?: string;
}

export const SceneEditModal: React.FC<SceneEditModalProps> = ({
  isOpen,
  onClose,
  sceneId,
  bookId,
  versionId,
  chapterId,
  sceneName = 'Untitled Scene'
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleContentChange = (_content: string) => {
    setHasUnsavedChanges(true);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close this scene?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {sceneName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    📖 Encrypted Scene Editor
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {hasUnsavedChanges && (
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      ● Unsaved changes
                    </span>
                  )}
                  
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Editor Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <EncryptedSceneEditor
                  sceneId={sceneId}
                  bookId={bookId}
                  versionId={versionId}
                  chapterId={chapterId}
                  onContentChange={handleContentChange}
                  autoSave={true}
                  autoSaveDelay={3000}
                  className="h-[500px]"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  🔐 Content is automatically encrypted and stored securely
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SceneEditModal;
