import { ImageProviderClient, ImageGenRequest, postJson } from './base';

export const TogetherImageClient: ImageProviderClient = {
  id: 'together',
  name: 'Together',
  async generateImages(req: ImageGenRequest): Promise<string[]> {
    if (!req.apiKey) throw new Error('Together API key missing');
    // Together moved endpoints to api.together.ai; .xyz hosts their console/marketing Next.js app -> 404 HTML
  const baseRaw = (req.baseUrl || 'https://api.together.ai').replace(/\/$/, '');
  // Auto-correct deprecated host if present in user settings
  const base = baseRaw.replace('https://api.together.xyz', 'https://api.together.ai');
    const body = {
      model: req.model,
      prompt: req.prompt,
      steps: req.steps ?? 8,
      width: req.width,
      height: req.height,
      seed: req.seed ?? Math.floor(Math.random() * 1e9),
      response_format: 'b64_json',
      negative_prompt: req.negativePrompt || 'blurry, low contrast, cropped face, extra limbs, distorted anatomy',
  // Together restricts n to 1..4
  n: Math.max(1, Math.min(4, req.n || 1)),
    };
    const headers = { 'Authorization': `Bearer ${req.apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } as const;
    const url = `${base}/v1/images/generations`;
    try { if ((globalThis as any).__AI_DEBUG_HTTP) console.log('[Together.generateImages] request', { url, model: req.model, width: req.width, height: req.height, steps: body.steps, n: body.n }); } catch {}
    const json = await postJson(url, body, headers as any, req.signal);
    const arr: string[] = (json?.data || []).map((d: any) => `data:image/png;base64,${d?.b64_json}`);
    return arr.filter(Boolean);
  },
};
