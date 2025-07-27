
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Book } from '../../../types';
import { PenIcon, ExternalLinkIcon } from '../../../constants';

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

const BookHero: React.FC<{ book: Book, onEdit: () => void }> = ({ book, onEdit }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-150, 150], [8, -8]);
    const rotateY = useTransform(x, [-150, 150], [-8, 8]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
    };

    const images = [book.coverImage, ...(book.characters || []).map(c => c.image)].filter(Boolean) as string[];
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
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 cursor-pointer">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors">
                                <PenIcon className="h-4 w-4" />
                                Edit Cover
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
                
                {/* Right Side: Details */}
                <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{book.title}</h1>
                            {book.author && <p className="text-md text-gray-600 dark:text-gray-300 mt-2">by {book.author}</p>}
                        </div>
                        <button 
                            onClick={onEdit}
                            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-sky-500 dark:hover:bg-sky-600 transition-all transform hover:scale-105 shadow-md shadow-purple-500/20 dark:shadow-sky-500/30"
                        >
                            <PenIcon className="h-4 w-4" />
                            Edit
                        </button>
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