PRD: Offline-First Chapter Revision History, Diff & Sync (Tauri + React + TipTap + SurrealDB)
0) TL;DR (for Copilot)

Implement an offline-first revision system where only Chapter content has local revision history. The cloud always stores only the latest Chapter and Version documents. Provide:

Local SurrealDB (RocksDB) storage for books, versions, chapters, fileAssets, plus local-only chapter_revisions.

Beyond Compare–style side-by-side diff for TipTap JSON with cherry-pick from left → right.

Conflict resolution UI between local current and cloud latest.

Sync flows:

Sync Book → book + fileAssets + versions + chapters.

Sync Version → version + all nested chapters.

Versions and Chapters are separate collections in SurrealDB, each with its own sync mechanism.

Only Chapters have local revision history (no cloud history).

Collaborator changes are handled as tracked proposals with controlled acceptance by the author; the cloud still keeps only the latest canonical Chapter.

Hotkey: Ctrl + Shift + S = commit Major Revision (requires commit message).
Autosave: updates a single working Minor Revision snapshot for the active session (overwrites one row, not multiple).

Encryption in flight (API calls) will be added later; no local encryption.

1) Goals

Local, device-scoped chapter revision history (full TipTap JSON per revision).

Cloud (Firestore or server DB) stores only latest Chapter/Version (no historical revisions).

Reliable 3-way merge & conflict resolution between local current and cloud latest.

Side-by-side Compare view with per-hunk cherry-pick (like Beyond Compare).

Deterministic sync of Book, Version, and Chapter entities with clear dependencies.

Collaborators submit changes as proposals; authors accept/reject.

Data can be synced sperately at Version, Chapter and book level seperately.

Utilize the existing BookContext.tsx to thinly migrate to the new architecture

2) Non-goals

No real-time multi-user CRDT.

No local encryption (for now).

No cloud-side revision history.

3) Entities & Collections (SurrealDB – local)

We use SurrealDB (local, RocksDB) as the offline store. Define separate collections:

book — book metadata, collaborators, links to versions.

version — snapshot of Version metadata, narrative canvas pointers, pointers to chapters.

chapter — the current local chapter snapshot (TipTap JSON) + sync metadata.

file_asset and file_asset_link — images and attachments.

chapter_revision — local-only per-chapter revision snapshots (history).

Cloud keeps only latest version and chapter (no chapter_revision).

3.1 SurrealDB schema (sketch)

Please use the existing app_surreal.rs to implement any new structs for revision history management

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChapterRevision {
    /// Optional SurrealDB record id (e.g. `chapter_revision:xyz`)
    /// When selecting, SurrealDB returns `"id": "chapter_revision:..."`.
    /// `Thing` maps to that.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,

    pub rev_id: String,              // sha256 of normalized content
    pub chapter_id: String,
    pub book_id: String,
    pub version_id: String,
    pub device_id: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_rev_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_cloud_rev_id: Option<String>,

    pub timestamp: TimestampMs,      // e.g., SystemTime::now() in ms
    pub author_id: String,
    pub author_name: String,
    pub is_minor: bool,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,

    /// Full TipTap JSON snapshot for the chapter content
    pub snapshot: Value,

    pub word_count: i64,
    pub char_count: i64,
}

4) TypeScript Interfaces (core)
export interface TipTapDoc {
  type: 'doc';
  content?: any[];
}

export interface ChapterRevisionRecord {
  revId: string;          // sha256 of normalized JSON
  chapterId: string;
  bookId: string;
  versionId: string;
  deviceId: string;
  parentRevId?: string | null;
  baseCloudRevId?: string | null;
  timestamp: number;
  authorId: string;
  authorName: string;
  isMinor: boolean;       // true until major commit
  message?: string;
  snapshot: TipTapDoc;    // full doc
  wordCount: number;
  charCount: number;
}

export type SyncState = 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';

5) Revision Lifecycle

Session start (open chapter): capture base revCloud as baseCloudRevId in memory.

Autosave minor (every 30s or 250 ops):

Maintain one working Minor Revision per chapter (overwrite the same row: same revId or same revId slot? → Use a fixed revId = 'minor:<chapterId>:<sessionId>' until Major).

