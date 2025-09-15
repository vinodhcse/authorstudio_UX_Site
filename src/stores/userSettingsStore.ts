import { load } from '@tauri-apps/plugin-store';

export type AIProviderId = 'system' | 'openrouter' | 'together' | 'openai' | 'claude' | 'google' | 'ollama' | 'anthropic' | string;

export interface AIProvider {
  id: AIProviderId;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  projectId?: string;
  spend?: number; // online-only
  limit?: number; // optional budget
  // Optional branding to display in UI
  logoAssetId?: string; // Resolve with SimpleAssetService
  logoUrl?: string;     // Fallback direct URL
}

export interface AIFeaturePreset {
  id: string;
  name: string;
  provider: AIProviderId;
  model: string;
  systemPrompt: string;
  customPrompt?: string;
  enabled?: boolean;
  label?: string;
}

export interface AIFeatureConfig {
  id: string; // e.g., 'rephrasing'
  enabled: boolean;
  label: string;
  presets: AIFeaturePreset[];
}

export interface AISettings {
  aiEnabled: boolean;
  providers: AIProvider[];
  features: AIFeatureConfig[];
}

// Matches Editor.tsx TypographySettings contract for global defaults
export interface TypographySettingsJSON {
  fontFamily: string;
  fontSize: string;
  textIndent: string;
  chicagoStyle: boolean;
  lineHeight: string;
  paragraphSpacing: string;
  pageWidth: string;
  textAlignment: string;
  sceneDivider: string;
  typewriterMode: boolean;
  rememberPosition: boolean;
}

