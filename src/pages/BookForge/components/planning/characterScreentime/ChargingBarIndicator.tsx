import React from 'react';
import { motion } from 'framer-motion';

// Full Cell Gradient Charging Bar Component for Character Presence
const ChargingBarIndicator: React.FC<{
    percentage: number;
    tier: string;
    characterColor: string;
    characterName: string;
    plotNode: string;
}> = ({ percentage, tier, characterColor, characterName, plotNode }) => {
    
    if (percentage === 0) {
        return (
            <div className="w-full h-full min-h-[80px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-600">
                <div className="w-2 h-8 bg-gray-200 dark:bg-gray-700 rounded-full opacity-30"></div>
            </div>
        );
    }

    return (
        <motion.div 
            className="relative w-full h-full min-h-[80px] group cursor-pointer border-r border-gray-300 dark:border-gray-600 overflow-hidden"
            title={`${characterName} in ${plotNode}: ${tier} (${percentage}%)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: Math.random() * 0.3 }}
            whileHover={{ scale: 1.02 }}
        >
            {/* Base Background */}
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800" />
            
            {/* Gradient Charging Fill - Fills from bottom */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(to top, 
                        ${characterColor}CC 0%, 
                        ${characterColor}99 40%, 
                        ${characterColor}66 70%, 
                        ${characterColor}33 90%, 
                        ${characterColor}11 100%
                    )`
                }}
                initial={{ clipPath: 'inset(100% 0 0 0)' }}
                animate={{ clipPath: `inset(${100 - percentage}% 0 0 0)` }}
                transition={{
                    duration: 1.2,
                    delay: Math.random() * 0.4,
                    ease: "easeOut"
                }}
            />

            {/* Animated Wave/Loop Effect */}
            <motion.div
                className="absolute inset-0 opacity-40"
                style={{
                    background: `linear-gradient(45deg, 
                        transparent 0%, 
                        ${characterColor}44 30%, 
                        ${characterColor}88 50%, 
                        ${characterColor}44 70%, 
                        transparent 100%
                    )`,
                    clipPath: `inset(${100 - percentage}% 0 0 0)`
                }}
                animate={{
                    backgroundPosition: ['0% 0%', '200% 0%'],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* Pulse effect for high percentages */}
            {percentage >= 70 && (
                <motion.div
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(circle at center, 
                            ${characterColor}22 0%, 
                            transparent 70%
                        )`,
                        clipPath: `inset(${100 - percentage}% 0 0 0)`
                    }}
                    animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                {/* Percentage Display */}
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <div 
                        className="text-lg font-bold mb-1 drop-shadow-sm"
                        style={{ 
                            color: percentage > 50 ? 'white' : characterColor,
                            textShadow: percentage > 50 ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
                        }}
                    >
                        {percentage}%
                    </div>
                    <div 
                        className="text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm"
                        style={{ 
                            backgroundColor: percentage > 50 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                            color: percentage > 50 ? 'white' : characterColor
                        }}
                    >
                        {tier}
                    </div>
                </motion.div>

                {/* Hover Details */}
                <motion.div 
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm"
                    initial={false}
                >
                    <div className="text-center text-white p-2">
                        <div className="font-semibold text-sm mb-1">{characterName}</div>
                        <div className="text-xs opacity-90">{plotNode}</div>
                        <div className="text-xs opacity-75 mt-1">{tier} • {percentage}%</div>
                    </div>
                </motion.div>
            </div>

            {/* Border Highlight for High Values */}
            {percentage >= 90 && (
                <motion.div
                    className="absolute inset-0 border-2 border-yellow-400 opacity-60"
                    animate={{
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}
        </motion.div>
    );
};

export default ChargingBarIndicator;