Update snapshot, timestamp, wordCount, charCount.

Mark chapter.syncState = 'dirty' and recompute chapter.revLocal = sha256(snapshot).

Major Save (Ctrl+Shift+S, requires message):

Convert working minor into a final Major: create a new revId (sha256 of normalized content).

Set chapter.currentRevisionId = revId.

Queue push to cloud; on success, update chapter.revCloud = revId, syncState='idle'.

Start a new working minor for further edits.

This “single working minor” prevents revision spam.

6) Diff & Cherry-pick (Beyond Compare–style)

Block-level alignment (TipTap nodes) + inline text diff for paragraphs/headings.

DiffHunk model (grouped ops per node path).

UI: left = selected revision snapshot, right = current chapter buffer.

Actions per hunk: Accept, Reject, or Partial (text ranges).

Applying decisions transforms the right doc, then writes an immediate minor update to the working revision.

Interfaces for diff:

export type NodePath = number[];

export type DocOp =
  | { kind: 'insert_node'; at: NodePath; node: any }
  | { kind: 'delete_node'; at: NodePath; oldNode: any }
  | { kind: 'replace_node'; at: NodePath; oldNode: any; newNode: any }
  | { kind: 'set_attrs'; at: NodePath; oldAttrs: any; newAttrs: any }
  | { kind: 'text_edit'; at: NodePath; oldText: string; hunks: TextHunk[] };

export type TextHunk =
  | { type: 'equal'; text: string }
  | { type: 'insert'; text: string }
  | { type: 'delete'; text: string }
  | { type: 'replace'; oldText: string; newText: string };

export interface DiffHunk {
  id: string;
  path: NodePath;
  nodeType: string;
  ops: DocOp[];
  summary: string;
}

export type HunkDecision =
  | { id: string; action: 'accept' | 'reject' }
  | { id: string; action: 'custom'; textSelections: { path: NodePath; index: number; kind: 'insert'|'replace' }[] };

7) Conflict Resolution (Local vs Cloud latest)

On pull, if chapter.revCloud differs from cloud’s head:

3-way merge using base = baseCloudRevId, local = current, remote = cloud latest.

If clean → apply merged doc (minor write), set revLocal and revCloud to merged hash.

If conflicts → open Conflict UI (same hunk model).

Accepting/resolving creates a minor update; user can later Major Save.

8) Collaborators & Controlled Acceptance

Cloud always stores only latest Chapter text.

Collaborators without “publish” permission submit proposals (TipTap JSON patch) to a chapter_proposal collection (cloud or local queue); they do not overwrite cloud latest.

Authors review proposals in the Compare UI (proposal vs current), cherry-pick, then Major Save to publish new latest.

If collaborators can publish, their push becomes new cloud latest; other devices will merge on pull; author can revert via Compare + Major Save.

Define roles: AUTHOR may accept/reject proposals and publish. EDITOR may propose.

9) Sync Scopes & Ordering

Sync Book:

Push/pull book.

Sync file_asset + file_asset_link (existing flow).

Sync all versions of the book.

For each version, sync all chapters.

Sync Version:

Push/pull version.

Sync all chapters in that version.

Sync Chapter:

Push/pull latest only. Never send chapter_revision to cloud.

Rules

If push collides (cloud moved), client switches to pull+merge.

After merge and optional conflict resolution, user Major Saves to publish.

10) Tauri Commands (API surface)

Implement as Rust commands exposed to FE:

// Revision storage
create_or_update_working_minor(chapter_id, base_cloud_rev_id, snapshot_json) -> { workingRevId }
commit_major_revision(chapter_id, message, snapshot_json) -> { revId } // converts working minor to major

// Query history
list_chapter_revisions(chapter_id, limit?) -> ChapterRevisionRecord[]
get_chapter_revision(rev_id) -> ChapterRevisionRecord

// Diff & apply
diff_tiptap_snapshots(left_json, right_json) -> DiffHunk[]
apply_cherry_picks(right_json, hunks, decisions) -> { merged_json }

// Sync (per scope)
sync_book(book_id) -> { summary }
sync_version(version_id) -> { summary }
sync_chapter(chapter_id) -> { status }

