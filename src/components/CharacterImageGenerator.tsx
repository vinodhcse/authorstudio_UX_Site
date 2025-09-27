import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Character, FileRef } from '../types';
import { loadUserSettings, type AISettings } from '../stores/userSettingsStore';
// import { runFeature } from '../ai/runFeature';
import { ImageGenService } from '../services/ImageGenService';
// import { AssetService } from '../services/AssetService';
import { useBookContextSafe, useCurrentBookAndVersion } from '../contexts/BookContext';

interface CharacterImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  bookId: string; // reserved for future asset import
  versionId: string; // reserved for future asset import
  onApplied?: (ref: FileRef, url?: string) => void;
}

// Tiny in-memory image generator placeholder.
// For now, we only generate prompts via AI, and rely on the user to upload one of the generated previews later.
// To simulate previews end-to-end, we build dummy images using Dicebear seeded by the prompts.
function previewFromPrompt(prompt: string, character: Character): string {
  const base = character.fullName || character.name || 'character';
  const seed = encodeURIComponent(`${base}-${prompt}`.slice(0, 100));
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

const CharacterImageGenerator: React.FC<CharacterImageGeneratorProps> = ({ isOpen, onClose, character, bookId: _bookId, versionId: _versionId, onApplied }) => {
  const [aiSettings, setAISettings] = useState<AISettings | null>(null);
  const [desc, setDesc] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // No prompt selection; images are generated from description
  const [previews, setPreviews] = useState<string[]>([]);
  const [finalizing, setFinalizing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [baseSeed, setBaseSeed] = useState<number | null>(null);
  const [style, setStyle] = useState<'realistic' | 'semi' | 'stylized'>('realistic');
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineOpts, setRefineOpts] = useState<{ seed?: number; steps?: number; width?: number; height?: number; negative?: string }>({});

  const STYLE_PRESETS: Record<string, { pos: string; neg: string }> = {
    realistic: {
      pos: 'portrait photo, photorealistic, natural lighting, realistic skin texture with pores, cinematic color grading, shallow depth of field, bokeh, DSLR 35mm, high dynamic range',
      neg: 'cartoon, anime, illustration, painting, cgi, 3d render, plastic skin, overprocessed, oversmoothed, lowres, deformed, extra fingers, extra limbs, watermark, text'
    },
    semi: {
      pos: 'semi-realistic, painterly detail but lifelike proportions, soft studio lighting, finely detailed skin texture',
      neg: 'flat cartoon, exaggerated anime, low detail, simplified shapes, lowres, deformed, extra fingers, watermark, text'
    },
    stylized: {
      pos: 'highly stylized, painterly, dramatic lighting and texture, expressive color grading',
      neg: 'photorealistic artifacts, uncanny valley skin, lowres, deformed, extra fingers, watermark, text'
    }
  };

  // Pull book metadata for prompt enrichment (genre/subgenre/timeline age)
  const bookCtx = useBookContextSafe();
  const { currentBook, currentVersion } = useCurrentBookAndVersion();
  const effectiveBook = useMemo(() => {
    // Prefer explicit IDs if provided, otherwise use currentBook from URL context
    if (bookCtx && _bookId) {
      try { return bookCtx.getBook(_bookId as any); } catch { /* ignore */ }
    }
    return currentBook || null;
  }, [bookCtx, _bookId, currentBook]);
  const effectiveVersion = currentVersion || null;

  useEffect(() => {
    let mounted = true;
    loadUserSettings().then(s => { if (mounted) setAISettings(s.settings.aiSettings); });
    return () => { mounted = false; };
  }, []);

  const seedText = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Name: ${character.fullName || character.name}`);
    if (character.species) parts.push(`Species: ${character.species}`);
    if (character.gender) parts.push(`Gender: ${character.gender}`);
    if (character.age) parts.push(`Age: ${character.age}`);
    // Prefer appearanceSummary if present in appearance/backstory fields
  const maybeSummary = (character as any).appearanceSummary || (character as any).clothingStyle || character.clothing || character.distinguishingMarks || character.build || '';
    if (maybeSummary) parts.push(`Appearance: ${maybeSummary}`);
    if (character.clothing) parts.push(`Clothing: ${character.clothing}`);
    if (character.role) parts.push(`Role: ${character.role}`);
    // Book context enrichment (genre/subgenre/timeline age)
    const genre = (effectiveBook as any)?.genre as string | undefined;
    const subgenre = (effectiveBook as any)?.subgenre as string | undefined;
    // best-effort timeline/era detection from book or version metadata
    const timeline = (effectiveBook as any)?.timelineAge
      || (effectiveBook as any)?.era
      || (effectiveBook as any)?.settingEra
      || (effectiveBook as any)?.setting?.era
      || (effectiveVersion as any)?.setting?.era
      || (effectiveVersion as any)?.worlds?.[0]?.era
      || (effectiveVersion as any)?.worlds?.[0]?.timeline?.age;
    const contextBits: string[] = [];
    if (genre) contextBits.push(`Genre: ${genre}${subgenre ? ` / ${subgenre}` : ''}`);
    if (timeline) contextBits.push(`Setting era: ${timeline}`);
    if (contextBits.length) parts.push(`Context: ${contextBits.join('; ')}`);
    return parts.join('\n');
  }, [character, effectiveBook, effectiveVersion]);

  // Prompt generation is optional and disabled for now.

  useEffect(() => {
    if (isOpen) {
      setDesc(seedText);
      // Prompt generation is optional; user can click 'Generate Prompts' if desired
    }
  }, [isOpen]);

  const buildPrompt = () => {
    // Use description if provided, else the enriched seedText
    const base = desc || seedText;
    const s = STYLE_PRESETS[style];
    // Append a short style hint to guide the model without overwhelming the base description
    return `${base}\nStyle: ${s.pos}`;
  };

  const buildNegativePrompt = () => {
    const s = STYLE_PRESETS[style];
    // Also layer our default technical negatives from the provider layer
    return s.neg;
  };

  const generatePreviews = async () => {
    if (!aiSettings) return;
    // Use selected prompt if present, otherwise fall back to the freeform description
    setLoading(true); setError(null);
    try {
  const basePrompt = buildPrompt();
      const seed = Math.floor(Math.random() * 1e9);
      setBaseSeed(seed);
      setSelectedIndex(null);
      try { if ((globalThis as any).__AI_DEBUG_HTTP) console.log('[CharacterImageGenerator] generatePreviews', { promptLen: basePrompt?.length, seed }); } catch {}
  const imgs = await ImageGenService.generatePreviews(aiSettings, { prompt: basePrompt, n: 4, steps: 4, presetId: 'preset-image-preview', seed, negative_prompt: buildNegativePrompt() });
      setPreviews(imgs);
    } catch (e: any) {
      try { if ((globalThis as any).__AI_DEBUG_HTTP) console.error('[CharacterImageGenerator] generatePreviews ERROR', e); } catch {}
      setError(e?.message || 'Failed to generate previews');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    // If we have previews, apply the first one for now (selection UI can be added later)
    let url: string | undefined;
    if (previews.length) {
      const idx = selectedIndex ?? 0;
      url = previews[idx] || previews[0];
    } else {
      // As a last resort, synthesize a placeholder image based on description
  const prompt = desc || seedText;
  url = previewFromPrompt(prompt, character);
    }
    onApplied?.({ assetId: '', role: 'avatar', sha256: '' } as any, url);
    onClose();
  };

  const finalizeHighQuality = async () => {
    if (!aiSettings) return;
    setFinalizing(true); setError(null);
    try {
  const basePrompt = buildPrompt();
      const seed = baseSeed != null && selectedIndex != null ? (baseSeed + selectedIndex) : undefined;
      try { if ((globalThis as any).__AI_DEBUG_HTTP) console.log('[CharacterImageGenerator] finalizeHighQuality', { promptLen: basePrompt?.length, seed }); } catch {}
  const url = await ImageGenService.generateHighQuality(aiSettings, { prompt: basePrompt, steps: 20, presetId: 'preset-image-final', seed, negative_prompt: buildNegativePrompt() });
      // Let parent persist via SimpleAssetService; we provide URL to show immediately.
      onApplied?.({ assetId: '', role: 'avatar', sha256: '' } as any, url);
      onClose();
    } catch (e: any) {
      try { if ((globalThis as any).__AI_DEBUG_HTTP) console.error('[CharacterImageGenerator] finalizeHighQuality ERROR', e); } catch {}
      setError(e?.message || 'Failed to generate high-quality image');
    } finally {
      setFinalizing(false);
    }
  };

  if (!isOpen) return null;

  // No prompt previews; image generation uses description directly

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-xl border border-black/10 dark:border-white/10 overflow-hidden"
      >
        <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generate Character Image</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Style selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Style</label>
            <select value={style} onChange={e=>setStyle(e.target.value as any)} className="text-sm bg-black/5 dark:bg-white/5 rounded-md px-2 py-1 text-gray-800 dark:text-gray-200">
              <option value="realistic">Photorealistic</option>
              <option value="semi">Semi-realistic</option>
              <option value="stylized">Stylized</option>
            </select>
            <span className="text-xs text-gray-500">Use Photorealistic to avoid cartoon/clipart artifacts.</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Appearance Description</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="mt-1 w-full p-3 text-sm bg-black/5 dark:bg-white/5 rounded-md text-gray-800 dark:text-gray-200 min-h-28" />
            <p className="mt-1 text-xs text-gray-500">Prefilled from character appearance; edit to refine.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={generatePreviews} disabled={loading || !aiSettings} className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Please wait…' : 'Generate Variations (Low)'}</button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>

          {/* Prompt choices */}
          {/* Prompt candidates removed (image generation uses description directly). */}

          {/* Generated low-quality previews */}
          {previews.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Variations (Low Quality)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((src, i) => {
                  const selected = i === selectedIndex;
                  return (
                    <div key={i} className={`relative rounded-lg overflow-hidden border ${selected ? 'border-blue-600 ring-2 ring-blue-400' : 'border-black/10 dark:border-white/10'} focus:outline-none`}> 
                      <button type="button" onClick={() => setSelectedIndex(i)} className="block w-full">
                      <img src={src} alt={`Var ${i+1}`} className="w-full aspect-[3/4] object-cover" style={{ objectPosition: '50% 20%' }} />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-black/30 backdrop-blur-sm p-2 flex justify-between items-center">
                        <button type="button" onClick={() => { setSelectedIndex(i); setRefineOpen(true); setRefineOpts({ seed: (baseSeed ?? 0) + i, steps: 8, width: 512, height: 768, negative: buildNegativePrompt() }); }} className="px-2 py-1 text-xs rounded-md bg-white/90 text-gray-900 hover:bg-white">Refine</button>
                        {selected && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Cancel</button>
          <button onClick={handleApply} disabled={previews.length === 0 || selectedIndex === null} className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50">Use Selected</button>
          <button onClick={finalizeHighQuality} disabled={finalizing || !aiSettings} className="px-4 py-2 rounded-md bg-purple-600 text-white disabled:opacity-50">{finalizing ? 'Generating HQ…' : 'Finalize (HQ)'}</button>
        </div>
        {/* Refine Modal */}
        {refineOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setRefineOpen(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-black/10 dark:border-white/10 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
              <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">Refine Variation {selectedIndex != null ? selectedIndex + 1 : ''}</h4>
                <button onClick={() => setRefineOpen(false)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-gray-500">Seed<input type="number" className="mt-1 w-full text-sm bg-black/5 dark:bg-white/5 rounded px-2 py-1" value={refineOpts.seed ?? ''} onChange={e=>setRefineOpts(o=>({ ...o, seed: e.target.value ? Number(e.target.value) : undefined }))} /></label>
                  <label className="text-xs text-gray-500">Steps<input type="number" className="mt-1 w-full text-sm bg-black/5 dark:bg-white/5 rounded px-2 py-1" value={refineOpts.steps ?? 12} onChange={e=>setRefineOpts(o=>({ ...o, steps: Number(e.target.value) }))} /></label>
                  <label className="text-xs text-gray-500">Width<input type="number" className="mt-1 w-full text-sm bg-black/5 dark:bg-white/5 rounded px-2 py-1" value={refineOpts.width ?? 768} onChange={e=>setRefineOpts(o=>({ ...o, width: Number(e.target.value) }))} /></label>
                  <label className="text-xs text-gray-500">Height<input type="number" className="mt-1 w-full text-sm bg-black/5 dark:bg-white/5 rounded px-2 py-1" value={refineOpts.height ?? 1152} onChange={e=>setRefineOpts(o=>({ ...o, height: Number(e.target.value) }))} /></label>
                </div>
                <label className="text-xs text-gray-500 block">Negative Prompt<textarea className="mt-1 w-full text-sm bg-black/5 dark:bg-white/5 rounded px-2 py-1 min-h-16" value={refineOpts.negative ?? buildNegativePrompt()} onChange={e=>setRefineOpts(o=>({ ...o, negative: e.target.value }))} /></label>
              </div>
              <div className="p-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-2">
                <button onClick={() => setRefineOpen(false)} className="px-3 py-1.5 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">Close</button>
                <button onClick={async ()=>{
                  if (!aiSettings) return;
                  const idx = selectedIndex ?? 0;
                  const prompt = buildPrompt();
                  setLoading(true); setError(null);
                  try {
                    const imgs = await ImageGenService.generatePreviews(aiSettings, {
                      prompt,
                      n: 4,
                      steps: refineOpts.steps ?? 8,
                      presetId: 'preset-image-preview',
                      seed: refineOpts.seed ?? ((baseSeed ?? 0) + idx),
                      negative_prompt: refineOpts.negative ?? buildNegativePrompt(),
                    });
                    setPreviews(imgs);
                    // keep modal open for iteration or close? We'll keep it open.
                  } catch (e: any) {
                    setError(e?.message || 'Failed to refine previews');
                  } finally {
                    setLoading(false);
                  }
                }} className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white">Regenerate 4</button>
                <button onClick={async ()=>{
                  if (!aiSettings) return;
                  const idx = selectedIndex ?? 0;
                  const prompt = buildPrompt();
                  setFinalizing(true); setError(null);
                  try {
                    const url = await ImageGenService.generateHighQuality(aiSettings, {
                      prompt,
                      steps: refineOpts.steps ?? 20,
                      presetId: 'preset-image-final',
                      seed: refineOpts.seed ?? ((baseSeed ?? 0) + idx),
                      negative_prompt: refineOpts.negative ?? buildNegativePrompt(),
                    });
                    onApplied?.({ assetId: '', role: 'avatar', sha256: '' } as any, url);
                    setRefineOpen(false);
                    onClose();
                  } catch (e: any) {
                    setError(e?.message || 'Failed to generate high-quality image');
                  } finally {
                    setFinalizing(false);
                  }
                }} className="px-3 py-1.5 text-sm rounded-md bg-purple-600 text-white">Finalize HQ</button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CharacterImageGenerator;
