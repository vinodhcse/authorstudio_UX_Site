import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../../../../../types';
import { XIcon, EditIcon } from '../../../../../constants';
import { Lore } from '../types/WorldBuildingTypes';

interface LoreDetailsModalProps {
    lore: Lore;
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    onSave?: (updatedLore: Lore) => void;
}

const LoreDetailsModal: React.FC<LoreDetailsModalProps> = ({ lore, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedLore, setEditedLore] = useState<Lore>(lore);

    const handleSave = () => {
        onSave?.(editedLore);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedLore(lore); // Reset to original
        setIsEditing(false);
    };

    const updateLore = (field: string, value: any) => {
        setEditedLore(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateNestedField = (parent: string, field: string, value: any) => {
        setEditedLore(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent as keyof Lore] as any),
                [field]: value
            }
        }));
    };

    const addArrayItem = (field: string, newItem: string) => {
        if (!newItem.trim()) return;
        
        setEditedLore(prev => ({
            ...prev,
            [field]: [...(prev[field as keyof Lore] as string[]), newItem.trim()]
        }));
    };

    const removeArrayItem = (field: string, index: number) => {
        setEditedLore(prev => ({
            ...prev,
            [field]: (prev[field as keyof Lore] as string[]).filter((_, i) => i !== index)
        }));
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'myth':
                return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
            case 'prophecy':
                return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
            case 'historical event':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            case 'legend':
                return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedLore.title}
                                    onChange={(e) => updateLore('title', e.target.value)}
                                    className="bg-transparent border-none outline-none text-xl font-semibold text-gray-900 dark:text-gray-100"
                                />
                            ) : (
                                lore.title
                            )}
                        </h2>
                        {isEditing ? (
                            <select
                                value={editedLore.category}
                                onChange={(e) => updateLore('category', e.target.value)}
                                className="px-2 py-1 rounded text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="myth">Myth</option>
                                <option value="prophecy">Prophecy</option>
                                <option value="historical event">Historical Event</option>
                                <option value="legend">Legend</option>
                                <option value="folklore">Folklore</option>
                                <option value="tale">Tale</option>
                            </select>
                        ) : (
                            <span className={`px-2 py-1 rounded text-xs capitalize ${getCategoryColor(lore.category)}`}>
                                {lore.category}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Description
                        </h3>
                        {isEditing ? (
                            <textarea
                                value={editedLore.description}
                                onChange={(e) => updateLore('description', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        ) : (
                            <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                                {lore.description}
                            </p>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Timeline
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Age:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedLore.timeline.age}
                                            onChange={(e) => updateNestedField('timeline', 'age', e.target.value)}
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        />
                                    ) : (
                                        <span className="text-gray-900 dark:text-gray-100">{lore.timeline.age}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Start Year:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedLore.timeline.startYear}
                                            onChange={(e) => updateNestedField('timeline', 'startYear', e.target.value)}
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        />
                                    ) : (
                                        <span className="text-gray-900 dark:text-gray-100">{lore.timeline.startYear}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">End Year:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedLore.timeline.endYear}
                                            onChange={(e) => updateNestedField('timeline', 'endYear', e.target.value)}
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        />
                                    ) : (
                                        <span className="text-gray-900 dark:text-gray-100">{lore.timeline.endYear}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Key Figures
                            </h3>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {editedLore.keyFigures.map((figure, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-1">
                                                {figure}
                                                <button
                                                    onClick={() => removeArrayItem('keyFigures', idx)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add key figure..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                addArrayItem('keyFigures', e.currentTarget.value.trim());
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {lore.keyFigures.map((figure, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                            {figure}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Locations Involved
                            </h3>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {editedLore.locationsInvolved.map((location, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm flex items-center gap-1">
                                                {location}
                                                <button
                                                    onClick={() => removeArrayItem('locationsInvolved', idx)}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add location..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                addArrayItem('locationsInvolved', e.currentTarget.value.trim());
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {lore.locationsInvolved.map((location, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                                            {location}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Objects Involved
                            </h3>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {editedLore.objectsInvolved.map((object, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm flex items-center gap-1">
                                                {object}
                                                <button
                                                    onClick={() => removeArrayItem('objectsInvolved', idx)}
                                                    className="text-purple-600 hover:text-purple-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add object..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                addArrayItem('objectsInvolved', e.currentTarget.value.trim());
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {lore.objectsInvolved.map((object, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                                            {object}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Outcome
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            {isEditing ? (
                                <textarea
                                    value={editedLore.outcome}
                                    onChange={(e) => updateLore('outcome', e.target.value)}
                                    rows={3}
                                    className="w-full border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 resize-none"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-gray-100">
                                    {lore.outcome}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Cultural Impact
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            {isEditing ? (
                                <textarea
                                    value={editedLore.culturalImpact}
                                    onChange={(e) => updateLore('culturalImpact', e.target.value)}
                                    rows={3}
                                    className="w-full border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 resize-none"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-gray-100">
                                    {lore.culturalImpact}
                                </p>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LoreDetailsModal;
