import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../../../../../types';
import { XIcon } from '../../../../../constants';
import SearchableDropdown from '../components/SearchableDropdown';

interface CreateLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (locationData: any) => void;
    theme: Theme;
    existingLocations?: any[]; // For parent location selection
}

// Predefined options for dropdowns
const LOCATION_TYPES = [
    'Kingdom', 'Empire', 'Nation-State', 'City', 'Town', 'Village', 'Hamlet',
    'Fortress', 'Temple', 'Castle', 'Port', 'Mine', 'Ruins',
    'Mountain', 'Forest', 'River', 'Lake', 'Desert', 'Ocean', 'Island', 'Cave', 'Valley', 'Plains'
];

const REGIONS = [
    'Northern', 'Southern', 'Eastern', 'Western', 'Central', 'Coastal', 'Highland', 'Lowland',
    'Steppe', 'Arctic', 'Desert', 'Forested'
];

const TERRAINS = [
    'Flatlands', 'Rolling Hills', 'Mountains', 'Volcanic', 'Desert', 'Forest',
    'Swamp', 'Jungle', 'Tundra', 'Steppe', 'Coastal', 'Underground', 'Mixed Terrain'
];

const CLIMATES = [
    'Temperate', 'Tropical', 'Arid', 'Mediterranean', 'Polar', 'Alpine',
    'Subarctic', 'Rainforest', 'Monsoon', 'Oceanic'
];

const GOVERNANCE_TYPES = [
    'Monarchy', 'Tribal Council', 'Republic', 'Theocracy', 'Clan-based',
    'Nominal Rule', 'None (Anarchic)', 'Democratic'
];

