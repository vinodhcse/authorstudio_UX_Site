import React, { useEffect, useState, useRef, useMemo } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon } from '../../constants';
import { XMarkIcon, Cog6ToothIcon, CreditCardIcon, UserCircleIcon, ChartBarIcon, CpuChipIcon, PlusIcon, ArrowUpRightIcon, Squares2X2Icon, PencilIcon, TrashIcon, CheckIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../auth';
import { AssetService } from '../../services/AssetService';
import { SimpleAssetService } from '../../services/SimpleAssetService';
import { apiClient } from '../../auth/apiClient';
import { 
  AISettings, 
  AIFeatureConfig, 
  AIProvider, 
  AIFeaturePreset, 
  TypographySettingsJSON,
  UserSettings, 
  loadUserSettings, 
  saveUserSettings, 
  getDefaultUserSettings 
} from '../../stores/userSettingsStore';
import { getClient } from '../../ai/registry';
import { getSessionRow, upsertSessionRow } from '../../auth/sqlite';

type TabKey = 'account' | 'subscription' | 'billing' | 'project' | 'ai';

export interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

const SectionCard: React.FC<{ title: string; description?: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, description, right, children }) => (
  <div className="rounded-xl border border-gray-200/50 dark:border-gray-800/60 bg-gradient-to-br from-gray-200/40 to-gray-50/40 dark:from-gray-900/60 dark:to-black/60 p-4 md:p-6 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const PillTab: React.FC<{ label: string; active?: boolean; onClick?: () => void; icon?: React.ReactNode }> = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
      active
        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
        : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300/60 dark:border-gray-700/60 hover:bg-gray-900/5 dark:hover:bg-white/5'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Unified form control styles for this modal (match other pages)
const fieldCls = 'w-full rounded-md border border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-sm px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500/60';
const selectCls = fieldCls + ' pr-8';
const textareaCls = fieldCls + '';

// Preset Modal
const PresetModal: React.FC<{
  open: boolean; onClose: () => void;
  preset: AIFeaturePreset | null;
  providers: AIProvider[];
  onSave: (p: AIFeaturePreset) => void;
  featureId?: string;
}> = ({ open, onClose, preset, providers, onSave, featureId }) => {
  const [draft, setDraft] = useState<AIFeaturePreset>(preset || { id: `new-${Date.now()}`, name: '', provider: providers[0]?.id || 'openai', model: 'gpt-4o-mini', systemPrompt: '', customPrompt: '', enabled: true, label: '' } as AIFeaturePreset);
  const [models, setModels] = useState<Array<{ id: string; label?: string; priceIn?: number; priceOut?: number; pricingUnit?: string; contextLength?: number; maxTokens?: number; supportsJson?: boolean; parametersBn?: number; raw?: any }>>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelQuery, setModelQuery] = useState('');
  const [showModelList, setShowModelList] = useState(false);
  useEffect(() => { if (preset) setDraft(preset); }, [preset]);
  const activeProvider = providers.find(p => p.id === draft.provider);
  const fetchModels = async () => {
    try {
      if (!activeProvider) return;
      const client = getClient(activeProvider.id);
      if (!client || !client.listModels) return;
      setModelsLoading(true);
      const list = await client.listModels({ apiKey: activeProvider.apiKey, baseUrl: activeProvider.baseUrl, organizationId: activeProvider.organizationId, projectId: activeProvider.projectId });
      setModels(list);
      // If current model not in list, keep it but suggest first
    } catch (e) {
      // swallow
    } finally {
      setModelsLoading(false);
    }
  };
  useEffect(() => { setModels([]); if (activeProvider?.apiKey || activeProvider?.baseUrl) { fetchModels(); } }, [draft.provider, activeProvider?.apiKey, activeProvider?.baseUrl]);
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div key="preset-overlay" className="fixed inset-0 z-[140] bg-black/50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} />
      <motion.div key="preset-dialog" className="fixed inset-0 z-[150] flex items-center justify-center p-4" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}}>
        <div className="w-full max-w-2xl rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-gray-100 to-white dark:from-gray-950 dark:to-black p-4 md:p-6" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Edit Preset</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><XMarkIcon className="h-5 w-5"/></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm mb-1">Preset Name</label>
              <input className={fieldCls} placeholder="e.g., Fast Rephrase" value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Label (optional)</label>
              <input className={fieldCls} placeholder="Shown in menus" value={draft.label||''} onChange={e=>setDraft({...draft, label:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Provider</label>
              <select className={selectCls} value={draft.provider} onChange={e=>setDraft({...draft, provider:e.target.value})}>
                {providers.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm mb-1">Model</label>
                <div className="text-[11px] text-gray-500 flex items-center gap-2">
                  {activeProvider?.apiKey ? <span>API key set</span> : <span>API key missing for {activeProvider?.name}</span>}
                  {activeProvider && <button className="px-2 py-0.5 rounded border text-xs" onClick={fetchModels} disabled={modelsLoading}>{modelsLoading? 'Loading…' : 'Refresh'}</button>}
                </div>
              </div>
              {models.length > 0 ? (
                <div className="relative">
                  <input
                    className={fieldCls}
                    placeholder="Search or type a model id"
                    value={modelQuery || draft.model}
                    onFocus={()=>setShowModelList(true)}
                    onChange={e=>{ setModelQuery(e.target.value); setShowModelList(true); }}
                    onBlur={()=> setTimeout(()=>setShowModelList(false), 150)}
                  />
                  {showModelList && (
                    <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-lg">
                      {models
                        .filter(m => {
                          const q = (modelQuery || '').toLowerCase();
                          if (!q) return true;
                          const t = `${m.id} ${m.label || ''}`.toLowerCase();
                          return t.includes(q);
                        })
                        .filter(m => {
                          // If editing the multi-line rephrase feature, prefer JSON-capable models
                          if (featureId === 'rephrase_multiple_lines') {
                            // Don't hide unknowns (undefined); exclude explicit non-JSON models
                            return m.supportsJson !== false;
                          }
                          return true;
                        })
                        // If this preset belongs to the multi-line rephrase feature, prefer JSON-capable models
                        .filter(m => {
                          // Heuristic: when editing a preset we don't have feature context in this component.
                          // We hint via preset name/label.
                          const needsJson = /multi[- ]?line|pairs|json/i.test(draft.name || '') || /json/i.test(draft.label || '');
                          return needsJson ? (m.supportsJson !== false) : true;
                        })
                        .map((m) => {
                          const priceBadge = (m.priceIn || m.priceOut)
                            ? `$${m.priceIn ?? '-'} / $${m.priceOut ?? '-'}${m.pricingUnit ? ' · ' + m.pricingUnit : ''}`
                            : '';
                          return (
                            <button
                              key={m.id}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between ${draft.model===m.id? 'bg-purple-500/10' : ''}`}
                              onMouseDown={(e)=> e.preventDefault()}
                              onClick={()=>{ setDraft({...draft, model: m.id}); setModelQuery(m.id); setShowModelList(false); }}
                              title={`Context: ${m.contextLength ?? '—'} · Max out: ${m.maxTokens ?? '—'} · JSON: ${m.supportsJson ? 'yes' : 'no'}${m.parametersBn? ' · Params: ' + m.parametersBn + 'B' : ''}`}
                            >
                              <span className="truncate">{m.label || m.id}</span>
                              {priceBadge && <span className="ml-2 text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">{priceBadge}</span>}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              ) : (
                <input className={fieldCls} placeholder="Enter model id" value={draft.model} onChange={e=>setDraft({...draft, model:e.target.value})} />
              )}
              {/* Guidance for JSON-backed features */}
              {(featureId === 'rephrase_multiple_lines' || /multi[- ]?line|pairs|json/i.test(draft.name || '') || /json/i.test(draft.label || '')) && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Tip: Choose a model that supports structured JSON output for best results.</div>
              )}
              <div className="text-[11px] text-gray-500 mt-1">Choose from fetched models when available, or type manually. Hover items for details.</div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.enabled} onChange={e=>setDraft({...draft, enabled:e.target.checked})}/> Enabled</label>
            <div className="col-span-2">
              <label className="block text-sm mb-1">System Prompt</label>
              <textarea className={textareaCls} rows={4} value={draft.systemPrompt} onChange={e=>setDraft({...draft, systemPrompt:e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm mb-1">Custom Prompt</label>
              <textarea className={textareaCls} rows={3} value={draft.customPrompt||''} onChange={e=>setDraft({...draft, customPrompt:e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md bg-gray-500/10 hover:bg-gray-500/20">Cancel</button>
            <button onClick={()=>{ onSave(draft); onClose(); }} className="px-3 py-1.5 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700">Save Preset</button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Provider Modal
const ProviderModal: React.FC<{ open:boolean; onClose:()=>void; onAdd:(p:AIProvider)=>void }>=({open,onClose,onAdd})=>{
  const PROVIDER_CATALOG: Array<AIProvider & { description: string; badge?: string }>= [
    { id:'openrouter', name:'OpenRouter', enabled:true, description:'Gateway to many commercial and NSFW models with routing.', badge:'Recommended' },
    { id:'openai', name:'OpenAI', enabled:true, description:'Popular GPT family models for general tasks.' },
    { id:'google', name:'Google AI Studio', enabled:true, description:'Access to latest Gemini/DeepMind models.', badge:'Beta' },
    { id:'anthropic', name:'Claude', enabled:true, description:'Claude models for reasoning and safety.' },
    { id:'ollama', name:'Ollama', enabled:true, description:'Run local models privately.' },
    { id:'lmstudio', name:'LM Studio', enabled:true, description:'Local inference with desktop app.' },
    { id:'together', name:'Together.ai', enabled:true, description:'Hosted open models with low latency.' },
    { id:'openpipe', name:'OpenPipe', enabled:true, description:'Prompt/Caching/Tuning pipeline.' },
    { id:'artai', name:'Art AI', enabled:true, description:'Creative AI services.' },
  ] as any;
  const [selected, setSelected]=useState<AIProvider & { description?: string } | null>(null);
  const [form, setForm]=useState<AIProvider>({ id:'custom', name:'Custom', enabled:true });
  const defaultBaseFor = (id?: string) => {
    switch(id){
      case 'openai': return 'https://api.openai.com';
      case 'openrouter': return 'https://openrouter.ai/api';
  case 'together': return 'https://api.together.ai';
      case 'anthropic': return 'https://api.anthropic.com';
      case 'google': return 'https://generativelanguage.googleapis.com';
      case 'ollama': return 'http://localhost:11434';
      case 'lmstudio': return 'http://localhost:1234/v1';
      default: return '';
    }
  };
  useEffect(()=>{ if(selected){ setForm({ id:selected.id, name:selected.name, enabled:true, baseUrl: defaultBaseFor(selected.id) }); } },[selected]);
  if(!open) return null;
  return (
    <AnimatePresence>
      <motion.div key="provider-overlay" className="fixed inset-0 z-[140] bg-black/50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
      <motion.div key="provider-dialog" className="fixed inset-0 z-[150] flex items-center justify-center p-4" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}}>
        <div className="w-full max-w-4xl rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-gray-100 to-white dark:from-gray-950 dark:to-black p-4 md:p-6" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-semibold">Add Provider</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><XMarkIcon className="h-5 w-5"/></button></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {PROVIDER_CATALOG.map(p=> (
                <button key={p.id} onClick={()=>setSelected(p)} className={`w-full text-left rounded-lg border px-3 py-3 hover:bg-gray-900/5 dark:hover:bg-white/5 ${selected?.id===p.id? 'border-purple-500/50' : 'border-gray-200/60 dark:border-gray-800/60'}`}>
                  <div className="flex items-center justify-between"><div className="font-medium">{p.name}</div>{p.badge && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300">{p.badge}</span>}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{(p as any).description}</div>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="rounded-md bg-white/60 dark:bg-white/10 border border-gray-300/60 dark:border-gray-700/60 px-3 py-2 text-sm" placeholder="Provider Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
                <input className="rounded-md bg-white/60 dark:bg-white/10 border border-gray-300/60 dark:border-gray-700/60 px-3 py-2 text-sm" placeholder="Provider ID" value={form.id} onChange={e=>setForm({...form, id:e.target.value})}/>
                <input className="col-span-2 rounded-md bg-white/60 dark:bg-white/10 border border-gray-300/60 dark:border-gray-700/60 px-3 py-2 text-sm" placeholder="API Key" value={form.apiKey||''} onChange={e=>setForm({...form, apiKey:e.target.value})}/>
                <div className="col-span-2">
                  <input className="w-full rounded-md bg-white/60 dark:bg-white/10 border border-gray-300/60 dark:border-gray-700/60 px-3 py-2 text-sm" placeholder="Base URL (optional)" value={form.baseUrl||''} onChange={e=>setForm({...form, baseUrl:e.target.value})}/>
                  <div className="text-[11px] text-gray-500 mt-1">Default: {defaultBaseFor(form.id) || '—'}</div>
                </div>
                <input className="rounded-md bg-white/60 dark:bg-white/10 border border-gray-300/60 dark:border-gray-700/60 px-3 py-2 text-sm" placeholder="Organization ID (optional)" value={form.organizationId||''} onChange={e=>setForm({...form, organizationId:e.target.value})}/>
                <input className="rounded-md bg-white/60 dark:bg-white/10 border border-gray-300/60 dark:border-gray-700/60 px-3 py-2 text-sm" placeholder="Project ID (optional)" value={form.projectId||''} onChange={e=>setForm({...form, projectId:e.target.value})}/>
              </div>
              <div className="flex justify-end"><button onClick={()=>{onAdd(form); onClose();}} className="px-3 py-1.5 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700">Add Provider</button></div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const AISettingsEditor: React.FC<{
  value: AISettings;
  onChange: (v: AISettings) => void;
  theme?: UserSettings['settings']['theme'];
  onThemeChange?: (t: NonNullable<UserSettings['settings']['theme']>) => void;
  collaboration?: UserSettings['settings']['collaboration'];
  onCollabChange?: (c: NonNullable<UserSettings['settings']['collaboration']>) => void;
  advanced?: UserSettings['settings']['advanced'];
  onAdvancedChange?: (a: NonNullable<UserSettings['settings']['advanced']>) => void;
}> = ({ value, onChange, theme, onThemeChange, collaboration, onCollabChange, advanced, onAdvancedChange }) => {
  const [providers, setProviders] = useState<AIProvider[]>(value.providers);
  const [features, setFeatures] = useState<AIFeatureConfig[]>(value.features);
  // Hold local drag ordering to avoid committing until drop
  const [localPresetOrders, setLocalPresetOrders] = useState<Record<string, AIFeaturePreset[]>>({});
  const [showPresetModal, setShowPresetModal] = useState(false);
  // Store featureId instead of filtered index to avoid mismatch when list is filtered
  const [presetTarget, setPresetTarget] = useState<{ featureId:string; pIdx:number }|null>(null);
  const [providerModal, setProviderModal] = useState(false);
  const [subTab, setSubTab] = useState<'providers'|'features'|'theme'|'collab'|'advanced'>('providers');
  // Track which provider card is in edit mode
  const [editingProviderIdx, setEditingProviderIdx] = useState<number | null>(null);
  const [featureQuery, setFeatureQuery] = useState('');
  // Tilt card wrapper (3D tilt akin to BookCard)
  const TiltCard: React.FC<{ className?: string; children: React.ReactNode; disabled?: boolean }> = ({ className, children, disabled }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-150, 150], [5, -5]);
    const rotateY = useTransform(x, [-150, 150], [-15, 15]);
    const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      x.set(e.clientX - rect.left - rect.width / 2);
      y.set(e.clientY - rect.top - rect.height / 2);
    };
    const onLeave = () => { x.set(0); y.set(0); };
    if (disabled) {
      return (
        <div className={className}>
          {children}
        </div>
      );
    }
    return (
      <motion.div onMouseMove={onMove} onMouseLeave={onLeave} whileHover={{ scale: 1.02 }} style={{ perspective: 1000, transformStyle: 'preserve-3d', rotateX, rotateY }} className={className}>
        {children}
      </motion.div>
    );
  };

  // Resolve optional asset-backed logos
  const useAssetUrl = (assetId?: string, directUrl?: string) => {
    const [url, setUrl] = useState<string | undefined>(directUrl);
    useEffect(() => {
      let cancelled = false;
      const run = async () => {
        if (assetId) {
          try {
            const u = await SimpleAssetService.loadAssetForDisplay(assetId);
            if (!cancelled) setUrl(u || directUrl);
          } catch {
            if (!cancelled) setUrl(directUrl);
          }
        } else {
          setUrl(directUrl);
        }
      };
      run();
      return () => { cancelled = true; };
    }, [assetId, directUrl]);
    return url;
  };

  const ProviderLogo: React.FC<{ provider?: AIProvider; size?: number; className?: string }> = ({ provider, size = 28, className }) => {
    const url = useAssetUrl(provider?.logoAssetId, provider?.logoUrl);
    const initials = (provider?.name || 'AI').slice(0, 2).toUpperCase();
    return (
      <div className={`rounded-full overflow-hidden bg-purple-500/20 flex items-center justify-center ${className || ''}`} style={{ width: size, height: size }}>
        {url ? (
          <img src={url} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">{initials}</span>
        )}
      </div>
    );
  };

  // Custom drag state for multi-row reordering
  interface DragState { featureId: string; itemId: string; originIndex: number; startY: number; rowHeight: number; }
  const [dragState, setDragState] = useState<DragState | null>(null);

  const beginPresetDrag = (e: React.PointerEvent, fId: string, itemId: string, index: number) => {
    const row = (e.currentTarget.closest('[data-preset-row]') as HTMLElement) || (e.currentTarget as HTMLElement);
    const rowHeight = row.getBoundingClientRect().height || 36;
    setDragState({ featureId: fId, itemId, originIndex: index, startY: e.clientY, rowHeight });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const commitPresetOrder = (featureId: string) => {
    const pending = localPresetOrders[featureId];
    if (!pending) { setDragState(null); return; }
    const next = [...features];
    const idx = next.findIndex(f => f.id === featureId);
    if (idx >= 0) {
      next[idx] = { ...next[idx], presets: pending };
      setFeatures(next);
      onChange({ ...value, features: next });
    }
    setLocalPresetOrders(p => { const cp = { ...p }; delete cp[featureId]; return cp; });
    setDragState(null);
  };
  useEffect(() => {
    if (!dragState) return;
    const handleMove = (e: PointerEvent) => {
      setLocalPresetOrders(prev => {
        if (!dragState) return prev; // safety
        const feature = features.find(f => f.id === dragState.featureId);
        if (!feature) return prev;
        const baseSource = prev[dragState.featureId] ?? feature.presets;
        const base = Array.isArray(baseSource) ? baseSource : feature.presets;
        const currentIndex = base.findIndex(p => p.id === dragState.itemId);
        if (currentIndex === -1) return prev;
        const delta = e.clientY - dragState.startY;
        const offsetRows = Math.round(delta / Math.max(24, dragState.rowHeight));
        let targetIndex = dragState.originIndex + offsetRows;
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex > base.length - 1) targetIndex = base.length - 1;
        if (targetIndex === currentIndex) return prev;
        const updated = [...base];
        const [item] = updated.splice(currentIndex, 1);
        updated.splice(targetIndex, 0, item);
        return { ...prev, [dragState.featureId]: updated };
      });
    };
    const handleUp = () => { if (dragState) commitPresetOrder(dragState.featureId); };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragState, features, value, localPresetOrders]);
  const resetAIToDefaults = () => {
    const d = getDefaultUserSettings();
  const def = d.settings.aiSettings;
  setProviders(def.providers);
  setFeatures(def.features);
  onChange({ ...value, providers: def.providers, features: def.features });
  };

  useEffect(() => setProviders(value.providers), [value.providers]);
  useEffect(() => setFeatures(value.features), [value.features]);

  const updateProvider = (idx: number, patch: Partial<AIProvider>) => {
    const next = [...providers];
    next[idx] = { ...next[idx], ...patch };
    setProviders(next);
    onChange({ ...value, providers: next });
  };

  const addProvider = () => setProviderModal(true);
  const onAddProvider = (p: AIProvider) => {
    const next = [...providers, p];
    setProviders(next);
    onChange({ ...value, providers: next });
  };

  const removeProvider = (idx: number) => {
    const next = providers.filter((_, i) => i !== idx);
    setProviders(next);
    onChange({ ...value, providers: next });
  };

  const updateFeaturePreset = (fIdx: number, pIdx: number, patch: Partial<AIFeaturePreset>) => {
    const nextF = [...features];
    const f = { ...nextF[fIdx] };
    const presets = [...f.presets];
    presets[pIdx] = { ...presets[pIdx], ...patch };
    f.presets = presets;
    nextF[fIdx] = f;
    setFeatures(nextF);
    onChange({ ...value, features: nextF });
  };

  const removePreset = (fIdx: number, pIdx: number) => {
    const nextF = [...features];
    const f = { ...nextF[fIdx] };
    if (!f.presets || f.presets.length <= 1) return; // keep at least one preset
    const presets = f.presets.filter((_, i) => i !== pIdx);
    f.presets = presets;
    nextF[fIdx] = f;
    setFeatures(nextF);
    onChange({ ...value, features: nextF });
  };

  const addPreset = (fIdx: number) => {
    const fid = features[fIdx].id;
    // Prefer cloning prompts from an existing "System Default" (provider==='system') if present
    const basePreset = features[fIdx].presets.find(p => p.provider === 'system') || features[fIdx].presets[0];
    let systemPrompt = basePreset?.systemPrompt || '';
    let customPrompt = basePreset?.customPrompt || '';

    // If no base preset had prompts, fall back to comprehensive per-feature defaults
    if (!systemPrompt) {
      switch (fid) {
        case 'rephrasing':
          systemPrompt = `You are a master storyteller and world-class literary editor.
Rephrase the provided text to elevate tone and clarity while preserving meaning.
Return only the rephrased paragraph as plain text.`;
          customPrompt = customPrompt || 'Make the tone more engaging and vivid.';
          break;
        case 'rephrase_multiple_lines':
          systemPrompt = `You are a master storyteller and a world-class literary editor. Respond only with JSON.
For each input paragraph group (string[]), produce one object with:
  - original: string[]
  - rephrased: string
Stream objects one-by-one without code fences.`;
          customPrompt = customPrompt || 'Follow the instructions and stream JSON objects one-by-one.';
          break;
        case 'expanding':
          systemPrompt = 'You are a creative writer. Expand the input with vivid sensory details and inner thoughts while keeping intent intact. Return only expanded text.';
          customPrompt = customPrompt || 'Lean into imagery and emotional texture.';
          break;
        case 'concising':
          systemPrompt = 'You are a concise editor. Shorten the text while retaining meaning and voice. Return only the shortened text—no explanations.';
          customPrompt = customPrompt || 'Eliminate redundancy; keep vivid details that matter.';
          break;
        case 'generating':
          systemPrompt = 'Generate 1-3 coherent next lines consistent with the given context. Return only the generated lines.';
          customPrompt = customPrompt || 'Honor tone and style of the context.';
          break;
        case 'validation':
          systemPrompt = 'Validate grammar, clarity, and style issues; list concise notes. Keep suggestions actionable.';
          customPrompt = customPrompt || '';
          break;
        case 'planning':
          systemPrompt = 'Summarize recent changes and update planning artifacts (beats/notes) succinctly.';
          customPrompt = customPrompt || '';
          break;
        case 'suggestions':
          systemPrompt = 'Suggest the next sentence or two consistent with the current context. Return only the suggestion.';
          customPrompt = customPrompt || '';
          break;
        default:
          systemPrompt = '';
          customPrompt = customPrompt || '';
      }
    }

    const p: AIFeaturePreset = {
      id: `${fid}-preset-${Date.now()}`,
      name: 'New Preset',
      provider: providers[0]?.id || 'system',
      model: 'default',
      systemPrompt,
      customPrompt,
      enabled: true
    } as any;
    const nextF = [...features];
    nextF[fIdx] = { ...nextF[fIdx], presets: [...nextF[fIdx].presets, p] };
    setFeatures(nextF);
    onChange({ ...value, features: nextF });
  };

  // Resolve preset target into current indices on the full features array
  const resolvedPresetTarget = useMemo(() => {
    if (!presetTarget) return null;
    const fIdx = features.findIndex(f => f.id === presetTarget.featureId);
    if (fIdx < 0) return null;
    return { fIdx, pIdx: presetTarget.pIdx };
  }, [presetTarget, features]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-2">
          <div className="text-base font-semibold">AI Controls</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Manage providers, presets, personalization, and collaboration.</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetAIToDefaults} className="px-3 py-1.5 text-sm rounded-md bg-gray-500/10 hover:bg-gray-500/20">Reset</button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center space-x-1 p-1 rounded-full bg-gray-200/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50 w-fit">
        {([
          { k: 'providers', label: 'Providers' },
          { k: 'features', label: 'AI Settings' },
          { k: 'theme', label: 'Theme' },
          { k: 'collab', label: 'Collaboration' },
          { k: 'advanced', label: 'Advanced' },
        ] as const).map(t => (
          <button
            key={t.k}
            onClick={() => setSubTab(t.k)}
            className={`px-3 py-1.5 text-sm rounded-full border ${subTab===t.k ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300/60 dark:border-gray-700/60 hover:bg-gray-900/5 dark:hover:bg-white/5'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab==='providers' && (
        <SectionCard title="Providers" description="Add or configure which AI providers are available">
          <div className="grid md:grid-cols-3 gap-3">
            {providers.map((p, idx) => (
              <TiltCard
                key={p.id}
                className="group relative rounded-xl p-3 flex flex-col gap-3 border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-gray-200/40 to-gray-50/40 dark:from-gray-900/60 dark:to-black/60 overflow-hidden"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-20 blur-lg transition-opacity"/>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <ProviderLogo provider={p} />
                      {editingProviderIdx === idx ? (
                        <input
                          value={p.name}
                          onChange={e => updateProvider(idx, { name: e.target.value })}
                          placeholder="Provider Name"
                          className={fieldCls + ' text-xs py-1.5 min-w-0'}
                        />
                      ) : (
                        <div className="font-medium truncate">{p.name}</div>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={p.enabled} onChange={e => updateProvider(idx, { enabled: e.target.checked })} />
                      Enabled
                    </label>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">id: {p.id}</div>
                  <input value={p.apiKey || ''} onChange={e => updateProvider(idx, { apiKey: e.target.value })} placeholder="API Key" className={fieldCls + ' mt-2 text-xs py-1.5'} />
                  {editingProviderIdx === idx && (
                    <div className="mt-2 space-y-2">
                      <input
                        value={p.baseUrl || ''}
                        onChange={e => updateProvider(idx, { baseUrl: e.target.value })}
                        placeholder="Base URL (optional)"
                        className={fieldCls + ' text-xs py-1.5'}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={p.organizationId || ''}
                          onChange={e => updateProvider(idx, { organizationId: e.target.value })}
                          placeholder="Organization ID (optional)"
                          className={fieldCls + ' text-xs py-1.5'}
                        />
                        <input
                          value={p.projectId || ''}
                          onChange={e => updateProvider(idx, { projectId: e.target.value })}
                          placeholder="Project ID (optional)"
                          className={fieldCls + ' text-xs py-1.5'}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between mt-2">
                    {editingProviderIdx === idx ? (
                      <button onClick={() => setEditingProviderIdx(null)} className="px-2 py-1 text-xs rounded-md bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 inline-flex items-center gap-1"><CheckIcon className="h-3 w-3"/>Done</button>
                    ) : (
                      <button onClick={() => setEditingProviderIdx(idx)} className="px-2 py-1 text-xs rounded-md bg-gray-500/10 hover:bg-gray-500/20 inline-flex items-center gap-1"><PencilIcon className="h-3 w-3"/>Edit</button>
                    )}
                    <button onClick={() => removeProvider(idx)} className="px-2 py-1 text-xs rounded-md bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 inline-flex items-center gap-1"><TrashIcon className="h-3 w-3"/>Remove</button>
                  </div>
                </div>
              </TiltCard>
            ))}
            <button onClick={addProvider} className="h-12 rounded-xl border border-dashed border-gray-300/60 dark:border-gray-700/60 hover:bg-gray-500/10 inline-flex items-center justify-center gap-2 text-sm">
              <PlusIcon className="h-4 w-4"/> Add Provider
            </button>
          </div>
          <ProviderModal open={providerModal} onClose={()=>setProviderModal(false)} onAdd={onAddProvider} />
        </SectionCard>
      )}

      {subTab==='features' && (
        <SectionCard title="AI Features" description="Enable, edit presets, drag handle supports multi-row jumps">
          <div className="mb-3">
            <input
              placeholder="Search features…"
              className={fieldCls + ' max-w-md'}
              value={featureQuery}
              onChange={(e)=> setFeatureQuery(e.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {features
              .filter(f => {
                const q = featureQuery.trim().toLowerCase();
                if (!q) return true;
                const hay = `${f.label} ${f.id}`.toLowerCase();
                return hay.includes(q);
              })
              .map((f, fIdx) => {
              const list = localPresetOrders[f.id] ?? f.presets;
              const headerProv = providers.find(pp => pp.id === list[0]?.provider);
              return (
                <div key={f.id} className="group relative rounded-xl p-3 flex flex-col gap-2 border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-gray-200/40 to-gray-50/40 dark:from-gray-900/60 dark:to-black/60">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-20 blur-lg transition-opacity" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold truncate">{f.label}</div>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1 text-[10px]">
                          <input
                            type="checkbox"
                            checked={f.enabled !== false}
                            onChange={e => {
                              const next = [...features];
                              next[fIdx] = { ...next[fIdx], enabled: e.target.checked };
                              setFeatures(next);
                              onChange({ ...value, features: next });
                            }}
                          />
                          on
                        </label>
                        <ProviderLogo provider={headerProv} size={20} />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{list.length} presets</div>
                    <div className={`space-y-2 mt-2 select-none ${f.enabled !== false ? '' : 'opacity-50 pointer-events-none'}`}>
                      {list.map((p, pIdx) => {
                        // Safe check: avoid accessing featureId when dragState is null
                        const dragging = dragState ? (dragState.itemId === p.id && dragState.featureId === f.id) : false;
                        return (
                          <div
                            key={p.id}
                            data-preset-row
                            className={`flex items-center justify-between rounded-md border border-gray-200/60 dark:border-gray-800/60 px-2 py-1.5 bg-white/60 dark:bg-white/5 transition-shadow ${dragging ? 'ring-2 ring-purple-500/50 cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Bars3Icon className="h-4 w-4 text-gray-500" onPointerDown={(e)=>beginPresetDrag(e,f.id,p.id,pIdx)} />
                              <ProviderLogo provider={providers.find(pp=>pp.id===p.provider)} size={24} />
                              <button onClick={()=>{ setPresetTarget({ featureId: f.id, pIdx }); setShowPresetModal(true); }} className="text-xs font-medium truncate hover:underline">{p.name}</button>
                              <label className="inline-flex items-center gap-1 text-[10px] ml-2">
                                <input type="checkbox" checked={p.enabled !== false} onChange={e=>{
                                  const next=[...features];
                                  const fN={...next[fIdx]};
                                  const arr=[...fN.presets];
                                  const idx = fN.presets.findIndex(x=>x.id===p.id);
                                  if (idx >= 0) {
                                    arr[idx] = { ...arr[idx], enabled: e.target.checked } as any;
                                    fN.presets=arr; next[fIdx]=fN; setFeatures(next); onChange({...value, features: next});
                                  }
                                }} />
                                on
                              </label>
                              {p.provider && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 truncate max-w-[6rem]">
                                  {(providers.find(pp=>pp.id===p.provider)?.name) || p.provider}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button title="Edit" className="p-1 rounded hover:bg-gray-500/10" onClick={()=>{ setPresetTarget({ featureId: f.id, pIdx }); setShowPresetModal(true); }}>
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                title={f.presets.length <= 1 ? 'Keep at least one preset' : 'Remove'}
                                className={`p-1 rounded ${f.presets.length <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-500/10 text-red-600 dark:text-red-400'}`}
                                onClick={()=> f.presets.length > 1 && removePreset(fIdx, pIdx)}
                                disabled={f.presets.length <= 1}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={()=>addPreset(fIdx)} className="w-full px-2 py-1.5 text-xs rounded-md border border-dashed border-gray-300/60 dark:border-gray-700/60 hover:bg-gray-500/10 inline-flex items-center justify-center gap-1"><PlusIcon className="h-3 w-3"/>Add Preset</button>
                    </div>
                  </div>
                </div>
              );
            })
              }
          </div>
        </SectionCard>
      )}

      {subTab==='theme' && (
        <SectionCard title="Theme" description="Personalize your UI (local only)">
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Theme Color</label>
              <div className="grid grid-cols-8 gap-2 max-w-md">
                {[
                  {k:'blue', cls:'bg-blue-500'},
                  {k:'purple', cls:'bg-purple-500'},
                  {k:'green', cls:'bg-green-500'},
                  {k:'orange', cls:'bg-orange-500'},
                  {k:'red', cls:'bg-red-500'},
                  {k:'pink', cls:'bg-pink-500'},
                  {k:'teal', cls:'bg-teal-500'},
                  {k:'slate', cls:'bg-slate-500'},
                ].map(s => (
                  <button key={s.k} onClick={()=> onThemeChange?.({ color: s.k, customColorHex: theme?.customColorHex })} className={`h-8 rounded-md ${s.cls} relative`}>
                    {theme?.color===s.k && <span className="absolute inset-0 ring-2 ring-offset-2 ring-black/80 dark:ring-white/80 rounded-md"/>}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-w-xs">
              <label className="block text-sm mb-1">Custom Color</label>
              <input type="color" value={theme?.customColorHex || '#0000FF'} onChange={e=> onThemeChange?.({ color: theme?.color, customColorHex: e.target.value })} className={fieldCls + ' h-10 p-1'} />
            </div>
          </div>
        </SectionCard>
  )}
  {subTab==='collab' && (
        <SectionCard title="Collaboration" description="Controls for comments, suggestions, copy permissions, and track changes.">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="col-span-1">
              <div className="text-sm font-medium mb-1">Permissions</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Decide what collaborators can do in your documents.</p>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!collaboration?.copyAllowed} onChange={e=> onCollabChange?.({ ...(collaboration as any), copyAllowed: e.target.checked })}/> Allow Copy</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!collaboration?.allowComments} onChange={e=> onCollabChange?.({ ...(collaboration as any), allowComments: e.target.checked })}/> Allow Comments</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!collaboration?.allowSuggestions} onChange={e=> onCollabChange?.({ ...(collaboration as any), allowSuggestions: e.target.checked })}/> Allow Suggestions</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!collaboration?.allowTrackChanges} onChange={e=> onCollabChange?.({ ...(collaboration as any), allowTrackChanges: e.target.checked })}/> Track Changes</label>
            </div>
          </div>
        </SectionCard>
      )}
  {subTab==='advanced' && (
        <SectionCard title="Advanced" description="Token limits, temperature, and validation levels">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <div className="text-sm font-medium mb-1">Generation Controls</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Tune the creativity and length of AI output.</p>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Temperature</label>
                <input type="range" min={0} max={2} step={0.1} value={advanced?.temperature ?? 0.7} onChange={e=> onAdvancedChange?.({ ...(advanced as any), temperature: parseFloat(e.target.value) })} className="w-full" />
                <div className="text-xs text-gray-500 mt-1">{(advanced?.temperature ?? 0.7).toFixed(1)}</div>
              </div>
              <div>
                <label className="block text-sm mb-1">Max Tokens</label>
                <input type="range" min={128} max={32000} step={64} value={advanced?.maxTokens ?? 1000} onChange={e=> onAdvancedChange?.({ ...(advanced as any), maxTokens: parseInt(e.target.value) || 0 })} className="w-full" />
                <div className="text-xs text-gray-500 mt-1">{advanced?.maxTokens ?? 1000}</div>
              </div>
              <div>
                <label className="block text-sm mb-1">Validation Level</label>
                <select value={advanced?.validationLevel ?? 'balanced'} onChange={e=> onAdvancedChange?.({ ...(advanced as any), validationLevel: e.target.value as any })} className={selectCls}>
                  {['lenient','balanced','strict'].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Tone Preset</label>
                <select value={advanced?.tonePreset ?? 'conversational'} onChange={e=> onAdvancedChange?.({ ...(advanced as any), tonePreset: e.target.value as any })} className={selectCls}>
                  {['conversational','formal','casual','authoritative'].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Max Sentence Length</label>
                <select value={advanced?.maxSentenceLength ?? 'medium'} onChange={e=> onAdvancedChange?.({ ...(advanced as any), maxSentenceLength: e.target.value as any })} className={selectCls}>
                  {['short','medium','long'].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Vocabulary Complexity</label>
                <select value={advanced?.vocabularyComplexity ?? 'medium'} onChange={e=> onAdvancedChange?.({ ...(advanced as any), vocabularyComplexity: e.target.value as any })} className={selectCls}>
                  {['simple','medium','advanced'].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

  {showPresetModal && resolvedPresetTarget && (
        <PresetModal
          open={showPresetModal}
          onClose={()=>setShowPresetModal(false)}
          preset={features[resolvedPresetTarget.fIdx].presets[resolvedPresetTarget.pIdx]}
          providers={providers}
          featureId={features[resolvedPresetTarget.fIdx].id}
          onSave={(draft)=> updateFeaturePreset(resolvedPresetTarget.fIdx, resolvedPresetTarget.pIdx, draft)}
        />
      )}
    </div>
  );
};

const FormatSettingsEditor: React.FC<{ value: TypographySettingsJSON; onChange: (v: TypographySettingsJSON) => void; }> = ({ value, onChange }) => {
  const v = value;
  const fontFamilies: Array<{ name: string; value: string }> = [
    { name: 'Garamond', value: 'Garamond, serif' },
    { name: 'Baskerville', value: 'Baskerville, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Palatino', value: 'Palatino, serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Bookerly', value: 'Bookerly, serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Calibri', value: 'Calibri, sans-serif' },
    { name: 'Courier', value: 'Courier, monospace' },
    { name: 'Courier Prime', value: 'Courier Prime, monospace' },
    { name: 'Consolas', value: 'Consolas, monospace' },
  ];
  const sizeMap: Record<string, string> = { 'text-sm': '14px', 'text-base': '16px', 'text-lg': '18px', 'text-xl': '20px' };
  const lhMap: Record<string, string> = { tight: '1.25', normal: '1.5', relaxed: '1.75', loose: '2' };
  const widthMap: Record<string, string> = { narrow: '50%', medium: '60%', wide: '75%', full: '100%' };
  const indentMap: Record<string, string> = { none: '0', small: '1em', medium: '2em', large: '3em' };
  const alignCss = v.textAlignment === 'justified' ? 'justify' : (v.textAlignment as any);
  // Segmented control helpers
  const SegButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; title?: string }>=({active,onClick,children,title})=> (
    <button title={title} onClick={onClick} className={`px-2.5 py-1.5 text-xs rounded-md border ${active? 'bg-black text-white dark:bg-white dark:text-black border-transparent':'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300/60 dark:border-gray-700/60 hover:bg-gray-900/5 dark:hover:bg-white/5'}`}>
      {children}
    </button>
  );
  const SegGroup: React.FC<{ children: React.ReactNode }>=({children})=> (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-200/60 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50">
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Typography">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm mb-1">Font Family</label>
              <select value={v.fontFamily} onChange={e => onChange({ ...v, fontFamily: e.target.value })} className={selectCls + ' text-gray-900 dark:text-gray-100 dark:bg-gray-900/50'}>
                {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Font Size</label>
              <SegGroup>
                {(['text-sm','text-base','text-lg','text-xl'] as const).map(sz => (
                  <SegButton key={sz} active={v.fontSize===sz} onClick={()=>onChange({...v, fontSize: sz})} title={sz}>{sz.replace('text-','')}</SegButton>
                ))}
              </SegGroup>
            </div>
            <div>
              <label className="block text-sm mb-1">Line Height</label>
              <SegGroup>
                {(['tight','normal','relaxed','loose'] as const).map(lh => (
                  <SegButton key={lh} active={v.lineHeight===lh} onClick={()=>onChange({...v, lineHeight: lh})}>{lh}</SegButton>
                ))}
              </SegGroup>
            </div>
            <div>
              <label className="block text-sm mb-1">Paragraph Spacing</label>
              <input value={v.paragraphSpacing} onChange={e => onChange({ ...v, paragraphSpacing: e.target.value })} className={fieldCls} />
            </div>
            <div>
              <label className="block text-sm mb-1">Text Indent</label>
              <SegGroup>
                {(['none','small','medium','large'] as const).map(ind => (
                  <SegButton key={ind} active={v.textIndent===ind} onClick={()=>onChange({...v, textIndent: ind})}>{ind}</SegButton>
                ))}
              </SegGroup>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center gap-2 text-sm mt-6"><input type="checkbox" checked={v.chicagoStyle} onChange={e=>onChange({...v, chicagoStyle:e.target.checked})}/> Chicago Style</label>
            </div>
            <div>
              <label className="block text-sm mb-1">Page Width</label>
              <SegGroup>
                {(['narrow','medium','wide','full'] as const).map(w => (
                  <SegButton key={w} active={v.pageWidth===w} onClick={()=>onChange({...v, pageWidth: w})}>{w}</SegButton>
                ))}
              </SegGroup>
            </div>
            <div>
              <label className="block text-sm mb-1">Text Alignment</label>
              <SegGroup>
                {([
                  {k:'left', Icon: AlignLeftIcon},
                  {k:'center', Icon: AlignCenterIcon},
                  {k:'right', Icon: AlignRightIcon},
                  {k:'justified', Icon: AlignJustifyIcon}
                ] as const).map(({k, Icon}) => (
                  <SegButton key={k} active={v.textAlignment===k} onClick={()=>onChange({...v, textAlignment:k})} title={k}>
                    <Icon className="w-4 h-4"/>
                  </SegButton>
                ))}
              </SegGroup>
            </div>
            <div>
              <label className="block text-sm mb-1">Scene Divider</label>
              <input value={v.sceneDivider} onChange={e=>onChange({...v, sceneDivider:e.target.value})} className={fieldCls}/>
            </div>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={v.typewriterMode} onChange={e=>onChange({...v, typewriterMode:e.target.checked})}/> Typewriter Mode</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={v.rememberPosition} onChange={e=>onChange({...v, rememberPosition:e.target.checked})}/> Remember Position</label>
          </div>
        </SectionCard>
        <SectionCard title="Preview">
          <div className="rounded-md border border-gray-200/60 dark:border-gray-800/60 p-4 bg-white/70 dark:bg-white/5 mx-auto" style={{
            fontFamily: v.fontFamily,
            fontSize: sizeMap[v.fontSize] || v.fontSize,
            lineHeight: lhMap[v.lineHeight] || (v.lineHeight as any),
            textAlign: alignCss,
            maxWidth: widthMap[v.pageWidth] || '60%'
          }}>
            <p className="mb-2" style={{ textIndent: '0', marginBottom: v.paragraphSpacing }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis a lacus vitae lectus egestas bibendum.</p>
            <p style={{ textIndent: indentMap[v.textIndent] || '0', marginBottom: v.paragraphSpacing }}>Curabitur ut libero ut sapien scelerisque pretium. Aenean at orci vel lectus efficitur.</p>
            <p style={{ textIndent: indentMap[v.textIndent] || '0' }}>Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

const AccountModal: React.FC<AccountModalProps> = ({ open, onClose }) => {
  const { user, isOnline, ensureAccessToken } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('account');
  const [settings, setSettings] = useState<UserSettings>(getDefaultUserSettings());
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<{ status: string; expiresAt: number } | null>(null);
  const [billing, setBilling] = useState<{ items: Array<{ id: string; amount: number; date: number; description: string }>; aiUsage: Array<{ provider: string; feature: string; cost: number; date: number }> } | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);

  // Load local settings
  useEffect(() => {
    if (!open) return;
    (async () => {
      const s = await loadUserSettings();
      setSettings(s);
    })();
  }, [open]);

  // Load online data when online and modal open
  useEffect(() => {
    if (!open || !isOnline) return;
    (async () => {
      try {
        setLoading(true);
        await ensureAccessToken();
        const sub = await apiClient.getSubscription();
        setSubscription(sub);
        // Placeholder endpoints for billing/usage; adapt when backend is ready
        try {
          const history = await apiClient.authenticatedRequest<any>('/billing/history');
          const usage = await apiClient.authenticatedRequest<any>('/billing/ai-usage');
          setBilling({ items: history?.items || [], aiUsage: usage?.items || [] });
        } catch {
          setBilling({ items: [], aiUsage: [] });
        }
      } catch (e) {
        console.warn('Failed to load online account data', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, isOnline, ensureAccessToken]);

  // Resolve avatar display URL using asset system similar to BookHero
  useEffect(() => {
    const loadAvatar = async () => {
      const assetId = settings.userProfile?.avatarAssetId;
      const localPath = settings.userProfile?.avatarPath;
      if (assetId) {
        try {
          const url = await SimpleAssetService.loadAssetForDisplay(assetId);
          if (url) { setAvatarUrl(url); return; }
          // Fallback to local path conversion if present
          if (localPath) {
            try {
              const dataUrl = await AssetService.getLocalImageDataUrl({ localPath } as any);
              if (dataUrl) { setAvatarUrl(dataUrl); return; }
            } catch {}
          }
          setAvatarUrl(undefined);
          return;
        } catch {
          if (localPath) {
            try {
              const dataUrl = await AssetService.getLocalImageDataUrl({ localPath } as any);
              if (dataUrl) { setAvatarUrl(dataUrl); return; }
            } catch {}
          }
          setAvatarUrl(undefined);
          return;
        }
      }
      if (localPath) {
        try {
          const dataUrl = await AssetService.getLocalImageDataUrl({ localPath } as any);
          if (dataUrl) { setAvatarUrl(dataUrl); return; }
        } catch {}
      }
      setAvatarUrl(undefined);
    };
    loadAvatar();
  }, [settings.userProfile?.avatarAssetId, settings.userProfile?.avatarPath]);

  // Resolve cover image (profile banner) similarly
  useEffect(() => {
    const loadCover = async () => {
      const assetId = settings.userProfile?.coverAssetId;
      const localPath = settings.userProfile?.coverPath;
      if (assetId) {
        try {
          const url = await SimpleAssetService.loadAssetForDisplay(assetId);
          if (url) { setCoverUrl(url); return; }
          if (localPath) {
            try {
              const dataUrl = await AssetService.getLocalImageDataUrl({ localPath } as any);
              if (dataUrl) { setCoverUrl(dataUrl); return; }
            } catch {}
          }
          setCoverUrl(undefined); return;
        } catch {
          if (localPath) {
            try {
              const dataUrl = await AssetService.getLocalImageDataUrl({ localPath } as any);
              if (dataUrl) { setCoverUrl(dataUrl); return; }
            } catch {}
          }
          setCoverUrl(undefined); return;
        }
      }
      if (localPath) {
        try {
          const dataUrl = await AssetService.getLocalImageDataUrl({ localPath } as any);
          if (dataUrl) { setCoverUrl(dataUrl); return; }
        } catch {}
      }
      setCoverUrl(undefined);
    };
    loadCover();
  }, [settings.userProfile?.coverAssetId, settings.userProfile?.coverPath]);

  const saveLocal = async () => {
    // Persist local settings
    await saveUserSettings(settings);
    // Also sync selected settings into session row for fast access in app (theme/collab/advanced/profile basics)
    try {
      const cur = await getSessionRow();
      if (cur) {
        await upsertSessionRow({
          ...cur,
          name: settings.name || cur.name,
          email: settings.email || cur.email,
          theme: settings.settings.theme,
          collaboration: settings.settings.collaboration,
          advanced: settings.settings.advanced,
          updated_at: Date.now(),
        });
      }
    } catch (e) {
      console.warn('Session save (aux) failed', e);
    }
  // Close modal after successful save
  onClose();
  };

  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const handleUploadAvatarClick = () => fileInputRef.current?.click();
  const handleAvatarSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    try {
      const f = e.target.files?.[0];
      if (!f || !user?.id) return;
      const res = await AssetService.importLocalFile(f, { entityType: 'user', entityId: user.id, role: 'avatar', bookId: 'global' });
      // Store both assetId and local preview path for robustness
      setSettings(s => ({ 
        ...s, 
        userProfile: { 
          ...(s.userProfile||{}), 
          avatarPath: res.localPath || s.userProfile?.avatarPath,
          avatarAssetId: res.assetId || s.userProfile?.avatarAssetId
        } 
      }));
  // Immediate optimistic preview
  setAvatarUrl(URL.createObjectURL(f));
    } catch (err) {
      console.warn('Avatar upload failed', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Cover upload handlers
  const coverInputRef = useRef<HTMLInputElement|null>(null);
  const handleUploadCoverClick = () => coverInputRef.current?.click();
  const handleCoverSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    try {
      const f = e.target.files?.[0];
      if (!f || !user?.id) return;
      const res = await AssetService.importLocalFile(f, { entityType: 'user', entityId: user.id, role: 'cover', bookId: 'global' });
      setSettings(s => ({
        ...s,
        userProfile: {
          ...(s.userProfile||{}),
          coverPath: res.localPath || s.userProfile?.coverPath,
          coverAssetId: res.assetId || s.userProfile?.coverAssetId,
        }
      }));
      setCoverUrl(URL.createObjectURL(f));
    } catch (err) {
      console.warn('Cover upload failed', err);
    } finally {
      if (coverInputRef.current) coverInputRef.current.value='';
    }
  };
  const removeCover = () => {
    setSettings(s => ({
      ...s,
      userProfile: { ...(s.userProfile||{}), coverAssetId: undefined, coverPath: undefined }
    }));
    setCoverUrl(undefined);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'account', label: 'Account', icon: <UserCircleIcon className="h-4 w-4" /> },
    { key: 'subscription', label: 'Subscription', icon: <CreditCardIcon className="h-4 w-4" /> },
    { key: 'billing', label: 'Billing & AI Usage', icon: <ChartBarIcon className="h-4 w-4" /> },
    { key: 'project', label: 'Project Format', icon: <Cog6ToothIcon className="h-4 w-4" /> },
    { key: 'ai', label: 'AI Settings', icon: <CpuChipIcon className="h-4 w-4" /> },
  ];

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-4 md:inset-8 xl:inset-16 z-[130] rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-gray-100 to-white dark:from-gray-950 dark:to-black shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-black/40 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">My Account</span>
            {loading && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">Syncing…</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={saveLocal} className="px-3 py-1.5 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700">Save</button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 p-3 md:p-4 overflow-hidden">
          <div className="w-56 shrink-0 hidden md:flex flex-col gap-2">
            {tabs.map(t => (
              <PillTab key={t.key} label={t.label} icon={t.icon} active={tab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {/* Mobile tabs */}
            <div className="md:hidden flex gap-2 mb-3 overflow-x-auto">
              {tabs.map(t => (
                <PillTab key={t.key} label={t.label} icon={t.icon} active={tab === t.key} onClick={() => setTab(t.key)} />
              ))}
            </div>

            {tab === 'account' && (
              <div className="space-y-6">
                <SectionCard title="Profile Cover" description="Optional banner image for your profile">
                  <div className="space-y-3">
                    <div className="relative w-full h-40 rounded-xl border border-gray-300/60 dark:border-gray-700/60 overflow-hidden bg-gray-200/40 dark:bg-gray-800/40 flex items-center justify-center">
                      {coverUrl ? (
                        <img src={coverUrl} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm text-gray-500">No cover uploaded</div>
                      )}
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelected} />
                        <button onClick={handleUploadCoverClick} className="px-2 py-1 text-xs rounded-md bg-white/80 dark:bg-black/60 border border-gray-300/60 dark:border-gray-700/60 backdrop-blur hover:bg-white dark:hover:bg-black">{coverUrl? 'Replace Cover':'Upload Cover'}</button>
                        {coverUrl && <button onClick={removeCover} className="px-2 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700">Remove</button>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Recommended size: 1200x300. Stored locally and synced when online.</p>
                  </div>
                </SectionCard>
                <SectionCard title="Profile Information" right={
                  <div className="flex items-center gap-2">
                    {!editProfile ? (
                      <button onClick={()=>setEditProfile(true)} className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-90 inline-flex items-center gap-2"><Squares2X2Icon className="h-4 w-4"/>Edit</button>
                    ) : (
                      <>
                        <button onClick={()=>{ setEditProfile(false); saveLocal(); }} className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-2"><CheckIcon className="h-4 w-4"/>Save</button>
                        <button onClick={()=>setEditProfile(false)} className="px-3 py-1.5 text-sm rounded-md bg-gray-500/10 hover:bg-gray-500/20">Cancel</button>
                      </>
                    )}
                  </div>
                }>
                  <div className="grid grid-cols-[auto_1fr] gap-6 items-start">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xl font-semibold overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(user?.name||'U').slice(0,2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelected} />
                          <button onClick={handleUploadAvatarClick} className="px-3 py-1.5 text-sm rounded-md border border-gray-300/60 dark:border-gray-700/60 bg-white/60 dark:bg-white/10 inline-flex items-center gap-2"><ArrowUpRightIcon className="h-4 w-4"/>Upload Avatar</button>
                        </>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.userProfile?.hideAvatar} onChange={e=> setSettings(s=> ({...s, userProfile: { ...(s.userProfile||{}), hideAvatar: e.target.checked }}))}/> Hide Profile Picture</label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-gray-500">Name</div>
                        {editProfile ? (
                          <input className={fieldCls} value={settings.name || user?.name || ''} onChange={e=> setSettings(s=> ({...s, name: e.target.value}))} />
                        ) : (
                          <div className="font-medium text-lg">{settings.name || user?.name || '—'}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium text-lg text-gray-600 dark:text-gray-300">{user?.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Phone Number</div>
                        {editProfile ? (
                          <input className={fieldCls} value={settings.userProfile?.phone || ''} onChange={e=> setSettings(s=> ({...s, userProfile: { ...(s.userProfile||{}), phone: e.target.value }}))} />
                        ) : (
                          <div className="font-medium">{settings.userProfile?.phone || '—'}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Link</div>
                        {editProfile ? (
                          <input className={fieldCls} value={settings.userProfile?.link || ''} onChange={e=> setSettings(s=> ({...s, userProfile: { ...(s.userProfile||{}), link: e.target.value }}))} />
                        ) : (
                          <div className="font-medium">{settings.userProfile?.link || '—'}</div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm text-gray-500">Description</div>
                        {editProfile ? (
                          <textarea className={textareaCls} rows={3} value={settings.userProfile?.description || ''} onChange={e=> setSettings(s=> ({...s, userProfile: { ...(s.userProfile||{}), description: e.target.value }}))} />
                        ) : (
                          <div className="font-medium whitespace-pre-wrap min-h-[2rem]">{settings.userProfile?.description || '—'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {tab === 'subscription' && (
              <div className="space-y-6">
                <div className="text-center py-2"><div className="text-2xl font-bold">Choose Your Plan</div><div className="text-sm text-gray-600 dark:text-gray-400">Unlock your writing potential with the perfect plan</div></div>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { id:'free', title:'Free', price:'$0', period:'/month', features:['Basic writing tools','Limited books (3)','Data deleted after 2 months','Community support'] },
                    { id:'hobby', title:'Hobbyist & Student', price:'$3.99', period:'/month', badge:'Most Popular', features:['Unlimited books','Basic AI features','Export to PDF, DOCX','Lifetime data retention','Email support'] },
                    { id:'pro', title:'Pro', price:'$5.99', period:'/month', features:['Everything in Hobbyist','Advanced AI features','Export to EPUB','Priority support','1000 AI credits/month'] },
                    { id:'max', title:'Max', price:'$7.99', period:'/month', features:['Everything in Pro','Audio book conversion','AI model customization','Unlimited AI credits','Dedicated support'] },
                  ].map((plan, idx) => (
                    <motion.div key={plan.id} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: idx*0.05}} className={`rounded-2xl border p-5 bg-gradient-to-br from-gray-200/40 to-gray-50/40 dark:from-gray-900/60 dark:to-black/60 ${subscription?.status?.toLowerCase()===plan.id?'border-green-500/50':'border-gray-200/60 dark:border-gray-800/60'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-semibold">{plan.title}</div>
                        {plan.badge && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">{plan.badge}</span>}
                      </div>
                      <div className="text-3xl font-bold">{plan.price}<span className="text-base font-medium text-gray-600 dark:text-gray-400">{plan.period}</span></div>
                      <ul className="mt-3 space-y-1 text-sm">
                        {plan.features.map((f,i)=>(<li key={i} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500/70"/> {f}</li>))}
                      </ul>
                      <div className="mt-4">
                        {subscription?.status?.toLowerCase()===plan.id ? (
                          <button className="w-full px-3 py-2 text-sm rounded-md bg-green-500/10 text-green-600 dark:text-green-400">Current Plan</button>
                        ) : (
                          <button className="w-full px-3 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700">Choose {plan.title}</button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                {isOnline && subscription && (
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">Expires {new Date(subscription.expiresAt).toLocaleString()}</div>
                )}
              </div>
            )}

            {tab === 'billing' && (
              <div className="space-y-6">
                <SectionCard title="Payment History" description="Online-only">
                  {!isOnline && <div className="text-sm text-amber-600 dark:text-amber-400">Offline</div>}
                  {isOnline && (
                    <div className="space-y-2">
                      {(billing?.items || []).length === 0 && <div className="text-sm text-gray-500">No payments</div>}
                      {billing?.items?.map(i => (
                        <div key={i.id} className="flex items-center justify-between rounded-md border border-gray-200/60 dark:border-gray-800/60 px-3 py-2 text-sm">
                          <div>{i.description}</div>
                          <div className="flex items-center gap-4">
                            <span>${i.amount.toFixed(2)}</span>
                            <span className="text-gray-500">{new Date(i.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
                <SectionCard title="AI Usage" description="Online-only">
                  {!isOnline && <div className="text-sm text-amber-600 dark:text-amber-400">Offline</div>}
                  {isOnline && (
                    <div className="space-y-2">
                      {(billing?.aiUsage || []).length === 0 && <div className="text-sm text-gray-500">No usage</div>}
                      {billing?.aiUsage?.map((u, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-md border border-gray-200/60 dark:border-gray-800/60 px-3 py-2 text-sm">
                          <div className="text-gray-700 dark:text-gray-300">{u.provider} • {u.feature}</div>
                          <div className="flex items-center gap-4">
                            <span>${u.cost.toFixed(4)}</span>
                            <span className="text-gray-500">{new Date(u.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {tab === 'project' && (
              <div className="space-y-6">
                <FormatSettingsEditor
                  value={settings.settings.project!.typographySettings}
                  onChange={fmt => setSettings(s => ({ ...s, settings: { ...s.settings, project: { typographySettings: fmt } } }))}
                />
              </div>
            )}

            {tab === 'ai' && (
              <AISettingsEditor
                value={settings.settings.aiSettings}
                onChange={ai => setSettings(s => ({ ...s, settings: { ...s.settings, aiSettings: ai } }))}
                theme={settings.settings.theme}
                onThemeChange={t => setSettings(s => ({ ...s, settings: { ...s.settings, theme: t } }))}
                collaboration={settings.settings.collaboration}
                onCollabChange={c => setSettings(s => ({ ...s, settings: { ...s.settings, collaboration: c } }))}
                advanced={settings.settings.advanced}
                onAdvancedChange={a => setSettings(s => ({ ...s, settings: { ...s.settings, advanced: a } }))}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AccountModal;
