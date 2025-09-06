import { simpleDb, addLocalChapterRevision } from '../data/simpleDexie';
import type { Chapter as DbChapter, LocalChapterRevision } from '../data/simpleDexie';
import { apiClient } from '../api/apiClient';
import { encryptionService } from '../services/encryptionService';

type ChapterCloud = {
  id: string;
  title?: string;
  content?: any;
  revCloud?: string;
  revLocal?: string;
  updatedAt?: number | string;
};

function toTs(msOrIso?: number | string): number {
  if (!msOrIso) return 0;
  if (typeof msOrIso === 'number') return msOrIso;
  const t = Date.parse(msOrIso);
  return isNaN(t) ? 0 : t;
}

export type ChapterAction = 'push' | 'pull' | 'idle' | 'conflict';

export function decideChapterAction(local?: DbChapter | null, cloud?: ChapterCloud | null): ChapterAction {
  if (!local && cloud) return 'pull';
  if (local && !cloud) return 'push';
  if (!local && !cloud) return 'idle';

  const l: any = local as any;
  const c: any = cloud as any;
  const localDirty = l.syncState === 'dirty';
  const lRevCloud = l.revCloud;
  const cRev = c.revCloud || c.revLocal;

  if (localDirty && lRevCloud && cRev && lRevCloud !== cRev) {
    return 'conflict';
  }

  if (localDirty) return 'push';

  const lt = toTs(l.updatedAt);
  const ct = toTs(c.updatedAt);
  if (ct > lt) return 'pull';

  return 'idle';
}

/**
 * Sync chapters for a version bidirectionally with simple rules and revision awareness.
 * - Pull will decrypt from cloud payload into local encrypted storage.
 * - Push will decrypt local content and send plain content to cloud.
 */
export async function syncChaptersForVersion(bookId: string, versionId: string, userId: string): Promise<{
  pushed: string[];
  pulled: string[];
  conflicted: string[];
}> {
  const result = { pushed: [] as string[], pulled: [] as string[], conflicted: [] as string[] };

  // Fetch local and cloud listings
  const locals = await simpleDb.chapters.where('versionId').equals(versionId).toArray();
  let clouds: ChapterCloud[] = [];
  try {
    clouds = await apiClient.getChapters(bookId, versionId) as any;
  } catch {
    clouds = [];
  }

  const localMap = new Map<string, DbChapter>(locals.map(c => [c.id, c]));
  const cloudMap = new Map<string, ChapterCloud>(clouds.map(c => [c.id, c]));
  const ids = new Set<string>([...localMap.keys(), ...cloudMap.keys()]);

  for (const id of ids) {
    const local = localMap.get(id) || null;
    const cloud = cloudMap.get(id) || null;
    const action = decideChapterAction(local, cloud);

    if (action === 'push' && local) {
      // Load decrypted content, push to cloud, mark clean
      let content: any = undefined;
      try {
        content = await encryptionService.loadChapterContent(local.id, userId);
      } catch (_) {}
      const payload: any = {
        id: local.id,
        title: local.title,
        content,
        revLocal: (local as any).revLocal,
        wordCount: (local as any).wordCount,
        updatedAt: (local as any).updatedAt,
      };
      await apiClient.putChapter(bookId, versionId, local.id, payload);
      // Record a local revision (major=false if frequent, but we can mark push as major artifact)
      if (content) {
        const rev: LocalChapterRevision = {
          rev_id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          chapter_id: local.id,
          book_id: bookId,
          version_id: versionId,
          device_id: (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) ? 'browser' : 'device',
          parent_rev_id: (local as any).revLocal || null,
          base_cloud_rev_id: (local as any).revCloud || null,
          timestamp: Date.now(),
          is_minor: false,
          snapshot: content,
          word_count: (local as any).wordCount,
          char_count: JSON.stringify(content).length,
        };
        await addLocalChapterRevision(rev);
      }
      await simpleDb.chapters.put({
        ...local,
        revCloud: (local as any).revLocal || (local as any).revCloud,
        syncState: 'idle',
        conflictState: 'none',
      } as any);
      result.pushed.push(id);
      continue;
    }

    if (action === 'pull' && cloud) {
      // Ensure we have full chapter from cloud (with content)
      let remote = cloud as ChapterCloud;
      try {
        remote = await apiClient.getChapter(bookId, versionId, cloud.id) as any;
      } catch (_) {}

      const content = (remote as any).content;
      const title = remote.title || (local?.title ?? 'Untitled Chapter');
      // Persist encrypted locally via encryption service
      if (content != null) {
        await encryptionService.saveChapterContent(remote.id, bookId, versionId, userId, content, false);
        // Create a local revision to represent pulled state as a major snapshot
        const rev: LocalChapterRevision = {
          rev_id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          chapter_id: remote.id,
          book_id: bookId,
          version_id: versionId,
          device_id: 'cloud_pull',
          parent_rev_id: null,
          base_cloud_rev_id: (remote as any).revCloud || (remote as any).revLocal || null,
          timestamp: Date.now(),
          is_minor: false,
          snapshot: content,
          word_count: (content && JSON.stringify(content).split(/\s+/).length) || 0,
          char_count: (content && JSON.stringify(content).length) || 0,
        };
        await addLocalChapterRevision(rev);
      }
      // Also ensure metadata row exists/updated
      const existing = await simpleDb.chapters.get(remote.id);
      const updated: any = {
        id: remote.id,
        bookId,
        versionId,
        title,
        revCloud: (remote as any).revCloud || (remote as any).revLocal || (existing as any)?.revCloud,
        revLocal: (existing as any)?.revLocal || (remote as any).revCloud || (remote as any).revLocal,
        syncState: 'idle',
        conflictState: 'none',
        updatedAt: toTs(remote.updatedAt) || Date.now(),
      };
      await simpleDb.chapters.put({ ...(existing as any), ...updated });
      result.pulled.push(id);
      continue;
    }

    if (action === 'conflict' && local) {
      await simpleDb.chapters.put({ ...(local as any), syncState: 'conflict', conflictState: 'needs_review' } as any);
      result.conflicted.push(id);
      continue;
    }
    // idle -> nothing
  }

  return result;
}
