import { createChapter as dalCreateChapter, putChapter as dalPutChapter, getVersion, putVersion, getChapter as dalGetChapter } from '../../data/dal';

type NarrativeFlowNode = any;

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function countWordsFromTipTapJSON(doc: any): number {
  try {
    const text = JSON.stringify(doc)
      .replace(/\n/g, ' ')
      .replace(/\"type\"\s*:\s*\"[^\"]+\"/g, ' ')
      .replace(/\"attrs\"\s*:\s*\{[^}]*\}/g, ' ')
      .replace(/\"marks\"\s*:\s*\[[^\]]*\]/g, ' ')
      .replace(/[^A-Za-z0-9']+/g, ' ')
      .trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  } catch {
    return 0;
  }
}

function withSceneBeat(content: any, sceneId: string, chapterId: string, chapterTitle: string): any {
  try {
    const beatNode = {
      type: 'sceneBeat',
      attrs: {
        id: genId('sbeat'),
        chapterId,
        sceneId,
        chapterName: chapterTitle || 'Chapter',
        sceneBeatIndex: 1,
        summary: '',
        goal: '',
        characters: [],
        worldEntities: [],
        timelineEvent: '',
        status: 'Draft',
        isExpanded: false,
      },
    } as any;
    // Ensure we don't replace the entire content; only prepend to the content array
    const baseDoc = (content && typeof content === 'object') ? content : { type: 'doc', content: [] };
    const originalContent = Array.isArray((baseDoc as any).content) ? (baseDoc as any).content : [];
    const newDoc: any = { ...baseDoc, content: [beatNode, ...originalContent] };
    // Maintain/patch metadata
    const prevMeta = (baseDoc as any).metadata || {};
    newDoc.metadata = {
      ...prevMeta,
      totalCharacters: prevMeta.totalCharacters || 0,
      totalWords: prevMeta.totalWords || 0,
      lastEditedAt: new Date().toISOString(),
    };
    return newDoc;
  } catch (e) {
    console.warn('withSceneBeat failed, returning original content', e);
    return content;
  }
}

// Transform imported TipTap JSON to:
// - Insert an initial SceneBeat at the top (Scene 1)
// - Preserve any existing content
// - For each 'sceneDivider' node, keep it and insert a new SceneBeat after it (Scene N+1)
// Returns new content and specs for scene plot nodes to create
function enhanceContentWithDividersAndBeats(
  content: any,
  chapterId: string,
  chapterTitle: string,
  chapterNodeId?: string,
  basePositionY: number = 400
): { content: any; sceneSpecs: Array<{ id: string; title: string; positionY: number }>; beatSceneIds: string[] } {
  const baseDoc = (content && typeof content === 'object') ? content : { type: 'doc', content: [] };
  const original = Array.isArray((baseDoc as any).content) ? (baseDoc as any).content : [];
  const nextContent: any[] = [];
  const sceneSpecs: Array<{ id: string; title: string; positionY: number }> = [];
  const beatSceneIds: string[] = [];

  let sceneIndex = 1;
  // Initial scene and beat at the top
  const scene1Id = genId('scnode');
  const scene1Title = `${chapterTitle || 'Chapter'} - Scene ${sceneIndex}`;
  sceneSpecs.push({ id: scene1Id, title: scene1Title, positionY: basePositionY + (sceneIndex * 120) });
  beatSceneIds.push(scene1Id);
  nextContent.push({
    type: 'sceneBeat',
    attrs: {
      id: genId('sbeat'),
      chapterId,
      sceneId: scene1Id,
      chapterName: chapterTitle || 'Chapter',
      sceneBeatIndex: sceneIndex,
      summary: '',
      goal: '',
      characters: [],
      worldEntities: [],
      timelineEvent: '',
      status: 'Draft',
      isExpanded: false,
    },
  });

  for (const node of original) {
    if (node && node.type === 'sceneDivider') {
      // Keep the divider node as-is
      nextContent.push(node);
      // Next scene after divider
      sceneIndex += 1;
      const scId = genId('scnode');
      const title = `${chapterTitle || 'Chapter'} - Scene ${sceneIndex}`;
      sceneSpecs.push({ id: scId, title, positionY: basePositionY + (sceneIndex * 120) });
      beatSceneIds.push(scId);
      // Insert SceneBeat node immediately after divider
      nextContent.push({
        type: 'sceneBeat',
        attrs: {
          id: genId('sbeat'),
          chapterId,
          sceneId: scId,
          chapterName: chapterTitle || 'Chapter',
          sceneBeatIndex: sceneIndex,
          summary: '',
          goal: '',
          characters: [],
          worldEntities: [],
          timelineEvent: '',
          status: 'Draft',
          isExpanded: false,
        },
      });
    } else {
      nextContent.push(node);
    }
  }

  const newDoc: any = { ...baseDoc, content: nextContent };
  const prevMeta = (baseDoc as any).metadata || {};
  newDoc.metadata = {
    ...prevMeta,
    totalCharacters: prevMeta.totalCharacters || 0,
    totalWords: prevMeta.totalWords || 0,
    lastEditedAt: new Date().toISOString(),
  };
  return { content: newDoc, sceneSpecs, beatSceneIds };
}

export interface PersistChapterParams {
  bookId: string;
  versionId: string;
  userId: string;
  linkedAct?: string;
}

export async function persistImportedChapters(chapters: { title: string; content: any }[], params: PersistChapterParams) {
  const { encryptionService } = await import('../encryptionService');
  const createdIds: string[] = [];
  let sortIndexBase = Date.now();

  // Load version plot canvas once
  const version = await getVersion(params.versionId);
  const canvas = (version?.plotCanvas as any) || { nodes: [], edges: [] };
  const nodes: NarrativeFlowNode[] = Array.isArray(canvas.nodes) ? [...canvas.nodes] : [];
  const edges: any[] = Array.isArray(canvas.edges) ? [...canvas.edges] : [];
  const actId = params.linkedAct;
  const actNode = actId ? nodes.find((n: any) => n.id === actId && (n as any).data?.type === 'act') : null;

  for (const ch of chapters) {
    const id = `ch_${sortIndexBase}_${Math.random().toString(36).slice(2, 6)}`;
    sortIndexBase += 1;

    // Optional graph linkage
  let chapterNodeId: string | undefined;
    if (actNode) {
      chapterNodeId = genId('chapnode');
      const positionY = 400 + (nodes.filter((n: any) => (n as any).data?.type === 'chapter' && (n as any).data?.parentId === actId).length + 1) * 150;
      nodes.push(
        {
          id: chapterNodeId,
          type: 'chapter',
          position: { x: 0, y: positionY },
          data: {
            id: chapterNodeId,
            type: 'chapter',
            status: 'not-completed',
            position: { x: 0, y: positionY },
            parentId: actId,
            childIds: [],
            linkedNodeIds: [],
            isExpanded: true,
            data: { title: ch.title || 'Untitled Chapter', description: `Chapter: ${ch.title || ''}`.trim(), goal: '', timelineEventIds: [] },
          },
        }
      );
      // Update parent/child relations
      const actIdx = nodes.findIndex((n: any) => n.id === actId);
      if (actIdx !== -1 && chapterNodeId) {
        const a = JSON.parse(JSON.stringify(nodes[actIdx]));
        a.data = a.data || {}; a.data.childIds = Array.isArray(a.data.childIds) ? a.data.childIds : [];
        if (!a.data.childIds.includes(chapterNodeId)) a.data.childIds.push(chapterNodeId);
        nodes[actIdx] = a;
      }
    }

    // Create chapter row first
    await dalCreateChapter({
      id,
      bookId: params.bookId,
      versionId: params.versionId,
      title: ch.title || 'Untitled Chapter',
      linkedAct: params.linkedAct,
      linkedPlotNodeId: chapterNodeId,
      linkedScenes: undefined,
      sortIndex: createdIds.length + 1,
      syncState: 'dirty',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    // Transform content: inject SceneDivider/SceneBeat nodes and build scene plot nodes under this chapter
    let transformed = { content: ch.content, sceneSpecs: [] as any[], beatSceneIds: [] as string[] };
    try {
      const chapterPosY = (() => {
        const chNode = nodes.find((n: any) => n.id === chapterNodeId);
        return chNode?.position?.y ?? 400;
      })();
      transformed = enhanceContentWithDividersAndBeats(ch.content, id, ch.title || 'Chapter', chapterNodeId, chapterPosY);
    } catch (e) {
      console.warn('[import] enhanceContentWithDividersAndBeats failed; continuing with original content', e);
    }

    // Append scene plot nodes and link to chapter
    let sceneIdsForChapter: string[] = [];
    if (chapterNodeId && transformed.sceneSpecs.length) {
      const chIdx = nodes.findIndex((n: any) => n.id === chapterNodeId);
      if (chIdx !== -1) {
        const cn = JSON.parse(JSON.stringify(nodes[chIdx]));
        cn.data = cn.data || {}; cn.data.childIds = Array.isArray(cn.data.childIds) ? cn.data.childIds : [];
        for (const spec of transformed.sceneSpecs) {
          const scNode = {
            id: spec.id,
            type: 'scene',
            position: { x: 300, y: spec.positionY },
            data: {
              id: spec.id,
              type: 'scene',
              status: 'not-completed',
              position: { x: 300, y: spec.positionY },
              parentId: chapterNodeId,
              childIds: [],
              linkedNodeIds: [],
              isExpanded: true,
              data: { title: spec.title, description: `Imported scene of ${ch.title || 'chapter'}`, goal: '', chapter: id, characters: [], worlds: [], timelineEventIds: [] },
            },
          } as any;
          nodes.push(scNode);
          if (!cn.data.childIds.includes(spec.id)) cn.data.childIds.push(spec.id);
          sceneIdsForChapter.push(spec.id);
        }
        nodes[chIdx] = cn;
      }
    }

    // Content adjustments and word count
    const contentFinal = transformed.content;
    const words = countWordsFromTipTapJSON(contentFinal);
    if (!contentFinal.metadata) contentFinal.metadata = { totalCharacters: 0, totalWords: 0, lastEditedAt: new Date().toISOString() };
    contentFinal.metadata.totalWords = words;

    // Save encrypted content
    await encryptionService.saveChapterContent(
      id,
      params.bookId,
      params.versionId,
      params.userId,
      contentFinal,
      false,
      { isMinor: false, setHead: true }
    );

    // Update row with computed metadata WITHOUT clearing encrypted fields
    const prevRow = await dalGetChapter(id);
    await dalPutChapter({
      ...(prevRow || {}),
      id,
      bookId: params.bookId,
      versionId: params.versionId,
      title: ch.title || (prevRow as any)?.title || 'Untitled Chapter',
      linkedAct: params.linkedAct,
      linkedPlotNodeId: chapterNodeId,
      linkedScenes: sceneIdsForChapter.length ? sceneIdsForChapter : (prevRow as any)?.linkedScenes,
      sortIndex: createdIds.length + 1,
      wordCount: words,
      // preserve enc fields already written by encryptionService.saveChapterContent
      contentEnc: (prevRow as any)?.contentEnc,
      contentIv: (prevRow as any)?.contentIv,
      updatedAt: new Date().toISOString(),
    } as any);

    createdIds.push(id);
  }

  // Persist updated plot canvas back to version
  await putVersion({ ...(version as any), plotCanvas: { nodes, edges } });
  return createdIds;
}

export async function startImportDocxJob(input: { file?: File; arrayBuffer?: ArrayBuffer; bookId: string; versionId: string; userId: string; linkedAct?: string; }) {
  const { convertDocxToChapters } = await import('./convertDocx');
  const { useJobsStore } = await import('../../stores/jobs');
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const add = useJobsStore.getState().add;
  const update = useJobsStore.getState().update;
  add({ id: jobId, type: 'import_docx', status: 'queued', progress: 0, totalSteps: 4, currentStep: 0, meta: { fileName: (input.file as any)?.name || 'DOCX' }, startedAt: Date.now() });
  // notify UI to open the popup briefly for visibility
  window.dispatchEvent(new CustomEvent('jobs:openPopup'));

  try {
    update(jobId, { status: 'running', currentStep: 1, progress: 10 });
    const buf = input.arrayBuffer || (await input.file!.arrayBuffer());
    console.log('Starting DOCX import job for bookId:', input.bookId, 'versionId:', input.versionId, 'linkedAct:', input.linkedAct, 'file size:', buf?.byteLength);

    update(jobId, { currentStep: 2, progress: 35 });
  const chapters = await convertDocxToChapters(buf);
    console.log(`Converted DOCX to ${chapters.length} chapters for bookId:`, input.bookId);
    if (chapters.length === 0) throw new Error('No chapters found in the document.');

    update(jobId, { currentStep: 3, progress: Math.min(85, 35 + Math.max(10, chapters.length * 5)) });
    const ids = await persistImportedChapters(chapters, {
      bookId: input.bookId,
      versionId: input.versionId,
      userId: input.userId,
      linkedAct: input.linkedAct,
    });

    update(jobId, { currentStep: 4, progress: 100, status: 'completed', endedAt: Date.now(), meta: { ...(useJobsStore.getState().jobs.find(j => j.id === jobId)?.meta || {}), resultCount: chapters.length } });
    return { count: chapters.length, chapterIds: ids };
  } catch (e: any) {
    update(jobId, { status: 'failed', error: e?.message || 'Import failed', endedAt: Date.now() });
    throw e;
  }
}
