import { invoke } from '@tauri-apps/api/core';
import { encryptionService } from './encryptionService';
import { appLog } from '../auth/fileLogger';

export type RevisionMeta = {
  revisionId: string;
  bookId: string;
  chapterId: string;
  timestamp: number;
  authorId?: string | null;
  deviceId?: string | null;
  sizeKB?: number;
  encryption?: { enabled: boolean; algo?: string; iv?: string; tag?: string };
};

type SnapshotFile = {
  revisionId: string;
  bookId: string;
  chapterId: string;
  timestamp: number;
  authorId?: string | null;
  deviceId?: string | null;
  encryption: { enabled: boolean; algo?: string; iv?: string; tag?: string };
  // If encrypted, contentEnc/contentIv will be present similar to chapter JSON backups
  content?: any;
  contentEnc?: string; // base64
  contentIv?: string;  // base64
  encScheme?: 'udek' | 'bsk';
};

function pathFor(bookId: string, chapterId: string, revisionId: string) {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_\-]/g, '_');
  return `books/${safe(bookId)}/chapters/${safe(chapterId)}/revisions/${safe(revisionId)}.json`;
}

export async function createChapterRevision(
  bookId: string,
  chapterId: string,
  content: any,
  opts?: { revisionId?: string; authorId?: string | null; deviceId?: string | null; contentProtected?: boolean }
): Promise<string> {
  const revisionId = opts?.revisionId || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = Date.now();
  const contentProtected = !!opts?.contentProtected;

  let file: SnapshotFile;
  if (contentProtected) {
    try {
      // For now treat all books as not-shared. If shared later, we can thread isShared
      const key = await encryptionService.getBookKey(
        (window as any)?.__authUser?.id || 'default_user',
        bookId,
        false
      );
      // Use scene encrypt helper for generic JSON
      const { contentEnc, contentIv } = await (await import('../crypto/aes')).encryptSceneContent(content, key);
      file = {
        revisionId,
        bookId,
        chapterId,
        timestamp,
        authorId: opts?.authorId ?? null,
        deviceId: opts?.deviceId ?? null,
        encryption: { enabled: true, algo: 'aes-256-gcm' },
        contentEnc,
        contentIv,
        encScheme: 'udek',
      };
    } catch (e) {
      appLog.error('revision', 'Failed to encrypt snapshot; falling back to plaintext', e);
      file = {
        revisionId,
        bookId,
        chapterId,
        timestamp,
        authorId: opts?.authorId ?? null,
        deviceId: opts?.deviceId ?? null,
        encryption: { enabled: false },
        content,
      };
    }
  } else {
    file = {
      revisionId,
      bookId,
      chapterId,
      timestamp,
      authorId: opts?.authorId ?? null,
      deviceId: opts?.deviceId ?? null,
      encryption: { enabled: false },
      content,
    };
  }

  const path = pathFor(bookId, chapterId, revisionId);
  await invoke('write_dexie_backup_json', { relativePath: path, jsonData: file as any });
  appLog.info('revision', 'Snapshot file written', { path });
  return revisionId;
}

export async function listChapterRevisions(bookId: string, chapterId: string, revisionIds: string[]): Promise<RevisionMeta[]> {
  // We depend on DB for ordering; just read files to compute sizes if present
  const metas: RevisionMeta[] = [];
  for (const revisionId of revisionIds) {
    const path = pathFor(bookId, chapterId, revisionId);
    try {
      const json: SnapshotFile = await invoke('read_dexie_backup_json', { relativePath: path }) as any;
      const sizeKB = JSON.stringify(json).length / 1024;
      metas.push({
        revisionId,
        bookId,
        chapterId,
        timestamp: json.timestamp,
        authorId: json.authorId,
        deviceId: json.deviceId,
        sizeKB: Math.round(sizeKB * 10) / 10,
        encryption: json.encryption,
      });
    } catch (_) {
      metas.push({ revisionId, bookId, chapterId, timestamp: 0, sizeKB: undefined, encryption: { enabled: false } });
    }
  }
  // sort most recent first
  metas.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return metas;
}

export async function readRevisionSnapshot(bookId: string, chapterId: string, revisionId: string): Promise<{ content: any; meta: RevisionMeta }>
{
  const path = pathFor(bookId, chapterId, revisionId);
  const json: SnapshotFile = await invoke('read_dexie_backup_json', { relativePath: path }) as any;
  let content = json.content;
  if (!content && json.encryption?.enabled) {
    const key = await encryptionService.getBookKey((window as any)?.__authUser?.id || 'default_user', bookId, false);
    const { decryptSceneContent } = await import('../crypto/aes');
    content = await decryptSceneContent(json.contentEnc!, json.contentIv!, key);
  }
  const meta: RevisionMeta = {
    revisionId: json.revisionId,
    bookId: json.bookId,
    chapterId: json.chapterId,
    timestamp: json.timestamp,
    authorId: json.authorId,
    deviceId: json.deviceId,
    sizeKB: Math.round((JSON.stringify(json).length / 1024) * 10) / 10,
    encryption: json.encryption,
  };
  return { content, meta };
}

export async function restoreRevision(
  bookId: string,
  versionId: string,
  chapterId: string,
  revisionId: string
): Promise<string> {
  const { content } = await readRevisionSnapshot(bookId, chapterId, revisionId);
  const newHead = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  // Persist as a new head revision through encryption service to keep Dexie/state consistent
  try {
    const userId = (window as any)?.__authUser?.id || 'default_user';
    await encryptionService.saveChapterContent(chapterId, bookId, versionId, userId, content, false, { revisionId: newHead, isMinor: false, setHead: true });
  } catch (e) {
    appLog.error('revision', 'Failed to save restored content', e);
    throw e;
  }
  // Also write snapshot file for the new revision
  const newId = await createChapterRevision(bookId, chapterId, content, { revisionId: newHead, contentProtected: false });
  try { (window as any).__currentChapterJSON = content; } catch {}
  return newId;
}

// Restore and return the restored content for React-state driven updates
export async function restoreRevisionAndGet(
  bookId: string,
  versionId: string,
  chapterId: string,
  revisionId: string
): Promise<{ newRevisionId: string; content: any }> {
  const { content } = await readRevisionSnapshot(bookId, chapterId, revisionId);
  const newHead = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const userId = (window as any)?.__authUser?.id || 'default_user';
  await encryptionService.saveChapterContent(chapterId, bookId, versionId, userId, content, false, { revisionId: newHead, isMinor: false, setHead: true });
  const newRevisionId = await createChapterRevision(bookId, chapterId, content, { revisionId: newHead, contentProtected: false });
  try { (window as any).__currentChapterJSON = content; } catch {}
  return { newRevisionId, content };
}
