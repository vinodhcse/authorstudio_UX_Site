// Lightweight event bus for DAL change notifications
// Consumers (e.g., BookContext) can subscribe to reflect Dexie changes in UI state instantly.

export type DirtyEventDetail = {
  bookId: string;
  versionId?: string;
  chapterId?: string;
};

export const dalEvents = new EventTarget();

export function emitBookDirty(bookId: string) {
  dalEvents.dispatchEvent(new CustomEvent<DirtyEventDetail>('book:dirty', { detail: { bookId } }));
}

export function emitVersionDirty(versionId: string, bookId: string) {
  dalEvents.dispatchEvent(new CustomEvent<DirtyEventDetail>('version:dirty', { detail: { versionId, bookId } }));
}

export function emitChapterDirty(chapterId: string, versionId: string, bookId: string) {
  dalEvents.dispatchEvent(new CustomEvent<DirtyEventDetail>('chapter:dirty', { detail: { chapterId, versionId, bookId } }));
}

export function emitBookClean(bookId: string) {
  dalEvents.dispatchEvent(new CustomEvent<DirtyEventDetail>('book:clean', { detail: { bookId } }));
}

export function emitVersionClean(versionId: string, bookId: string) {
  dalEvents.dispatchEvent(new CustomEvent<DirtyEventDetail>('version:clean', { detail: { versionId, bookId } }));
}

export function emitChapterClean(chapterId: string, versionId: string, bookId: string) {
  dalEvents.dispatchEvent(new CustomEvent<DirtyEventDetail>('chapter:clean', { detail: { chapterId, versionId, bookId } }));
}