const TECHNOLOGY_LEVELS = [
    'Stone Age', 'Bronze Age', 'Iron Age', 'Medieval', 'Pre-Industrial',
    'Industrial', 'Early Modern', 'Modern', 'Futuristic', 'Magical Equivalent'
];

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    theme,
    existingLocations = []
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: '',
        customType: '',
        region: '',
        customRegion: '',
        terrain: '',
        customTerrain: '',
        climate: '',
        customClimate: '',
        governance: '',
        customGovernance: '',
        technology: '',
        customTechnology: '',
        parentLocation: '',
        floraFauna: [] as string[],
        traditions: [] as string[],
        languages: [] as string[],
        leaders: [] as string[],
        trade: [] as string[],
        landmarks: [] as string[]
    });

    const [newItems, setNewItems] = useState({
        floraFauna: '',
        tradition: '',
        language: '',
        leader: '',
        trade: '',
        landmark: ''
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addArrayItem = (field: keyof typeof newItems, arrayField: keyof typeof formData) => {
        const value = newItems[field].trim();
        if (value && !formData[arrayField].includes(value)) {
            setFormData(prev => ({
                ...prev,
                [arrayField]: [...(prev[arrayField] as string[]), value]
            }));
            setNewItems(prev => ({ ...prev, [field]: '' }));
        }
    };

    const removeArrayItem = (arrayField: keyof typeof formData, index: number) => {
        setFormData(prev => ({
            ...prev,
            [arrayField]: (prev[arrayField] as string[]).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        
        const locationData = {
            id: Date.now().toString(),
            name: formData.name,
            description: formData.description,
            type: formData.type === 'custom' ? formData.customType : formData.type,
            region: formData.region === 'custom' ? formData.customRegion : formData.region,
            parentLocation: formData.parentLocation || undefined,
            geography: {
                terrain: formData.terrain === 'custom' ? formData.customTerrain : formData.terrain,
                climate: formData.climate === 'custom' ? formData.customClimate : formData.climate,
                floraFauna: formData.floraFauna
            },
            culture: {
                population: 0,
                language: formData.languages,
                traditions: formData.traditions,
                governance: formData.governance === 'custom' ? formData.customGovernance : formData.governance
            },
            politics: {
                government: formData.governance === 'custom' ? formData.customGovernance : formData.governance,
                laws: [],
                conflicts: [],
                leaders: formData.leaders
            },
            economy: {
                trade: formData.trade,
                technology: formData.technology === 'custom' ? formData.customTechnology : formData.technology
            },
            notableFeatures: [],
            connections: [],
            landmarks: formData.landmarks,
            history: []
        };
        
        onSave(locationData);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setFormData({
            name: '', description: '', type: '', customType: '',
            region: '', customRegion: '', terrain: '', customTerrain: '',
            climate: '', customClimate: '', governance: '', customGovernance: '',
            technology: '', customTechnology: '', parentLocation: '',
            floraFauna: [], traditions: [], languages: [], leaders: [], trade: [], landmarks: []
        });
        setNewItems({
            floraFauna: '', tradition: '', language: '', leader: '', trade: '', landmark: ''
        });
    };

    const handleCancel = () => {
        resetForm();
        onClose();
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
                        Create New Location
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Enter location name..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Parent Location
                            </label>
                            <select
                                value={formData.parentLocation}
                                onChange={(e) => handleInputChange('parentLocation', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">None (Top-level location)</option>
                                {existingLocations.map(location => (
                                    <option key={location.id} value={location.id}>
                                        {location.name} ({location.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SearchableDropdown
                            label="Type"
                            value={formData.type}
                            onChange={(value) => handleInputChange('type', value)}
                            options={LOCATION_TYPES}
                            placeholder="Search location types..."
                            customValue={formData.customType}
                            onCustomChange={(value) => handleInputChange('customType', value)}
                            allowCustom={true}
                        />
                        <div></div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Describe this location..."
                        />
                    </div>

                    {/* Geography */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SearchableDropdown
                            label="Region"
                            value={formData.region}
                            onChange={(value) => handleInputChange('region', value)}
                            options={REGIONS}
                            placeholder="Search regions..."
                            customValue={formData.customRegion}
                            onCustomChange={(value) => handleInputChange('customRegion', value)}
                            allowCustom={true}
                        />
                        <SearchableDropdown
                            label="Terrain"
                            value={formData.terrain}
                            onChange={(value) => handleInputChange('terrain', value)}
                            options={TERRAINS}
                            placeholder="Search terrain types..."
                            customValue={formData.customTerrain}
                            onCustomChange={(value) => handleInputChange('customTerrain', value)}
                            allowCustom={true}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SearchableDropdown
                            label="Climate"
                            value={formData.climate}
                            onChange={(value) => handleInputChange('climate', value)}
                            options={CLIMATES}
                            placeholder="Search climate types..."
                            customValue={formData.customClimate}
                            onCustomChange={(value) => handleInputChange('customClimate', value)}
                            allowCustom={true}
                        />
                        <SearchableDropdown
                            label="Governance"
                            value={formData.governance}
                            onChange={(value) => handleInputChange('governance', value)}
                            options={GOVERNANCE_TYPES}
                            placeholder="Search governance types..."
                            customValue={formData.customGovernance}
                            onCustomChange={(value) => handleInputChange('customGovernance', value)}
                            allowCustom={true}
                        />
                    </div>

                    {/* Array fields with add/remove functionality */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Flora & Fauna
                            </label>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {formData.floraFauna.map((item, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs flex items-center gap-1">
                                        {item}
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('floraFauna', idx)}
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
                                    value={newItems.floraFauna}
                                    onChange={(e) => setNewItems(prev => ({ ...prev, floraFauna: e.target.value }))}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    placeholder="Add flora/fauna..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('floraFauna', 'floraFauna'))}
                                />
                                <button
                                    type="button"
                                    onClick={() => addArrayItem('floraFauna', 'floraFauna')}
                                    className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Traditions
                            </label>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {formData.traditions.map((item, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs flex items-center gap-1">
                                        {item}
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('traditions', idx)}
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
                                    value={newItems.tradition}
                                    onChange={(e) => setNewItems(prev => ({ ...prev, tradition: e.target.value }))}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    placeholder="Add tradition..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('tradition', 'traditions'))}
                                />
                                <button
                                    type="button"
                                    onClick={() => addArrayItem('tradition', 'traditions')}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                        >
                            Create Location
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateLocationModal;
