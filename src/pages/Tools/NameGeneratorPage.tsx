import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Book, Theme } from '../../types';
import { PenIcon, SettingsIcon, StarIcon, ThumbsDownIcon, RefreshIcon, EditIcon, TrashIcon, XMarkIcon } from '../../constants';

interface NameGeneratorPageProps {
  books: Book[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

interface GeneratedName {
  id: string;
  firstName: string;
  lastName: string;
  meaning: string;
  isShortlisted: boolean;
}

interface AdvancedOptions {
  // Character Options
  gender: 'Male' | 'Female' | 'Neutral';
  age: 'Child' | 'Teen' | 'Adult' | 'Elder';
  traits: string[];
  role: 'Hero' | 'Mentor' | 'Villain' | 'Supporting';
  
  // World/Location Options
  cultureInspiration: 'Medieval European' | 'Ancient Greek' | 'Celtic' | 'Norse' | 'Eastern' | 'Other';
  climateTerrain: 'Forest' | 'Mountain' | 'Desert' | 'Coastal' | 'Urban' | 'Other';
  existingLocalNames: string[];
  
  // Object/Lore/Spell Options
  type: 'Weapon' | 'Spell' | 'Artifact' | 'Place' | 'Other';
  tone: 'Light' | 'Dark' | 'Mystical' | 'Neutral';
  languageStyle: 'English' | 'Latin' | 'Celtic' | 'Norse' | 'Other';
  
  // General Advanced Settings
  lengthPreference: 'Short' | 'Medium' | 'Long';
  phoneticStyle: 'Soft vowels' | 'Hard consonants' | 'Flowing' | 'Mixed';
  prefixes: string[];
  suffixes: string[];
  excludeSimilarNames: string[];
  numberOfSuggestions: number;
}

const NameGeneratorPage: React.FC<NameGeneratorPageProps> = ({ books, theme, setTheme }) => {
  const { bookId } = useParams();
  const [searchParams] = useSearchParams();
  const versionId = searchParams.get('versionId');
  
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState<'Character' | 'World' | 'Location' | 'Object' | 'Magic Spell'>('Character');
  const [isAdvancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [shortlistedNames, setShortlistedNames] = useState<GeneratedName[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
    gender: 'Male',
    age: 'Adult',
    traits: ['Brave', 'Stern', 'Loyal'],
    role: 'Hero',
    cultureInspiration: 'Medieval European',
    climateTerrain: 'Other',
    existingLocalNames: ['Eldric'],
    type: 'Weapon',
    tone: 'Neutral',
    languageStyle: 'English',
    lengthPreference: 'Medium',
    phoneticStyle: 'Mixed',
    prefixes: [],
    suffixes: [],
    excludeSimilarNames: [],
    numberOfSuggestions: 10
  });

  const book = books.find(b => b.id === bookId);

  // Mock data for generated names
  const mockGeneratedNames: GeneratedName[] = [
    { id: '1', firstName: 'Eldric', lastName: 'Thorne', meaning: 'old ruler • sharp', isShortlisted: false },
    { id: '2', firstName: 'Alden', lastName: 'Vyce', meaning: 'wise friend • courageous', isShortlisted: false },
    { id: '3', firstName: 'Garrett', lastName: 'Allard', meaning: 'spear strength • noble', isShortlisted: false },
    { id: '4', firstName: 'Roderic', lastName: 'Hale', meaning: 'renowned ruler • hero', isShortlisted: false },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    // Clear only generated names, keep shortlisted names
    setGeneratedNames([]);
    // Simulate API call
    setTimeout(() => {
      setGeneratedNames(mockGeneratedNames);
      setIsGenerating(false);
    }, 1500);
  };

  const handleShortlist = (name: GeneratedName) => {
    const updatedName = { ...name, isShortlisted: true };
    setShortlistedNames(prev => [...prev, updatedName]);
    setGeneratedNames(prev => prev.filter(n => n.id !== name.id));
  };

  const handleDislike = (nameId: string) => {
    setGeneratedNames(prev => prev.filter(n => n.id !== nameId));
  };

  const handleRemoveFromShortlist = (nameId: string) => {
    setShortlistedNames(prev => prev.filter(n => n.id !== nameId));
  };

  const addTrait = (trait: string) => {
    if (trait && !advancedOptions.traits.includes(trait)) {
      setAdvancedOptions(prev => ({
        ...prev,
        traits: [...prev.traits, trait]
      }));
    }
  };

  const removeTrait = (trait: string) => {
    setAdvancedOptions(prev => ({
      ...prev,
      traits: prev.traits.filter(t => t !== trait)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 dark:from-gray-950 dark:via-black dark:to-black relative overflow-hidden">
      {/* Animated background blobs - same as main page */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-green-700 dark:to-green-900 blur-3xl animate-blob-pulse opacity-40 dark:opacity-50"></div>
      <div 
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-gray-600 to-gray-800 dark:from-orange-700 dark:to-orange-900 blur-3xl animate-blob-pulse opacity-40 dark:opacity-50 transform translate-x-1/2 -translate-y-1/4"
        style={{animationDelay: '-10s'}}
      ></div>

     

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header Section */}
          <motion.div
            className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-800/50 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Name Generator</h1>
            <div className="flex flex-col lg:flex-row gap-4 items-center">
                
              {/* Description Input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="A young knight with a solemn disposition..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Entity Type Dropdown */}
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-w-[140px]"
              >
                <option value="Character">Character</option>
                <option value="World">World</option>
                <option value="Location">Location</option>
                <option value="Object">Object</option>
                <option value="Magic Spell">Magic Spell</option>
              </select>
              
              {/* Settings Button */}
              <motion.button
                onClick={() => setAdvancedOptionsOpen(true)}
                className="p-3 rounded-xl bg-gray-300/50 dark:bg-gray-700/50 hover:bg-gray-400/50 dark:hover:bg-gray-600/50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SettingsIcon className="w-5 h-5" />
              </motion.button>
              
              {/* Generate Button */}
              <motion.button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Generating...
                  </div>
                ) : (
                  'Generate'
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Results Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Generated Names Column */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* 3D effect background with gradient border like BookCard */}
              <div className="absolute -inset-2 bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-700 dark:to-gray-800 opacity-75 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-border-blob-spin blur-xl z-0 rounded-2xl"></div>
              
              <div className="relative bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl p-6 shadow-2xl border border-transparent z-10 transform perspective-1000">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Generated Names</h2>
                <div className="space-y-4 min-h-[400px] relative">
                  <AnimatePresence mode="popLayout">
                    {generatedNames.map((name, index) => (
                      <motion.div
                        key={name.id}
                        layoutId={name.id}
                        initial={{ 
                          opacity: 0, 
                          y: 20, 
                          scale: 0.9,
                          rotateX: 15,
                          rotateY: Math.random() * 10 - 5
                        }}
                        animate={{ 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          rotateX: 0,
                          rotateY: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.8,
                          x: 400,
                          rotateY: 15
                        }}
                        whileHover={{
                          scale: 1.02,
                          rotateY: 5,
                          rotateX: -2,
                          transition: { duration: 0.2 }
                        }}
                        transition={{ 
                          duration: 0.2,
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }}
                        className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 shadow-lg border border-gray-300/30 dark:border-gray-700/30 hover:shadow-xl hover:border-gray-400/40 dark:hover:border-gray-600/40 transition-all transform-gpu"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: `rotateX(${Math.sin(index * 0.5) * 2}deg) rotateY(${Math.cos(index * 0.3) * 3}deg)`
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {name.firstName} {name.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {name.meaning}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <motion.button
                              onClick={() => handleShortlist(name)}
                              className="p-2 rounded-lg bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 border border-yellow-500/30 hover:border-yellow-500/50 transition-all"
                              whileHover={{ scale: 1.15, rotateZ: 10 }}
                              whileTap={{ scale: 0.9 }}
                              title="Shortlist"
                            >
                              <StarIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDislike(name.id)}
                              className="p-2 rounded-lg bg-red-500/20 text-red-600 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 transition-all"
                              whileHover={{ scale: 1.15, rotateZ: -10 }}
                              whileTap={{ scale: 0.9 }}
                              title="Dislike"
                            >
                              <ThumbsDownIcon className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {generatedNames.length === 0 && !isGenerating && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p>Enter a description and click Generate to see name suggestions</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Shortlisted Names Column */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* 3D effect background with gradient border like BookCard */}
              <div className="absolute -inset-2 bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 opacity-75 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-border-blob-spin blur-xl z-0 rounded-2xl"></div>
              
              <div className="relative bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl p-6 shadow-2xl border border-transparent z-10 transform perspective-1000">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Shortlisted Names</h2>
                <div className="space-y-4 min-h-[400px] relative">
                  <AnimatePresence mode="popLayout">
                    {shortlistedNames.map((name, index) => (
                      <motion.div
                        key={name.id}
                        layoutId={name.id}
                        initial={{ 
                          opacity: 0, 
                          y: 20, 
                          scale: 0.9,
                          rotateX: 15,
                          rotateY: Math.random() * 10 - 5
                        }}
                        animate={{ 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          rotateX: 0,
                          rotateY: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.8,
                          rotateY: 15
                        }}
                        whileHover={{
                          scale: 1.02,
                          rotateY: -5,
                          rotateX: -2,
                          transition: { duration: 0.2 }
                        }}
                        transition={{ 
                          duration: 0.2,
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }}
                        className="bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-800/30 rounded-xl p-4 shadow-lg border border-emerald-300/40 dark:border-emerald-600/40 hover:shadow-xl hover:border-emerald-400/50 dark:hover:border-emerald-500/50 transition-all transform-gpu"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: `rotateX(${Math.sin(index * 0.5) * -2}deg) rotateY(${Math.cos(index * 0.3) * -3}deg)`
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {name.firstName} {name.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {name.meaning}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <motion.button
                              className="p-2 rounded-lg bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 transition-all"
                              whileHover={{ scale: 1.15, rotateZ: 10 }}
                              whileTap={{ scale: 0.9 }}
                              title="Generate Variants"
                            >
                              <RefreshIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              className="p-2 rounded-lg bg-gray-500/20 text-gray-600 hover:bg-gray-500/30 border border-gray-500/30 hover:border-gray-500/50 transition-all"
                              whileHover={{ scale: 1.15, rotateZ: -5 }}
                              whileTap={{ scale: 0.9 }}
                              title="Edit"
                            >
                              <EditIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleRemoveFromShortlist(name.id)}
                              className="p-2 rounded-lg bg-red-500/20 text-red-600 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 transition-all"
                              whileHover={{ scale: 1.15, rotateZ: -10 }}
                              whileTap={{ scale: 0.9 }}
                              title="Remove"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {shortlistedNames.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <StarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Shortlisted names will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Save Button */}
          {shortlistedNames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex justify-center"
            >
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Save Shortlisted Names ({shortlistedNames.length})
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Advanced Options Modal */}
      <AnimatePresence>
        {isAdvancedOptionsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setAdvancedOptionsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-800/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Options</h2>
                  <motion.button
                    onClick={() => setAdvancedOptionsOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="space-y-8">
                  {/* Character Options - Only show for Character entity type */}
                  {entityType === 'Character' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Character Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                          <select
                            value={advancedOptions.gender}
                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, gender: e.target.value as any }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Neutral">Neutral</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age</label>
                          <select
                            value={advancedOptions.age}
                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, age: e.target.value as any }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="Child">Child</option>
                            <option value="Teen">Teen</option>
                            <option value="Adult">Adult</option>
                            <option value="Elder">Elder</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Traits</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {advancedOptions.traits.map(trait => (
                            <motion.span
                              key={trait}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm flex items-center gap-1"
                            >
                              {trait}
                              <button
                                onClick={() => removeTrait(trait)}
                                className="hover:text-red-600 dark:hover:text-red-400"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </motion.span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add trait..."
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addTrait((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                        <select
                          value={advancedOptions.role}
                          onChange={(e) => setAdvancedOptions(prev => ({ ...prev, role: e.target.value as any }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="Hero">Hero</option>
                          <option value="Mentor">Mentor</option>
                          <option value="Villain">Villain</option>
                          <option value="Supporting">Supporting</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* World/Location Options - Only show for World, Location entity types */}
                  {(entityType === 'World' || entityType === 'Location') && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">World/Location Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Culture Inspiration</label>
                          <select
                            value={advancedOptions.cultureInspiration}
                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, cultureInspiration: e.target.value as any }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="Medieval European">Medieval European</option>
                            <option value="Ancient Greek">Ancient Greek</option>
                            <option value="Celtic">Celtic</option>
                            <option value="Norse">Norse</option>
                            <option value="Eastern">Eastern</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Climate/Terrain</label>
                          <select
                            value={advancedOptions.climateTerrain}
                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, climateTerrain: e.target.value as any }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="Forest">Forest</option>
                            <option value="Mountain">Mountain</option>
                            <option value="Desert">Desert</option>
                            <option value="Coastal">Coastal</option>
                            <option value="Urban">Urban</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Local Names</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {advancedOptions.existingLocalNames.map(name => (
                            <motion.span
                              key={name}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-1"
                            >
                              {name}
                              <button
                                onClick={() => setAdvancedOptions(prev => ({
                                  ...prev,
                                  existingLocalNames: prev.existingLocalNames.filter(n => n !== name)
                                }))}
                                className="hover:text-red-600 dark:hover:text-red-400"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </motion.span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Add local name..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = (e.target as HTMLInputElement).value;
                              if (value && !advancedOptions.existingLocalNames.includes(value)) {
                                setAdvancedOptions(prev => ({
                                  ...prev,
                                  existingLocalNames: [...prev.existingLocalNames, value]
                                }));
                              }
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Object/Lore/Spell Options - Only show for Object, Magic Spell entity types */}
                  {(entityType === 'Object' || entityType === 'Magic Spell') && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Object/Lore/Spell Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                          <select
                            value={advancedOptions.type}
                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, type: e.target.value as any }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="Weapon">Weapon</option>
                            <option value="Spell">Spell</option>
                            <option value="Artifact">Artifact</option>
                            <option value="Place">Place</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tone</label>
                          <select
                            value={advancedOptions.tone}
                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, tone: e.target.value as any }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="Light">Light</option>
                            <option value="Dark">Dark</option>
                            <option value="Mystical">Mystical</option>
                            <option value="Neutral">Neutral</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language Style Preference</label>
                        <select
                          value={advancedOptions.languageStyle}
                          onChange={(e) => setAdvancedOptions(prev => ({ ...prev, languageStyle: e.target.value as any }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="English">English</option>
                          <option value="Latin">Latin</option>
                          <option value="Celtic">Celtic</option>
                          <option value="Norse">Norse</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* General Advanced Settings - Always show */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Advanced Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Length Preference</label>
                        <select
                          value={advancedOptions.lengthPreference}
                          onChange={(e) => setAdvancedOptions(prev => ({ ...prev, lengthPreference: e.target.value as any }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="Short">Short</option>
                          <option value="Medium">Medium</option>
                          <option value="Long">Long</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phonetic Style</label>
                        <select
                          value={advancedOptions.phoneticStyle}
                          onChange={(e) => setAdvancedOptions(prev => ({ ...prev, phoneticStyle: e.target.value as any }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="Soft vowels">Soft vowels</option>
                          <option value="Hard consonants">Hard consonants</option>
                          <option value="Flowing">Flowing</option>
                          <option value="Mixed">Mixed</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Number of Suggestions</label>
                      <input
                        type="range"
                        min="5"
                        max="20"
                        value={advancedOptions.numberOfSuggestions}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, numberOfSuggestions: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {advancedOptions.numberOfSuggestions}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exclude Similar Names</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {advancedOptions.excludeSimilarNames.map(name => (
                          <motion.span
                            key={name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm flex items-center gap-1"
                          >
                            {name}
                            <button
                              onClick={() => setAdvancedOptions(prev => ({
                                ...prev,
                                excludeSimilarNames: prev.excludeSimilarNames.filter(n => n !== name)
                              }))}
                              className="hover:text-red-600 dark:hover:text-red-400"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Add name to exclude..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = (e.target as HTMLInputElement).value;
                            if (value && !advancedOptions.excludeSimilarNames.includes(value)) {
                              setAdvancedOptions(prev => ({
                                ...prev,
                                excludeSimilarNames: [...prev.excludeSimilarNames, value]
                              }));
                            }
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <motion.button
                    onClick={() => setAdvancedOptionsOpen(false)}
                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={() => setAdvancedOptionsOpen(false)}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Apply
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NameGeneratorPage;
