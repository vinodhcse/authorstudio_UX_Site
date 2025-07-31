import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Book, Version, Theme, Character } from '../../../../types';
import CharacterDetailsView from '../../../../components/CharacterDetailsView';
import { PlusIcon } from '../../../../constants';

interface CharacterPageProps {
    book: Book;
    version: Version;
    theme: Theme;
    searchQuery?: string;
}

const CharacterPage: React.FC<CharacterPageProps> = ({ 
    book,
    version,
    theme, 
    searchQuery = ''
}) => {
    const navigate = useNavigate();
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

    // Find the selected character from the book's characters
    const selectedCharacter = selectedCharacterId 
        ? book.characters?.find(c => c.id === selectedCharacterId)
        : null;
    
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

    // Filter characters based on search query
    const filteredCharacters = book.characters?.filter(char => 
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (char.fullName && char.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (char.role && char.role.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    // Group characters by importance
    const primaryCharacters = filteredCharacters.filter(char => char.importance === 'Primary');
    const secondaryCharacters = filteredCharacters.filter(char => char.importance === 'Secondary');
    const otherCharacters = filteredCharacters.filter(char => char.importance !== 'Primary' && char.importance !== 'Secondary');

    const renderHeroSection = () => (
        <div className="mb-8">
            <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 dark:from-purple-800 dark:via-blue-800 dark:to-indigo-900 rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-32 translate-y-32"></div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-4xl font-bold text-white mb-3">Characters</h2>
                            <p className="text-purple-200 text-lg">
                                Meet the cast of your story
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/tools/character-profile-builder')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Character
                            </button>
                        </div>
                    </div>
                    
                    {/* Primary Characters Slideshow */}
                    {primaryCharacters.length > 0 && (
                        <>
                            <h3 className="text-2xl font-semibold text-white mb-4">Main Characters</h3>
                            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                                {primaryCharacters.map((character, index) => (
                                    <motion.div
                                        key={character.id}
                                        className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-6 cursor-pointer min-w-[320px] border border-white/20"
                                        whileHover={{ scale: 1.02, y: -5 }}
                                        onClick={() => setSelectedCharacterId(character.id)}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="relative">
                                                <img 
                                                    src={character.image}
                                                    alt={character.name}
                                                    className="w-16 h-16 rounded-xl object-cover border-2 border-white/30"
                                                />
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                                                    <span className="text-xs font-bold text-white">
                                                        {character.importance === 'Primary' ? '1' : character.importance === 'Secondary' ? '2' : '3'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xl font-semibold text-white mb-1">
                                                    {character.fullName || character.name}
                                                </h4>
                                                <p className="text-purple-200 text-sm">
                                                    {character.role || character.title}
                                                </p>
                                            </div>
                                        </div>
                                        <blockquote className="text-white/90 text-sm italic mb-3 line-clamp-2">
                                            "{character.quote}"
                                        </blockquote>
                                        <div className="flex items-center justify-between">
                                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                                character.importance === 'Primary' 
                                                    ? 'bg-purple-400/30 text-purple-100 border border-purple-300/30'
                                                    : character.importance === 'Secondary'
                                                    ? 'bg-blue-400/30 text-blue-100 border border-blue-300/30'
                                                    : 'bg-gray-400/30 text-gray-100 border border-gray-300/30'
                                            }`}>
                                                {character.importance || 'Primary'}
                                            </span>
                                            {character.age && (
                                                <span className="text-purple-200 text-sm">
                                                    Age {character.age}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const renderCharacterGrid = () => (
        <div className="space-y-8">
            {/* Secondary Characters */}
            {secondaryCharacters.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Supporting Characters</h3>
                        <button
                            onClick={() => navigate('/tools/character-profile-builder')}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Character
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {secondaryCharacters.map((character, index) => (
                            <motion.div
                                key={character.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 dark:border-gray-700 cursor-pointer group relative overflow-hidden"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02, y: -5 }}
                                onClick={() => setSelectedCharacterId(character.id)}
                            >
                                {/* Background Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative">
                                            <img 
                                                src={character.image}
                                                alt={character.name}
                                                className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:border-purple-300 dark:group-hover:border-purple-500 transition-colors"
                                            />
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">2</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                {character.fullName || character.name}
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                {character.role || character.title}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                                        {character.quote}
                                    </p>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                                            {character.importance || 'Secondary'}
                                        </span>
                                        {character.age && (
                                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                                Age {character.age}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Other Characters */}
            {otherCharacters.length > 0 && (
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Other Characters</h3>
                    <div className="space-y-3">
                        {otherCharacters.map((character, index) => (
                            <motion.div
                                key={character.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-600 cursor-pointer"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => setSelectedCharacterId(character.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={character.image}
                                            alt={character.name}
                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                        />
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                {character.fullName || character.name}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {character.role || character.title}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                                            {character.importance || 'Minor'}
                                        </span>
                                        {character.age && (
                                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                                Age {character.age}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredCharacters.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Characters Found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchQuery ? `No characters match "${searchQuery}"` : 'Start building your cast of characters'}
                    </p>
                    <button
                        onClick={() => navigate('/tools/character-profile-builder')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create First Character
                    </button>
                </div>
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
