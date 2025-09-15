import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { loadUserSettings, type AISettings, type AIFeaturePreset } from '../../../stores/userSettingsStore';
import { runFeature } from '../../../ai/runFeature';

import { Theme, Book, Version } from '../../../types';
import PlanningPage from './PlanningPage';
import CreateChapterPage from './CreateChapterPage';

// Tool Window System Imports
import DockSidebar from '../../../components/DockSidebar';
import ToolManager from '../../../components/ToolManager';
import { useToolWindowStore } from '../../../stores/toolWindowStore';
import { 
    BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, SuperscriptIcon, SubscriptIcon,
    HighlightIcon, CodeIcon, TextQuoteIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, 
    AlignJustifyIcon, LinkIcon, ImageIcon, TableIcon, MinusIcon, ListIcon, ListOrderedIcon,
    CheckSquareIcon, PaletteIcon, Wand2Icon, 
    ChevronDownIcon, SparklesIcon, StickyNoteIcon, SlashIcon,
    PenIcon, PlusIcon, TheaterIcon
} from '../../../constants';

// Import custom extensions
import { SceneBeatExtension } from '../../../extensions/SceneBeatExtension';
import { NoteSectionExtension } from '../../../extensions/NoteSectionExtension';
import { CharacterImpersonationExtension } from '../../../extensions/CharacterImpersonationExtension';
import { TestExtension } from '../../../extensions/TestExtension';
import { DictationSectionNode } from '../../../components/custom-nodes/DictationSectionNode';
import { SimpleExtension } from '../../../extensions/SimpleExtension';

//Tauri
import { useClipboard } from '../../../hooks/useClipboard';
import { toast } from '../../../hooks/use-toast';
import { Toaster } from '../../../components/ui/toaster';
import { ChapterRevisionManager } from '../../../services/ChapterRevisionManager';
import { useBookContext } from '../../../contexts/BookContext';

const Dropdown: React.FC<{ trigger: React.ReactNode; children: React.ReactNode }> = ({ trigger, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        
        const handleScroll = () => {
            if (isOpen) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleScroll);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleScroll);
        };
    }, [isOpen]);
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            // Use requestAnimationFrame to ensure DOM is updated
            requestAnimationFrame(() => {
                if (!triggerRef.current) return;
                
                const rect = triggerRef.current.getBoundingClientRect();
                const dropdownWidth = 192; // w-48 = 12rem = 192px
                const dropdownHeight = 300; // max height
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Get scroll offsets to account for any scrolling
                const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                
                console.log('Trigger rect:', rect);
                console.log('Scroll:', { x: scrollX, y: scrollY });
                console.log('Viewport:', { width: viewportWidth, height: viewportHeight });
                
                // Calculate left position - align dropdown with trigger button
                let leftPosition = rect.left; // Use viewport relative position for fixed positioning
                
                // If dropdown would go off the right edge, align it to the right edge of trigger
                if (leftPosition + dropdownWidth > viewportWidth - 16) {
                    leftPosition = rect.right - dropdownWidth;
                }
                
                // Ensure it doesn't go off the left edge
                leftPosition = Math.max(16, leftPosition);
                
                // Calculate top position
                let topPosition = rect.bottom + 4; // Use viewport relative position
                
                // If dropdown would go off the bottom, position it above the trigger
                if (topPosition + dropdownHeight > viewportHeight - 16) {
                    topPosition = rect.top - dropdownHeight - 4;
                    
                    // If still goes off screen, position at bottom of viewport
                    if (topPosition < 16) {
                        topPosition = viewportHeight - dropdownHeight - 16;
                    }
                }
                
                const finalPosition = {
                    top: Math.max(16, topPosition),
                    left: leftPosition
                };
                
                console.log('Final position:', finalPosition);
                // Position is handled by the fixed positioning in the style
            });
        }
    }, [isOpen]);

    return (
        <div ref={ref} className="relative">
            <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="fixed w-48 bg-gray-900 dark:bg-slate-200 rounded-lg shadow-xl border border-gray-700/50 dark:border-gray-200/50 p-2"
                        style={{ 
                            zIndex: 60,
                            maxHeight: '300px',
                            overflowY: 'auto',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
                            position: 'fixed',
                            //top: position.top,
                            //left: position.left  //dON'T ADD THIS AS THIS IMAPCTS THE POSITIONING OFTHE DROPDOWN MENUS
                        }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper component: recompute an anchor point (coordsAtPos) on scroll/resize and report back
const RecomputeAnchor: React.FC<{ view: any; anchorPos: number; onUpdate: (pt: { top: number; left: number }) => void }>
 = ({ view, anchorPos, onUpdate }) => {
    // Keep latest callback without retriggering the effect
    const cbRef = React.useRef(onUpdate);
    useEffect(() => { cbRef.current = onUpdate; }, [onUpdate]);
    useEffect(() => {
        if (!view || typeof anchorPos !== 'number') return;
        const recompute = () => {
            try {
                const c = view.coordsAtPos(anchorPos);
                cbRef.current({ top: c.top, left: c.left });
            } catch {}
        };
        recompute();
        const handler = () => recompute();
        window.addEventListener('scroll', handler, true);
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('resize', handler);
        };
    }, [view, anchorPos]);
    return null;
};

// Modal: Pair each original paragraph with its rephrased paragraph
type RephrasePair = { original: string[]; rephrased: string };
const RephrasePairsModal: React.FC<{
    pairs: RephrasePair[];
    busy?: boolean;
    onRephraseOne: (rowIndex: number) => Promise<string>;
    onAccept: (finalParagraphs: string[]) => void;
    onClose: () => void;
}> = ({ pairs, busy = false, onRephraseOne, onAccept, onClose }) => {
    const [rows, setRows] = useState(pairs.map(p => ({ original: p.original, rephrased: p.rephrased, useOriginal: false })));
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [busyRow, setBusyRow] = useState<number | null>(null);

    const updateRephrased = (i: number, text: string) => {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, rephrased: text } : r));
    };
    const toggleUseOriginal = (i: number) => {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, useOriginal: !r.useOriginal } : r));
    };
    const rephraseAgain = async (i: number) => {
        try {
            setBusyRow(i);
            const newText = await onRephraseOne(i);
            if (typeof newText === 'string') updateRephrased(i, newText);
        } finally {
            setBusyRow(null);
        }
    };
    const acceptAll = () => {
        const finals = rows.map(r => (r.useOriginal ? r.original.join('\n') : r.rephrased));
        onAccept(finals);
    };

    // Keep rows in sync if new pairs arrive while modal is open (streaming updates)
    useEffect(() => {
        if (!pairs || pairs.length === 0) return;
        setRows(prev => {
            // Only append new rows if pairs length increased
            if (pairs.length <= prev.length) return prev;
            const extras = pairs.slice(prev.length).map(p => ({ original: p.original, rephrased: p.rephrased, useOriginal: false }));
            return [...prev, ...extras];
        });
    }, [pairs]);

    return (
        <div className="fixed inset-0 bg-black/50 z-[140] flex items-center justify-center">
            <div className="rounded-lg shadow-lg ring-1 ring-black/10 dark:ring-white/10 w-[1000px] max-h-[85vh] overflow-hidden flex flex-col bg-gradient-to-br from-gray-900 to-black dark:from-slate-100 dark:to-slate-200">
                <div className="p-4 border-b border-white/10 dark:border-black/10 flex items-center justify-between">
                    <div className="text-lg font-semibold flex items-center gap-2 text-slate-100 dark:text-slate-900">
                        AI Text Rephraser
                        {busy && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-300">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                Streaming…
                            </span>
                        )}
                        {!busy && (
                            <span className="text-xs text-slate-300 dark:text-slate-700">{rows.length} received</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-3 py-1.5 rounded bg-white/10 text-white dark:bg-black/10 dark:text-black">Cancel</button>
                        <button onClick={acceptAll} className="px-3 py-1.5 rounded bg-purple-600 text-white">Accept All</button>
                    </div>
                </div>
                <div className="p-3 overflow-auto divide-y divide-white/10 dark:divide-black/10 bg-white dark:bg-gray-900">
                    {busy && rows.length === 0 && (
                        <div className="py-10 flex items-center justify-center text-sm text-gray-500 gap-2">
                            <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            Waiting for first line…
                        </div>
                    )}
                    {rows.map((row, i) => (
                        <div key={i} className="py-3 grid grid-cols-2 gap-3 items-stretch">
                            <div className="flex flex-col">
                                <div className="text-xs uppercase text-gray-500 mb-1">Original</div>
                                <div className="p-2 rounded border border-gray-200 dark:border-gray-800 text-sm bg-gray-50 dark:bg-gray-800 min-h-[140px] h-full">
                                    <div className="space-y-1">
                                        {row.original.map((ln, idx) => (
                                            <div key={idx} className="whitespace-pre-wrap">{ln}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-xs uppercase text-gray-500">Rephrased</div>
                                    <label className="text-xs flex items-center gap-1">
                                        <input type="checkbox" checked={row.useOriginal} onChange={() => toggleUseOriginal(i)} />
                                        Use original
                                    </label>
                                </div>
                                {editingIndex === i ? (
                                    <textarea
                                        className="w-full p-2 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm min-h-[140px] h-full"
                                        value={row.rephrased}
                                        onChange={e => updateRephrased(i, e.target.value)}
                                        onBlur={() => setEditingIndex(null)}
                                        disabled={row.useOriginal}
                                        autoFocus
                                    />
                                ) : (
                                    <div
                                        className={`p-2 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm whitespace-pre-wrap min-h-[140px] h-full ${row.useOriginal ? 'opacity-60' : 'cursor-text'}`}
                                        onClick={() => !row.useOriginal && setEditingIndex(i)}
                                    >
                                        {row.rephrased}
                                    </div>
                                )}
                                <div className="mt-2 flex gap-2">
                                    <button onClick={() => rephraseAgain(i)} disabled={busyRow === i || row.useOriginal} className="px-2 py-1 rounded bg-indigo-600 text-white text-xs disabled:opacity-50">
                                        {busyRow === i ? 'Rephrasing…' : 'Rephrase again'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
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

const EditorBubbleMenu: React.FC<{ editor: TipTapEditor; setIsAIRunning: React.Dispatch<React.SetStateAction<boolean>>; isAIRunning: boolean }> = ({ editor, setIsAIRunning, isAIRunning }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [showNoteModal, setShowNoteModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [aiSettings, setAISettings] = useState<AISettings | null>(null);
    const [selectedPresets, setSelectedPresets] = useState<Record<string, string>>({});
    const abortRef = useRef<AbortController | null>(null);
    const beforeDocSnapshotRef = useRef<any | null>(null);
    const stoppedRef = useRef<boolean>(false);
    const [presetModal, setPresetModal] = useState<{ open: boolean; featureId?: string }>(() => ({ open: false }));
    const [compareModal, setCompareModal] = useState<{ open: boolean; variants: Array<{ label: string; text: string }>; onAccept?: (text: string) => void }>({ open: false, variants: [] });
    const [pairsModal, setPairsModal] = useState<{ open: boolean; pairs: RephrasePair[]; from: number; to: number }>({ open: false, pairs: [], from: 0, to: 0 });
    const [selectionOverlay, setSelectionOverlay] = useState<null | {
        anchor: { top: number; left: number };
        anchorPos: number; // ProseMirror position to recompute coords on scroll/resize
        status: 'loading' | 'confirm';
        onAccept?: () => void;
        onReject?: () => void;
    }>(null);
    

    // AI Tools
    // Load AI settings once
    useEffect(() => {
        (async () => {
            try {
                const settings = await loadUserSettings();
                setAISettings(settings.settings.aiSettings);
                // seed defaults for each feature
                const map: Record<string, string> = {};
                settings.settings.aiSettings.features.forEach(f => {
                    const def = f.presets.find(p => p.enabled ?? true) || f.presets[0];
                    if (def) map[f.id] = def.id;
                });
                setSelectedPresets(map);
            } catch (e) {
                console.warn('AI settings load failed', e);
            }
        })();
        // Listen for settings changes globally
        const onChanged = async () => {
            try {
                const s = await loadUserSettings();
                setAISettings(s.settings.aiSettings);
                // Recompute default selected presets when settings update
                const map: Record<string, string> = {};
                s.settings.aiSettings.features.forEach(f => {
                    const def = f.presets.find(p => p.enabled ?? true) || f.presets[0];
                    if (def) map[f.id] = def.id;
                });
                setSelectedPresets(map);
            } catch {}
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('user_settings:changed', onChanged);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('user_settings:changed', onChanged);
            }
        };
    }, []);

    // Single rephrase action; runtime decides single vs multi-line based on selection
    const aiTools = [
        { name: 'Rephrase', featureId: 'rephrasing', icon: Wand2Icon },
        { name: 'Expand', featureId: 'expanding', icon: Wand2Icon },
        { name: 'Shorten', featureId: 'concising', icon: Wand2Icon },
        { name: 'Validate', featureId: 'validation', icon: SparklesIcon },
        // Additional features can be wired later
    ] as const;

    const getSelectedPreset = (featureId: string, presetId?: string): AIFeaturePreset | undefined => {
        if (!aiSettings) return undefined;
        const feature = aiSettings.features.find(f => f.id === featureId);
        if (!feature) return undefined;
        const id = presetId || selectedPresets[featureId];
        return feature.presets.find(p => p.id === id) || feature.presets.find(p => p.enabled ?? true) || feature.presets[0];
    };

    // (removed) legacy streaming helper replaced by paragraph-aware streaming

    const handleRunTool = async (featureId: string) => {
        // Always work with a local snapshot of AI settings; lazily load if missing
        let settingsLocal: AISettings | null = aiSettings;
        if (!settingsLocal) {
            try {
                const s = await loadUserSettings();
                settingsLocal = s.settings.aiSettings;
                setAISettings(settingsLocal);
                // Seed selected presets map if empty
                if (Object.keys(selectedPresets).length === 0) {
                    const map: Record<string, string> = {};
                    settingsLocal.features.forEach(f => {
                        const def = f.presets.find(p => p.enabled ?? true) || f.presets[0];
                        if (def) map[f.id] = def.id;
                    });
                    setSelectedPresets(map);
                }
            } catch (e) {
                console.warn('AI settings load failed in handleRunTool', e);
                return;
            }
        }
        const computePreset = (settings: AISettings, fId: string, pid?: string): AIFeaturePreset | undefined => {
            const feature = settings.features.find(f => f.id === fId);
            if (!feature) return undefined;
            const chosenId = pid || selectedPresets[fId];
            return feature.presets.find(p => p.id === chosenId)
                || feature.presets.find(p => p.enabled ?? true)
                || feature.presets[0];
        };
        const preset = computePreset(settingsLocal!, featureId, selectedPresets[featureId]);
        if (!preset) return;
        console.log('[Editor] handleRunTool clicked', { featureId, presetId: preset.id });
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        if (!hasSelection) return;
        // Preserve multi-line selections: add newlines between block nodes and for hardBreaks
        const selectionText = editor.state.doc.textBetween(from, to, '\n', '\n');

    // Caret-based anchoring used for the mini panel
        // Snapshot full document to support a robust Reject (restore snapshot)
    const beforeDocSnapshot = (() => { try { return editor.getJSON(); } catch { return null; } })();
    beforeDocSnapshotRef.current = beforeDocSnapshot;

        // Rephrase: multi-line gets JSON, single-line gets plain text
        const isMultiTool = featureId === 'rephrase_multiple_lines';
        const isMultiline = isMultiTool || selectionText.includes('\n');
    if (featureId === 'rephrasing' || isMultiTool) {
            abortRef.current?.abort();
            abortRef.current = new AbortController();
            stoppedRef.current = false; // reset user-stop flag at new run start
            if (isMultiline) {
                setIsAIRunning(true);
                // Prefer a JSON-capable preset if configured for multi-line
                const hasMLFeature = !!settingsLocal!.features.find(f => f.id === 'rephrase_multiple_lines');
                const requestedFeatureId = hasMLFeature ? 'rephrase_multiple_lines' : 'rephrasing';
                const presetML = isMultiTool
                    ? preset
                    : (computePreset(settingsLocal!, requestedFeatureId) || preset);
                const instruction = 'Respond strictly as JSON. Prefer an object with a "pairs" array; a plain JSON array is also accepted. Each item MUST be an object with either {"original": string[], "rephrased": string} or {"originalParagraphs": string[], "rephrasedText": string}. IMPORTANT: Stream results as an array of objects and emit each object as soon as it is ready. Do not wait to bundle all objects together. No code fences.';
                // SDK-level JSON schema enforcement (object with pairs: []) for non-stream fallback
                const responseFormat = {
                    type: 'json_schema',
                    json_schema: {
                        name: 'RephrasePairs',
                        schema: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['pairs'],
                            properties: {
                                pairs: {
                                    type: 'array',
                                    minItems: 1,
                                    items: {
                                        type: 'object',
                                        additionalProperties: false,
                                        required: ['original', 'rephrased'],
                                        properties: {
                                            original: { type: 'array', items: { type: 'string' }, minItems: 1 },
                                            rephrased: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        },
                        strict: true
                    }
                } as any;

                // Open the modal immediately with no rows; we'll append as we parse
                setPairsModal({ open: true, pairs: [], from, to });

                // Streaming JSON array parser (state machine) that tolerates partial objects and variations in keys
                // It detects the pairs array start and then emits each completed object immediately.
                let pairsStarted = false;        // we have seen the start of the pairs array [
                let scanWindow = '';             // rolling window for detecting "pairs": [
                let inObj = false;               // currently inside an object within the pairs array
                let objDepth = 0;                // curly brace depth for current object
                let objBuf = '';                 // buffer for the current object text
                let inObjString = false;         // string-state inside current object
                let inObjEscape = false;         // escape-state inside string

                // Normalize possible key variants to our RephrasePair shape
                const normalizePair = (obj: any): RephrasePair | null => {
                    if (!obj || typeof obj !== 'object') return null;
                    const origRaw = obj.original ?? obj.originalParagraphs ?? obj.original_paragraphs ?? obj.orig ?? obj.originalLines ?? obj.originalTexts ?? obj.original_texts ?? obj.origianlPartagrapohs;
                    let original: string[] | null = null;
                    if (Array.isArray(origRaw)) original = origRaw.map((x) => String(x));
                    else if (typeof origRaw === 'string') original = [origRaw];
                    // Some providers may nest original as object with lines
                    else if (origRaw && typeof origRaw === 'object' && Array.isArray(origRaw.lines)) original = origRaw.lines.map((x: any) => String(x));

                    const reRaw = obj.rephrased ?? obj.rephrasedText ?? obj.repjrasedText ?? obj.paraphrased ?? obj.paraphrase ?? obj.text ?? obj.output ?? obj.result;
                    const rephrased = (reRaw !== undefined && reRaw !== null) ? String(reRaw) : undefined;

                    if (!original || !rephrased) return null;
                    return { original, rephrased };
                };

                const pushObject = (raw: string) => {
                    try {
                        const obj = JSON.parse(raw);
                        // direct item case
                        let pair = normalizePair(obj);
                        // wrapped single-item case: { pairs: [ {..} ] }
                        if (!pair && Array.isArray(obj?.pairs) && obj.pairs.length === 1) {
                            pair = normalizePair(obj.pairs[0]);
                        }
                        if (!pair) return;
                        setPairsModal(prev => ({ ...prev, pairs: [...prev.pairs, pair as RephrasePair] }));
                    } catch {
                        // ignore malformed chunk
                    }
                };

                try {
                    await runFeature({
                        featureId: requestedFeatureId,
                        settings: settingsLocal!,
                        selectionText,
                        presetId: presetML?.id,
                        signal: abortRef.current.signal,
                        stream: true,
                        appendToUserPrompt: instruction,
                        responseFormat,
                        onDelta: (chunk: string) => {
                            for (let i = 0; i < chunk.length; i++) {
                                const ch = chunk[i];
                                // If we haven't found the pairs array yet, keep a small rolling window and detect it with a regex
                                if (!pairsStarted) {
                                    scanWindow += ch;
                                    // Keep last ~64 chars to bound memory
                                    if (scanWindow.length > 64) scanWindow = scanWindow.slice(-64);
                                    if (/"pairs"\s*:\s*\[$/.test(scanWindow)) {
                                        pairsStarted = true; // next chars belong to items within the array
                                    } else if (/^\s*\[$/.test(scanWindow)) {
                                        // Fallback: provider streams a bare array like [ {..}, {..} ]
                                        pairsStarted = true;
                                    }
                                    continue;
                                }

                                // We are within the pairs array stream
                                if (!inObj) {
                                    if (ch === '{') {
                                        inObj = true;
                                        objDepth = 1;
                                        objBuf = '{';
                                        inObjString = false;
                                        inObjEscape = false;
                                        continue;
                                    }
                                    // Array could end without any object (edge)
                                    if (ch === ']') {
                                        // Done with array
                                        pairsStarted = false;
                                        continue;
                                    }
                                    // Skip commas/whitespace between objects
                                    continue;
                                }

                                // We are inside an object; accumulate and track string/escape and depth
                                objBuf += ch;
                                if (inObjString) {
                                    if (inObjEscape) { inObjEscape = false; continue; }
                                    if (ch === '\\') { inObjEscape = true; continue; }
                                    if (ch === '"') { inObjString = false; continue; }
                                    continue;
                                } else {
                                    if (ch === '"') { inObjString = true; continue; }
                                    if (ch === '{') { objDepth++; continue; }
                                    if (ch === '}') {
                                        objDepth--;
                                        if (objDepth === 0) {
                                            // Completed one object; emit immediately
                                            pushObject(objBuf);
                                            inObj = false;
                                            objBuf = '';
                                        }
                                        continue;
                                    }
                                    // other characters inside object (commas, spaces, brackets in arrays) are fine
                                    continue;
                                }
                            }
                        },
                        onDone: (finalJson?: string) => {
                            // Fallback: if nothing was appended during streaming, try parsing the final JSON
                            if (finalJson) {
                                try {
                                    // Strip code fences if any
                                    let text = finalJson.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
                                    const parsed = JSON.parse(text);
                                    let items: any[] = [];
                                    if (Array.isArray(parsed)) items = parsed;
                                    else if (Array.isArray(parsed?.pairs)) items = parsed.pairs;
                                    if (items.length) {
                                        const normed: RephrasePair[] = [];
                                        for (const it of items) {
                                            const p = normalizePair(it);
                                            if (p) normed.push(p);
                                        }
                                        if (normed.length) {
                                            setPairsModal(prev => prev.pairs.length ? prev : { ...prev, pairs: normed });
                                        }
                                    }
                                } catch (e) {
                                    console.warn('Failed to parse final JSON for pairs fallback', e);
                                }
                            }
                            setIsAIRunning(false);
                        },
                        onError: (e: any) => {
                            console.error('AI error:', e);
                            if (stoppedRef.current) {
                                // user canceled; don't revert/close overlays here
                                setIsAIRunning(false);
                                stoppedRef.current = false;
                                return;
                            }
                            setIsAIRunning(false);
                        },
                    } as any);
                } catch (e) {
                    console.error('Failed streaming multi-line:', e);
                    if (stoppedRef.current) {
                        setIsAIRunning(false);
                        stoppedRef.current = false;
                    } else {
                        setIsAIRunning(false);
                    }
                }
                return;
            } else {
                // Single-line: streaming plain text, transactionally
                setIsAIRunning(true);
                const originalContent = editor.state.doc.textBetween(from, to);
                let insertedPos = from;
                let accumulatedText = '';
                // Robust cleaner for providers that insist on JSON/fences; buffers until we see real sentence content
                let wrapperSkipped = false;
                let pending = '';
                // Start transaction: delete selection
                let tr = editor.state.tr.delete(from, to);
                editor.view.dispatch(tr);
                // Position mini-panel above the caret where new text will be inserted
                try {
                    const caret = editor.view.coordsAtPos(from);
                    setSelectionOverlay({
                        anchor: { top: caret.top, left: caret.left },
                        anchorPos: from,
                        status: 'loading',
                    });
                } catch {}
                let transactionStarted = true;
                try {
                    await runFeature({
                        featureId,
                        settings: settingsLocal!,
                        selectionText,
                        presetId: preset.id,
                        signal: abortRef.current.signal,
                        stream: true,
                        // Force plain text, no JSON or fences
                        appendToUserPrompt: 'Rephrase the Selection into a single sentence. Output ONLY the rephrased sentence as plain text — no JSON, no code fences, no quotes, no labels. Preserve meaning and tense.',
                        onDelta: (s) => {
                            pending += s;
                            if (!wrapperSkipped) {
                                // Strip leading fences/whitespace
                                let changed = true;
                                while (changed) {
                                    changed = false;
                                    const before = pending;
                                    pending = pending.replace(/^```(?:json)?\s*/i, '');
                                    pending = pending.replace(/^\s+/, '');
                                    pending = pending.replace(/^\{+\s*/, '');
                                    pending = pending.replace(/^\[+\s*/, '');
                                    pending = pending.replace(/^"?(rephrased_text|text|output|result|content)"?\s*:\s*"?/i, '');
                                    pending = pending.replace(/^"text"\s*:\s*"?/i, '');
                                    pending = pending.replace(/^"variants"\s*:\s*\[\s*\{\s*"label"\s*:\s*"[^"]*"\s*,\s*"text"\s*:\s*"?/i, '');
                                    pending = pending.replace(/^"?choices"?\s*:\s*\[\s*\{\s*"message"\s*:\s*\{\s*"content"\s*:\s*"?/i, '');
                                    if (pending !== before) changed = true;
                                }
                                // Decide if we have started natural sentence content (letters or digits)
                                if (/[A-Za-z0-9]/.test(pending)) {
                                    wrapperSkipped = true;
                                } else {
                                    // Still waiting for meaningful content; do not emit yet
                                    return;
                                }
                            }
                            // Remove trailing code fence markers within stream
                            pending = pending.replace(/```$/i, '');
                            // Emit only delta since last insert
                            const toEmit = pending.slice(accumulatedText.length);
                            if (!toEmit) return;
                            accumulatedText += toEmit;
                            editor.view.dispatch(editor.state.tr.insertText(toEmit, insertedPos));
                            insertedPos += toEmit.length;
                        },
                        onDone: () => {
                            // Clean any trailing quote/brace/backticks if slipped through
                            let cleaned = accumulatedText.replace(/`{0,3}\s*$/,'').replace(/[}\]]+\s*$/,'');
                            cleaned = cleaned.replace(/"\s*}\s*$/,'').replace(/\s*"\s*$/,'');
                            if (cleaned.length !== accumulatedText.length) {
                                const toRemove = accumulatedText.length - cleaned.length;
                                editor.view.dispatch(
                                    editor.state.tr.delete(insertedPos - toRemove, insertedPos)
                                );
                                insertedPos -= toRemove;
                                accumulatedText = cleaned;
                            }
                            setIsAIRunning(false);
                            // Show accept/reject above the insertion caret
                            try {
                                const caret = editor.view.coordsAtPos(from);
                                setSelectionOverlay({
                                    anchor: { top: caret.top, left: caret.left },
                                    anchorPos: from,
                                    status: 'confirm',
                                    onAccept: () => {
                                        setSelectionOverlay(null);
                                    },
                                    onReject: () => {
                                        try {
                                            if (beforeDocSnapshot) {
                                                editor.commands.setContent(beforeDocSnapshot as any, { emitUpdate: false });
                                            } else if (transactionStarted) {
                                                editor.view.dispatch(
                                                    editor.state.tr
                                                        .delete(from, from + accumulatedText.length)
                                                        .insertText(originalContent, from)
                                                );
                                            }
                                        } finally {
                                            setSelectionOverlay(null);
                                        }
                                    }
                                });
                            } catch {
                                setSelectionOverlay(prev => prev ? { ...prev, status: 'confirm' } : prev);
                            }
                        },
                        onError: (e) => {
                            console.error('AI error:', e);
                            if (stoppedRef.current) {
                                // user canceled; keep confirm UI, don't revert
                                setIsAIRunning(false);
                                stoppedRef.current = false;
                                return;
                            }
                            // Revert if error
                            if (transactionStarted) {
                                editor.view.dispatch(
                                    editor.state.tr
                                        .delete(from, from + accumulatedText.length)
                                        .insertText(originalContent, from)
                                );
                            }
                            setIsAIRunning(false);
                            setSelectionOverlay(null);
                        },
                    });
                } catch (error) {
                    console.error('Failed to process AI feature:', error);
                    if (stoppedRef.current) {
                        setIsAIRunning(false);
                        stoppedRef.current = false;
                    } else {
                        // Revert if error
                        if (transactionStarted) {
                            editor.view.dispatch(
                                editor.state.tr
                                    .delete(from, from + accumulatedText.length)
                                    .insertText(originalContent, from)
                            );
                        }
                        setIsAIRunning(false);
                        setSelectionOverlay(null);
                    }
                }
                return;
            }
        }
        // Concising (Shorten): stream chunk-by-chunk into a single insertion
        if (featureId === 'concising') {
            // Cancel any in-flight run and start fresh
            abortRef.current?.abort();
            abortRef.current = new AbortController();
            stoppedRef.current = false; // reset user-stop flag at new run start
            setIsAIRunning(true);
            // Start by deleting the selection once
            editor.view.dispatch(editor.state.tr.delete(from, to));
            // Position mini-panel above the caret where text will be inserted
            try {
                const caret = editor.view.coordsAtPos(from);
                setSelectionOverlay({
                    anchor: { top: caret.top, left: caret.left },
                    anchorPos: from,
                    status: 'loading',
                });
            } catch {}
            // Stream tokens and insert as they arrive
            const originalContent = editor.state.doc.textBetween(from, to);
            let insertedPos = from;
            let accumulatedText = '';
            let transactionStarted = true;
            let pending = '';
            let wrapperSkipped = false; // in case provider tries to wrap in JSON/fences
            try {
                await runFeature({
                    featureId,
                    settings: settingsLocal!,
                    selectionText,
                    presetId: preset.id,
                    signal: abortRef.current.signal,
                    stream: true,
                    appendToUserPrompt: 'Shorten the Selection. Output ONLY the shortened text as plain text — no JSON, no code fences, no quotes, no labels.',
                    onDelta: (s: string) => {
                        pending += s;
                        if (!wrapperSkipped) {
                            // Strip common wrappers at the start
                            let changed = true;
                            while (changed) {
                                changed = false;
                                const before = pending;
                                pending = pending.replace(/^```(?:json)?\s*/i, '');
                                pending = pending.replace(/^\s+/, '');
                                pending = pending.replace(/^\{+\s*/, '');
                                pending = pending.replace(/^\[+\s*/, '');
                                pending = pending.replace(/^"?(shortened_text|rephrased_text|text|output|result|content)"?\s*:\s*"?/i, '');
                                if (pending !== before) changed = true;
                            }
                            if (/[A-Za-z0-9]/.test(pending)) {
                                wrapperSkipped = true;
                            } else {
                                return; // keep buffering until real content begins
                            }
                        }
                        // Clean trailing fence marker if provider closes early
                        pending = pending.replace(/```$/i, '');
                        const toEmit = pending.slice(accumulatedText.length);
                        if (!toEmit) return;
                        accumulatedText += toEmit;
                        editor.view.dispatch(editor.state.tr.insertText(toEmit, insertedPos));
                        insertedPos += toEmit.length;
                    },
                    onDone: () => {
                        // Trim any trailing quotes/braces left by eager providers
                        let cleaned = accumulatedText.replace(/`{0,3}\s*$/, '').replace(/[}\]]+\s*$/, '');
                        cleaned = cleaned.replace(/"\s*}\s*$/, '').replace(/\s*"\s*$/, '');
                        if (cleaned.length !== accumulatedText.length) {
                            const toRemove = accumulatedText.length - cleaned.length;
                            editor.view.dispatch(
                                editor.state.tr.delete(insertedPos - toRemove, insertedPos)
                            );
                            insertedPos -= toRemove;
                            accumulatedText = cleaned;
                        }
                        setIsAIRunning(false);
                        // Present accept/reject UI above caret
                        try {
                            const caret = editor.view.coordsAtPos(from);
                            setSelectionOverlay({
                                anchor: { top: caret.top, left: caret.left },
                                anchorPos: from,
                                status: 'confirm',
                                onAccept: () => setSelectionOverlay(null),
                                onReject: () => {
                                    try {
                                        if (beforeDocSnapshot) {
                                            editor.commands.setContent(beforeDocSnapshot as any, { emitUpdate: false });
                                        } else if (transactionStarted) {
                                            editor.view.dispatch(
                                                editor.state.tr
                                                    .delete(from, from + accumulatedText.length)
                                                    .insertText(originalContent, from)
                                            );
                                        }
                                    } finally {
                                        setSelectionOverlay(null);
                                    }
                                }
                            });
                        } catch {
                            setSelectionOverlay(prev => prev ? { ...prev, status: 'confirm' } : prev);
                        }
                    },
                    onError: (e: any) => {
                        console.error('AI error (concising):', e);
                        if (stoppedRef.current) {
                            setIsAIRunning(false);
                            stoppedRef.current = false;
                            return;
                        }
                        if (transactionStarted) {
                            editor.view.dispatch(
                                editor.state.tr
                                    .delete(from, from + accumulatedText.length)
                                    .insertText(originalContent, from)
                            );
                        }
                        setIsAIRunning(false);
                        setSelectionOverlay(null);
                    },
                });
            } catch (e) {
                console.error('Failed to stream concising:', e);
                if (stoppedRef.current) {
                    setIsAIRunning(false);
                    stoppedRef.current = false;
                } else {
                    if (transactionStarted) {
                        editor.view.dispatch(
                            editor.state.tr
                                .delete(from, from + accumulatedText.length)
                                .insertText(originalContent, from)
                        );
                    }
                    setIsAIRunning(false);
                    setSelectionOverlay(null);
                }
            }
            return;
        }
        // Other features: paragraph-aware streaming (each \n starts a new TipTap paragraph)
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        stoppedRef.current = false; // reset user-stop flag at new run start
    setIsAIRunning(true);
    // Start by deleting the selection once; then append paragraphs as they complete
    editor.view.dispatch(editor.state.tr.delete(from, to));
    // Position mini-panel above the caret where paragraphs will be inserted
        try {
            const caret = editor.view.coordsAtPos(from);
            setSelectionOverlay({
                anchor: { top: caret.top, left: caret.left },
                anchorPos: from,
                status: 'loading',
            });
        } catch {}
        let current = '';
        try {
            await runFeature({
                featureId,
    settings: settingsLocal!,
                selectionText,
                presetId: preset.id,
                signal: abortRef.current.signal,
        stream: true,
                onDelta: (chunk) => {
                    current += chunk;
                    // Normalize newlines and emit every complete paragraph we have
                    const parts = current.split(/\r?\n/);
                    // keep the last part as the new current (may be incomplete)
                    current = parts.pop() ?? '';
                    for (const para of parts) {
                        const text = para; // don't trim; preserve writer's spaces
                        // Skip emitting if it's an empty paragraph (avoid noise)
                        if (text.length === 0) {
                            // Insert an empty paragraph only if we already inserted some content
                            // to respect explicit blank lines
                            editor.chain().focus().insertContent({ type: 'paragraph', content: [] }).run();
                        } else {
                            editor.chain().focus().insertContent({ type: 'paragraph', content: [{ type: 'text', text }] }).run();
                        }
                    }
                },
                onDone: () => {
                    if (current.length > 0) {
                        editor.chain().focus().insertContent({ type: 'paragraph', content: [{ type: 'text', text: current }] }).run();
                        current = '';
                    }
                    setIsAIRunning(false);
                    // Present accept/reject UI above caret
                    try {
                        const caret = editor.view.coordsAtPos(from);
                        setSelectionOverlay({
                            anchor: { top: caret.top, left: caret.left },
                            anchorPos: from,
                            status: 'confirm',
                            onAccept: () => setSelectionOverlay(null),
                            onReject: () => {
                                try {
                                    if (beforeDocSnapshot) {
                                        editor.commands.setContent(beforeDocSnapshot as any, { emitUpdate: false });
                                    }
                                } finally {
                                    setSelectionOverlay(null);
                                }
                            }
                        });
                    } catch {
                        setSelectionOverlay(prev => prev ? { ...prev, status: 'confirm' } : prev);
                    }
                },
                onError: (e) => {
                    console.error('AI error:', e);
                    if (stoppedRef.current) {
                        setIsAIRunning(false);
                        stoppedRef.current = false;
                        return;
                    }
                    setIsAIRunning(false);
                    // Revert on error if we can
                    try {
                        if (beforeDocSnapshot) {
                            editor.commands.setContent(beforeDocSnapshot as any, { emitUpdate: false });
                        }
                    } finally {
                        setSelectionOverlay(null);
                    }
                },
            });
        } catch (e) {
            console.error('Failed to stream feature:', e);
            if (stoppedRef.current) {
                setIsAIRunning(false);
                stoppedRef.current = false;
            } else {
                setIsAIRunning(false);
                try {
                    if (beforeDocSnapshot) {
                        editor.commands.setContent(beforeDocSnapshot as any, { emitUpdate: false });
                    }
                } finally {
                    setSelectionOverlay(null);
                }
            }
        }
    };

    const GearIcon: React.FC<{ className?: string }> = ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.983 6.5a1 1 0 0 1 .934.648l.3.8a1 1 0 0 0 .66.61l.82.26a1 1 0 0 1 .6.6l.26.82a1 1 0 0 0 .61.66l.8.3a1 1 0 0 1 .648.934v1a1 1 0 0 1-.648.934l-.8.3a1 1 0 0 0-.61.66l-.26.82a1 1 0 0 1-.6.6l-.82.26a1 1 0 0 0-.66.61l-.3.8a1 1 0 0 1-.934.648h-1a1 1 0 0 1-.934-.648l-.3-.8a1 1 0 0 0-.66-.61l-.82-.26a1 1 0 0 1-.6-.6l-.26-.82a1 1 0 0 0-.61-.66l-.8-.3A1 1 0 0 1 6.5 12.483v-1a1 1 0 0 1 .648-.934l.8-.3a1 1 0 0 0 .61-.66l.26-.82a1 1 0 0 1 .6-.6l.82-.26a1 1 0 0 0 .66-.61l.3-.8A1 1 0 0 1 10.983 6.5h1z" />
            <circle cx="11.983" cy="11.983" r="2.25" />
        </svg>
    );

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
           // console.log('Selection update:', { from, to, hasSelection });
            const selectedText = editor.state.doc.textBetween(from, to).trim();
           // console.log('Selected text:', selectedText);
            if (hasSelection && selectedText.length > 0) {
                // Check if selection is within a custom node (prevent bubble menu in custom nodes)
                const { $from } = editor.state.selection as any;
                let isInCustomNode = false;
                for (let i = $from.depth; i >= 0; i--) {
                    const node = $from.node(i);
                    if (
                        node.type.name === 'sceneBeat' ||
                        node.type.name === 'noteSection' ||
                        node.type.name === 'characterImpersonation'
                    ) {
                        isInCustomNode = true;
                        break;
                    }
                }

                // Don't show bubble menu if selection is within a custom node
                if (isInCustomNode) {
                    setIsVisible(false);
                    return;
                }

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

    // React to BookContext restore signal
    const { lastRestored } = useBookContext();
    useEffect(() => {
        if (!editor || !lastRestored) return;
        try {
            editor.commands.setContent(lastRestored.content as any, { emitUpdate: false });
            (window as any).__currentChapterJSON = lastRestored.content;
        } catch (err) {
            console.error('Failed to apply restored content to editor via context signal', err);
        }
    }, [lastRestored, editor]);

                

    // Always render modals; conditionally render the bubble itself
    return (
        <>
        {/* Keep mini-panel anchored during scroll/resize */}
    {selectionOverlay && (
            <RecomputeAnchor view={editor.view} anchorPos={selectionOverlay.anchorPos} onUpdate={(pt) => {
                setSelectionOverlay(prev => prev ? { ...prev, anchor: pt } : prev);
            }} />
        )}
        {presetModal.open && aiSettings && presetModal.featureId && (
            <PresetPickerModal 
                featureId={presetModal.featureId}
                aiSettings={aiSettings}
                selectedId={selectedPresets[presetModal.featureId]}
                onClose={() => setPresetModal({ open: false })}
                onSave={(id) => { setSelectedPresets(prev => ({ ...prev, [presetModal.featureId as string]: id })); setPresetModal({ open: false }); }}
            />
        )}
        {compareModal.open && (
            <RephraseCompareModal 
                variants={compareModal.variants}
                onAccept={(t: string) => { compareModal.onAccept?.(t); }}
                onClose={() => setCompareModal({ open: false, variants: [] })}
            />
        )}
    {pairsModal.open && (
            <RephrasePairsModal
                busy={isAIRunning}
                pairs={pairsModal.pairs}
                onRephraseOne={async (rowIndex) => {
                    try {
                        const original = pairsModal.pairs[rowIndex]?.original?.join('\n') ?? '';
                        if (!original) return '';
                        let finalText = '';
                        const presetR = getSelectedPreset('rephrasing');
                        await runFeature({
                            featureId: 'rephrasing',
                            settings: aiSettings!,
                            selectionText: original,
                            presetId: presetR?.id,
                            signal: undefined,
                            stream: false,
                            appendToUserPrompt: 'Rephrase into ONE paragraph. Output only the rephrased paragraph as plain text — no JSON, no code fences, no quotes.',
                            onDone: (t: string) => { finalText = t; },
                            onError: (e: any) => { console.error('AI error (row rephrase):', e); },
                        } as any);
                        return finalText;
                    } catch (e) {
                        console.error('Failed to rephrase row:', e);
                        return '';
                    }
                }}
                onAccept={(finalParagraphs) => {
                    const nodes = finalParagraphs.map(p => p && p.length > 0
                        ? { type: 'paragraph', content: [{ type: 'text', text: p }] }
                        : { type: 'paragraph', content: [] }
                    );
                    editor.chain().focus().insertContentAt({ from: pairsModal.from, to: pairsModal.to }, nodes as any).run();
                    setPairsModal({ open: false, pairs: [], from: 0, to: 0 });
                }}
                onClose={() => setPairsModal({ open: false, pairs: [], from: 0, to: 0 })}
            />
        )}
        {selectionOverlay && (
            <div
                style={{
                    position: 'fixed',
                    top: `${Math.max(8, selectionOverlay.anchor.top - 40)}px`,
                    left: `${selectionOverlay.anchor.left}px`,
                    zIndex: 10000,
                    pointerEvents: 'none',
                }}
            >
                {selectionOverlay.status === 'loading' ? (
                    <div className="pointer-events-auto flex items-center gap-2 px-2 py-1.5 rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 bg-gradient-to-br from-gray-900 to-black dark:from-slate-100 dark:to-slate-200">
                        <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                        <span className="text-xs text-slate-100 dark:text-slate-900">Working…</span>
            <button
                            className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 ml-1"
                            onClick={(e) => {
                                e.preventDefault(); e.stopPropagation();
                try { abortRef.current?.abort(); } catch {}
                stoppedRef.current = true;
                                setIsAIRunning(false);
                                // Move to confirm state (allow reject to restore snapshot)
                                const from = selectionOverlay.anchorPos;
                                try {
                                    const caret = editor.view.coordsAtPos(from);
                                    setSelectionOverlay({
                                        anchor: { top: caret.top, left: caret.left },
                                        anchorPos: from,
                                        status: 'confirm',
                                        onAccept: () => setSelectionOverlay(null),
                                        onReject: () => {
                                            try {
                                                const snap = beforeDocSnapshotRef.current;
                                                if (snap) {
                                                    editor.commands.setContent(snap as any, { emitUpdate: false });
                                                }
                                            } finally { setSelectionOverlay(null); }
                                        }
                                    });
                                } catch {
                                    setSelectionOverlay(prev => prev ? { ...prev, status: 'confirm' } : prev);
                                }
                            }}
                        >
                            Stop
                        </button>
                    </div>
                ) : (
                    <div className="pointer-events-auto flex items-center gap-2 px-2 py-1.5 rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 bg-gradient-to-br from-gray-900 to-black dark:from-slate-100 dark:to-slate-200">
                        <button
                            className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                            onClick={() => selectionOverlay.onAccept && selectionOverlay.onAccept()}
                        >
                            Accept
                        </button>
                        <button
                            className="text-xs px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20 dark:bg-black/10 dark:text-black dark:hover:bg-black/20"
                            onClick={() => selectionOverlay.onReject && selectionOverlay.onReject()}
                        >
                            Reject
                        </button>
                    </div>
                )}
            </div>
        )}
        {showNoteModal && (
            <NoteModal
                isOpen={showNoteModal}
                onClose={() => setShowNoteModal(false)}
                onSave={(note) => {
                    const { from, to } = editor.state.selection;
                    if (from !== to) {
                        editor.chain()
                            .focus()
                            .setMark('highlight', { color: '#fef08a' })
                            .insertContent(`<span data-note="${note}">`)
                            .run();
                    } else {
                        editor.chain()
                            .focus()
                            .insertContent(`<mark style="background-color: #fef08a;" data-note="${note}">${note}</mark>`)
                            .run();
                    }
                    setShowNoteModal(false);
                }}
            />
        )}
        {isVisible && (
        <div
            ref={menuRef}
            className="fixed z-50 bg-gray-800 text-white dark:bg-gray-100 dark:text-black rounded-xl shadow-lg border border-gray-700/50 dark:border-gray-200/50 max-w-6xl"
            style={{
                top: position.top,
                left: position.left,
                transform: 'translateX(-50%)',
                overflow: 'visible'
            }}
        >
            {/* Header with Quick Actions */}
            <div className="flex items-center gap-2 p-2 border-b border-gray-700/50 dark:border-gray-200/50" style={{ overflow: 'visible' }}>
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
            <div 
                className="flex items-center gap-2 p-3"
                style={{ 
                    overflowX: 'auto',
                    overflowY: 'visible',
                    scrollbarWidth: 'thin'
                }}
            >
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
                        {aiTools.map(tool => {
                            const isRephrase = tool.featureId === 'rephrasing';
                            let label: string = tool.name as unknown as string;
                            if (isRephrase) {
                                // Peek selection to hint behavior in UI label
                                const { from, to } = editor.state.selection;
                                const sel = editor.state.doc.textBetween(from, to, '\n', '\n');
                                const isMulti = sel.includes('\n');
                                label = isMulti ? 'Rephrase (Auto · multi-line)' : 'Rephrase (Auto)';
                            }
                            return (
                                <div key={tool.name} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/10 dark:hover:bg-black/10">
                                    <button onClick={() => handleRunTool(tool.featureId)} className="flex items-center gap-3 text-sm text-gray-300 dark:text-gray-700">
                                        <tool.icon className="w-4 h-4"/>
                                        {label}
                                    </button>
                                    <button onClick={() => {
                                        if (isRephrase) {
                                            const { from, to } = editor.state.selection;
                                            const sel = editor.state.doc.textBetween(from, to, '\n', '\n');
                                            const isMulti = sel.includes('\n');
                                            setPresetModal({ open: true, featureId: isMulti ? 'rephrase_multiple_lines' : 'rephrasing' });
                                        } else {
                                            setPresetModal({ open: true, featureId: tool.featureId });
                                        }
                                    }} className="p-1 rounded hover:bg-white/10 dark:hover:bg-black/10" title="Choose preset">
                                        <GearIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </Dropdown>
                </div>
            </div>
        </div>
    )}
    </>
    );
};

// Simple modal to select preset for a feature
const PresetPickerModal: React.FC<{ featureId: string; aiSettings: AISettings; selectedId?: string; onSave: (presetId: string) => void; onClose: () => void }> = ({ featureId, aiSettings, selectedId, onSave, onClose }) => {
    const feature = aiSettings.features.find(f => f.id === featureId);
    if (!feature) return null;
    const [value, setValue] = useState<string>(selectedId || (feature.presets.find(p => p.enabled ?? true)?.id || feature.presets[0]?.id));
    return (
        <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[420px] max-w-[90vw] p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Select Preset · {feature.label}</div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">✕</button>
                </div>
                <div className="space-y-2 max-h-[260px] overflow-auto">
                    {feature.presets.map(p => {
                        const provider = aiSettings.providers.find(pr => pr.id === p.provider);
                        return (
                          <label key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                              <input type="radio" name="preset" checked={value === p.id} onChange={() => setValue(p.id)} />
                              <div className="flex-1">
                                  <div className="text-sm font-medium">{p.name} {p.enabled === false && <span className="text-xs text-orange-500">(disabled)</span>}</div>
                                  <div className="text-xs text-gray-500">{provider?.name || p.provider} · {p.model}</div>
                              </div>
                          </label>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-2 mt-3">
                    <button onClick={onClose} className="px-3 py-1.5 rounded border">Cancel</button>
                    <button onClick={() => onSave(value)} className="px-3 py-1.5 rounded bg-purple-600 text-white">Use Preset</button>
                </div>
            </div>
        </div>
    );
};

// Minimal compare modal for multi-line rephrase
const RephraseCompareModal: React.FC<{ variants: Array<{ label: string; text: string }>; onAccept: (text: string) => void; onClose: () => void }> = ({ variants, onAccept, onClose }) => {
    return (
        <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[800px] max-w-[95vw] p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Compare Rephrases</div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">✕</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {variants.map((v, i) => (
                        <div key={i} className="border rounded p-3 bg-gray-50 dark:bg-gray-800">
                            <div className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-300">{v.label || `Option ${i + 1}`}</div>
                            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm">{v.text}</div>
                            <div className="flex justify-end mt-3">
                                <button onClick={() => onAccept(v.text)} className="px-3 py-1.5 rounded bg-purple-600 text-white">Accept</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
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
    // Early return MUST be before any hooks to maintain hook order
    if (!isOpen) return null;

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

    // Professional fonts for publishing - organized by categories
    const fontFamilies = {
        'Serif Fonts (Traditional)': [
            { name: 'Garamond', value: 'Garamond, serif', kdp: true, ingram: true },
            { name: 'Baskerville', value: 'Baskerville, serif', kdp: true, ingram: true },
            { name: 'Georgia', value: 'Georgia, serif', kdp: true, ingram: true },
            { name: 'Palatino', value: 'Palatino, serif', kdp: true, ingram: true },
            { name: 'Times New Roman', value: 'Times New Roman, serif', kdp: true, ingram: true },
            { name: 'Bookerly', value: 'Bookerly, serif', kdp: true, ingram: false },
        ],
        'Sans-Serif Fonts (Modern)': [
            { name: 'Arial', value: 'Arial, sans-serif', kdp: true, ingram: true },
            { name: 'Helvetica', value: 'Helvetica, sans-serif', kdp: true, ingram: true },
            { name: 'Calibri', value: 'Calibri, sans-serif', kdp: true, ingram: false },
        ],
        'Monospace Fonts (Typewriter)': [
            { name: 'Courier', value: 'Courier, monospace', kdp: true, ingram: true },
            { name: 'Courier Prime', value: 'Courier Prime, monospace', kdp: true, ingram: true },
            { name: 'Consolas', value: 'Consolas, monospace', kdp: true, ingram: false },
        ]
    };

    // Create flat array for easy filtering
    const allFonts = Object.values(fontFamilies).flat();
    const [fontFilter, setFontFilter] = useState<'all' | 'kdp' | 'ingram' | 'both'>('all');
    const [showFontFilter, setShowFontFilter] = useState(false);

    // 3D mouse movement tracking for BookCard-like effect
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        setMousePosition({ x: x / 10, y: y / 10 }); // Reduced sensitivity
    };

    // Apply settings in real-time to editor
    const applySettingsToEditor = (newSettings: TypographySettings) => {
        console.log('Applying settings to editor:', newSettings);
        const editorElement = editor.view.dom as HTMLElement;
        const container = editorElement.closest('.prose') as HTMLElement;
        
        if (container) {
            // Create a unique ID for this editor instance
            const editorId = 'typography-editor-' + Math.random().toString(36).substr(2, 9);
            container.setAttribute('data-typography-id', editorId);
            
            // Remove any existing typography styles
            const existingStyle = document.getElementById('typography-styles');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            // Apply font family and size to container
            container.style.fontFamily = newSettings.fontFamily;
            
            const sizeMap = {
                'text-sm': '14px',
                'text-base': '16px', 
                'text-lg': '18px',
                'text-xl': '20px'
            };
            container.style.fontSize = sizeMap[newSettings.fontSize as keyof typeof sizeMap];
            
            // Apply line height
            const lineHeightMap = {
                'tight': '1.25',
                'normal': '1.5',
                'relaxed': '1.75',
                'loose': '2'
            };
            container.style.lineHeight = lineHeightMap[newSettings.lineHeight as keyof typeof lineHeightMap];
            
            // Apply text alignment
            if (newSettings.textAlignment === 'justified') {
                container.style.textAlign = 'justify';
            } else {
                container.style.textAlign = newSettings.textAlignment as string;
            }
            
            // Apply page width
            const widthMap = {
                'narrow': '50%',
                'medium': '60%', 
                'wide': '75%',
                'full': '100%'
            };
            const editorContainer = container.parentElement?.parentElement;
            if (editorContainer) {
                editorContainer.style.maxWidth = widthMap[newSettings.pageWidth as keyof typeof widthMap];
                editorContainer.style.width = '100%';
                editorContainer.style.margin = '0 auto';
            }
            
            // Create CSS rules for text indent and paragraph spacing
            const indentMap = {
                'none': '0',
                'small': '1em',
                'medium': '2em',
                'large': '3em'
            };
            const indentValue = indentMap[newSettings.textIndent as keyof typeof indentMap];
            const spacingValue = newSettings.paragraphSpacing;
            
            console.log('Applying text indent:', newSettings.textIndent, '->', indentValue);
            console.log('Applying paragraph spacing:', spacingValue);
            
            // Inject CSS styles that will actually apply the formatting
            const styleElement = document.createElement('style');
            styleElement.id = 'typography-styles';
            styleElement.innerHTML = `
                [data-typography-id="${editorId}"] p {
                    text-indent: ${indentValue} !important;
                    margin-bottom: ${spacingValue} !important;
                }
                [data-typography-id="${editorId}"] p:first-of-type {
                    text-indent: 0 !important;
                }
                [data-typography-id="${editorId}"] blockquote p,
                [data-typography-id="${editorId}"] li p {
                    text-indent: 0 !important;
                }
            `;
            document.head.appendChild(styleElement);
            
            const paragraphs = container.querySelectorAll('p');
            console.log(`Found paragraphs: ${paragraphs.length}, applied indent: ${indentValue}, spacing: ${spacingValue}`);
            
            // Clear editor selection to prevent bubble menu
            editor.chain().blur().run();
            
            // Force a repaint to ensure styles are applied
            container.style.transform = 'translateZ(0)';
            setTimeout(() => {
                container.style.transform = '';
            }, 10);
            
        } else {
            console.log('Could not find prose container');
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
            console.log('Settings changed, applying to editor:', settings);
            applySettingsToEditor(settings);
        }
    }, [settings, isOpen, editor]);

    const handleApply = () => {
        // Settings are already applied in real-time, just cleanup and close
        setOriginalSettings(settings);
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

    // Cleanup function to remove injected styles
    const cleanupStyles = () => {
        const existingStyle = document.getElementById('typography-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
    };

    // Cleanup styles when component unmounts or closes
    useEffect(() => {
        return () => {
            if (!isOpen) {
                cleanupStyles();
            }
        };
    }, [isOpen]);

    // Filter fonts based on selected filter
    const getFilteredFonts = () => {
        const filteredFamilies: Record<string, typeof allFonts> = {};
        
        Object.entries(fontFamilies).forEach(([category, fonts]) => {
            let filteredFonts = fonts;
            
            switch (fontFilter) {
                case 'kdp':
                    filteredFonts = fonts.filter(font => font.kdp);
                    break;
                case 'ingram':
                    filteredFonts = fonts.filter(font => font.ingram);
                    break;
                case 'both':
                    filteredFonts = fonts.filter(font => font.kdp && font.ingram);
                    break;
                default:
                    filteredFonts = fonts;
            }
            
            if (filteredFonts.length > 0) {
                filteredFamilies[category] = filteredFonts;
            }
        });
        
        return filteredFamilies;
    };

    const filteredFontFamilies = getFilteredFonts();
    
    // Close font filter when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.font-filter-container')) {
                setShowFontFilter(false);
            }
        };
        
        if (showFontFilter) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
        // Always return a cleanup function (even if empty) to maintain hook consistency
        return () => {};
    }, [showFontFilter]);

    return (
        <div className="fixed inset-0 z-[100] flex">
            {/* No backdrop opacity - just click area */}
            <div 
                className="flex-1 cursor-pointer" 
                onClick={onClose}
            />
            
            {/* Card styled like BookCard with 3D tilt */}
            <motion.div
                initial={{ opacity: 0, x: 400 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 400 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-[420px] h-auto max-h-[90vh] overflow-hidden flex flex-col m-4 mr-6 group cursor-default"
                style={{ perspective: 1000 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
                whileHover={{ 
                    rotateY: mousePosition.x * 0.1, 
                    rotateX: -mousePosition.y * 0.1, 
                    scale: 1.01,
                    transition: { duration: 0.1 }
                }}
            >
                {/* Animated gradient border effect exactly like BookCard */}
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 opacity-75 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-border-blob-spin blur-xl z-0 rounded-2xl"></div>
                
                {/* Main card with exact BookCard styling and 3D transform */}
                <motion.div 
                    className="relative bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl p-6 h-full flex flex-col shadow-lg border border-transparent z-10"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/10 dark:border-white/10">
                        <motion.div 
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M12 3v18M8 7h8" />
                            </svg>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                TYPOGRAPHY
                            </h2>
                        </motion.div>
                        <motion.button
                            onClick={handleCancel}
                            className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* Content - 2-Column Grid Layout with hidden scrollbar */}
                    <div 
                        className="flex-1 overflow-y-auto space-y-6 pr-2" 
                        style={{
                            scrollbarWidth: 'none', /* Firefox */
                            msOverflowStyle: 'none', /* IE and Edge */
                        }}
                    >
                        <style dangerouslySetInnerHTML={{
                            __html: `
                                .flex-1::-webkit-scrollbar {
                                    display: none; /* Safari and Chrome */
                                }
                            `
                        }} />
                        
                        {/* Row 1: Font Family (Full Width) */}
                        <motion.div 
                            className="space-y-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M12 3v18M8 7h8" />
                                </svg>
                                <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Font Family</h3>
                            </div>
                            
                            {/* Font Family Dropdown with Filter Icon */}
                            <div className="relative font-filter-container">
                                <select
                                    value={settings.fontFamily}
                                    onChange={(e) => {
                                        setSettings(prev => ({...prev, fontFamily: e.target.value}));
                                    }}
                                    className="w-full p-3 pr-12 text-sm border border-gray-300/50 dark:border-gray-600/50 rounded-lg bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-200 backdrop-blur-sm transition-all duration-200"
                                    style={{ fontFamily: settings.fontFamily }}
                                >
                                    {Object.entries(filteredFontFamilies).map(([category, fonts]) => (
                                        <optgroup key={category} label={category}>
                                            {fonts.map((font) => (
                                                <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                                                    {font.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                
                                {/* Filter Icon */}
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <button
                                        onClick={() => setShowFontFilter(!showFontFilter)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                        title="Filter fonts by platform"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {/* Filter Dropdown */}
                                {showFontFilter && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[140px]"
                                    >
                                        <div className="p-2 space-y-1">
                                            {[
                                                { key: 'all', label: 'All Fonts', icon: '🌐' },
                                                { key: 'kdp', label: 'KDP Only', icon: '📚' },
                                                { key: 'ingram', label: 'Ingram Only', icon: '📖' },
                                                { key: 'both', label: 'Both Platforms', icon: '✅' }
                                            ].map(filter => (
                                                <button
                                                    key={filter.key}
                                                    onClick={() => {
                                                        setFontFilter(filter.key as any);
                                                        setShowFontFilter(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                                                        fontFilter === filter.key ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''
                                                    }`}
                                                >
                                                    <span>{filter.icon}</span>
                                                    {filter.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                            
                            {/* Display current font with badges */}
                            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <span>Selected:</span>
                                <span className="font-medium">{allFonts.find(f => f.value === settings.fontFamily)?.name}</span>
                                {allFonts.find(f => f.value === settings.fontFamily) && (
                                    <div className="flex gap-1">
                                        {allFonts.find(f => f.value === settings.fontFamily)?.kdp && (
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                                KDP
                                            </span>
                                        )}
                                        {allFonts.find(f => f.value === settings.fontFamily)?.ingram && (
                                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                                                Ingram
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Row 2: Text Size | Text Alignment */}
                            <motion.div 
                                className="space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                    </svg>
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Size</h3>
                                </div>
                                <div className="flex gap-1">
                                    {[
                                        { name: 'S', value: 'text-sm', size: 'text-xs' },
                                        { name: 'M', value: 'text-base', size: 'text-sm' },
                                        { name: 'L', value: 'text-lg', size: 'text-base' },
                                        { name: 'XL', value: 'text-xl', size: 'text-lg' },
                                    ].map((size) => (
                                        <motion.button
                                            key={size.value}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSettings(prev => ({...prev, fontSize: size.value}));
                                            }}
                                            className={`p-2 rounded-lg border transition-all duration-200 flex-1 ${
                                                settings.fontSize === size.value
                                                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-md'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={size.name}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="text-xs font-bold">{size.name}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div 
                                className="space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                                    </svg>
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Align</h3>
                                </div>
                                <div className="flex gap-1">
                                    {[
                                        { name: 'Left', value: 'left', icon: '←' },
                                        { name: 'Center', value: 'center', icon: '↔' },
                                        { name: 'Right', value: 'right', icon: '→' },
                                        { name: 'Justify', value: 'justified', icon: '≡' }
                                    ].map((align) => (
                                        <motion.button
                                            key={align.value}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSettings(prev => ({...prev, textAlignment: align.value}));
                                            }}
                                            className={`p-2 rounded-lg border transition-all duration-200 flex-1 ${
                                                settings.textAlignment === align.value
                                                    ? 'border-green-500 bg-green-50/80 dark:bg-green-900/30 text-green-600 dark:text-green-400 shadow-md'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={align.name}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="text-sm">{align.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Row 3: Indent | Line Height */}
                            <motion.div 
                                className="space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l-8 8 8 8m8-16l-8 8 8 8" />
                                    </svg>
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Indent</h3>
                                    <span className="text-xs text-gray-500">({settings.textIndent})</span>
                                </div>
                                <div className="flex gap-1" key={`indent-${settings.textIndent}`}>
                                    {[
                                        { name: 'None', value: 'none', icon: '|' },
                                        { name: 'Small', value: 'small', icon: '|→' },
                                        { name: 'Med', value: 'medium', icon: '| →' },
                                        { name: 'Large', value: 'large', icon: '|  →' }
                                    ].map((indent) => (
                                        <motion.button
                                            key={indent.value}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('Indent clicked:', indent.value, 'Current:', settings.textIndent);
                                                setSettings(prev => {
                                                    const newSettings = {...prev, textIndent: indent.value};
                                                    console.log('New settings after indent click:', newSettings);
                                                    return newSettings;
                                                });
                                            }}
                                            className={`p-2 rounded-lg border transition-all duration-200 text-xs flex-1 ${
                                                settings.textIndent === indent.value
                                                    ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shadow-md'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={indent.name}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="font-mono text-xs">{indent.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div 
                                className="space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Line</h3>
                                </div>
                                <div className="flex gap-1">
                                    {[
                                        { name: 'Tight', value: 'tight', icon: '≡' },
                                        { name: 'Normal', value: 'normal', icon: '⩘' },
                                        { name: 'Relax', value: 'relaxed', icon: '⩙' },
                                        { name: 'Loose', value: 'loose', icon: '⩚' }
                                    ].map((height) => (
                                        <motion.button
                                            key={height.value}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSettings(prev => ({...prev, lineHeight: height.value}));
                                            }}
                                            className={`p-2 rounded-lg border transition-all duration-200 flex-1 ${
                                                settings.lineHeight === height.value
                                                    ? 'border-red-500 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-md'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={height.name}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="text-sm">{height.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Row 4: Paragraph Spacing | Page Width */}
                            <motion.div 
                                className="space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Para</h3>
                                    <span className="text-xs text-gray-500">({settings.paragraphSpacing})</span>
                                </div>
                                <div className="flex gap-1" key={`spacing-${settings.paragraphSpacing}`}>
                                    {[
                                        { name: 'None', value: '0', icon: '▬' },
                                        { name: 'Small', value: '0.25em', icon: '▬▬' },
                                        { name: 'Med', value: '0.5em', icon: '▬ ▬' },
                                        { name: 'Large', value: '1em', icon: '▬  ▬' }
                                    ].map((spacing) => (
                                        <motion.button
                                            key={spacing.value}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('Paragraph spacing clicked:', spacing.value, 'Current:', settings.paragraphSpacing);
                                                setSettings(prev => {
                                                    const newSettings = {...prev, paragraphSpacing: spacing.value};
                                                    console.log('New settings after spacing click:', newSettings, ' spacing.value:', spacing.value);
                                                    return newSettings;
                                                });
                                            }}
                                            className={`p-2 rounded-lg border transition-all duration-200 text-xs flex-1 ${
                                                settings.paragraphSpacing === spacing.value
                                                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-md'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={spacing.name}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="font-mono text-xs">{spacing.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div 
                                className="space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Width</h3>
                                </div>
                                <div className="flex gap-1">
                                    {[
                                        { name: 'Narrow', value: 'narrow', icon: '│' },
                                        { name: 'Med', value: 'medium', icon: '┃' },
                                        { name: 'Wide', value: 'wide', icon: '█' },
                                        { name: 'Full', value: 'full', icon: '■' }
                                    ].map((width) => (
                                        <motion.button
                                            key={width.value}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSettings(prev => ({...prev, pageWidth: width.value}));
                                            }}
                                            className={`p-2 rounded-lg border transition-all duration-200 flex-1 ${
                                                settings.pageWidth === width.value
                                                    ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shadow-md'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={width.name}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="text-sm">{width.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Additional Settings */}
                        <motion.div 
                            className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <div className="grid grid-cols-2 gap-4">
                                {/* Scene Divider */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
                                        </svg>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Scene Divider</h4>
                                    </div>
                                    <select
                                        value={settings.sceneDivider}
                                        onChange={(e) => setSettings(prev => ({...prev, sceneDivider: e.target.value}))}
                                        className="w-full p-2 text-sm border border-gray-300/50 dark:border-gray-600/50 rounded bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm"
                                    >
                                        <option value="asterisks">* * *</option>
                                        <option value="boxes">■ ■ ■</option>
                                        <option value="lines">— — —</option>
                                        <option value="dots">• • •</option>
                                    </select>
                                </div>

                                {/* Checkboxes */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Options
                                    </h4>
                                    <div className="space-y-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.chicagoStyle}
                                                onChange={(e) => setSettings(prev => ({...prev, chicagoStyle: e.target.checked}))}
                                                className="w-3 h-3 text-purple-600 rounded"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Chicago Style</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.typewriterMode}
                                                onChange={(e) => setSettings(prev => ({...prev, typewriterMode: e.target.checked}))}
                                                className="w-3 h-3 text-purple-600 rounded"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Typewriter Mode</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.rememberPosition}
                                                onChange={(e) => setSettings(prev => ({...prev, rememberPosition: e.target.checked}))}
                                                className="w-3 h-3 text-purple-600 rounded"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Remember Position</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Footer like BookCard */}
                    <motion.div 
                        className="mt-6 pt-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                    >
                        <motion.button
                            onClick={handleCancel}
                            className="px-6 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 rounded-lg transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            onClick={handleApply}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-lg shadow-lg transition-all duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Apply Changes
                        </motion.button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

const EditorFloatingMenu: React.FC<{ editor: TipTapEditor; currentChapter?: any; bookId?: string; versionId?: string }> = ({ editor, currentChapter, bookId, versionId }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const { getPlotCanvas, updatePlotCanvas } = useBookContext();

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
            name: '🔗 Scene Beat', 
            icon: SparklesIcon, 
            action: async () => {
                try {
                    // Remove the "/" trigger first
                    editor.chain().focus().deleteRange({ 
                        from: editor.state.selection.from - 1, 
                        to: editor.state.selection.from 
                    }).run();

                    // Resolve current chapter and plot canvas context
                    const ch = currentChapter;
                    if (!ch) {
                        console.warn('No current chapter; cannot create scene node');
                        return;
                    }
                    const bookIdSafe = bookId || (window as any).__BOOK_CONTEXT__?.bookId;
                    const versionIdSafe = versionId || (window as any).__BOOK_CONTEXT__?.versionId;
                    if (!bookIdSafe || !versionIdSafe) {
                        console.warn('Missing book/version; cannot update plot canvas');
                    }

                    // Load plot canvas and create a new scene node under the chapter's parent node
                    let createdSceneId: string | null = null;
                    let sceneIndex: number = 1;
                    if (bookIdSafe && versionIdSafe) {
                        if (getPlotCanvas && updatePlotCanvas) {
                            const plotCanvas = await getPlotCanvas(bookIdSafe, versionIdSafe);
                            const nodes = [...(plotCanvas?.nodes || [])];
                            // Prefer the chapter's linkedPlotNodeId as parent if present
                            let chapterParentId: string | undefined = ch.linkedPlotNodeId || undefined;
                            // Otherwise, try to infer via existing scene linkage
                            if (!chapterParentId) {
                                const existingScenes = nodes.filter((n: any) => n.type === 'scene' && n.data?.data?.chapter === ch.id);
                                chapterParentId = (existingScenes[0]?.data?.parentId as string | null) || undefined;
                            }
                            if (!chapterParentId) {
                                // Try to find a chapter node whose title matches
                                const guess = nodes.find((n: any) => n.type === 'chapter' && (n.data?.data?.title === ch.title));
                                if (guess) chapterParentId = guess.id;
                            }
                            if (chapterParentId) {
                                // Compute next scene index for this chapter
                                const chapterScenes = nodes.filter((n: any) => n.type === 'scene' && n.data?.parentId === chapterParentId);
                                sceneIndex = chapterScenes.length + 1;
                                const genId = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
                                const sceneNodeId = genId('scnode');
                                createdSceneId = sceneNodeId;
                                const title = `${ch.title}_Scene_${sceneIndex}`;
                                const positionY = 400 + (sceneIndex * 120);
                                const sceneNode = {
                                    id: sceneNodeId,
                                    type: 'scene',
                                    position: { x: 300, y: positionY },
                                    data: {
                                        id: sceneNodeId,
                                        type: 'scene',
                                        status: 'not-completed',
                                        position: { x: 300, y: positionY },
                                        parentId: chapterParentId,
                                        childIds: [],
                                        linkedNodeIds: [],
                                        isExpanded: true,
                                        data: {
                                            title,
                                            description: `Scene ${sceneIndex} of ${ch.title}`,
                                            goal: '',
                                            chapter: ch.id,
                                            characters: [],
                                            worlds: [],
                                            timelineEventIds: []
                                        }
                                    }
                                } as any;
                                // Add to nodes and update parent's childIds
                                const nextNodes = [...nodes, sceneNode].map((n: any) => {
                                    if (n.id === chapterParentId) {
                                        const data = { ...(n.data || {}) } as any;
                                        const childIds = Array.isArray(data.childIds) ? [...data.childIds] : [];
                                        if (!childIds.includes(sceneNodeId)) childIds.push(sceneNodeId);
                                        return { ...n, data: { ...data, childIds } };
                                    }
                                    return n;
                                });
                                await updatePlotCanvas(bookIdSafe, versionIdSafe, { nodes: nextNodes, edges: plotCanvas?.edges || [] });
                            }
                        }
                    }

                    // Insert the SceneBeat node with proper attributes
                    editor.chain().focus().setSceneBeat({
                        chapterName: ch.title,
                        chapterId: ch.id,
                        sceneId: createdSceneId || undefined,
                        sceneBeatIndex: sceneIndex,
                        summary: '',
                        goal: '',
                        characters: [],
                        worldEntities: [],
                        status: 'Draft'
                    }).run();

                    setTimeout(() => editor.chain().blur().run(), 50);
                } catch (e) {
                    console.error('Failed to create Scene Beat and scene node', e);
                }
            },
            description: 'Add a scene beat section with React Flow integration'
        },
        { 
            name: '🗒️ Note Section', 
            icon: StickyNoteIcon, 
            action: () => {
                console.log('Note Section action called');
                console.log('Editor chain available:', !!editor.chain);
                console.log('setNoteSection command available:', !!editor.commands.setNoteSection);
                
                // Remove the "/" and insert a note section
                editor.chain().focus().deleteRange({ 
                    from: editor.state.selection.from - 1, 
                    to: editor.state.selection.from 
                }).setNoteSection({
                    content: '',
                    labels: []
                }).run();
                
                // Clear selection after a brief delay to prevent bubble menu
                setTimeout(() => {
                    editor.chain().blur().run();
                }, 50);
            },
            description: 'Add a persistent note/reminder section'
        },
        { 
            name: '🎭 Character Impersonation', 
            icon: TheaterIcon, 
            action: () => {
                console.log('Character Impersonation action called');
                console.log('Editor chain available:', !!editor.chain);
                console.log('setCharacterImpersonation command available:', !!editor.commands.setCharacterImpersonation);
                
                // Remove the "/" and insert a character impersonation section
                editor.chain().focus().deleteRange({ 
                    from: editor.state.selection.from - 1, 
                    to: editor.state.selection.from 
                }).setCharacterImpersonation({
                    activeCharacter: 'Nemar',
                    availableCharacters: ['Nemar', 'Attican', 'Elissa', 'Ferris', 'Garius']
                }).run();
                
                // Clear selection after a brief delay to prevent bubble menu
                setTimeout(() => {
                    editor.chain().blur().run();
                }, 50);
            },
            description: 'Start an AI-powered character roleplay session'
        },
        { 
            name: 'Add section', 
            icon: PlusIcon, 
            action: () => {
                // Remove the "/" and insert a new section
                editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertContent('<h2>New Section</h2><p></p>').run();
            },
            description: 'Add a new section to your manuscript'
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
            if (!isVisible) return false;

            console.log('Floating menu keydown:', event.key, 'selectedIndex:', selectedIndex);

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('Arrow down - changing selection');
                    setSelectedIndex((prev) => (prev + 1) % floatingMenuOptions.length);
                    return true;
                case 'ArrowUp':
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('Arrow up - changing selection');
                    setSelectedIndex((prev) => (prev - 1 + floatingMenuOptions.length) % floatingMenuOptions.length);
                    return true;
                case 'Enter':
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('Enter pressed, executing action for:', floatingMenuOptions[selectedIndex].name);
                    console.log('Action function:', floatingMenuOptions[selectedIndex].action);
                    floatingMenuOptions[selectedIndex].action();
                    setIsVisible(false);
                    return true;
                case 'Escape':
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('Escape pressed - closing menu');
                    setIsVisible(false);
                    // Remove the "/" character
                    editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run();
                    return true;
                default:
                    return false;
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
        
        // Add keyboard event listener directly to the document with higher priority
        const keydownHandler = (event: KeyboardEvent) => {
            if (!isVisible) return;
            
            console.log('Document keydown handler - event:', event.key, 'isVisible:', isVisible);
            
            // Only handle when our floating menu is visible
            if (handleKeyDown(event)) {
                // Event was handled, don't let it propagate
                return;
            }
        };
        
        // Also add a keypress handler as fallback for Enter key
        const keypressHandler = (event: KeyboardEvent) => {
            if (!isVisible) return;
            
            if (event.key === 'Enter') {
                console.log('Document keypress handler - Enter key, executing:', floatingMenuOptions[selectedIndex].name);
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                floatingMenuOptions[selectedIndex].action();
                setIsVisible(false);
            }
        };
        
        // Use capture phase to intercept events before they reach the editor
        document.addEventListener('keydown', keydownHandler, true);
        document.addEventListener('keypress', keypressHandler, true);

        return () => {
            editor.off('selectionUpdate', updateMenu);
            editor.off('transaction', updateMenu);
            editor.view.dom.removeEventListener('input', handleInput);
            document.removeEventListener('keydown', keydownHandler, true);
            document.removeEventListener('keypress', keypressHandler, true);
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
    bookId?: string;
    versionId?: string;
    book?: Book;
    version?: Version;
    currentChapterId?: string; // Add this prop to specify which chapter to load
    chapters: any[];
    createChapter: (title: string) => Promise<any>;
    saveChapterContent: (chapterId: string, content: any, isMinor?: boolean) => Promise<void>;
    showTypographySettings?: boolean;
    onCloseTypographySettings?: () => void;
    onOpenTypographySettings?: () => void;
    onEditorReady?: (editor: TipTapEditor) => void;
    onChapterCreated?: (chapterId: string) => void; // Add callback for chapter creation
    theme?: Theme;
    activeMode?: string;
    planningTab?: 'Plot Arcs' | 'World Building' | 'Characters';
    planningSearchQuery?: string;
}> = ({ 
    bookId = 'default-book', 
    versionId = 'v1',
    book,
    version,
    currentChapterId, // Use the prop name directly
    chapters,
    createChapter,
    saveChapterContent,
    showTypographySettings = false, 
    onCloseTypographySettings, 
    onOpenTypographySettings, 
    onEditorReady,
    onChapterCreated, // Receive callback from parent
    theme = 'dark',
    activeMode = 'Writing',
    planningTab = 'Plot Arcs',
    planningSearchQuery = ''
}) => {
    
    const { copyToClipboard, canCopy } = useClipboard();
    const { setCurrentContext } = useToolWindowStore();
    // Global flag to gate autosave and revision events during AI streaming
    const [isAIRunning, setIsAIRunning] = useState(false);
    
    // Chapter management is provided by parent to avoid duplicate hook usage
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);
    
    // Use the chapter ID from parent prop directly - no fallback needed
    // The parent (BookForgePage) is responsible for chapter selection and URL management
    const currentChapter = currentChapterId 
        ? chapters.find(ch => ch.id === currentChapterId)
        : null; // Don't default to first chapter - let parent handle initial selection
    
    // No fallback chapter selection needed - parent handles all chapter management
    // Remove the automatic chapter selection logic since parent manages URL-based navigation
    
    // Handle chapter creation
    const handleCreateChapter = async (title: string) => {
        setIsCreatingChapter(true);
        try {
            const newChapter = await createChapter(title);
            if (newChapter) {
                // Save the initial content immediately (no timeout needed)
                if (newChapter.content) {
                    await saveChapterContent(newChapter.id, newChapter.content, false);
                }
                
                // Always notify parent component that a new chapter was created
                // The parent will handle navigation to the new chapter
                if (onChapterCreated) {
                    onChapterCreated(newChapter.id);
                } else {
                    console.warn('No onChapterCreated callback provided - chapter created but no navigation will occur');
                }
            }
        } catch (error) {
            console.error('Failed to create chapter:', error);
        } finally {
            setIsCreatingChapter(false);
        }
    };
    
    // Initialize tool window context
    useEffect(() => {
        setCurrentContext(bookId, versionId);
    }, [bookId, versionId, setCurrentContext]);
    
    // Get initial content for editor
    const editorContent = currentChapter?.content || '';
    
    // Initialize revision manager for the current chapter
    const revisionManager = useRef(ChapterRevisionManager.getInstance());
    
    // Start revision session when chapter changes
    useEffect(() => {
        if (currentChapterId && currentChapter) {
            console.log('🔄 Starting revision session for chapter:', currentChapterId);
            revisionManager.current.startSession(currentChapterId);
        }
        
        // Cleanup on unmount or chapter change
        return () => {
            if (currentChapterId) {
                revisionManager.current.endSession(currentChapterId);
            }
        };
    }, [currentChapterId, currentChapter]);
    
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
                // Disable link if we're adding Link extension separately
                link: false,
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
            
            // Custom Node Extensions
            SceneBeatExtension,
            NoteSectionExtension,
            CharacterImpersonationExtension,
            TestExtension,
            SimpleExtension,
            DictationSectionNode,
            
            // Placeholder
            Placeholder.configure({
                placeholder: 'Start writing your masterpiece...',
            }),
        ],
        content: editorContent,
        onUpdate: ({ editor }) => {
            // Track content changes for revision management
            if (currentChapterId) {
                const content = editor.getJSON();
                if (!isAIRunning) {
                    revisionManager.current.onContentChange(currentChapterId, content);
                    // Broadcast update for optional listeners (e.g., autosave snapshot services)
                    try { window.dispatchEvent(new CustomEvent('chapterContentUpdated', { detail: { chapterId: currentChapter.id, content } })); } catch {}
                }
                // Expose current content for diff modal consumers
                // Expose current content JSON for diff modal and snapshot writers
                (window as any).__currentChapterJSON = content;
            }
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-lg max-w-none focus:outline-none font-serif text-gray-800 dark:text-gray-300 leading-relaxed book-prose',
            },
            handleKeyDown(view, event) {
            // Handle Ctrl+S / Cmd+S for manual save (major revision)
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                if (currentChapter) {
                    const content = editor?.getJSON();
                    if (content) {
                        // Major save; downstream hooks can create snapshot files
                        saveChapterContent(currentChapter.id, content, false) // false = major revision
                            .then(() => {
                                toast({
                                    title: "Chapter Saved",
                                    description: "Your chapter has been saved as a major revision.",
                                    variant: "default",
                                });
                            })
                            .catch((error) => {
                                toast({
                                    title: "Save Failed",
                                    description: "An error occurred while saving your chapter.",
                                    variant: "destructive",
                                });
                                console.error('Manual save failed:', error);
                            });
                    }
                }
                return true;
            }
            
            // Handle Ctrl+C / Cmd+C
            if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
                event.preventDefault();
                const { state } = view;
                const { from, to } = state.selection;
                const selectedText = state.doc.textBetween(from, to);
                
                if (selectedText) {
                    copyToClipboard(selectedText).then((success) => {
                        if (!success) {
                            // Show toast notification for blocked copy attempt
                            toast({
                                title: "Copy Blocked",
                                description: "Copy operation was blocked by clipboard control. Please check your permissions.",
                                variant: "destructive",
                            });
                        } else {
                            // Show success toast for successful copy (only for short text to avoid spam)
                            if (selectedText.length < 500) {
                                toast({
                                    title: "Text Copied",
                                    description: `Copied ${selectedText.length} characters to clipboard.`,
                                    variant: "default",
                                });
                            }
                        }
                    }).catch(() => {
                        toast({
                            title: "Copy Failed",
                            description: "An error occurred while copying text.",
                            variant: "destructive",
                        });
                    });
                }
                return true;
            }
            
            if (event.key === 'Enter') {
                const { selection } = view.state;
                if (selection.empty && selection.$head.pos === view.state.doc.content.size) {
                event.preventDefault();
                return true;
                }
            }
            return false;
            },
        },
    });

    if (!editor) {
        return null;
    } else {
        console.log('Editor content:', editor.getJSON());
    }

    // Debug logging - remove in production
    //console.log('Editor extensions loaded:', editor.extensionManager.extensions.map(ext => ext.name));
    //console.log('Available commands:', Object.keys(editor.commands));
    /*console.log('Custom commands available:', {
        setSceneBeat: !!editor.commands.setSceneBeat,
        setNoteSection: !!editor.commands.setNoteSection,
        setCharacterImpersonation: !!editor.commands.setCharacterImpersonation,
        setTestNode: !!editor.commands.setTestNode,
        setSimpleNode: !!editor.commands.setSimpleNode,
    });*/

    // Check if extensions are properly loaded
    const customExtensions = editor.extensionManager.extensions.filter(ext => 
        ['sceneBeat', 'noteSection', 'characterImpersonation', 'testNode', 'simpleNode'].includes(ext.name)
    );
    console.log('Custom extensions found:', customExtensions.map(ext => ext.name));

    // Notify parent when editor is ready
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Auto-save functionality with debouncing
    const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
    
    const handleContentChange = useCallback(() => {
        if (!editor || !currentChapter) return;
        console.log('HandleCContentChange', autoSaveTimeout);
        // Clear existing timeout
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }
        
        // Set new timeout for auto-save
        const timeout = setTimeout(async () => {
            const content = editor.getJSON();
            try {
                console.log('Chapter started saving changes:', currentChapter.id);
                // Minor autosave; downstream hooks can create minor snapshot files
                await saveChapterContent(currentChapter.id, content, true); // true = minor revision (auto-save)
                console.log('Chapter auto-saved:', currentChapter.id);
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, isAIRunning ? 5 * 60 * 1000 : 2000); // 5 min debounce if AI is running, else 2s
        
        setAutoSaveTimeout(timeout);
    }, [editor, currentChapter, saveChapterContent, autoSaveTimeout, isAIRunning]);
    
    // Set up content change listener for auto-save
    useEffect(() => {
        if (!editor) return;
        
        const handleUpdate = () => {
            handleContentChange();
        };
        
        editor.on('update', handleUpdate);
        
        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor, handleContentChange]);
    
    // Update editor content when current chapter changes
    useEffect(() => {
        if (editor && currentChapter) {
            const content = currentChapter.content || '';
            if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
                editor.commands.setContent(content, { emitUpdate: false });
            }
              try { (window as any).__currentChapterJSON = content; } catch {}
        }
    }, [editor, currentChapter]);

    // Listen for external chapter JSON updates (e.g., from RevisionDiffModal Apply/Create)
    useEffect(() => {
        if (!editor) return;
        const NBSP = '\u00A0';
        const sanitizeNode = (node: any): any | null => {
            if (!node || typeof node !== 'object') return null;
            if (node.type === 'text') {
                const t = typeof node.text === 'string' ? node.text : '';
                if (t.length === 0) return null;
                return { ...node, text: t };
            }
            const content = Array.isArray(node.content) ? node.content.map(sanitizeNode).filter(Boolean) as any[] : undefined;
            if (node.type === 'paragraph') {
                const safeContent = content && content.length > 0 ? content : [{ type: 'text', text: NBSP }];
                return { ...node, content: safeContent };
            }
            if (content) return { ...node, content };
            return { ...node };
        };
        const sanitizeDoc = (doc: any) => {
            if (!doc || typeof doc !== 'object') return { type: 'doc', content: [] };
            const content = Array.isArray(doc.content) ? doc.content.map(sanitizeNode).filter(Boolean) : [];
            return { type: 'doc', content };
        };
        const handler = (ev: Event) => {
            const detail = (ev as CustomEvent).detail;
            if (!detail) return;
            const incoming = sanitizeDoc(detail);
            try {
                const currentJson = editor.getJSON();
                if (JSON.stringify(currentJson) === JSON.stringify(incoming)) return;
            } catch {}
            editor.commands.setContent(incoming, { emitUpdate: false });
            try { (window as any).__currentChapterJSON = incoming; } catch {}
        };
        window.addEventListener('chapter-json-updated', handler as EventListener);
        return () => window.removeEventListener('chapter-json-updated', handler as EventListener);
    }, [editor]);

    return (
        <>
            <main className="flex-grow w-full overflow-y-auto custom-scrollbar relative pb-12">
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
                    
                    /* Prevent text selection within custom nodes to avoid bubble menu */
                    .scene-beat-node *,
                    .note-section-node *,
                    .character-impersonation-node * {
                        user-select: none;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                    }
                    
                    /* Allow selection only for editable content areas within nodes */
                    .scene-beat-node textarea,
                    .scene-beat-node input,
                    .note-section-node textarea,
                    .note-section-node input,
                    .character-impersonation-node textarea,
                    .character-impersonation-node input {
                        user-select: text;
                        -webkit-user-select: text;
                        -moz-user-select: text;
                        -ms-user-select: text;
                    }
                `}
                </style>
                
                <EditorBubbleMenu editor={editor} setIsAIRunning={setIsAIRunning} isAIRunning={isAIRunning} />
                <EditorFloatingMenu 
                    editor={editor} 
                    currentChapter={currentChapter || undefined}
                    bookId={bookId}
                    versionId={versionId}
                />
                <TypographySettingsPopup 
                    isOpen={showTypographySettings}
                    onClose={() => onCloseTypographySettings && onCloseTypographySettings()}
                    onApply={(settings) => {
                        console.log('Applied typography settings:', settings);
                        // Settings are already applied in the popup's handleApply function
                    }}
                    editor={editor}
                />

                {activeMode === 'Planning' ? (
                    <PlanningPage 
                        book={book || {
                            id: bookId,
                            title: 'Current Book',
                            lastModified: new Date().toISOString(),
                            progress: 0,
                            wordCount: 0,
                            genre: 'Fiction',
                            collaboratorCount: 1,
                            collaborators: [],
                            characters: [],
                            featured: false,
                            bookType: 'Novel',
                            prose: 'Standard',
                            language: 'English',
                            publisher: '',
                            publishedStatus: 'Unpublished',
                            synopsis: ''
                        }}
                        version={version || {
                            id: versionId,
                            name: 'Working Draft',
                            status: 'DRAFT',
                            wordCount: 0,
                            createdAt: new Date().toISOString(),
                            contributor: {
                                name: 'Author',
                                avatar: ''
                            },
                            characters: [],
                            plotArcs: [],
                            worlds: [],
                            chapters: []
                        }}
                        theme={theme}
                        activeTab={planningTab}
                        searchQuery={planningSearchQuery}
                    />
                ) : (
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-16">
                        {/* Show CreateChapterPage if no chapters exist */}
                        {chapters.length === 0 ? (
                            <CreateChapterPage 
                                onCreateChapter={handleCreateChapter}
                                isCreating={isCreatingChapter}
                            />
                        ) : (
                            <>
                                <EditorContent editor={editor} />
                                
                                {/* Tool Manager - Show tools available for this book/version */}
                                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Available Tools
                                    </h3>
                                    <ToolManager bookId={bookId} versionId={versionId} />
                                </div>
                                </>
                        )}
                    </div>
                )}

                {/* Enhanced clipboard status indicator */}
                {window.__TAURI__ && (
                    <div className="fixed bottom-4 right-4 z-50">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border transition-all duration-200 ${
                            canCopy 
                                ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${
                                canCopy ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm font-medium">
                                {canCopy ? 'Copy Enabled' : 'Copy Restricted'}
                            </span>
                        </div>
                    </div>
                )}

               
            </main>

            {/* Tool Window Dock Sidebar */}
            <DockSidebar bookId={bookId} versionId={versionId} theme={theme === 'system' ? 'dark' : theme} />

            {/* Toast notifications - moved outside main for better visibility */}
            <Toaster />
        </>
    );
};

export default Editor;
