# Product Requirements Document (PRD)

## Title

Book → Version → Chapter Offline Sync with Cloud (Including Revision Management)

---

## Overview

The Tauri-based AuthorStudio app currently supports book-level sync between local Dexie storage and the cloud backend. However, the sync logic does not traverse nested structures (Versions, Chapters), leading to missing data propagation and revision conflicts.

This PRD defines requirements to implement full tree sync (Book → Versions → Chapters) with support for revision management at the **chapter level only**.

---

## Goals

* Ensure complete offline-first experience: changes to books, versions, and chapters should persist locally and sync with cloud when online.
* Implement nested sync to guarantee that:

  * **Books** reconcile metadata and version references.
  * **Versions** reconcile across local/cloud, including creation, update, deletion, and conflicts.
  * **Chapters** reconcile with revision awareness, supporting 3-way merge detection and conflict resolution. Also pushing Version to cloud should be decrypted and only content needs to be loaded, while pushing to local db,should be encrypted using the existing mechanism
* Provide deterministic conflict handling and user-facing resolution for complex cases.

---

## Non-Goals

* Automatic conflict resolution beyond simple last-write-wins.
* Revisions for entities other than **chapters** (books and versions only sync metadata).

---

## Entities

* **Book**

  * Attributes: metadata, `versions[]`
  * Sync rules: push/pull/conflict
* **Version**

  * Attributes: metadata, `chapters[]`
  * Sync rules: push/pull/conflict
* **Chapter**

  * Attributes: metadata, TipTap JSON snapshot
  * Special: Has **revision history** (local-only minor, cloud major)
  * Sync rules: push/pull/conflict (with revision DAG)
  * Also pushing Version to cloud should be decrypted and only content needs to be loaded, while pushing to local db,should be encrypted using the existing mechanism

---

## Scenarios & Requirements

### 1. Book Metadata Sync

* If local revision leads: push to cloud.
* If cloud revision leads: pull from cloud.
* If both changed: mark as **conflict**, prompt user.
* After resolving book sync: call nested sync (`syncBookTree`).

### 2. Version Sync

* **Cloud-only version** → Pull: fetch version & chapters, add to local Dexie + book.versions.
* **Local-only version** → Push: create version in cloud, update cloud book.versions.
* **Both exist** → Compare revision state:

  * If one leads → push/pull.
  * If diverged → mark **conflict**, user review required.

### 3. Chapter Sync (Revision-Aware)

* **Cloud-only chapter** → Pull: fetch snapshot, create local revision mirroring cloud.
* **Local-only chapter** → Push: upload snapshot as new chapter with revision.
* **Both exist** → Apply 3-way merge policy:

  * Same base revision → choose newer updatedAt.
  * Diverged bases → mark **conflict**.
* Conflict resolution flow: prompt user to pick Local or Cloud snapshot; propagate choice both ways.

### 4. Deletion Handling

* Soft delete using `deletedAt` timestamp (tombstones).
* During sync:

  * If local tombstone only → push delete to cloud.
  * If cloud tombstone only → apply delete locally.

### 5. Offline-first & Outbox

* All pushes (book/version/chapter create/update/delete) must queue in an **Outbox** Dexie table.
* Outbox drains automatically when online.
* Transactions ensure atomic update of Book + Versions + Chapters.

---

## Technical Implementation

### A. Orchestration

* Introduce `syncBookTree(book, tokenGetter)`:

  1. Book-level reconciliation (existing).
  2. `syncVersionsForBook(book.id)` → reconcile versions.
  3. For each version, `syncChaptersForVersion(book.id, version.id)` → reconcile chapters.

### B. Version Sync

* Compare local/cloud sets.
* Implement `pushVersionDeep` and `pullVersionDeep`.
* On pull: transactionally insert version + chapters into Dexie.

### C. Chapter Sync

* Implement `decideChapterAction(local, cloud)`:

  * Push / Pull / Noop / Conflict.
* On pull: fetch snapshot, add revision entry.
* On push: upload snapshot, create new cloud revision.
* On conflict: mark chapter as `conflictState=needs_review`.

### D. DAL Updates

* Implement missing chapter methods in `dal.ts`:

  * `getChapterContent`
  * `saveChapterContentLocal`
  * `getChaptersByVersion`
  * `syncChapters`

### E. Events

* Emit `book:dirty`, `version:dirty`, `chapter:dirty` after nested sync updates.

---

## Conflict Resolution UX

* When a book/version/chapter is marked as `conflictState=needs_review`:

  * UI presents both local & cloud states.
  * User can choose **Keep Local** or **Keep Cloud**.
  * On choice:

    * Update both local and cloud consistently.
    * Clear conflict flag.

---

## Test Cases

1. **Offline book creation** → sync online → book + version + chapter created in cloud.
2. **Cloud-only version** → appears locally after sync.
3. **Chapter updated both sides** → conflict flagged, user resolves.
4. **Chapter added locally** → pushed to cloud.
5. **Book metadata diverges** → conflict resolution prompt.
6. **Deletion propagation** → local tombstone syncs to cloud.

---

## Risks & Mitigations

* **Partial sync failure** → use Dexie transactions to ensure atomicity.
* **Conflict overload** → batch notifications in UI, allow user to defer resolution.
* **Offline edits while conflict exists** → lock entity until conflict is resolved.

---

## Deliverables

* Updated `BookContext.tsx` with nested sync calls.
* New `versionSync.ts` module.
* Updated `chapterSync.ts` with real implementation.
* Extended DAL functions for chapters.
* Outbox queue implementation.
* Conflict resolution UI hooks.

---

## Timeline

* Week 1: DAL updates + outbox infra.
* Week 2: Version sync implementation.
* Week 3: Chapter sync with revision management.
* Week 4: Conflict resolution UI + end-to-end testing.

---

## Success Criteria

* All entities (books, versions, chapters) consistently synced across local and cloud.
* Revisions for chapters properly maintained.
* Conflicts reliably detected and user-resolvable.
* Offline creation/editing fully supported.
