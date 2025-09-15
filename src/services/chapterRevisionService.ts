import { addLocalChapterRevision, getLocalChapterRevisions, LocalChapterRevision } from '../data/simpleDexie';

export async function createLocalRevision(args: Omit<LocalChapterRevision, 'rev_id' | 'timestamp'> & { rev_id?: string; timestamp?: number }) {
  const rec: LocalChapterRevision = {
    rev_id: args.rev_id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: args.timestamp || Date.now(),
    chapter_id: args.chapter_id,
    book_id: args.book_id,
    version_id: args.version_id,
    device_id: args.device_id,
    parent_rev_id: args.parent_rev_id ?? null,
    base_cloud_rev_id: args.base_cloud_rev_id ?? null,
    is_minor: args.is_minor,
    message: args.message ?? null,
    snapshot: args.snapshot,
    word_count: args.word_count,
    char_count: args.char_count,
    author_id: (args as any).author_id,
    author_name: (args as any).author_name
  };
  await addLocalChapterRevision(rec);
  return rec;
}

export async function listLocalRevisions(chapterId: string) {
  return await getLocalChapterRevisions(chapterId);
}
