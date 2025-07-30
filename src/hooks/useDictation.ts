import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface DictationState {
    isListening: boolean;
    isTranscribing: boolean;
    isInitializing: boolean;
    error: string | null;
    lastTranscript: string | null;
}

export interface DictationControls {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    toggle: () => Promise<void>;
    testMicrophone: () => Promise<string>;
    clearError: () => void;
}

export interface UseDictationOptions {
    onTranscript?: (text: string) => void;
    onParagraphEnd?: () => void;
    onError?: (error: string) => void;
    onStateChange?: (state: DictationState) => void;
    autoReconnect?: boolean;
    maxRetries?: number;
}

export const useDictation = (options: UseDictationOptions = {}): [DictationState, DictationControls] => {
    const {
        onTranscript,
        onParagraphEnd,
        onError,
        onStateChange,
        autoReconnect = true,
        maxRetries = 3
    } = options;

    const [state, setState] = useState<DictationState>({
        isListening: false,
        isTranscribing: false,
        isInitializing: false,
        error: null,
        lastTranscript: null
    });

    const unlistenRefs = useRef<{
        speech: UnlistenFn | null;
        warning: UnlistenFn | null;
        status: UnlistenFn | null;
        error: UnlistenFn | null;
    }>({ speech: null, warning: null, status: null, error: null });

    const retryCount = useRef(0);
    const transcriptionTimer = useRef<NodeJS.Timeout | null>(null);

    // Update state helper
    const updateState = useCallback((updates: Partial<DictationState>) => {
        setState(prev => {
            const newState = { ...prev, ...updates };
            onStateChange?.(newState);
            return newState;
        });
    }, [onStateChange]);

    // Setup event listeners
    useEffect(() => {
        const setupListeners = async () => {
            try {
                // Cleanup existing listeners
                if (unlistenRefs.current.speech) {
                    unlistenRefs.current.speech();
                }
                if (unlistenRefs.current.warning) {
                    unlistenRefs.current.warning();
                }
                if (unlistenRefs.current.status) {
                    unlistenRefs.current.status();
                }
                if (unlistenRefs.current.error) {
                    unlistenRefs.current.error();
                }

                // Listen for speech results from Whisper
                unlistenRefs.current.speech = await listen<{text: string, is_final: boolean}>('dictation-result', (event) => {
                    const { text, is_final } = event.payload;
                    console.log('🎤 Received dictation result:', { text, is_final });

                    if (text === 'new paragraph') {
                        console.log('🎤 Paragraph end detected');
                        onParagraphEnd?.();
                        updateState({ isTranscribing: false });
                    } else if (text && text.length > 0) {
                        console.log('🎤 Transcribing:', text);
                        onTranscript?.(text);
                        updateState({ 
                            isTranscribing: true, 
                            lastTranscript: text,
                            error: null 
                        });

                        // Clear transcribing state after a delay
                        if (transcriptionTimer.current) {
                            clearTimeout(transcriptionTimer.current);
                        }
                        transcriptionTimer.current = setTimeout(() => {
                            updateState({ isTranscribing: false });
                        }, 1000);
                    }
                });

                // Listen for dictation status updates
                unlistenRefs.current.status = await listen<{status: string, message: string}>('dictation-status', (event) => {
                    const { status, message } = event.payload;
                    console.log('🎤 Dictation status:', { status, message });
                    
                    if (status === 'started') {
                        updateState({ isListening: true, isInitializing: false, error: null });
                    } else if (status === 'stopped') {
                        updateState({ isListening: false, isTranscribing: false, isInitializing: false });
                    } else if (status === 'error') {
                        updateState({ 
                            isListening: false, 
                            isTranscribing: false, 
                            isInitializing: false,
                            error: message 
                        });
                        onError?.(message);
                    }
                });

                // Listen for dictation errors
                unlistenRefs.current.error = await listen<string>('dictation-error', (event) => {
                    const errorMsg = event.payload;
                    console.error('🎤 Dictation error:', errorMsg);
                    
                    updateState({
                        error: errorMsg,
                        isListening: false,
                        isTranscribing: false,
                        isInitializing: false
                    });
                    
                    onError?.(errorMsg);
                });

                // Listen for warnings/errors (speech-warning for processing issues)
                unlistenRefs.current.warning = await listen<string>('speech-warning', (event) => {
                    const errorMsg = event.payload;
                    console.warn('🎤 Speech warning:', errorMsg);
                    
                    updateState({
                        error: errorMsg,
                        isListening: false,
                        isTranscribing: false,
                        isInitializing: false
                    });
                    
                    onError?.(errorMsg);

                    // Auto-reconnect if enabled
                    if (autoReconnect && retryCount.current < maxRetries) {
                        retryCount.current++;
                        console.log(`🎤 Auto-reconnecting... attempt ${retryCount.current}/${maxRetries}`);
                        setTimeout(() => {
                            start();
                        }, 2000 * retryCount.current); // Exponential backoff
                    }
                });

            } catch (err) {
                console.error('Failed to setup dictation listeners:', err);
                updateState({ error: 'Failed to setup speech listeners' });
                onError?.('Failed to setup speech listeners');
            }
        };

        setupListeners();

        return () => {
            if (unlistenRefs.current.speech) {
                unlistenRefs.current.speech();
            }
            if (unlistenRefs.current.warning) {
                unlistenRefs.current.warning();
            }
            if (unlistenRefs.current.status) {
                unlistenRefs.current.status();
            }
            if (unlistenRefs.current.error) {
                unlistenRefs.current.error();
            }
            if (transcriptionTimer.current) {
                clearTimeout(transcriptionTimer.current);
            }
        };
    }, [onTranscript, onParagraphEnd, onError, autoReconnect, maxRetries, updateState]);

    // Check dictation status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const isRunning = await invoke<boolean>('is_dictation_running');
                if (isRunning) {
                    updateState({ isListening: true });
                }
            } catch (err) {
                console.warn('Could not check dictation status:', err);
            }
        };

        checkStatus();
    }, [updateState]);

    const start = useCallback(async () => {
        try {
            updateState({ isInitializing: true, error: null });
            
            console.log('🎤 Starting dictation...');
            await invoke('start_dictation');
            
            updateState({
                isListening: true,
                isInitializing: false,
                error: null
            });
            
            retryCount.current = 0; // Reset retry count on successful start
            console.log('✅ Dictation started successfully');
            
        } catch (err) {
            const errorMessage = String(err);
            console.error('❌ Failed to start dictation:', errorMessage);
            
            updateState({
                error: errorMessage,
                isListening: false,
                isInitializing: false,
                isTranscribing: false
            });
            
            onError?.(errorMessage);
            throw err; // Re-throw for component handling
        }
    }, [updateState, onError]);

    const stop = useCallback(async () => {
        try {
            console.log('🎤 Stopping dictation...');
            await invoke('stop_dictation');
            
            updateState({
                isListening: false,
                isTranscribing: false,
                isInitializing: false,
                error: null
            });
            
            retryCount.current = 0; // Reset retry count
            console.log('✅ Dictation stopped successfully');
            
        } catch (err) {
            const errorMessage = String(err);
            console.error('❌ Failed to stop dictation:', errorMessage);
            
            updateState({ error: errorMessage });
            onError?.(errorMessage);
            throw err;
        }
    }, [updateState, onError]);

    const toggle = useCallback(async () => {
        if (state.isListening) {
            await stop();
        } else {
            await start();
        }
    }, [state.isListening, start, stop]);

    const testMicrophone = useCallback(async (): Promise<string> => {
        try {
            console.log('🎤 Testing microphone...');
            const result = await invoke<string>('test_microphone_permissions');
            console.log('🎤 Microphone test successful:', result);
            
            updateState({ error: null }); // Clear any previous errors
            return result;
            
        } catch (err) {
            const errorMessage = String(err);
            console.error('🎤 Microphone test failed:', errorMessage);
            
            updateState({ error: errorMessage });
            onError?.(errorMessage);
            throw err;
        }
    }, [updateState, onError]);

    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    const controls: DictationControls = {
        start,
        stop,
        toggle,
        testMicrophone,
        clearError
    };

    return [state, controls];
};

export default useDictation;
