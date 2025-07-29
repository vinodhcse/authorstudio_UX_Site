import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ToolWindowControls from '../../components/ToolWindowControls';

interface BookContext {
  bookId: string;
  versionId: string;
  toolName: string;
}

const NameGeneratorTool: React.FC = () => {
  const [context, setContext] = useState<BookContext | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  useEffect(() => {
    // Get context from window object (injected by Tauri)
    console.log('NameGeneratorTool: Checking for context...');
    console.log('Window object keys:', Object.keys(window));
    console.log('__BOOK_CONTEXT__:', (window as any).__BOOK_CONTEXT__);
    
    const bookContext = (window as any).__BOOK_CONTEXT__;
    if (bookContext) {
      console.log('NameGeneratorTool: Context found:', bookContext);
      setContext(bookContext);
    } else {
      console.log('NameGeneratorTool: No context found, retrying in 100ms...');
      // Retry after a short delay in case the context hasn't been injected yet
      setTimeout(() => {
        const retryContext = (window as any).__BOOK_CONTEXT__;
        if (retryContext) {
          console.log('NameGeneratorTool: Context found on retry:', retryContext);
          setContext(retryContext);
        } else {
          console.log('NameGeneratorTool: Still no context found');
        }
      }, 100);
    }
  }, []);

  const firstNames = [
    'Aiden', 'Bella', 'Caleb', 'Diana', 'Ethan', 'Fiona', 'Gabriel', 'Hannah',
    'Isaac', 'Julia', 'Kyle', 'Luna', 'Mason', 'Nina', 'Owen', 'Penelope',
    'Quinn', 'Ruby', 'Sebastian', 'Tessa', 'Ulysses', 'Violet', 'William', 'Zara'
  ];

  const lastNames = [
    'Anderson', 'Brooks', 'Carter', 'Davis', 'Evans', 'Fisher', 'Garcia', 'Harris',
    'Johnson', 'Kelly', 'Lewis', 'Miller', 'Nelson', 'Parker', 'Quinn', 'Roberts',
    'Smith', 'Taylor', 'Wilson', 'Young', 'Brown', 'Jones', 'Williams', 'Davis'
  ];

  const generateRandomName = () => {
    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${randomFirst} ${randomLast}`;
  };

  const generateNames = (count: number = 5) => {
    const names = [];
    for (let i = 0; i < count; i++) {
      names.push(generateRandomName());
    }
    setGeneratedNames(names);
  };

  const generateCustomName = () => {
    if (firstName && lastName) {
      const customName = `${firstName} ${lastName}`;
      setGeneratedNames([customName, ...generatedNames.slice(0, 4)]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
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
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl">
                👤
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Name Generator</h1>
                {context && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Book: {context.bookId} • Version: {context.versionId}
                  </p>
                )}
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custom Name Generator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Custom Name
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter last name"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateCustomName}
                disabled={!firstName || !lastName}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Add Custom Name
              </motion.button>
            </div>
          </motion.div>

          {/* Random Name Generator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Random Names
            </h2>
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => generateNames(5)}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200"
              >
                Generate 5 Random Names
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => generateNames(10)}
                className="w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200"
              >
                Generate 10 Random Names
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Generated Names */}
        {generatedNames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Generated Names
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {generatedNames.map((name, index) => (
                <motion.div
                  key={`${name}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-gray-900 dark:text-white font-medium">
                    {name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        </motion.div>
      </div>
    </div>
  );
};

export default NameGeneratorTool;
