
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Editor as TipTapEditor } from '@tiptap/react';
import { Theme } from '../../types';
import EditorHeader from './components/EditorHeader';
import Editor from './components/Editor';
import EditorFooter from './components/EditorFooter';
import FloatingActionButton from './components/FloatingActionButton';
import ChapterDebugPanel from '../../components/ChapterDebugPanel';
import { appLog } from '../../auth/fileLogger';
import { useCurrentBookAndVersion } from '../../contexts/BookContext';
import { useChapters } from '../../hooks/useChapters';
import { toast } from '../../hooks/use-toast';

interface BookForgePageProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const BookForgePage: React.FC<BookForgePageProps> = ({ theme, setTheme }) => {
    const { bookId, versionId } = useParams<{ bookId: string, versionId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showTypographySettings, setShowTypographySettings] = useState(false);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [editorInstance, setEditorInstance] = useState<TipTapEditor | null>(null);
    
    // Get URL parameters for mode and tab
    const modeFromUrl = searchParams.get('mode') || 'Writing';
    const tabFromUrl = searchParams.get('tab') || 'PlotArcs';
    
    // Convert URL tab names to component-friendly names
    const getTabName = (urlTab: string): 'Plot Arcs' | 'World Building' | 'Characters' => {
        switch (urlTab) {
            case 'PlotArcs':
            case 'Plot Arcs':
                return 'Plot Arcs';
            case 'WorldBuilding':
            case 'World Building':
                return 'World Building';
            case 'Characters':
            case 'Character':
                return 'Characters';
            default:
                return 'Plot Arcs';
        }
    };
    
    const [activeMode, setActiveMode] = useState(modeFromUrl);
    const [activePlanningTab, setActivePlanningTab] = useState<'Plot Arcs' | 'World Building' | 'Characters'>(getTabName(tabFromUrl));
    const [planningLayout, setPlanningLayout] = useState('Plot');
    const [planningSubview, setPlanningSubview] = useState('by character');
    const [planningSearchQuery, setPlanningSearchQuery] = useState('');
    
    // Use BookContext to get current book and version data
    const { currentBook, currentVersion, loading, error } = useCurrentBookAndVersion();
    
    // Load chapters for the current book/version - only if we have valid IDs
    const shouldLoadChapters = Boolean(bookId && versionId);
    const { 
        chapters, 
        createChapter,
        updateChapter,
        deleteChapter,
        saveChapterContent, 
        createAct,
        deleteAct,
        reorderChapter
    } = useChapters(
        shouldLoadChapters ? bookId! : '', 
        shouldLoadChapters ? versionId! : ''
    );

    // Simple chapter state - controlled entirely by URL and user navigation
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const [isChapterLoading, setIsChapterLoading] = useState(false);
    
    // Derive current chapter from selectedChapterId
    const currentChapter = selectedChapterId 
        ? chapters.find(ch => ch.id === selectedChapterId)
        : null;

    // Log when selectedChapterId changes
    useEffect(() => {
        console.log('🔄 selectedChapterId changed:', { 
            selectedChapterId, 
            currentChapterFound: !!currentChapter,
            currentChapterTitle: currentChapter?.title 
        });
    }, [selectedChapterId, currentChapter]);

    // Initial load useEffect - handles URL params and initial chapter selection
    useEffect(() => {
        console.log('🔄 INITIAL LOAD useEffect triggered');
        console.log('📊 Chapters:', { 
            count: chapters.length, 
            chapterIds: chapters.map(ch => ch.id),
            chapterTitles: chapters.map(ch => ch.title)
        });
        console.log('🔗 URL state:', { 
            searchParamsString: searchParams.toString(),
            chapterIdFromUrl: searchParams.get('chapterId')
        });
        console.log('📝 Current state:', { 
            selectedChapterId, 
            activeMode 
        });

        // Only run if we have chapters loaded
        if (chapters.length === 0) {
            console.log('⏹️ No chapters loaded yet, returning early');
            return;
        }

        const chapterIdFromUrl = searchParams.get('chapterId');
        
        if (chapterIdFromUrl && chapters.find(ch => ch.id === chapterIdFromUrl)) {
            // Valid chapter ID in URL - use it
            console.log('✅ Valid chapter ID found in URL:', chapterIdFromUrl);
            if (selectedChapterId !== chapterIdFromUrl) {
                console.log('🔄 Setting selectedChapterId from URL:', chapterIdFromUrl);
                setSelectedChapterId(chapterIdFromUrl);
            } else {
                console.log('✨ Already have correct chapter selected:', chapterIdFromUrl);
            }
        } else if (activeMode === 'Writing' && !selectedChapterId) {
            // No chapter selected and we're in Writing mode - select first chapter
            console.log('🎯 No chapter selected in Writing mode, selecting first chapter:', chapters[0].id);
            setSelectedChapterId(chapters[0].id);
            
            // Also update URL to reflect the selected chapter
            const params = new URLSearchParams(searchParams);
            params.set('chapterId', chapters[0].id);
            setSearchParams(params, { replace: true });
        } else {
            console.log('🚫 No action needed:', { 
                chapterIdFromUrl, 
                foundInChapters: !!chapters.find(ch => ch.id === chapterIdFromUrl),
                activeMode,
                selectedChapterId 
            });
        }
    }, [chapters, searchParams, activeMode, selectedChapterId, setSearchParams]);

