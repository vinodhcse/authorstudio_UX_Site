
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import BookCard from './BookCard';
import FeaturedBook from './FeaturedBook';
import Modal from './Modal';

interface MyBooksViewProps {
    books: Book[];
}

const MyBooksView: React.FC<MyBooksViewProps> = ({ books }) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const featuredBook = books.find(b => b.featured);
  const otherBooks = books.filter(b => !b.featured);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
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