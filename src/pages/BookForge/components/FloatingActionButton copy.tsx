import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { PlusIcon, SparklesIcon, GitCommitIcon, ListIcon, FilePlusIcon } from '../../../constants';
import { Theme } from '../../../types';
import { MicrophoneIcon, BookOpenIcon, PencilIcon, EyeIcon, ChartBarIcon, ClockIcon, CogIcon } from '@heroicons/react/24/outline';

interface FloatingActionButtonProps {
    theme?: Theme;
    onInsertText?: (text: string) => void; // Callback for inserting dictated text
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ theme = 'dark', onInsertText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [animationPhase, setAnimationPhase] = useState<'closed' | 'throwing' | 'floating'>('closed');
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    const [showItems, setShowItems] = useState(false);
    const [itemPositions, setItemPositions] = useState<Array<{x: number, y: number}>>([]);
    
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    
    useEffect(() => {
        const unlistenPromise = listen<string>('speech-result', (event) => {
            const text = event.payload.trim();
            if (onInsertText) {
                if (text === '<PARAGRAPH_END>') {
                    onInsertText('\n');
                } else {
                    onInsertText(text + ' ');
                }
            }
            setIsTranscribing(true);
            setTimeout(() => setIsTranscribing(false), 1000);
        });

        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, [onInsertText]);
    
    // Theme-aware contrasting colors with better visibility
    const isDarkTheme = theme === 'dark';
    const buttonTheme = {
        // Contrasting colors with proper visibility for both themes
        background: isDarkTheme 
            ? 'bg-gradient-to-br from-gray-100 via-white to-gray-50' 
            : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700',
        text: isDarkTheme ? 'text-gray-900' : 'text-gray-100',
        hover: isDarkTheme 
            ? 'hover:from-white hover:via-gray-50 hover:to-gray-100' 
            : 'hover:from-gray-800 hover:via-gray-700 hover:to-gray-600',
        tooltip: isDarkTheme 
            ? 'bg-gray-900/95 text-white' 
            : 'bg-white/95 text-gray-900',
        shadow: 'shadow-2xl drop-shadow-xl',
        border: isDarkTheme ? 'border-2 border-gray-300/70' : 'border-2 border-gray-500/70',
        innerShadow: isDarkTheme ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 2px 4px rgba(255,255,255,0.1)',
        outerGlow: isDarkTheme ? 'shadow-gray-300/20' : 'shadow-gray-700/30'
    };
    
    const menuItems = [
        { 
            icon: SparklesIcon, 
            label: 'AI Assistant', 
            action: () => console.log('AI Assistant clicked')
        },
        { 
            icon: MicrophoneIcon, 
            label: 'Voice Dictation', 
            action: async () => {
                if (isListening) {
                    console.log('🎤 Stopping voice dictation...');
                    try {
                        await invoke('stop_dictation');
                        setIsListening(false);
                        setSelectedTool(null);
                        setHoveredTool(null);
                    } catch (err) {
                        console.error('❌ Failed to stop dictation:', err);
                        alert('❌ Could not stop dictation. Please try again.');
                    }
                } else {
                    console.log('🎤 Starting voice dictation...');
                    try {
                        await invoke('start_dictation');
                        setIsListening(true);
                        setSelectedTool('Voice Dictation');
                        setHoveredTool(null);
                    } catch (err) {
                        console.error('❌ Failed to start dictation:', err);
                        const errorMessage = String(err);
                        
                        if (errorMessage.includes('Whisper model not found')) {
                            alert('❌ Whisper AI model not found!\n\n🔧 Please download the required model:\n\n1. Go to: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin\n2. Download the file (about 140MB)\n3. Place it in: src-tauri/models/ggml-base.en.bin\n4. Restart the application');
                        } else if (errorMessage.includes('No input device available')) {
                            alert('❌ No microphone found!\n\n🔧 Please check:\n• Microphone is connected\n• Microphone permissions are granted\n• No other app is using the microphone');
                        } else if (errorMessage.includes('already running')) {
                            alert('ℹ️ Dictation is already running. Please stop it first before starting again.');
                        } else {
                            alert(`❌ Could not start dictation: ${errorMessage}\n\n🔧 Try:\n• Check microphone permissions\n• Restart the application\n• Use the "Test Microphone" button first`);
                        }
                    }
                }
            }
        },
        { 
            icon: ListIcon, 
            label: 'Add Glossary', 
            action: () => console.log('Add Glossary clicked')
        },
        { 
            icon: FilePlusIcon, 
            label: 'Import Scene', 
            action: () => console.log('Import Scene clicked')
        },
        { 
            icon: BookOpenIcon, 
            label: 'Chapter Overview', 
            action: () => console.log('Chapter Overview clicked')
        },
        { 
            icon: PencilIcon, 
            label: 'Quick Notes', 
            action: () => console.log('Quick Notes clicked')
        },
        { 
            icon: EyeIcon, 
            label: 'Preview Mode', 
            action: () => console.log('Preview Mode clicked')
        },
        { 
            icon: ChartBarIcon, 
            label: 'Word Count Stats', 
            action: () => console.log('Word Count Stats clicked')
        },
        { 
            icon: ClockIcon, 
            label: 'Writing Timer', 
            action: () => console.log('Writing Timer clicked')
        },
        { 
            icon: GitCommitIcon, 
            label: 'Track Revisions', 
            action: () => console.log('Track Revisions clicked')
        },
        { 
            icon: CogIcon, 
            label: 'Test Microphone', 
            action: async () => {
                console.log('🎤 Testing microphone permissions...');
                try {
                    await invoke('test_microphone_permissions');
                    alert('✅ Microphone test completed! Check console for details.');
                } catch (error) {
                    console.error('🎤 Microphone test failed:', error);
                    alert(`❌ Microphone test failed: ${error}`);
                }
            }
        },
    ];

    const containerVariants = {
        open: {
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
            }
        },
        closed: {
            transition: {
                staggerChildren: 0.02,
                staggerDirection: -1
            }
        }
    };

