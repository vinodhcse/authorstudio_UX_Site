import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Theme } from '../types';
import CharacterDetailsView from '../components/CharacterDetailsView';
import { useBookContext, useCurrentBookAndVersion } from '../contexts/BookContext';

interface CharacterDetailsPageProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const CharacterDetailsPage: React.FC<CharacterDetailsPageProps> = ({ theme, setTheme: _setTheme }) => {
    const { bookId, versionId, characterId } = useParams();
    const navigate = useNavigate();
    
    // Use BookContext to get character data
    const { getCharacter } = useBookContext();
    const { bookId: contextBookId, versionId: contextVersionId, currentBook } = useCurrentBookAndVersion();
    
    // Use the URL params if available, otherwise use context
    const finalBookId = bookId || contextBookId;
    const finalVersionId = versionId || contextVersionId;
    
    const character = characterId && finalBookId && finalVersionId 
        ? getCharacter(finalBookId, finalVersionId, characterId) 
        : null;

    const renderBreadcrumbs = () => (
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <button 
                onClick={() => navigate('/dashboard')}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
                Dashboard
            </button>
            <span>/</span>
            <button 
                onClick={() => navigate(`/book/${bookId}`)}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
                {currentBook?.title}
            </button>
            <span>/</span>
            <button 
                onClick={() => navigate(`/book/${bookId}/version/${versionId}/planning`)}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
                Planning
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
                {character?.name || 'Character Details'}
            </span>
        </nav>
    );

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
            <div className="container mx-auto px-6 py-8">
                {renderBreadcrumbs()}
                <CharacterDetailsView 
                    character={character || null}
                    theme={theme}
                    showBackButton={true}
                    onBack={() => navigate(`/book/${bookId}/version/${versionId}/planning`)}
                />
            </div>
        </div>
    );
};

export default CharacterDetailsPage;
