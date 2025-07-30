import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

interface DictationButtonProps {
    onInsertText?: (text: string) => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const DictationButton: React.FC<DictationButtonProps> = ({
    onInsertText,
    className = '',
    size = 'md'
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    // Size configurations
    const sizeConfig = {
        sm: { button: 'w-12 h-12', icon: 'w-5 h-5', text: 'text-xs' },
        md: { button: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-sm' },
        lg: { button: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-base' }
    };

    const config = sizeConfig[size];

    // Listen for speech results and warnings from Tauri backend
    useEffect(() => {
        let speechUnlisten: UnlistenFn | null = null;
        let warningUnlisten: UnlistenFn | null = null;

        const setupListeners = async () => {
            try {
                // Listen for speech results
                speechUnlisten = await listen<string>('speech-result', (event) => {
                    const text = event.payload.trim();
                    console.log('🎤 Received speech result:', text);
                    
                    if (text === '<PARAGRAPH_END>') {
                        // Insert new paragraph
                        if (onInsertText) onInsertText('\n\n');
                        setIsTranscribing(false);
                    } else if (text && text.length > 0) {
                        // Insert transcribed text
                        if (onInsertText) onInsertText(text + ' ');
                        
                        // Show transcribing state briefly
                        setIsTranscribing(true);
                        setTimeout(() => setIsTranscribing(false), 1000);
                    }
                });

                // Listen for warnings/errors
                warningUnlisten = await listen<string>('speech-warning', (event) => {
                    console.warn('🎤 Speech warning:', event.payload);
                    setError(event.payload);
                    setIsListening(false);
                    setIsTranscribing(false);
                });

            } catch (err) {
                console.error('Failed to setup speech listeners:', err);
                setError('Failed to setup speech listeners');
            }
        };

        setupListeners();

        return () => {
            if (speechUnlisten) speechUnlisten();
            if (warningUnlisten) warningUnlisten();
        };
    }, [onInsertText]);

    // Clear error after some time
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const startDictation = useCallback(async () => {
        try {
            setIsInitializing(true);
            setError(null);
            
            console.log('🎤 Starting dictation...');
            await invoke('start_dictation');
            
            setIsListening(true);
            setIsInitializing(false);
            console.log('✅ Dictation started successfully');
            
        } catch (err) {
            console.error('❌ Failed to start dictation:', err);
            setError(String(err));
            setIsListening(false);
            setIsInitializing(false);
        }
    }, []);

    const stopDictation = useCallback(async () => {
        try {
            console.log('🎤 Stopping dictation...');
            await invoke('stop_dictation');
            
            setIsListening(false);
            setIsTranscribing(false);
            console.log('✅ Dictation stopped successfully');
            
        } catch (err) {
            console.error('❌ Failed to stop dictation:', err);
            setError(String(err));
        }
    }, []);

    const toggleDictation = useCallback(async () => {
        if (isListening) {
            await stopDictation();
        } else {
            await startDictation();
        }
    }, [isListening, startDictation, stopDictation]);

    const testMicrophone = useCallback(async () => {
        try {
            const result = await invoke<string>('test_microphone_permissions');
            console.log('🎤 Microphone test result:', result);
            alert(result);
        } catch (err) {
            console.error('🎤 Microphone test failed:', err);
            alert(`Microphone test failed: ${err}`);
        }
    }, []);

    return (
        <div className={`relative ${className}`}>
            {/* Main dictation button */}
            <motion.button
                onClick={toggleDictation}
                disabled={isInitializing}
                className={`
                    ${config.button} rounded-full relative z-10
                    flex items-center justify-center
                    transition-all duration-300
                    ${isInitializing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : isListening 
                            ? isTranscribing
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500'
                                : 'bg-gradient-to-br from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500'
                            : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500'
                    }
                    text-white shadow-lg hover:shadow-xl
                    transform hover:scale-105 active:scale-95
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    boxShadow: isListening 
                        ? '0 0 20px rgba(239, 68, 68, 0.4)' 
                        : '0 8px 25px -5px rgba(0,0,0,0.3)'
                }}
            >
                <AnimatePresence mode="wait">
                    {isInitializing ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`${config.icon} animate-spin`}
                        >
                            <div className="border-2 border-white border-t-transparent rounded-full w-full h-full" />
                        </motion.div>
                    ) : isListening ? (
                        <motion.div
                            key="stop"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <StopIcon className={config.icon} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="mic"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <MicrophoneIcon className={config.icon} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Animated background blur effects */}
            <AnimatePresence>
                {isListening && (
                    <>
                        {/* Outer pulsing glow */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: isTranscribing ? [1.5, 2.2, 1.5] : [1.5, 2.0, 1.5],
                                opacity: isTranscribing ? [0.6, 0.8, 0.6] : [0.4, 0.6, 0.4],
                                rotate: [0, 180, 360],
                            }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                                duration: isTranscribing ? 1.0 : 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className={`
                                absolute inset-0 rounded-full blur-lg -z-10
                                ${isTranscribing 
                                    ? 'bg-gradient-to-br from-green-400/50 via-emerald-400/50 to-cyan-400/50'
                                    : 'bg-gradient-to-br from-red-400/40 via-orange-400/40 to-pink-400/40'
                                }
                            `}
                        />
                        
                        {/* Inner pulsing glow */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: [1.2, 1.6, 1.2],
                                opacity: isTranscribing ? [0.4, 0.6, 0.4] : [0.3, 0.5, 0.3],
                            }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.2
                            }}
                            className={`
                                absolute inset-0 rounded-full blur-sm -z-5
                                ${isTranscribing 
                                    ? 'bg-gradient-to-br from-white/30 via-green-300/40 to-emerald-300/30'
                                    : 'bg-gradient-to-br from-white/25 via-orange-300/35 to-red-300/25'
                                }
                            `}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Status tooltip */}
            <AnimatePresence>
                {(isListening || error) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className={`
                            absolute top-full mt-2 left-1/2 transform -translate-x-1/2
                            ${config.text} px-3 py-1 rounded-lg whitespace-nowrap
                            pointer-events-none z-20 font-medium
                            ${error 
                                ? 'bg-red-500/90 text-white' 
                                : isTranscribing
                                    ? 'bg-green-500/90 text-white'
                                    : 'bg-orange-500/90 text-white'
                            }
                            shadow-lg backdrop-blur-sm
                        `}
                    >
                        {error ? (
                            <span className="flex items-center gap-1">
                                <span>❌</span>
                                <span>Error</span>
                            </span>
                        ) : isTranscribing ? (
                            <span className="flex items-center gap-1">
                                <span>✍️</span>
                                <span>Transcribing...</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <span>🎤</span>
                                <span>Listening...</span>
                            </span>
                        )}
                        
                        {/* Tooltip arrow */}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-inherit" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Test microphone button (only show when not listening) */}
            {!isListening && !isInitializing && (
                <motion.button
                    onClick={testMicrophone}
                    className={`
                        absolute -bottom-2 -right-2 w-6 h-6 
                        bg-gray-600 hover:bg-gray-500 text-white 
                        rounded-full text-xs font-bold
                        transition-colors duration-200
                        flex items-center justify-center
                        shadow-md hover:shadow-lg
                    `}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Test microphone permissions"
                >
                    ?
                </motion.button>
            )}
        </div>
    );
};

export default DictationButton;
