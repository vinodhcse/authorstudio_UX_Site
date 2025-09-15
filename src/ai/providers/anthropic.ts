import { AIProviderClient, ChatMessage, httpFetch } from './base';
import { readSSE } from '../streamingHelper';

function mapMessages(messages: ChatMessage[]) {
  const sys = messages.find(m => m.role === 'system')?.content;
  const user = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
  return { system: sys, messages: user };
}

export const AnthropicClient: AIProviderClient = {
  id: 'anthropic', name: 'Anthropic', supportsStreaming: true,
  async complete(messages, opts) {
    const { system, messages: msgs } = mapMessages(messages);
    const url = `${opts.baseUrl || 'https://api.anthropic.com'}/v1/messages`;
    const hdrs = {
      'Content-Type': 'application/json',
      'x-api-key': String(opts.apiKey || ''),
      'anthropic-version': '2023-06-01'
    };
    const body = JSON.stringify({ model: opts.model, system, messages: msgs, max_tokens: opts.maxTokens ?? 1024 });
    const masked = { ...hdrs, 'x-api-key': '***' };
    try { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: masked, body: JSON.parse(body) }); } catch { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: masked }); }
    const res = await httpFetch(url, {
      method: 'POST',
      headers: hdrs as any,
      body,
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.content?.[0]?.text || '';
  },
  async stream(messages, opts) {
    const { system, messages: msgs } = mapMessages(messages);
    const url = `${opts.baseUrl || 'https://api.anthropic.com'}/v1/messages`;
    const hdrs = {
      'Content-Type': 'application/json',
      'x-api-key': String(opts.apiKey || ''),
      'anthropic-version': '2023-06-01'
    };
    const body = JSON.stringify({ model: opts.model, system, messages: msgs, max_tokens: opts.maxTokens ?? 1024, stream: true });
    const masked = { ...hdrs, 'x-api-key': '***' };
    try { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: masked, body: JSON.parse(body) }); } catch { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: masked }); }
    const res = await httpFetch(url, {
      method: 'POST',
      headers: hdrs as any,
      body,
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let final = '';
    await readSSE(res, (ev) => {
      const delta = ev.delta?.text ?? ev.content_block_delta?.delta?.text ?? '';
      if (delta) { final += delta; opts.onToken?.(delta); }
    });
    opts.onDone?.(final);
  },
  async listModels(opts) {
    const base = (opts.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
    const res = await httpFetch(`${base}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': String(opts.apiKey || ''),
        'anthropic-version': '2023-06-01'
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const arr: any[] = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : (Array.isArray(json?.models) ? json.models : []));
    const out = arr.map((m: any) => {
      const id = m.id || m.name || m.model;
      const label = m.display_name || m.displayName || m.name || m.id || String(id || '');
      const contextLength = m.context_length || m.contextWindow || m.input_token_limit;
      const maxTokens = m.max_tokens || m.output_token_limit;
      const supportsJson = !!(m.capabilities?.json || m.supports_json);
      return id ? { id: String(id), label, contextLength, maxTokens, supportsJson, raw: m } : null;
    }).filter(Boolean) as any[];
    const seen = new Set<string>();
    return out.filter((m: any) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  }
};
