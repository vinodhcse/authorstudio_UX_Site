// Simple in-memory session map to reuse a single minor revision per chapter session
const minorMap = new Map<string, { revisionId: string; startedAt: number }>();

const key = (bookId: string, versionId: string, chapterId: string) => `${bookId}:${versionId}:${chapterId}`;

function newRev() {
  // Prefer crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `rev_${(crypto as any).randomUUID()}`;
  }
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const RevisionSession = {
  getOrCreateMinor(bookId: string, versionId: string, chapterId: string) {
    const k = key(bookId, versionId, chapterId);
    const existing = minorMap.get(k);
    if (existing) return existing.revisionId;
    const revisionId = newRev();
    minorMap.set(k, { revisionId, startedAt: Date.now() });
    return revisionId;
  },
  rotateAfterManualSave(bookId: string, versionId: string, chapterId: string) {
    const k = key(bookId, versionId, chapterId);
    const revisionId = newRev();
    minorMap.set(k, { revisionId, startedAt: Date.now() });
    return revisionId;
  },
  clear(bookId: string, versionId: string, chapterId: string) {
    minorMap.delete(key(bookId, versionId, chapterId));
  }
};
