import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeViewWrapper } from '@tiptap/react';
import { CharacterImpersonationData, CharacterMessage } from '../../types/custom-nodes';
import { 
  TheaterIcon, 
  RefreshIcon, 
  ArrowRightIcon,
  TrashIcon
} from '../../constants';

interface CharacterImpersonationNodeProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
}

const CharacterImpersonationNode: React.FC<CharacterImpersonationNodeProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode 
}) => {
  const data: CharacterImpersonationData = node.attrs;
  const [isExpanded, setIsExpanded] = useState(data.isExpanded || false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(data.activeCharacter);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock character database - in real app, this would come from props
  const availableCharacters = data.availableCharacters.length > 0 
    ? data.availableCharacters 
    : ['Nemar', 'Attican', 'Elissa', 'Ferris', 'Garius'];

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [data.conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle expansion
  const toggleExpansion = (e?: React.MouseEvent) => {
    // Prevent text selection when clicking to expand/collapse
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    updateAttributes({ ...data, isExpanded: newExpanded });
  };

  // Add user message
  const addUserMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: CharacterMessage = {
      id: Date.now().toString(),
      character: selectedCharacter,
      message: currentMessage,
      isAI: false,
      timestamp: new Date().toISOString()
    };

    const updatedConversation = [...data.conversation, newMessage];
    updateAttributes({
      ...data,
      conversation: updatedConversation,
      activeCharacter: selectedCharacter
    });

    setCurrentMessage('');
  };

  // Generate AI response (mock implementation)
  const generateAIResponse = async (targetCharacter: string) => {
    setIsGenerating(true);
    
    // Mock AI delay
    setTimeout(() => {
      const aiResponses = {
        Nemar: "As a master blacksmith, I've seen fire bend to many wills, but yours... yours is different, young one.",
        Attican: "The flames whisper secrets that even I, in all my years, have yet to fully understand.",
        Elissa: "Power without wisdom is destruction. Remember that when the fire calls to you.",
        Ferris: "Ha! Another fire-wielder? Well, let's see if you can keep up with the rest of us.",
        Garius: "The old ways are not forgotten, and neither should be the lessons they teach."
      };

      const aiMessage: CharacterMessage = {
        id: Date.now().toString(),
        character: targetCharacter,
        message: aiResponses[targetCharacter as keyof typeof aiResponses] || `${targetCharacter} responds thoughtfully to your words.`,
        isAI: true,
        timestamp: new Date().toISOString()
      };

      const updatedConversation = [...data.conversation, aiMessage];
      updateAttributes({
        ...data,
        conversation: updatedConversation
      });

      setIsGenerating(false);
    }, 2000);
  };

  // Handle @ character selection
  const handleAtMention = (character: string) => {
    generateAIResponse(character);
    setShowCharacterPicker(false);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addUserMessage();
    }
    
    // Show character picker on @ symbol
    if (e.key === '@') {
      setShowCharacterPicker(true);
    }
  };

  // Clear conversation
  const clearConversation = () => {
    updateAttributes({
      ...data,
      conversation: []
    });
  };

  // Get character avatar (mock implementation)
  const getCharacterAvatar = (character: string) => {
    const avatars: Record<string, string> = {
      Nemar: '👨‍🔧',
      Attican: '🧙‍♂️',
      Elissa: '👩‍🎓',
      Ferris: '⚔️',
      Garius: '🛡️'
    };
    return avatars[character] || '👤';
  };

  // Get preview of last messages
  const getPreview = () => {
    if (data.conversation.length === 0) return 'No conversation yet';
    const lastMessage = data.conversation[data.conversation.length - 1];
    const truncated = lastMessage.message.length > 40 
      ? lastMessage.message.substring(0, 40) + '...' 
      : lastMessage.message;
    return `${lastMessage.character}: ${truncated}`;
  };

  return (
    <NodeViewWrapper>
      <motion.div
        className="character-impersonation-node my-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      {/* Collapsed Header */}
      <div 
        className="node-header flex items-center justify-between p-4 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-t-2xl"
        onClick={toggleExpansion}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <TheaterIcon className="w-4 h-4 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                🎭 Character Impersonation
              </span>
              <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full">
                As {data.activeCharacter}
              </span>
            </div>
            
            {!isExpanded && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {getPreview()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            {data.conversation.length} messages
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            ▶
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-4">
              {/* Character Selection */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">You are:</span>
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {availableCharacters.map((char) => (
                    <option key={char} value={char}>
                      {getCharacterAvatar(char)} {char}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conversation Display */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 max-h-80 overflow-y-auto">
                {data.conversation.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <TheaterIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm">Start a conversation with your characters</p>
                    <p className="text-xs mt-1">Type @ followed by a character name to get an AI response</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {data.conversation.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.isAI ? 'justify-start' : 'justify-start'}`}
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            message.isAI 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          }`}>
                            {getCharacterAvatar(message.character)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {message.character}
                            </span>
                            {message.isAI && (
                              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                                AI
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className={`mt-1 p-3 rounded-lg ${
                            message.isAI 
                              ? 'bg-white dark:bg-gray-600 border border-blue-200 dark:border-blue-700' 
                              : 'bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
                          }`}>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {message.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isGenerating && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                      >
                        <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                        AI is thinking...
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Write as ${selectedCharacter}... Type @ to mention another character`}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-200 resize-none"
                  rows={3}
                />
                
                <button
                  onClick={addUserMessage}
                  disabled={!currentMessage.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </button>

                {/* Character Picker Popup */}
                <AnimatePresence>
                  {showCharacterPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 z-10"
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 px-2">Select character to respond:</div>
                      {availableCharacters.filter(char => char !== selectedCharacter).map((char) => (
                        <button
                          key={char}
                          onClick={() => handleAtMention(char)}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm"
                        >
                          <span>{getCharacterAvatar(char)}</span>
                          <span>{char}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <motion.button
                    onClick={clearConversation}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshIcon className="w-4 h-4" />
                    Clear Chat
                  </motion.button>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    onClick={deleteNode}
                    className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 rounded-lg text-sm transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Section
                  </motion.button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">How to use:</p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Choose which character you're impersonating from the dropdown</li>
                  <li>• Type dialogue and press Enter to add your message</li>
                  <li>• Type @ followed by another character name to get an AI response</li>
                  <li>• The AI will respond in that character's voice and personality</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </NodeViewWrapper>
  );
};

export default CharacterImpersonationNode;
