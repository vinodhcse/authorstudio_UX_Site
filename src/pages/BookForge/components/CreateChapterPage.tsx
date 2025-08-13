import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CreateChapterPageProps {
  onCreateChapter: (title: string) => Promise<void>;
  isCreating: boolean;
  theme?: 'light' | 'dark' | 'system';
}

const CreateChapterPage: React.FC<CreateChapterPageProps> = ({
  onCreateChapter,
  isCreating,
  theme = 'system'
}) => {
  const [chapterTitle, setChapterTitle] = useState('');
  const [showCustomTitle, setShowCustomTitle] = useState(false);

  const predefinedTitles = [
    'Chapter 1',
    'Prologue',
    'Introduction',
    'The Beginning',
    'Opening'
  ];

  const handleCreateChapter = async (title: string) => {
    if (title.trim()) {
      await onCreateChapter(title.trim());
    }
  };

  const handleCustomTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateChapter(chapterTitle);
  };

  return (
    <div className="flex-grow w-full flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl"
      >
        {/* Icon */}
        <div className="mb-8">
          <svg 
            className="mx-auto h-24 w-24 text-purple-400 dark:text-purple-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Start Your Story
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          This book version doesn't have any chapters yet. Create your first chapter to begin writing your masterpiece.
        </p>

        {/* Quick Create Options */}
        {!showCustomTitle ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Quick start with a predefined title:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {predefinedTitles.map((title) => (
                <motion.button
                  key={title}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCreateChapter(title)}
                  disabled={isCreating}
                  className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {title}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Custom Title Option */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                onClick={() => setShowCustomTitle(true)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm transition-colors"
              >
                Or create with a custom title →
              </button>
            </div>
          </div>
        ) : (
          /* Custom Title Form */
          <form onSubmit={handleCustomTitleSubmit} className="space-y-6">
            <div>
              <label htmlFor="chapterTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chapter Title
              </label>
              <input
                type="text"
                id="chapterTitle"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="Enter your chapter title..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
                maxLength={100}
              />
            </div>

            <div className="flex gap-3 justify-center">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!chapterTitle.trim() || isCreating}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Chapter'
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  setShowCustomTitle(false);
                  setChapterTitle('');
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                What happens when you create a chapter?
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                We'll automatically create a complete story structure: Outline → Act 1 → Your Chapter → Scene 1, 
                giving you a solid foundation to build upon.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateChapterPage;