export interface UserSettings {
  id?: string;
  email?: string;
  name?: string;
  globalRole?: string;
  createdAt?: string;
  userProfile?: {
    avatarPath?: string;
  avatarAssetId?: string;
  coverPath?: string; // local filesystem path for profile cover
  coverAssetId?: string; // asset system id for profile cover
    hideAvatar?: boolean;
    phone?: string;
    link?: string;
    description?: string;
  };
  settings: {
    aiSettings: AISettings;
    theme?: {
      color?: string;
      customColorHex?: string;
    };
    project?: {
      typographySettings: TypographySettingsJSON; // global default for editor
    };
    collaboration?: {
      copyAllowed: boolean;
      allowComments: boolean;
      allowSuggestions: boolean;
      allowTrackChanges: boolean;
    };
    advanced?: {
      temperature: number;
      maxTokens: number;
      validationLevel: 'balanced' | 'strict' | 'lenient';
      tonePreset: 'conversational' | 'formal' | 'casual' | 'authoritative' | string;
      maxSentenceLength: 'short' | 'medium' | 'long';
      vocabularyComplexity: 'simple' | 'medium' | 'advanced';
    };
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  settings: {
    aiSettings: {
      aiEnabled: true,
      providers: [
        { id: 'system', name: 'System', enabled: true },
      ],
      features: [
  { id: 'rephrasing', label: 'Rephrasing', enabled: true, presets: [ { id: 'preset-rephrasing-default', name: 'System Default', provider: 'system', model: 'default',
    systemPrompt: `You are a master storyteller and world-class literary editor.
Rephrase the provided text to elevate tone and clarity while preserving meaning.

Guidelines:
1) Enrich language with vivid but concise prose.
2) Improve rhythm and flow; keep sentences readable.
3) Preserve plot, intentions, and key details; don’t introduce new facts.
4) Maintain paragraph structure one-to-one with input.
5) Use any surrounding context only as reference, not to add content.

Output: Return only the rephrased paragraph as plain text (no quotes, no JSON, no commentary).`,
    customPrompt: 'Make the tone more engaging and vivid.', enabled: true } ] },
  { id: 'rephrase_multiple_lines', label: 'Rephrase (Multiple Lines)', enabled: true, presets: [ { id: 'preset-rephrase-ml-default', name: 'System Default (JSON)', provider: 'system', model: 'default',
    systemPrompt: `You are a master storyteller and a world-class literary editor. Respond only with JSON.
You will receive multiple lines (paragraph groups). For each group, produce exactly one improved paragraph.

Guidelines:
1) Enrich language and elevate prose; keep meaning intact.
2) Do not merge separate groups; map one input group -> one output paragraph.
3) Maintain structure and avoid adding new facts or characters.
4) Use any <textBefore>/<textAfter>/<PlotContext> references only for consistency.

Streaming: Emit one JSON object at a time; no code fences.
Shape: {"pairs": [{"original": string[], "rephrased": string}, ...]}`,
    customPrompt: 'Follow the instructions and stream JSON objects one-by-one.', enabled: true } ] },
  { id: 'expanding', label: 'Expanding', enabled: true, presets: [ { id: 'preset-expanding-default', name: 'System Default', provider: 'system', model: 'default',
    systemPrompt: 'You are a creative writer. Expand the input with vivid sensory details and inner thoughts while keeping intent intact. Return only expanded text.', customPrompt: 'Lean into imagery and emotional texture.', enabled: true } ] },
  { id: 'concising', label: 'Concising', enabled: true, presets: [ { id: 'preset-concising-default', name: 'System Default', provider: 'system', model: 'default',
    systemPrompt: 'You are a concise editor. Shorten the text while retaining meaning and voice. Return only the shortened text—no explanations.', customPrompt: 'Eliminate redundancy; keep vivid details that matter.', enabled: false } ] },
  { id: 'generating', label: 'Generating new lines', enabled: true, presets: [ { id: 'preset-generating-default', name: 'System Default', provider: 'system', model: 'default',
    systemPrompt: 'Generate 1-3 coherent next lines consistent with the given context. Return only the generated lines.', customPrompt: 'Honor tone and style of the context.', enabled: true } ] },
  { id: 'validation', label: 'Validation', enabled: true, presets: [ { id: 'preset-validation-default', name: 'System Default', provider: 'system', model: 'default',
    systemPrompt: 'Validate grammar, clarity, and style issues; list concise notes. Keep suggestions actionable.', customPrompt: '', enabled: true } ] },
  { id: 'planning', label: 'Auto-updating Planning Boards', enabled: true, presets: [ { id: 'preset-planning-default', name: 'System Default', provider: 'system', model: 'default',
    systemPrompt: 'Summarize recent changes and update planning artifacts (beats/notes) succinctly.', customPrompt: '', enabled: true } ] },
  { id: 'suggestions', label: 'Auto-suggest Next Lines', enabled: true, presets: [ { id: 'preset-suggestions-default', name: 'System Default', provider: 'system', model: 'default',
    systemPrompt: 'Suggest the next sentence or two consistent with the current context. Return only the suggestion.', customPrompt: '', enabled: true } ] },
      ],
    },
    project: {
      typographySettings: {
        fontFamily: 'Georgia, serif',
        fontSize: 'text-base',
        textIndent: 'none',
        chicagoStyle: false,
        lineHeight: 'normal',
        paragraphSpacing: '0.5em',
        pageWidth: 'medium',
        textAlignment: 'left',
        sceneDivider: 'asterisks',
        typewriterMode: false,
        rememberPosition: true,
      },
    },
    theme: { color: 'blue', customColorHex: '#0000FF' },
    collaboration: { copyAllowed: true, allowComments: true, allowSuggestions: true, allowTrackChanges: false },
    advanced: { temperature: 0.7, maxTokens: 1000, validationLevel: 'balanced', tonePreset: 'conversational', maxSentenceLength: 'medium', vocabularyComplexity: 'medium' },
  },
};

let storePromise: Promise<any> | null = null;
function getStore() {
  if (!storePromise) {
    storePromise = load('user_data.json', { autoSave: false, defaults: {} });
  }
  return storePromise;
}

const KEY = 'user_settings';

export async function loadUserSettings(): Promise<UserSettings> {
  try {
    const store = await getStore();
    const v = (await store.get(KEY)) as UserSettings | undefined;
    let settings = v ?? structuredClone(DEFAULT_SETTINGS);
    // Migration: ensure new features added to defaults exist
    try {
      const have = new Set((settings.settings?.aiSettings?.features || []).map(f => f.id));
      const defaults = DEFAULT_SETTINGS.settings.aiSettings.features;
      const missing = defaults.filter(df => !have.has(df.id));
      if (missing.length > 0) {
        settings = {
          ...settings,
          settings: {
            ...settings.settings,
            aiSettings: {
              ...settings.settings.aiSettings,
              features: [...settings.settings.aiSettings.features, ...missing],
            }
          }
        } as UserSettings;
        await saveUserSettings(settings);
      }
    } catch {}
    return settings;
  } catch (e) {
    console.warn('Failed to load user settings, using defaults', e);
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const store = await getStore();
  await store.set(KEY, settings);
  await store.save();
  try {
    // Notify listeners in the app so views (e.g., BookForge) can live-refresh AI settings
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user_settings:changed'));
    }
  } catch {}
}

export function getDefaultUserSettings(): UserSettings {
  return structuredClone(DEFAULT_SETTINGS);
}
