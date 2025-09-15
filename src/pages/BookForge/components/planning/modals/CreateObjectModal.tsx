import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../../../../../types';
import { XIcon } from '../../../../../constants';

interface CreateObjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (objectData: any) => void;
    theme: Theme;
    existingCharacters?: Array<{
        id: string;
        name: string;
    }>;
}

// Predefined options for dropdowns
const OBJECT_TYPES = [
    // Weapons
    'Sword', 'Axe', 'Bow', 'Spear', 'Dagger',
    // Armor / Defensive
    'Shield', 'Helmet', 'Breastplate', 'Cloak',
    // Magical Items
    'Magical Artifact', 'Relic', 'Talisman', 'Amulet', 'Ring', 'Staff', 'Wand', 'Book', 'Grimoire',
    // Utility Items
    'Tool', 'Map', 'Key', 'Container', 'Chest', 'Box', 'Bag of Holding',
    // Technological
    'Device', 'Machine', 'Weapon of Mass Destruction',
    // Other
    'Sacred Relic', 'Legendary Object'
];

const ORIGINS = [
    'Forged / Crafted', 'Discovered / Excavated', 'Bestowed / Gifted', 'Stolen',
    'Found in Nature', 'Divine Creation', 'Cursed Object', 'Unknown'
];

const POWERS = [
    'Invisibility', 'Flight', 'Immortality', 'Super Strength', 'Enhanced Perception / Awareness',
    'Teleportation', 'Elemental Control (Fire)', 'Elemental Control (Water)', 'Elemental Control (Air)', 
    'Elemental Control (Earth)', 'Healing / Restoration', 'Mind Control / Domination of Wills',
    'Protection / Warding', 'Illusion Casting', 'Time Manipulation'
];

const LIMITATIONS = [
    'Corrupts Bearer', 'Limited Uses (charges, time-bound)', 'Requires Specific Conditions',
    'Vulnerable to Specific Material', 'Cannot be Destroyed Easily', 'Attracts Enemies\' Attention',
    'Slowly Drains User\'s Life', 'Only Works for Certain People'
];

