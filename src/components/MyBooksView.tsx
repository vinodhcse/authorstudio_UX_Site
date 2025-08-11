
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import BookCard from './BookCard';
import FeaturedBook from './FeaturedBook';
import Modal from './Modal';
import { useBookContext } from '../contexts/BookContext';

interface MyBooksViewProps {
    books: Book[];
}

const MyBooksView: React.FC<MyBooksViewProps> = ({ books }) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { createSampleData } = useBookContext();
  const featuredBook = books.find(b => b.featured);
  const otherBooks = books.filter(b => !b.featured);

  const handleCreateSampleData = async () => {
    try {
      await createSampleData();
    } catch (error) {
      console.error('Failed to create sample data:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
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
      
      {featuredBook && <FeaturedBook book={featuredBook} onSelect={() => setSelectedBook(featuredBook)} />}
      
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