    // Handle chapter navigation with URL updates and loading states
    const handleNavigateToChapter = async (chapterId: string) => {
        console.log('🎯 handleNavigateToChapter called:', { 
            chapterId, 
            currentSelectedChapterId: selectedChapterId,
            alreadySelected: chapterId === selectedChapterId 
        });
        
        if (chapterId === selectedChapterId) {
            console.log('✨ Already on this chapter, returning early');
            return; // Already on this chapter
        }
        
        setIsChapterLoading(true);
        try {
            console.log('🔄 Starting chapter navigation...');
            
            // Update URL with new chapterId
            const params = new URLSearchParams(searchParams);
            params.set('chapterId', chapterId);
            console.log('🔗 Updating URL with chapterId:', chapterId);
            setSearchParams(params, { replace: true });
            
            // Small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Update selected chapter - this will trigger rerender of child components
            console.log('📝 Setting selectedChapterId to:', chapterId);
            setSelectedChapterId(chapterId);
            
            const chapterTitle = chapters.find(ch => ch.id === chapterId)?.title || 'chapter';
            console.log('✅ Chapter navigation completed:', { chapterId, chapterTitle });
            
            toast({
                title: "Chapter Loaded",
                description: `Switched to ${chapterTitle}`,
            });
        } catch (error) {
            console.error('❌ Failed to navigate to chapter:', error);
            toast({
                title: "Navigation Failed", 
                description: "Failed to switch chapters",
                variant: "destructive",
            });
        } finally {
            setIsChapterLoading(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Shift+D or Cmd+Shift+D to toggle debug panel
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                setShowDebugPanel(prev => !prev);
                appLog.info('book-forge', 'Debug panel toggled', { showing: !showDebugPanel });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showDebugPanel]);

    // Chapter management handlers for EditorFooter
    const handleSaveToLocal = async () => {
        if (!currentChapter) return;
        
        try {
            // Create a major revision (manual save)
            await saveChapterContent(currentChapter.id, currentChapter.content, false);
            toast({
                title: "Saved Locally",
                description: `Chapter "${currentChapter.title}" saved to local storage`,
            });
        } catch (error) {
            console.error('Failed to save to local:', error);
            toast({
                title: "Save Failed",
                description: "Failed to save chapter to local storage",
                variant: "destructive",
            });
        }
    };

    // Debug logging
    console.log('🏗️ BookForgePage RENDER:', {
        bookId,
        versionId,
        chaptersCount: chapters.length,
        selectedChapterId,
        currentChapterTitle: currentChapter?.title,
        activeMode,
        searchParamsString: searchParams.toString(),
        timestamp: new Date().toISOString()
    });
    
    appLog.info('book-forge', 'URL params', { bookId, versionId });
    appLog.info('book-forge', 'Context data', { currentBook, currentVersion, loading, error });
    appLog.info('book-forge', 'Chapters data', { chapters: chapters || [], chaptersLength: chapters?.length || 0 });
    appLog.info('book-forge', 'URL mode and tab', { mode: modeFromUrl, tab: tabFromUrl });
    appLog.info('book-forge', 'State values', { activeMode, activePlanningTab });
    
    // Update URL only when mode or tab changes (not for chapter changes)
    useEffect(() => {
        console.log('🔄 MODE/TAB SYNC useEffect triggered');
        console.log('📊 Current values:', { 
            activeMode, 
            activePlanningTab
        });
        
        const params = new URLSearchParams(searchParams);
        console.log('🔗 Current URL params before changes:', params.toString());
        
        // Set mode parameter
        if (activeMode !== 'Writing') {
            params.set('mode', activeMode);
            console.log('📝 Set mode param:', activeMode);
        } else {
            params.delete('mode');
            console.log('🗑️ Deleted mode param (Writing mode)');
        }
        
        // Set tab parameter only if in Planning mode
        if (activeMode === 'Planning') {
            const urlTabName = activePlanningTab === 'Plot Arcs' ? 'PlotArcs' : 
                              activePlanningTab === 'World Building' ? 'WorldBuilding' : 'Characters';
            if (urlTabName !== 'PlotArcs') {
                params.set('tab', urlTabName);
                console.log('📝 Set tab param:', urlTabName);
            } else {
                params.delete('tab');
                console.log('🗑️ Deleted tab param (default PlotArcs)');
            }
        } else {
            params.delete('tab');
            console.log('🗑️ Deleted tab param (not Planning mode)');
        }
        
        // Preserve other existing parameters (like chapterId and selectedNodeId)
        const newSearch = params.toString();
        const currentSearch = searchParams.toString();
        
        console.log('🔍 URL comparison:', { 
            current: currentSearch, 
            new: newSearch, 
            different: newSearch !== currentSearch 
        });
        
        if (newSearch !== currentSearch) {
            console.log('🚀 Updating URL params (mode/tab only):', newSearch);
            setSearchParams(params, { replace: true });
        } else {
            console.log('✨ No URL update needed');
        }
    }, [activeMode, activePlanningTab, searchParams, setSearchParams]);
    
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
    
    const handleModeChange = (mode: string) => {
        setActiveMode(mode);
        // If switching to Planning mode and no specific tab is set, default to Plot Arcs
        if (mode === 'Planning' && !tabFromUrl) {
            setActivePlanningTab('Plot Arcs');
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
                currentChapter={currentChapter || undefined}
                chapters={chapters}
                theme={theme} 
                setTheme={setTheme}
                onOpenTypographySettings={handleOpenTypographySettings}
                activeMode={activeMode}
                setActiveMode={handleModeChange}
                activePlanningTab={activePlanningTab}
                planningLayout={planningLayout}
                planningSubview={planningSubview}
                onPlanningLayoutChange={setPlanningLayout}
                onPlanningSubviewChange={setPlanningSubview}
                planningSearchQuery={planningSearchQuery}
                onPlanningSearchChange={setPlanningSearchQuery}
                onUpdateChapter={updateChapter}
                onCreateChapter={async (title: string, actId?: string) => {
                    const newChapter = await createChapter(title, actId);
                    if (newChapter) {
                        // Dispatch event for UI refresh
                        window.dispatchEvent(new CustomEvent('chapterCreated'));
                        await handleNavigateToChapter(newChapter.id);
                    }
                }}
                onDeleteChapter={async (chapterId: string) => {
                    await deleteChapter(chapterId);
                    // Dispatch event for UI refresh
                    window.dispatchEvent(new CustomEvent('chapterDeleted'));
                    
                    // If we deleted the current chapter, navigate to first available chapter or default state
                    if (chapterId === selectedChapterId) {
                        if (chapters.length > 1) {
                            // Navigate to first remaining chapter
                            const remainingChapter = chapters.find(ch => ch.id !== chapterId);
                            if (remainingChapter) {
                                await handleNavigateToChapter(remainingChapter.id);
                            }
                        } else {
                            // No chapters left, clear selection and URL
                            setSelectedChapterId(null);
                            const params = new URLSearchParams(searchParams);
                            params.delete('chapterId');
                            setSearchParams(params, { replace: true });
                        }
                    }
                }}
                onCreateAct={async (title: string) => {
                    await createAct(title);
                    // Dispatch event for UI refresh
                    window.dispatchEvent(new CustomEvent('actCreated'));
                }}
                onDeleteAct={async (actId: string) => {
                    await deleteAct(actId);
                    // Dispatch event for UI refresh
                    window.dispatchEvent(new CustomEvent('actDeleted'));
                }}
                onReorderChapter={reorderChapter}
                onNavigateToChapter={handleNavigateToChapter}
                isChapterLoading={isChapterLoading}
            />
            <div className="flex-grow flex relative overflow-hidden">
                <Editor 
                    currentChapterId={selectedChapterId || undefined}
                    onChapterCreated={(chapterId: string) => handleNavigateToChapter(chapterId)}
                    showTypographySettings={showTypographySettings}
                    onCloseTypographySettings={() => setShowTypographySettings(false)}
                    onEditorReady={setEditorInstance}
                    bookId={bookId!}
                    versionId={versionId!}
                    book={compatibilityBook}
                    version={compatibilityVersion}
                    theme={theme}
                    activeMode={activeMode}
                    planningTab={activePlanningTab}
                    planningSearchQuery={planningSearchQuery}
                />
            </div>
            <EditorFooter 
                book={compatibilityBook} 
                mode={activeMode}
                activePlanningTab={activePlanningTab}
                onPlanningNavigation={handlePlanningNavigation}
                currentChapterId={selectedChapterId || undefined}
                chapterSyncState={currentChapter?.syncState === 'pulling' ? 'pushing' : currentChapter?.syncState as any}
                chapterWordCount={currentChapter?.wordCount || 0}
                chapterCharCount={currentChapter?.content?.metadata?.totalCharacters || 0}
                onSaveToLocal={handleSaveToLocal}
            />
                        <FloatingActionButton 
                theme={theme} 
                onInsertText={handleInsertText}
                editorInstance={editorInstance}
            />
            
            {/* Debug Panel - Toggle with Ctrl+Shift+D */}
            {showDebugPanel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-lg max-w-6xl max-h-[90vh] overflow-auto relative">
                        <button
                            onClick={() => setShowDebugPanel(false)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 text-xl font-bold z-10"
                        >
                            ×
                        </button>
                        <ChapterDebugPanel className="p-6" />
                        <div className="text-center text-gray-400 text-sm p-4 border-t border-gray-700">
                            Press Ctrl+Shift+D to toggle this panel
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default BookForgePage;