import { Editor } from '@tiptap/react';

export const insertDictationSection = (editor: Editor) => {
  const dictationId = `dictation_${Date.now()}`;
  
  editor.commands.insertContent({
    type: 'dictationSection',
    attrs: {
      id: dictationId,
      status: 'recording',
      previewText: '',
      finalText: '',
      timestamp: Date.now(),
    },
  });
  
  return dictationId;
};

export const updateDictationSection = (
  editor: Editor, 
  id: string, 
  updates: {
    status?: 'recording' | 'processing' | 'complete' | 'preview';
    previewText?: string;
    finalText?: string;
  }
) => {
  // Find the dictation section node with the given ID
  const { state } = editor;
  let nodePos: number | null = null;
  let node: any = null;
  
  state.doc.descendants((currentNode, pos) => {
    if (currentNode.type.name === 'dictationSection' && currentNode.attrs.id === id) {
      nodePos = pos;
      node = currentNode;
      return false; // Stop searching
    }
  });
  
  if (nodePos !== null && node) {
    console.log('📝 Updating DictationSection:', id, 'with updates:', updates);
    console.log('📝 Current node attrs:', node.attrs);
    
    // Create the new attributes by merging with existing ones
    const newAttrs = {
      ...node.attrs,
      ...updates
    };
    
    console.log('📝 New node attrs:', newAttrs);
    
    // Use setNodeMarkup to update the node with new attributes
    const tr = state.tr.setNodeMarkup(nodePos, undefined, newAttrs);
    editor.view.dispatch(tr);
    
    console.log('✅ DictationSection updated successfully');
    return true;
  } else {
    console.warn('❌ Could not find DictationSection with id:', id);
  }
  
  return false;
};

export const acceptDictationSection = (editor: Editor, id: string) => {
  const { state } = editor;
  let nodePos: number | null = null;
  let nodeSize: number = 0;
  let textToInsert: string = '';
  
  state.doc.descendants((currentNode, pos) => {
    if (currentNode.type.name === 'dictationSection' && currentNode.attrs.id === id) {
      nodePos = pos;
      nodeSize = currentNode.nodeSize;
      textToInsert = currentNode.attrs.finalText || currentNode.attrs.previewText || '';
      return false; // Stop searching
    }
  });
  
  if (nodePos !== null && textToInsert.trim()) {
    const tr = state.tr;
    const afterPos = nodePos + nodeSize;
    
    // Insert a paragraph with the transcribed text after the dictation section
    const paragraphNode = state.schema.nodes.paragraph.create({}, [
      state.schema.text(textToInsert)
    ]);
    tr.insert(afterPos, paragraphNode);
    
    // Remove the dictation section
    tr.delete(nodePos, nodePos + nodeSize);
    
    editor.view.dispatch(tr);
    console.log('✅ Accepted transcription and replaced with text:', textToInsert.substring(0, 50) + '...');
    return true;
  }
  
  console.warn('❌ Could not accept DictationSection with id:', id);
  return false;
};

export const rejectDictationSection = (editor: Editor, id: string) => {
  const { state } = editor;
  let nodePos: number | null = null;
  let nodeSize: number = 0;
  
  state.doc.descendants((currentNode, pos) => {
    if (currentNode.type.name === 'dictationSection' && currentNode.attrs.id === id) {
      nodePos = pos;
      nodeSize = currentNode.nodeSize;
      return false; // Stop searching
    }
  });
  
  if (nodePos !== null) {
    const tr = state.tr;
    
    // Simply remove the dictation section
    tr.delete(nodePos, nodePos + nodeSize);
    
    editor.view.dispatch(tr);
    console.log('❌ Rejected and deleted dictation section:', id);
    return true;
  }
  
  console.warn('❌ Could not reject DictationSection with id:', id);
  return false;
};

export const completeDictationSection = (editor: Editor, id: string, finalText: string) => {
  return updateDictationSection(editor, id, { 
    status: 'complete', 
    finalText 
  });
};
