import type { AISettings, AIFeaturePreset } from '../stores/userSettingsStore';
import { getImageClient } from './imageProviders/registry';

export type ImageQuality = 'preview' | 'final';

export type RunImageFeatureParams = {
  featureId: string;           // e.g., 'character_image_generate'
  settings: AISettings;        // user AI settings
  presetId?: string;           // optional preset override
  prompt: string;              // single prompt string
  n?: number;                  // number of images (preview only)
  steps?: number;              // provider hint
  seed?: number;               // optional seed
  negativePrompt?: string;     // optional negative prompt
  quality?: ImageQuality;      // preview | final
  width?: number;              // optional override
  height?: number;             // optional override
  signal?: AbortSignal;
};

export type RunImageBatchParams = Omit<RunImageFeatureParams, 'prompt'> & {
  prompts: string[]; // generate one per prompt (usually used for previews)
};

type ProviderResolved = {
  providerId: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  projectId?: string;
  preset: AIFeaturePreset;
};

function resolveProvider(params: { featureId: string; settings: AISettings; presetId?: string; }): ProviderResolved | null {
  const feature = params.settings.features.find(f => f.id === params.featureId && f.enabled);
  if (!feature) return null;
  const preset: AIFeaturePreset | undefined = params.presetId
    ? feature.presets.find(p => p.id === params.presetId && (p.enabled ?? true))
    : feature.presets.find(p => p.enabled ?? true) || feature.presets[0];
  if (!preset) return null;
  const provider = params.settings.providers.find(p => p.id === preset.provider && p.enabled);
  if (!provider) return null;
  return {
    providerId: provider.id,
    model: preset.model,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    organizationId: provider.organizationId,
    projectId: provider.projectId,
    preset,
  };
}

export async function runImageFeature(params: RunImageFeatureParams): Promise<string[]> {
  const {
    featureId, settings, presetId, prompt, n = 1, steps, seed,
    negativePrompt, quality = 'preview', width: widthOverride, height: heightOverride, signal,
  } = params;
  const resolved = resolveProvider({ featureId, settings, presetId });
  if (!resolved) throw new Error('Image feature not enabled or provider not configured');

  const width = widthOverride ?? (quality === 'preview' ? 512 : 768);
  const height = heightOverride ?? (quality === 'preview' ? 768 : 1152);
  const stepCount = steps ?? (quality === 'preview' ? 4 : 20);
  const np = negativePrompt ?? 'blurry, low contrast, cropped face, extra limbs, distorted anatomy';

  try {
    if ((globalThis as any).__AI_DEBUG_HTTP) {
      console.log('[runImageFeature] resolved', { provider: resolved.providerId, model: resolved.model, baseUrl: resolved.baseUrl, quality, width, height, steps: stepCount, n });
    }
  } catch {}
  const client = getImageClient(resolved.providerId);
  if (!client) throw new Error(`Provider ${resolved.providerId} does not support image generation yet`);
  const images = await client.generateImages({
    prompt,
    n: Math.max(1, Math.min(8, n)),
    width,
    height,
    steps: stepCount,
    seed,
    negativePrompt: np,
    apiKey: resolved.apiKey,
    baseUrl: resolved.baseUrl,
    model: resolved.model,
    signal,
  });
  try {
    if ((globalThis as any).__AI_DEBUG_HTTP) {
      console.log('[runImageFeature] images.length', images?.length);
    }
  } catch {}
  return images;
}

export async function runImageBatch(params: RunImageBatchParams): Promise<string[][]> {
  const { prompts, ...rest } = params;
  const out: string[][] = [];
  for (let i = 0; i < prompts.length; i++) {
    const imgs = await runImageFeature({ ...rest, prompt: prompts[i] });
    out.push(imgs);
  }
  return out;
}
