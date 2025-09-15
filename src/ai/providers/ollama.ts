import { AIProviderClient, ChatMessage, httpFetch } from './base';
import { readNDJSON } from '../streamingHelper';

function toOllamaMessages(messages: ChatMessage[]) {
  return messages.map(m => ({ role: m.role, content: m.content }));
}

export const OllamaClient: AIProviderClient = {
  id: 'ollama', name: 'Ollama', supportsStreaming: true,
  async complete(messages, opts) {
    const url = `${opts.baseUrl || 'http://localhost:11434'}/api/chat`;
    const body = { model: opts.model, stream: false, messages: toOllamaMessages(messages) };
    try { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); } catch {}
    const res = await httpFetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.message?.content || '';
  },
  async stream(messages, opts) {
    const url = `${opts.baseUrl || 'http://localhost:11434'}/api/chat`;
    const body = { model: opts.model, stream: true, messages: toOllamaMessages(messages) };
    try { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); } catch {}
    const res = await httpFetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let final = '';
    await readNDJSON(res, (obj) => {
      const delta = obj.message?.content || '';
      if (delta) { final += delta; opts.onToken?.(delta); }
    });
    opts.onDone?.(final);
  },
  async listModels(opts) {
    const base = (opts.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    const res = await httpFetch(`${base}/api/tags`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const arr: any[] = Array.isArray(json) ? json : (Array.isArray(json?.models) ? json.models : (Array.isArray(json?.tags) ? json.tags : []));
    const mapped = arr.map((m: any) => {
      const id = m.name || m.model || m.tag;
      const fam = m.details?.family || m.family;
      const label = fam ? `${id} (${fam})` : id;
      const parametersBn = m.details?.parameter_size ? parseFloat(String(m.details.parameter_size).replace(/B|b/, '')) : undefined;
      const contextLength = m.details?.context_length || m.context_length;
      return id ? { id: String(id), label, parametersBn, contextLength, raw: m } : null;
    }).filter(Boolean) as any[];
    const seen = new Set<string>();
    return mapped.filter((m: any) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  }
};
