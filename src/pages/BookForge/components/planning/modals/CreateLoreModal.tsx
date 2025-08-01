import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../../../../../types';
import { XIcon } from '../../../../../constants';
import { Lore } from '../types/WorldBuildingTypes';

interface CreateLoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    onSave: (loreData: Omit<Lore, 'id' | 'parentWorldId'>) => void;
}

const CreateLoreModal: React.FC<CreateLoreModalProps> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        category: 'legend' as Lore['category'],
        description: '',
        timeline: {
            startYear: '',
            endYear: '',
            age: ''
        },
        keyFigures: [] as string[],
        locationsInvolved: [] as string[],
        objectsInvolved: [] as string[],
        outcome: '',
        culturalImpact: ''
    });

    const [newKeyFigure, setNewKeyFigure] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [newObject, setNewObject] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title.trim() && formData.description.trim()) {
            onSave(formData);
            onClose();
            // Reset form
            setFormData({
                title: '',
                category: 'legend',
                description: '',
                timeline: {
                    startYear: '',
                    endYear: '',
                    age: ''
                },
                keyFigures: [],
                locationsInvolved: [],
                objectsInvolved: [],
                outcome: '',
                culturalImpact: ''
            });
        }
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateNestedField = (parent: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent as keyof typeof prev] as any),
                [field]: value
            }
        }));
    };

    const addToArray = (field: keyof typeof formData, value: string) => {
        if (!value.trim()) return;
        
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] as string[]), value.trim()]
        }));
    };

    const removeFromArray = (field: keyof typeof formData, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field] as string[]).filter((_, i) => i !== index)
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Create New Lore
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => updateFormData('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Enter lore title..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => updateFormData('category', e.target.value as Lore['category'])}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="legend">Legend</option>
                                <option value="myth">Myth</option>
                                <option value="prophecy">Prophecy</option>
                                <option value="historical event">Historical Event</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => updateFormData('description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Describe the lore..."
                        />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Timeline</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Age
                                </label>
                                <input
                                    type="text"
                                    value={formData.timeline.age}
                                    onChange={(e) => updateNestedField('timeline', 'age', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="e.g., Age of Heroes"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Start Year
                                </label>
                                <input
                                    type="text"
                                    value={formData.timeline.startYear}
                                    onChange={(e) => updateNestedField('timeline', 'startYear', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="e.g., 1200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    End Year
                                </label>
                                <input
                                    type="text"
                                    value={formData.timeline.endYear}
                                    onChange={(e) => updateNestedField('timeline', 'endYear', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="e.g., 1250"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Key Figures
                            </label>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {formData.keyFigures.map((figure, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-1">
                                            {figure}
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('keyFigures', idx)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newKeyFigure}
                                        onChange={(e) => setNewKeyFigure(e.target.value)}
                                        placeholder="Add key figure..."
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addToArray('keyFigures', newKeyFigure);
                                                setNewKeyFigure('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToArray('keyFigures', newKeyFigure);
                                            setNewKeyFigure('');
                                        }}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Locations Involved
                            </label>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {formData.locationsInvolved.map((location, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm flex items-center gap-1">
                                            {location}
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('locationsInvolved', idx)}
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newLocation}
                                        onChange={(e) => setNewLocation(e.target.value)}
                                        placeholder="Add location..."
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addToArray('locationsInvolved', newLocation);
                                                setNewLocation('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToArray('locationsInvolved', newLocation);
                                            setNewLocation('');
                                        }}
                                        className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Objects Involved
                        </label>
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {formData.objectsInvolved.map((object, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm flex items-center gap-1">
                                        {object}
                                        <button
                                            type="button"
                                            onClick={() => removeFromArray('objectsInvolved', idx)}
                                            className="text-purple-600 hover:text-purple-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newObject}
                                    onChange={(e) => setNewObject(e.target.value)}
                                    placeholder="Add object..."
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addToArray('objectsInvolved', newObject);
                                            setNewObject('');
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        addToArray('objectsInvolved', newObject);
                                        setNewObject('');
                                    }}
                                    className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Outcome
                            </label>
                            <textarea
                                rows={3}
                                value={formData.outcome}
                                onChange={(e) => updateFormData('outcome', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="What was the result or outcome?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cultural Impact
                            </label>
                            <textarea
                                rows={3}
                                value={formData.culturalImpact}
                                onChange={(e) => updateFormData('culturalImpact', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="How did this impact the culture?"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                        >
                            Create Lore
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateLoreModal;
