
import React from 'react';
import { motion } from 'framer-motion';

const ScrollMinimap: React.FC = () => {
    return (
        <div className="hidden lg:block w-32 h-full flex-shrink-0 bg-gray-100 dark:bg-gray-800/50 border-l border-gray-200 dark:border-gray-800 relative overflow-hidden">
            <div className="absolute inset-0 p-4 space-y-2">
                {/* Mock content representation */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="h-1 bg-gray-400 dark:bg-gray-600 rounded-full w-1/3"
                ></motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full w-full"
                ></motion.div>
                 <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full w-full"
                ></motion.div>

                {/* Mock marker for a comment or bookmark */}
                <motion.div 
                     initial={{ opacity: 0, scale: 0 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: 0.8 }}
                    className="absolute top-1/4 right-4 w-2 h-2 bg-purple-500 rounded-full"
                ></motion.div>
                
                {/* Mock marker for an AI conversation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                    className="absolute top-1/2 right-4 w-2 h-2 bg-sky-500 rounded-full"
                ></motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full w-4/5"
                ></motion.div>
                 <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                    className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full w-full"
                ></motion.div>
            </div>
            {/* Scrollbar Thumb simulation */}
            <div className="absolute top-[10%] left-2 right-2 h-1/4 bg-gray-400/50 dark:bg-gray-500/50 rounded-full"></div>
        </div>
    );
};

export default ScrollMinimap;
