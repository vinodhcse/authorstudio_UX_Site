import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Theme, Character } from '../../../../types';
import { 
    PersonIcon, 
    MirrorIcon, 
    BrainIcon, 
    ScrollIcon, 
    ZapIcon, 
    UsersIcon, 
    ChevronDownIcon,
    ChevronRightIcon 
} from '../../../../constants';

interface CharacterProfileBuilderWrapperProps {
    theme: Theme;
    initialCharacter?: Character | null;
    onSave: (characterData: any) => void;
    onCancel: () => void;
}

// Accordion section configuration
const accordionSections = [
    { 
        id: 'identity', 
        title: 'Identity & Basics', 
        icon: PersonIcon,
        description: 'Core identity and basic information'
    },
    { 
        id: 'appearance', 
        title: 'Physical Appearance', 
        icon: MirrorIcon,
        description: 'Physical traits and appearance details'
    },
    { 
        id: 'personality', 
        title: 'Personality & Psychology', 
        icon: BrainIcon,
        description: 'Traits, goals, beliefs, and psychological profile'
    },
    { 
        id: 'backstory', 
        title: 'Backstory & History', 
        icon: ScrollIcon,
        description: 'Background, family, education, and life events'
    },
    { 
        id: 'skills', 
        title: 'Skills & Abilities', 
        icon: ZapIcon,
        description: 'Combat skills, magical abilities, and talents'
    },
    { 
        id: 'relationships', 
        title: 'Relationships & Social', 
        icon: UsersIcon,
        description: 'Family, friends, rivals, and social connections'
    }
];

