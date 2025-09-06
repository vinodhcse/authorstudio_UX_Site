import { simpleDb } from '../data/simpleDexie';
import type { Version } from '../types/bookTypes';
import { apiClient } from '../api/apiClient';
import { syncChaptersForVersion } from './chapterSync';

function toTs(ms?: number): number { return typeof ms === 'number' ? ms : 0; }

function decideVersionAction(local?: Version | null, cloud?: Version | null): 'push' | 'pull' | 'idle' | 'conflict' {
  if (!local && cloud) return 'pull';
  if (local && !cloud) return 'push';
  if (!local && !cloud) return 'idle';
  const l: any = local as any;
  const c: any = cloud as any;
  const localDirty = l.syncState === 'dirty';
  const lRevCloud = l.revCloud;
  const cRev = c.revCloud || c.revLocal;
  if (localDirty && lRevCloud && cRev && lRevCloud !== cRev) return 'conflict';
  if (localDirty) return 'push';
  if (toTs(c.updatedAt) > toTs(l.updatedAt)) return 'pull';
  return 'idle';
}

export async function syncVersionsForBook(bookId: string, userId: string): Promise<void> {
  // Local
  const localVersions = await simpleDb.versions.where('bookId').equals(bookId).toArray();
  // Cloud
  let cloudVersions: Version[] = [];
  try {
    // If backend has endpoint to list versions, use it. Otherwise fetch by IDs on book object via getBook
    const cloudBook = await apiClient.getBook(bookId) as any;
    const ids: string[] = Array.isArray(cloudBook?.versions) ? cloudBook.versions.map((v: any) => (typeof v === 'string' ? v : v.id)).filter(Boolean) : [];
    cloudVersions = [];
    for (const id of ids) {
      try {
        const v = await apiClient.getVersion(bookId, id) as any;
        cloudVersions.push(v);
      } catch {}
    }
  } catch {}

  const localMap = new Map(localVersions.map(v => [v.id, v]));
  const cloudMap = new Map(cloudVersions.map(v => [v.id, v]));
  const ids = new Set<string>([...localMap.keys(), ...cloudMap.keys()]);

  for (const id of ids) {
    const local = localMap.get(id) || null;
    const cloud = cloudMap.get(id) || null;
    const action = decideVersionAction(local as any, cloud as any);

    if (action === 'push' && local) {
      await apiClient.putVersion(bookId, id, local);
      await simpleDb.versions.put({ ...(local as any), revCloud: (local as any).revLocal || (local as any).revCloud, syncState: 'idle', conflictState: 'none' });
    } else if (action === 'pull' && cloud) {
      await simpleDb.versions.put({ ...(local as any), ...cloud, revCloud: (cloud as any).revCloud || (cloud as any).revLocal, syncState: 'idle', conflictState: 'none' });
    } else if (action === 'conflict' && local) {
      await simpleDb.versions.put({ ...(local as any), syncState: 'conflict', conflictState: 'needs_review' });
    }

    // Nested chapters
    await syncChaptersForVersion(bookId, id, userId);
  }
}
