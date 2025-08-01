

import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, BookDetailsTab, Version } from '../../types';
import BookHero from './components/BookHero';
import VersionTab from './components/VersionTab';
import CollaboratorTab from './components/CollaboratorTab';
import RecentActivityTab from './components/RecentActivityTab';
import TabSwitcher from './components/TabSwitcher';
import EditBookModal from './components/EditBookModal';
import CreateVersionModal from './components/CreateVersionModal';

interface BookDetailsPageProps {
    books: Book[];
    onUpdateBook: (bookId: string, updatedData: Partial<Book>) => void;
    onCreateVersion: (bookId: string, newVersion: Version) => void;
}

const BookDetailsPage: React.FC<BookDetailsPageProps> = ({ books, onUpdateBook, onCreateVersion }) => {
    const { bookId } = useParams<{ bookId: string }>();
    const [activeTab, setActiveTab] = useState<BookDetailsTab>('Versions');
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isCreateVersionModalOpen, setCreateVersionModalOpen] = useState(false);

    const book = books.find(b => b.id === bookId);

    if (!book) {
        return <Navigate to="/" replace />;
    }

    const handleUpdateBook = (updatedData: Partial<Book>) => {
        if(book) {
            onUpdateBook(book.id, updatedData);
        }
        setEditModalOpen(false);
    };

    const handleCreateVersion = (data: { name: string, sourceVersionId: string | null }) => {
        if (!book) return;

        const sourceVersion = data.sourceVersionId ? book.versions?.find(v => v.id === data.sourceVersionId) : null;
        
        const newVersion: Version = {
            id: `v${Date.now()}`,
            name: data.name,
            status: 'DRAFT',
            wordCount: sourceVersion ? sourceVersion.wordCount : 0,
            createdAt: 'Just now',
            contributor: { name: 'Alex J. Doe', avatar: 'https://picsum.photos/seed/user/40/40' } // Placeholder user
        };

        onCreateVersion(book.id, newVersion);
        setCreateVersionModalOpen(false);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Versions':
                return <VersionTab 
                            versions={book.versions || []}
                            onOpenCreateModal={() => setCreateVersionModalOpen(true)}
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
                <BookHero book={book} onEdit={() => setEditModalOpen(true)} />
                
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
            </AnimatePresence>
        </>
    );
};

export default BookDetailsPage;