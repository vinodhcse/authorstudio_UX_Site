import React from 'react';
import { motion } from 'framer-motion';

// Tier-based gradient definitions
const getTierGradient = (tier: string) => {
    switch (tier) {
        case 'Primary POV':
        case 'Primary Arc':
            return {
                gradient: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                animation: 'animate-pulse',
                glow: 'shadow-green-500/30'
            };
        case 'Major Supporting':
        case 'Supporting Arc':
            return {
                gradient: 'linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8)',
                animation: '',
                glow: 'shadow-blue-500/30'
            };
        case 'Minor Presence':
            return {
                gradient: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)',
                animation: '',
                glow: 'shadow-yellow-500/30'
            };
        case 'Mentioned Only':
            return {
                gradient: 'linear-gradient(135deg, #6b7280, #4b5563, #374151)',
                animation: '',
                glow: 'shadow-gray-500/30'
            };
        default:
            return {
                gradient: 'linear-gradient(135deg, #e5e7eb, #d1d5db, #9ca3af)',
                animation: '',
                glow: 'shadow-gray-400/20'
            };
    }
};

// Full Cell Gradient Charging Bar Component for Character Presence
const ChargingBarIndicator: React.FC<{
    percentage: number;
    tier: string;
    characterColor: string;
    characterName: string;
    plotNode: string;
}> = ({ percentage, tier, characterName, plotNode }) => {
    
    if (percentage === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-sm">
                <div className="w-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full opacity-20"></div>
            </div>
        );
    }

    const tierStyle = getTierGradient(tier);

    return (
        <motion.div 
            className={`relative w-full h-full group cursor-pointer overflow-hidden rounded-sm ${tierStyle.glow} shadow-lg`}
            title={`${characterName} in ${plotNode}: ${tier} (${percentage}%)`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: Math.random() * 0.2 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        >
            {/* Base Background with subtle pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
            
            {/* Animated flowing background effect */}
            <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                    background: `linear-gradient(45deg, 
                        transparent 25%, 
                        rgba(255,255,255,0.1) 25%, 
                        rgba(255,255,255,0.1) 50%, 
                        transparent 50%, 
                        transparent 75%, 
                        rgba(255,255,255,0.1) 75%
                    )`,
                    backgroundSize: '20px 20px'
                }}
                animate={{
                    backgroundPosition: ['0px 0px', '20px 20px']
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
            
            {/* Main Gradient Fill - Modern sleek charging effect */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: tierStyle.gradient,
                    maskImage: 'linear-gradient(to top, black, rgba(0,0,0,0.8) 90%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to top, black, rgba(0,0,0,0.8) 90%, transparent)'
                }}
                initial={{ 
                    clipPath: 'inset(100% 0 0 0)',
                    opacity: 0
                }}
                animate={{ 
                    clipPath: `inset(${100 - percentage}% 0 0 0)`,
                    opacity: 1
                }}
                transition={{
                    duration: 1.5,
                    delay: Math.random() * 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94]
                }}
            />
            
            {/* Continuous flowing gradient overlay */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(90deg, 
                        transparent 0%, 
                        rgba(255,255,255,0.3) 50%, 
                        transparent 100%
                    )`
                }}
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: percentage / 20 // Stagger based on percentage
                }}
            />

            {/* Pulse effect for Primary POV tier */}
            {tier === 'Primary POV' && (
                <motion.div
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(circle at center, 
                            rgba(16, 185, 129, 0.3) 0%, 
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
            
            {/* Top highlight for depth */}
            <div 
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                style={{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }}
            />
            
            {/* Percentage text overlay */}
            <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
            >
                <div className="text-center">
                    <div className="text-xs font-bold text-white drop-shadow-lg">
                        {percentage}%
                    </div>
                    <div className="text-xs text-white/80 font-medium mt-1 px-1 bg-black/20 rounded">
                        {tier}
                    </div>
                </div>
            </motion.div>

            {/* Hover overlay with enhanced info */}
            <motion.div
                className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2"
                initial={false}
            >
                <div className="text-center text-white text-xs">
                    <div className="font-bold">{characterName}</div>
                    <div className="text-xs opacity-90">{plotNode}</div>
                    <div className="text-xs font-medium mt-1">{tier}</div>
                    <div className="text-lg font-bold">{percentage}%</div>
                </div>
            </motion.div>

            {/* Border Highlight for High Values */}
            {percentage >= 90 && (
                <motion.div
                    className="absolute inset-0 border-2 border-yellow-400 opacity-60 rounded-sm"
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
