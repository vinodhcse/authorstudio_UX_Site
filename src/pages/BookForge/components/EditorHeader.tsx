
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Book, Version, Theme } from '../../../types';
import { SunIcon, MoonIcon, SystemIcon, ChevronDownIcon, PenIcon, SettingsIcon, GripVerticalIcon, TrashIcon, TypeIcon, Wand2Icon, UserIcon, SearchIcon, LayoutGridIcon, ClockIcon, MapIcon, ViewIcon, GlobeIcon } from '../../../constants';
import ChapterSettingsModal from './ChapterSettingsModal';
import { useToolWindowStore } from '../../../stores/toolWindowStore';
import { useBookContext, useCurrentBookAndVersion } from '../../../contexts/BookContext';

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

const ChapterProgressBar: React.FC<{ book: Book, onOpenSettings: () => void, onOpenTypographySettings: () => void }> = ({ book, onOpenSettings, onOpenTypographySettings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Mock data for acts and chapters
    const structure = {
        'Act I': ['Chapter 1: The Beginning', 'Chapter 2: A New Friend'],
        'Act II': ['Chapter 3: The Discovery', 'Chapter 4: The Challenge', 'Chapter 5: Turning Point'],
        'Act III': ['Chapter 6: The Climax', 'Chapter 7: Resolution', 'Chapter 8: Epilogue', 'Chapter 9: Another Chapter', 'Chapter 10: One More'],
    };

    const chapterCompletion = 25; // mock percentage

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
                        <SettingsIcon className="h-5 w-5" />
                    </motion.button>
                    <div onClick={() => setIsOpen(!isOpen)} className="flex-grow flex items-center justify-center gap-2 cursor-pointer h-full min-w-0">
                        <p className="font-bold truncate text-sm leading-tight text-shadow-sm">
                            <span className="mr-2">{book.title}:</span><span className="font-normal opacity-80">{structure['Act I'][0]}</span>
                        </p>
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
                        <TypeIcon className="h-5 w-5" />
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
                     {Object.entries(structure).map(([act, chapters]) => (
                         <div key={act} className="mb-1">
                             <div className="flex items-center justify-between px-2 py-1 group/act">
                                <div className="flex items-center gap-2">
                                    <GripVerticalIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-grab" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{act}</h4>
                                </div>
                                <div className="opacity-0 group-hover/act:opacity-100 transition-opacity">
                                    <DropdownMenu 
                                        className="w-56"
                                        trigger={<button className="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:bg-white/10 dark:hover:bg-black/10 hover:text-white dark:hover:text-black"><SettingsIcon className="w-4 h-4"/></button>}
                                    >
                                        <a href="#" className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Add New Chapter</a>
                                        <a href="#" className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Import Chapter</a>
                                        <div className="my-1 h-px bg-gray-600 dark:bg-gray-300/50"></div>
                                        <a href="#" className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md text-red-400 dark:text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/20">Delete Act</a>
                                    </DropdownMenu>
                                </div>
                             </div>
                             {chapters.map(chapter => (
                                 <a key={chapter} href="#" className="group/chapter flex items-center justify-between pl-8 pr-2 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">
                                     <span>{chapter}</span>
                                     <div className="flex items-center gap-1 opacity-0 group-hover/chapter:opacity-100 transition-opacity">
                                        <button className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/20"><GripVerticalIcon className="w-4 h-4 text-gray-400 dark:text-gray-500"/></button>
                                        <button className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/20"><SettingsIcon className="w-4 h-4 text-gray-400 dark:text-gray-500"/></button>
                                        <button className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/20"><TrashIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-500"/></button>
                                     </div>
                                 </a>
                             ))}
                         </div>
                     ))}
                 </motion.div>
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
                    <SearchIcon className="h-4 w-4 text-white/70 dark:text-black/70" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search world elements, locations, cultures..."
                        className="bg-transparent border-none outline-none text-sm placeholder-white/50 dark:placeholder-black/50 text-white dark:text-black flex-1 min-w-0"
                    />
                </div>
                
                {/* World Selector or Create World Button */}
                <div className="relative">
                    {worlds.length > 0 ? (
                        <>
                            <motion.button
                                onClick={() => setIsWorldSelectorOpen(!isWorldSelectorOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <GlobeIcon className="h-4 w-4" />
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
                        </>
                    ) : (
                        /* Create World Button when no worlds exist */
                        <motion.button
                            onClick={() => {
                                // This will trigger the world creation modal in WorldBuildingBoard
                                console.log('Create world button clicked');
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-xs">Create World</span>
                        </motion.button>
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
}> = ({ activePlanningTab, planningLayout, planningSubview, onPlanningLayoutChange, onPlanningSubviewChange, searchQuery, onSearchChange }) => {
    const [isLayoutOpen, setIsLayoutOpen] = useState(false);
    const [isSubviewOpen, setIsSubviewOpen] = useState(false);

    // Only show layout controls for Plot Arcs
    if (activePlanningTab === 'Plot Arcs') {
        // Layout-specific configurations for Plot Arcs page
        const getLayoutConfig = () => {
            switch (planningLayout) {
                case 'Plot':
                    return {
                        searchPlaceholder: 'Search for Scenes, Characters, events...',
                        subviews: ['by character', 'world Location', 'world Object', 'timeline event']
                    };
                case 'Character':
                    return {
                        searchPlaceholder: 'Search Characters, their attributes',
                        subviews: ['Timeline Event', 'Relationship Web']
                    };
                case 'World Entity':
                    return {
                        searchPlaceholder: 'Search world objects, location and their attributes...',
                        subviews: ['Timeline Event', 'Locations', 'Object/items', 'Lore']
                    };
                case 'Timeline':
                    return {
                        searchPlaceholder: 'Search timeline events, dates...',
                        subviews: ['Plots', 'Characters', 'World Locations', 'World Object/Items', 'Lore']
                    };
                default:
                    return {
                        searchPlaceholder: 'Search for Scenes, Characters, events...',
                        subviews: ['by character', 'world Location', 'world Object', 'timeline event']
                    };
            }
        };

        const config = getLayoutConfig();

        return (
            <div className="relative w-full h-10 bg-gradient-to-br from-black to-gray-800 dark:from-gray-50 dark:to-slate-200 rounded-full overflow-visible border border-gray-700 dark:border-gray-300 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-between px-4 text-white dark:text-black">
                    {/* Left: Search Bar */}
                    <div className="flex items-center gap-3 flex-1 mr-4">
                        <SearchIcon className="h-4 w-4 text-white/70 dark:text-black/70" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={config.searchPlaceholder}
                            className="bg-transparent border-none outline-none text-sm placeholder-white/50 dark:placeholder-black/50 text-white dark:text-black flex-1 min-w-0"
                        />
                    </div>

                    {/* Right: Layout and Subview Controls */}
                    <div className="flex items-center gap-2">
                        {/* Layout Selector */}
                        <div className="relative">
                            <motion.button
                                onClick={() => setIsLayoutOpen(!isLayoutOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {planningLayout === 'Plot' && <LayoutGridIcon className="h-4 w-4" />}
                                {planningLayout === 'Character' && <UserIcon className="h-4 w-4" />}
                                {planningLayout === 'World Entity' && <MapIcon className="h-4 w-4" />}
                                {planningLayout === 'Timeline' && <ClockIcon className="h-4 w-4" />}
                                <ChevronDownIcon className="h-4 w-4" />
                            </motion.button>

                            <AnimatePresence>
                                {isLayoutOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-48 bg-gradient-to-br from-gray-800 to-black dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-xl border border-gray-600 dark:border-gray-300 z-50"
                                    >
                                        <div className="p-2">
                                            {['Plot', 'Character', 'World Entity', 'Timeline'].map((layout) => (
                                                <motion.button
                                                    key={layout}
                                                    onClick={() => {
                                                        onPlanningLayoutChange(layout);
                                                        // Auto-select first subview when layout changes
                                                        const newConfig = (() => {
                                                            switch (layout) {
                                                                case 'Plot':
                                                                    return { subviews: ['by character', 'world Location', 'world Object', 'timeline event'] };
                                                                case 'Character':
                                                                    return { subviews: ['Timeline Event', 'Relationship Web'] };
                                                                case 'World Entity':
                                                                    return { subviews: ['Timeline Event', 'Locations', 'Object/items', 'Lore'] };
                                                                case 'Timeline':
                                                                    return { subviews: ['Plots', 'Characters', 'World Locations', 'World Object/Items', 'Lore'] };
                                                                default:
                                                                    return { subviews: ['by character', 'world Location', 'world Object', 'timeline event'] };
                                                            }
                                                        })();
                                                        onPlanningSubviewChange(newConfig.subviews[0]);
                                                        setIsLayoutOpen(false);
                                                    }}
                                                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                                                        planningLayout === layout
                                                            ? 'bg-blue-500 text-white'
                                                            : 'text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10'
                                                    }`}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {layout === 'Plot' && <LayoutGridIcon className="h-4 w-4" />}
                                                    {layout === 'Character' && <UserIcon className="h-4 w-4" />}
                                                    {layout === 'World Entity' && <MapIcon className="h-4 w-4" />}
                                                    {layout === 'Timeline' && <ClockIcon className="h-4 w-4" />}
                                                    {layout}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Subview Selector */}
                        <div className="relative">
                            <motion.button
                                onClick={() => setIsSubviewOpen(!isSubviewOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <ViewIcon className="h-4 w-4" />
                                <span className="text-xs">{planningSubview}</span>
                                <ChevronDownIcon className="h-4 w-4" />
                            </motion.button>

                            <AnimatePresence>
                                {isSubviewOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-56 bg-gradient-to-br from-gray-800 to-black dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-xl border border-gray-600 dark:border-gray-300 z-50"
                                    >
                                        <div className="p-2">
                                            {config.subviews.map((subview) => (
                                                <motion.button
                                                    key={subview}
                                                    onClick={() => {
                                                        onPlanningSubviewChange(subview);
                                                        setIsSubviewOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                                        planningSubview === subview
                                                            ? 'bg-blue-500 text-white'
                                                            : 'text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10'
                                                    }`}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {subview}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
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
                        <SearchIcon className="h-4 w-4 text-white/70 dark:text-black/70" />
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
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ 
    book, 
    version, 
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
    onPlanningSearchChange
}) => {
    const [isChapterSettingsOpen, setChapterSettingsOpen] = useState(false);
    const { openTool, broadcastThemeChange } = useToolWindowStore();

    const handleOpenTool = async (toolName: string) => {
        try {
            console.log(`Opening tool: ${toolName} for book ${book.id}, version ${version.id} with theme ${theme}`);
            await openTool(toolName, book.id, version.id, theme);
        } catch (error) {
            console.error(`Failed to open ${toolName}:`, error);
        }
    };

    const handleThemeChange = async (newTheme: Theme) => {
        setTheme(newTheme);
        await broadcastThemeChange(newTheme);
    };

    return (
        <header className="sticky top-0 z-40 flex-shrink-0">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center h-20">
                    <div className="flex justify-start">
                         <Link to={`/book/${book.id}`} className="flex items-center gap-2 cursor-pointer">
                            <PenIcon className="h-6 w-6 text-gray-900 dark:text-white"/>
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
                                        onOpenSettings={() => setChapterSettingsOpen(true)}
                                        onOpenTypographySettings={onOpenTypographySettings}
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
                                    <Wand2Icon className="h-5 w-5" />
                                    <span className="text-sm font-medium">Tools</span>
                                </button>
                            }>
                                <button 
                                    onClick={() => handleOpenTool('name-generator')}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                                >
                                    <Wand2Icon className="h-4 w-4" />
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
                                <button onClick={() => handleThemeChange('system')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <SystemIcon className="h-4 w-4"/> System</button>
                            </DropdownMenu>

                            <DropdownMenu trigger={<img src="https://picsum.photos/seed/user/40/40" alt="User Avatar" className="w-9 h-9 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900 ring-transparent hover:ring-purple-500 transition-all"/>}>
                                <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">My Account</a>
                                <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Logout</a>
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
                    />
                )}
            </AnimatePresence>
        </header>
    );
};

export default EditorHeader;
