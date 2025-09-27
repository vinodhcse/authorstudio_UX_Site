import type { ChatMessage } from '../providers/base';

export function buildMessages(params: {
  systemPrompt?: string;
  customPrompt?: string;
  selectionText: string;
  contextText?: string;
  featureId: string;
}): ChatMessage[] {
  const { systemPrompt, customPrompt, selectionText, contextText, featureId } = params;
  const messages: ChatMessage[] = [];
  if (systemPrompt && systemPrompt.trim()) messages.push({ role: 'system', content: systemPrompt });
  // Subtle guard: for single-line rephrasing, nudge providers to avoid JSON/fences
  const isSingleLineRephrase = featureId === 'rephrasing' && !selectionText.includes('\n');
  const extraNoJson = isSingleLineRephrase ? '\n\nOutput ONLY the rephrased sentence as plain text — no JSON, no code fences, no quotes.' : '';
  // For transcript_editor, enforce plain final text with no meta-output
  const transcriptEditorGuard = featureId === 'transcript_editor'
    ? '\n\nOutput Policy: Return ONLY the final edited transcript as plain text. No analysis, questions, tags (e.g., <think>), headings, or commentary.'
    : '';
  const userParts = [
    customPrompt?.trim() ? customPrompt.trim() + extraNoJson + transcriptEditorGuard + '\n\n' : (extraNoJson + transcriptEditorGuard),
    contextText?.trim() ? `Context:\n${contextText.trim()}\n\n` : '',
    `Selection:\n${selectionText}`,
  ].join('');
  messages.push({ role: 'user', content: userParts });
  return messages;
}
