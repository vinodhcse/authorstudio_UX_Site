
# PRD — Dynamic, Preset-Driven, Frontend-Only AI Routing
**Product**: AuthorStudio (Tauri + React + TipTap)  
**Owner**: Vinodh Ganesan  
**Date**: 2025‑09‑12  
**Version**: 1.0

---

## 1) Objectives

1. Each AI Feature (Rephrase, Rephrase‑Compare, Expand, Shorten, Generate, Validate, etc.) must run using a **Preset** → (Provider + Model + Prompts).
2. Invoke providers **directly from the frontend** (Tauri/React). **No backend proxy** required.
3. Preserve Together‑style **live streaming** into TipTap and **AIPopup** (Accept / Reject / Stop).
4. Log **usage statistics** to a **Dexie** (IndexedDB) table for offline‑first storage; later **sync** to BE credits API.

---

## 2) Non‑Goals

- Detailed billing dashboards (keep placeholders in Account → Billing).  
- Provider model autodiscovery/catalog (optional future work).  
- Server‑side rate limiting or key rotation.

---

## 3) User Stories

1. As a writer, I select text and click **Rephrase** → the app uses my **Rephrase → “Concise‑GPT”** preset (OpenAI gpt‑4o‑mini + custom prompt) and streams output with Accept/Reject.
2. I switch to **“Flowery‑Gemini”** → same button now calls Google Gemini 1.5 with my prompt, no code changes to features.
3. I define a **Compare Rephrase** preset that yields multiple alternatives (same or mixed providers), and the popup shows a side‑by‑side comparison.

---

## 4) Architecture Overview

### 4.1 Concepts
- **AISettings (existing)**: `providers[]` and `features[].presets[]` (managed in Account → AI Settings).
- **Preset Resolver**: picks the **first enabled preset** for a feature (or a specific `presetId`).
- **Provider Registry**: maps `providerId` → **client adapter** implementing a common interface.
- **Prompt Builder**: composes `systemPrompt`, optional `customPrompt`, selection text, context, and advanced knobs.
- **Streaming Helper**: normalizes fetch stream handling across OpenAI‑style SSE, Anthropic, Gemini, and Ollama.
- **Usage Logger (Dexie)**: local, offline‑first; later `syncUsage()` posts to BE to update user credits.

### 4.2 Sequence
1. User triggers feature → `runFeature(featureId, { selectionText, contextText, presetId? })`
2. Resolve preset → find provider credentials from `AISettings.providers`.
3. `registry.getClient(providerId)` → concrete client (openai/together/openrouter/gemini/anthropic/ollama).
4. `client.stream(messages, opts)` → tokens into AIPopup + TipTap; AbortController handles **Stop**.
5. On finish/error/abort → `logUsage()` in Dexie; optional `syncUsage()` later.

---

## 5) Data Model

### 5.1 AI Settings (unchanged; shown for reference)
```ts
type AIProviderId = 'system'|'openrouter'|'together'|'openai'|'anthropic'|'google'|'ollama'|string;
interface AIProvider { id: AIProviderId; name: string; enabled: boolean; apiKey?: string; baseUrl?: string;
  organizationId?: string; projectId?: string; spend?: number; limit?: number; logoAssetId?: string; logoUrl?: string; }
interface AIFeaturePreset { id: string; name: string; provider: AIProviderId; model: string;
  systemPrompt: string; customPrompt?: string; enabled?: boolean; label?: string; }
interface AIFeatureConfig { id: string; enabled: boolean; label: string; presets: AIFeaturePreset[]; }
interface AISettings { aiEnabled: boolean; providers: AIProvider[]; features: AIFeatureConfig[]; }
```

### 5.2 Dexie Table (local usage log)
```ts
interface AIUsageRow {
  id: string; ts: number; featureId: string; providerId: string; model: string;
  inputTokens: number | null; outputTokens: number | null; costUsd: number | null;
  durationMs: number; status: 'ok'|'error'|'aborted'; errorMessage: string | null;
  projectId?: string; bookId?: string; meta?: any; synced?: 0|1;
}
```

---

## 6) Frontend‑Only Implementation (Files)

> Paths are suggestions. Keep your current naming if preferred. These are drop‑ins.

### 6.1 Shared Types — `src/ai/providers/base.ts`
```ts
export type ChatMessage = { role: 'system'|'user'|'assistant'; content: string };

export type ProviderCallOptions = {
  apiKey?: string; baseUrl?: string; organizationId?: string; projectId?: string;
  model: string; temperature?: number; maxTokens?: number; topP?: number;
  signal?: AbortSignal; onToken?: (delta: string) => void; onDone?: (final: string) => void; onError?: (err: Error) => void;
  extra?: Record<string, any>;
};

export interface AIProviderClient {
  id: string; name: string; supportsStreaming: boolean;
  complete(messages: ChatMessage[], opts: ProviderCallOptions): Promise<string>;
  stream(messages: ChatMessage[], opts: ProviderCallOptions): Promise<void>;
}
```

### 6.2 Streaming Helper — `src/ai/streamingHelper.ts`
- Normalizes OpenAI SSE, JSONL, and Gemini stream formats.
- Emits `onToken(delta)` and `onDone(finalText)`.
(Full code provided in the implementation bundle.)

