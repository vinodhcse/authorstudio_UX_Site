import { ImageProviderClient, ImageGenRequest, postJson } from './base';

export const OpenAIImageClient: ImageProviderClient = {
  id: 'openai',
  name: 'OpenAI',
  async generateImages(req: ImageGenRequest): Promise<string[]> {
    if (!req.apiKey) throw new Error('OpenAI API key missing');
    const base = (req.baseUrl || 'https://api.openai.com').replace(/\/$/, '');
    // OpenAI images uses /v1/images/generations and a slightly different body
    const size = `${req.width}x${req.height}`;
    const body = {
      model: req.model || 'gpt-image-1',
      prompt: req.prompt,
      n: Math.max(1, Math.min(8, req.n || 1)),
      size,
      response_format: 'b64_json',
    };
    try {
      if ((globalThis as any).__AI_DEBUG_HTTP) {
        console.log('[OpenAI.generateImages] request', { url: `${base}/v1/images/generations`, model: body.model, size, n: body.n });
      }
    } catch {}
    const json = await postJson(`${base}/v1/images/generations`, body, { 'Authorization': `Bearer ${req.apiKey}`, 'Content-Type': 'application/json' }, req.signal);
    const arr: string[] = (json?.data || []).map((d: any) => `data:image/png;base64,${d?.b64_json}`);
    return arr.filter(Boolean);
  },
};
