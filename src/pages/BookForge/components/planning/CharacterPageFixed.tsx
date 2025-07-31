import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Theme } from '../../../../types';
import CharacterDetailsView from '../../../../components/CharacterDetailsView';
import { PlusIcon } from '../../../../constants';
import { useBookContext, useCurrentBookAndVersion } from '../../../../contexts/BookContext';

interface CharacterPageProps {
    theme: Theme;
    searchQuery?: string;
}

const CharacterPage: React.FC<CharacterPageProps> = ({ 
    theme, 
    searchQuery = ''
}) => {
    const navigate = useNavigate();
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    
    // Use BookContext to get current data
    const { getCharacters, getCharacter } = useBookContext();
    const { bookId, versionId } = useCurrentBookAndVersion();

    // Get characters from current version
    const characters = bookId && versionId ? getCharacters(bookId, versionId) : [];
    
    // Find the selected character
    const selectedCharacter = selectedCharacterId && bookId && versionId
        ? getCharacter(bookId, versionId, selectedCharacterId)
        : null;
    
    // Filter characters based on search query
    const filteredCharacters = characters.filter(char => 
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (char.fullName && char.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (char.role && char.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group characters by importance (combined Secondary and Tertiary)
    const primaryCharacters = filteredCharacters.filter(char => char.importance === 'Primary');
    const secondaryCharacters = filteredCharacters.filter(char => char.importance === 'Secondary' || char.importance === 'Tertiary');

    // Auto-rotate through primary characters every 5 seconds
    useEffect(() => {
        if (primaryCharacters.length > 1) {
            const interval = setInterval(() => {
                setCurrentHeroIndex((prev) => (prev + 1) % primaryCharacters.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [primaryCharacters.length]);

    // Reset hero index when primary characters change
    useEffect(() => {
        if (currentHeroIndex >= primaryCharacters.length) {
            setCurrentHeroIndex(0);
        }
    }, [primaryCharacters.length, currentHeroIndex]);

    // Get current hero character
    const currentHeroCharacter = primaryCharacters[currentHeroIndex];
    
    // Handle character creation
    const handleCreateCharacter = () => {
        navigate('/tools/character-profile-builder');
    };
    
    // If a character is selected, show details view
    if (selectedCharacter) {
        return (
            <div className="h-full bg-gray-50 dark:bg-gray-900">
                <CharacterDetailsView 
                    character={selectedCharacter}
                    theme={theme}
                    onClose={() => setSelectedCharacterId(null)}
                />
            </div>
        );
    }

    const renderHeroSection = () => (
        <div className="mb-8">
            {primaryCharacters.length > 0 && currentHeroCharacter && (
                <motion.div
                    key={currentHeroCharacter.id}
                    className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 dark:from-purple-800 dark:via-blue-800 dark:to-indigo-900 rounded-3xl shadow-2xl overflow-hidden mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-32 translate-y-32"></div>
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center p-8 lg:p-12 gap-8">
                        {/* Character Image */}
                        <div className="flex-shrink-0">
                            <motion.div
                                className="relative group cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                                onClick={() => setSelectedCharacterId(currentHeroCharacter.id)}
                            >
                                <img 
                                    src={currentHeroCharacter.image}
                                    alt={currentHeroCharacter.name}
                                    className="w-48 h-48 lg:w-64 lg:h-64 rounded-2xl object-cover border-4 border-white/30 shadow-2xl"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute top-4 right-4 w-8 h-8 bg-green-400 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                                    <span className="text-sm font-bold text-white">★</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Character Info */}
                        <div className="flex-1 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                                    {currentHeroCharacter.fullName || currentHeroCharacter.name}
                                </h1>
                                <p className="text-xl text-purple-200 mb-4">
                                    {currentHeroCharacter.role || currentHeroCharacter.title || 'Main Character'}
                                </p>
                                
                                <blockquote className="text-lg text-white/90 italic mb-6 max-w-2xl">
                                    "{currentHeroCharacter.quote}"
                                </blockquote>

                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
                                    {currentHeroCharacter.age && (
                                        <span className="px-4 py-2 bg-white/20 rounded-full text-white">
                                            Age {currentHeroCharacter.age}
                                        </span>
                                    )}
                                    <span className="px-4 py-2 bg-purple-400/30 text-purple-100 border border-purple-300/30 rounded-full font-medium">
                                        {currentHeroCharacter.importance || 'Primary'}
                                    </span>
                                    {currentHeroCharacter.species && (
                                        <span className="px-4 py-2 bg-white/20 rounded-full text-white">
                                            {currentHeroCharacter.species}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-4">
                                    <button
                                        onClick={() => setSelectedCharacterId(currentHeroCharacter.id)}
                                        className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-colors shadow-lg"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={handleCreateCharacter}
                                        className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors border border-white/30"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add Character
                                    </button>
                                </div>

                                {/* Character Navigation Dots */}
                                {primaryCharacters.length > 1 && (
                                    <div className="flex justify-center lg:justify-start gap-2">
                                        {primaryCharacters.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentHeroIndex(index)}
                                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                                    index === currentHeroIndex 
                                                        ? 'bg-white scale-125' 
                                                        : 'bg-white/40 hover:bg-white/60'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Characters Header for when no primary characters */}
            {primaryCharacters.length === 0 && (
                <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 dark:from-purple-800 dark:via-blue-800 dark:to-indigo-900 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-32 translate-y-32"></div>
                    </div>
                    
                    <div className="relative z-10 text-center">
                        <h2 className="text-4xl font-bold text-white mb-3">Characters</h2>
                        <p className="text-purple-200 text-lg mb-6">
                            Meet the cast of your story
                        </p>
                        <button
                            onClick={handleCreateCharacter}
                            className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors border border-white/30 mx-auto"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Create First Character
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCharacterGrid = () => (
        <div className="space-y-8">
            {/* Secondary & Tertiary Characters (Combined) */}
            {secondaryCharacters.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Supporting Characters</h3>
                        <button
                            onClick={handleCreateCharacter}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Character
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {secondaryCharacters.map((character) => (
                            <motion.div
                                key={character.id}
                                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02, y: -8 }}
                                transition={{ duration: 0.3 }}
                                onClick={() => setSelectedCharacterId(character.id)}
                            >
                                {/* Character Image */}
                                <div className="relative overflow-hidden aspect-[3/4]">
                                    <img 
                                        src={character.image}
                                        alt={character.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-60"></div>
                                    
                                    {/* Importance Badge */}
                                    <div className={`absolute top-3 right-3 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${
                                        character.importance === 'Secondary' ? 'bg-blue-500' : 'bg-yellow-500'
                                    }`}>
                                        <span className="text-xs font-bold text-white">
                                            {character.importance === 'Secondary' ? '2' : '3'}
                                        </span>
                                    </div>

                                    {/* Character Name Overlay */}
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h4 className="text-white font-bold text-lg line-clamp-1 mb-1">
                                            {character.fullName || character.name}
                                        </h4>
                                        <p className="text-white/80 text-sm line-clamp-1">
                                            {character.role || character.title}
                                        </p>
                                    </div>
                                </div>

                                {/* Character Details */}
                                <div className="p-4">
                                    <div className="mb-3">
                                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 italic">
                                            "{character.quote}"
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            character.importance === 'Secondary' 
                                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                                                : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                                        }`}>
                                            {character.importance || 'Secondary'}
                                        </span>
                                        {character.age && (
                                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                                                Age {character.age}
                                            </span>
                                        )}
                                    </div>

                                    {/* Additional Character Info */}
                                    {(character.species || character.title) && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {character.species && (
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                                    {character.species}
                                                </span>
                                            )}
                                            {character.title && character.title !== character.role && (
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                                    {character.title}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredCharacters.length === 0 && (
                <motion.div 
                    className="text-center py-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-8xl mb-6 opacity-50">👥</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Characters Found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        {searchQuery ? `No characters match "${searchQuery}"` : 'Start building your cast of characters and bring your story to life'}
                    </p>
                    <button
                        onClick={handleCreateCharacter}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create First Character
                    </button>
                </motion.div>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex-1 overflow-auto p-6">
                {renderHeroSection()}
                {renderCharacterGrid()}
            </div>
        </div>
    );
};

export default CharacterPage;
