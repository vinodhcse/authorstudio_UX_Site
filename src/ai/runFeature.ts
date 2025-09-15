import type { AISettings, AIFeatureConfig, AIFeaturePreset } from '../stores/userSettingsStore';
import { getClient } from './registry';
import { buildMessages } from './prompt/promptBuilder';
import { logUsage } from '../db/usage';

export type RunFeatureParams = {
  featureId: string;
  settings: AISettings;
  selectionText: string;
  contextText?: string;
  presetId?: string;
  temperature?: number;
  maxTokens?: number;
  // Provider-native response formatting (e.g., OpenAI json_schema)
  responseFormat?: any;
  signal?: AbortSignal;
  onDelta?: (s: string) => void;
  onDone?: (final: string) => void;
  onError?: (msg: string) => void;
  // When false, do a single non-streaming completion
  stream?: boolean;
  // Optional extra text appended to user prompt (e.g., structured output instruction)
  appendToUserPrompt?: string;
};

export async function runFeature(params: RunFeatureParams) {
  const { featureId, settings, selectionText, contextText, presetId, temperature, maxTokens, responseFormat, signal, onDelta, onDone, onError, stream = true, appendToUserPrompt } = params;
  // We'll log a sanitized request payload below once preset/provider are resolved
  const feature = settings.features.find(f => f.id === featureId && f.enabled);
  if (!feature) { onError?.('Feature not enabled'); return; }

  const preset = resolvePreset(feature, presetId);
  if (!preset) { onError?.('No enabled preset'); return; }
  const provider = settings.providers.find(p => p.id === preset.provider && p.enabled);
  if (!provider) { onError?.('Provider not configured'); return; }
  const client = getClient(preset.provider);
  if (!client) { onError?.(`No client for provider ${preset.provider}`); return; }

  const messages = buildMessages({ systemPrompt: preset.systemPrompt, customPrompt: (preset.customPrompt || '') + (appendToUserPrompt ? `\n\n${appendToUserPrompt}` : ''), selectionText, contextText, featureId });
  console.log('[AI REQUEST]', {
    featureId,
    providerId: provider.id,
    providerBaseUrl: provider.baseUrl,
    model: preset.model,
    selectionText,
    contextText,
    presetId: preset.id,
    temperature,
    maxTokens,
    stream,
    hasAppendInstruction: !!appendToUserPrompt,
  hasResponseFormat: !!responseFormat,
  });
  console.log('[AI PROMPT MESSAGES]', messages);

  const started = performance.now();
  let status: 'ok'|'error'|'aborted' = 'ok';
  let errMsg: string | null = null;
  let final = '';
  try {
    if (stream && client.supportsStreaming) {
      await client.stream(messages, {
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        organizationId: provider.organizationId,
        projectId: provider.projectId,
        model: preset.model,
        temperature,
        maxTokens,
  responseFormat,
        signal,
        onToken: (d) => {
          final += d;
          onDelta?.(d);
          // Log each streamed token
          console.log('[AI STREAM TOKEN]', d);
        },
        onDone: () => {
          console.log('[AI STREAM FINAL]', final);
          onDone?.(final);
        },
        onError: (e) => { console.error('[AI STREAM ERROR]', e); throw e; },
      });
    } else {
      final = await client.complete(messages, {
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        organizationId: provider.organizationId,
        projectId: provider.projectId,
        model: preset.model,
        temperature,
        maxTokens,
  responseFormat,
        signal,
      });
      console.log('[AI RESPONSE]', final);
      onDone?.(final);
    }
  } catch (e: any) {
    if (signal?.aborted) { status = 'aborted'; errMsg = 'aborted'; }
    else { status = 'error'; errMsg = e?.message || String(e); onError?.(errMsg || 'error'); }
    console.error('[AI ERROR]', errMsg);
  } finally {
    const durationMs = Math.round(performance.now() - started);
    // naive token estimation
    const inputTokens = Math.round((selectionText.length + (preset.systemPrompt?.length || 0) + (preset.customPrompt?.length || 0)) / 4);
    const outputTokens = Math.round(final.length / 4);
    logUsage({ featureId, providerId: provider.id, model: preset.model, inputTokens, outputTokens, costUsd: null, durationMs, status, errorMessage: errMsg, meta: { presetId: preset.id } });
  }
}

function resolvePreset(feature: AIFeatureConfig, presetId?: string): AIFeaturePreset | undefined {
  if (presetId) return feature.presets.find(p => p.id === presetId && (p.enabled ?? true));
  return feature.presets.find(p => p.enabled ?? true) || feature.presets[0];
}
