import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SceneBeatExtension } from '../extensions/SceneBeatExtension';
import { NoteSectionExtension } from '../extensions/NoteSectionExtension';
import { CharacterImpersonationExtension } from '../extensions/CharacterImpersonationExtension';

const CustomNodeTest: React.FC = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      SceneBeatExtension,
      NoteSectionExtension,
      CharacterImpersonationExtension,
    ],
    content: '<p>Click the buttons below to test custom nodes:</p>',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none p-4 min-h-[300px] border border-gray-300 rounded-lg',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      console.log('Editor initialized with extensions:', editor.extensionManager.extensions.map(ext => ext.name));
      console.log('Available commands:', Object.keys(editor.commands));
    }
  }, [editor]);

  const testSceneBeat = () => {
    if (editor) {
      console.log('Testing Scene Beat command...');
      console.log('setSceneBeat available:', !!editor.commands.setSceneBeat);
      editor.chain().focus().setSceneBeat({
        chapterName: 'Test Chapter',
        sceneBeatIndex: 1,
        summary: 'Test scene beat',
        goal: 'Test goal',
        characters: ['Test Character'],
        worldEntities: [],
        status: 'Draft'
      }).run();
    }
  };

  const testNoteSection = () => {
    if (editor) {
      console.log('Testing Note Section command...');
      console.log('setNoteSection available:', !!editor.commands.setNoteSection);
      editor.chain().focus().setNoteSection({
        content: 'Test note content',
        labels: ['test']
      }).run();
    }
  };

  const testCharacterImpersonation = () => {
    if (editor) {
      console.log('Testing Character Impersonation command...');
      console.log('setCharacterImpersonation available:', !!editor.commands.setCharacterImpersonation);
      editor.chain().focus().setCharacterImpersonation({
        activeCharacter: 'Nemar',
        availableCharacters: ['Nemar', 'Attican']
      }).run();
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Custom Node Command Test</h1>
      
      <div className="mb-4 space-x-2">
        <button
          onClick={testSceneBeat}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Scene Beat
        </button>
        <button
          onClick={testNoteSection}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Add Note Section
        </button>
        <button
          onClick={testCharacterImpersonation}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Add Character Impersonation
        </button>
      </div>

      <EditorContent editor={editor} />
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p><strong>Editor loaded:</strong> {editor ? 'Yes' : 'No'}</p>
        <p><strong>Extensions count:</strong> {editor?.extensionManager.extensions.length || 0}</p>
        <p><strong>Commands available:</strong> {editor ? Object.keys(editor.commands).length : 0}</p>
      </div>
    </div>
  );
};

export default CustomNodeTest;
