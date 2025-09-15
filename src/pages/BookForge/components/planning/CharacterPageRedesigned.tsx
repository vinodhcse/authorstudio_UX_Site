import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Theme } from '../../../../types';
import CharacterDetailsView from '../../../../components/CharacterDetailsView';
import { PlusIcon } from '../../../../constants';
import { useBookContext, useCurrentBookAndVersion } from '../../../../contexts/BookContext';

interface CharacterPageProps {
    theme: Theme;
    searchQuery?: string;
}

// CharacterCard component similar to BookCard with hover animations
const CharacterCard: React.FC<{
    character: any;
    size: 'small' | 'medium' | 'large';
    onClick: () => void;
}> = ({ character, size, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-150, 150], [5, -5]);
    const rotateY = useTransform(x, [-150, 150], [-15, 15]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    // Size configurations
    const sizeConfig = {
        small: {
            containerClass: 'h-48',
            imageSize: isHovered ? 'w-full h-20' : 'w-16 h-20',
            titleSize: 'text-sm',
            roleSize: 'text-xs',
            expandedHeight: 'h-auto',
            showDetails: false
        },
        medium: {
            containerClass: 'h-64',
            imageSize: isHovered ? 'w-full h-32' : 'w-20 h-24',
            titleSize: 'text-base',
            roleSize: 'text-sm',
            expandedHeight: 'h-auto',
            showDetails: true
        },
        large: {
            containerClass: 'h-80',
            imageSize: isHovered ? 'w-full h-40' : 'w-24 h-32',
            titleSize: 'text-lg',
            roleSize: 'text-sm',
            expandedHeight: 'h-auto',
            showDetails: true
        }
    };

    const config = sizeConfig[size];

    const getBadgeColor = () => {
        switch (character.importance) {
            case 'Primary':
                return 'bg-yellow-500';
            case 'Secondary':
                return 'bg-blue-500';
            case 'Tertiary':
                return 'bg-green-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getBadgeIcon = () => {
        switch (character.importance) {
            case 'Primary':
                return '★';
            case 'Secondary':
                return '2';
            case 'Tertiary':
                return '3';
            default:
                return '?';
        }
    };

    return (
        <motion.div
            variants={cardVariants}
            className="group cursor-pointer relative h-full"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => {
                setIsHovered(false);
                x.set(0);
                y.set(0);
            }}
            onMouseMove={handleMouseMove}
            style={{ perspective: 1000 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            onClick={onClick}
        >
            <motion.div
                layout
                transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                className={`relative rounded-2xl ${config.containerClass} shadow-lg`}
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            >
                {/* Gradient blob background */}
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-border-blob-spin blur-xl z-0"></div>
                
                <div className="relative bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl p-4 h-full flex flex-col justify-between border border-transparent z-10">
                    
                    <motion.div layout="position" className={`flex gap-4 ${isHovered ? 'flex-col' : size === 'small' ? 'flex-row items-center' : 'flex-row items-start'}`}>
                        {/* Character Image */}
                        <motion.div layout className={`relative rounded-lg overflow-hidden flex-shrink-0 ${config.imageSize}`}>
                            <img 
                                src={character.image} 
                                alt={character.name}
                                className="absolute w-full h-full object-cover"
                            />
                            {/* Importance Badge */}
                            <div className={`absolute top-2 right-2 w-6 h-6 ${getBadgeColor()} rounded-full border-2 border-white flex items-center justify-center shadow-lg`}>
                                <span className="text-xs font-bold text-white">
                                    {getBadgeIcon()}
                                </span>
                            </div>
                        </motion.div>

                        {/* Character Details */}
                        <motion.div layout="position" className="flex flex-col flex-grow min-w-0">
                            <h3 className={`font-bold text-gray-800 dark:text-white truncate ${config.titleSize}`}>
                                {character.fullName || character.name}
                            </h3>
                            <p className={`text-gray-500 dark:text-gray-400 truncate ${config.roleSize}`}>
                                {character.role || character.title}
                            </p>
                            {size !== 'small' && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic line-clamp-2">
                                    "{character.quote}"
                                </p>
                            )}
                        </motion.div>
                    </motion.div>

                    {/* Bottom section with importance and expandable details */}
                    <motion.div layout className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                        <div className="flex justify-between items-center text-sm">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                character.importance === 'Primary' 
                                    ? 'text-yellow-800 dark:text-yellow-200 bg-yellow-500/20 dark:bg-yellow-900/50'
                                    : character.importance === 'Secondary'
                                    ? 'text-blue-800 dark:text-blue-200 bg-blue-500/20 dark:bg-blue-900/50'
                                    : 'text-green-800 dark:text-green-200 bg-green-500/20 dark:bg-green-900/50'
                            }`}>
                                {character.importance}
                            </span>
                            {character.age && (
                                <span className="text-gray-500 dark:text-gray-400 text-xs">
                                    Age {character.age}
                                </span>
                            )}
                        </div>

                        {/* Expanded details on hover */}
                        <AnimatePresence>
                            {isHovered && config.showDetails && (
                                <motion.div
                                    className="overflow-hidden"
                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                    animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Species</p>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{character.species || 'Human'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Height</p>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{character.height || 'Unknown'}</p>
                                        </div>
                                        {character.primarySkills && (
                                            <div className="col-span-2">
                                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Skills</p>
                                                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                                                    {character.primarySkills.slice(0, 2).join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Hero section component similar to FeaturedBook
const HeroSection: React.FC<{
    primaryCharacters: any[];
    onCharacterSelect: (id: string) => void;
    onCreateCharacter: () => void;
}> = ({ primaryCharacters, onCharacterSelect, onCreateCharacter }) => {
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

    // Auto-rotate through primary characters every 6 seconds
    useEffect(() => {
        if (primaryCharacters.length > 1) {
            const interval = setInterval(() => {
                setCurrentHeroIndex((prev) => (prev + 1) % primaryCharacters.length);
            }, 6000);
            return () => clearInterval(interval);
        }
    }, [primaryCharacters.length]);

    // Reset hero index when primary characters change
    useEffect(() => {
        if (currentHeroIndex >= primaryCharacters.length) {
            setCurrentHeroIndex(0);
        }
    }, [primaryCharacters.length, currentHeroIndex]);

    const currentHero = primaryCharacters[currentHeroIndex];

    if (primaryCharacters.length === 0) {
        return (
            <div className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Characters</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                        Meet the cast of your story
                    </p>
                    <button
                        onClick={onCreateCharacter}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors shadow-lg"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Create First Character
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            key={currentHero.id}
            className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-3xl shadow-2xl overflow-hidden mb-8 border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
        >
            <div className="flex flex-col lg:flex-row">
                {/* Character Image */}
                <div className="lg:w-1/3 relative">
                    <img
                        src={currentHero.image}
                        alt={currentHero.name}
                        className="w-full h-64 lg:h-80 object-cover"
                    />
                    <div className="absolute top-4 right-4 w-12 h-12 bg-yellow-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">★</span>
                    </div>
                </div>

                {/* Character Info */}
                <div className="lg:w-2/3 p-8 flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            {currentHero.fullName || currentHero.name}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                            {currentHero.role || currentHero.title || 'Main Character'}
                        </p>
                        
                        <blockquote className="text-lg text-gray-700 dark:text-gray-300 italic mb-6 max-w-2xl">
                            "{currentHero.quote}"
                        </blockquote>

                        <div className="flex flex-wrap gap-4 mb-6">
                            {currentHero.age && (
                                <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                                    Age {currentHero.age}
                                </span>
                            )}
                            <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                                {currentHero.importance}
                            </span>
                            {currentHero.species && (
                                <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                                    {currentHero.species}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3 mb-6">
                            <button
                                onClick={() => onCharacterSelect(currentHero.id)}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
                            >
                                View Details
                            </button>
                            <button
                                onClick={onCreateCharacter}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Character
                            </button>
                        </div>

                        {/* Character Navigation Dots */}
                        {primaryCharacters.length > 1 && (
                            <div className="flex gap-2">
                                {primaryCharacters.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentHeroIndex(index)}
                                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                            index === currentHeroIndex 
                                                ? 'bg-purple-600 scale-125' 
                                                : 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-500'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

const CharacterPage: React.FC<CharacterPageProps> = ({ 
    theme, 
    searchQuery = ''
}) => {
    const navigate = useNavigate();
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    
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

    // Group characters by importance
    const primaryCharacters = filteredCharacters.filter(char => char.importance === 'Primary');
    const secondaryCharacters = filteredCharacters.filter(char => char.importance === 'Secondary');
    const tertiaryCharacters = filteredCharacters.filter(char => char.importance === 'Tertiary');
    
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

    const gridVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex-1 overflow-auto p-6">
                {/* Hero Section */}
                <HeroSection 
                    primaryCharacters={primaryCharacters}
                    onCharacterSelect={setSelectedCharacterId}
                    onCreateCharacter={handleCreateCharacter}
                />

                {/* Primary Characters Grid */}
                {primaryCharacters.length > 1 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Primary Characters</h3>
                            <button
                                onClick={handleCreateCharacter}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Character
                            </button>
                        </div>
                        <motion.div 
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                            variants={gridVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {primaryCharacters.slice(1).map((character) => (
                                <CharacterCard
                                    key={character.id}
                                    character={character}
                                    size="large"
                                    onClick={() => setSelectedCharacterId(character.id)}
                                />
                            ))}
                        </motion.div>
                    </div>
                )}

                {/* Secondary Characters */}
                {secondaryCharacters.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Secondary Characters</h3>
                        </div>
                        <motion.div 
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                            variants={gridVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {secondaryCharacters.map((character) => (
                                <CharacterCard
                                    key={character.id}
                                    character={character}
                                    size="medium"
                                    onClick={() => setSelectedCharacterId(character.id)}
                                />
                            ))}
                        </motion.div>
                    </div>
                )}

                {/* Tertiary/Supporting Characters */}
                {tertiaryCharacters.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Supporting Characters</h3>
                        </div>
                        <motion.div 
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
                            variants={gridVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {tertiaryCharacters.map((character) => (
                                <CharacterCard
                                    key={character.id}
                                    character={character}
                                    size="small"
                                    onClick={() => setSelectedCharacterId(character.id)}
                                />
                            ))}
                        </motion.div>
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
        </div>
    );
};

export default CharacterPage;
