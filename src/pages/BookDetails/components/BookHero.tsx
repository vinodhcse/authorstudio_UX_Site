
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Book } from '../../../types';
import { PenIcon, ExternalLinkIcon, CloudIcon, RefreshIcon, CheckCircleIcon } from '../../../constants';
import CoverPicker from '../../../components/CoverPicker';
import { appLog } from '../../../auth/fileLogger';
import { SimpleAssetService } from '../../../services/SimpleAssetService';
import { useBookContext } from '../../../contexts/BookContext';

// Add TrashIcon to the imports if it exists, or define a simple one
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const DefaultCover: React.FC<{ title: string; author?: string }> = ({ title, author }) => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-900 to-black p-4 flex flex-col justify-center items-center text-center rounded-lg">
        <h3 className="text-xl font-bold text-white text-shadow">{title}</h3>
        {author && <p className="text-sm text-gray-300 mt-2 text-shadow-sm">by {author}</p>}
    </div>
);

const DetailCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg p-4">
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-black/10 dark:border-white/10 pb-2">{title}</h4>
        <div className="grid grid-cols-2 gap-4">
            {children}
        </div>
    </div>
);

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block truncate">{value}</span>
    </div>
);

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
        <motion.div
            className="h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
        />
    </div>
);

const BookHero: React.FC<{ book: Book, onEdit: () => void, onDelete: () => void, onCoverUpdate?: (coverId: string | null, coverUrl?: string) => void }> = ({ book, onEdit, onDelete, onCoverUpdate }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-150, 150], [8, -8]);
    const rotateY = useTransform(x, [-150, 150], [-8, 8]);
    const [showCoverPicker, setShowCoverPicker] = useState(false);
    const [currentCoverId, setCurrentCoverId] = useState<string | undefined>(book.coverImageRef?.assetId || (book.coverImageRef as any)?.id);
    const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
    const [isSyncing, setIsSyncing] = useState(false);
    
    const { syncBook } = useBookContext();

    // Handle sync action
    const handleSync = async () => {
        if (!book || isSyncing) return;
        
        setIsSyncing(true);
        try {
            await syncBook(book.id);
        } catch (error) {
            console.error('Failed to sync book:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Sync status component
    const SyncStatusButton: React.FC = () => {
        const getSyncStatusInfo = () => {
            switch (book.syncState) {
                case 'dirty':
                    return {
                        icon: <CloudIcon className="h-4 w-4" />,
                        text: 'Sync Now',
                        color: 'text-yellow-600 dark:text-yellow-400',
                        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                        borderColor: 'border-yellow-200 dark:border-yellow-800',
                        isButton: true
                    };
                case 'pushing':
                    return {
                        icon: <RefreshIcon className="h-4 w-4 animate-spin" />,
                        text: 'Syncing...',
                        color: 'text-blue-600 dark:text-blue-400',
                        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                        borderColor: 'border-blue-200 dark:border-blue-800',
                        isButton: false
                    };
                case 'conflict':
                    return {
                        icon: <div className="h-4 w-4 bg-red-500 rounded-full" />,
                        text: 'Conflict',
                        color: 'text-red-600 dark:text-red-400',
                        bgColor: 'bg-red-50 dark:bg-red-900/20',
                        borderColor: 'border-red-200 dark:border-red-800',
                        isButton: false
                    };
                case 'idle':
                default:
                    return {
                        icon: <CheckCircleIcon className="h-4 w-4" />,
                        text: 'Synced',
                        color: 'text-green-600 dark:text-green-400',
                        bgColor: 'bg-green-50 dark:bg-green-900/20',
                        borderColor: 'border-green-200 dark:border-green-800',
                        isButton: false
                    };
            }
        };
        
        const statusInfo = getSyncStatusInfo();
        
        if (statusInfo.isButton && navigator.onLine) {
            return (
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-full border ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105`}
                >
                    {isSyncing ? (
                        <>
                            <RefreshIcon className="h-4 w-4 animate-spin" />
                            Syncing...
                        </>
                    ) : (
                        <>
                            {statusInfo.icon}
                            {statusInfo.text}
                        </>
                    )}
                </button>
            );
        }
        
        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                <div className={statusInfo.color}>
                    {statusInfo.icon}
                </div>
                <span className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                </span>
                {book.syncState === 'dirty' && !navigator.onLine && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        (Offline)
                    </span>
                )}
            </div>
        );
    };

    // Load cover image from asset system
    useEffect(() => {
        const loadCoverImage = async () => {
            if (currentCoverId) {
                try {
                    // Use simplified asset loading
                    const imageUrl = await SimpleAssetService.loadAssetForDisplay(currentCoverId);
                    setCoverImageUrl(imageUrl);
                    // Debug log: show snippet of the resolved URL (data: or remote)
                    appLog.info('book-hero', 'Resolved cover image URL', { coverId: currentCoverId, urlSnippet: imageUrl ? imageUrl.slice(0, 120) : null });
                } catch (error) {
                    console.warn('Failed to load cover image from assets:', error);
                    appLog.error('book-hero', 'Failed to load cover image', { coverId: currentCoverId, error });
                    // Fallback to book.coverImage if available
                    setCoverImageUrl(book.coverImage);
                    appLog.info('book-hero', 'Fallback cover image used', { coverUrl: book.coverImage ? String(book.coverImage).slice(0, 120) : null });
                }
            } else {
                // Use legacy cover image if no asset reference
                setCoverImageUrl(book.coverImage);
                appLog.info('book-hero', 'Using legacy cover image', { coverUrl: book.coverImage ? String(book.coverImage).slice(0, 120) : null });
            }
        };

        loadCoverImage();
    }, [currentCoverId, book.coverImage]);

    // Update currentCoverId when book.coverImageRef changes
    useEffect(() => {
        setCurrentCoverId(book.coverImageRef?.assetId || (book.coverImageRef as any)?.id);
    }, [book.coverImageRef?.assetId]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
    };

    const handleCoverChanged = (coverId: string | null) => {
        setCurrentCoverId(coverId || undefined);
        onCoverUpdate?.(coverId);
        setShowCoverPicker(false);
    };

    const handleEditCoverClick = () => {
        setShowCoverPicker(true);
    };

    // Use resolved cover image instead of book.coverImage
    const images = [coverImageUrl, ...(book.characters || []).map(c => c.image)].filter(Boolean) as string[];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;
        const intervalId = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(intervalId);
    }, [images.length]);

    return (
        <div className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl p-6 md:p-8 border border-black/10 dark:border-white/10 shadow-lg mb-8">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                {/* Left Side: Image */}
                <motion.div
                    className="group w-full md:w-1/3 lg:w-1/4 flex-shrink-0 relative"
                    style={{ perspective: 1000 }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => { x.set(0); y.set(0); }}
                >
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-border-blob-spin blur-xl z-0"></div>
                    <motion.div
                        className="relative aspect-[3/4] rounded-lg shadow-2xl overflow-hidden z-10"
                        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    >
                        {images.length > 0 ? (
                            <AnimatePresence>
                                <motion.img
                                    key={currentImageIndex}
                                    src={images[currentImageIndex]}
                                    alt={`${book.title} cover ${currentImageIndex}`}
                                    className="absolute w-full h-full object-cover"
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                                />
                            </AnimatePresence>
                        ) : (
                            <DefaultCover title={book.title} author={book.author} />
                        )}
                        
                        {/* Cover Picker Overlay */}
                        <AnimatePresence>
                            {showCoverPicker ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/80 flex items-center justify-center z-30 p-4"
                                >
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Update Cover</h3>
                                            <button
                                                onClick={() => setShowCoverPicker(false)}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <CoverPicker
                                            bookId={book.id}
                                            currentCoverId={currentCoverId}
                                            onCoverChanged={handleCoverChanged}
                                            className="w-full"
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 cursor-pointer">
                                    <button 
                                        onClick={handleEditCoverClick}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                                    >
                                        <PenIcon className="h-4 w-4" />
                                        Edit Cover
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
                
                {/* Right Side: Details */}
                <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{book.title}</h1>
                            {book.author && <p className="text-md text-gray-600 dark:text-gray-300 mt-2">by {book.author}</p>}
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <SyncStatusButton />
                            <button 
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-sky-500 dark:hover:bg-sky-600 transition-all transform hover:scale-105 shadow-md shadow-purple-500/20 dark:shadow-sky-500/30"
                            >
                                <PenIcon className="h-4 w-4" />
                                Edit
                            </button>
                            <button 
                                onClick={onDelete}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-all transform hover:scale-105 shadow-md shadow-red-500/20"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm max-w-2xl">
                        {book.synopsis}
                    </p>

                     <div className="col-span-full">
                         <DetailItem
                            label="Completion"
                            value={
                                <div className="flex items-center gap-2 w-full pt-1">
                                    <div className="flex-grow">
                                        <ProgressBar progress={book.progress} />
                                    </div>
                                    <span className="text-xs font-mono w-10 text-right">{book.progress}%</span>
                                </div>
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <DetailCard title="Story Details">
                            <DetailItem label="Genre" value={book.genre} />
                            {book.subgenre && <DetailItem label="Subgenre" value={book.subgenre} />}
                            <DetailItem label="Type" value={book.bookType} />
                            <DetailItem label="Prose" value={book.prose} />
                             <DetailItem label="Language" value={book.language} />
                            <DetailItem label="Word Count" value={book.wordCount.toLocaleString()} />
                        </DetailCard>

                        <DetailCard title="Publisher Details">
                            <DetailItem label="Publisher" value={book.publisher} />
                            <DetailItem label="Status" value={book.publishedStatus} />
                            <DetailItem label="Print ISBN" value={book.printISBN || 'N/A'} />
                            <DetailItem label="E-book ISBN" value={book.ebookISBN || 'N/A'} />
                            <div className="col-span-2">
                                <DetailItem label="Publisher Link" value={
                                    book.publisherLink ? 
                                    <a href={book.publisherLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-purple-500 dark:hover:text-sky-400 transition-colors">
                                        {book.publisherLink} <ExternalLinkIcon className="h-3 w-3" />
                                    </a> 
                                    : 'N/A'} 
                                />
                            </div>
                        </DetailCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookHero;