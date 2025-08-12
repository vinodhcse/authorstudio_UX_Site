

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Book } from '../types';
import { BookOpenIcon } from '../constants';
import { useBookContext } from '../contexts/BookContext';
import { AssetService } from '../services/AssetService';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full bg-black/20 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
      <motion.div
        className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
      />
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string | number }) => (
    <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{value}</p>
    </div>
);

interface BookCardProps {
  book: Book;
  onSelect: () => void;
}

// Sync status icons and labels
const getSyncIcon = (syncState?: string, conflictState?: string) => {
  const iconClass = "w-4 h-4";
  
  if (conflictState !== 'none' && conflictState) {
    return <div className={`${iconClass} bg-red-500 rounded-full animate-pulse`} title="Sync conflict" />;
  }
  
  switch (syncState) {
    case 'pushing':
    case 'pulling':
      return <div className={`${iconClass} bg-blue-500 rounded-full animate-spin border-2 border-blue-200 border-t-transparent`} title="Syncing..." />;
    case 'dirty':
      return <div className={`${iconClass} bg-yellow-500 rounded-full`} title="Needs sync" />;
    case 'idle':
      return <div className={`${iconClass} bg-green-500 rounded-full`} title="Synced" />;
    default:
      return <div className={`${iconClass} bg-gray-400 rounded-full`} title="Unknown status" />;
  }
};

const getSyncLabel = (syncState?: string, conflictState?: string) => {
  if (conflictState !== 'none' && conflictState) {
    return 'Conflict';
  }
  
  switch (syncState) {
    case 'pushing':
      return 'Uploading...';
    case 'pulling':
      return 'Downloading...';
    case 'dirty':
      return 'Needs Sync';
    case 'idle':
      return 'Synced';
    default:
      return 'Unknown';
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const { syncBook } = useBookContext();

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

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-150, 150], [5, -5]); // Reduced Y-axis tilt
  const rotateY = useTransform(x, [-150, 150], [-15, 15]); // Refined X-axis tilt

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };

  const handleSyncClick = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering onSelect
    try {
      await syncBook(book.id);
    } catch (error) {
      console.error('Failed to sync book:', error);
    }
  };

  const needsSync = book.syncState === 'dirty';
  const hasConflict = book.conflictState !== 'none' && book.conflictState;
  const isSyncing = book.syncState === 'pushing' || book.syncState === 'pulling';

  return (
    <motion.div
      variants={cardVariants}
      className="group cursor-pointer relative h-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
      }}
      onMouseMove={handleMouseMove}
      style={{ perspective: 1000 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      onClick={onSelect}
    >
      <motion.div
        layout
        transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
        className="relative rounded-2xl h-full shadow-lg"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-border-blob-spin blur-xl z-0"></div>
        
        <div
            className="relative bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl p-4 h-full flex flex-col justify-between border border-transparent z-10"
        >
            <motion.div layout="position" className={`flex gap-4 ${isHovered ? 'flex-col' : 'flex-row items-start'}`}>
                {/* Image */}
                <motion.div layout className={`relative rounded-lg overflow-hidden flex-shrink-0 ${isHovered ? 'w-full h-40' : 'w-24 h-32'}`}>
                     {coverImageUrl ? (
                        <img src={coverImageUrl} alt={book.title} className="absolute w-full h-full object-cover"/>
                     ) : (
                        <div className="absolute w-full h-full bg-gradient-to-br from-gray-700 via-gray-900 to-black flex items-center justify-center">
                            <BookOpenIcon className="w-8 h-8 text-gray-400" />
                        </div>
                     )}
                </motion.div>

                {/* Details Container */}
                <motion.div layout="position" className="flex flex-col flex-grow min-w-0">
                    <div className="flex items-start justify-between">
                        <h3 className="font-bold text-gray-800 dark:text-white truncate text-lg flex-grow mr-2">{book.title}</h3>
                        {/* Sync Status Icon */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {getSyncIcon(book.syncState, book.conflictState)}
                            {(needsSync || hasConflict) && (
                                <button
                                    onClick={handleSyncClick}
                                    disabled={isSyncing}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                                    title="Sync now"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{book.lastModified}</p>
                    <div className="mt-auto w-full">
                        <ProgressBar progress={book.progress} />
                    </div>
                </motion.div>
            </motion.div>

            {/* Bottom part: initial state has genre/collabs, hover state adds more */}
            <motion.div layout className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                <div className="flex justify-between items-center text-sm">
                  <span className="px-2 py-1 text-xs font-semibold text-purple-800 dark:text-purple-200 bg-purple-500/20 dark:bg-purple-900/50 rounded-full">
                      {book.genre}
                  </span>
                   <div className="flex items-center -space-x-2">
                        {book.collaborators.slice(0, 3).map(c => 
                            <img key={c.id} src={c.avatar} alt="collaborator" className="w-7 h-7 rounded-full border-2 border-gray-50 dark:border-black" />
                        )}
                        {book.collaboratorCount > 3 && (
                            <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold border-2 border-gray-50 dark:border-black">+{book.collaboratorCount - 3}</div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                {isHovered && (
                  <motion.div
                    className="overflow-hidden"
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <DetailItem label="Words" value={book.wordCount.toLocaleString()} />
                        <DetailItem label="Progress" value={`${book.progress}%`} />
                        <DetailItem label="Type" value={book.bookType} />
                        <DetailItem label="Prose" value={book.prose} />
                        <DetailItem label="Language" value={book.language} />
                        <DetailItem label="Publisher" value={book.publisher} />
                        <DetailItem label="Sync Status" value={getSyncLabel(book.syncState, book.conflictState)} />
                        <DetailItem label="Last Updated" value={book.updatedAt ? new Date(book.updatedAt).toLocaleDateString() : 'Unknown'} />
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BookCard;