    // Generate random positions on the right side of the screen only
    const generateRandomPosition = () => {
        const viewportWidth = window.innerWidth || 1920;
        const viewportHeight = window.innerHeight || 1080;
        
        // Right side only - approximately right 40% of the screen
        const minX = Math.max(viewportWidth * 0.6, viewportWidth - 600); // Start from 60% of screen width
        const maxX = viewportWidth - 100; // Margin from right edge
        
        // Use full height but with margins
        const minY = 100; // Top margin
        const maxY = viewportHeight - 150; // Bottom margin
        
        return {
            x: Math.random() * (maxX - minX) + minX - (viewportWidth - 120), // Adjust for fixed positioning
            y: Math.random() * (maxY - minY) + minY - (viewportHeight - 120), // Adjust for fixed positioning
        };
    };

    // Check if two positions are too close to each other
    const isPositionTooClose = (pos1: {x: number, y: number}, pos2: {x: number, y: number}, minDistance: number = 120) => {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < minDistance;
    };

    // Generate positions with collision detection on the right side only
    const generatePositionsWithSpacing = () => {
        const positions: Array<{x: number, y: number}> = [];
        const maxAttempts = 50; // Prevent infinite loops
        
        for (let i = 0; i < menuItems.length; i++) {
            let newPosition: {x: number, y: number};
            let attempts = 0;
            
            do {
                newPosition = generateRandomPosition();
                attempts++;
            } while (
                attempts < maxAttempts && 
                positions.some(existingPos => isPositionTooClose(newPosition, existingPos))
            );
            
            positions.push(newPosition);
        }
        
        return positions;
    };

    // Initialize positions when throwing starts
    const initializePositions = () => {
        const positions = generatePositionsWithSpacing();
        setItemPositions(positions);
        return positions;
    };

