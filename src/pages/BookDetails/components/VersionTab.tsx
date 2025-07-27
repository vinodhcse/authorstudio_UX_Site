

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { Version, VersionStatus } from '../../../types';
import { PlusIcon, TrashIcon, ExternalLinkIcon } from '../../../constants';

const StatusBadge: React.FC<{ status: VersionStatus }> = ({ status }) => {
    const statusStyles = {
        DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        IN_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        FINAL: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

interface VersionTabProps {
    versions: Version[];
    onOpenCreateModal: () => void;
}

const VersionTab: React.FC<VersionTabProps> = ({ versions, onOpenCreateModal }) => {
    const { bookId } = useParams<{ bookId: string }>();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.07 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
        exit: { opacity: 0, x: -50 }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Versions</h3>
                <button
                    onClick={onOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-sky-500 dark:hover:bg-sky-600 transition-all transform hover:scale-105 shadow-md shadow-purple-500/20 dark:shadow-sky-500/30"
                >
                    <PlusIcon className="h-4 w-4" />
                    Create Version
                </button>
            </div>
            
            {versions.length > 0 ? (
                <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence>
                        {versions.map((version) => (
                            <motion.div
                                key={version.id}
                                variants={itemVariants}
                                layout
                                className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-purple-500/50 dark:hover:border-sky-500/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{version.name}</p>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        <img src={version.contributor.avatar} alt={version.contributor.name} className="w-5 h-5 rounded-full" />
                                        <span>{version.contributor.name} • Created {version.createdAt}</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-4 w-full sm:w-auto justify-between">
                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={version.status} />
                                        <p className="text-sm text-gray-600 dark:text-gray-300 w-28 text-right">{version.wordCount.toLocaleString()} words</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link to={`/book/${bookId}/version/${version.id}`} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors text-sm font-semibold">
                                            <ExternalLinkIcon className="w-4 h-4" />
                                            Open
                                        </Link>
                                        <button className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="text-center py-12 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No versions created yet.</p>
                </div>
            )}
        </motion.div>
    );
};

export default VersionTab;