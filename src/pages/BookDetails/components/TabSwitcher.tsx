
import React from 'react';
import { motion } from 'framer-motion';
import { BookDetailsTab } from '../../../types';

interface TabSwitcherProps {
  tabs: BookDetailsTab[];
  activeTab: BookDetailsTab;
  setActiveTab: (tab: BookDetailsTab) => void;
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex justify-center my-8">
      <div className="flex items-center space-x-1 p-1 rounded-full bg-gray-200/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative px-4 py-2 text-sm font-medium rounded-full focus:outline-none transition-colors"
          >
            <span className={`relative z-10 ${activeTab === tab ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
              {tab}
            </span>
            {activeTab === tab && (
              <motion.div
                className="absolute inset-0 bg-white dark:bg-black rounded-full shadow-md"
                layoutId="activeDetailTabPill"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabSwitcher;