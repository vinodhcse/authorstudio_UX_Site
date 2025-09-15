import React, { useEffect, useState } from 'react';
import { useBookContextSafe } from '../contexts/BookContext';
import { listChapterRevisions as listSnapshotMetas, restoreRevisionAndGet } from '../services/revisionStorage';

type RevisionMetaLite = {
  rev_id: string;
  timestamp: number;
  author_id?: string;
  author_name?: string;
  is_minor?: boolean;
  sizeKB?: number;
};

interface Props {
  bookId: string;
  versionId: string;
  chapterId: string;
  onCompare?: (revisionId: string) => void;
}

export const ChapterRevisionPanel: React.FC<Props> = ({ bookId, versionId, chapterId, onCompare }) => {
  const ctx = useBookContextSafe();
  const [revisions, setRevisions] = useState<RevisionMetaLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // local hover state not needed currently; keep UI simple

  const load = async () => {
    if (!ctx?.listChapterRevisions) return;
    setLoading(true);
    setError(null);
    try {
      const items = await ctx.listChapterRevisions(chapterId);
      const ids = (items || []).map((r: any) => r.rev_id);
      let sizesById: Record<string, number | undefined> = {};
      try {
        const metas = await listSnapshotMetas(bookId, chapterId, ids);
        sizesById = Object.fromEntries(metas.map(m => [m.revisionId, m.sizeKB]));
      } catch { /* snapshot files optional */ }
      const mapped = (items || []).map((r: any) => ({
        rev_id: r.rev_id,
        timestamp: r.timestamp,
        author_id: r.author_id,
        author_name: r.author_name,
        is_minor: r.is_minor,
        sizeKB: sizesById[r.rev_id],
      })) as RevisionMetaLite[];
      setRevisions(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [chapterId]);

  const handleRestore = async (rev: RevisionMetaLite) => {
    setRestoringId(rev.rev_id);
    try {
      ctx?.startRestore?.(chapterId);
      const result = await restoreRevisionAndGet(bookId, versionId, chapterId, rev.rev_id);
      ctx?.notifyChapterRestored?.(chapterId, result.content);
      await load();
    } catch (e) {
      // Fallback to context-based restore if snapshot file isn't available
      if (ctx?.restoreChapterRevision) {
        await ctx.restoreChapterRevision(bookId, versionId, chapterId, rev as any);
        ctx?.notifyChapterRestored?.(chapterId, (rev as any).snapshot);
        await load();
      }
    } finally {
      ctx?.endRestore?.();
      setRestoringId(null);
    }
  };

  const handleCompare = async (rev: RevisionMetaLite) => {
    onCompare?.(rev.rev_id);
  };

  return (
    <div className="bg-gradient-to-br from-gray-700 to-gray-900 dark:from-slate-50 dark:to-slate-100 rounded-lg shadow-lg border border-gray-600/50 dark:border-gray-300/50 w-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 dark:border-black/10">
        <h3 className="text-xs font-semibold text-white dark:text-black m-0">Chapter Revisions</h3>
        <button onClick={load} disabled={loading} className="text-[11px] px-2 py-1 rounded-md text-white/80 dark:text-black/80 hover:bg-white/10 dark:hover:bg-black/10 disabled:opacity-50">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error && <div className="text-red-300 dark:text-red-700 text-xs px-3 py-2">{error}</div>}
      <ul className="max-h-72 overflow-y-auto divide-y divide-white/10 dark:divide-black/10">
        {revisions.length === 0 && <li className="text-white/60 dark:text-black/60 text-xs px-3 py-3">No revisions yet.</li>}
        {revisions.map((rev) => (
      <li key={rev.rev_id}
        className="px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 dark:hover:bg-black/5"
      >
            <div className="min-w-0">
              <div className="text-white dark:text-black truncate">
                {new Date(rev.timestamp).toLocaleString()} {rev.is_minor ? '(minor)' : '(major)'}
              </div>
              <div className="text-white/60 dark:text-black/60">rev: {rev.rev_id.slice(0, 18)}{typeof rev.sizeKB === 'number' ? ` • ${rev.sizeKB} KB` : ''}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => handleCompare(rev)} className="px-2 py-1 rounded-md bg-white/10 dark:bg-black/10 text-white dark:text-black hover:bg-white/20 dark:hover:bg-black/20">Compare</button>
              <button onClick={() => handleRestore(rev)} disabled={restoringId === rev.rev_id} className="px-2 py-1 rounded-md bg-sky-600 dark:bg-sky-400 text-white dark:text-white hover:opacity-90 disabled:opacity-60">
                {restoringId === rev.rev_id ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChapterRevisionPanel;