// Cloud bridge (placeholder; encryption later)
push_chapter_latest(chapter_id, snapshot_json, rev_id) -> { ok, newRevCloud }
pull_chapter_latest(chapter_id) -> { snapshot_json, revCloud }

11) UI Requirements

History Drawer per chapter:

Shows current working minor, last N majors, timestamps, messages.

Actions: Revert to revision (loads into editor → writes working minor), Compare with current, Restore as Major.

Compare View (Beyond Compare–style):

Left: selected revision/proposal.

Right: current editor content.

Middle gutter: Diff hunk navigator; per-hunk Accept/Reject/Partial.

“Apply Accepted” updates editor and writes working minor.

Conflict Resolver (Local vs Cloud):

Same as Compare, with base context. After resolve, writes working minor.

Status Indicators:

idle / dirty / pushing / pulling / conflict per chapter.

“Local-only history” badge with count.

Hotkeys

Ctrl+Shift+S → Major Save (prompt for message, then push).

Ctrl+Alt+C → Open Compare with last major.

Ctrl+Alt+M → Open Conflict Resolver (if pending).

12) Implementation Steps (copilot-friendly)

DB Layer

Define SurrealDB tables above; add indices.

Add repo functions: getChapter, upsertChapter, getRevisions, upsertWorkingMinor, commitMajor.

Hash & Normalize

Implement normalizeTipTap(doc) and hashDoc(doc).

Session Manager

Track baseCloudRevId, workingMinorId, timers for autosave.

On editor updates: debounce update → create_or_update_working_minor.

Diff Engine

Block matcher (LCS by node signature), inline text diff for matched blocks.

Build DiffHunk[].

Apply Engine

Path-aware transformer to apply hunk decisions to the right doc.

Guard with a path-mapping layer as nodes shift.

Conflict Merge

3-way merge driver: compute left (cloud), right (local), base (stored).

If conflicts → spawn Conflict Resolver UI.

Sync Workers

sync_book, sync_version, sync_chapter with queues, retries, 409 handling (pull+merge).

Ensure Version sync pulls/pushes nested Chapters; Book sync cascades to Versions + Chapters + file assets.

Proposals (Collaborators)

Implement chapter_proposal (cloud or local queue).

Compare UI to accept/reject and cherry-pick.

UI

History Drawer, Compare View, Conflict Resolver, status badges, hotkeys.

GC Policy

Keep last K majors (e.g., 50). Working minor is 1 row per session.

Provide manual “compact history” action.

13) Acceptance Criteria

Creating text edits generates/updates a single working minor per session.

Ctrl+Shift+S creates a major with a commit message; pushes to cloud; cloud revCloud updates.

Compare shows accurate hunks; Accept applies changes to the right pane; Partial works for inline text.

Pulling when cloud changed triggers merge; conflicts open resolver; resolving produces a consistent doc.

Sync Book cascades to file assets, versions, and chapters; Sync Version cascades to its chapters.

No cloud history exists; only chapter latest is stored remotely.

Collaborator proposals can be reviewed and merged by the author; cloud latest remains single-source-of-truth.

14) Telemetry & Logging

Log autosave frequency, major saves, push/pull outcomes, conflict counts, resolution time.

Guard PII; no content logging. Hashes only.

15) Security & Future Work

Add encryption-in-transit (API layer) using a key from cloud (out of scope now).

Optional: compress snapshots (zstd) before storing locally.

16) Test Plan

Unit: normalize/hash, LCS align, inline diff, path mapping, apply hunks.

Integration: working minor overwrite loop; major commit; revert; compare.

Sync: 409 handling (cloud moved), conflict creation & resolution; version/book cascades.

Multi-device: device A edits (minor), device B publishes; A pulls, merges, resolves, major saves.

Deliverables

SurrealDB migrations.

Tauri commands + TS client.

Diff/apply engine.

UI components (History Drawer, Compare, Conflict Resolver).

Sync workers (book/version/chapter).

Proposals model + review flow.

Tests + docs.

Implement to these specs. Ask for clarification only if a type or command is ambiguous.