export const CreateObjectModal: React.FC<CreateObjectModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    theme,
    existingCharacters = []
}) => {
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        customType: '',
        origin: '',
        customOrigin: '',
        description: '',
        currentHolder: '',
        powers: [] as string[],
        customPowers: [] as string[],
        limitations: [] as string[],
        customLimitations: [] as string[],
        pastOwners: [] as string[],
        image: ''
    });

    const [searchTerms, setSearchTerms] = useState({
        type: '',
        origin: '',
        powers: '',
        limitations: ''
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSearchChange = (field: string, value: string) => {
        setSearchTerms(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addArrayItem = (field: string, item: string) => {
        if (!item.trim()) return;
        
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field as keyof typeof prev] as string[], item.trim()]
        }));
    };

    const removeArrayItem = (field: string, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
        }));
    };

    const handleSave = () => {
        if (!formData.name.trim()) return;

        const objectData = {
            id: `obj-${Date.now()}`,
            name: formData.name,
            type: formData.type === 'custom' ? formData.customType : formData.type,
            origin: formData.origin === 'custom' ? formData.customOrigin : formData.origin,
            description: formData.description,
            currentHolder: formData.currentHolder,
            powers: [...formData.powers, ...formData.customPowers],
            limitations: [...formData.limitations, ...formData.customLimitations],
            pastOwners: formData.pastOwners,
            timelineEvents: [],
            image: formData.image
        };

        onSave(objectData);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: '',
            customType: '',
            origin: '',
            customOrigin: '',
            description: '',
            currentHolder: '',
            powers: [],
            customPowers: [],
            limitations: [],
            customLimitations: [],
            pastOwners: [],
            image: ''
        });
        setSearchTerms({
            type: '',
            origin: '',
            powers: '',
            limitations: ''
        });
    };

    const filterOptions = (options: string[], searchTerm: string) => {
        if (!searchTerm) return options;
        return options.filter(option => 
            option.toLowerCase().includes(searchTerm.toLowerCase())
        );
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
                        Create New Object
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Object Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Enter object name..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Image URL
                            </label>
                            <input
                                type="text"
                                value={formData.image}
                                onChange={(e) => handleInputChange('image', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Enter image URL..."
                            />
                        </div>
                    </div>

                    {/* Type Selection with Search */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Type
                            </label>
                            <input
                                type="text"
                                value={searchTerms.type}
                                onChange={(e) => handleSearchChange('type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
                                placeholder="Search types..."
                            />
                            <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                                {filterOptions(OBJECT_TYPES, searchTerms.type).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            handleInputChange('type', type);
                                            handleSearchChange('type', type);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm ${
                                            formData.type === type ? 'bg-blue-100 dark:bg-blue-900' : ''
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        handleInputChange('type', 'custom');
                                        handleSearchChange('type', 'Custom...');
                                    }}
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm font-medium ${
                                        formData.type === 'custom' ? 'bg-blue-100 dark:bg-blue-900' : ''
                                    }`}
                                >
                                    Custom...
                                </button>
                            </div>
                            {formData.type === 'custom' && (
                                <input
                                    type="text"
                                    value={formData.customType}
                                    onChange={(e) => handleInputChange('customType', e.target.value)}
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Enter custom type..."
                                />
                            )}
                        </div>

                        {/* Origin Selection with Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Origin
                            </label>
                            <input
                                type="text"
                                value={searchTerms.origin}
                                onChange={(e) => handleSearchChange('origin', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
                                placeholder="Search origins..."
                            />
                            <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                                {filterOptions(ORIGINS, searchTerms.origin).map(origin => (
                                    <button
                                        key={origin}
                                        onClick={() => {
                                            handleInputChange('origin', origin);
                                            handleSearchChange('origin', origin);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm ${
                                            formData.origin === origin ? 'bg-blue-100 dark:bg-blue-900' : ''
                                        }`}
                                    >
                                        {origin}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        handleInputChange('origin', 'custom');
                                        handleSearchChange('origin', 'Custom...');
                                    }}
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm font-medium ${
                                        formData.origin === 'custom' ? 'bg-blue-100 dark:bg-blue-900' : ''
                                    }`}
                                >
                                    Custom...
                                </button>
                            </div>
                            {formData.origin === 'custom' && (
                                <input
                                    type="text"
                                    value={formData.customOrigin}
                                    onChange={(e) => handleInputChange('customOrigin', e.target.value)}
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Enter custom origin..."
                                />
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Describe the object..."
                        />
                    </div>

                    {/* Current Holder */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Holder
                        </label>
                        <select
                            value={formData.currentHolder}
                            onChange={(e) => handleInputChange('currentHolder', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option value="">None / Unknown</option>
                            {existingCharacters.map(character => (
                                <option key={character.id} value={character.name}>
                                    {character.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Powers Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Powers & Abilities
                        </label>
                        <input
                            type="text"
                            value={searchTerms.powers}
                            onChange={(e) => handleSearchChange('powers', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
                            placeholder="Search powers..."
                        />
                        <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 mb-2">
                            {filterOptions(POWERS, searchTerms.powers).map(power => (
                                <button
                                    key={power}
                                    onClick={() => {
                                        if (!formData.powers.includes(power)) {
                                            addArrayItem('powers', power);
                                        }
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                                    disabled={formData.powers.includes(power)}
                                >
                                    {power} {formData.powers.includes(power) && '✓'}
                                </button>
                            ))}
                        </div>
                        
                        {/* Selected Powers */}
                        <div className="flex flex-wrap gap-1 mb-2">
                            {formData.powers.map((power, idx) => (
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
                            {formData.customPowers.map((power, idx) => (
                                <span key={`custom-${idx}`} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs flex items-center gap-1">
                                    {power}
                                    <button
                                        onClick={() => removeArrayItem('customPowers', idx)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        
                        {/* Add Custom Power */}
                        <input
                            type="text"
                            placeholder="Add custom power..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    addArrayItem('customPowers', e.currentTarget.value.trim());
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>

                    {/* Limitations Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Limitations & Weaknesses
                        </label>
                        <input
                            type="text"
                            value={searchTerms.limitations}
                            onChange={(e) => handleSearchChange('limitations', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
                            placeholder="Search limitations..."
                        />
                        <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 mb-2">
                            {filterOptions(LIMITATIONS, searchTerms.limitations).map(limitation => (
                                <button
                                    key={limitation}
                                    onClick={() => {
                                        if (!formData.limitations.includes(limitation)) {
                                            addArrayItem('limitations', limitation);
                                        }
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                                    disabled={formData.limitations.includes(limitation)}
                                >
                                    {limitation} {formData.limitations.includes(limitation) && '✓'}
                                </button>
                            ))}
                        </div>
                        
                        {/* Selected Limitations */}
                        <div className="flex flex-wrap gap-1 mb-2">
                            {formData.limitations.map((limitation, idx) => (
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
                            {formData.customLimitations.map((limitation, idx) => (
                                <span key={`custom-${idx}`} className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs flex items-center gap-1">
                                    {limitation}
                                    <button
                                        onClick={() => removeArrayItem('customLimitations', idx)}
                                        className="text-orange-600 hover:text-orange-800"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        
                        {/* Add Custom Limitation */}
                        <input
                            type="text"
                            placeholder="Add custom limitation..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    addArrayItem('customLimitations', e.currentTarget.value.trim());
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>

                    {/* Past Owners */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Past Owners
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {formData.pastOwners.map((owner, idx) => (
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

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formData.name.trim()}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg"
                        >
                            Create Object
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateObjectModal;
