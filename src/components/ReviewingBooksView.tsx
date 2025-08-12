import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import BookCard from './BookCard';
import Modal from './Modal';
import { useBookContext } from '../contexts/BookContext';
import { useAuthStore } from '../auth/useAuthStore';
import { appLog } from '../auth/fileLogger';

interface ReviewingBooksViewProps {
  books?: Book[]; // Optional prop for backward compatibility
}

const ReviewingBooksView: React.FC<ReviewingBooksViewProps> = ({ books: propBooks }) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { reviewableBooks, loading, error } = useBookContext();
  const { isAuthenticated, user } = useAuthStore();

  // Use provided books or get from context
  const books = propBooks || reviewableBooks;

  React.useEffect(() => {
    appLog.debug('reviewing-books-view', 'Rendering reviewing books view', {
      bookCount: books.length,
      isAuthenticated,
      hasUser: !!user
    });
  }, [books.length, isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Please sign in to view books you can review
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in to see books where you have reviewing permissions.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviewable books...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Books</h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Books Available for Review
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have any books where you can provide reviews. When book authors share books with you 
          for review, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Books I Can Review ({books.length})
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Books where you have reviewing permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <BookCard 
            key={book.id} 
            book={book}
            onSelect={() => setSelectedBook(book)}
          />
        ))}
      </div>

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

export default ReviewingBooksView;
