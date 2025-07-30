
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

    const handleInsertText = (text: string) => {
        if (editorInstance) {
            // Insert text at current cursor position
            const { selection } = editorInstance.state;
            const pos = selection.to;
            
            // Add a space before the text if needed (cursor is not at start or after whitespace)
            const needsSpaceBefore = pos > 0 && 
                !editorInstance.state.doc.textBetween(pos - 1, pos).match(/\s/);
            
            const textToInsert = needsSpaceBefore ? ` ${text}` : text;
            
            editorInstance
                .chain()
                .focus()
                .insertContentAt(pos, textToInsert)
                .run();
        }
    };

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
                    bookId={bookId!}
                    versionId={versionId!}
                    theme={theme}
                />
                {/* <ScrollMinimap editor={editorInstance} /> */}
            </div>
            <EditorFooter book={book} />
                        <FloatingActionButton 
                theme={theme} 
                onInsertText={handleInsertText}
                editorInstance={editorInstance}
            />
        </motion.div>
    );
};

export default BookForgePage;