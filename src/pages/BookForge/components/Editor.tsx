import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent, Editor as TipTapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import Code from '@tiptap/extension-code';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Blockquote from '@tiptap/extension-blockquote';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import CodeBlock from '@tiptap/extension-code-block';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';

import { chapterContent } from '../../../data/chapterContent';
import { 
    BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, SuperscriptIcon, SubscriptIcon,
    HighlightIcon, CodeIcon, TextQuoteIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, 
    AlignJustifyIcon, LinkIcon, ImageIcon, TableIcon, MinusIcon, ListIcon, ListOrderedIcon,
    CheckSquareIcon, PaletteIcon, Wand2Icon, UserIcon, MessageSquareIcon, 
    ChevronDownIcon, SparklesIcon, StickyNoteIcon, SlashIcon, TypeIcon,
    FontIcon, IndentIcon, LineHeightIcon, SpacingIcon, WidthIcon, DividerIcon, CursorIcon, TypewriterIcon,
    PenIcon, PlusIcon
} from '../../../constants';

const Dropdown: React.FC<{ trigger: React.ReactNode; children: React.ReactNode }> = ({ trigger, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div ref={ref} className="relative">
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full -right-2 mt-2 w-48 bg-gray-900 dark:bg-slate-200 rounded-lg shadow-lg p-2 z-20 border border-gray-700/50 dark:border-gray-200/50"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NoteModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (note: string) => void; 
    initialNote?: string 
}> = ({ isOpen, onClose, onSave, initialNote = '' }) => {
    const [note, setNote] = useState(initialNote);

    useEffect(() => {
        setNote(initialNote);
    }, [initialNote]);

    const handleSave = () => {
        onSave(note);
        onClose();
        setNote('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]"
            >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Add Note
                </h3>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter your note..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                    autoFocus
                />
                <div className="flex gap-3 justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Save Note
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const EditorBubbleMenu: React.FC<{ editor: TipTapEditor }> = ({ editor }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [showNoteModal, setShowNoteModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // AI Tools
    const aiTools = [
        { name: 'Rephrase', icon: Wand2Icon, action: () => console.log('Rephrase') },
        { name: 'Expand', icon: Wand2Icon, action: () => console.log('Expand') },
        { name: 'Shorten', icon: Wand2Icon, action: () => console.log('Shorten') },
        { name: 'Validate', icon: SparklesIcon, action: () => console.log('Validate') },
        { name: 'Impersonate', icon: UserIcon, action: () => console.log('Impersonate') },
        { name: 'Conversation', icon: MessageSquareIcon, action: () => console.log('Conversation') },
    ];

    // Text Format Options (Block Types)
    const textFormatOptions = [
        { name: 'Paragraph', action: () => editor.chain().focus().setParagraph().run(), isActive: editor.isActive('paragraph') },
        { name: 'Heading 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }) },
        { name: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }) },
        { name: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive('heading', { level: 3 }) },
        { name: 'Code Block', action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: editor.isActive('codeBlock') },
    ];

    // Basic Text Formatting
    const basicFormatting = [
        { name: 'Bold', icon: BoldIcon, action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive('bold') },
        { name: 'Italic', icon: ItalicIcon, action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive('italic') },
        { name: 'Underline', icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive('underline') },
        { name: 'Strike', icon: StrikethroughIcon, action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive('strike') },
        { name: 'Code', icon: CodeIcon, action: () => editor.chain().focus().toggleCode().run(), isActive: editor.isActive('code') },
    ];

    // Advanced Text Formatting
    const advancedFormatting = [
        { name: 'Superscript', icon: SuperscriptIcon, action: () => editor.chain().focus().toggleSuperscript().run(), isActive: editor.isActive('superscript') },
        { name: 'Subscript', icon: SubscriptIcon, action: () => editor.chain().focus().toggleSubscript().run(), isActive: editor.isActive('subscript') },
        { name: 'Highlight', icon: HighlightIcon, action: () => editor.chain().focus().toggleHighlight().run(), isActive: editor.isActive('highlight') },
    ];

    // Text Alignment
    const alignmentOptions = [
        { name: 'Left', icon: AlignLeftIcon, action: () => editor.chain().focus().setTextAlign('left').run(), isActive: editor.isActive({ textAlign: 'left' }) },
        { name: 'Center', icon: AlignCenterIcon, action: () => editor.chain().focus().setTextAlign('center').run(), isActive: editor.isActive({ textAlign: 'center' }) },
        { name: 'Right', icon: AlignRightIcon, action: () => editor.chain().focus().setTextAlign('right').run(), isActive: editor.isActive({ textAlign: 'right' }) },
        { name: 'Justify', icon: AlignJustifyIcon, action: () => editor.chain().focus().setTextAlign('justify').run(), isActive: editor.isActive({ textAlign: 'justify' }) },
    ];

    // Lists and Structure
    const listOptions = [
        { name: 'Bullet List', icon: ListIcon, action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive('bulletList') },
        { name: 'Ordered List', icon: ListOrderedIcon, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive('orderedList') },
        { name: 'Task List', icon: CheckSquareIcon, action: () => editor.chain().focus().toggleTaskList().run(), isActive: editor.isActive('taskList') },
        { name: 'Blockquote', icon: TextQuoteIcon, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive('blockquote') },
    ];

    // Insert Elements
    const insertOptions = [
        { name: 'Horizontal Rule', icon: MinusIcon, action: () => editor.chain().focus().setHorizontalRule().run() },
        { name: 'Table', icon: TableIcon, action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
        { name: 'Link', icon: LinkIcon, action: () => {
            const url = window.prompt('Enter URL');
            if (url) {
                editor.chain().focus().setLink({ href: url }).run();
            }
        }},
        { name: 'Image', icon: ImageIcon, action: () => {
            const url = window.prompt('Enter image URL');
            if (url) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        }},
    ];

    const activeFormat = textFormatOptions.find(opt => opt.isActive)?.name || 'Paragraph';

    // Update bubble menu position and visibility
    useEffect(() => {
        const updateMenu = () => {
            const { from, to } = editor.state.selection;
            const hasSelection = from !== to;
            
            if (hasSelection) {
                const startPos = editor.view.coordsAtPos(from);
                const endPos = editor.view.coordsAtPos(to);
                
                // Calculate the center position
                const centerX = (startPos.left + endPos.left) / 2;
                const selectionTop = Math.min(startPos.top, endPos.top);
                const selectionBottom = Math.max(startPos.bottom, endPos.bottom);
                
                // Menu dimensions
                const menuHeight = 120; // Approximate menu height
                const menuWidth = 800; // Approximate menu width
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Ensure menu stays within viewport horizontally
                const leftPos = Math.max(menuWidth / 2, Math.min(centerX, viewportWidth - menuWidth / 2));
                
                // Try to position above the selection first
                let topPos = selectionTop - menuHeight - 10;
                
                // If not enough space above, position below
                if (topPos < 10) {
                    topPos = selectionBottom + 10;
                }
                
                // Ensure menu doesn't go below viewport
                if (topPos + menuHeight > viewportHeight - 10) {
                    topPos = viewportHeight - menuHeight - 10;
                }
                
                setPosition({
                    top: Math.max(10, topPos),
                    left: leftPos,
                });
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        editor.on('selectionUpdate', updateMenu);
        editor.on('transaction', updateMenu);

        return () => {
            editor.off('selectionUpdate', updateMenu);  
            editor.off('transaction', updateMenu);
        };
    }, [editor]);

    if (!isVisible) {
        return null;
    }

    return (
        <>
        <div
            ref={menuRef}
            className="fixed z-50 bg-gray-800 text-white dark:bg-gray-100 dark:text-black rounded-xl shadow-lg border border-gray-700/50 dark:border-gray-200/50 max-w-6xl"
            style={{
                top: position.top,
                left: position.left,
                transform: 'translateX(-50%)',
            }}
        >
            {/* Header with Quick Actions */}
            <div className="flex items-center gap-2 p-2 border-b border-gray-700/50 dark:border-gray-200/50">
                {/* Blockquote */}
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10 ${editor.isActive('blockquote') ? 'bg-white/20 dark:bg-black/20' : ''}`}
                    title="Toggle Blockquote"
                >
                    <TextQuoteIcon className="w-4 h-4" />
                </motion.button>

                {/* Add Note */}
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setShowNoteModal(true)}
                    className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10"
                    title="Add Note"
                >
                    <StickyNoteIcon className="w-4 h-4" />
                </motion.button>

                {/* Highlight with Color Picker */}
                <Dropdown trigger={
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10" 
                        title="Highlight Colors"
                    >
                        <HighlightIcon className="w-4 h-4"/>
                    </motion.button>
                }>
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-400 dark:text-gray-600 px-3 py-1">Highlight Colors</div>
                        {[
                            { name: 'Yellow', color: '#fef08a', bg: 'bg-yellow-200' },
                            { name: 'Blue', color: '#bfdbfe', bg: 'bg-blue-200' },
                            { name: 'Green', color: '#bbf7d0', bg: 'bg-green-200' },
                            { name: 'Pink', color: '#fce7f3', bg: 'bg-pink-200' },
                            { name: 'Orange', color: '#fed7aa', bg: 'bg-orange-200' },
                            { name: 'Purple', color: '#e9d5ff', bg: 'bg-purple-200' },
                            { name: 'Remove', color: '', bg: 'bg-gray-200' }
                        ].map(highlight => (
                            <button 
                                key={highlight.name}
                                onClick={() => {
                                    if (highlight.color) {
                                        editor.chain().focus().toggleHighlight({ color: highlight.color }).run();
                                    } else {
                                        editor.chain().focus().unsetHighlight().run();
                                    }
                                }}
                                className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                            >
                                <div className={`w-4 h-4 rounded ${highlight.bg} border border-gray-400`}></div>
                                {highlight.name}
                            </button>
                        ))}
                    </div>
                </Dropdown>

                <div className="w-px h-6 bg-gray-600 dark:bg-gray-400" />

                {/* Text Format Dropdown */}
                <Dropdown trigger={
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 dark:hover:bg-black/10">
                        <span>{activeFormat}</span>
                        <ChevronDownIcon className="w-4 h-4"/>
                    </button>
                }>
                    {textFormatOptions.map(opt => (
                        <button key={opt.name} onClick={opt.action} className={`w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 ${opt.isActive ? 'bg-white/20 dark:bg-black/20' : ''}`}>
                            {opt.name}
                        </button>
                    ))}
                </Dropdown>
            </div>

            {/* Main toolbar - single line with horizontal scroll if needed */}
            <div className="flex items-center gap-2 p-3 overflow-x-auto">
                {/* Basic Formatting */}
                <div className="flex items-center gap-1 flex-shrink-0">{basicFormatting.map(tool => (
                    <motion.button 
                        key={tool.name} 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={tool.action} 
                        className={`p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10 ${tool.isActive ? 'bg-white/20 dark:bg-black/20' : ''}`} 
                        title={tool.name}
                    >
                        <tool.icon className="w-4 h-4" />
                    </motion.button>
                ))}
            </div>

            <div className="w-px h-6 bg-gray-600 dark:bg-gray-400 flex-shrink-0" />

            {/* Advanced Formatting Dropdown */}
            <div className="flex-shrink-0">
                <Dropdown trigger={
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10" 
                        title="Advanced Formatting"
                    >
                        <PaletteIcon className="w-4 h-4"/>
                    </motion.button>
                }>
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-400 dark:text-gray-600 px-3 py-1">Advanced</div>
                        {advancedFormatting.map(tool => (
                            <button key={tool.name} onClick={tool.action} className={`w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 ${tool.isActive ? 'bg-white/20 dark:bg-black/20' : ''}`}>
                                <tool.icon className="w-4 h-4"/>
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </Dropdown>
            </div>

            {/* Alignment Dropdown */}
            <div className="flex-shrink-0">
                <Dropdown trigger={
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10" 
                        title="Text Alignment"
                    >
                        <AlignLeftIcon className="w-4 h-4"/>
                    </motion.button>
                }>
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-400 dark:text-gray-600 px-3 py-1">Alignment</div>
                        {alignmentOptions.map(tool => (
                            <button key={tool.name} onClick={tool.action} className={`w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 ${tool.isActive ? 'bg-white/20 dark:bg-black/20' : ''}`}>
                                <tool.icon className="w-4 h-4"/>
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </Dropdown>
            </div>

            {/* Lists Dropdown */}
            <div className="flex-shrink-0">
                <Dropdown trigger={
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10" 
                        title="Lists & Structure"
                    >
                        <ListIcon className="w-4 h-4"/>
                    </motion.button>
                }>
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-400 dark:text-gray-600 px-3 py-1">Lists & Structure</div>
                        {listOptions.map(tool => (
                            <button key={tool.name} onClick={tool.action} className={`w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10 ${tool.isActive ? 'bg-white/20 dark:bg-black/20' : ''}`}>
                                <tool.icon className="w-4 h-4"/>
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </Dropdown>
            </div>

            {/* Insert Elements Dropdown */}
            <div className="flex-shrink-0">
                <Dropdown trigger={
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10" 
                        title="Insert Elements"
                    >
                        <ImageIcon className="w-4 h-4"/>
                    </motion.button>
                }>
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-400 dark:text-gray-600 px-3 py-1">Insert</div>
                        {insertOptions.map(tool => (
                            <button key={tool.name} onClick={tool.action} className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">
                                <tool.icon className="w-4 h-4"/>
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </Dropdown>
            </div>

            <div className="w-px h-6 bg-gray-600 dark:bg-gray-400 flex-shrink-0" />

            {/* AI Tools Dropdown */}
            <div className="flex-shrink-0">
                <Dropdown trigger={
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white dark:text-white"
                    >
                        <SparklesIcon className="w-4 h-4"/>
                        <span>AI Tools</span>
                    </motion.button>
                }>
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-400 dark:text-gray-600 px-3 py-1">AI Assistant</div>
                        {aiTools.map(tool => (
                            <button key={tool.name} onClick={tool.action} className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">
                                <tool.icon className="w-4 h-4"/>
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </Dropdown>
            </div>
            </div>
        </div>
        {showNoteModal && (
            <NoteModal
                isOpen={showNoteModal}
                onClose={() => setShowNoteModal(false)}
                onSave={(note) => {
                    // Highlight the selected text with yellow and add note attribute
                    const { from, to } = editor.state.selection;
                    if (from !== to) {
                        // Wrap selected text with highlight and note
                        editor.chain()
                            .focus()
                            .setMark('highlight', { color: '#fef08a' })
                            .insertContent(`<span data-note="${note}">`)
                            .run();
                    } else {
                        // Insert note at cursor position
                        editor.chain()
                            .focus()
                            .insertContent(`<mark style="background-color: #fef08a;" data-note="${note}">${note}</mark>`)
                            .run();
                    }
                    setShowNoteModal(false);
                }}
            />
        )}
        </>
    );
};

interface TypographySettings {
    fontFamily: string;
    fontSize: string;
    textIndent: string;
    chicagoStyle: boolean;
    lineHeight: string;
    paragraphSpacing: string;
    pageWidth: string;
    textAlignment: string;
    sceneDivider: string;
    typewriterMode: boolean;
    rememberPosition: boolean;
}

const TypographySettingsPopup: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (settings: TypographySettings) => void;
    editor: TipTapEditor;
}> = ({ isOpen, onClose, onApply, editor }) => {
    const [settings, setSettings] = useState<TypographySettings>({
        fontFamily: 'Georgia, serif',
        fontSize: 'text-base',
        textIndent: 'none',
        chicagoStyle: false,
        lineHeight: 'normal',
        paragraphSpacing: '0.5em',
        pageWidth: 'medium',
        textAlignment: 'left',
        sceneDivider: 'asterisks',
        typewriterMode: false,
        rememberPosition: true,
    });

    const [originalSettings, setOriginalSettings] = useState<TypographySettings | null>(null);

    // Professional fonts for publishing - simplified for dropdown
    const fontFamilies = [
        { name: 'Garamond', value: 'Garamond, serif', kdp: true, ingram: true },
        { name: 'Baskerville', value: 'Baskerville, serif', kdp: true, ingram: true },
        { name: 'Georgia', value: 'Georgia, serif', kdp: true, ingram: true },
        { name: 'Palatino', value: 'Palatino, serif', kdp: true, ingram: true },
        { name: 'Times New Roman', value: 'Times New Roman, serif', kdp: true, ingram: true },
        { name: 'Bookerly', value: 'Bookerly, serif', kdp: true, ingram: false },
        { name: 'Arial', value: 'Arial, sans-serif', kdp: true, ingram: true },
        { name: 'Helvetica', value: 'Helvetica, sans-serif', kdp: true, ingram: true },
        { name: 'Courier', value: 'Courier, monospace', kdp: true, ingram: true },
        { name: 'Courier Prime', value: 'Courier Prime, monospace', kdp: true, ingram: true },
    ];

    // Apply settings in real-time to editor
    const applySettingsToEditor = (newSettings: TypographySettings) => {
        const editorElement = editor.view.dom as HTMLElement;
        const container = editorElement.closest('.prose') as HTMLElement;
        
        if (container) {
            // Apply font family
            container.style.fontFamily = newSettings.fontFamily;
            
            // Apply font size
            const sizeMap = {
                'text-sm': '14px',
                'text-base': '16px', 
                'text-lg': '18px',
                'text-xl': '20px'
            };
            container.style.fontSize = sizeMap[newSettings.fontSize as keyof typeof sizeMap];
            
            // Apply text indent
            const indentMap = {
                'none': '0',
                'small': '1em',
                'medium': '2em',
                'large': '3em'
            };
            container.style.setProperty('--text-indent', indentMap[newSettings.textIndent as keyof typeof indentMap]);
            
            // Apply line height
            const lineHeightMap = {
                'tight': '1.25',
                'normal': '1.5',
                'relaxed': '1.75',
                'loose': '2'
            };
            container.style.lineHeight = lineHeightMap[newSettings.lineHeight as keyof typeof lineHeightMap];
            
            // Apply paragraph spacing
            container.style.setProperty('--paragraph-spacing', newSettings.paragraphSpacing);
            
            // Apply text alignment to all content
            if (newSettings.textAlignment === 'justified') {
                editor.chain().focus().selectAll().setTextAlign('justify').run();
            } else {
                editor.chain().focus().selectAll().setTextAlign(newSettings.textAlignment).run();
            }
            
            // Apply page width
            const widthMap = {
                'fixed': 'max-w-lg',
                'medium': 'max-w-3xl', 
                'full': 'max-w-5xl',
                'edge': 'max-w-none'
            };
            const parentContainer = container.parentElement;
            if (parentContainer) {
                parentContainer.className = parentContainer.className.replace(/max-w-\w+/, widthMap[newSettings.pageWidth as keyof typeof widthMap]);
            }
        }
    };

    // Store original settings when panel opens
    useEffect(() => {
        if (isOpen && !originalSettings) {
            const editorElement = editor.view.dom as HTMLElement;
            const container = editorElement.closest('.prose') as HTMLElement;
            
            if (container) {
                const current: TypographySettings = {
                    fontFamily: container.style.fontFamily || 'Georgia, serif',
                    fontSize: 'text-base', // default
                    textIndent: 'none',
                    chicagoStyle: false,
                    lineHeight: 'normal',
                    paragraphSpacing: '0.5em',
                    pageWidth: 'medium',
                    textAlignment: 'left',
                    sceneDivider: 'asterisks',
                    typewriterMode: false,
                    rememberPosition: true,
                };
                setOriginalSettings(current);
            }
        }
    }, [isOpen, originalSettings, editor]);

    // Apply changes in real-time
    useEffect(() => {
        if (isOpen) {
            applySettingsToEditor(settings);
        }
    }, [settings, isOpen, editor]);

    const handleApply = () => {
        // Settings are already applied in real-time, just cleanup and close
        setOriginalSettings(null);
        onApply(settings);
        onClose();
    };

    const handleCancel = () => {
        // Revert to original settings if they exist
        if (originalSettings) {
            applySettingsToEditor(originalSettings);
        }
        setOriginalSettings(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex">
            {/* Backdrop - click to close */}
            <div 
                className="flex-1 cursor-pointer" 
                onClick={onClose}
            />
            
            {/* Side Panel */}
            <motion.div
                initial={{ opacity: 0, x: 400 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 400 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-white dark:bg-gray-800 shadow-2xl w-[500px] h-full overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <TypeIcon className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            TYPOGRAPHY
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-6">
                        
                        {/* Font Family Dropdown */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FontIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Font Family</h3>
                            </div>
                            <select
                                value={settings.fontFamily}
                                onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                                style={{ fontFamily: settings.fontFamily }}
                            >
                                {fontFamilies.map((font) => (
                                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                        {font.name} {font.kdp && font.ingram ? '(KDP • IS)' : font.kdp ? '(KDP)' : font.ingram ? '(IS)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Text Size Icons */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <TypeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Text Size</h3>
                            </div>
                            <div className="flex gap-2">
                                {[
                                    { name: 'Small', value: 'text-sm', icon: 'Aa' },
                                    { name: 'Normal', value: 'text-base', icon: 'Aa' },
                                    { name: 'Large', value: 'text-lg', icon: 'Aa' },
                                    { name: 'Extra Large', value: 'text-xl', icon: 'Aa' },
                                ].map((size, index) => (
                                    <button
                                        key={size.value}
                                        onClick={() => setSettings({...settings, fontSize: size.value})}
                                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                            settings.fontSize === size.value
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                        }`}
                                        title={size.name}
                                    >
                                        <div className={`font-bold ${
                                            index === 0 ? 'text-sm' : 
                                            index === 1 ? 'text-base' : 
                                            index === 2 ? 'text-lg' : 'text-xl'
                                        }`}>
                                            {size.icon}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text Indent & Line Height */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Text Indent Icons */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <IndentIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Text Indent</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { name: 'None', value: 'none', icon: '⫷' },
                                        { name: 'Small', value: 'small', icon: '⫸' },
                                        { name: 'Medium', value: 'medium', icon: '⫸⫸' },
                                        { name: 'Large', value: 'large', icon: '⫸⫸⫸' }
                                    ].map((indent) => (
                                        <button
                                            key={indent.value}
                                            onClick={() => setSettings({...settings, textIndent: indent.value})}
                                            className={`p-2 rounded-lg border-2 transition-all text-sm ${
                                                settings.textIndent === indent.value
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                            title={indent.name}
                                        >
                                            <div className="font-mono">{indent.icon}</div>
                                        </button>
                                    ))}
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer mt-2">
                                    <input
                                        type="checkbox"
                                        checked={settings.chicagoStyle}
                                        onChange={(e) => setSettings({...settings, chicagoStyle: e.target.checked})}
                                        className="text-blue-600"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Chicago Style first-line</span>
                                </label>
                            </div>

                            {/* Line Height Icons */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <LineHeightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Line Height</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { name: 'Tight', value: 'tight', icon: '≡' },
                                        { name: 'Normal', value: 'normal', icon: '⩘' },
                                        { name: 'Relaxed', value: 'relaxed', icon: '⩙' },
                                        { name: 'Loose', value: 'loose', icon: '⩚' }
                                    ].map((height) => (
                                        <button
                                            key={height.value}
                                            onClick={() => setSettings({...settings, lineHeight: height.value})}
                                            className={`p-2 rounded-lg border-2 transition-all text-sm ${
                                                settings.lineHeight === height.value
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                            title={height.name}
                                        >
                                            <div className="font-mono text-lg">{height.icon}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Paragraph Spacing & Page Width */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Paragraph Spacing Dropdown */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <SpacingIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Paragraph Spacing</h3>
                                </div>
                                <select
                                    value={settings.paragraphSpacing}
                                    onChange={(e) => setSettings({...settings, paragraphSpacing: e.target.value})}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                                >
                                    <option value="0">None</option>
                                    <option value="0.25em">Small (0.25em)</option>  
                                    <option value="0.5em">Medium (0.5em)</option>
                                    <option value="1em">Large (1em)</option>
                                    <option value="1.5em">Extra Large (1.5em)</option>
                                </select>
                            </div>

                            {/* Page Width Icons */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <WidthIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Page Width</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { name: 'Fixed', value: 'fixed', icon: '▋' },
                                        { name: 'Medium', value: 'medium', icon: '▊' },
                                        { name: 'Full', value: 'full', icon: '█' },
                                        { name: 'Edge', value: 'edge', icon: '⬛' }
                                    ].map((width) => (
                                        <button
                                            key={width.value}
                                            onClick={() => setSettings({...settings, pageWidth: width.value})}
                                            className={`p-2 rounded-lg border-2 transition-all text-sm ${
                                                settings.pageWidth === width.value
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                            title={width.name}
                                        >
                                            <div className="font-mono">{width.icon}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Text Alignment Icons */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Text Alignment</h3>
                            <div className="flex gap-2">
                                {[
                                    { name: 'Left', value: 'left', icon: '⬅' },
                                    { name: 'Center', value: 'center', icon: '↔' },
                                    { name: 'Right', value: 'right', icon: '➡' },
                                    { name: 'Justify', value: 'justified', icon: '⬌' }
                                ].map((align) => (
                                    <button
                                        key={align.value}
                                        onClick={() => setSettings({...settings, textAlignment: align.value})}
                                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                            settings.textAlignment === align.value
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                        }`}
                                        title={align.name}
                                    >
                                        <div className="font-mono text-lg">{align.icon}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scene Divider */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <DividerIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Scene Divider Style</h3>
                            </div>
                            <select
                                value={settings.sceneDivider}
                                onChange={(e) => setSettings({...settings, sceneDivider: e.target.value})}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            >
                                <option value="boxes">Boxes (■ ■ ■)</option>
                                <option value="lines">Lines (— — —)</option>
                                <option value="dots">Dots (• • •)</option>
                                <option value="asterisks">Asterisks (* * *)</option>
                                <option value="custom">Custom Symbol</option>
                            </select>
                        </div>

                        {/* Cursor & Jump Behavior */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <CursorIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Cursor & Jump</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Jump position in manuscript when switching scenes
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 p-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm border border-gray-200 dark:border-gray-600">
                                        ↑ Start of scene
                                    </button>
                                    <button className="flex-1 p-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm border border-gray-200 dark:border-gray-600">
                                        ↓ End of scene
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.rememberPosition}
                                            onChange={(e) => setSettings({...settings, rememberPosition: e.target.checked})}
                                            className="text-blue-600"
                                        />
                                        <span className="text-sm">Remember where I left off</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.typewriterMode}
                                            onChange={(e) => setSettings({...settings, typewriterMode: e.target.checked})}
                                            className="text-blue-600"
                                        />
                                        <div className="flex items-center gap-2">
                                            <TypewriterIcon className="w-4 h-4" />
                                            <span className="text-sm">Typewriter Mode</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        KDP = Amazon KDP compatible • IS = IngramSpark compatible
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Apply Settings
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const EditorFloatingMenu: React.FC<{ editor: TipTapEditor }> = ({ editor }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    // Updated slash command options as requested
    const floatingMenuOptions = [
        { 
            name: 'Continue writing', 
            icon: PenIcon, 
            action: () => {
                // Remove the "/" and add a line break to continue writing
                editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertContent('<p></p>').run();
            },
            description: 'Continue with regular text'
        },
        { 
            name: 'Scene Beat', 
            icon: SparklesIcon, 
            action: () => {
                // Remove the "/" and insert a scene beat
                editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertContent('<h3>Scene Beat</h3><p></p>').run();
            },
            description: 'Add a new scene beat or transition'
        },
        { 
            name: 'Add section', 
            icon: PlusIcon, 
            action: () => {
                // Remove the "/" and insert a new section
                editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertContent('<h2>New Section</h2><p></p>').run();
            },
            description: 'Add a new section to your manuscript'
        },
        { 
            name: 'Add note section', 
            icon: StickyNoteIcon, 
            action: () => {
                // Remove the "/" and insert a note section
                editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertContent('<blockquote><strong>Note:</strong> </blockquote><p></p>').run();
            },
            description: 'Add a note or annotation section'
        }
    ];

    useEffect(() => {
        const updateMenu = () => {
            const { $from, from } = editor.state.selection;
            const isEmptyParagraph = $from.parent.content.size === 0 && $from.parent.type.name === 'paragraph';
            
            // Get the text content of the current paragraph
            const paragraphStart = $from.start();
            const paragraphEnd = $from.end();
            const paragraphText = editor.state.doc.textBetween(paragraphStart, paragraphEnd, '');
            
            const coords = editor.view.coordsAtPos(from);
            
            if (isEmptyParagraph && paragraphText === '') {
                // Show tooltip for empty paragraph
                setTooltipPosition({
                    top: coords.top,
                    left: coords.left,
                });
                setShowTooltip(true);
                setIsVisible(false);
            } else if (paragraphText === '/') {
                // Show floating menu when "/" is typed
                setPosition({
                    top: coords.top,
                    left: coords.left - 60,
                });
                setIsVisible(true);
                setSelectedIndex(0);
                setShowTooltip(false);
            } else {
                // Hide both menu and tooltip
                setIsVisible(false);
                setShowTooltip(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isVisible) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % floatingMenuOptions.length);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + floatingMenuOptions.length) % floatingMenuOptions.length);
                    break;
                case 'Enter':
                    event.preventDefault();
                    floatingMenuOptions[selectedIndex].action();
                    setIsVisible(false);
                    break;
                case 'Escape':
                    event.preventDefault();
                    setIsVisible(false);
                    // Remove the "/" character
                    editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run();
                    break;
            }
        };

        // Listen for text input events
        const handleInput = () => {
            // Small delay to ensure the text has been inserted
            setTimeout(updateMenu, 10);
        };

        editor.on('selectionUpdate', updateMenu);
        editor.on('transaction', updateMenu);
        editor.view.dom.addEventListener('input', handleInput);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            editor.off('selectionUpdate', updateMenu);
            editor.off('transaction', updateMenu);
            editor.view.dom.removeEventListener('input', handleInput);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [editor, isVisible, selectedIndex]);

    return (
        <>
            {/* Tooltip for empty paragraph */}
            {showTooltip && (
                <div 
                    className="fixed z-30 bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
                    style={{
                        top: tooltipPosition.top,
                        left: tooltipPosition.left + 10,
                    }}
                >
                    Start writing or Press / for more commands
                </div>
            )}

            {/* Floating menu */}
            {isVisible && (
                <div 
                    className="fixed z-40 bg-gray-800 text-white dark:bg-gray-100 dark:text-black rounded-lg shadow-lg border border-gray-700/50 dark:border-gray-200/50 min-w-[200px]"
                    style={{
                        top: position.top,
                        left: position.left,
                    }}
                >
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-gray-700/50 dark:border-gray-200/50">
                        <div className="flex items-center gap-2">
                            <SlashIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-400 dark:text-gray-600">Quick Actions</span>
                        </div>
                    </div>
                    
                    {/* Vertical stack of tools */}
                    <div className="p-2 space-y-1">
                        {floatingMenuOptions.map((option, index) => (
                            <button
                                key={option.name}
                                onClick={() => {
                                    option.action();
                                    setIsVisible(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors group ${
                                    index === selectedIndex 
                                        ? 'bg-blue-500 text-white' 
                                        : 'hover:bg-white/10 dark:hover:bg-black/10 text-white dark:text-black'
                                }`}
                                title={option.description}
                            >
                                <option.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-left">{option.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Footer with keyboard hints */}
                    <div className="px-3 py-2 border-t border-gray-700/50 dark:border-gray-200/50 bg-gray-900/50 dark:bg-gray-200/50">
                        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-600">
                            <span>↑↓ Navigate</span>
                            <span>↵ Select</span>
                            <span>Esc Cancel</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};



const Editor: React.FC<{ 
    showTypographySettings?: boolean;
    onCloseTypographySettings?: () => void;
    onOpenTypographySettings?: () => void;
}> = ({ showTypographySettings = false, onCloseTypographySettings, onOpenTypographySettings }) => {
    
    // Remove the internal state since it's now managed by parent
    // const [showTypographySettings, setShowTypographySettings] = useState(false);
    
    // Expose the function to parent components through useEffect
    useEffect(() => {
        if (onOpenTypographySettings) {
            // This allows parent components to trigger the typography settings
            (window as any).__openTypographySettings = () => {
                if (onOpenTypographySettings) {
                    onOpenTypographySettings();
                }
            };
        }
        return () => {
            delete (window as any).__openTypographySettings;
        };
    }, [onOpenTypographySettings]);
    
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                // Disable some StarterKit extensions to avoid conflicts
                bulletList: false,
                orderedList: false,
                listItem: false,
                codeBlock: false,
                code: false,
                strike: false,
                horizontalRule: false,
                blockquote: false,
            }),
            // Text formatting
            Underline,
            Strike,
            Code,
            Superscript,
            Subscript,
            Highlight.configure({ multicolor: true }),
            
            // Custom blockquote with styling
            Blockquote.configure({
                HTMLAttributes: {
                    class: 'bg-gray-100 dark:bg-gray-800 p-4 rounded-md border-l-4 border-gray-400 dark:border-gray-600',
                },
            }),
            
            // Text style and color
            TextStyle,
            Color.configure({ types: [TextStyle.name, ListItem.name] }),
            
            // Text alignment
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            
            // Lists
            BulletList.configure({
                HTMLAttributes: {
                    class: 'prose-bullet-list',
                },
            }),
            OrderedList.configure({
                HTMLAttributes: {
                    class: 'prose-ordered-list',
                },
            }),
            ListItem,
            TaskList.configure({
                HTMLAttributes: {
                    class: 'prose-task-list',
                },
            }),
            TaskItem.configure({
                HTMLAttributes: {
                    class: 'prose-task-item',
                },
            }),
            
            // Block elements
            CodeBlock.configure({
                HTMLAttributes: {
                    class: 'prose-code-block',
                },
            }),
            HorizontalRule,
            
            // Links and media
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'prose-link',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'prose-image',
                },
            }),
            
            // Tables
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'prose-table',
                },
            }),
            TableRow,
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'prose-table-header',
                },
            }),
            TableCell.configure({
                HTMLAttributes: {
                    class: 'prose-table-cell',
                },
            }),
            
            // Placeholder
            Placeholder.configure({
                placeholder: 'Start writing your masterpiece...',
            }),
        ],
        content: chapterContent,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-lg max-w-none focus:outline-none font-serif text-gray-800 dark:text-gray-300 leading-relaxed book-prose',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <main className="flex-grow w-full overflow-y-auto custom-scrollbar relative">
            <style>
                {`
                    .ProseMirror {
                        min-height: 100%;
                    }
                    .book-prose p {
                        text-indent: 2em;
                        margin-top: 0;
                        margin-bottom: 0.5rem;
                    }
                    .book-prose h1, .book-prose h2, .book-prose h3,
                    .book-prose h1 + p, .book-prose h2 + p, .book-prose h3 + p,
                    .book-prose p:first-of-type {
                        text-indent: 0;
                    }
                    
                    /* Custom placeholder styles */
                    .ProseMirror p.is-editor-empty:first-child::before {
                        content: attr(data-placeholder);
                        float: left;
                        color: #6b7280; /* gray-500 */
                        pointer-events: none;
                        height: 0;
                    }
                    .dark .ProseMirror p.is-editor-empty:first-child::before {
                        color: #4b5563; /* gray-600 */
                    }
                    
                    /* Enhanced formatting styles */
                    .prose-bullet-list, .prose-ordered-list {
                        margin: 1rem 0;
                        padding-left: 1.5rem;
                    }
                    
                    .prose-bullet-list li {
                        list-style-type: disc;
                        margin: 0.25rem 0;
                    }
                    
                    .prose-ordered-list li {
                        list-style-type: decimal;
                        margin: 0.25rem 0;
                    }
                    
                    .prose-task-list {
                        list-style: none;
                        padding-left: 0;
                        margin: 1rem 0;
                    }
                    
                    .prose-task-item {
                        display: flex;
                        align-items: flex-start;
                        margin: 0.25rem 0;
                    }
                    
                    .prose-task-item input[type="checkbox"] {
                        margin-right: 0.5rem;
                        margin-top: 0.125rem;
                    }
                    
                    .prose-code-block {
                        background: #1f2937;
                        color: #f9fafb;
                        border-radius: 0.5rem;
                        padding: 1rem;
                        margin: 1rem 0;
                        font-family: 'Courier New', monospace;
                        overflow-x: auto;
                    }
                    
                    .dark .prose-code-block {
                        background: #374151;
                    }
                    
                    .prose-table {
                        border-collapse: collapse;
                        margin: 1rem 0;
                        width: 100%;
                    }
                    
                    .prose-table-header, .prose-table-cell {
                        border: 1px solid #d1d5db;
                        padding: 0.5rem;
                        text-align: left;
                    }
                    
                    .prose-table-header {
                        background: #f3f4f6;
                        font-weight: 600;
                    }
                    
                    .dark .prose-table-header {
                        background: #374151;
                        border-color: #4b5563;
                    }
                    
                    .dark .prose-table-cell {
                        border-color: #4b5563;
                    }
                    
                    .prose-link {
                        color: #3b82f6;
                        text-decoration: underline;
                    }
                    
                    .dark .prose-link {
                        color: #60a5fa;
                    }
                    
                    .prose-image {
                        max-width: 100%;
                        height: auto;
                        border-radius: 0.5rem;
                        margin: 1rem 0;
                    }
                    
                    mark {
                        background: #fef08a;
                        padding: 0.125rem 0.25rem;
                        border-radius: 0.25rem;
                    }
                    
                    .dark mark {
                        background: #a16207;
                        color: #fef3c7;
                    }
                    
                    code {
                        background: #f3f4f6;
                        padding: 0.125rem 0.25rem;
                        border-radius: 0.25rem;
                        font-family: 'Courier New', monospace;
                        font-size: 0.875em;
                    }
                    
                    .dark code {
                        background: #374151;
                        color: #f9fafb;
                    }
                    
                    hr {
                        border: none;
                        border-top: 2px solid #d1d5db;
                        margin: 2rem 0;
                    }
                    
                    .dark hr {
                        border-top-color: #4b5563;
                    }
                `}
            </style>
            
            <EditorBubbleMenu editor={editor} />
            <EditorFloatingMenu editor={editor} />
            <TypographySettingsPopup 
                isOpen={showTypographySettings}
                onClose={() => onCloseTypographySettings && onCloseTypographySettings()}
                onApply={(settings) => {
                    console.log('Applied typography settings:', settings);
                    // Settings are already applied in the popup's handleApply function
                }}
                editor={editor}
            />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <EditorContent editor={editor} />
            </div>
        </main>
    );
};

export default Editor;
