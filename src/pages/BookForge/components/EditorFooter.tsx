
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../../../types';
import ChapterRevisionPanel from '../../../components/ChapterRevisionPanel';
import RevisionDiffModal from '../../../components/RevisionDiffModal';
import { readRevisionSnapshot, createChapterRevision } from '../../../services/revisionStorage';
import { encryptionService } from '../../../services/encryptionService';
import { CloudIcon, HardDriveIcon } from '../../../constants';
import { useJobsStore } from '../../../stores/jobs';
import JobsPopup from '../../../components/JobsPopup';

type SaveStatus = 'saved' | 'saving' | 'unsaved';

interface EditorFooterProps {
    book: Book;
    mode?: string;
    activePlanningTab?: string;
    onPlanningNavigation?: (tab: 'Plot Arcs' | 'World Building' | 'Characters') => void;
    // Chapter management props
    currentChapterId?: string;
    currentVersionId?: string;
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
    currentVersionId,
    chapterSyncState = 'idle',
    chapterWordCount = 0,
    chapterCharCount = 0,
    onSaveToLocal,
    onSyncToCloud,
    onSquashRevisions
}) => {
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [jobsOpen, setJobsOpen] = useState(false);
    const [isSaveMenuOpen, setSaveMenuOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRevisionOpen, setRevisionOpen] = useState(false);
    const [diffOpen, setDiffOpen] = useState(false);
    const [diffRight, setDiffRight] = useState<any>(null);
    const [diffLeft, setDiffLeft] = useState<any>(null);

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

    // Jobs aggregation: compute overall progress when any jobs are running
    // Select raw jobs array to keep snapshot stable; derive running jobs locally
    const jobs = useJobsStore((s) => s.jobs);
    const runningJobs = useMemo(() => jobs.filter(j => j.status === 'running' || j.status === 'queued'), [jobs]);
    const aggregateProgress = useMemo(() => {
        if (!runningJobs.length) return null;
        const avg = runningJobs.reduce((a, j) => a + (j.progress || 0), 0) / runningJobs.length;
        return avg;
    }, [runningJobs]);

    // Open popup on external event (e.g., when a job starts)
    useEffect(() => {
        const open = () => setJobsOpen(true);
        window.addEventListener('jobs:openPopup', open as any);
        return () => window.removeEventListener('jobs:openPopup', open as any);
    }, []);

    // Compare handler invoked by panel directly
    const openCompare = async (revisionId: string) => {
        if (!book?.id || !currentChapterId || !revisionId) return;
        try {
            const { content } = await readRevisionSnapshot(book.id, currentChapterId, revisionId);
            setDiffRight(content);
            const current = (window as any).__currentChapterJSON || {};
            setDiffLeft(current);
            setDiffOpen(true);
        } catch (err) {
            console.error('Failed to open compare:', err);
        }
    };

    // Close menus/modals on ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSaveMenuOpen(false);
                setRevisionOpen(false);
                setDiffOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);


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
                        onClick={() => setRevisionOpen(!isRevisionOpen)}
                        disabled={!currentChapterId}
                        className="px-3 py-1 text-xs font-medium rounded-lg transition-colors text-white/70 dark:text-black/70 hover:bg-white/10 dark:hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Revisions
                    </button>
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
                        {isRevisionOpen && currentChapterId && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full right-14 mb-2 w-80 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-slate-50 dark:to-slate-100 rounded-lg shadow-lg p-3 z-50 border border-gray-600/50 dark:border-gray-300/50"
                            >
                                <ChapterRevisionPanel bookId={book.id} versionId={currentVersionId || ''} chapterId={currentChapterId} />
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
                    onClick={() => setRevisionOpen(!isRevisionOpen)}
                    disabled={!currentChapterId}
                    className="mr-3 text-xs text-white/70 dark:text-black/70 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Revisions
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
                                disabled={isSyncing || !onSyncToCloud || chapterSyncState !== 'dirty'}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            > 
                                <CloudIcon className="h-4 w-4"/> 
                                {isSyncing && onSyncToCloud ? 'Syncing...' : 'Sync to Cloud'}
                            </button>
                        </motion.div>
                    )}
                    {isRevisionOpen && currentChapterId && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-14 mb-2 w-80 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-slate-50 dark:to-slate-100 rounded-lg shadow-lg p-3 z-50 border border-gray-600/50 dark:border-gray-300/50"
                        >
                            <ChapterRevisionPanel bookId={book.id} versionId={currentVersionId || ''} chapterId={currentChapterId} onCompare={openCompare} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <RevisionDiffModal
                    open={diffOpen}
                    onClose={() => setDiffOpen(false)}
                    leftDoc={diffLeft}
                    rightDoc={diffRight}
                    onApplyAll={async (merged) => {
                        try {
                            if (!currentChapterId || !currentVersionId) return;
                            const userId = (window as any)?.__authUser?.id || 'default_user';
                            const newHead = `rev_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
                            await encryptionService.saveChapterContent(currentChapterId, book.id, currentVersionId, userId, merged, false, { revisionId: newHead, isMinor: false, setHead: true });
                            await createChapterRevision(book.id, currentChapterId, merged, { authorId: userId, contentProtected: true, revisionId: newHead });
                            (window as any).__currentChapterJSON = merged;
                            setDiffOpen(false);
                        } catch (e) {
                            console.error('Failed to apply all and save merged revision', e);
                        }
                    }}
                    onCreateRevision={async (merged) => {
                        try {
                            if (!currentChapterId || !currentVersionId) return;
                            const userId = (window as any)?.__authUser?.id || 'default_user';
                            const newHead = `rev_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
                            await encryptionService.saveChapterContent(currentChapterId, book.id, currentVersionId, userId, merged, false, { revisionId: newHead, isMinor: false, setHead: true });
                            await createChapterRevision(book.id, currentChapterId, merged, { authorId: userId, contentProtected: true, revisionId: newHead });
                            (window as any).__currentChapterJSON = merged;
                            setDiffOpen(false);
                        } catch (e) {
                            console.error('Failed to create new revision from merged content', e);
                        }
                    }}
                    onApplyBlock={async (merged) => {
                        try {
                            if (!currentChapterId || !currentVersionId) return;
                            const userId = (window as any)?.__authUser?.id || 'default_user';
                            const newHead = `rev_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
                            await encryptionService.saveChapterContent(currentChapterId, book.id, currentVersionId, userId, merged, false, { revisionId: newHead, isMinor: false, setHead: true });
                            await createChapterRevision(book.id, currentChapterId, merged, { authorId: userId, contentProtected: true, revisionId: newHead });
                            (window as any).__currentChapterJSON = merged;
                        } catch (e) {
                            console.error('Failed to apply block change', e);
                        }
                    }}
                />
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
                            {aggregateProgress !== null ? (
                                <motion.div
                                    key="progress"
                                    className="absolute inset-0 flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setJobsOpen(true)}
                                >
                                     <div className="w-full h-full bg-transparent overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-gradient-to-r from-sky-400 to-green-500 animate-shimmer-effect" 
                                            style={{width: `${Math.min(aggregateProgress as number, 100)}%`}}
                                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                                        />
                                    </div>
                                    <span className="absolute inset-0 flex items-center justify-center text-white dark:text-black text-xs font-bold text-shadow-sm">
                                        {runningJobs.length > 1 ? `${runningJobs.length} jobs running` : 'Job running'} ({Math.round(Math.min(aggregateProgress as number, 100))}%)
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="title"
                                    className="absolute inset-0 flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setJobsOpen(true)}
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
            <JobsPopup open={jobsOpen} onClose={() => setJobsOpen(false)} />
        </motion.footer>
    );
};

export default EditorFooter;
