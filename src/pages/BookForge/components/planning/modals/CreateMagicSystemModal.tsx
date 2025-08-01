import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../../../../../types';
import { XIcon } from '../../../../../constants';
import { MagicSystem } from '../types/WorldBuildingTypes';

interface CreateMagicSystemModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    onSave: (magicSystemData: Omit<MagicSystem, 'id' | 'parentWorldId'>) => void;
}

const CreateMagicSystemModal: React.FC<CreateMagicSystemModalProps> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'elemental',
        sourceOfPower: '',
        practitioners: [] as string[],
        rules: [] as string[],
        limitations: [] as string[],
        notableUsers: [] as string[],
        importantObjects: [] as string[],
        locationsOfPower: [] as string[],
        loreReferences: [] as string[],
        culturalImpact: ''
    });

    const [newPractitioner, setNewPractitioner] = useState('');
    const [newRule, setNewRule] = useState('');
    const [newLimitation, setNewLimitation] = useState('');
    const [newNotableUser, setNewNotableUser] = useState('');
    const [newImportantObject, setNewImportantObject] = useState('');
    const [newLocationOfPower, setNewLocationOfPower] = useState('');
    const [newLoreReference, setNewLoreReference] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim() && formData.sourceOfPower.trim()) {
            onSave(formData);
            onClose();
            // Reset form
            setFormData({
                name: '',
                category: 'elemental',
                sourceOfPower: '',
                practitioners: [],
                rules: [],
                limitations: [],
                notableUsers: [],
                importantObjects: [],
                locationsOfPower: [],
                loreReferences: [],
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Create New Magic System
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
                                Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => updateFormData('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Enter magic system name..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => updateFormData('category', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Source of Power *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={formData.sourceOfPower}
                            onChange={(e) => updateFormData('sourceOfPower', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Describe the source of magical power..."
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Rules
                            </label>
                            <div className="space-y-2">
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {formData.rules.map((rule, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                            <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">{rule}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('rules', idx)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newRule}
                                        onChange={(e) => setNewRule(e.target.value)}
                                        placeholder="Add rule..."
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addToArray('rules', newRule);
                                                setNewRule('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToArray('rules', newRule);
                                            setNewRule('');
                                        }}
                                        className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Limitations
                            </label>
                            <div className="space-y-2">
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {formData.limitations.map((limitation, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                            <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">{limitation}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('limitations', idx)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newLimitation}
                                        onChange={(e) => setNewLimitation(e.target.value)}
                                        placeholder="Add limitation..."
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addToArray('limitations', newLimitation);
                                                setNewLimitation('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToArray('limitations', newLimitation);
                                            setNewLimitation('');
                                        }}
                                        className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Practitioners
                            </label>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {formData.practitioners.map((practitioner, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-1">
                                            {practitioner}
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('practitioners', idx)}
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
                                        value={newPractitioner}
                                        onChange={(e) => setNewPractitioner(e.target.value)}
                                        placeholder="Add practitioner..."
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addToArray('practitioners', newPractitioner);
                                                setNewPractitioner('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToArray('practitioners', newPractitioner);
                                            setNewPractitioner('');
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
                                Notable Users
                            </label>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {formData.notableUsers.map((user, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm flex items-center gap-1">
                                            {user}
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('notableUsers', idx)}
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
                                        value={newNotableUser}
                                        onChange={(e) => setNewNotableUser(e.target.value)}
                                        placeholder="Add notable user..."
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addToArray('notableUsers', newNotableUser);
                                                setNewNotableUser('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToArray('notableUsers', newNotableUser);
                                            setNewNotableUser('');
                                        }}
                                        className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Important Objects
                            </label>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {formData.importantObjects.map((object, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm flex items-center gap-1">
                                            {object}
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('importantObjects', idx)}
                                                className="text-yellow-600 hover:text-yellow-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newImportantObject}
                                        onChange={(e) => setNewImportantObject(e.target.value)}
                                        placeholder="Add important object..."
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addToArray('importantObjects', newImportantObject);
                                                setNewImportantObject('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToArray('importantObjects', newImportantObject);
                                            setNewImportantObject('');
                                        }}
                                        className="px-3 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Locations of Power
                            </label>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {formData.locationsOfPower.map((location, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm flex items-center gap-1">
                                            {location}
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('locationsOfPower', idx)}
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
                                        value={newLocationOfPower}
                                        onChange={(e) => setNewLocationOfPower(e.target.value)}
                                        placeholder="Add location of power..."
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addToArray('locationsOfPower', newLocationOfPower);
                                                setNewLocationOfPower('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToArray('locationsOfPower', newLocationOfPower);
                                            setNewLocationOfPower('');
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
                            Lore References
                        </label>
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {formData.loreReferences.map((lore, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm flex items-center gap-1">
                                        {lore}
                                        <button
                                            type="button"
                                            onClick={() => removeFromArray('loreReferences', idx)}
                                            className="text-indigo-600 hover:text-indigo-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newLoreReference}
                                    onChange={(e) => setNewLoreReference(e.target.value)}
                                    placeholder="Add lore reference..."
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addToArray('loreReferences', newLoreReference);
                                            setNewLoreReference('');
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        addToArray('loreReferences', newLoreReference);
                                        setNewLoreReference('');
                                    }}
                                    className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
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
                            placeholder="How does this magic system impact culture and society?"
                        />
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
                            Create Magic System
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateMagicSystemModal;
