import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../../../../../types';
import { XIcon, EditIcon, PlusIcon, CheckIcon } from '../../../../../constants';
import { Location } from '../types/WorldBuildingTypes';

interface LocationDetailsModalProps {
    location: Location;
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    onSave?: (updatedLocation: Location) => void;
    allLocations?: Location[]; // For parent location lookup
}

const LocationDetailsModal: React.FC<LocationDetailsModalProps> = ({ 
    location, 
    isOpen, 
    onClose, 
    onSave, 
    allLocations = [] 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedLocation, setEditedLocation] = useState<Location>(location);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({ event: '', date: '', eventNote: '' });

    // Helper function to find parent location
    const getParentLocation = () => {
        if (!location.parentLocation || !allLocations.length) return null;
        return allLocations.find(loc => loc.id === location.parentLocation);
    };

    // Helper function to find child locations
    const getChildLocations = () => {
        if (!allLocations.length) return [];
        return allLocations.filter(loc => loc.parentLocation === location.id);
    };

    const handleSave = () => {
        onSave?.(editedLocation);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedLocation(location); // Reset to original
        setIsEditing(false);
    };

    const updateLocation = (field: string, value: any) => {
        setEditedLocation(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateNestedField = (parent: string, field: string, value: any) => {
        setEditedLocation(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent as keyof Location],
                [field]: value
            }
        }));
    };

    const addArrayItem = (field: string, newItem: string) => {
        if (!newItem.trim()) return;
        
        setEditedLocation(prev => ({
            ...prev,
            [field]: [...(prev[field as keyof Location] as string[]), newItem.trim()]
        }));
    };

    const removeArrayItem = (field: string, index: number) => {
        setEditedLocation(prev => ({
            ...prev,
            [field]: (prev[field as keyof Location] as string[]).filter((_, i) => i !== index)
        }));
    };

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
                        {location.name}
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
                    {location.image && (
                        <div className="w-full h-64 rounded-lg overflow-hidden">
                            <img 
                                src={location.image} 
                                alt={location.name}
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
                                            value={editedLocation.type}
                                            onChange={(e) => updateLocation('type', e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{location.type}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Region:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedLocation.region}
                                            onChange={(e) => updateLocation('region', e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{location.region}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                                    {isEditing ? (
                                        <textarea
                                            value={editedLocation.description}
                                            onChange={(e) => updateLocation('description', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{location.description}</p>
                                    )}
                                </div>
                                
                                {/* Parent Location */}
                                {(() => {
                                    const parentLocation = getParentLocation();
                                    return (
                                        <div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Parent Location:</span>
                                            <p className="text-gray-900 dark:text-gray-100">
                                                {parentLocation ? `${parentLocation.name} (${parentLocation.type})` : 'None (Top-level location)'}
                                            </p>
                                        </div>
                                    );
                                })()}
                                
                                {/* Child Locations */}
                                {(() => {
                                    const childLocations = getChildLocations();
                                    return childLocations.length > 0 ? (
                                        <div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sub-locations:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {childLocations.map(child => (
                                                    <span key={child.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                                        {child.name} ({child.type})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Geography
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Terrain:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedLocation.geography.terrain}
                                            onChange={(e) => updateLocation('geography', { ...editedLocation.geography, terrain: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{location.geography.terrain}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Climate:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedLocation.geography.climate}
                                            onChange={(e) => updateLocation('geography', { ...editedLocation.geography, climate: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{location.geography.climate}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Flora & Fauna:</span>
                                    {isEditing ? (
                                        <div className="mt-1 space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                                {editedLocation.geography.floraFauna.map((item, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs flex items-center gap-1">
                                                        {item}
                                                        <button
                                                            onClick={() => {
                                                                const newFloraFauna = editedLocation.geography.floraFauna.filter((_, i) => i !== idx);
                                                                updateLocation('geography', { ...editedLocation.geography, floraFauna: newFloraFauna });
                                                            }}
                                                            className="text-green-600 hover:text-green-800"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Add flora/fauna item..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        const newFloraFauna = [...editedLocation.geography.floraFauna, e.currentTarget.value.trim()];
                                                        updateLocation('geography', { ...editedLocation.geography, floraFauna: newFloraFauna });
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {location.geography.floraFauna.map((item, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Culture
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Traditions:</span>
                                    {isEditing ? (
                                        <div className="mt-1 space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                                {editedLocation.culture.traditions.map((tradition, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs flex items-center gap-1">
                                                        {tradition}
                                                        <button
                                                            onClick={() => {
                                                                const newTraditions = editedLocation.culture.traditions.filter((_, i) => i !== idx);
                                                                updateLocation('culture', { ...editedLocation.culture, traditions: newTraditions });
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Add tradition..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        const newTraditions = [...editedLocation.culture.traditions, e.currentTarget.value.trim()];
                                                        updateLocation('culture', { ...editedLocation.culture, traditions: newTraditions });
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {location.culture.traditions.map((tradition, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                                    {tradition}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Languages:</span>
                                    {isEditing ? (
                                        <div className="mt-1 space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                                {editedLocation.culture.language.map((lang, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs flex items-center gap-1">
                                                        {lang}
                                                        <button
                                                            onClick={() => {
                                                                const newLanguages = editedLocation.culture.language.filter((_, i) => i !== idx);
                                                                updateLocation('culture', { ...editedLocation.culture, language: newLanguages });
                                                            }}
                                                            className="text-purple-600 hover:text-purple-800"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Add language..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        const newLanguages = [...editedLocation.culture.language, e.currentTarget.value.trim()];
                                                        updateLocation('culture', { ...editedLocation.culture, language: newLanguages });
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {location.culture.language.map((lang, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Governance:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedLocation.culture.governance}
                                            onChange={(e) => updateLocation('culture', { ...editedLocation.culture, governance: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{location.culture.governance}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Politics & Economy
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Leaders:</span>
                                    {isEditing ? (
                                        <div className="mt-1 space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                                {editedLocation.politics.leaders.map((leader, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs flex items-center gap-1">
                                                        {leader}
                                                        <button
                                                            onClick={() => {
                                                                const newLeaders = editedLocation.politics.leaders.filter((_, i) => i !== idx);
                                                                updateLocation('politics', { ...editedLocation.politics, leaders: newLeaders });
                                                            }}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Add leader..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        const newLeaders = [...editedLocation.politics.leaders, e.currentTarget.value.trim()];
                                                        updateLocation('politics', { ...editedLocation.politics, leaders: newLeaders });
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {location.politics.leaders.map((leader, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
                                                    {leader}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Trade:</span>
                                    {isEditing ? (
                                        <div className="mt-1 space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                                {editedLocation.economy.trade.map((trade, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs flex items-center gap-1">
                                                        {trade}
                                                        <button
                                                            onClick={() => {
                                                                const newTrade = editedLocation.economy.trade.filter((_, i) => i !== idx);
                                                                updateLocation('economy', { ...editedLocation.economy, trade: newTrade });
                                                            }}
                                                            className="text-yellow-600 hover:text-yellow-800"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Add trade/economy..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        const newTrade = [...editedLocation.economy.trade, e.currentTarget.value.trim()];
                                                        updateLocation('economy', { ...editedLocation.economy, trade: newTrade });
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {location.economy.trade.map((trade, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                                                    {trade}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Technology Level:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedLocation.economy.technology}
                                            onChange={(e) => updateLocation('economy', { ...editedLocation.economy, technology: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">{location.economy.technology}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Landmarks
                        </h3>
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {editedLocation.landmarks.map((landmark, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm flex items-center gap-1">
                                            {landmark}
                                            <button
                                                onClick={() => {
                                                    const newLandmarks = editedLocation.landmarks.filter((_, i) => i !== idx);
                                                    updateLocation('landmarks', newLandmarks);
                                                }}
                                                className="text-gray-600 hover:text-gray-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add landmark..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            const newLandmarks = [...editedLocation.landmarks, e.currentTarget.value.trim()];
                                            updateLocation('landmarks', newLandmarks);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {location.landmarks.map((landmark, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                        {landmark}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                History
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
                                                const newHistory = [...editedLocation.history, newEvent];
                                                updateLocation('history', newHistory);
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
                        
                        <div className="space-y-3">
                            {editedLocation.history.map((event, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 relative">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{event.event}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{event.date}</span>
                                            {isEditing && (
                                                <button
                                                    onClick={() => {
                                                        const newHistory = editedLocation.history.filter((_, i) => i !== idx);
                                                        updateLocation('history', newHistory);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{event.eventNote}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setIsEditing(false)}
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

export default LocationDetailsModal;
