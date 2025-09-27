import { httpFetch } from '../providers/base';

export type ImageGenRequest = {
  prompt: string;
  n: number;
  width: number;
  height: number;
  steps?: number;
  seed?: number;
  negativePrompt?: string;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  signal?: AbortSignal;
};

export interface ImageProviderClient {
  id: string;
  name: string;
  generateImages(req: ImageGenRequest): Promise<string[]>; // data URLs
}

export async function postJson(
  url: string,
  body: any,
  headers: Record<string,string>,
  signal?: AbortSignal,
  opts?: { suppress404Log?: boolean; suppressAllErrorLog?: boolean }
) {
  try {
    if ((globalThis as any).__AI_DEBUG_HTTP) {
      const safeHeaders: Record<string, any> = { ...headers };
      if (safeHeaders.Authorization) safeHeaders.Authorization = 'Bearer ***';
      if (safeHeaders['x-api-key']) safeHeaders['x-api-key'] = '***';
      console.log('[IMG POST]', { url, bodyPreview: JSON.stringify(body)?.slice(0, 300), headers: safeHeaders });
    }
  } catch {}
  const res = await httpFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    // Always log provider error bodies to aid troubleshooting (safe: no secrets in body)
    try {
      const is404 = res.status === 404;
      if (!(opts?.suppressAllErrorLog || (is404 && opts?.suppress404Log))) {
        console.error('[IMG POST ERROR]', { url, status: res.status, textPreview: text?.slice(0, 800) });
      }
    } catch {}
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  try {
    const json = await res.json();
    try {
      if ((globalThis as any).__AI_DEBUG_HTTP) {
        console.log('[IMG POST OK]', { url, keys: Object.keys(json || {}), sample: JSON.stringify(json)?.slice(0, 500) });
      }
    } catch {}
    return json;
  } catch (err) {
    try {
      if ((globalThis as any).__AI_DEBUG_HTTP) {
        console.error('[IMG POST PARSE ERROR]', { url, err });
      }
    } catch {}
    throw err;
  }
}