    const itemVariants = {
        closed: () => ({
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0,
            rotate: 0,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
            }
        }),
        thrown: (index: number) => {
            // Use stored position or generate new one if not available
            const targetPos = itemPositions[index] || generateRandomPosition();
            const throwForce = 250 + Math.random() * 100; // Increased throw force
            // Constrain throw angles to keep icons on the right side (270° to 90° range)
            const throwAngle = 270 + Math.random() * 180; // From straight up, around to straight down
            const throwRadian = (throwAngle * Math.PI) / 180;
            
            return {
                x: [0, Math.cos(throwRadian) * throwForce * 0.3, targetPos.x],
                y: [0, Math.sin(throwRadian) * throwForce * 0.3, targetPos.y],
                opacity: [0, 1, 1],
                scale: [0, 1.2, 1],
                rotate: [0, Math.random() * 360, Math.random() * 720],
                transition: {
                    duration: 0.9 + Math.random() * 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    times: [0, 0.3, 1]
                }
            };
        },
        floating: (index: number) => {
            // Use stored position for consistent floating
            const basePos = itemPositions[index] || generateRandomPosition();
            const floatRadius = 25; // Fixed radius for predictable movement
            const baseDelay = index * 0.2; // Stagger the animations
            
            return {
                x: [
                    basePos.x,
                    basePos.x + floatRadius * Math.cos(index * 0.8),
                    basePos.x - floatRadius * 0.5,
                    basePos.x + floatRadius * 0.7,
                    basePos.x
                ],
                y: [
                    basePos.y,
                    basePos.y + floatRadius * 0.6 * Math.sin(index * 0.8),
                    basePos.y - floatRadius * 0.4,
                    basePos.y + floatRadius * 0.5,
                    basePos.y
                ],
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.05, 0.95, 1.02, 1],
                opacity: 1,
                transition: {
                    duration: 8 + (index % 3), // 8-10 seconds based on index
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: baseDelay,
                    times: [0, 0.25, 0.5, 0.75, 1]
                }
            };
        },
        hover: () => {
            return {
                scale: 1.4,
                rotate: 0,
                transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                }
            };
        },
        returningHome: {
            scale: 0.8,
            opacity: 0.7,
            x: 0,
            y: 0,
            rotate: 0,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 25,
                duration: 0.6
            }
        },
        selected: (index: number) => {
            // Stay at the current floating position but enlarged
            const basePos = itemPositions[index] || generateRandomPosition();
            return {
                scale: 1.8,
                opacity: 1,
                x: basePos.x,
                y: basePos.y,
                rotate: 0,
                transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                }
            };
        },
        dictationActive: (index: number) => {
            // Pulse at the current floating position with different colors based on speech state
            const basePos = itemPositions[index] || generateRandomPosition();
            
            return {
                scale: isTranscribing ? [1.8, 2.4, 1.8] : [1.8, 2.2, 1.8],
                opacity: [1, 0.9, 1],
                x: basePos.x,
                y: basePos.y,
                rotate: 0,
                transition: {
                    duration: isTranscribing ? 1.0 : 1.5, // Faster pulse when actively transcribing
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            };
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <motion.div 
                className="relative"
                initial="closed"
                animate={isOpen ? "open" : "closed"}
            >
                <AnimatePresence>
                {showItems && (
                     <motion.ul 
                        variants={containerVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="fixed inset-0 pointer-events-none z-10"
                     >
                        {menuItems.map((item, index) => {
                            const isSelected = selectedTool === item.label;
                            const isDictation = item.label === 'Voice Dictation' && isSelected;
                            const isHovered = hoveredTool === item.label;
                            
                            let animateState = "floating";
                            if (isSelected) {
                                animateState = isDictation ? "dictationActive" : "selected";
                            } else if (selectedTool && selectedTool !== item.label) {
                                animateState = "returningHome";
                            } else if (animationPhase === 'throwing') {
                                animateState = "thrown";
                            } else if (animationPhase === 'floating') {
                                animateState = "floating";
                            } else {
                                animateState = "closed";
                            }
                            
                            return (
                                <motion.li
                                    key={item.label}
                                    custom={index}
                                    variants={itemVariants}
                                    initial="closed"
                                    animate={animateState}
                                    whileHover={isSelected ? undefined : "hover"}
                                    className="absolute bottom-6 right-6 list-none pointer-events-auto"
                                    style={{ 
                                        transformOrigin: "center",
                                        perspective: "1000px"
                                    }}
                                    onHoverStart={() => !isSelected && setHoveredTool(item.label)}
                                    onHoverEnd={() => setHoveredTool(null)}
                                >
                                    <div className="group relative">
                                        {/* Gradient blob for hover effect */}
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/30 via-pink-400/30 to-blue-400/30 blur-md"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={isHovered && !isSelected ? { 
                                                scale: 2, 
                                                opacity: 1,
                                                rotate: [0, 360],
                                                transition: { rotate: { duration: 4, repeat: Infinity, ease: "linear" } }
                                            } : { scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                        
                                        {/* Gradient blob for selected state - synchronized with icon pulsing */}
                                        <motion.div
                                            className={`absolute inset-0 rounded-full blur-lg ${
                                                isDictation 
                                                    ? isTranscribing 
                                                        ? 'bg-gradient-to-br from-green-400/50 via-emerald-400/50 to-cyan-400/50' // Green when transcribing
                                                        : 'bg-gradient-to-br from-orange-400/40 via-red-400/40 to-pink-400/40' // Red/orange when listening
                                                    : 'bg-gradient-to-br from-emerald-400/40 via-cyan-400/40 to-blue-500/40' // Default selected color
                                            }`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={isSelected ? {
                                                scale: isDictation ? 
                                                    (isTranscribing ? [2.4, 3.0, 2.4] : [2.2, 2.8, 2.2]) : 
                                                    [2, 2.4, 2],
                                                opacity: isDictation ? 
                                                    (isTranscribing ? [0.7, 0.9, 0.7] : [0.6, 0.8, 0.6]) : 
                                                    [0.5, 0.7, 0.5],
                                                rotate: [0, 180, 360],
                                                transition: {
                                                    duration: isDictation ? 
                                                        (isTranscribing ? 1.0 : 1.5) : 1.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }
                                            } : { scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                        />
                                        
                                        {/* Additional inner glow for selected state */}
                                        <motion.div
                                            className={`absolute inset-0 rounded-full blur-sm ${
                                                isDictation 
                                                    ? isTranscribing 
                                                        ? 'bg-gradient-to-br from-white/30 via-green-300/40 to-emerald-300/30' // Bright green when transcribing
                                                        : 'bg-gradient-to-br from-white/25 via-orange-300/35 to-red-300/25' // Orange/red when listening
                                                    : 'bg-gradient-to-br from-white/20 via-emerald-300/30 to-cyan-300/20' // Default selected glow
                                            }`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={isSelected ? {
                                                scale: [1.5, 1.8, 1.5],
                                                opacity: isDictation ? 
                                                    (isTranscribing ? [0.4, 0.6, 0.4] : [0.3, 0.5, 0.3]) : 
                                                    [0.3, 0.5, 0.3],
                                                transition: {
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                    delay: 0.2
                                                }
                                            } : { scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                        
                                        <motion.button 
                                            className={`w-16 h-16 ${buttonTheme.background} ${buttonTheme.text} ${buttonTheme.border} rounded-full flex items-center justify-center ${buttonTheme.shadow} transition-all duration-300 ${buttonTheme.hover} transform-gpu relative z-10 ${buttonTheme.outerGlow}`}
                                            onClick={async () => {
                                                if (item.label === 'Voice Dictation') {
                                                    if (isSelected) {
                                                        // Stop dictation
                                                        console.log(`🔥 Stopping ${item.label}...`);
                                                        await item.action();
                                                        setSelectedTool(null);
                                                        setHoveredTool(null);
                                                    } else {
                                                        // Start dictation
                                                        if (selectedTool && selectedTool !== item.label) {
                                                            // Stop other tool first if needed
                                                            if (selectedTool === 'Voice Dictation') {
                                                                await invoke('stop_dictation');
                                                                setIsListening(false);
                                                            }
                                                        }
                                                        
                                                        await item.action();
                                                        setSelectedTool(item.label);
                                                        setHoveredTool(null);
                                                    }
                                                } else {
                                                    // Handle other tools normally
                                                    if (isSelected) {
                                                        console.log(`🔥 Stopping ${item.label}...`);
                                                        setSelectedTool(null);
                                                        setHoveredTool(null);
                                                    } else if (selectedTool) {
                                                        // Stop dictation if it's running
                                                        if (selectedTool === 'Voice Dictation') {
                                                            await invoke('stop_dictation');
                                                            setIsListening(false);
                                                        }
                                                        await item.action();
                                                        setSelectedTool(item.label);
                                                        setHoveredTool(null);
                                                    } else {
                                                        await item.action();
                                                        setSelectedTool(item.label);
                                                        setHoveredTool(null);
                                                    }
                                                }
                                            }}
                                            whileHover={!isSelected ? { 
                                                rotateX: -10,
                                                rotateY: 10,
                                                z: 20
                                            } : undefined}
                                            whileTap={{ 
                                                scale: 0.95,
                                                rotateX: 0,
                                                rotateY: 0
                                            }}
                                            style={{
                                                transformStyle: "preserve-3d",
                                                boxShadow: `${buttonTheme.innerShadow}, 0 8px 25px -5px rgba(0,0,0,0.3)`,
                                            }}
                                        >
                                            {/* Always show the original icon, with enhanced 3D styling */}
                                            <motion.div
                                                initial={{ scale: 1 }}
                                                animate={isSelected ? {
                                                    scale: [1, 1.1, 1],
                                                    rotateZ: [0, 5, -5, 0]
                                                } : { scale: 1, rotateZ: 0 }}
                                                transition={isSelected ? {
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                } : { duration: 0.3 }}
                                                className="w-8 h-8 transform-gpu flex items-center justify-center relative"
                                                style={{
                                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                                                }}
                                            >
                                                <item.icon className="w-8 h-8 transform-gpu" />
                                                {/* Enhanced 3D depth effect */}
                                                <div 
                                                    className="absolute inset-0 opacity-30"
                                                    style={{
                                                        background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)`,
                                                        borderRadius: '50%',
                                                        transform: 'translateZ(-2px)'
                                                    }}
                                                />
                                            </motion.div>
                                            {/* Enhanced 3D effect shadow with multiple layers */}
                                            <div className="absolute inset-0 rounded-full bg-black/30 transform translate-x-1 translate-y-1 -z-10 blur-sm" />
                                            <div className="absolute inset-0 rounded-full bg-black/15 transform translate-x-2 translate-y-2 -z-20 blur-md" />
                                        </motion.button>
                                        <motion.span 
                                            className={`absolute bottom-1/2 translate-y-1/2 right-20 whitespace-nowrap ${buttonTheme.tooltip} text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl pointer-events-none z-30 transform-gpu`}
                                            initial={{ scale: 0.8, x: 10 }}
                                            whileHover={{ scale: 1, x: 0 }}
                                        >
                                            {isSelected ? `Stop ${item.label}` : item.label}
                                        </motion.span>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </motion.ul>
                )}
                </AnimatePresence>
                
                <motion.button
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 text-white flex items-center justify-center shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 relative z-30 transform-gpu"
                    onClick={async () => {
                        if (selectedTool) {
                            // If a tool is selected, stop it but keep menu open
                            console.log(`🔥 Stopping ${selectedTool} from main button...`);
                            
                            // Stop dictation if it's running
                            if (selectedTool === 'Voice Dictation') {
                                await invoke('stop_dictation');
                                setIsListening(false);
                            }
                            
                            setSelectedTool(null);
                            setHoveredTool(null);
                        } else if (!isOpen) {
                            // Open and throw the balls
                            setIsOpen(true);
                            setShowItems(true);
                            initializePositions(); // Initialize positions
                            setAnimationPhase('throwing');
                            // Switch to floating after throw animation
                            setTimeout(() => setAnimationPhase('floating'), 1000);
                        } else {
                            // Close if already open
                            setIsOpen(false);
                            setAnimationPhase('closed');
                            setHoveredTool(null);
                            setItemPositions([]);
                            // Delay hiding items to allow exit animation
                            setTimeout(() => setShowItems(false), 500);
                        }
                    }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ 
                        scale: 1.05,
                        rotateX: -5,
                        rotateY: 5,
                        boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.4)"
                    }}
                    style={{
                        transformStyle: "preserve-3d",
                    }}
                >
                    <motion.div 
                        animate={{ 
                            rotate: isOpen || selectedTool ? 45 : 0,
                            scale: selectedTool ? 0.8 : 1
                        }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                        <PlusIcon className="w-10 h-10 transform-gpu"/>
                    </motion.div>
                    {/* 3D button effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-700 via-pink-600 to-red-600 transform translate-x-1 translate-y-1 -z-10 opacity-50" />
                </motion.button>
            </motion.div>
        </div>
    );
};

export default FloatingActionButton;
