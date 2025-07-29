
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SparklesIcon, GitCommitIcon, ListIcon, FilePlusIcon, Wand2Icon, TextQuoteIcon } from '../../../constants';
import { Theme } from '../../../types';

interface FloatingActionButtonProps {
    theme?: Theme;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ theme = 'dark' }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Theme-aware contrasting colors (similar to DockSidebar approach)
    const isDarkTheme = theme === 'dark';
    const buttonTheme = {
        // Use contrasting colors - opposite of current theme
        background: isDarkTheme 
            ? 'bg-white/90 hover:bg-gray-50/90' 
            : 'bg-gray-800/90 hover:bg-gray-700/90',
        text: isDarkTheme ? 'text-gray-900' : 'text-white',
        tooltip: isDarkTheme 
            ? 'bg-gray-800/90 text-white' 
            : 'bg-white/90 text-gray-900',
        shadow: isDarkTheme ? 'shadow-lg shadow-black/20' : 'shadow-lg shadow-gray-500/20'
    };
    
    const menuItems = [
        { icon: SparklesIcon, label: 'AI Assistant', angle: -90 },
        { icon: ListIcon, label: 'Add Glossary', angle: -60 },
        { icon: FilePlusIcon, label: 'Import Scene', angle: -30 },
        { icon: GitCommitIcon, label: 'Track Revisions', angle: 0 },
    ];

    const containerVariants = {
        open: {
            transition: {
                staggerChildren: 0.07,
                delayChildren: 0.2,
            }
        },
        closed: {
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        open: (angle: number) => ({
            y: [0, -70],
            rotate: [0, angle],
            opacity: 1,
            transition: {
                y: { stiffness: 1000, velocity: -100 },
                rotate: { stiffness: 1000 }
            }
        }),
        closed: () => ({
            y: -0,
            rotate: 0,
            opacity: 0,
            transition: {
                y: { stiffness: 1000 },
                rotate: { stiffness: 1000 }
            }
        })
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <motion.div 
                className="relative"
                initial="closed"
                animate={isOpen ? "open" : "closed"}
            >
                <AnimatePresence>
                {isOpen && (
                     <motion.ul 
                        variants={containerVariants}
                        className="absolute bottom-0 right-0"
                     >
                        {menuItems.map(item => (
                            <motion.li
                                key={item.label}
                                custom={item.angle}
                                variants={itemVariants}
                                className="absolute bottom-0 right-0"
                                whileHover={{ scale: 1.1 }}
                            >
                                <div className="group relative">
                                    <button className={`w-12 h-12 ${buttonTheme.background} ${buttonTheme.text} rounded-full flex items-center justify-center ${buttonTheme.shadow} transition-all duration-200`}>
                                        <item.icon className="w-6 h-6" />
                                    </button>
                                     <span className={`absolute bottom-1/2 translate-y-1/2 right-14 whitespace-nowrap ${buttonTheme.tooltip} text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg`}>
                                        {item.label}
                                    </span>
                                </div>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
                </AnimatePresence>
                <motion.button
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                    onClick={() => setIsOpen(!isOpen)}
                    whileTap={{ scale: 0.9 }}
                >
                    <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
                        <PlusIcon className="w-8 h-8"/>
                    </motion.div>
                </motion.button>
            </motion.div>
        </div>
    );
};

export default FloatingActionButton;
