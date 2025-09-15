import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Editor } from '@tiptap/react';
import { PlusIcon, SparklesIcon, GitCommitIcon, ListIcon, FilePlusIcon } from '../../../constants';
import { Theme } from '../../../types';
import { MicrophoneIcon, BookOpenIcon, PencilIcon, EyeIcon, ChartBarIcon, ClockIcon, CogIcon } from '@heroicons/react/24/outline';
import { insertDictationSection, updateDictationSection } from '../../../lib/dictationHelpers';

interface FloatingActionButtonProps {
    theme?: Theme;
    onInsertText?: (text: string) => void; // Callback for inserting dictated text
    editorInstance?: Editor | null; // TipTap editor instance for DictationSection
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ theme = 'dark', onInsertText, editorInstance }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [animationPhase, setAnimationPhase] = useState<'closed' | 'throwing' | 'floating'>('closed');
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    const [showItems, setShowItems] = useState(false);
    const [itemPositions, setItemPositions] = useState<Array<{x: number, y: number}>>([]);
    
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [currentDictationId, setCurrentDictationId] = useState<string | null>(null);
    const [accumulatedPreviewText, setAccumulatedPreviewText] = useState<string>('');
    
    // Periodically check and adjust positions to maintain spacing
    useEffect(() => {
        if (!showItems || itemPositions.length === 0) return;
        
        const checkPositionSpacing = () => {
            let needsRepositioning = false;
            
            for (let i = 0; i < itemPositions.length; i++) {
                for (let j = i + 1; j < itemPositions.length; j++) {
                    if (isPositionTooClose(itemPositions[i], itemPositions[j], 100)) {
                        needsRepositioning = true;
                        break;
                    }
                }
                if (needsRepositioning) break;
            }
            
            if (needsRepositioning && animationPhase === 'floating') {
                console.log('Repositioning icons to maintain spacing...');
                const newPositions = generatePositionsWithSpacing();
                setItemPositions(newPositions);
            }
        };
        
        const interval = setInterval(checkPositionSpacing, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [showItems, itemPositions, animationPhase]);
    
    useEffect(() => {
        const setupEventListeners = async () => {
            try {
                // Listen for speech results
                const unlistenSpeech = await listen<{ text: string; is_final: boolean }>('dictation-result', (event) => {
                    const { text, is_final } = event.payload;
                    console.log('🎤 Speech result:', { text, is_final });
                    
                    // If we have an editor instance and a current dictation session, update the DictationSection
                    if (editorInstance && currentDictationId && text.trim()) {
                        // Handle special commands for paragraph breaks
                        if (text.trim().toLowerCase() === 'new paragraph' || text === '<PARAGRAPH_END>') {
                            // Add paragraph break to accumulated text
                            const newAccumulatedText = accumulatedPreviewText + '\n\n[New Paragraph]\n\n';
                            setAccumulatedPreviewText(newAccumulatedText);
                            updateDictationSection(editorInstance, currentDictationId, {
                                status: 'preview',
                                previewText: newAccumulatedText
                            });
                        } else {
                            // Append to accumulated preview text
                            const newAccumulatedText = accumulatedPreviewText + (accumulatedPreviewText ? ' ' : '') + text;
                            setAccumulatedPreviewText(newAccumulatedText);
                            updateDictationSection(editorInstance, currentDictationId, {
                                status: is_final ? 'complete' : 'preview',
                                previewText: newAccumulatedText,
                                finalText: is_final ? newAccumulatedText : undefined
                            });
                        }
                    } else if (onInsertText && text.trim()) {
                        // Fallback to direct text insertion if no editor or dictation session
                        if (text.trim().toLowerCase() === 'new paragraph' || text === '<PARAGRAPH_END>') {
                            onInsertText('\n\n');
                        } else if (text.trim().toLowerCase() === 'new line') {
                            onInsertText('\n');
                        } else {
                            onInsertText(text + (is_final ? ' ' : ''));
                        }
                    }
                    
                    // Visual feedback for transcription
                    if (is_final) {
                        setIsTranscribing(true);
                        setTimeout(() => setIsTranscribing(false), 1000);
                    }
                });

                // Listen for dictation status changes
                const unlistenStatus = await listen<{ status: string; message?: string }>('dictation-status', (event) => {
                    const { status, message } = event.payload;
                    console.log('🎤 Dictation status:', { status, message });
                    
                    switch (status) {
                        case 'started':
                            setIsListening(true);
                            setAccumulatedPreviewText(''); // Reset accumulated text for new session
                            // Create a new DictationSection when dictation starts
                            if (editorInstance) {
                                const dictationId = insertDictationSection(editorInstance);
                                setCurrentDictationId(dictationId);
                                console.log('✅ Dictation started - created DictationSection:', dictationId);
                            } else {
                                console.log('✅ Dictation started successfully (no editor instance)');
                            }
                            break;
                        case 'stopped':
                            setIsListening(false);
                            setSelectedTool(null);
                            setAccumulatedPreviewText(''); // Reset accumulated text when stopped
                            // Finalize the DictationSection when dictation stops
                            if (editorInstance && currentDictationId) {
                                updateDictationSection(editorInstance, currentDictationId, {
                                    status: 'complete'
                                });
                                console.log('✅ Dictation stopped - finalized DictationSection:', currentDictationId);
                            } else {
                                console.log('✅ Dictation stopped successfully');
                            }
                            setCurrentDictationId(null);
                            break;
                        case 'error':
                            setIsListening(false);
                            setSelectedTool(null);
                            setAccumulatedPreviewText(''); // Reset accumulated text on error
                            // Clear the DictationSection on error
                            if (currentDictationId) {
                                setCurrentDictationId(null);
                            }
                            console.error('❌ Dictation error:', message);
                            if (message) {
                                alert(`❌ Dictation Error: ${message}`);
                            }
                            break;
                        case 'listening':
                            // Visual feedback for when actually listening
                            setIsTranscribing(false);
                            break;
                        case 'processing':
                            // Visual feedback for when processing speech
                            setIsTranscribing(true);
                            // Update DictationSection to processing state
                            if (editorInstance && currentDictationId) {
                                updateDictationSection(editorInstance, currentDictationId, {
                                    status: 'processing'
                                });
                            }
                            break;
                    }
                });

                // Listen for dictation processing complete (final transcription)
                const unlistenProcessingComplete = await listen<{ status: string; message?: string; text?: string }>('dictation-processing-complete', (event) => {
                    const { status, message, text } = event.payload;
                    console.log('🎤 Processing complete:', { status, message, text });
                    
                    // Update the DictationSection with the final transcription
                    if (editorInstance && currentDictationId && text) {
                        updateDictationSection(editorInstance, currentDictationId, {
                            status: 'complete',
                            finalText: text
                        });
                        console.log('✅ Updated DictationSection with final transcription:', text.substring(0, 50) + '...');
                    }
                });

                // Listen for error events
                const unlistenError = await listen<string>('dictation-error', (event) => {
                    const errorMessage = event.payload;
                    console.error('❌ Dictation error event:', errorMessage);
                    setIsListening(false);
                    setSelectedTool(null);
                    setIsTranscribing(false);
                    
                    // Clear the DictationSection on error
                    if (currentDictationId) {
                        setCurrentDictationId(null);
                        setAccumulatedPreviewText(''); // Reset accumulated text on error
                    }
                    
                    // Show user-friendly error message
                    if (errorMessage.includes('Whisper model not found')) {
                        alert('🔧 AI Model Missing\n\nThe app is running in simulation mode. Download the Whisper model for full AI functionality.\n\nSee WHISPER_SETUP.md for instructions.');
                    } else if (errorMessage.includes('microphone') || errorMessage.includes('audio')) {
                        alert('🎤 Microphone Issue\n\nPlease check your microphone connection and permissions, then try again.');
                    } else {
                        alert(`❌ Voice dictation error: ${errorMessage}`);
                    }
                });

                // Cleanup function
                return () => {
                    unlistenSpeech();
                    unlistenStatus();
                    unlistenProcessingComplete();
                    unlistenError();
                };
            } catch (error) {
                console.error('Failed to setup event listeners:', error);
                return () => {}; // Return empty cleanup function
            }
        };

        const cleanupPromise = setupEventListeners();
        
        return () => {
            cleanupPromise.then(cleanup => cleanup());
        };
    }, [onInsertText, editorInstance, currentDictationId, accumulatedPreviewText]);
    
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
                        console.log('✅ Voice dictation stopped successfully');
                    } catch (err) {
                        console.error('❌ Failed to stop dictation:', err);
                        setIsListening(false); // Force stop UI state
                        setSelectedTool(null);
                        setHoveredTool(null);
                        setCurrentDictationId(null); // Clear dictation session
                        setAccumulatedPreviewText(''); // Reset accumulated text on error
                        alert('❌ Could not stop dictation properly. The dictation has been stopped.');
                    }
                } else {
                    console.log('🎤 Starting voice dictation...');
                    try {
                        await invoke('start_dictation');
                        setIsListening(true);
                        setSelectedTool('Voice Dictation');
                        setHoveredTool(null);
                        console.log('✅ Voice dictation started successfully');
                    } catch (err) {
                        console.error('❌ Failed to start dictation:', err);
                        const errorMessage = String(err);
                        
                        // Provide specific error messages based on the error type
                        if (errorMessage.includes('Whisper model not found')) {
                            alert('❌ Whisper AI model not found!\n\n🔧 Setup required:\n\n1. Download the model: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin\n2. Place it in: src-tauri/models/ggml-base.en.bin\n3. Restart the application\n\n💡 Note: Currently using simulation mode for testing.');
                        } else if (errorMessage.includes('No input device available') || errorMessage.includes('microphone')) {
                            alert('❌ Microphone not available!\n\n🔧 Please check:\n• Microphone is connected and working\n• Microphone permissions are granted\n• No other app is using the microphone\n• Try the "Test Microphone" button first');
                        } else if (errorMessage.includes('already running')) {
                            alert('ℹ️ Voice dictation is already running!\n\nPlease stop the current session before starting a new one.');
                            // Try to get the actual state
                            try {
                                const isRunning = await invoke('is_dictation_running');
                                if (isRunning) {
                                    setIsListening(true);
                                    setSelectedTool('Voice Dictation');
                                }
                            } catch (checkErr) {
                                console.warn('Could not check dictation status:', checkErr);
                            }
                        } else if (errorMessage.includes('libclang') || errorMessage.includes('build')) {
                            alert('🔧 Build system issue detected!\n\nThis appears to be a development setup issue. The app should be using the simple dictation system as a fallback.\n\n💡 For developers: Check WHISPER_SETUP.md for build instructions.');
                        } else {
                            alert(`❌ Could not start voice dictation: ${errorMessage}\n\n🔧 Troubleshooting:\n• Try the "Test Microphone" button\n• Check microphone permissions in system settings\n• Restart the application\n• Contact support if the issue persists`);
                        }
                        
                        // Reset UI state on error
                        setIsListening(false);
                        setSelectedTool(null);
                        setHoveredTool(null);
                        setCurrentDictationId(null); // Clear dictation session on error
                        setAccumulatedPreviewText(''); // Reset accumulated text on error
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
                console.log('🎤 Testing microphone and dictation system...');
                try {
                    // Test if dictation system is available
                    const testResult = await invoke('test_dictation_system');
                    console.log('✅ Dictation system test result:', testResult);
                    
                    // If successful, show detailed info
                    alert(`✅ Dictation System Test Results:\n\n${testResult}\n\n🎤 The voice dictation system is ready to use!\n\n💡 Click "Voice Dictation" to start recording.`);
                } catch (error) {
                    console.error('🎤 Dictation system test failed:', error);
                    const errorMessage = String(error);
                    
                    if (errorMessage.includes('Whisper model not found')) {
                        alert(`🔧 System Status: Using Simulation Mode\n\n⚠️ Whisper AI model not found, but the system will work in simulation mode for testing.\n\nTo enable full AI functionality:\n1. Download: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin\n2. Place in: src-tauri/models/ggml-base.en.bin\n3. Restart the app\n\n✅ You can still use Voice Dictation - it will simulate speech recognition for testing purposes.`);
                    } else if (errorMessage.includes('No input device')) {
                        alert(`❌ Microphone Test Failed\n\nIssue: ${errorMessage}\n\n🔧 Troubleshooting:\n• Check microphone connection\n• Grant microphone permissions\n• Close other apps using the microphone\n• Try a different microphone\n• Restart the application`);
                    } else {
                        alert(`🔧 Dictation System Status\n\n⚠️ ${errorMessage}\n\nThe system may still work in fallback mode. Try using Voice Dictation to see if it works.\n\n💡 If issues persist, check the console for detailed error information.`);
                    }
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

    // Generate random positions spread across the RIGHT side of the screen with collision detection
    const generateRandomPosition = () => {
        const viewportWidth = window.innerWidth || 1920;
        const viewportHeight = window.innerHeight || 1080;
        
        // Constrain to RIGHT 40% of screen only (as requested by user)
        const minX = Math.max(viewportWidth * 0.6, viewportWidth - 600); // Start from 60% of screen width
        const maxX = viewportWidth - 150; // Margin from right edge
        const minY = Math.max(viewportHeight * 0.15, 100); // Start from top 15%
        const maxY = viewportHeight - 150; // Margin from bottom
        
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

    // Generate positions with collision detection
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
            const throwForce = 300 + Math.random() * 150; // Increased throw force for wider spread
            const throwAngle = Math.random() * 360; // Full 360-degree throw angle for better distribution
            const throwRadian = (throwAngle * Math.PI) / 180;
            
            return {
                x: [0, Math.cos(throwRadian) * throwForce * 0.4, targetPos.x],
                y: [0, Math.sin(throwRadian) * throwForce * 0.4, targetPos.y],
                opacity: [0, 1, 1],
                scale: [0, 1.3, 1], // Slightly larger peak scale
                rotate: [0, Math.random() * 360, Math.random() * 720],
                transition: {
                    duration: 1.0 + Math.random() * 0.6, // Slightly longer duration
                    ease: [0.25, 0.46, 0.45, 0.94],
                    times: [0, 0.3, 1]
                }
            };
        },
        floating: (index: number) => {
            // Use stored position for consistent floating
            const basePos = itemPositions[index] || generateRandomPosition();
            const floatRadius = 15; // Reduced radius to prevent icons from getting too close
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
                scale: 1.5, // Increased hover scale for better visibility
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
                                            className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap ${buttonTheme.tooltip} text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl pointer-events-none z-50 transform-gpu`}
                                            initial={{ scale: 0.8, y: 10 }}
                                            whileHover={{ scale: 1, y: 0 }}
                                        >
                                            {isSelected ? `Stop ${item.label}` : item.label}
                                            {/* Tooltip arrow */}
                                            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${isDarkTheme ? 'border-t-gray-900/95' : 'border-t-white/95'}`} />
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
                            // Switch to floating after throw animation completes
                            setTimeout(() => setAnimationPhase('floating'), 1200);
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