### 6.3 OpenAI‑Compatible Clients — `src/ai/providers/openaiLike.ts`
- **OpenAI**, **Together**, **OpenRouter** share OpenAI’s `/chat/completions` surface.
- `makeOpenAICompatibleClient(id, name, defaultBase)` returns `AIProviderClient`.
- Concrete exports: `OpenAIClient`, `TogetherClient`, `OpenRouterClient`.

### 6.4 Anthropic (Claude) — `src/ai/providers/anthropic.ts`
- Uses `/v1/messages` with `anthropic-version` header.
- Streams using Anthropic’s server‑sent events.

### 6.5 Google Gemini — `src/ai/providers/google.ts`
- `generateContent` (non‑stream) and `streamGenerateContent` (SSE) under `v1beta`.
- Maps `systemInstruction` and `contents` with role→parts.

### 6.6 Ollama (Local) — `src/ai/providers/ollama.ts`
- Calls `http://localhost:11434/api/chat` with `stream: true`.
- Reads NDJSON lines to accumulate `message.content` deltas.

### 6.7 Registry — `src/ai/registry.ts`
- `getClient(providerId)` returns the correct adapter.
- Registers: `openai`, `together`, `openrouter`, `google`, `anthropic`, `ollama`.

### 6.8 Prompt Builder — `src/ai/prompt/promptBuilder.ts`
- Assembles `systemPrompt`, `customPrompt`, selection + context, and advanced knobs into `ChatMessage[]`.
- Returns: `[ {role:'system'}, {role:'user'} ]` messages.

### 6.9 Feature Runner — `src/ai/runFeature.ts`
- Resolves feature + preset + provider config from `AISettings`.
- Builds messages, calls `client.stream(...)` with AbortController support.
- On completion/error: logs usage to Dexie.

### 6.10 Dexie Usage Store — `src/db/usage.ts`
- `logUsage(partial)` → inserts `ai_usage` row (synced=0).
- `syncUsage(pushFn)` → uploads unsynced rows, then marks as synced.

---

## 7) Wiring Into TipTap + AIPopup

Replace old Together‑only entry points with:
```ts
import { runFeature } from '@/ai/runFeature';

const abortRef = new AbortController();

await runFeature({
  featureId: 'rephrasing',
  settings: userSettings.settings.aiSettings,
  selectionText,
  contextText, // optional: surrounding text/metadata
  advanced: userSettings.settings.advanced, // temperature, maxTokens, tone, etc.
  signal: abortRef.signal,
  onDelta: (s) => AIPopupMenu.appendStream(s),
  onDone:  (final) => AIPopupMenu.finish(final),
  onError: (e) => AIPopupMenu.error(e.message),
});

// Stop button in AIPopup:
abortRef.abort();
```

**Notes:**
- Ensure the **Providers** tab holds valid `apiKey`/`baseUrl` for each provider.
- Presets determine **provider + model + prompts** per feature.
- If `presetId` is omitted, the **first enabled** preset is used.

---

## 8) Security & Offline

- Keys are user‑provided and stored via Tauri store; never log keys.
- **Ollama** presets enable offline generation.
- Use `organizationId/projectId` fields where providers support them.

---

## 9) Usage & Cost

- Current implementation **estimates tokens** via char length (÷4). Replace with:
  - Provider response usage fields (if available), or
  - A **price map** (USD/1k tokens) to compute `costUsd`.
- Dexie keeps usage rows for historical analytics and BE sync.

---

## 10) Future Enhancements (Optional)

- **Model Catalog**: fetch and cache model lists (OpenRouter catalog, OpenAI/Together known sets).
- **Preset Priorities**: weight‑based selection or feature‑level default preset.
- **Multi‑Variant Compare**: run N presets concurrently and present a comparison UI.
- **Guardrails**: length/JSON schema validators per feature.
- **Caching**: memoize (selection, prompt) → response for zero‑cost retries.

---

## 11) Acceptance Criteria

- [ ] Rephrase/Expand/Shorten all run via **presets** without code changes per provider.
- [ ] **Streaming** works with OpenAI, Together, OpenRouter, Anthropic, Gemini, and Ollama.
- [ ] **AIPopup Stop** cancels in‑flight requests (AbortController).
- [ ] **Usage row** written to Dexie on success, error, or abort.
- [ ] No backend is required for provider calls.
- [ ] Switching preset changes provider + model + prompts at runtime.

---

## 12) Implementation Checklist (Dev)

- [ ] Add files in `src/ai/**` and `src/db/usage.ts`.
- [ ] Replace Together‑only call sites with `runFeature(...)`.
- [ ] Wire **Stop** to `AbortController`.
- [ ] Ensure Account → AI Settings has correct provider keys and enabled presets.
- [ ] Validate streaming for at least 3 providers (e.g., OpenAI, Gemini, Anthropic).
- [ ] Manually verify Dexie `ai_usage` rows (DevTools → IndexedDB).

---

## 13) File Map (to hand to Copilot)

```
src/ai/providers/base.ts
src/ai/providers/openaiLike.ts
src/ai/providers/anthropic.ts
src/ai/providers/google.ts
src/ai/providers/ollama.ts
src/ai/registry.ts
src/ai/streamingHelper.ts
src/ai/prompt/promptBuilder.ts
src/ai/runFeature.ts
src/db/usage.ts
```
