

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import { AssetService } from '../services/AssetService';

interface FeaturedBookProps {
  book: Book;
  onSelect: () => void;
}

const FeaturedBook: React.FC<FeaturedBookProps> = ({ book, onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();

  // Load cover image from asset system
  useEffect(() => {
    const loadCoverImage = async () => {
      if (book.coverImageRef?.assetId) {
        try {
          const fileRef = await AssetService.getFileRef(book.coverImageRef.assetId);
          if (fileRef) {
            // Try to get data URL for local files
            const imageUrl = await AssetService.getLocalImageDataUrl(fileRef);
            setCoverImageUrl(imageUrl);
          }
        } catch (error) {
          console.warn('Failed to load cover image from assets:', error);
          // Fallback to book.coverImage if available
          setCoverImageUrl(book.coverImage);
        }
      } else {
        // Use legacy cover image if no asset reference
        setCoverImageUrl(book.coverImage);
      }
    };

    loadCoverImage();
  }, [book.coverImageRef?.assetId, book.coverImage]);

  useEffect(() => {
    if (!book.characters || book.characters.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % book.characters.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [book.characters]);

  if (!book.characters || book.characters.length === 0) {
    // Fallback rendering if there are no characters
    return (
       <div className="relative w-full h-[50vh] max-h-[500px] rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 dark:shadow-black/50 mb-12">
        {coverImageUrl ? (
            <img src={coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent"></div>
        <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end md:items-end text-white">
          <div className="relative md:text-right max-w-xl">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {book.lastModified}
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 text-shadow">{book.title}</h2>
            <button onClick={onSelect} className="mt-8 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-full transition-all duration-300">
                More Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCharacter = book.characters[currentIndex];

  return (
    <div className="relative w-full h-[50vh] max-h-[500px] rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 dark:shadow-black/50 mb-12">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
          animate={{ opacity: 1, clipPath: 'circle(75% at 50% 50%)' }}
          exit={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        >
          <img src={currentCharacter.image} alt={currentCharacter.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent"></div>
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end md:items-end text-white">
        <div className="relative md:text-right">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="max-w-xl"
            >
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {book.lastModified}
              </span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 text-shadow">{book.title}</h2>
              <blockquote className="border-r-4 md:border-r-0 md:border-l-4 border-purple-400 pr-4 md:pr-0 md:pl-4">
                <p className="text-xl italic text-gray-200 text-shadow-sm">"{currentCharacter.quote}"</p>
                <cite className="block not-italic text-left md:text-right mt-2 text-gray-400">- {currentCharacter.name}</cite>
              </blockquote>
            </motion.div>
          </AnimatePresence>
           <button onClick={onSelect} className="mt-8 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-full transition-all duration-300">
                More Details
            </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedBook;