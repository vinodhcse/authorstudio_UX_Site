import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, UserIcon, BookOpenIcon, HeartIcon } from '@heroicons/react/24/outline';

interface CharacterPopupProps {
  isVisible: boolean;
  characterId: string;
  nodeId: string;
  onClose: () => void;
  position?: { x: number; y: number };
}

// Mock character data - replace with actual data from your context
const getMockCharacterData = (characterId: string) => ({
  id: characterId,
  name: `Character ${characterId.slice(-1)}`,
  role: characterId.includes('1') ? 'protagonist' : 
        characterId.includes('2') ? 'deuteragonist' :
        characterId.includes('3') ? 'antagonist' : 'supporting',
  description: `A compelling character with a rich backstory and complex motivations that drive the narrative forward.`,
  background: `Born in a small village, this character has overcome numerous challenges to become who they are today.`,
  personality: ['Brave', 'Compassionate', 'Determined', 'Sometimes reckless'],
  goals: ['Protect their loved ones', 'Uncover the truth', 'Master their abilities'],
  relationships: [
    { name: 'Character 2', relationship: 'Close friend and ally' },
    { name: 'Character 3', relationship: 'Former mentor, now rival' }
  ],
  arcs: [
    { nodeTitle: 'Chapter 1: The Beginning', contribution: 'Introduces their world and motivations' },
    { nodeTitle: 'Chapter 2: The Challenge', contribution: 'Faces their first major obstacle' },
    { nodeTitle: 'Chapter 3: Growth', contribution: 'Learns important lesson about trust' }
  ]
});

export const CharacterPopup: React.FC<CharacterPopupProps> = ({
  isVisible,
  characterId,
  nodeId,
  onClose,
  position = { x: 0, y: 0 }
}) => {
  const character = getMockCharacterData(characterId);

  if (!isVisible) return null;

  const roleColors = {
    protagonist: 'from-blue-500 to-purple-600',
    deuteragonist: 'from-green-500 to-blue-500',
    antagonist: 'from-red-500 to-orange-600',
    supporting: 'from-gray-500 to-slate-600'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${roleColors[character.role as keyof typeof roleColors]} p-6 rounded-t-2xl text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {character.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{character.name}</h2>
                  <p className="text-white/90 capitalize">{character.role}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">About</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {character.description}
              </p>
            </div>

            {/* Background */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Background</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {character.background}
              </p>
            </div>

            {/* Personality Traits */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HeartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personality</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {character.personality.map((trait, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Goals</h4>
              <ul className="space-y-1">
                {character.goals.map((goal, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>

            {/* Relationships */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Relationships</h4>
              <div className="space-y-2">
                {character.relationships.map((rel, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{rel.name}</span>
                    <span className="text-gray-600 dark:text-gray-400">{rel.relationship}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Story Contribution */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpenIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Story Arc</h3>
              </div>
              <div className="space-y-3">
                {character.arcs.map((arc, index) => (
                  <div key={index} className="border-l-2 border-blue-500 pl-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {arc.nodeTitle}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {arc.contribution}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Node Context */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">In This Node</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This character plays a crucial role in the current narrative node, 
                contributing to the scene's dynamics and story progression.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Edit Character
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
