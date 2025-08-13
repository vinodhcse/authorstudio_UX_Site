
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../../../types';
import { CloudIcon, HardDriveIcon } from '../../../constants';

type SaveStatus = 'saved' | 'saving' | 'unsaved';

interface EditorFooterProps {
    book: Book;
    mode?: string;
    activePlanningTab?: string;
    onPlanningNavigation?: (tab: 'Plot Arcs' | 'World Building' | 'Characters') => void;
    // Chapter management props
    currentChapterId?: string;
    chapterSyncState?: 'idle' | 'dirty' | 'pushing' | 'conflict';
    chapterWordCount?: number;
    chapterCharCount?: number;
    onSaveToLocal?: () => Promise<void>;
    onSyncToCloud?: () => Promise<void>;
    onSquashRevisions?: () => Promise<void>;
}

const EditorFooter: React.FC<EditorFooterProps> = ({ 
    book, 
    mode, 
    activePlanningTab, 
    onPlanningNavigation,
    currentChapterId,
    chapterSyncState = 'idle',
    chapterWordCount = 0,
    chapterCharCount = 0,
    onSaveToLocal,
    onSyncToCloud,
    onSquashRevisions
}) => {
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [jobProgress, setJobProgress] = useState<number | null>(null);
    const [isSaveMenuOpen, setSaveMenuOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Update save status based on chapter sync state
    useEffect(() => {
        if (chapterSyncState === 'pushing') {
            setSaveStatus('saving');
        } else if (chapterSyncState === 'dirty') {
            setSaveStatus('unsaved');
        } else if (chapterSyncState === 'conflict') {
            setSaveStatus('unsaved'); // Could add a 'conflict' status
        } else {
            setSaveStatus('saved');
        }
    }, [chapterSyncState]);

    // Handle local save
    const handleSaveToLocal = async () => {
        if (!onSaveToLocal) return;
        
        try {
            setIsSyncing(true);
            await onSaveToLocal();
            setSaveMenuOpen(false);
        } catch (error) {
            console.error('Failed to save to local:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Handle cloud sync
    const handleSyncToCloud = async () => {
        if (!onSyncToCloud || !onSquashRevisions) return;
        
        try {
            setIsSyncing(true);
            // First squash revisions to clean up local history
            await onSquashRevisions();
            // Then sync to cloud
            await onSyncToCloud();
            setSaveMenuOpen(false);
        } catch (error) {
            console.error('Failed to sync to cloud:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // --- MOCK LOGIC ---
    // Mock job progress for demonstration
    useEffect(() => {
        const hasJob = Math.random() > 0.7;
        if (!hasJob) return;

        setJobProgress(0);
        const interval = setInterval(() => {
            setJobProgress(prev => {
                if (prev === null || prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setJobProgress(null), 2000);
                    return null;
                }
                return prev + Math.random() * 15;
            });
        }, 800);
        return () => clearInterval(interval);
    }, []);

    // Remove mock save status changes - use real sync state only
    // --- END MOCK LOGIC ---


    const statusConfig = {
        saved: { color: 'bg-green-500', pulseColor: 'bg-green-400', text: 'Auto-saved' },
        saving: { color: 'bg-orange-500', pulseColor: 'bg-orange-400', text: 'Saving...' },
        unsaved: { color: 'bg-red-500', pulseColor: 'bg-red-400', text: 'Unsaved' },
    };
    const currentStatus = statusConfig[saveStatus];

    const renderLeftContent = () => {
        if (mode === 'Planning') {
            return (
                <div className="flex items-center gap-4 text-xs text-white/70 dark:text-black/70 font-medium w-1/4">
                    <button 
                        onClick={() => onPlanningNavigation?.('Plot Arcs')}
                        className={`px-3 py-1 rounded-lg transition-colors ${
                            activePlanningTab === 'Plot Arcs' 
                                ? 'bg-gradient-to-r from-slate-300 to-gray-400 dark:from-slate-400 dark:to-gray-500 text-black dark:text-white font-semibold shadow-lg border border-slate-400 dark:border-slate-500' 
                                : 'hover:bg-white/10 dark:hover:bg-black/10'
                        }`}
                    >
                        Plot Arcs
                    </button>
                    <button 
                        onClick={() => onPlanningNavigation?.('World Building')}
                        className={`px-3 py-1 rounded-lg transition-colors ${
                            activePlanningTab === 'World Building' 
                                ? 'bg-gradient-to-r from-slate-300 to-gray-400 dark:from-slate-400 dark:to-gray-500 text-black dark:text-white font-semibold shadow-lg border border-slate-400 dark:border-slate-500' 
                                : 'hover:bg-white/10 dark:hover:bg-black/10'
                        }`}
                    >
                        World Building
                    </button>
                </div>
            );
        }
        
        // Default Writing mode
        return (
            <div className="flex items-center gap-6 text-xs text-white/70 dark:text-black/70 font-medium w-1/4">
                <span>Words: {chapterWordCount.toLocaleString()}</span>
                <span>Characters: {chapterCharCount.toLocaleString()}</span>
            </div>
        );
    };

    const renderRightContent = () => {
        if (mode === 'Planning') {
            return (
                <div className="relative w-1/4 flex justify-end items-center gap-4">
                    <button 
                        onClick={() => onPlanningNavigation?.('Characters')}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            activePlanningTab === 'Characters' 
                                ? 'bg-gradient-to-r from-slate-300 to-gray-400 dark:from-slate-400 dark:to-gray-500 text-black dark:text-white font-semibold shadow-lg border border-slate-400 dark:border-slate-500' 
                                : 'text-white/70 dark:text-black/70 hover:bg-white/10 dark:hover:bg-black/10'
                        }`}
                    >
                        Characters
                    </button>
                    
                    <button 
                        onClick={() => setSaveMenuOpen(!isSaveMenuOpen)}
                        className="flex items-center gap-2 text-xs text-white/70 dark:text-black/70 font-medium"
                    >
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-pulse-dot absolute inline-flex h-full w-full rounded-full ${currentStatus.pulseColor} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStatus.color}`}></span>
                        </span>
                        <span>{currentStatus.text}</span>
                    </button>

                    <AnimatePresence>
                        {isSaveMenuOpen && (
                             <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full right-0 mb-2 w-48 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-slate-50 dark:to-slate-100 rounded-lg shadow-lg p-2 z-50 border border-gray-600/50 dark:border-gray-300/50"
                              >
                                <button 
                                    onClick={handleSaveToLocal}
                                    disabled={isSyncing || !onSaveToLocal}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                > 
                                    <HardDriveIcon className="h-4 w-4"/> 
                                    {isSyncing && onSaveToLocal ? 'Saving...' : 'Save to Local (Ctrl+S)'}
                                </button>
                                <button 
                                    onClick={handleSyncToCloud}
                                    disabled={isSyncing || !onSyncToCloud || chapterSyncState === 'idle'}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                > 
                                    <CloudIcon className="h-4 w-4"/> 
                                    {isSyncing && onSyncToCloud ? 'Syncing...' : 'Sync to Cloud'}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        // Default Writing mode
        return (
            <div className="relative w-1/4 flex justify-end">
                <button 
                    onClick={() => setSaveMenuOpen(!isSaveMenuOpen)}
                    className="flex items-center gap-2 text-xs text-white/70 dark:text-black/70 font-medium"
                >
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-pulse-dot absolute inline-flex h-full w-full rounded-full ${currentStatus.pulseColor} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStatus.color}`}></span>
                    </span>
                    <span>{currentStatus.text}</span>
                </button>

                <AnimatePresence>
                    {isSaveMenuOpen && (
                         <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 w-48 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-slate-50 dark:to-slate-100 rounded-lg shadow-lg p-2 z-50 border border-gray-600/50 dark:border-gray-300/50"
                          >
                            <button 
                                onClick={handleSaveToLocal}
                                disabled={isSyncing || !onSaveToLocal}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            > 
                                <HardDriveIcon className="h-4 w-4"/> 
                                {isSyncing && onSaveToLocal ? 'Saving...' : 'Save to Local (Ctrl+S)'}
                            </button>
                            <button 
                                onClick={handleSyncToCloud}
                                disabled={isSyncing || !onSyncToCloud || chapterSyncState !== 'dirty'}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            > 
                                <CloudIcon className="h-4 w-4"/> 
                                {isSyncing && onSyncToCloud ? 'Syncing...' : 'Sync to Cloud'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <motion.footer 
            className="fixed bottom-0 left-0 right-10 z-30 flex justify-center"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
        >
             <div className="h-8 w-[98%] max-w-5xl rounded-t-2xl bg-gradient-to-br from-gray-800 to-black dark:from-slate-200 dark:to-gray-50 border-t border-l border-r border-gray-700/50 dark:border-gray-300/50 shadow-2xl flex items-center justify-between px-8">
                {/* Left: planning navigation or word counts */}
                {renderLeftContent()}
                
                {/* Middle: Job progress or Book Title */}
                <div className="flex-grow flex justify-center items-center h-full">
                    <div className="relative w-full max-w-sm h-6 rounded-full bg-white/5 dark:bg-black/5 shadow-inner overflow-hidden">
                        <AnimatePresence mode="wait">
                            {jobProgress !== null ? (
                                <motion.div
                                    key="progress"
                                    className="absolute inset-0 flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                     <div className="w-full h-full bg-transparent overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-gradient-to-r from-sky-400 to-green-500 animate-shimmer-effect" 
                                            style={{width: `${Math.min(jobProgress, 100)}%`}}
                                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                                        />
                                    </div>
                                    <span className="absolute inset-0 flex items-center justify-center text-white dark:text-black text-xs font-bold text-shadow-sm">
                                        Exporting... ({Math.round(Math.min(jobProgress, 100))}%)
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="title"
                                    className="absolute inset-0 flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <p className="font-bold text-white dark:text-black truncate text-sm leading-tight text-shadow-sm">{book.title}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right: planning navigation or save status */}
                {renderRightContent()}
            </div>
        </motion.footer>
    );
};

export default EditorFooter;
