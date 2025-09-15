import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../../../../../types';
import { XIcon, EditIcon } from '../../../../../constants';
import { MagicSystem } from '../types/WorldBuildingTypes';

interface MagicSystemDetailsModalProps {
    magicSystem: MagicSystem;
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    onSave?: (updatedMagicSystem: MagicSystem) => void;
}

const MagicSystemDetailsModal: React.FC<MagicSystemDetailsModalProps> = ({ magicSystem, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedMagicSystem, setEditedMagicSystem] = useState<MagicSystem>(magicSystem);

    const handleSave = () => {
        onSave?.(editedMagicSystem);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedMagicSystem(magicSystem); // Reset to original
        setIsEditing(false);
    };

    const updateMagicSystem = (field: string, value: any) => {
        setEditedMagicSystem(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addArrayItem = (field: string, newItem: string) => {
        if (!newItem.trim()) return;
        
        setEditedMagicSystem(prev => ({
            ...prev,
            [field]: [...(prev[field as keyof MagicSystem] as string[]), newItem.trim()]
        }));
    };

    const removeArrayItem = (field: string, index: number) => {
        setEditedMagicSystem(prev => ({
            ...prev,
            [field]: (prev[field as keyof MagicSystem] as string[]).filter((_, i) => i !== index)
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
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedMagicSystem.name}
                                    onChange={(e) => updateMagicSystem('name', e.target.value)}
                                    className="bg-transparent border-none outline-none text-xl font-semibold text-gray-900 dark:text-gray-100"
                                />
                            ) : (
                                magicSystem.name
                            )}
                        </h2>
                        {isEditing ? (
                            <select
                                value={editedMagicSystem.category}
                                onChange={(e) => updateMagicSystem('category', e.target.value)}
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs border border-purple-300 dark:border-purple-700"
                            >
                                <option value="elemental">Elemental</option>
                                <option value="divine">Divine</option>
                                <option value="arcane">Arcane</option>
                                <option value="blood">Blood</option>
                                <option value="nature">Nature</option>
                                <option value="shadow">Shadow</option>
                                <option value="psionics">Psionics</option>
                                <option value="enchantment">Enchantment</option>
                            </select>
                        ) : (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                                {magicSystem.category}
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
                            Source of Power
                        </h3>
                        {isEditing ? (
                            <textarea
                                value={editedMagicSystem.sourceOfPower}
                                onChange={(e) => updateMagicSystem('sourceOfPower', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        ) : (
                            <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                                {magicSystem.sourceOfPower}
                            </p>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Rules
                            </h3>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="space-y-2">
                                        {editedMagicSystem.rules.map((rule, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                                <div className="flex-1 flex items-start gap-2">
                                                    <p className="text-gray-900 dark:text-gray-100 text-sm flex-1">{rule}</p>
                                                    <button
                                                        onClick={() => removeArrayItem('rules', idx)}
                                                        className="text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add rule..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                addArrayItem('rules', e.currentTarget.value.trim());
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {magicSystem.rules.map((rule, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                            <p className="text-gray-900 dark:text-gray-100 text-sm">{rule}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Limitations
                            </h3>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="space-y-2">
                                        {editedMagicSystem.limitations.map((limitation, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                                <div className="flex-1 flex items-start gap-2">
                                                    <p className="text-gray-900 dark:text-gray-100 text-sm flex-1">{limitation}</p>
                                                    <button
                                                        onClick={() => removeArrayItem('limitations', idx)}
                                                        className="text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
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
                                <div className="space-y-2">
                                    {magicSystem.limitations.map((limitation, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                            <p className="text-gray-900 dark:text-gray-100 text-sm">{limitation}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Practitioners
                        </h3>
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {editedMagicSystem.practitioners.map((practitioner, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-1">
                                            {practitioner}
                                            <button
                                                onClick={() => removeArrayItem('practitioners', idx)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add practitioner..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            addArrayItem('practitioners', e.currentTarget.value.trim());
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {magicSystem.practitioners.map((practitioner, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                        {practitioner}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Notable Users
                        </h3>
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {editedMagicSystem.notableUsers.map((user, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm flex items-center gap-1">
                                            {user}
                                            <button
                                                onClick={() => removeArrayItem('notableUsers', idx)}
                                                className="text-purple-600 hover:text-purple-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add notable user..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            addArrayItem('notableUsers', e.currentTarget.value.trim());
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {magicSystem.notableUsers.map((user, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                                        {user}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Important Objects
                            </h3>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {editedMagicSystem.importantObjects.map((object, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm flex items-center gap-1">
                                                {object}
                                                <button
                                                    onClick={() => removeArrayItem('importantObjects', idx)}
                                                    className="text-yellow-600 hover:text-yellow-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add important object..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                addArrayItem('importantObjects', e.currentTarget.value.trim());
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {magicSystem.importantObjects.map((object, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
                                            {object}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Locations of Power
                            </h3>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {editedMagicSystem.locationsOfPower.map((location, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm flex items-center gap-1">
                                                {location}
                                                <button
                                                    onClick={() => removeArrayItem('locationsOfPower', idx)}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add location of power..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                addArrayItem('locationsOfPower', e.currentTarget.value.trim());
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {magicSystem.locationsOfPower.map((location, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                                            {location}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Lore References
                        </h3>
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {editedMagicSystem.loreReferences.map((lore, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm flex items-center gap-1">
                                            {lore}
                                            <button
                                                onClick={() => removeArrayItem('loreReferences', idx)}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add lore reference..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            addArrayItem('loreReferences', e.currentTarget.value.trim());
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {magicSystem.loreReferences.map((lore, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm">
                                        {lore}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Cultural Impact
                        </h3>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                            {isEditing ? (
                                <textarea
                                    value={editedMagicSystem.culturalImpact}
                                    onChange={(e) => updateMagicSystem('culturalImpact', e.target.value)}
                                    rows={3}
                                    className="w-full border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 resize-none"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-gray-100">
                                    {magicSystem.culturalImpact}
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

export default MagicSystemDetailsModal;
