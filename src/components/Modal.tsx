
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { AssetService } from '../services/AssetService';

const ModalProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
        <motion.div
            className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold text-gray-800 dark:text-gray-200">{value}</p>
    </div>
);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  },
};

interface ModalProps {
  book: Book;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ book, onClose }) => {
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

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

  // Use resolved cover image instead of book.coverImage
  const images = [coverImageUrl, ...(book.coverImages || [])].filter(Boolean) as string[];

  useEffect(() => {
    if (images.length <= 1) return;
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [images.length]);

  const handleContinue = () => {
    onClose();
    navigate(`/book/${book.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-black rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-800/50 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 w-full overflow-hidden rounded-t-2xl border-b-8 border-gray-100 dark:border-black">
          {images.length > 0 ? (
            <AnimatePresence>
                <motion.img
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={book.title}
                    className="absolute w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/75 transition-colors z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <motion.div 
            className="p-8 space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{book.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Last updated: {book.lastModified}</p>
          </motion.div>
          
          <motion.div variants={itemVariants}>
             <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Progress ({book.wordCount.toLocaleString()} words)</h4>
             <ModalProgressBar progress={book.progress} />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
             <DetailItem label="Type" value={book.bookType} />
             <DetailItem label="Genre" value={book.genre} />
             <DetailItem label="Prose" value={book.prose} />
             <DetailItem label="Language" value={book.language} />
             <DetailItem label="Publisher" value={book.publisher} />
             <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collaborators</p>
                <div className="flex items-center -space-x-2 mt-1">
                    {book.collaborators.map(c => 
                        <img key={c.id} src={c.avatar} alt="collaborator" className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900" title={`Collaborator ${c.id}`} />
                    )}
                     {book.collaboratorCount > book.collaborators.length && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900">+{book.collaboratorCount - book.collaborators.length}</div>
                    )}
                </div>
            </div>
          </motion.div>
          
           <motion.div variants={itemVariants}>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Synopsis</h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {book.synopsis}
              </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex gap-4">
            <button 
              onClick={handleContinue}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/20"
            >
              Continue Writing
            </button>
            <button className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
              Manage Chapters
            </button>
          </motion.div>

        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Modal;