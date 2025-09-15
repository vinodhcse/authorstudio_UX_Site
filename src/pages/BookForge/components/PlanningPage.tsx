import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Version, Theme } from '../../../types';
import PlotArcsBoard from './planning/PlotArcsBoard';
import WorldBuildingBoard from './planning/WorldBuildingBoard';
import CharacterPage from './planning/CharacterPage';

// Planning footer tab types
type PlanningTab = 'Plot Arcs' | 'World Building' | 'Characters';

interface PlanningPageProps {
    book: Book;
    version: Version;
    theme: Theme;
    activeTab?: PlanningTab;
    onTabChange?: (tab: PlanningTab) => void;
    searchQuery?: string;
}

const PlanningPage: React.FC<PlanningPageProps> = ({ 
    book, 
    version, 
    theme, 
    activeTab = 'Plot Arcs', 
    searchQuery = ''
}) => {
    // Mock auto-save functionality
    useEffect(() => {
        const interval = setInterval(() => {
            // Auto-save logic can be added here
        }, 30000); // Auto-save every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'Plot Arcs':
                return <PlotArcsBoard book={book} version={version} theme={theme} searchQuery={searchQuery} />;
            case 'World Building':
                return (
                    <WorldBuildingBoard 
                        book={book} 
                        version={version} 
                        theme={theme} 
                        searchQuery={searchQuery}
                    />
                );
            case 'Characters':
                return <CharacterPage theme={theme} searchQuery={searchQuery} />;
            default:
                return <PlotArcsBoard book={book} version={version} theme={theme} searchQuery={searchQuery} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Main Content Area */}
            <main className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                        {renderActiveTabContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default PlanningPage;
