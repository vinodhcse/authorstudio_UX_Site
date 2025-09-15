
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chapter } from '../../../types';

const FormInput: React.FC<{ id: string, label: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, optional?: boolean }> = ({ id, label, placeholder, value, onChange, type = "text", optional=false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-800 dark:text-gray-300">
            {label} {optional && <span className="text-gray-500 dark:text-gray-400">(Optional)</span>}
        </label>
        <div className="mt-1">
            <input type={type} name={id} id={id} value={value} onChange={onChange} className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400" placeholder={placeholder} />
        </div>
    </div>
);

interface ChapterSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    chapter?: Chapter;
    onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => Promise<void>;
}

const ChapterSettingsModal: React.FC<ChapterSettingsModalProps> = ({ isOpen, onClose, chapter, onUpdateChapter }) => {
    const [chapterName, setChapterName] = useState('');
    const [subtitle, setSubtitle] = useState('');

    // Update form when chapter changes
    useEffect(() => {
        if (chapter) {
            setChapterName(chapter.title || '');
            setSubtitle(''); // Add subtitle field to Chapter type if needed
        } else {
            setChapterName('');
            setSubtitle('');
        }
    }, [chapter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (chapter && onUpdateChapter) {
            try {
                await onUpdateChapter(chapter.id, {
                    title: chapterName,
                    // subtitle: subtitle, // Add this field to Chapter type if needed
                });
                onClose();
            } catch (error) {
                console.error('Failed to update chapter:', error);
            }
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-800/50 custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {chapter ? 'Edit Chapter Settings' : 'Chapter Settings'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {chapter ? `Manage details for "${chapter.title}".` : 'Manage details for this chapter.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <FormInput
                            id="chapter-name"
                            label="Chapter Name"
                            value={chapterName}
                            onChange={(e) => setChapterName(e.target.value)}
                            placeholder="Enter the chapter name"
                        />
                         <FormInput
                            id="chapter-subtitle"
                            label="Subtitle"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Enter a subtitle"
                            optional
                        />
                    </div>

                    <div className="pt-6 flex justify-end gap-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-500/10 hover:bg-gray-500/20 dark:bg-gray-700 dark:hover:bg-gray-600 backdrop-blur-sm border border-white/20 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/20">
                            Save Changes
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default ChapterSettingsModal;
