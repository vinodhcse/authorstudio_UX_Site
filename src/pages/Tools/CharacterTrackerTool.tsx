import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ToolWindowControls from '../../components/ToolWindowControls';

interface BookContext {
  bookId: string;
  versionId: string;
  toolName: string;
}

interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  traits: string[];
}

const CharacterTrackerTool: React.FC = () => {
  const [context, setContext] = useState<BookContext | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    role: '',
    description: '',
    traits: '',
  });

  useEffect(() => {
    // Get context from window object (injected by Tauri)
    console.log('CharacterTrackerTool: Checking for context...');
    console.log('__BOOK_CONTEXT__:', (window as any).__BOOK_CONTEXT__);
    
    const bookContext = (window as any).__BOOK_CONTEXT__;
    if (bookContext) {
      console.log('CharacterTrackerTool: Context found:', bookContext);
      setContext(bookContext);
    } else {
      console.log('CharacterTrackerTool: No context found, retrying in 100ms...');
      // Retry after a short delay in case the context hasn't been injected yet
      setTimeout(() => {
        const retryContext = (window as any).__BOOK_CONTEXT__;
        if (retryContext) {
          console.log('CharacterTrackerTool: Context found on retry:', retryContext);
          setContext(retryContext);
        } else {
          console.log('CharacterTrackerTool: Still no context found');
        }
      }, 100);
    }

    // Load sample characters
    setCharacters([
      {
        id: '1',
        name: 'Elena Stark',
        role: 'Protagonist',
        description: 'A brave knight seeking to restore honor to her family name.',
        traits: ['Brave', 'Determined', 'Loyal', 'Hot-tempered'],
      },
      {
        id: '2',
        name: 'Marcus Blackwood',
        role: 'Antagonist',
        description: 'A cunning politician who will stop at nothing to gain power.',
        traits: ['Manipulative', 'Intelligent', 'Ruthless', 'Charismatic'],
      },
    ]);
  }, []);

  const addCharacter = () => {
    if (newCharacter.name && newCharacter.role) {
      const character: Character = {
        id: Date.now().toString(),
        name: newCharacter.name,
        role: newCharacter.role,
        description: newCharacter.description,
        traits: newCharacter.traits.split(',').map(t => t.trim()).filter(t => t),
      };
      setCharacters([...characters, character]);
      setNewCharacter({ name: '', role: '', description: '', traits: '' });
    }
  };

  const deleteCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Window Controls */}
      <ToolWindowControls 
        bookId={context?.bookId}
        versionId={context?.versionId}
        toolName={context?.toolName}
      />
      
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl">
              🎭
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Character Tracker</h1>
              {context && (
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Book: {context.bookId} • Version: {context.versionId}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Characters ({characters.length})
            </h2>
            <div className="space-y-3">
              {characters.map((character) => (
                <motion.div
                  key={character.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedCharacter(character)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCharacter?.id === character.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {character.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {character.role}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCharacter(character.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Add Character Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Add Character
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newCharacter.name}
                  onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Character name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={newCharacter.role}
                  onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select role</option>
                  <option value="Protagonist">Protagonist</option>
                  <option value="Antagonist">Antagonist</option>
                  <option value="Supporting">Supporting</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newCharacter.description}
                  onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Character description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Traits (comma separated)
                </label>
                <input
                  type="text"
                  value={newCharacter.traits}
                  onChange={(e) => setNewCharacter({ ...newCharacter, traits: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Brave, Loyal, Cunning"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addCharacter}
                disabled={!newCharacter.name || !newCharacter.role}
                className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Add Character
              </motion.button>
            </div>
          </motion.div>

          {/* Character Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Character Details
            </h2>
            {selectedCharacter ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedCharacter.name}
                  </h3>
                  <span className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    {selectedCharacter.role}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedCharacter.description || 'No description provided.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Traits</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCharacter.traits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Select a character to view details
              </p>
            )}
          </motion.div>
        </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CharacterTrackerTool;
