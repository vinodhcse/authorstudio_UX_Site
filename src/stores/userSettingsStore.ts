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
  // Divider image persistence (optional)
  sceneDividerImage?: string; // URL (data: or convertFileSrc)
  sceneDividerImageWidth?: number; // px width for image
  sceneDividerImageAssets?: string[]; // previously uploaded images gallery
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
  { id: 'transcript_editor', label: 'Transcript Editor (Dictation Cleanup)', enabled: true, presets: [ { id: 'preset-transcript-editor-default', name: 'System Default', provider: 'system', model: 'default',
  systemPrompt: `📖 Novel Transcript Editing Prompt

System Role:
You are a professional novel editor. You will receive a raw transcript from a dictation system. Your task is to produce a clean, novel-ready version of the text.

✅ Editing Rules

Spelling, Grammar & Punctuation

Correct all errors while maintaining a natural narrative style.

Glossary Enforcement

Always use the provided glossary of proper names and terms.

Prefer these spellings over Whisper’s guesses.

Do NOT alter them unless context makes it clearly incorrect.

Paragraph Formatting

Break text into natural, novel-style paragraphs.

Start a new paragraph when:

- A new person begins speaking.
- The narration shifts focus.

Dialogue Handling

Wrap all spoken dialogue in double quotes ("...").

Keep speaker attribution in the same paragraph as their spoken words.

If the attribution comes before dialogue → keep it together.

If attribution follows dialogue → place it after the closing quote, in the same line.

Contextual Corrections

Replace out-of-context or misheard words with the most likely intended words using the glossary and surrounding context.

Style

Maintain a polished, readable flow as if this were the final manuscript draft.

📘 Output

A fully edited transcript with:

- Correct names and glossary terms.
- Proper paragraph and dialogue formatting.
- A natural novel-ready flow.

STRICT OUTPUT CONSTRAINTS (must-follow):

- Return ONLY the final edited transcript as plain text.
- Do NOT include analysis, reasoning, explanations, notes, questions, or “Key Edits”.
- Do NOT include any tags (such as <think>), headings, labels, or markdown/code fences.
- Do NOT preface with phrases like “Here’s the polished version” — output ONLY the manuscript text.
- Keep only normal paragraph breaks and dialogue quotes per the rules above.

📚 Glossary 

Characters

Objects / Places

Specific Terms`,
    customPrompt: '', enabled: true } ] },
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
  // Scene tools
  { id: 'summarize_scene', label: 'Summarize Scene', enabled: true, presets: [ { id: 'preset-summarize-scene-default', name: 'System Default', provider: 'system', model: 'default',
    systemPrompt: `You are an expert novel summarizer.

Your task: Given a scene excerpt and minimal context, produce a concise, faithful summary.

Rules:
- Max length: 120 words.
- Language: project language spelling and grammar.
- Output: one or more paragraphs of running text only (no lists, no headings, no prefaces).
- Do NOT begin with phrases like “In this scene” or “Here is”.
- Use third person, present tense.
- Prefer character names over pronouns (avoid he/she/they when a name is available).
- Mention characters by their names, never by roles.
- Assume the reader knows the story bible; do not explain who characters/locations are.
- Start a new paragraph whenever there is a major time or location change or a long sequence of events.
- Exclude backstory unless it directly drives current plot movement.
- Exclude mundane actions and background filler unless plot-relevant.
- Exclude introspection and moralizing; stick to observable story actions and consequences.
- Keep only key plot beats and stakes; compress dialogue into actions/decisions/conflicts.
- Do not provide analysis, commentary, or opinions.
- Do not include <think>, chain-of-thought, reasoning traces, reflections, or any hidden/internal thoughts. Think silently and output only the final summary.
- Do not include code fences, XML/HTML/markdown tags, JSON, or any labels like "Final answer:" — return plain text paragraphs only.
 - When you finish thinking, output ONLY the final summary wrapped exactly as: <final>...summary...</final>. No other tags or prefaces.

Quality heuristics:
- Make time/place clear when they shift.
- Prefer actions/conflicts/consequences over small talk or description.
- Collapse verbose sequences into decisive beats (argument, decision, reversal, reveal, consequence).`, customPrompt: '', enabled: true } ] },
  { id: 'detect_entities', label: 'Detect Characters & World Entities', enabled: true, presets: [ { id: 'preset-detect-entities-default', name: 'System Default (JSON)', provider: 'system', model: 'default',
    systemPrompt: `You are an accurate information extractor for fiction manuscripts.

Task:
From the given scene excerpt, extract the following as STRICT JSON (UTF-8, no trailing commas, no comments, no markdown fencing).

Output schema (all fields required; use empty arrays/strings if not found):
{
  "povCharacterName": "string",
  "characters": [ { "name": "string", "aliases": ["string", ...], "firstSeenInThisScene": boolean } ],
  "locations": [ { "name": "string", "aliases": ["string", ...], "firstSeenInThisScene": boolean } ],
  "objects": [ { "name": "string", "aliases": ["string", ...], "firstSeenInThisScene": boolean } ],
  "lore": [ { "name": "string", "aliases": ["string", ...], "firstSeenInThisScene": boolean } ],
  "timelineEvents": [ { "when": "string", "where": "string", "who": ["string", ...], "what": "string", "consequence": "string" } ]
}

Rules:
- Extract ONLY what appears in the excerpt. Do NOT invent names, places, objects, or lore.
- Prefer proper names. Ignore anonymous crowds unless named.
- Normalize duplicates (e.g., "Jon", "Jonathan" -> name: "Jonathan", alias: "Jon").
- Avoid pronouns in lists; use the canonical name string instead.
- "povCharacterName" is the focalizer for THIS scene excerpt (close/internal camera). If ambiguous, set "".
- Keep timelineEvents concise; do not exceed 12 events.
- If a thing appears significant but unnamed (e.g., “ancient amulet”), include it as objects.name with the phrase as-is.
- Return JSON only.`, customPrompt: '', enabled: true } ] },
  // Character Builder features (per accordion)
  { id: 'cb_identity', label: 'CharacterProfileBuilder — Identity', enabled: true, presets: [ { id: 'preset-cb-identity', name: 'System Default (JSON)', provider: 'system', model: 'default',
    systemPrompt: `You are building a character's identity section from a reference description. Respond only with JSON matching schema.
Input: a short reference phrase (e.g., "A wanderer like Aragorn").
Output JSON keys: { fullName: string, aliases: string[], gender: string, pronouns: string, age: number, species: string, occupation: string, citizenship: string, lifestyle: string, characterRole: string, characterType: string }.
Rules: Fill what you can plausibly infer from reference; leave unknowns as empty string or [] (age as null). No extra keys, no code fences.`, customPrompt: '', enabled: true } ] },
  { id: 'cb_appearance', label: 'CharacterProfileBuilder — Appearance', enabled: true, presets: [ { id: 'preset-cb-appearance', name: 'System Default (JSON)', provider: 'system', model: 'default',
    systemPrompt: `You are building a character's appearance from a reference description (e.g., "looks like Harry Potter"). Respond only with JSON.
Output JSON keys: { height: string, build: string, hairColor: string, hairStyle: string, eyeColor: string, eyeShape: string, faceShape: string, vision: string, skinTone: string, distinguishingFeatures: string[], distinguishingMarks: string, accessories: string[], health: string, clothingStyle: string, mannerisms: string[], physicalQuirks: string[], disabilities: string, appearanceSummary: string }.
Rules: Be faithful to the reference archetype; avoid copyrighted specifics; leave unknowns empty; no code fences. For appearanceSummary, write a vivid 5-10 line plain-text description of the character's actual appearance (no lists, no headings).`, customPrompt: '', enabled: true } ] },
  { id: 'cb_personality', label: 'CharacterProfileBuilder — Personality', enabled: true, presets: [ { id: 'preset-cb-personality', name: 'System Default (JSON)', provider: 'system', model: 'default',
    systemPrompt: `You map a reference persona to a personality profile. Respond only with JSON.
Output JSON keys: { personalityType: string, traits: string[], coreTraits: string[], positiveTraits: string[], goals: string[], beliefs: string[], strengths: string[], weaknesses: string[], motto: string, fears: string[], desires: string[], internalConflicts: string[], externalConflicts: string[], dialogueQuirks: string[], personality: string, dominantTrait: string, selfPerception: string, othersPerception: string, mentalHealth: string, secrets: string[] }.
Rules: Use general archetypal traits; keep concise; no code fences.`, customPrompt: '', enabled: true } ] },
  { id: 'cb_backstory', label: 'CharacterProfileBuilder — Backstory', enabled: true, presets: [ { id: 'preset-cb-backstory', name: 'System Default (JSON)', provider: 'system', model: 'default',
    systemPrompt: `You draft a plausible backstory outline from a reference. Respond only with JSON.
Output JSON keys: { backstory: string, birthplace: string, childhood: string, family: object, education: string, majorEvents: string[], achievements: string[], failures: string[], romanticHistory: string, reputation: string, spiritualBeliefs: string }.
Rules: Keep it neutral and non-copyright-lifting; concise; no code fences.`, customPrompt: '', enabled: true } ] },
  { id: 'cb_skills', label: 'CharacterProfileBuilder — Skills & Abilities', enabled: true, presets: [ { id: 'preset-cb-skills', name: 'System Default (JSON)', provider: 'system', model: 'default',
    systemPrompt: `You infer skills/abilities from a reference archetype. Respond only with JSON.
Output JSON keys: { primarySkills: string[], weaponsMastery: object, magicalAbilities: string[], combatSkills: string[], specialTalents: object, limitations: string[], signatureMove: string }.
Rules: Plausible, concise; no copyrighted moves; no code fences.`, customPrompt: '', enabled: true } ] },
  { id: 'cb_relationships', label: 'CharacterProfileBuilder — Relationships', enabled: true, presets: [ { id: 'preset-cb-relationships', name: 'System Default (JSON)', provider: 'system', model: 'default',
    systemPrompt: `You infer social ties from a reference persona. Respond only with JSON.
Output JSON keys: { relationships: string[], groupAffiliations: string[], rivalries: string[], influence: string }.
Rules: Avoid copyrighted proper nouns; keep generic; no code fences.`, customPrompt: '', enabled: true } ] },
  // Character Image Generation (prompts only; UI generates previews)
  { id: 'character_image_prompt', label: 'Character Image Generation', enabled: true, presets: [ { id: 'preset-character-image-prompt', name: 'Default (Prompts → Images)', provider: 'system', model: 'default',
    systemPrompt: `You are an expert visual prompt designer for character portrait generation that will feed directly into an image model. Respond ONLY with strict JSON.

Input: Character details (name, species/humanity, gender, age band, appearance summary, clothing, mood, genre/world hints).

Goal: Produce 4 distinct but faithful prompt strings to generate portrait variations of this character. Each should be a single line, concise but descriptive, ready for direct use with a diffusion/transformer image model.

Rules:
- Portrait or bust framing; character centered; neutral background unless specified.
- Respect appearance summary (hair/eyes/skin/build/age/gender/species) faithfully.
- Avoid copyrighted names/brands/styles; describe style generically ("cinematic lighting", "painterly", "illustrative").
- No camera model or lens jargon unless necessary.
- No negative content.
- JSON ONLY with shape: {"prompts": [string, string, string, string]}.` , customPrompt: '', enabled: true } ] },


  // Character image generation (provider-agnostic; Account can set provider/models)
  { id: 'character_image_generate', label: 'Character Image — Generate', enabled: true, presets: [
    { id: 'preset-image-preview', name: 'Preview (fast)', provider: 'system', model: 'image-preview-fast', systemPrompt: '', customPrompt: '', enabled: true },
    { id: 'preset-image-final', name: 'Final (HQ)', provider: 'system', model: 'image-final-hq', systemPrompt: '', customPrompt: '', enabled: true },
  ] },
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
  sceneDividerImage: undefined,
  sceneDividerImageWidth: 400,
  sceneDividerImageAssets: [],
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

// Convenience: patch and persist only typography settings
export async function updateTypographySettings(patch: Partial<TypographySettingsJSON>): Promise<UserSettings> {
  const current = await loadUserSettings();
  const prev = current.settings?.project?.typographySettings ?? DEFAULT_SETTINGS.settings.project!.typographySettings;
  const next: TypographySettingsJSON = { ...prev, ...patch } as TypographySettingsJSON;
  const updated: UserSettings = {
    ...current,
    settings: {
      ...current.settings,
      project: {
        ...(current.settings.project || {}),
        typographySettings: next,
      }
    }
  };
  await saveUserSettings(updated);
  return updated;
}
