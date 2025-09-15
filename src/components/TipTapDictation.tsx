import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import DictationButton from './DictationButton';
import { useDictation } from '../hooks/useDictation';

interface TipTapDictationProps {
    editor: Editor | null;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const TipTapDictation: React.FC<TipTapDictationProps> = ({ 
    editor, 
    className = '',
    size = 'md' 
}) => {
    // Handle text insertion into TipTap editor
    const handleInsertText = useCallback((text: string) => {
        if (!editor) return;

        // Get current position
        const { from } = editor.state.selection;
        
        // Insert text at current cursor position
        editor.chain().focus().insertContentAt(from, text).run();
    }, [editor]);

    // Handle paragraph end - insert new paragraph
    const handleParagraphEnd = useCallback(() => {
        if (!editor) return;

        // Create a new paragraph
        editor.chain().focus().splitBlock().run();
    }, [editor]);

    // Handle errors with toast notifications (you can customize this)
    const handleError = useCallback((error: string) => {
        console.error('Dictation error:', error);
        
        // You can integrate with your toast system here
        // For now, we'll use a simple alert
        if (error.includes('Whisper model not found')) {
            // Custom handling for model not found
            console.error('Whisper model missing - showing user instructions');
        } else if (error.includes('No input device')) {
            // Custom handling for microphone issues
            console.error('Microphone access issues');
        }
    }, []);

    const [, ] = useDictation({
        onTranscript: handleInsertText,
        onParagraphEnd: handleParagraphEnd,
        onError: handleError,
        autoReconnect: true,
        maxRetries: 3
    });

    return (
        <DictationButton
            onInsertText={handleInsertText}
            className={className}
            size={size}
        />
    );
};

export default TipTapDictation;
