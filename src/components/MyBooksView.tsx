
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import BookCard from './BookCard';
import FeaturedBook from './FeaturedBook';
import Modal from './Modal';
import { useBookContext } from '../contexts/BookContext';
import { useAuthStore } from '../auth/useAuthStore';

interface MyBooksViewProps {
    books: Book[];
}

const MyBooksView: React.FC<MyBooksViewProps> = ({ books }) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { createSampleData, syncAllBooks, getDirtyBooks, getConflictedBooks, loading } = useBookContext();
  const { isAuthenticated, user, isOnline } = useAuthStore();
  const featuredBook = books.find(b => b.featured);
  const otherBooks = books.filter(b => !b.featured);

  // Sync status summary
  const dirtyBooks = getDirtyBooks();
  const conflictedBooks = getConflictedBooks();

  const handleCreateSampleData = async () => {
    try {
      await createSampleData();
    } catch (error) {
      console.error('Failed to create sample data:', error);
    }
  };

  const handleSyncAll = async () => {
    try {
      await syncAllBooks();
    } catch (error) {
      console.error('Failed to sync all books:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Authentication Status Banner */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">
                Authentication Required
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                You need to be authenticated to sync books to the cloud. Books will be saved locally only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {isAuthenticated && !isOnline && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-orange-800 dark:text-orange-200">
                Offline Mode
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Working offline. Changes will sync when connection is restored.
                {user && ` Authenticated as ${user.name}.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Show sample data button if no books */}
      {books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No books found. Create some sample data to get started.</p>
          <button
            onClick={handleCreateSampleData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Create Sample Data
          </button>
        </div>
      )}

      {/* Sync Status Indicator - Single consolidated version */}
      {(dirtyBooks.length > 0 || conflictedBooks.length > 0) && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {dirtyBooks.length > 0 && `${dirtyBooks.length} book(s) need syncing`}
                  {conflictedBooks.length > 0 && ` • ${conflictedBooks.length} conflict(s) need resolution`}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Books will auto-sync when you're back online and authenticated
                </p>
              </div>
            </div>
            {dirtyBooks.length > 0 && navigator.onLine && isAuthenticated && (
              <button
                onClick={handleSyncAll}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync All
              </button>
            )}
          </div>
        </div>
      )}
      
      {featuredBook && <FeaturedBook book={featuredBook} onSelect={() => setSelectedBook(featuredBook)} />}
      
      {/* Loading Spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin border-t-purple-600 dark:border-t-purple-400"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent rounded-full animate-ping border-t-purple-600/50 dark:border-t-purple-400/50"></div>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 animate-pulse">
            Loading books from local storage...
          </p>
        </div>
      )}
      
      {!loading && (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-start"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          animate="show"
        >
          {otherBooks.map((book) => (
              <BookCard 
                  key={book.id} 
                  book={book} 
                  onSelect={() => setSelectedBook(book)} 
              />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedBook && (
            <Modal 
                book={selectedBook} 
                onClose={() => setSelectedBook(null)} 
            />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyBooksView;