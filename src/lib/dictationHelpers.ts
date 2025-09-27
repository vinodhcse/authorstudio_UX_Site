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
    errorMessage?: string;
    originalText?: string;
    aiStreaming?: boolean;
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

    // Normalize line endings
    const normalized = textToInsert.replace(/\r\n/g, '\n').trim();

    // Split into paragraphs: first try blank-line separated blocks
    let paragraphs = normalized.split(/\n\s*\n+/).map(p => p.trim()).filter(p => p.length > 0);
    // Fallback: if we only got one block but it still contains single newlines that look like hard breaks,
    // split on single newlines where lines are not too short to avoid breaking dialogue lines mid-flow.
    if (paragraphs.length === 1 && /\n/.test(paragraphs[0])) {
      const alt = paragraphs[0].split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
      // Use alt only if it meaningfully increases structure (>1 resulting lines)
      if (alt.length > 1) paragraphs = alt;
    }

    // Create paragraph nodes (merge internal single newlines inside each paragraph into spaces)
    const paragraphNodes = paragraphs.map(p => {
      const clean = p.replace(/\s*\n+\s*/g, ' ').trim();
      return state.schema.nodes.paragraph.create({}, [state.schema.text(clean)]);
    });

    // Insert each paragraph sequentially
    let insertPos = afterPos;
    paragraphNodes.forEach(node => {
      tr.insert(insertPos, node);
      insertPos += node.nodeSize;
    });

    // Remove the dictation section after inserting new content
    tr.delete(nodePos, nodePos + nodeSize);

    editor.view.dispatch(tr);
    console.log(`✅ Accepted transcription and inserted ${paragraphNodes.length} paragraph(s). First paragraph preview:`, paragraphs[0].substring(0, 60) + (paragraphs[0].length > 60 ? '…' : ''));
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
