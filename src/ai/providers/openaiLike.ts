import { AIProviderClient, ChatMessage, ProviderCallOptions, httpFetch } from './base';
import { readSSE } from '../streamingHelper';

function buildPayload(messages: ChatMessage[], opts: ProviderCallOptions, stream: boolean) {
  const body: any = {
    model: opts.model,
    messages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
    top_p: opts.topP,
    stream,
  };
  if (opts.responseFormat) {
    // OpenAI-compatible providers accept { response_format: { type: 'json_schema'|'json_object', json_schema?: {...} } }
    body.response_format = opts.responseFormat;
  }
  // Allow callers to pass provider-specific fields (e.g., Together reasoning options)
  if (opts.extra && typeof opts.extra === 'object') {
    Object.assign(body, opts.extra);
  }
  // Together reasoning models benefit from an explicit effort hint; add if not provided
  try {
    const base = (opts.baseUrl || '').toLowerCase();
    const model = (opts.model || '').toLowerCase();
    if (base.includes('together') && /think|reason/.test(model) && !body.reasoning) {
      body.reasoning = { effort: 'medium' };
      // Do not set stop tokens by default; providers may manage this server-side
    }
  } catch {}
  return JSON.stringify(body);
}

function headers(apiKey?: string) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) h['Authorization'] = `Bearer ${apiKey}`;
  return h;
}

export function makeOpenAICompatibleClient(id: string, name: string, defaultBase: string): AIProviderClient {
  const base = defaultBase.replace(/\/$/, '');
  return {
    id, name, supportsStreaming: true,
    async complete(messages, opts) {
      const url = `${opts.baseUrl || base}/v1/chat/completions`;
      const hdrs = headers(opts.apiKey);
  const body = buildPayload(messages, opts, false);
      // Log request with masked auth
      const maskedHeaders = { ...hdrs, ...(hdrs.Authorization ? { Authorization: 'Bearer ***' } : {}) };
      try { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: maskedHeaders, body: JSON.parse(body) }); } catch { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: maskedHeaders }); }
      const res = await httpFetch(url, {
        method: 'POST',
        headers: hdrs,
        body,
        signal: opts.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.choices?.[0]?.message?.content || '';
    },
    async stream(messages, opts) {
      const url = `${opts.baseUrl || base}/v1/chat/completions`;
      const hdrs = headers(opts.apiKey);
  const body = buildPayload(messages, opts, true);
      // Log request with masked auth
      const maskedHeaders = { ...hdrs, ...(hdrs.Authorization ? { Authorization: 'Bearer ***' } : {}) };
      try { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: maskedHeaders, body: JSON.parse(body) }); } catch { console.log('[AI HTTP REQUEST]', { url, method: 'POST', headers: maskedHeaders }); }
      const res = await httpFetch(url, {
        method: 'POST',
        headers: hdrs,
        body,
        signal: opts.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let final = '';
      await readSSE(res, (ev) => {
        const delta = ev.choices?.[0]?.delta?.content ?? ev.delta ?? '';
        if (delta) {
          final += delta;
          opts.onToken?.(delta);
        }
      });
      opts.onDone?.(final);
    },
    async listModels(opts) {
      // Endpoint varies slightly: OpenRouter uses /api/v1/models; Together uses /v1/models; OpenAI uses /v1/models
      const customBase = (opts.baseUrl || base).replace(/\/$/, '');
      const isOpenRouter = customBase.includes('openrouter.ai');
      const path = isOpenRouter ? '/v1/models' : '/v1/models';
      // OpenRouter requires Authorization too
      const res = await httpFetch(`${customBase}${customBase.includes('/api') ? '' : (isOpenRouter ? '/api' : '')}${path}`, {
        method: 'GET',
        headers: headers(opts.apiKey),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Normalize different shapes (root array or object with data/models)
      const arr: any[] = Array.isArray(json)
        ? json
        : (Array.isArray(json?.data)
          ? json.data
          : (Array.isArray(json?.models) ? json.models : []));
      const mapped = arr
        .map((m: any) => {
          const id = m.id || m.slug || m.name || m.model || m.value;
          const label = m.display_name || m.displayName || m.description || m.name || m.id || String(id || '');
          const priceIn = m.pricing?.prompt || m.pricing?.input || m.prices?.input;
          const priceOut = m.pricing?.completion || m.pricing?.output || m.prices?.output;
          const pricingUnit = m.pricing?.unit || m.prices?.unit || 'usd/1M_tokens';
          const contextLength = m.context_length || m.context || m.max_context_length;
          const maxTokens = m.max_tokens || m.max_output_tokens;
          const supportsJson = !!(m.capabilities?.json || m.supports_json || m.response_format === 'json');
          const parametersBn = m.parameters_bn || m.params_bn || m.parameters || undefined;
          return id ? { id: String(id), label, priceIn, priceOut, pricingUnit, contextLength, maxTokens, supportsJson, parametersBn, raw: m } : null;
        })
        .filter(Boolean) as any[];
      // Deduplicate by id
      const seen = new Set<string>();
  return mapped.filter((m: any) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
    }
  };
}

export const OpenAIClient = makeOpenAICompatibleClient('openai', 'OpenAI', 'https://api.openai.com');
export const TogetherClient = makeOpenAICompatibleClient('together', 'Together', 'https://api.together.ai');
export const OpenRouterClient = makeOpenAICompatibleClient('openrouter', 'OpenRouter', 'https://openrouter.ai/api');
