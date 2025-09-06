import { getPendingOutbox, markOutboxDone, markOutboxError, OutboxItem } from '../data/simpleDexie';
import { apiClient } from '../api/apiClient';
import { encryptionService } from './encryptionService';

export async function drainOutbox(userId?: string): Promise<{ sent: number; failed: number }> {
  const pending = await getPendingOutbox();
  let sent = 0, failed = 0;
  for (const item of pending) {
    try {
      await processItem(item, userId);
      await markOutboxDone(item.id);
      sent++;
    } catch (e) {
      await markOutboxError(item.id, e);
      failed++;
    }
  }
  return { sent, failed };
}

async function processItem(item: OutboxItem, userId?: string) {
  const { entity, action, bookId, versionId, chapterId, payload } = item;
  if (entity === 'book') {
    if (action === 'update') {
      await apiClient.putBook(bookId, payload);
    }
  } else if (entity === 'version' && versionId) {
    if (action === 'update') {
      await apiClient.putVersion(bookId, versionId, payload);
    } else if (action === 'create') {
      await apiClient.createVersion(bookId, payload);
    }
  } else if (entity === 'chapter' && versionId && chapterId) {
    if (action === 'update') {
      // Prepare decrypted content if available
      let content = payload?.content;
      if (!content && userId) {
        try { content = await encryptionService.loadChapterContent(chapterId, userId); } catch { /* ignore */ }
      }
      await apiClient.putChapter(bookId, versionId, chapterId, { ...payload, id: chapterId, content });
    } else if (action === 'create') {
      await apiClient.createChapter(bookId, versionId, payload);
    } else if (action === 'delete') {
      await apiClient.deleteChapter(bookId, versionId, chapterId);
    }
  }
}

export function installOnlineDrain(userId?: string) {
  const handler = async () => {
    if (navigator.onLine) {
      try { await drainOutbox(userId); } catch { /* ignore */ }
    }
  };
  window.addEventListener('online', handler);
  // kick once
  handler();
  return () => window.removeEventListener('online', handler);
}
