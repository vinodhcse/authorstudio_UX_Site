import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, UserIcon, DocumentTextIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { NarrativeNode } from '../../../../../types/narrative-layout';

interface PlotNodeDetailsModalProps {
    node: NarrativeNode | null;
    isOpen: boolean;
    onClose: () => void;
    getCharacterName: (characterId: string) => string;
}

const PlotNodeDetailsModal: React.FC<PlotNodeDetailsModalProps> = ({ 
    node, 
    isOpen, 
    onClose,
    getCharacterName
}) => {
    if (!node) return null;

    const nodeData = node.data as any;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        onClick={onClose}
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {nodeData?.title || `${node.type} Details`}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-1">
                                        {node.type}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <DocumentTextIcon className="w-5 h-5" />
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Title
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {nodeData?.title || 'Untitled'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Type
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                                                {node.type}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {nodeData?.description && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                            Description
                                        </h3>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {nodeData.description}
                                        </p>
                                    </div>
                                )}

                                {/* Goal/Purpose */}
                                {nodeData?.goal && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <TagIcon className="w-5 h-5" />
                                            Goal/Purpose
                                        </h3>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {nodeData.goal}
                                        </p>
                                    </div>
                                )}

                                {/* Characters */}
                                {(nodeData?.characters || nodeData?.povCharacterId) && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <UserIcon className="w-5 h-5" />
                                            Characters
                                        </h3>
                                        <div className="space-y-3">
                                            {nodeData?.povCharacterId && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Point of View Character
                                                    </label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {getCharacterName(nodeData.povCharacterId)}
                                                    </p>
                                                </div>
                                            )}
                                            {nodeData?.characters && nodeData.characters.length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Characters in Scene
                                                    </label>
                                                    <div className="mt-1 flex flex-wrap gap-2">
                                                        {nodeData.characters.map((charId: string) => (
                                                            <span 
                                                                key={charId}
                                                                className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                                                            >
                                                                {getCharacterName(charId)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Timeline Information */}
                                {(nodeData?.startTime || nodeData?.duration || nodeData?.timeOfDay) && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <ClockIcon className="w-5 h-5" />
                                            Timeline
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {nodeData?.startTime && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Start Time
                                                    </label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {nodeData.startTime}
                                                    </p>
                                                </div>
                                            )}
                                            {nodeData?.duration && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Duration
                                                    </label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {nodeData.duration}
                                                    </p>
                                                </div>
                                            )}
                                            {nodeData?.timeOfDay && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Time of Day
                                                    </label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {nodeData.timeOfDay}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Additional Metadata */}
                                {node.childIds && node.childIds.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                            Structure
                                        </h3>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Contains {node.childIds.length} {node.type === 'act' ? 'chapters' : 'scenes'}
                                        </p>
                                    </div>
                                )}

                                {/* Tags/Keywords */}
                                {nodeData?.tags && nodeData.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                            Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {nodeData.tags.map((tag: string, index: number) => (
                                                <span 
                                                    key={index}
                                                    className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PlotNodeDetailsModal;
