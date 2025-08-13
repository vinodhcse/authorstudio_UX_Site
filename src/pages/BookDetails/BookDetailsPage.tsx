

import React, { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, BookDetailsTab, Version } from '../../types';
import BookHero from './components/BookHero';
import VersionTab from './components/VersionTab';
import CollaboratorTab from './components/CollaboratorTab';
import RecentActivityTab from './components/RecentActivityTab';
import TabSwitcher from './components/TabSwitcher';
import EditBookModal from './components/EditBookModal';
import CreateVersionModal from './components/CreateVersionModal';
import { useBookContext } from '../../contexts/BookContext';

const BookDetailsPage: React.FC = () => {
    const { bookId } = useParams<{ bookId: string }>();
    const navigate = useNavigate();
    const { books, createVersion, updateBook, deleteBook, deleteVersion } = useBookContext();
    const [activeTab, setActiveTab] = useState<BookDetailsTab>('Versions');
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isCreateVersionModalOpen, setCreateVersionModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const book = books.find(b => b.id === bookId);

    if (!book) {
        return <Navigate to="/" replace />;
    }

    const handleUpdateBook = async (updatedData: Partial<Book>) => {
        if(book) {
            try {
                await updateBook(book.id, updatedData);
                console.log('Update book:', book.id, updatedData);
            } catch (error) {
                console.error('Failed to update book:', error);
                // TODO: Show error message to user
            }
        }
        setEditModalOpen(false);
    };

    const handleCoverUpdate = async (coverId: string | null) => {
        if (!book) return;
        
        try {
            const updatedData: Partial<Book> = {
                coverImageRef: coverId ? { assetId: coverId } as any : undefined
            };
            await updateBook(book.id, updatedData);
        } catch (error) {
            console.error('Failed to update book cover:', error);
        }
    };

    const handleDeleteBook = async () => {
        if (!book) return;
        
        setIsDeleting(true);
        try {
            await deleteBook(book.id);
            navigate('/'); // Redirect to home after deletion
        } catch (error) {
            console.error('Failed to delete book:', error);
            // TODO: Show error message to user
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    const handleCreateVersion = async (data: { name: string, sourceVersionId: string | null }) => {
        if (!book) return;

        try {
            const sourceVersion = data.sourceVersionId ? book.versions?.find(v => v.id === data.sourceVersionId) : null;
            
            const versionData: Omit<Version, 'id'> = {
                name: data.name,
                status: 'DRAFT',
                wordCount: sourceVersion ? sourceVersion.wordCount : 0,
                createdAt: new Date().toISOString(),
                contributor: { name: book.author || 'Unknown Author', avatar: '' },
                characters: sourceVersion?.characters || [],
                plotArcs: sourceVersion?.plotArcs || [],
                worlds: sourceVersion?.worlds || [],
                chapters: sourceVersion?.chapters || []
            };

            await createVersion(book.id, versionData);
            setCreateVersionModalOpen(false);
        } catch (error) {
            console.error('Failed to create version:', error);
            // TODO: Show error message to user
        }
    };

    const handleDeleteVersion = async (versionId: string) => {
        if (!book) return;
        
        try {
            await deleteVersion(book.id, versionId);
        } catch (error) {
            console.error('Failed to delete version:', error);
            // TODO: Show error message to user
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Versions':
                return <VersionTab 
                            versions={book.versions || []}
                            onOpenCreateModal={() => setCreateVersionModalOpen(true)}
                            onDeleteVersion={handleDeleteVersion}
                        />;
            case 'Collaborators':
                return <CollaboratorTab collaborators={book.collaborators || []} />;
            case 'Recent Activity':
                return <RecentActivityTab activities={book.activity || []} />;
            default:
                return null;
        }
    };

    const detailTabs: BookDetailsTab[] = ['Versions', 'Collaborators', 'Recent Activity'];

    return (
        <>
            <motion.div
                key={bookId} // Ensures re-animation when changing books
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
            >
                <BookHero 
                    book={book} 
                    onEdit={() => setEditModalOpen(true)} 
                    onDelete={() => setDeleteModalOpen(true)}
                    onCoverUpdate={handleCoverUpdate}
                />
                
                <TabSwitcher 
                    tabs={detailTabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />

                <div>
                    {renderTabContent()}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {isEditModalOpen && book && (
                    <EditBookModal
                        key={`edit-modal-${book.id}`}
                        isOpen={isEditModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        book={book}
                        onUpdateBook={handleUpdateBook}
                    />
                )}
                {isCreateVersionModalOpen && book && (
                    <CreateVersionModal
                        key={`version-modal-${book.id}`}
                        isOpen={isCreateVersionModalOpen}
                        onClose={() => setCreateVersionModalOpen(false)}
                        bookVersions={book.versions || []}
                        onCreate={handleCreateVersion}
                    />
                )}
                {isDeleteModalOpen && book && (
                    <motion.div
                        key={`delete-modal-${book.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setDeleteModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200/50 dark:border-gray-800/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Book</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    Are you sure you want to delete "{book.title}"? This will permanently delete the book and all its versions. This action cannot be undone.
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => setDeleteModalOpen(false)}
                                        disabled={isDeleting}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteBook}
                                        disabled={isDeleting}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete Book'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default BookDetailsPage;