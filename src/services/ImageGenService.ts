// Provider-agnostic Image Generation service that delegates to the AI image feature runner.
// Returns data URLs for easy display; callers may persist via SimpleAssetService.

import type { AISettings } from '../stores/userSettingsStore';
import { runImageFeature } from '../ai/runImageFeature';

export interface GenerateOptions {
  prompt: string;
  steps?: number;
  seed?: number;
  negative_prompt?: string;
  presetId?: string; // allow overriding preset per call
}

export interface BatchOptions extends GenerateOptions {
  n?: number; // number of variations (previews)
}

export class ImageGenService {
  // Generate multiple low-quality previews via configured provider/model
  static async generatePreviews(aiSettings: AISettings, opts: BatchOptions): Promise<string[]> {
    const n = Math.max(1, Math.min(8, opts.n ?? 4));
    try {
      if ((globalThis as any).__AI_DEBUG_HTTP) {
        console.log('[ImageGenService.generatePreviews] start', { n, steps: opts.steps, presetId: opts.presetId, promptLen: opts.prompt?.length });
      }
    } catch {}
    const images = await runImageFeature({
      featureId: 'character_image_generate',
      settings: aiSettings,
      presetId: opts.presetId || 'preset-image-preview',
      prompt: opts.prompt,
      n,
      steps: opts.steps ?? 4,
      seed: opts.seed,
      negativePrompt: opts.negative_prompt,
      quality: 'preview',
    });
    try {
      if ((globalThis as any).__AI_DEBUG_HTTP) {
        console.log('[ImageGenService.generatePreviews] done', { count: images?.length });
      }
    } catch {}
    return images;
  }

  // Generate a higher-quality single image for finalization
  static async generateHighQuality(aiSettings: AISettings, opts: GenerateOptions): Promise<string> {
    try {
      if ((globalThis as any).__AI_DEBUG_HTTP) {
        console.log('[ImageGenService.generateHighQuality] start', { steps: opts.steps, presetId: opts.presetId, promptLen: opts.prompt?.length });
      }
    } catch {}
    const images = await runImageFeature({
      featureId: 'character_image_generate',
      settings: aiSettings,
      presetId: opts.presetId || 'preset-image-final',
      prompt: opts.prompt,
      n: 1,
      steps: opts.steps ?? 20,
      seed: opts.seed,
      negativePrompt: opts.negative_prompt,
      quality: 'final',
    });
    const first = images[0];
    if (!first) throw new Error('No image returned');
    try {
      if ((globalThis as any).__AI_DEBUG_HTTP) {
        console.log('[ImageGenService.generateHighQuality] done', { ok: !!first, len: first?.length });
      }
    } catch {}
    return first;
  }
}
