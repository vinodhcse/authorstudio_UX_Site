
import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Editor as TipTapEditor } from '@tiptap/react';
import { Theme } from '../../types';
import EditorHeader from './components/EditorHeader';
import Editor from './components/Editor';
import ScrollMinimap from './components/ScrollMinimap';
import EditorFooter from './components/EditorFooter';
import FloatingActionButton from './components/FloatingActionButton';
import { useCurrentBookAndVersion } from '../../contexts/BookContext';

interface BookForgePageProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const BookForgePage: React.FC<BookForgePageProps> = ({ theme, setTheme }) => {
    const { bookId, versionId } = useParams<{ bookId: string, versionId: string }>();
    const [showTypographySettings, setShowTypographySettings] = useState(false);
    const [editorInstance, setEditorInstance] = useState<TipTapEditor | null>(null);
    const [activeMode, setActiveMode] = useState('Writing');
    const [activePlanningTab, setActivePlanningTab] = useState<'Plot Arcs' | 'World Building' | 'Characters'>('Plot Arcs');
    const [planningLayout, setPlanningLayout] = useState('Plot');
    const [planningSubview, setPlanningSubview] = useState('by character');
    const [planningSearchQuery, setPlanningSearchQuery] = useState('');
    
    // Use BookContext to get current book and version data
    const { currentBook, currentVersion, loading, error } = useCurrentBookAndVersion();

    // Debug logging
    console.log('BookForgePage - URL params:', { bookId, versionId });
    console.log('BookForgePage - Context data:', { currentBook, currentVersion, loading, error });
    
    const handlePlanningNavigation = (tab: 'Plot Arcs' | 'World Building' | 'Characters') => {
        setActivePlanningTab(tab);
        if (activeMode !== 'Planning') {
            setActiveMode('Planning');
        }
        
        // Reset layout and subview when switching tabs
        switch (tab) {
            case 'Plot Arcs':
                setPlanningLayout('Plot');
                setPlanningSubview('by character');
                break;
            case 'World Building':
                setPlanningLayout('World Entity');
                setPlanningSubview('Timeline Event');
                break;
            case 'Characters':
                setPlanningLayout('Character');
                setPlanningSubview('Timeline Event');
                break;
        }
    };
    
    // Handle loading and error states
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
            </div>
        );
    }

    // Check if book and version exist
    if (!currentBook || !currentVersion) {
        return <Navigate to="/" replace />;
    }

    // Create compatibility objects for components that expect the old Book/Version structure
    const compatibilityBook = {
        ...currentBook,
        characters: currentVersion.characters || [],
        versions: currentBook.versions
    };

    const compatibilityVersion = {
        ...currentVersion
    };

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
                book={compatibilityBook} 
                version={compatibilityVersion} 
                theme={theme} 
                setTheme={setTheme}
                onOpenTypographySettings={handleOpenTypographySettings}
                activeMode={activeMode}
                setActiveMode={setActiveMode}
                activePlanningTab={activePlanningTab}
                planningLayout={planningLayout}
                planningSubview={planningSubview}
                onPlanningLayoutChange={setPlanningLayout}
                onPlanningSubviewChange={setPlanningSubview}
                planningSearchQuery={planningSearchQuery}
                onPlanningSearchChange={setPlanningSearchQuery}
            />
            <div className="flex-grow flex relative overflow-hidden">
                <Editor 
                    showTypographySettings={showTypographySettings}
                    onCloseTypographySettings={() => setShowTypographySettings(false)}
                    onEditorReady={setEditorInstance}
                    bookId={bookId!}
                    versionId={versionId!}
                    theme={theme}
                    activeMode={activeMode}
                    planningTab={activePlanningTab}
                    planningSearchQuery={planningSearchQuery}
                />
                {/* <ScrollMinimap editor={editorInstance} /> */}
            </div>
            <EditorFooter 
                book={compatibilityBook} 
                mode={activeMode}
                activePlanningTab={activePlanningTab}
                onPlanningNavigation={handlePlanningNavigation}
            />
                        <FloatingActionButton 
                theme={theme} 
                onInsertText={handleInsertText}
                editorInstance={editorInstance}
            />
        </motion.div>
    );
};

export default BookForgePage;