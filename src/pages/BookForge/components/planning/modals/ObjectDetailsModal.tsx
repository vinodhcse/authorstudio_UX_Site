import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../../../../../types';
import { XIcon, EditIcon, PlusIcon, CheckIcon } from '../../../../../constants';
import { WorldObject } from '../types/WorldBuildingTypes';

interface ObjectDetailsModalProps {
    object: WorldObject;
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    onSave?: (updatedObject: WorldObject) => void;
}

const ObjectDetailsModal: React.FC<ObjectDetailsModalProps> = ({ object, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedObject, setEditedObject] = useState<WorldObject>(object);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({ event: '', date: '', eventNote: '' });

    const handleSave = () => {
        onSave?.(editedObject);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedObject(object); // Reset to original
        setIsEditing(false);
    };

    const updateObject = (field: string, value: any) => {
        setEditedObject(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addArrayItem = (field: string, newItem: string) => {
        if (!newItem.trim()) return;
        
        setEditedObject(prev => ({
            ...prev,
            [field]: [...(prev[field as keyof WorldObject] as string[]), newItem.trim()]
        }));
    };

    const removeArrayItem = (field: string, index: number) => {
        setEditedObject(prev => ({
            ...prev,
            [field]: (prev[field as keyof WorldObject] as string[]).filter((_, i) => i !== index)
        }));
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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {object.name}
                    </h2>
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
                    {object.image && (
                        <div className="w-full h-64 rounded-lg overflow-hidden">
                            <img 
                                src={object.image} 
                                alt={object.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Basic Information
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedObject.type}
                                            onChange={(e) => updateObject('type', e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{object.type}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Origin:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedObject.origin}
                                            onChange={(e) => updateObject('origin', e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{object.origin}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                                    {isEditing ? (
                                        <textarea
                                            value={editedObject.description}
                                            onChange={(e) => updateObject('description', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{object.description}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Holder:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedObject.currentHolder || ''}
                                            onChange={(e) => updateObject('currentHolder', e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{object.currentHolder || 'Unknown'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Powers & Abilities
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Powers:</span>
                                    {isEditing ? (
                                        <div className="mt-1 space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                                {editedObject.powers.map((power, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs flex items-center gap-1">
                                                        {power}
                                                        <button
                                                            onClick={() => removeArrayItem('powers', idx)}
                                                            className="text-green-600 hover:text-green-800"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Add power..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        addArrayItem('powers', e.currentTarget.value.trim());
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {object.powers.map((power, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                                                    {power}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Limitations:</span>
                                    {isEditing ? (
                                        <div className="mt-1 space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                                {editedObject.limitations.map((limitation, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs flex items-center gap-1">
                                                        {limitation}
                                                        <button
                                                            onClick={() => removeArrayItem('limitations', idx)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Add limitation..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        addArrayItem('limitations', e.currentTarget.value.trim());
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {object.limitations.map((limitation, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
                                                    {limitation}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Ownership History
                        </h3>
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {editedObject.pastOwners.map((owner, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs flex items-center gap-1">
                                            {owner}
                                            <button
                                                onClick={() => removeArrayItem('pastOwners', idx)}
                                                className="text-gray-600 hover:text-gray-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add past owner..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            addArrayItem('pastOwners', e.currentTarget.value.trim());
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <div className="space-y-2">
                                    {object.pastOwners.map((owner, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <span className="text-gray-900 dark:text-gray-100">{owner}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {idx === 0 ? 'Original Owner' : `Previous Owner ${idx}`}
                                            </span>
                                        </div>
                                    ))}
                                    {object.currentHolder && (
                                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">{object.currentHolder}</span>
                                            <span className="text-sm text-green-600 dark:text-green-400">Current Holder</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Timeline Events
                            </h3>
                            {isEditing && (
                                <button 
                                    onClick={() => setIsAddingEvent(true)}
                                    className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Event
                                </button>
                            )}
                        </div>
                        
                        {isAddingEvent && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Event name..."
                                    value={newEvent.event}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, event: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                                <input
                                    type="text"
                                    placeholder="Date..."
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                                <textarea
                                    placeholder="Event notes..."
                                    value={newEvent.eventNote}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, eventNote: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (newEvent.event.trim()) {
                                                const newTimelineEvents = [...editedObject.timelineEvents, newEvent];
                                                updateObject('timelineEvents', newTimelineEvents);
                                                setNewEvent({ event: '', date: '', eventNote: '' });
                                                setIsAddingEvent(false);
                                            }
                                        }}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => {
                                            setNewEvent({ event: '', date: '', eventNote: '' });
                                            setIsAddingEvent(false);
                                        }}
                                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            {editedObject.timelineEvents.map((event, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 relative">
                                    <div className="flex justify-between items-start">
                                        <h5 className="font-medium text-gray-900 dark:text-gray-100">{event.event}</h5>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{event.date}</span>
                                            {isEditing && (
                                                <button
                                                    onClick={() => {
                                                        const newTimelineEvents = editedObject.timelineEvents.filter((_, i) => i !== idx);
                                                        updateObject('timelineEvents', newTimelineEvents);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{event.eventNote}</p>
                                </div>
                            ))}
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

export default ObjectDetailsModal;
