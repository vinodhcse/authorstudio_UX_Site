
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Version } from '../../../types';

interface CreateVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookVersions: Version[];
    onCreate: (data: { name: string, sourceVersionId: string | null }) => void;
}

const CreateVersionModal: React.FC<CreateVersionModalProps> = ({ isOpen, onClose, bookVersions, onCreate }) => {
    const [name, setName] = useState('Manuscript');
    const [sourceVersionId, setSourceVersionId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ name, sourceVersionId });
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
                className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-800/50 custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Version</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start a new draft or branch of your work.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="version-name" className="block text-sm font-medium text-gray-800 dark:text-gray-300">
                                Version Name
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="version-name"
                                    id="version-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                    placeholder="e.g., Manuscript, First Edition"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="source-version" className="block text-sm font-medium text-gray-800 dark:text-gray-300">
                                Copy from Version <span className="text-gray-500 dark:text-gray-400">(Optional)</span>
                            </label>
                            <select
                                id="source-version"
                                name="source-version"
                                value={sourceVersionId || ''}
                                onChange={(e) => setSourceVersionId(e.target.value || null)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 md:py-3 text-base border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm md:text-base rounded-lg text-gray-800 dark:text-gray-200"
                            >
                                <option value="" className="bg-gray-100 dark:bg-gray-800">Start with a blank version</option>
                                {bookVersions.map(v => (
                                    <option key={v.id} value={v.id} className="bg-gray-100 dark:bg-gray-800">
                                        {v.name} ({v.wordCount.toLocaleString()} words)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-500/10 hover:bg-gray-500/20 dark:bg-gray-700 dark:hover:bg-gray-600 backdrop-blur-sm border border-white/20 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/20">
                            Create Version
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default CreateVersionModal;
