import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeViewWrapper } from '@tiptap/react';
import { SceneBeatData, WorldEntity } from '../../types/custom-nodes';
import { loadUserSettings, type AISettings } from '../../stores/userSettingsStore';
import { runFeature } from '../../ai/runFeature';
import { useBookContext, useCurrentBookAndVersion } from '../../contexts/BookContext';

interface SceneBeatNodeProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  editor: any;
  getPos?: () => number;
  reactFlowCanvas?: any;
  worldEntities?: WorldEntity[];
}

const SceneBeatNode: React.FC<SceneBeatNodeProps> = ({
  node,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
  reactFlowCanvas,
}) => {
  // Helpers: light token/word estimators
  function countWords(text: string | null | undefined): number {
    if (!text) return 0;
    return (text.trim().match(/\S+/g) || []).length;
  }
  function countTokens(text: string | null | undefined): number {
    if (!text) return 0;
    // Approximate GPT tokenization ~0.75 words/token as a safe fallback
    return Math.ceil(countWords(text) * 0.75);
  }
  function computeDynamicMaxTokens(systemPrompt: string, userPrompt: string): number {
    const initialSystemPromptTokens = countTokens(systemPrompt);
    const updatedUserPromptTokens = countTokens(userPrompt);
    const maxTokens = Math.ceil((updatedUserPromptTokens * 2) + (initialSystemPromptTokens * 1.4) + (updatedUserPromptTokens * 1.4));
    console.debug('[AI TOKENS] sys=', initialSystemPromptTokens, 'user=', updatedUserPromptTokens, 'maxTokens=', maxTokens);
    return maxTokens;
  }
  // Extract the first balanced JSON object from a text blob
  function extractFirstJsonObject(input: string): string | null {
    if (!input) return null;
    const s = input.replace(/[\u200B-\u200D\uFEFF]/g, '');
    const start = s.indexOf('{');
    if (start < 0) return null;
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inStr) {
        if (esc) { esc = false; }
        else if (ch === '\\') { esc = true; }
        else if (ch === '"') { inStr = false; }
      } else {
        if (ch === '"') inStr = true;
        else if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) return s.slice(start, i + 1);
        }
      }
    }
    return null; // unbalanced
  }
  const data: SceneBeatData = node.attrs;
  const [isExpanded, setIsExpanded] = useState(data.isExpanded || false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SceneBeatData>(data);
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [worldOptions, setWorldOptions] = useState<Array<{ id: string; name: string }>>([]);

  // Prefer route params via context hook; fallback to dock store
  const routeIds = (() => { try { return useCurrentBookAndVersion(); } catch { return null; } })();
  const { currentBookId, currentVersionId } = (() => {
    const rid = routeIds as any;
    if (rid && rid.bookId && rid.versionId) {
      return { currentBookId: rid.bookId as string, currentVersionId: rid.versionId as string };
    }
    try {
      const { useToolWindowStore } = require('../../stores/toolWindowStore');
      const st = useToolWindowStore.getState?.();
      return { currentBookId: st?.currentBookId || null, currentVersionId: st?.currentVersionId || null };
    } catch {
      return { currentBookId: null, currentVersionId: null };
    }
  })();
  const bookCtx = (() => { try { return useBookContext(); } catch { return null; } })();

  useEffect(() => {
    let mounted = true;
    loadUserSettings().then(s => { if (mounted) setAiSettings(s.settings.aiSettings); });
    // Preload worlds for selector
    (async () => {
      try {
        if (bookCtx && currentBookId && currentVersionId) {
          const ws = await bookCtx.getWorlds(currentBookId, currentVersionId);
          if (mounted) setWorldOptions((ws || []).map((w:any)=> ({ id: w.id, name: w.name })));
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Helpers: find scene content range from this beat's end -> next beat start (or doc end)
  const findSceneContentRange = () => {
    try {
      const view = editor?.view || (window as any).activeTipTapView || null;
      if (!view) {
        console.debug('[SceneBeatNode] findSceneContentRange: no view available');
        return null;
      }
      const posBase = typeof getPos === 'function' ? getPos() : (node as any).getPos?.() ?? null;
      if (posBase == null) {
        console.debug('[SceneBeatNode] findSceneContentRange: no getPos available');
        return null;
      }
      const from = posBase + node.nodeSize; // end of this atom node
      // Compute exact next SceneBeat start by scanning doc descendants
      const doc = view.state.doc;
      let nextBeatPos: number | null = null;
      try {
        doc.descendants((n: any, pos: number) => {
          if (n?.type?.name === 'sceneBeat' && pos > posBase) {
            if (nextBeatPos == null || pos < nextBeatPos) nextBeatPos = pos;
          }
          return true;
        });
      } catch (e) {
        console.debug('[SceneBeatNode] descendants scan failed', e);
      }
      let to = nextBeatPos ?? doc.content.size; // until next beat or end-of-doc
      if (to < from) {
        console.debug('[SceneBeatNode] computed to < from; correcting', { from, to });
        to = from;
      }
      const sceneContent = doc.textBetween(from, to, '\n');
      console.debug('[SceneBeatNode] computed scene range', { from, to, nextBeatPos, len: sceneContent?.length, beatId: data.id, chapter: data.chapterName, index: data.sceneBeatIndex });
      return { from, to, sceneContent };
    } catch {
      return null;
    }
  };

  // Status configuration
  const statusConfig = {
    Draft: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300' },
    Edited: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300' },
    Finalized: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300' }
  };

  const currentStatus = statusConfig[data.status];

  // Sync React Flow node data
  useEffect(() => {
    if (reactFlowCanvas && reactFlowCanvas.updateNodeData) {
      reactFlowCanvas.updateNodeData(data.id, data);
    }
  }, [data, reactFlowCanvas]);

  // Handle expansion
  const toggleExpansion = (e?: React.MouseEvent) => {
    console.log('Toggling expansion', e);
    // Prevent text selection when clicking to expand/collapse
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    updateAttributes({ ...data, isExpanded: newExpanded });
    console.log('Node expanded state:', newExpanded);
  };

  // Save changes
  const handleSave = () => {
    updateAttributes(editData);
    setIsEditing(false);
    
    // Sync with React Flow
    if (reactFlowCanvas && reactFlowCanvas.updateNodeData) {
      reactFlowCanvas.updateNodeData(editData.id, editData);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  

  // Detect entities using AI
  const detectCharacters = async () => {
    console.log('[SceneBeatNode] Detect Entities clicked', { beatId: data.id, chapter: data.chapterName, index: data.sceneBeatIndex });
    if (!aiSettings) { console.debug('[SceneBeatNode] AI settings not loaded'); return; }
    const range = findSceneContentRange();
    if (!range || !range.sceneContent?.trim()) { console.debug('[SceneBeatNode] No scene content extracted; aborting detect'); return; }
    setIsDetecting(true);
    setAiError(null);
    try {
      console.debug('[SceneBeatNode] Starting detect_entities with selection length', range.sceneContent.length);
      const known = {
        characters: (bookCtx && currentBookId && currentVersionId) ? ((await bookCtx.getCharacters(currentBookId, currentVersionId)).map(c => c.name)) : [],
        locations: [],
        objects: [],
        lore: [],
      };
      const hints = [
        `Known canonical registries (optional hints; may be empty):`,
        `- Characters: <<${known.characters.join(', ')}>>`,
        `- Locations: <<${known.locations.join(', ')}>>`,
        `- Objects: <<${known.objects.join(', ')}>>`,
        `- Lore: <<${known.lore.join(', ')}>>`,
      ].join('\n');
      let jsonText = '';
      await runFeature({
        featureId: 'detect_entities',
        settings: aiSettings,
        selectionText: [
          `Scene excerpt:`,
          `<<${range.sceneContent}>>`,
          '',
          hints,
          '',
          'Instruction:',
          '- Extract entities and timeline beats strictly per the schema and rules. Return ONLY JSON.',
          '- Do NOT include generic/common nouns for locations or objects (e.g., forest, woods, tree, rock, stone, street, road, door, window, room, house, river, mountain, hill, sky, sun, moon) unless they are proper-named (e.g., "Lemurian Forest", "Skyhold Bridge").',
          '- For locations/objects/lore, prefer proper names and distinct identifiers; skip vague descriptors ("a cavern", "the forest") unless capitalized proper nouns.',
          '- Characters should be named entities (or clearly designated aliases).',
          '- If unsure whether a noun is a proper name, omit it.',
        ].join('\n'),
        contextText: '',
        stream: false,
        temperature: 0.1,
        // Dynamic maxTokens based on prompt sizes
        maxTokens: (() => {
          const sys = aiSettings.features.find(f => f.id === 'detect_entities')?.presets.find(p => (p.enabled ?? true))?.systemPrompt || '';
          const up = [
            `Scene excerpt:`,
            `<<${range.sceneContent}>>`,
            '',
            hints,
            '',
            'Instruction:',
            '- Extract entities and timeline beats strictly per the schema and rules. Return ONLY JSON.',
            '- Do NOT include generic/common nouns for locations or objects (e.g., forest, woods, tree, rock, stone, street, road, door, window, room, house, river, mountain, hill, sky, sun, moon) unless they are proper-named (e.g., "Lemurian Forest", "Skyhold Bridge").',
            '- For locations/objects/lore, prefer proper names and distinct identifiers; skip vague descriptors ("a cavern", "the forest") unless capitalized proper nouns.',
            '- Characters should be named entities (or clearly designated aliases).',
            '- If unsure whether a noun is a proper name, omit it.',
          ].join('\n');
          return computeDynamicMaxTokens(sys, up);
        })(),
        responseFormat: { type: 'json_object' },
        onDone: (final) => { jsonText = final || ''; console.debug('[SceneBeatNode] detect_entities onDone bytes', (final || '').length); },
        onError: (e) => { console.error('[SceneBeatNode] detect_entities error', e); setAiError(e); },
      });
      if (!jsonText) return;
      // Print a concise usage summary (approximate tokens)
      try {
        const sys = aiSettings.features.find(f => f.id === 'detect_entities')?.presets.find(p => (p.enabled ?? true))?.systemPrompt || '';
        const up = `Scene excerpt:\n<<${range.sceneContent}>>\n\n${hints}\n\nInstruction:\nExtract entities and timeline beats strictly per the schema and rules. Return ONLY JSON.`;
        const inputTokens = Math.round((sys.length + up.length) / 4);
        const outputTokens = Math.round(jsonText.length / 4);
        console.log('[AI USAGE] detect_entities -> model=', aiSettings.providers.find(p=>p.id=== (aiSettings.features.find(f=>f.id==='detect_entities')?.presets[0].provider))?.name || aiSettings.features.find(f=>f.id==='detect_entities')?.presets[0].provider, 'inputTokens≈', inputTokens, 'outputTokens≈', outputTokens);
      } catch {}
      // Clean possible code fences and hidden reasoning
      let cleaned = jsonText.trim();
      cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
      cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
      cleaned = cleaned.replace(/<think>[\s\S]*$/i, '');
      cleaned = cleaned.replace(/<\/?think>/gi, '');
      cleaned = cleaned.trim();
      // Extract only the first balanced JSON object in case provider appended extra prose
      const extracted = extractFirstJsonObject(cleaned) || cleaned;
      if (extracted !== cleaned) {
        console.debug('[SceneBeatNode] detect_entities extracted first JSON length', extracted.length);
      }
      console.debug('[SceneBeatNode] detect_entities cleaned JSON preview', cleaned.slice(0, 200));
      // Post-validate required keys
      const parsed = JSON.parse(extracted);
      const ensured = {
        povCharacterName: String(parsed.povCharacterName || ''),
        characters: Array.isArray(parsed.characters) ? parsed.characters : [],
        locations: Array.isArray(parsed.locations) ? parsed.locations : [],
        objects: Array.isArray(parsed.objects) ? parsed.objects : [],
        lore: Array.isArray(parsed.lore) ? parsed.lore : [],
        timelineEvents: Array.isArray(parsed.timelineEvents) ? parsed.timelineEvents : [],
      };
      console.log('[SceneBeatNode] detect_entities parsed keys', {
        pov: ensured.povCharacterName,
        charCount: ensured.characters.length,
        locCount: ensured.locations.length,
        objCount: ensured.objects.length,
        loreCount: ensured.lore.length,
        timelineCount: ensured.timelineEvents.length,
      });

      // Light post-filter to remove obviously generic items unless proper-named
      const genericTerms = new Set([
        'forest','woods','tree','rock','stone','pebble','boulder','street','road','alley','door','window','room','house','hut','cabin','river','stream','lake','pond','mountain','hill','valley','sky','sun','moon','star','cloud','cave','cavern','shore','beach','desert','ocean','sea','village','town','city','castle','tower'
      ]);
      const isProperNamed = (name: string) => {
        const trimmed = String(name || '').trim();
        if (!trimmed) return false;
        // Consider proper-named if contains an internal capitalized word or is Title Case
        const hasCapitalWord = /\b[A-Z][a-z]+/.test(trimmed);
        return hasCapitalWord;
      };
      const filterEntityList = (arr: any[], key: 'name' | 'title' = 'name') =>
        arr.filter((x: any) => {
          const nm = String(x?.[key] ?? x?.name ?? '').trim();
          if (!nm) return false;
          const lower = nm.toLowerCase();
          if (genericTerms.has(lower) && !isProperNamed(nm)) return false;
          return true;
        });
      ensured.locations = filterEntityList(ensured.locations, 'name');
      ensured.objects = filterEntityList(ensured.objects, 'name');
      ensured.lore = filterEntityList(ensured.lore, 'name');
      console.log('[SceneBeatNode] detect_entities after generic filter', {
        locNames: ensured.locations.map((l:any)=>l.name),
        objNames: ensured.objects.map((o:any)=>o.name),
        loreNames: ensured.lore.map((l:any)=>l.name||l.title),
      });
      // Insert into registries and world data
  const linkIds = { characters: [] as string[], locations: [] as string[], objects: [] as string[], lore: [] as string[] };
  const nameToCharId = new Map<string, string>();
      let selectedWorldId: string | null | undefined = data.worldId;
      try {
        // Prefer globally selected world from context if none set on node
        const ctxSel = (bookCtx as any)?.selectedWorldId || null;
        if (!selectedWorldId && ctxSel) selectedWorldId = ctxSel;
      } catch {}
      console.log('[SceneBeatNode] selectedWorldId resolved', { nodeWorldId: data.worldId, ctxWorldId: (bookCtx as any)?.selectedWorldId, selectedWorldId });
      if (bookCtx && currentBookId && currentVersionId) {
        // Characters: auto-create if missing
        const existingChars = await bookCtx.getCharacters(currentBookId, currentVersionId).catch(()=>[]) as any[];
        // Seed lookup with existing characters
        for (const c of existingChars) {
          const nm = (c.name || c.fullName || '').trim();
          if (nm) nameToCharId.set(nm.toLowerCase(), c.id);
          if (Array.isArray(c.aliases)) {
            for (const a of c.aliases) {
              const an = String(a || '').trim();
              if (an) nameToCharId.set(an.toLowerCase(), c.id);
            }
          }
        }
        for (const ch of ensured.characters) {
          const candidateName = String(ch?.name || '').trim();
          if (!candidateName) continue;
          const lower = candidateName.toLowerCase();
          const existingId = nameToCharId.get(lower);
          if (existingId) {
            linkIds.characters.push(existingId);
            console.log('[SceneBeatNode] character exists; linking', { name: candidateName, id: existingId });
          } else {
            // Try case-insensitive match in existing list for safety
            const found = existingChars.find(c => String(c.name || c.fullName || '').trim().toLowerCase() === lower);
            if (found) {
              linkIds.characters.push(found.id);
              nameToCharId.set(lower, found.id);
              console.log('[SceneBeatNode] character found by case-insensitive match; linking', { name: candidateName, id: found.id });
            } else {
              try {
                const created = await bookCtx.createCharacter(currentBookId, currentVersionId, {
                  name: candidateName,
                  image: '',
                  quote: '',
                  fullName: candidateName,
                  aliases: Array.isArray(ch.aliases) ? ch.aliases : [],
                  // Ensure Characters page categorizes newly detected entries
                  importance: 'Tertiary',
                } as any);
                linkIds.characters.push(created.id);
                nameToCharId.set(lower, created.id);
                if (Array.isArray(ch.aliases)) {
                  for (const a of ch.aliases) {
                    const an = String(a || '').trim();
                    if (an) nameToCharId.set(an.toLowerCase(), created.id);
                  }
                }
                console.log('[SceneBeatNode] character created', { name: candidateName, id: created.id });
              } catch (e) {
                console.warn('[SceneBeatNode] createCharacter failed for', candidateName, e);
              }
            }
          }
        }

        // Worlds: upsert locations/objects/lore under selected world if available
        if (selectedWorldId) {
          // Locations
          try {
            const existingLocs = await bookCtx.getLocations(currentBookId, currentVersionId, selectedWorldId).catch(()=>[]) as any[];
            for (const l of ensured.locations) {
              const name = l.name;
              if (!name) continue;
              const foundL = existingLocs.find((x:any)=> x.name === name);
              if (foundL) {
                linkIds.locations.push(foundL.id);
                console.log('[SceneBeatNode] location exists; linking', { name, id: foundL.id, worldId: selectedWorldId });
              } else {
                const createdL = await bookCtx.createLocation(currentBookId, currentVersionId, selectedWorldId, {
                  name,
                  type: 'place',
                  region: '',
                  description: '',
                  history: [],
                  geography: { terrain: '', climate: '', floraFauna: [] },
                  culture: { traditions: [], language: [], religion: [], governance: '' },
                  politics: { alliances: [], conflicts: [], leaders: [] },
                  economy: { trade: [], resources: [], technology: '' },
                  timelineEvents: [],
                  beliefsAndMyths: [],
                  landmarks: [],
                  parentWorldId: selectedWorldId,
                } as any);
                linkIds.locations.push(createdL.id);
                console.log('[SceneBeatNode] location created', { name, id: createdL.id, worldId: selectedWorldId });
              }
            }
          } catch (e) { console.warn('[SceneBeatNode] upsert locations failed', e); }

          // Objects
          try {
            const existingObjs = await bookCtx.getWorldObjects(currentBookId, currentVersionId, selectedWorldId).catch(()=>[]) as any[];
            for (const o of ensured.objects) {
              const name = o.name;
              if (!name) continue;
              const foundO = existingObjs.find((x:any)=> x.name === name);
              if (foundO) {
                linkIds.objects.push(foundO.id);
                console.log('[SceneBeatNode] object exists; linking', { name, id: foundO.id, worldId: selectedWorldId });
              } else {
                const createdO = await bookCtx.createWorldObject(currentBookId, currentVersionId, selectedWorldId, {
                  name,
                  type: 'object',
                  origin: '',
                  description: '',
                  powers: [],
                  limitations: [],
                  pastOwners: [],
                  timelineEvents: [],
                  parentWorldId: selectedWorldId,
                } as any);
                linkIds.objects.push(createdO.id);
                console.log('[SceneBeatNode] object created', { name, id: createdO.id, worldId: selectedWorldId });
              }
            }
          } catch (e) { console.warn('[SceneBeatNode] upsert objects failed', e); }

          // Lore
          try {
            const existingLore = await bookCtx.getLore(currentBookId, currentVersionId, selectedWorldId).catch(()=>[]) as any[];
            for (const lr of ensured.lore) {
              const name = lr.name || lr.title;
              if (!name) continue;
              const foundLr = existingLore.find((x:any)=> (x.title || x.name) === name);
              if (foundLr) {
                linkIds.lore.push(foundLr.id);
                console.log('[SceneBeatNode] lore exists; linking', { name, id: foundLr.id, worldId: selectedWorldId });
              } else {
                const createdLr = await bookCtx.createLore(currentBookId, currentVersionId, selectedWorldId, {
                  title: name,
                  category: 'legend',
                  description: '',
                  timeline: { startYear: '', endYear: '', age: '' },
                  keyFigures: [],
                  locationsInvolved: [],
                  objectsInvolved: [],
                  outcome: '',
                  culturalImpact: '',
                  parentWorldId: selectedWorldId,
                } as any);
                linkIds.lore.push(createdLr.id);
                console.log('[SceneBeatNode] lore created', { name, id: createdLr.id, worldId: selectedWorldId });
              }
            }
          } catch (e) { console.warn('[SceneBeatNode] upsert lore failed', e); }
        }
      }

      // Resolve POV character by name if provided
      const povCharName = ensured.povCharacterName?.trim();
      const povCharId = povCharName ? (nameToCharId.get(povCharName.toLowerCase()) || null) : null;
      console.log('[SceneBeatNode] POV resolution', { povCharName, povCharId });

      // Update PlotCanvas Scene node (description, pov, characters, locations, objects, lore)
      try {
        if (bookCtx && currentBookId && currentVersionId && data.sceneId) {
          console.log('[SceneBeatNode] Updating PlotCanvas Scene with links', {
            sceneId: data.sceneId,
            descriptionFromNode: data.summary,
            linkIds,
            povCharId,
            selectedWorldId
          });
          const canvas = await bookCtx.getPlotCanvas(currentBookId, currentVersionId);
          if (canvas?.nodes) {
            const nodes = canvas.nodes.map(n => {
              if (n.id === data.sceneId && (n as any).data?.type === 'scene') {
                const sceneData = { ...(n as any).data?.data };
                const charIds = linkIds.characters.length ? linkIds.characters : (sceneData.characters || []);
                const merged = {
                  ...(n as any),
                  data: {
                    ...(n as any).data,
                    data: {
                      ...sceneData,
                      description: data.summary || sceneData.description,
                      povCharacterId: povCharId || linkIds.characters[0] || sceneData.povCharacterId,
                      characters: Array.from(new Set([...(sceneData.characters||[]), ...charIds])),
                      locations: linkIds.locations.length ? linkIds.locations : (sceneData.locations || []),
                      objects: linkIds.objects.length ? linkIds.objects : (sceneData.objects || []),
                      lore: linkIds.lore.length ? linkIds.lore : (sceneData.lore || []),
                      worlds: selectedWorldId ? Array.from(new Set([...(sceneData.worlds||[]), selectedWorldId])) : (sceneData.worlds||[]),
                      timelineEventIds: (sceneData.timelineEventIds||[]),
                    }
                  }
                } as any;
                console.debug('[SceneBeatNode] Scene node merged data preview', {
                  povCharacterId: merged.data.data.povCharacterId,
                  characters: merged.data.data.characters,
                  locations: merged.data.data.locations,
                  objects: merged.data.data.objects,
                  lore: merged.data.data.lore,
                  worlds: merged.data.data.worlds,
                });
                return merged;
              }
              return n;
            });
            await bookCtx.updatePlotCanvas(currentBookId, currentVersionId, { nodes, edges: canvas.edges });
            console.log('[SceneBeatNode] PlotCanvas update complete for scene', { sceneId: data.sceneId });
          }
        }
      } catch (e) { console.warn('[SceneBeatNode] update PlotCanvas scene failed', e); }
      // Update node attributes
      setEditData(prev => ({
        ...prev,
        povCharacterId: povCharId || linkIds.characters[0],
        worldId: selectedWorldId || prev.worldId,
        characters: Array.from(new Set([...(prev.characters||[]), ...ensured.characters.map((c:any)=>c.name)])),
        locations: ensured.locations.map((l:any)=>l.name),
        objects: ensured.objects.map((o:any)=>o.name),
        lore: ensured.lore.map((x:any)=>x.name),
        // For legacy UI chip, aggregate world entities
        worldEntities: Array.from(new Set([
          ...ensured.locations.map((l:any)=>l.name),
          ...ensured.objects.map((o:any)=>o.name),
          ...ensured.lore.map((x:any)=>x.name),
        ])),
  timelineEvents: ensured.timelineEvents.map((t:any)=>({ when: String(t.when||''), where: String(t.where||''), who: Array.isArray(t.who)? t.who.map(String):[], what: String(t.what||''), consequence: String(t.consequence||'') }))
      }));
      updateAttributes({
        ...data,
        povCharacterId: povCharId || linkIds.characters[0],
        worldId: selectedWorldId || data.worldId,
        characters: Array.from(new Set([...(data.characters||[]), ...ensured.characters.map((c:any)=>c.name)])),
        locations: ensured.locations.map((l:any)=>l.name),
        objects: ensured.objects.map((o:any)=>o.name),
        lore: ensured.lore.map((x:any)=>x.name),
        worldEntities: Array.from(new Set([
          ...ensured.locations.map((l:any)=>l.name),
          ...ensured.objects.map((o:any)=>o.name),
          ...ensured.lore.map((x:any)=>x.name),
        ])),
        timelineEvents: ensured.timelineEvents.map((t:any)=>({ when: String(t.when||''), where: String(t.where||''), who: Array.isArray(t.who)? t.who.map(String):[], what: String(t.what||''), consequence: String(t.consequence||'') }))
      });
    } catch (e:any) {
  console.error('[SceneBeatNode] detect_entities exception', e);
  setAiError(e?.message || 'AI failed');
    } finally {
      setIsDetecting(false);
    }
  };

  // Summarize scene using AI preset
  const summarizeScene = async () => {
    console.log('[SceneBeatNode] Summarize Scene clicked', { beatId: data.id, chapter: data.chapterName, index: data.sceneBeatIndex });
    if (!aiSettings) { console.debug('[SceneBeatNode] AI settings not loaded'); return; }
    const range = findSceneContentRange();
    if (!range || !range.sceneContent?.trim()) { console.debug('[SceneBeatNode] No scene content extracted; aborting summarize'); return; }
    setAiBusy(true);
    setAiError(null);
    try {
      console.debug('[SceneBeatNode] Starting summarize_scene with selection length', range.sceneContent.length);
      const contextBits: string[] = [];
      // Attempt to locate chapter/act context from bookCtx narrative, if available
      // For now, use goal/summary in node attrs as chapter hints
      if (data.goal) contextBits.push(`Chapter description/goal (optional): <<${data.goal}>>`);
      // Determine project language (fallback to English)
      const projectLanguage = (() => {
        try {
          if (bookCtx && currentBookId) {
            const b = bookCtx.getBook(currentBookId);
            if (b?.language) return b.language;
          }
        } catch {}
        return 'English';
      })();

      const userPrompt = [
        'Context:',
        '- Act description (optional): <<>>',
        `- Chapter description/goal (optional): <<${data.goal || ''}>>`,
        `- Project language: <<${projectLanguage}>>`,
        '',
        'Scene excerpt to summarize (required):',
        `<<${range.sceneContent}>>`,
        '',
        'Instruction:',
        'Summarize the excerpt under the above rules in no more than 120 words. Use the project language.',
        'When you finish thinking, output ONLY the final summary wrapped exactly as: <final>...summary...</final>.',
        'Do not output any other text, tags, or labels. Absolutely no <think> or analysis in the final output.'
      ].join('\n');
      let finalText = '';
      // Compute dynamic max tokens
      const summarizePresetSystem = aiSettings.features.find(f => f.id === 'summarize_scene')?.presets.find(p => (p.enabled ?? true))?.systemPrompt || '';
      const dynamicMax = computeDynamicMaxTokens(summarizePresetSystem, userPrompt);
      // Add a safety timeout so the UI doesn't hang indefinitely on slow models
      const ac = new AbortController();
      const timeoutMs = 45000; // 45s
      const timeout = setTimeout(() => { try { ac.abort(); console.warn('[SceneBeatNode] summarize_scene aborted due to timeout'); } catch {} }, timeoutMs);
      await runFeature({
        featureId: 'summarize_scene',
        settings: aiSettings,
        selectionText: userPrompt,
        contextText: '',
        stream: false,
  temperature: 0.3,
        // Cap max tokens tightly; 120 words summary should fit well under this
        maxTokens: Math.min(dynamicMax, 512),
        // Hint Together reasoning models to avoid long internal thinking loops
        responseFormat: undefined,
        // Provider-specific extras (merged in openaiLike): only effective on Together
        // We request no safety eval logging and set a moderate reasoning effort if applicable
        extra: { reasoning: { effort: 'medium' } },
        signal: ac.signal,
        onDone: (txt) => { finalText = (txt || '').trim(); console.debug('[SceneBeatNode] summarize_scene onDone bytes', finalText.length); },
        onError: (e) => { console.error('[SceneBeatNode] summarize_scene error', e); setAiError(e); },
      });
      try { clearTimeout(timeout); } catch {}
      if (finalText) {
        // Print a concise usage summary (approximate tokens)
        try {
          const inputTokens = Math.round((summarizePresetSystem.length + userPrompt.length) / 4);
          const outputTokens = Math.round(finalText.length / 4);
          console.log('[AI USAGE] summarize_scene -> inputTokens≈', inputTokens, 'outputTokens≈', outputTokens);
        } catch {}
        // Prefer content inside <final>...</final>
        let cleaned = '';
        const match = finalText.match(/<final>([\s\S]*?)<\/final>/i);
        if (match) {
          cleaned = match[1];
        } else {
          cleaned = finalText;
        }
  // Strip any formatting/fences or hidden reasoning the provider might add
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  // Remove paired <think> blocks and any open-ended <think> tail
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*$/i, '');
  cleaned = cleaned.replace(/<\/?think>/gi, '');
  // If tags accidentally leaked, remove the markers too
  cleaned = cleaned.replace(/<\/?final>/gi, '');
  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Drop stray leading artifacts like "format", "final answer", "summary:", etc.
  cleaned = cleaned.replace(/^[\s\u200B-\u200D\uFEFF]*((?:format|final(?:\s*answer)?|answer|summary|output|response|result|conclusion|formatted|note|notes|explanation|analysis|content|text|message)\s*[:.\-]*\s*)+/i, '');
  // Trim leftover leading/trailing whitespace and collapse leading blank lines
  cleaned = cleaned.replace(/^\s+/, '').trim();
        console.debug('[SceneBeatNode] summarize_scene cleaned preview', cleaned.slice(0, 200));
        setEditData(prev => ({ ...prev, summary: cleaned }));
        updateAttributes({ ...data, summary: cleaned });
        // Also push summary into PlotCanvas Scene node description for visibility
        try {
          if (bookCtx && currentBookId && currentVersionId && data.sceneId) {
            const canvas = await bookCtx.getPlotCanvas(currentBookId, currentVersionId);
            if (canvas?.nodes) {
              const nodes = canvas.nodes.map(n => {
                if (n.id === data.sceneId && (n as any).data?.type === 'scene') {
                  const sceneData = { ...(n as any).data?.data };
                  return {
                    ...(n as any),
                    data: { ...(n as any).data, data: { ...sceneData, description: cleaned } }
                  } as any;
                }
                return n;
              });
              await bookCtx.updatePlotCanvas(currentBookId, currentVersionId, { nodes, edges: canvas.edges });
            }
          }
        } catch (e) { console.warn('[SceneBeatNode] summarize -> update PlotCanvas scene failed', e); }
      }
    } catch (e:any) {
      console.error('[SceneBeatNode] summarize_scene exception', e);
      setAiError(e?.message || 'AI failed');
    } finally {
      setAiBusy(false);
    }
  };

  // Validate consistency (mock implementation)
  const validateConsistency = async () => {
    // Mock consistency check
    alert("Consistency check: All characters and world entities are consistent with previous scenes.");
  };

  return (
    <NodeViewWrapper>
      <motion.div
        className="scene-beat-node my-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200"
        data-node-type="sceneBeat"
        data-node-id={data.id || `scene-beat-${data.sceneBeatIndex}`}
        data-chapter-name={data.chapterName}
        data-scene-beat-index={data.sceneBeatIndex}
        data-scene-title={`${data.chapterName}-SceneBeat-${data.sceneBeatIndex}`}
        data-scene-summary={data.summary}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      {/* Header - Collapsed View */}
      <div 
        className="node-header flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-2xl"
        onClick={toggleExpansion}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-gray-500 text-lg">▶</span>
          </motion.div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🔗</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {data.chapterName} – SceneBeat_{data.sceneBeatIndex}
              </h3>
              {!isExpanded && data.summary && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                  {data.summary}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
            {data.status}
          </span>
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-4">
              {aiError && (
                <div className="px-3 py-2 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 text-sm">
                  {aiError}
                </div>
              )}
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-4">
                  {/* Scene Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scene Title
                    </label>
                    <input
                      type="text"
                      value={(editData as any).sceneTitle || ''}
                      onChange={(e) => setEditData((prev: SceneBeatData) => ({ ...(prev as any), sceneTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                      placeholder="Optional title for this scene"
                    />
                  </div>
                  {/* World selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scene World</label>
                    <select
                      value={editData.worldId || ''}
                      onChange={(e)=> setEditData((prev: SceneBeatData)=> ({ ...prev, worldId: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <option value="">Unassigned</option>
                      {worldOptions.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    {/* Populate options asynchronously */}
                  </div>
                  {/* Summary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Summary
                    </label>
                    <textarea
                      value={editData.summary}
                      onChange={(e) => setEditData((prev: SceneBeatData) => ({ ...prev, summary: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 resize-none"
                      rows={3}
                      placeholder="What happens in this scene beat..."
                    />
                  </div>

                  {/* Goal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Goal
                    </label>
                    <input
                      type="text"
                      value={editData.goal}
                      onChange={(e) => setEditData((prev: SceneBeatData) => ({ ...prev, goal: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                      placeholder="Character or story goal driving this beat..."
                    />
                  </div>

                  {/* Characters */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Characters Involved
                      </label>
                      <motion.button
                        onClick={detectCharacters}
                        disabled={isDetecting}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-purple-600">✨</span>
                        {isDetecting ? 'Detecting...' : '🧠 Detect Entities'}
                      </motion.button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editData.characters.map((char: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                        >
                          <span className="text-blue-600">👤</span>
                          {char}
                          <button
                            onClick={() => setEditData((prev: SceneBeatData) => ({
                              ...prev,
                              characters: prev.characters.filter((_: string, i: number) => i !== index)
                            }))}
                            className="ml-1 hover:text-red-500"
                          >
                            <span className="text-red-500">✕</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* World Entities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      World Entities / Locations
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {editData.worldEntities.map((entity: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs"
                        >
                          <span className="text-green-600">📍</span>
                          {entity}
                          <button
                            onClick={() => setEditData((prev: SceneBeatData) => ({
                              ...prev,
                              worldEntities: prev.worldEntities.filter((_: string, i: number) => i !== index)
                            }))}
                            className="ml-1 hover:text-red-500"
                          >
                            <span className="text-red-500">✕</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Event */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timeline Event (Optional)
                    </label>
                    <input
                      type="text"
                      value={editData.timelineEvent || ''}
                      onChange={(e) => setEditData((prev: SceneBeatData) => ({ ...prev, timelineEvent: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                      placeholder="Date/time or beat number..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData((prev: SceneBeatData) => ({ 
                        ...prev, 
                        status: e.target.value as 'Draft' | 'Edited' | 'Finalized' 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Edited">Edited</option>
                      <option value="Finalized">Finalized</option>
                    </select>
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-2 pt-2">
                    <motion.button
                      onClick={async () => {
                        // When saving, also sync scene title to plot canvas if present
                        try {
                          const next = editData as any;
                          if (bookCtx && currentBookId && currentVersionId && data.sceneId && next.sceneTitle != null) {
                            const canvas = await bookCtx.getPlotCanvas(currentBookId, currentVersionId);
                            if (canvas?.nodes) {
                              const nodes = canvas.nodes.map((n:any) => {
                                if (n.id === data.sceneId && (n as any).data?.type === 'scene') {
                                  const d = { ...(n as any).data?.data };
                                  return { ...(n as any), data: { ...(n as any).data, data: { ...d, title: next.sceneTitle } } };
                                }
                                return n;
                              });
                              await bookCtx.updatePlotCanvas(currentBookId, currentVersionId, { nodes, edges: canvas.edges });
                              // also push to attributes so it's persisted in the node
                              updateAttributes({ ...(data as any), sceneTitle: next.sceneTitle });
                              window.dispatchEvent(new CustomEvent('actUpdated'));
                            }
                          }
                        } catch (e) { console.warn('[SceneBeatNode] failed to sync scene title', e); }
                        handleSave();
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-white">✓</span>
                      Save
                    </motion.button>
                    <motion.button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-white">✕</span>
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-4">
                  {/* Scene Title */}
                  {Boolean((data as any).sceneTitle) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scene Title</h4>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{(data as any).sceneTitle}</p>
                    </div>
                  )}
                  {/* World */}
                  {data.worldId && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">World</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{
                        (() => {
                          const opt = worldOptions.find(w => w.id === data.worldId);
                          return opt ? opt.name : data.worldId;
                        })()
                      }</p>
                    </div>
                  )}
                  {/* Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {data.summary || 'No summary provided'}
                    </p>
                  </div>

                  {/* Goal */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data.goal || 'No goal defined'}
                    </p>
                  </div>

                  {/* Characters */}
                  {data.characters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Characters Involved</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.characters.map((char: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                          >
                            <span className="text-blue-600">👤</span>
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* World Entities */}
                  {data.worldEntities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">World Entities</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.worldEntities.map((entity: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs"
                          >
                            <span className="text-green-600">📍</span>
                            {entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Locations */}
                  {Array.isArray(data.locations) && data.locations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Locations</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.locations.map((loc: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs"
                          >
                            <span className="text-emerald-600">🗺️</span>
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Objects */}
                  {Array.isArray(data.objects) && data.objects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Objects</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.objects.map((obj: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs"
                          >
                            <span className="text-amber-600">🎒</span>
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lore */}
                  {Array.isArray(data.lore) && data.lore.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lore</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.lore.map((item: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 rounded-full text-xs"
                          >
                            <span className="text-fuchsia-600">📜</span>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline Events */}
                  {Array.isArray(data.timelineEvents) && data.timelineEvents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timeline Events</h4>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {data.timelineEvents.map((ev: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-0.5">🗓️</span>
                            <span>
                              {ev.when ? `[${ev.when}] ` : ''}
                              {ev.where ? `@ ${ev.where}: ` : ''}
                              {ev.what || ''}
                              {Array.isArray(ev.who) && ev.who.length > 0 ? ` — Involved: ${ev.who.join(', ')}` : ''}
                              {ev.consequence ? ` — Consequence: ${ev.consequence}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Timeline Event */}
                  {data.timelineEvent && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timeline Event</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-lg">🕒</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{data.timelineEvent}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <motion.button
                      onClick={detectCharacters}
                      disabled={isDetecting}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Extract POV, characters, locations, objects, lore, and timeline beats from this beat’s following scene."
                    >
                      <span className="text-purple-600">✨</span>
                      {isDetecting ? 'Detecting...' : '🧠 Detect Entities'}
                    </motion.button>

                    <motion.button
                      onClick={summarizeScene}
                      disabled={aiBusy}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Compress this beat’s following scene into a crisp plot-focused summary."
                    >
                      {aiBusy ? 'Summarizing…' : '✍️ Summarize Scene'}
                    </motion.button>

                    <motion.button
                      onClick={validateConsistency}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-700 dark:text-green-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🧩 Validate Consistency
                    </motion.button>

                    <motion.button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-gray-600">✏️</span>
                      Edit
                    </motion.button>

                    <motion.button
                      onClick={deleteNode}
                      className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-red-600">🗑️</span>
                      Delete Section
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </NodeViewWrapper>
  );
};

export default SceneBeatNode;
