
import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Editor as TipTapEditor } from '@tiptap/react';
import { Book, Theme } from '../../types';
import EditorHeader from './components/EditorHeader';
import Editor from './components/Editor';
import ScrollMinimap from './components/ScrollMinimap';
import EditorFooter from './components/EditorFooter';
import FloatingActionButton from './components/FloatingActionButton';

interface BookForgePageProps {
    books: Book[];
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const BookForgePage: React.FC<BookForgePageProps> = ({ books, theme, setTheme }) => {
    const { bookId, versionId } = useParams<{ bookId: string, versionId: string }>();
    const [showTypographySettings, setShowTypographySettings] = useState(false);
    const [editorInstance, setEditorInstance] = useState<TipTapEditor | null>(null);
    
    const book = books.find(b => b.id === bookId);
    const version = book?.versions?.find(v => v.id === versionId);

    if (!book || !version) {
        return <Navigate to="/" replace />;
    }

    const handleOpenTypographySettings = () => {
        setShowTypographySettings(true);
    };

    return (
        <motion.div
            className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <EditorHeader 
                book={book} 
                version={version} 
                theme={theme} 
                setTheme={setTheme}
                onOpenTypographySettings={handleOpenTypographySettings}
            />
            <div className="flex-grow flex relative overflow-hidden">
                <Editor 
                    showTypographySettings={showTypographySettings}
                    onCloseTypographySettings={() => setShowTypographySettings(false)}
                    onEditorReady={setEditorInstance}
                />
                <ScrollMinimap editor={editorInstance} />
            </div>
            <EditorFooter book={book} />
            <FloatingActionButton />
        </motion.div>
    );
};

export default BookForgePage;