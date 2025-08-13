
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Book, Version, Theme, Chapter } from '../../../types';
import { SunIcon, MoonIcon, ChevronDownIcon, TrashIcon, UserIcon, MagnifyingGlassIcon, Squares2X2Icon, GlobeAltIcon, PencilIcon, CogIcon, ComputerDesktopIcon, Bars3BottomLeftIcon, SparklesIcon, PlusIcon, DocumentIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ChapterSettingsModal from './ChapterSettingsModal';
import { useToolWindowStore } from '../../../stores/toolWindowStore';
import { useBookContext, useCurrentBookAndVersion } from '../../../contexts/BookContext';
import { useAuthStore } from '../../../auth';
import { appLog } from '../../../auth/fileLogger';
import { useChapterNavigation, getNextChapter, getPreviousChapter } from '../../../hooks/useChapterNavigation';

const DropdownMenu: React.FC<{ trigger: React.ReactNode; children: React.ReactNode; className?: string }> = ({ trigger, children, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <div className="flex items-center">
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-full right-0 mt-2 w-48 bg-gradient-to-br from-gray-800 to-black dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-lg p-2 z-50 border border-gray-700/50 dark:border-gray-200/50 ${className}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChapterProgressBar: React.FC<{ 
    book: Book, 
    chapters: Chapter[], 
    currentChapter?: Chapter,
    onOpenSettings: () => void, 
    onOpenTypographySettings: () => void,
    onCreateChapter?: (title: string, actId?: string) => Promise<void>,
    onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => Promise<void>,
    onDeleteChapter?: (chapterId: string) => Promise<void>,
    onCreateAct?: (title: string) => Promise<void>,
    onDeleteAct?: (actId: string) => Promise<void>,
    onReorderChapter?: (chapterId: string, newPosition: number, newActId?: string) => Promise<void>,
    onNavigateToChapter?: (chapterId: string) => void
}> = ({ 
    book, 
    chapters, 
    currentChapter,
    onOpenSettings, 
    onOpenTypographySettings, 
    onCreateChapter, 
    onUpdateChapter,
    onDeleteChapter,
    onCreateAct,
    onDeleteAct,
    onNavigateToChapter
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isChapterSettingsOpen, setChapterSettingsOpen] = useState(false);
    const [selectedChapterForSettings, setSelectedChapterForSettings] = useState<Chapter | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const { bookId, versionId } = useCurrentBookAndVersion();

    // Use the chapter navigation hook for better organization
    const navigationData = useChapterNavigation(bookId, versionId, chapters, currentChapter);

    // Ensure chapters is always an array and sort by position
    const safeChapters = (chapters || []).sort((a, b) => a.position - b.position);

    // Use navigation data for structure, but keep fallback for backward compatibility
    const displayStructure = navigationData.acts.length > 0 
      ? navigationData.acts.reduce((acc, act) => {
          acc[act.id] = {
            name: act.name,
            chapters: act.chapters
          };
          return acc;
        }, {} as Record<string, { name: string; chapters: Chapter[] }>)
      : {
          'act-1': { name: 'Act I', chapters: [] },
          'act-2': { name: 'Act II', chapters: [] },
          'act-3': { name: 'Act III', chapters: [] }
        };

    // Use navigation data for completion percentage
    const chapterCompletion = navigationData.completionPercentage;

    const handleCreateChapterInAct = async (actId: string) => {
        const title = prompt('Enter chapter title:');
        if (title?.trim() && onCreateChapter) {
            await onCreateChapter(title.trim(), actId);
        }
    };

    const handleCreateNewAct = async () => {
        const title = prompt('Enter act title:');
        if (title?.trim() && onCreateAct) {
            await onCreateAct(title.trim());
        }
    };

    const handleDeleteAct = async (actId: string) => {
        const actChapters = displayStructure[actId]?.chapters || [];
        if (actChapters.length > 0) {
            const confirmed = confirm(`This act contains ${actChapters.length} chapter(s). They will be moved to the next act. Continue?`);
            if (!confirmed) return;
        } else {
            const confirmed = confirm('Are you sure you want to delete this act?');
            if (!confirmed) return;
        }
        
        if (onDeleteAct) {
            await onDeleteAct(actId);
        }
    };

    const handleOpenChapterSettings = (chapter: Chapter) => {
        setSelectedChapterForSettings(chapter);
        setChapterSettingsOpen(true);
    };

    const handleUpdateChapterFromModal = async (chapterId: string, updates: Partial<Chapter>) => {
        if (onUpdateChapter) {
            await onUpdateChapter(chapterId, updates);
        }
        setChapterSettingsOpen(false);
        setSelectedChapterForSettings(null);
    };

    const handleDeleteChapter = async (chapter: Chapter) => {
        const confirmed = confirm(`Are you sure you want to delete "${chapter.title}"?`);
        if (confirmed && onDeleteChapter) {
            await onDeleteChapter(chapter.id);
        }
    };

    const getCurrentChapterDisplay = () => {
        if (currentChapter) {
            return currentChapter.title;
        }
        
        // Show first chapter if available
        const firstChapter = safeChapters[0];
        if (firstChapter) {
            return firstChapter.title;
        }
        
        return 'No chapters yet';
    };

    return (
        <div className="relative group w-full" ref={triggerRef}>
            <div className="relative w-full h-10 bg-gradient-to-br from-black to-gray-800 dark:from-gray-50 dark:to-slate-200 rounded-full overflow-hidden border border-gray-700 dark:border-gray-300 shadow-inner">
                 <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-300 via-teal-400 to-emerald-500 bg-[length:200%_200%] animate-shimmer-effect"
                    initial={{ width: '0%' }}
                    animate={{ width: `${chapterCompletion}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                  />
                <div className="absolute inset-0 flex items-center justify-between px-2 text-white dark:text-black">
                    <motion.button 
                        onClick={onOpenSettings} 
                        className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors z-10"
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                        <CogIcon className="h-5 w-5" />
                    </motion.button>

                    {/* Enhanced Chapter Navigation */}
                    <div className="flex-grow flex items-center justify-center gap-3 min-w-0">
                        {/* Previous Chapter Button */}
                        {(() => {
                            const prevChapter = getPreviousChapter(chapters, currentChapter);
                            return (
                                <motion.button
                                    onClick={() => prevChapter && onNavigateToChapter?.(prevChapter.id)}
                                    disabled={!prevChapter}
                                    className={`p-1 rounded-full transition-colors ${
                                        prevChapter 
                                            ? 'text-white/70 dark:text-black/70 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/10' 
                                            : 'text-white/30 dark:text-black/30 cursor-not-allowed'
                                    }`}
                                    whileHover={prevChapter ? { scale: 1.1 } : {}}
                                    whileTap={prevChapter ? { scale: 0.95 } : {}}
                                    title={prevChapter ? `Previous: ${prevChapter.title}` : 'No previous chapter'}
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                </motion.button>
                            );
                        })()}

                        {/* Chapter Progress Dots */}
                        <div className="flex items-center gap-1 max-w-64 overflow-x-auto">
                            {navigationData.acts.map((act, actIndex) => (
                                <div key={act.id} className="flex items-center gap-1">
                                    {actIndex > 0 && (
                                        <div className="w-1 h-px bg-white/20 dark:bg-black/20 mx-1" />
                                    )}
                                    {act.chapters.map((chapter) => {
                                        const isCurrentChapter = currentChapter?.id === chapter.id;
                                        const isCompleted = chapter.isComplete;
                                        
                                        return (
                                            <motion.button
                                                key={chapter.id}
                                                onClick={() => onNavigateToChapter?.(chapter.id)}
                                                className={`relative w-2 h-2 rounded-full transition-all ${
                                                    isCurrentChapter
                                                        ? 'bg-white dark:bg-black ring-1 ring-white/50 dark:ring-black/50'
                                                        : isCompleted
                                                        ? 'bg-green-400 hover:bg-green-300'
                                                        : 'bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50'
                                                }`}
                                                whileHover={{ scale: 1.5 }}
                                                whileTap={{ scale: 0.9 }}
                                                title={`${chapter.title} ${isCompleted ? '(Complete)' : '(In Progress)'}`}
                                            >
                                                {isCurrentChapter && (
                                                    <motion.div
                                                        className="absolute inset-0 bg-white dark:bg-black rounded-full"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                                    />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Next Chapter Button */}
                        {(() => {
                            const nextChapter = getNextChapter(chapters, currentChapter);
                            return (
                                <motion.button
                                    onClick={() => nextChapter && onNavigateToChapter?.(nextChapter.id)}
                                    disabled={!nextChapter}
                                    className={`p-1 rounded-full transition-colors ${
                                        nextChapter 
                                            ? 'text-white/70 dark:text-black/70 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/10' 
                                            : 'text-white/30 dark:text-black/30 cursor-not-allowed'
                                    }`}
                                    whileHover={nextChapter ? { scale: 1.1 } : {}}
                                    whileTap={nextChapter ? { scale: 0.95 } : {}}
                                    title={nextChapter ? `Next: ${nextChapter.title}` : 'No next chapter'}
                                >
                                    <ChevronRightIcon className="w-4 h-4" />
                                </motion.button>
                            );
                        })()}

                        {/* Current Chapter Title and Counter */}
                        <div className="flex items-center gap-2 min-w-0">
                            <div onClick={() => setIsOpen(!isOpen)} className="flex items-center cursor-pointer min-w-0">
                                <p className="font-bold truncate text-sm leading-tight text-shadow-sm">
                                    <span className="mr-2">{book.title}:</span>
                                    <span className="font-normal opacity-80">
                                        {getCurrentChapterDisplay()}
                                    </span>
                                </p>
                            </div>
                            <div className="text-xs text-white/60 dark:text-black/60 whitespace-nowrap">
                                {navigationData.currentChapterIndex >= 0 ? navigationData.currentChapterIndex + 1 : 0} / {navigationData.totalChapters}
                            </div>
                        </div>
                    </div>

                    <motion.button 
                        onClick={() => {
                            onOpenTypographySettings();
                        }}
                        className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors z-10"
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        title="Typography & Formatting Settings"
                    >
                        <Bars3BottomLeftIcon className="h-5 w-5" />
                    </motion.button>
                    <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors z-10">
                        <ChevronDownIcon className="h-5 w-5 flex-shrink-0" />
                    </button>
                </div>
            </div>
            <AnimatePresence>
            {isOpen && (
                 <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full -translate-x-1/2 mt-2 w-[30rem] bg-gradient-to-br from-black to-gray-800 dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-lg p-2 z-50 border border-gray-700/50 dark:border-gray-200/50 max-h-80 overflow-y-auto no-scrollbar"
                 >
                     {Object.entries(displayStructure).map(([actId, actData]) => (
                         <div key={actId} className="mb-1">
                             <div className="flex items-center justify-between px-2 py-1 group/act">
                                <div className="flex items-center gap-2">
                                    <Bars3BottomLeftIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-grab" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{actData.name}</h4>
                                </div>
                                <div className="opacity-0 group-hover/act:opacity-100 transition-opacity">
                                    <DropdownMenu 
                                        className="w-56"
                                        trigger={<button className="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:bg-white/10 dark:hover:bg-black/10 hover:text-white dark:hover:text-black"><CogIcon className="w-4 h-4"/></button>}
                                    >
                                        <button 
                                            onClick={() => handleCreateChapterInAct(actId)}
                                            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            Add New Chapter
                                        </button>
                                        <button className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">
                                            <DocumentIcon className="w-4 h-4" />
                                            Import Chapter
                                        </button>
                                        <button 
                                            onClick={handleCreateNewAct}
                                            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            Add New Act
                                        </button>
                                        <div className="my-1 h-px bg-gray-600 dark:bg-gray-300/50"></div>
                                        <button 
                                            onClick={() => handleDeleteAct(actId)}
                                            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-red-400 dark:text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/20"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            Delete Act
                                        </button>
                                    </DropdownMenu>
                                </div>
                             </div>
                             {actData.chapters.map(chapter => (
                                 <div key={chapter.id} className={`group/chapter flex items-center justify-between pl-8 pr-2 py-1.5 text-sm rounded-md hover:bg-white/10 dark:hover:bg-black/10 cursor-pointer ${
                                     currentChapter?.id === chapter.id ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'text-gray-300 dark:text-gray-700'
                                 }`}>
                                     <span className="flex-1 truncate">{chapter.title}</span>
                                     <div className="flex items-center gap-1 opacity-0 group-hover/chapter:opacity-100 transition-opacity">
                                        <button 
                                            className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/20"
                                            title="Reorder Chapter"
                                        >
                                            <Bars3BottomLeftIcon className="w-4 h-4 text-gray-400 dark:text-gray-500"/>
                                        </button>
                                        <button 
                                            onClick={() => handleOpenChapterSettings(chapter)}
                                            className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/20"
                                            title="Chapter Settings"
                                        >
                                            <CogIcon className="w-4 h-4 text-gray-400 dark:text-gray-500"/>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteChapter(chapter)}
                                            className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/20"
                                            title="Delete Chapter"
                                        >
                                            <TrashIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-500"/>
                                        </button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     ))}
                 </motion.div>
            )}
            </AnimatePresence>
            <AnimatePresence>
                {isChapterSettingsOpen && selectedChapterForSettings && (
                    <ChapterSettingsModal
                        isOpen={isChapterSettingsOpen}
                        onClose={() => {
                            setChapterSettingsOpen(false);
                            setSelectedChapterForSettings(null);
                        }}
                        chapter={selectedChapterForSettings}
                        onUpdateChapter={handleUpdateChapterFromModal}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};


const EditorTab: React.FC<{ name: string; isActive: boolean; onClick: () => void; className?: string; }> = ({ name, isActive, onClick, className }) => {
    return (
      <button
        onClick={onClick}
        className={`group relative px-4 py-2 text-sm font-medium transition-colors rounded-full focus:outline-none ${className}`}
      >
        <span className={`relative z-10 transition-colors ${
          isActive
            ? 'text-white dark:text-black'
            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
        }`}>
          {name}
        </span>
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-black dark:bg-white rounded-full"
            layoutId="editorHeaderTabPill"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </button>
    );
};

// Separate component for World Building header to use hooks properly
const WorldBuildingHeader: React.FC<{
    searchQuery: string;
    onSearchChange: (query: string) => void;
}> = ({ searchQuery, onSearchChange }) => {
    const { bookId, versionId } = useCurrentBookAndVersion();
    const { getWorlds, selectedWorldId, setSelectedWorldId } = useBookContext();
    const [isWorldSelectorOpen, setIsWorldSelectorOpen] = useState(false);
    
    const worlds = bookId && versionId ? getWorlds(bookId, versionId) : [];
    const selectedWorld = worlds.find(w => w.id === selectedWorldId);
    
    return (
        <div className="relative w-full h-10 bg-gradient-to-br from-black to-gray-800 dark:from-gray-50 dark:to-slate-200 rounded-full overflow-visible border border-gray-700 dark:border-gray-300 shadow-inner">
            <div className="absolute inset-0 flex items-center justify-between px-4 text-white dark:text-black">
                <div className="flex items-center gap-3 flex-1 mr-4">
                    <MagnifyingGlassIcon className="h-4 w-4 text-white/70 dark:text-black/70" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search locations, objects, lore, magic systems..."
                        className="bg-transparent border-none outline-none text-sm placeholder-white/50 dark:placeholder-black/50 text-white dark:text-black flex-1 min-w-0"
                    />
                </div>
                
                {/* World Selector and Create World Button */}
                <div className="flex items-center gap-2">
                    {/* Create World Button - Always visible */}
                    <motion.button
                        onClick={() => {
                            // Dispatch a custom event that WorldBuildingBoard can listen to
                            window.dispatchEvent(new CustomEvent('triggerCreateWorld'));
                        }}
                        className="flex items-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Create New World"
                    >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-xs">Create</span>
                    </motion.button>

                    {/* World Selector - Only show when worlds exist */}
                    {worlds.length > 0 && (
                        <div className="relative">
                            <motion.button
                                onClick={() => setIsWorldSelectorOpen(!isWorldSelectorOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <GlobeAltIcon className="h-4 w-4" />
                                <span className="text-xs max-w-24 truncate">{selectedWorld?.name || 'Select World'}</span>
                                <ChevronDownIcon className="h-4 w-4" />
                            </motion.button>

                            <AnimatePresence>
                                {isWorldSelectorOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-64 bg-gradient-to-br from-gray-800 to-black dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-xl border border-gray-600 dark:border-gray-300 z-50"
                                    >
                                        <div className="p-2">
                                            {worlds.map((world) => (
                                                <motion.button
                                                    key={world.id}
                                                    onClick={() => {
                                                        setSelectedWorldId(world.id);
                                                        setIsWorldSelectorOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                                        selectedWorldId === world.id
                                                            ? 'bg-green-500 text-white'
                                                            : 'text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10'
                                                    }`}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className="font-medium">{world.name}</div>
                                                    <div className="text-xs opacity-70 truncate">{world.description}</div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PlanningHeader: React.FC<{
    activePlanningTab: string;
    planningLayout: string;
    planningSubview: string;
    onPlanningLayoutChange: (layout: string) => void;
    onPlanningSubviewChange: (subview: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}> = ({ activePlanningTab, searchQuery, onSearchChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Always declare hooks at the top level
    const [isLayoutOpen, setIsLayoutOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Handle click outside for layout dropdown - only active when Plot Arcs tab is selected
    useEffect(() => {
        if (activePlanningTab !== 'Plot Arcs') {
            setIsLayoutOpen(false); // Reset dropdown state when not on Plot Arcs
            return;
        }
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
                setIsLayoutOpen(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activePlanningTab]);
    
    // Only show layout controls for Plot Arcs
    if (activePlanningTab === 'Plot Arcs') {

        // Layout definitions matching PlotArcsBoard
        const layoutOptions = [
            {
                category: 'Outline Layouts',
                items: [
                    { id: 'narrative', label: 'Narrative Layout', description: 'Hierarchical story structure view' },
                    { id: 'character-screentime', label: 'Character Screen Time', description: 'Character presence analysis' },
                    { id: 'location-screentime', label: 'Location Screen Time', description: 'Location usage analysis' },
                    { id: 'object-screentime', label: 'Object Screen Time', description: 'Object appearance frequency' },
                    { id: 'lore-screentime', label: 'Lore Screen Time', description: 'Lore element frequency' }
                ]
            },
            {
                category: 'Character Layouts',
                items: [
                    { id: 'character-progression', label: 'Character Progression', description: 'Character development arcs' },
                    { id: 'character-heatmap', label: 'Character Appearance Heat Map', description: 'Visual character frequency' },
                    { id: 'character-journey', label: 'Character Journey', description: 'Character path through story' },
                    { id: 'character-possession', label: 'Character Possession Arc', description: 'Character asset relationships' }
                ]
            },
            {
                category: 'World Entity Layouts',
                items: [
                    { id: 'location-heatmap', label: 'Location Appearance Heat Map', description: 'Visual location frequency matrix' },
                    { id: 'object-heatmap', label: 'Object Appearance Heat Map', description: 'Visual object frequency matrix' },
                    { id: 'lore-heatmap', label: 'Lore Appearance Heat Map', description: 'Visual lore frequency matrix' }
                ]
            },
            {
                category: 'World Layouts',
                items: [
                    { id: 'world-map', label: 'World Map Layout', description: 'Spatial story relationships' },
                    { id: 'world-affinity', label: 'World Affinity Layout', description: 'Location relationship mapping' }
                ]
            },
            {
                category: 'Lore & Symbolic Layouts',
                items: [
                    { id: 'lore-web', label: 'Lore Web Layout', description: 'Knowledge interconnections' },
                    { id: 'symbolic-connections', label: 'Symbolic Connections Layout', description: 'Thematic element links' }
                ]
            },
            {
                category: 'Themes & Analytical Layouts',
                items: [
                    { id: 'emotional-arc', label: 'Emotional Arc Layout', description: 'Story emotional progression' },
                    { id: 'pacing-layout', label: 'Pacing Layout', description: 'Story rhythm analysis' }
                ]
            }
        ];

        // Get current layout from URL params
        const currentLayout = new URLSearchParams(location.search).get('layout') || 'narrative';
        const currentLayoutItem = layoutOptions
            .flatMap(category => category.items)
            .find(item => item.id === currentLayout) || layoutOptions[0].items[0];

        // Handle layout change by updating URL params
        const handleLayoutChange = (layoutId: string) => {
            const params = new URLSearchParams(location.search);
            params.set('layout', layoutId);
            navigate({
                pathname: location.pathname,
                search: params.toString(),
                hash: location.hash
            }, { replace: true });
            setIsLayoutOpen(false);
        };

        return (
            <div className="relative w-full h-10 bg-gradient-to-br from-black to-gray-800 dark:from-gray-50 dark:to-slate-200 rounded-full overflow-visible border border-gray-700 dark:border-gray-300 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-between px-4 text-white dark:text-black">
                    {/* Left: Search Bar */}
                    <div className="flex items-center gap-3 flex-1 mr-4">
                        <MagnifyingGlassIcon className="h-4 w-4 text-white/70 dark:text-black/70" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search for Scenes, Characters, events..."
                            className="bg-transparent border-none outline-none text-sm placeholder-white/50 dark:placeholder-black/50 text-white dark:text-black flex-1 min-w-0"
                        />
                    </div>

                    {/* Right: Layout Selector */}
                    <div className="relative" ref={dropdownRef}>
                        <motion.button
                            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Squares2X2Icon className="h-4 w-4" />
                            <span className="text-xs max-w-24 truncate">{currentLayoutItem.label}</span>
                            <ChevronDownIcon className="h-4 w-4" />
                        </motion.button>

                        <AnimatePresence>
                            {isLayoutOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full right-0 mt-2 w-[30rem] bg-gradient-to-br from-black to-gray-800 dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-lg p-2 z-50 border border-gray-700/50 dark:border-gray-200/50 max-h-80 overflow-y-auto no-scrollbar"
                                >
                                    {layoutOptions.map((category) => (
                                        <div key={category.category} className="mb-1">
                                            <div className="flex items-center justify-between px-2 py-1 group/category">
                                                <div className="flex items-center gap-2">
                                                    <Bars3BottomLeftIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-grab" />
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{category.category}</h4>
                                                </div>
                                            </div>
                                            {category.items.map((item) => (
                                                <motion.button
                                                    key={item.id}
                                                    onClick={() => handleLayoutChange(item.id)}
                                                    className={`group/layout flex items-center justify-between pl-8 pr-2 py-1.5 text-sm rounded-md w-full text-left transition-colors ${
                                                        currentLayout === item.id 
                                                            ? 'bg-blue-500/20 text-blue-200 dark:text-blue-700' 
                                                            : 'text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10'
                                                    }`}
                                                    whileHover={{ x: 4 }}
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium truncate">
                                                            {item.label}
                                                        </span>
                                                        <span className="text-xs opacity-70 truncate">
                                                            {item.description}
                                                        </span>
                                                    </div>
                                                    {currentLayout === item.id && (
                                                        <div className="w-2 h-2 bg-blue-400 rounded-full ml-2 flex-shrink-0"></div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    }

    // For World Building page - search + world selector
    if (activePlanningTab === 'World Building') {
        return (
            <WorldBuildingHeader 
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
            />
        );
    }

    // For Characters page - simple search
    if (activePlanningTab === 'Characters') {
        return (
            <div className="relative w-full h-10 bg-gradient-to-br from-black to-gray-800 dark:from-gray-50 dark:to-slate-200 rounded-full overflow-visible border border-gray-700 dark:border-gray-300 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-between px-4 text-white dark:text-black">
                    <div className="flex items-center gap-3 flex-1">
                        <MagnifyingGlassIcon className="h-4 w-4 text-white/70 dark:text-black/70" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search characters, relationships, arcs..."
                            className="bg-transparent border-none outline-none text-sm placeholder-white/50 dark:placeholder-black/50 text-white dark:text-black flex-1 min-w-0"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

interface EditorHeaderProps {
    book: Book;
    version: Version;
    chapters?: Chapter[];
    currentChapter?: Chapter;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onOpenTypographySettings: () => void;
    activeMode: string;
    setActiveMode: (mode: string) => void;
    activePlanningTab?: string;
    planningLayout?: string;
    planningSubview?: string;
    onPlanningLayoutChange?: (layout: string) => void;
    onPlanningSubviewChange?: (subview: string) => void;
    planningSearchQuery?: string;
    onPlanningSearchChange?: (query: string) => void;
    onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => Promise<void>;
    onCreateChapter?: (title: string, actId?: string) => Promise<void>;
    onDeleteChapter?: (chapterId: string) => Promise<void>;
    onCreateAct?: (title: string) => Promise<void>;
    onDeleteAct?: (actId: string) => Promise<void>;
    onReorderChapter?: (chapterId: string, newPosition: number, newActId?: string) => Promise<void>;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ 
    book, 
    version, 
    chapters = [],
    currentChapter,
    theme, 
    setTheme, 
    onOpenTypographySettings, 
    activeMode, 
    setActiveMode,
    activePlanningTab = 'Plot Arcs',
    planningLayout = 'Plot Layout',
    planningSubview = 'by character',
    onPlanningLayoutChange,
    onPlanningSubviewChange,
    planningSearchQuery = '',
    onPlanningSearchChange,
    onUpdateChapter,
    onCreateChapter,
    onDeleteChapter,
    onCreateAct,
    onDeleteAct,
    onReorderChapter
}) => {
    const [isChapterSettingsOpen, setChapterSettingsOpen] = useState(false);
    const { openTool, broadcastThemeChange } = useToolWindowStore();
    const { logout } = useAuthStore();

    const handleOpenTool = async (toolName: string) => {
        try {
            appLog.info('editor-header', `Opening tool: ${toolName} for book ${book.id}, version ${version.id} with theme ${theme}`);
            await openTool(toolName, book.id, version.id, theme);
        } catch (error) {
            appLog.error('editor-header', `Failed to open ${toolName}`, error);
        }
    };

    const handleThemeChange = async (newTheme: Theme) => {
        setTheme(newTheme);
        await broadcastThemeChange(newTheme);
    };

    const handleLogout = async () => {
        try {
            await appLog.info('editor-header', 'Starting logout process...');
            await logout();
            await appLog.success('editor-header', 'Logout successful');
            // No need to navigate as logout will reload the page
        } catch (error) {
            await appLog.error('editor-header', 'Logout failed', error);
        }
    };

    return (
        <header className="sticky top-0 z-40 flex-shrink-0">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center h-20">
                    <div className="flex justify-start">
                         <Link to={`/book/${book.id}`} className="flex items-center gap-2 cursor-pointer">
                            <PencilIcon className="h-6 w-6 text-gray-900 dark:text-white"/>
                            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                AuthorStudio
                            </h1>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center justify-center">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-4">
                            <div className="flex gap-2 justify-end">
                                <EditorTab name="Writing" isActive={activeMode === 'Writing'} onClick={() => setActiveMode('Writing')} />
                                <EditorTab name="Planning" isActive={activeMode === 'Planning'} onClick={() => setActiveMode('Planning')} />
                            </div>

                            <div className="w-[32rem]">
                                {activeMode === 'Planning' ? (
                                    <PlanningHeader
                                        activePlanningTab={activePlanningTab}
                                        planningLayout={planningLayout}
                                        planningSubview={planningSubview}
                                        onPlanningLayoutChange={onPlanningLayoutChange || (() => {})}
                                        onPlanningSubviewChange={onPlanningSubviewChange || (() => {})}
                                        searchQuery={planningSearchQuery}
                                        onSearchChange={onPlanningSearchChange || (() => {})}
                                    />
                                ) : (
                                    <ChapterProgressBar 
                                        book={book} 
                                        chapters={chapters}
                                        currentChapter={currentChapter}
                                        onOpenSettings={() => setChapterSettingsOpen(true)}
                                        onOpenTypographySettings={onOpenTypographySettings}
                                        onCreateChapter={onCreateChapter}
                                        onUpdateChapter={onUpdateChapter}
                                        onDeleteChapter={onDeleteChapter}
                                        onCreateAct={onCreateAct}
                                        onDeleteAct={onDeleteAct}
                                        onReorderChapter={onReorderChapter}
                                    />
                                )}
                            </div>

                            <div className="flex gap-2 justify-start">
                                <EditorTab name="Formatting" isActive={activeMode === 'Formatting'} onClick={() => setActiveMode('Formatting')} />
                                <EditorTab name="Brainstorming" isActive={activeMode === 'Brainstorming'} onClick={() => setActiveMode('Brainstorming')} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <div className="flex items-center gap-4 flex-shrink-0">
                            {/* Tools Menu */}
                            <DropdownMenu trigger={
                                <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
                                    <SparklesIcon className="h-5 w-5" />
                                    <span className="text-sm font-medium">Tools</span>
                                </button>
                            }>
                                <button 
                                    onClick={() => handleOpenTool('name-generator')}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                >
                                    <SparklesIcon className="h-4 w-4" />
                                    Name Generator
                                </button>
                                <button 
                                    onClick={() => handleOpenTool('character-tracker')}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                >
                                    <UserIcon className="h-4 w-4" />
                                    Character Profile Builder
                                </button>
                            </DropdownMenu>

                             <DropdownMenu trigger={<button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">{theme === 'dark' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}</button>}>
                                <button onClick={() => handleThemeChange('light')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <SunIcon className="h-4 w-4"/> Light</button>
                                <button onClick={() => handleThemeChange('dark')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <MoonIcon className="h-4 w-4"/> Dark</button>
                                <button onClick={() => handleThemeChange('system')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <ComputerDesktopIcon className="h-4 w-4"/> System</button>
                            </DropdownMenu>

                            <DropdownMenu trigger={<img src="https://picsum.photos/seed/user/40/40" alt="User Avatar" className="w-9 h-9 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900 ring-transparent hover:ring-purple-500 transition-all"/>}>
                                <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">My Account</a>
                                <button 
                                    onClick={handleLogout}
                                    className="w-full text-left block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                >
                                    Logout
                                </button>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
             </div>
             <AnimatePresence>
                {isChapterSettingsOpen && (
                    <ChapterSettingsModal
                        isOpen={isChapterSettingsOpen}
                        onClose={() => setChapterSettingsOpen(false)}
                        chapter={currentChapter}
                        onUpdateChapter={onUpdateChapter}
                    />
                )}
            </AnimatePresence>
        </header>
    );
};

export default EditorHeader;