// Collapsible Section Component
const CollapsibleSection: React.FC<{
    section: typeof accordionSections[0];
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ section, isOpen, onToggle, children }) => {
    const Icon = section.icon;
    const ChevronIcon = isOpen ? ChevronDownIcon : ChevronRightIcon;

    return (
        <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <button
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-750 dark:hover:to-gray-700 transition-all"
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {section.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {section.description}
                        </p>
                    </div>
                </div>
                <ChevronIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform" />
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Character Form Component with Accordion Structure
const CharacterProfileBuilderWrapper: React.FC<CharacterProfileBuilderWrapperProps> = ({
    theme,
    initialCharacter,
    onSave,
    onCancel
}) => {
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['identity']));
    const [formData, setFormData] = useState({
        // Basic Identity
        fullName: initialCharacter?.fullName || initialCharacter?.name || '',
        name: initialCharacter?.name || '',
        aliases: [],
        gender: initialCharacter?.gender || '',
        pronouns: '',
        age: initialCharacter?.age || 25,
        species: initialCharacter?.species || 'Human',
        occupation: '',
        citizenship: '',
        lifestyle: '',
        characterRole: 'Protagonist' as 'Protagonist' | 'Antagonist' | 'Both',
        characterType: 'Primary' as 'Primary' | 'Secondary' | 'Tertiary',
        
        // Appearance
        height: initialCharacter?.height || '',
        weight: '',
        build: initialCharacter?.build || '',
        hairColor: initialCharacter?.hairColor || '',
        hairStyle: '',
        eyeColor: initialCharacter?.eyeColor || '',
        eyeShape: '',
        faceShape: '',
        vision: '',
        skinTone: initialCharacter?.skinTone || '',
        distinguishingFeatures: [],
        distinguishingMarks: initialCharacter?.distinguishingMarks || '',
        accessories: [],
        health: '',
        clothingStyle: '',
        mannerisms: [],
        physicalQuirks: [],
        disabilities: '',
        
        // Personality
        personalityType: initialCharacter?.personalityType || '',
        traits: [],
        coreTraits: initialCharacter?.coreTraits || [],
        positiveTraits: initialCharacter?.positiveTraits || [],
        goals: [],
        beliefs: [],
        strengths: [],
        weaknesses: [],
        motto: '',
        fears: [],
        desires: initialCharacter?.desires || [],
        internalConflicts: [],
        externalConflicts: [],
        dialogueQuirks: [],
        personality: 'Introvert' as 'Introvert' | 'Extrovert' | 'Ambivert',
        dominantTrait: 'Confident' as 'Confident' | 'Emotional' | 'Logical',
        selfPerception: '',
        othersPerception: '',
        mentalHealth: '',
        secrets: [],
        
        // Backstory
        backstory: initialCharacter?.backstory || '',
        birthplace: '',
        childhood: '',
        family: {},
        education: '',
        majorEvents: [],
        achievements: [],
        failures: [],
        romanticHistory: '',
        reputation: '',
        spiritualBeliefs: '',
        
        // Skills & Abilities
        primarySkills: initialCharacter?.primarySkills || [],
        weaponsMastery: {},
        magicalAbilities: initialCharacter?.magicalAbilities || [],
        combatSkills: initialCharacter?.combatSkills || [],
        specialTalents: {},
        limitations: [],
        signatureMove: '',
        
        // Relationships
        relationships: [],
        groupAffiliations: [],
        rivalries: [],
        influence: '',
        
        // Additional
        quote: initialCharacter?.quote || '',
        role: initialCharacter?.role || initialCharacter?.title || '',
        title: initialCharacter?.title || '',
        importance: initialCharacter?.importance || 'Primary',
        image: initialCharacter?.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face'
    });

    const toggleSection = (sectionId: string) => {
        setOpenSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleArrayChange = (field: string, value: string) => {
        const arrayValue = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
        handleChange(field, arrayValue);
    };

    const handleSave = () => {
        // Convert form data to character format
        const characterData = {
            ...formData,
            id: initialCharacter?.id || `char_${Date.now()}`,
            updatedAt: new Date().toISOString()
        };
        
        onSave(characterData);
    };

    // Identity Section
    const renderIdentitySection = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name *
                </label>
                <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter character's full name"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Aliases/Nicknames
                </label>
                <input
                    type="text"
                    value={formData.aliases.join(', ')}
                    onChange={(e) => handleArrayChange('aliases', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nicknames, titles (comma separated)"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gender
                </label>
                <input
                    type="text"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Male, Female, Non-binary, etc."
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Age
                </label>
                <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange('age', parseInt(e.target.value) || 25)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Character's age"
                    min="1"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Species/Race
                </label>
                <input
                    type="text"
                    value={formData.species}
                    onChange={(e) => handleChange('species', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Human, Elf, Dwarf, etc."
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Occupation/Role
                </label>
                <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleChange('occupation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Knight, Mage, Merchant, etc."
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Character Role
                </label>
                <select
                    value={formData.characterRole}
                    onChange={(e) => handleChange('characterRole', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="Protagonist">Protagonist</option>
                    <option value="Antagonist">Antagonist</option>
                    <option value="Both">Both</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Character Type
                </label>
                <select
                    value={formData.characterType}
                    onChange={(e) => handleChange('characterType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Tertiary">Tertiary</option>
                </select>
            </div>
        </div>
    );

    // Appearance Section
    const renderAppearanceSection = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Height
                    </label>
                    <input
                        type="text"
                        value={formData.height}
                        onChange={(e) => handleChange('height', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="5'8&quot;, 170cm, Tall, etc."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Build/Physique
                    </label>
                    <input
                        type="text"
                        value={formData.build}
                        onChange={(e) => handleChange('build', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Athletic, Slender, Stocky, etc."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Hair Color
                    </label>
                    <input
                        type="text"
                        value={formData.hairColor}
                        onChange={(e) => handleChange('hairColor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Brown, Blonde, Black, etc."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Eye Color
                    </label>
                    <input
                        type="text"
                        value={formData.eyeColor}
                        onChange={(e) => handleChange('eyeColor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Blue, Green, Brown, etc."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Skin Tone
                    </label>
                    <input
                        type="text"
                        value={formData.skinTone}
                        onChange={(e) => handleChange('skinTone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Fair, Olive, Dark, etc."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Clothing Style
                    </label>
                    <input
                        type="text"
                        value={formData.clothingStyle}
                        onChange={(e) => handleChange('clothingStyle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Casual, Formal, Rustic, etc."
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Distinguishing Features
                </label>
                <input
                    type="text"
                    value={formData.distinguishingFeatures.join(', ')}
                    onChange={(e) => handleArrayChange('distinguishingFeatures', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Scars, tattoos, birthmarks (comma separated)"
                />
            </div>
        </div>
    );

    // Personality Section
    const renderPersonalitySection = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Personality Type
                    </label>
                    <select
                        value={formData.personality}
                        onChange={(e) => handleChange('personality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="Introvert">Introvert</option>
                        <option value="Extrovert">Extrovert</option>
                        <option value="Ambivert">Ambivert</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dominant Trait
                    </label>
                    <select
                        value={formData.dominantTrait}
                        onChange={(e) => handleChange('dominantTrait', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="Confident">Confident</option>
                        <option value="Emotional">Emotional</option>
                        <option value="Logical">Logical</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Core Traits
                </label>
                <input
                    type="text"
                    value={formData.coreTraits.join(', ')}
                    onChange={(e) => handleArrayChange('coreTraits', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Brave, Loyal, Curious (comma separated)"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Goals & Desires
                </label>
                <input
                    type="text"
                    value={formData.desires.join(', ')}
                    onChange={(e) => handleArrayChange('desires', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Find family, Save kingdom, Learn magic (comma separated)"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Character Motto/Quote
                </label>
                <input
                    type="text"
                    value={formData.quote}
                    onChange={(e) => handleChange('quote', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="A phrase that defines this character"
                />
            </div>
        </div>
    );

    // Backstory Section
    const renderBackstorySection = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Background Story
                </label>
                <textarea
                    value={formData.backstory}
                    onChange={(e) => handleChange('backstory', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Character's history, upbringing, and formative experiences..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Birthplace
                    </label>
                    <input
                        type="text"
                        value={formData.birthplace}
                        onChange={(e) => handleChange('birthplace', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Where were they born?"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Education
                    </label>
                    <input
                        type="text"
                        value={formData.education}
                        onChange={(e) => handleChange('education', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Formal education, training, mentors"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Major Life Events
                </label>
                <input
                    type="text"
                    value={formData.majorEvents.join(', ')}
                    onChange={(e) => handleArrayChange('majorEvents', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Significant events that shaped them (comma separated)"
                />
            </div>
        </div>
    );

    // Skills Section
    const renderSkillsSection = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Primary Skills
                </label>
                <input
                    type="text"
                    value={formData.primarySkills.join(', ')}
                    onChange={(e) => handleArrayChange('primarySkills', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Swordsmanship, Magic, Leadership (comma separated)"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Combat Skills
                </label>
                <input
                    type="text"
                    value={formData.combatSkills.join(', ')}
                    onChange={(e) => handleArrayChange('combatSkills', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Sword fighting, Archery, Hand-to-hand (comma separated)"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Magical Abilities
                </label>
                <input
                    type="text"
                    value={formData.magicalAbilities.join(', ')}
                    onChange={(e) => handleArrayChange('magicalAbilities', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Fire magic, Healing, Telepathy (comma separated)"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Signature Move/Ability
                </label>
                <input
                    type="text"
                    value={formData.signatureMove}
                    onChange={(e) => handleChange('signatureMove', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Their most notable technique or ability"
                />
            </div>
        </div>
    );

    // Relationships Section
    const renderRelationshipsSection = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Group Affiliations
                </label>
                <input
                    type="text"
                    value={formData.groupAffiliations.join(', ')}
                    onChange={(e) => handleArrayChange('groupAffiliations', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Guilds, organizations, kingdoms (comma separated)"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rivals/Enemies
                </label>
                <input
                    type="text"
                    value={formData.rivalries.join(', ')}
                    onChange={(e) => handleArrayChange('rivalries', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Personal enemies, rival characters (comma separated)"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reputation/Influence
                </label>
                <textarea
                    value={formData.influence}
                    onChange={(e) => handleChange('influence', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="How they are perceived by others, their social standing and influence..."
                />
            </div>
        </div>
    );

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''} w-full min-h-full bg-gray-50 dark:bg-gray-900`}>
            <div className="max-w-4xl mx-auto p-6 pb-20">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {initialCharacter ? 'Edit Character' : 'Create New Character'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {initialCharacter ? 'Update character details using the sections below' : 'Build a detailed character profile using the expandable sections below'}
                    </p>
                </div>

                {/* Accordion Sections */}
                <div className="space-y-4">
                    {accordionSections.map((section) => (
                        <CollapsibleSection
                            key={section.id}
                            section={section}
                            isOpen={openSections.has(section.id)}
                            onToggle={() => toggleSection(section.id)}
                        >
                            {section.id === 'identity' && renderIdentitySection()}
                            {section.id === 'appearance' && renderAppearanceSection()}
                            {section.id === 'personality' && renderPersonalitySection()}
                            {section.id === 'backstory' && renderBackstorySection()}
                            {section.id === 'skills' && renderSkillsSection()}
                            {section.id === 'relationships' && renderRelationshipsSection()}
                        </CollapsibleSection>
                    ))}
                </div>

                {/* Action Buttons */}
                <motion.div 
                    className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        {initialCharacter ? 'Update Character' : 'Create Character'}
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default CharacterProfileBuilderWrapper;
