import { AIProviderClient, ChatMessage, httpFetch } from './base';
import { readSSE } from '../streamingHelper';

function mapToContents(messages: ChatMessage[]) {
  const system = messages.find(m => m.role === 'system')?.content;
  const contents = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, parts: [{ text: m.content }] }));
  return { systemInstruction: system ? { role: 'system', parts: [{ text: system }] } : undefined, contents };
}

export const GoogleClient: AIProviderClient = {
  id: 'google', name: 'Google Gemini', supportsStreaming: true,
  async complete(messages, opts) {
    const { systemInstruction, contents } = mapToContents(messages);
    const key = opts.apiKey || '';
    const base = (opts.baseUrl || 'https://generativelanguage.googleapis.com')
      .replace(/\/$/, '');
    const url = `${base}/v1beta/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(key)}`;
  try { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': '***' }, body: { contents, systemInstruction, generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxTokens } } }); } catch {}
    const res = await httpFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction, generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxTokens } }),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
    return text;
  },
  async stream(messages, opts) {
    const { systemInstruction, contents } = mapToContents(messages);
    const key = opts.apiKey || '';
    const base = (opts.baseUrl || 'https://generativelanguage.googleapis.com')
      .replace(/\/$/, '');
    const url = `${base}/v1beta/models/${encodeURIComponent(opts.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;
  try { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': '***' }, body: { contents, systemInstruction, generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxTokens } } }); } catch {}
    const res = await httpFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction, generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxTokens } }),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let final = '';
    await readSSE(res, (ev) => {
      const parts: any[] = ev.candidates?.[0]?.content?.parts || [];
      const delta = parts.map(p => p.text || '').join('');
      if (delta) { final += delta; opts.onToken?.(delta); }
    });
    opts.onDone?.(final);
  },
  async listModels(opts) {
    const key = opts.apiKey || '';
    const base = (opts.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
    const url = `${base}/v1beta/models?key=${encodeURIComponent(key)}`;
    const res = await httpFetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const arr: any[] = Array.isArray(json) ? json : (Array.isArray(json?.models) ? json.models : []);
    const mapped = arr.map((m: any) => {
      const raw = m.name || '';
      const id = (typeof raw === 'string' && raw.includes('/')) ? raw.split('/').pop() : (m.id || raw);
      const label = m.displayName || m.description || raw || id;
      const contextLength = m.inputTokenLimit || m.contextLength || m.contextWindow;
      const maxTokens = m.outputTokenLimit || m.maxOutputTokens;
      // Google API doesn't publish pricing via this endpoint
      return id ? { id: String(id), label, contextLength, maxTokens, raw: m } : null;
    }).filter(Boolean) as any[];
    const seen = new Set<string>();
    return mapped.filter((m: any) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  }
};
