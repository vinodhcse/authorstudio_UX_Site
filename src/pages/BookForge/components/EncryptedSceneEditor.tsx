import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import Code from '@tiptap/extension-code';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

import { useBookContext } from '../../../contexts/BookContext';
import { appLog } from '../../../auth/fileLogger';

interface EncryptedSceneEditorProps {
  sceneId?: string;
  bookId: string;
  versionId: string;
  chapterId: string;
  className?: string;
  onContentChange?: (content: string) => void;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export const EncryptedSceneEditor: React.FC<EncryptedSceneEditorProps> = ({
  sceneId,
  bookId,
  versionId,
  chapterId,
  className = '',
  onContentChange,
  autoSave = true,
  autoSaveDelay = 2000
}) => {
  const { getSceneContent, updateSceneContent, createScene } = useBookContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(sceneId || null);
  const [lastSaved, setLastSaved] = useState<string>('');

  // Auto-save timeout
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Strike,
      Code,
      Superscript,
      Subscript,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color.configure({ types: [TextStyle.name] }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your scene...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-lg max-w-none focus:outline-none font-serif text-gray-800 dark:text-gray-300 leading-relaxed book-prose',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      
      // Notify parent of content change
      if (onContentChange) {
        onContentChange(content);
      }

      // Handle auto-save
      if (autoSave && currentSceneId) {
        // Clear existing timeout
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }

        // Set new timeout
        const newTimeout = setTimeout(() => {
          handleSave(content);
        }, autoSaveDelay);

        setSaveTimeout(newTimeout);
      }
    },
  });

  // Load scene content when scene ID changes
  useEffect(() => {
    const loadContent = async () => {
      if (!editor) return;

      setIsLoading(true);
      try {
        if (currentSceneId) {
          await appLog.info('encrypted-editor', 'Loading scene content', { sceneId: currentSceneId });
          
          const content = await getSceneContent(currentSceneId);
          if (content) {
            editor.commands.setContent(content);
            setLastSaved(content);
            await appLog.success('encrypted-editor', 'Scene content loaded');
          } else {
            // Scene not found, create empty content
            editor.commands.setContent('');
            await appLog.warn('encrypted-editor', 'Scene content not found, starting with empty content');
          }
        } else {
          // No scene ID - start with empty content
          editor.commands.setContent('');
          await appLog.info('encrypted-editor', 'No scene ID provided, starting with empty content');
        }
      } catch (error) {
        await appLog.error('encrypted-editor', 'Failed to load scene content', { error });
        editor.commands.setContent('');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [currentSceneId, editor, getSceneContent]);

  // Save content to encrypted storage
  const handleSave = useCallback(async (content?: string) => {
    if (!editor) return;

    const contentToSave = content || editor.getHTML();
    
    // Don't save if content hasn't changed
    if (contentToSave === lastSaved) {
      return;
    }

    setIsSaving(true);
    try {
      if (currentSceneId) {
        // Update existing scene
        await updateSceneContent(currentSceneId, contentToSave);
        await appLog.info('encrypted-editor', 'Scene content updated', { sceneId: currentSceneId });
      } else {
        // Create new scene
        const newScene = await createScene(
          bookId,
          versionId,
          chapterId,
          'New Scene',
          contentToSave
        );
        setCurrentSceneId(newScene.id);
        await appLog.info('encrypted-editor', 'New scene created', { sceneId: newScene.id });
      }

      setLastSaved(contentToSave);
    } catch (error) {
      await appLog.error('encrypted-editor', 'Failed to save scene content', { error });
    } finally {
      setIsSaving(false);
    }
  }, [editor, currentSceneId, lastSaved, updateSceneContent, createScene, bookId, versionId, chapterId]);

  // Manual save function
  const save = useCallback(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    handleSave();
  }, [handleSave, saveTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          🔓 Loading encrypted content...
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Save indicator */}
      {(isSaving || saveTimeout) && (
        <div className="absolute top-2 right-2 text-sm text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded shadow">
          {isSaving ? '💾 Saving...' : '⏳ Auto-saving...'}
        </div>
      )}

      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="min-h-[400px] p-4 border border-gray-200 dark:border-gray-700 rounded-lg focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors"
      />

      {/* Save button (for manual save) */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currentSceneId ? `Scene ID: ${currentSceneId}` : 'New scene (unsaved)'}
        </div>
        <button
          onClick={save}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
        >
          {isSaving ? 'Saving...' : 'Save Now'}
        </button>
      </div>
    </div>
  );
};

export default EncryptedSceneEditor;
