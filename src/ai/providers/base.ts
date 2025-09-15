export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ProviderCallOptions = {
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  projectId?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  signal?: AbortSignal;
  onToken?: (delta: string) => void;
  onDone?: (final: string) => void;
  onError?: (err: Error) => void;
  // Optional: provider-native response formatting (e.g., OpenAI/Together json_schema)
  responseFormat?: any;
  extra?: Record<string, any>;
};

export type ModelInfo = {
  id: string;
  label?: string;
  priceIn?: number; // input price (provider reported units)
  priceOut?: number; // output price (provider reported units)
  pricingUnit?: string; // e.g., 'usd/1M_tokens' if available
  contextLength?: number; // tokens
  maxTokens?: number; // output limit
  supportsJson?: boolean;
  parametersBn?: number; // billions of parameters, when known
  tags?: string[];
  raw?: any; // raw provider object for debugging
};

export interface AIProviderClient {
  id: string;
  name: string;
  supportsStreaming: boolean;
  complete(messages: ChatMessage[], opts: ProviderCallOptions): Promise<string>;
  stream(messages: ChatMessage[], opts: ProviderCallOptions): Promise<void>;
  // Optional: list available models for this provider (uses apiKey/baseUrl from opts)
  listModels?: (opts: Pick<ProviderCallOptions, 'apiKey' | 'baseUrl' | 'organizationId' | 'projectId'>) => Promise<Array<ModelInfo>>;
}

// Prefer Tauri HTTP plugin to avoid CORS; fall back to window.fetch in web
export async function httpFetch(input: string, init: RequestInit): Promise<Response> {
  try {
    // Optional verbose log of raw request; API keys may exist in headers so mask common patterns
    const hdrs: any = init.headers || {} as any;
    const masked: Record<string, any> = Array.isArray(hdrs)
      ? Object.fromEntries(hdrs)
      : { ...hdrs };
    if (masked.Authorization) masked.Authorization = 'Bearer ***';
    if (masked['x-api-key']) masked['x-api-key'] = '***';
    // Enable by toggling window.__AI_DEBUG_HTTP
    if ((globalThis as any).__AI_DEBUG_HTTP) {
      console.log('[AI HTTP RAW]', { url: input, method: init.method, headers: masked });
    }
  } catch {}
  // For validation/debug: bypass Tauri HTTP plugin and use native fetch directly.
  // To re-enable Tauri HTTP (CORS-free) path, restore the dynamic import block below.
  // try {
  //   // @ts-ignore
  //   const mod = await import('@tauri-apps/plugin-http');
  //   if (mod && mod.fetch) {
  //     const res = await mod.fetch(input, {
  //       method: init.method as any,
  //       headers: init.headers as any,
  //       body: init.body as any,
  //       // @ts-ignore
  //       signal: init.signal,
  //     });
  //     const bodyText = await res.text();
  //     const headers = new Headers();
  //     Object.entries(res.headers || {}).forEach(([k, v]) => headers.set(k, String(v)));
  //     return new Response(bodyText, { status: res.status, headers });
  //   }
  // } catch (_) {}
  return fetch(input, init);
}
