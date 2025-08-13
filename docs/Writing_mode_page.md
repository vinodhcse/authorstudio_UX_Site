we’ll keep chapters as the primary unit, wire everything to your existing UI (no visual changes), and phase out scene-level storage. Below is a tight PRD plus the concrete integration plan for the Writing page first (Planning comes after we ship Writing).

Product requirements (Writing page first)
Goals (scope)
Make Chapter the single source of truth for book content.

Load chapters for the current book/version from the backend (no mock data).

If a version has no chapters, show a minimal “Create your first chapter” flow, then auto-bootstrap its plot graph (Outline → Act → Chapter → Scene) and link IDs.

Editor saves TipTap 3.0.7 JSON in chapter.content.

Add revisions (local quick revisions + squash to major), and track changes with controlled acceptance for collaborators.

Update EditorHeader to show chapters grouped by Act loaded from the bookVersion, not mock data (the header UI stays the same, only the data source changes).

Non-Goals
No UI redesign.

Import from Docx/PDF later.

Planning page wiring comes next (not in this first merge).

Data model changes (types.ts)
Core shift: Move all scene-level fields to Chapter. “Scenes” become structural sections inside TipTap content (custom nodes), not top-level rows.

Chapter (new canonical shape)
ts
Copy
Edit
type Chapter = {
  id: string;
  versionId: string;
  title: string;
  position: number;             // global order in version
  actId?: string;               // grouping
  outlineId?: string;           // outline node linkage
  linkedPlotNodeId?: string;    // primary plot node for the chapter
  image?: string;

  // Writing metrics at chapter level (formerly scene level)
  status?: 'DRAFT'|'WRITTEN'|'FINAL'|'ARCHIVED';
  wordCount?: number;           // computed from content
  characterCount?: number;
  readingTimeMin?: number;

  // TipTap 3.0.7 JSON blob (complete editor doc)
  content: unknown;

  // Collaboration and governance
  revisions: Revision[];        // local & synced history (see below)
  trackedChanges?: ChangeSet;   // pending proposals, per-collaborator (see below)
  lastMajorRevisionId?: string; // squash anchor

  // audit
  createdAt: string;            // ISO
  updatedAt: string;            // ISO

  // sync
  syncState?: 'idle'|'dirty'|'conflict';
  conflictState?: 'none'|'needs_review';
  revLocal?: string;            // local monotonically increasing opaque rev
  revCloud?: string;            // server’s rev
};
Revision
ts
Copy
Edit
type Revision = {
  id: string;                 // e.g. rev_{ts}_{rand}
  parentId?: string;          // last major revision for squash chains
  type: 'quick'|'major';
  createdAt: number;          // epoch ms
  authorId: string;
  delta: any;                 // tiptap JSON diff or full snapshot for first revision
  summary?: string;           // commit message
};
ChangeSet (controlled acceptance)
ts
Copy
Edit
type ChangeSet = {
  open: Array<{
    id: string;
    authorId: string;
    createdAt: number;
    operation: 'insert'|'delete'|'replace'|'format';
    range: { from: number; to: number } | null;
    payload: any;            // tiptap mark/node payload or text
    comment?: string;
  }>;
  accepted: string[];        // ids
  rejected: string[];        // ids
};
Tip: keep scene TypeScript type around only if you still need encrypted legacy access during migration, but mark as deprecated.

API contracts
List chapters (existing route you provided)

GET /books/:bookId/versions/:versionId/chapters
-> 200: Chapter[]
content is the full TipTap JSON (as provided in your sample).

Sorted by position. Include actId to allow grouping in the header.

Create first chapter (bootstrap)

POST /books/:bookId/versions/:versionId/chapters
body: { title, position?, actId?, content? }
-> 201: Chapter
On create, the server (or a thin client helper) must:

Create initial plot nodes: Outline, Act 1, Chapter 1, Scene 1.

Link: chapter.linkedPlotNodeId = <chapter-plot-node>, chapter.actId = <act1-id>.

Provide empty (valid) TipTap doc if not provided.

Save revisions
bash
Copy
Edit
POST /chapters/:chapterId/revisions
body: { parentId?, type, delta, summary? }
-> 201: { revisionId }
Squash revisions → major

POST /chapters/:chapterId/revisions:squash
body: { uptoRevisionId }
-> 200: { majorRevisionId }
Track changes proposals (collab)

POST /chapters/:chapterId/changes
body: ChangeSet['open'][0]
-> 201: { id }
PATCH /chapters/:chapterId/changes/:id
body: { action: 'accept'|'reject' }
-> 200
If your DAL already encrypts scene content, mirror that pattern for chapter payloads. (See BookContext encryption + scene APIs in your code for reference: creation/loading/updating encrypted content are already implemented for scenes and can be adapted to chapters. 
)

App integration plan (Writing page)
1) BookContext additions
Add chapter-level helpers parallel to your existing scene helpers (you already have scene CRUD + encryption flows we can mirror: getSceneContent, updateSceneContent, createScene, getBookScenes 
). New methods:

getChapters(bookId, versionId): Promise<Chapter[]>

createChapter(bookId, versionId, init?: Partial<Chapter>): Promise<Chapter>

If this is the first chapter of the version: auto-create Outline → Act1 → Chapter1 → Scene1 plot nodes and link IDs.

updateChapterContent(chapterId, contentTipTapJson): Promise<void>

Store TipTap JSON as is; update wordCount/characterCount.

saveQuickRevision(chapterId, delta, summary?) (debounced)

squashRevisions(chapterId, uptoRevisionId)

proposeChange(chapterId, change) / acceptChange(chapterId, changeId) / rejectChange(...)

Debounce: 1.5s after last keystroke → saveQuickRevision. Offline-first: mark chapter syncState='dirty', push later.

2) Editor.tsx
Replace any imports/uses of mock chapterContent and wire editor’s document to the selected chapter’s content. (Editor currently imports mock data and BookContext. 
)

On editor transaction: compute TipTap delta (or store full snapshot for now) → debounce → saveQuickRevision.

On blur (or Save menu action) → squashRevisions to create a major commit.

3) EditorHeader.tsx
Replace the mock “structure” with real chapters grouped by actId loaded via BookContext.getChapters. The component currently hardcodes acts & chapters (see the structure constant). We’ll remove that mock and feed grouped data. 

Keep the exact visuals; just switch the data source. Clicking a chapter switches the editor to that chapter (load its TipTap JSON).

Progress bar can compute completion from chapter statuses instead of the mocked 25%.

4) EditorFooter.tsx
Keep the same UI; wire the save indicator to actual debounce state + syncState (footer currently cycles mock statuses). 

5) “Create your first chapter” flow (no chapters found)
Show the existing layout with a simple in-place prompt (no new modal needed): “Create Chapter”.

Call createChapter(...), which also bootstraps plot nodes and returns a fully linked chapter ready for editing.

Track changes & controlled acceptance (collaboration)
How it works (client)
While editing, changes are recorded as quick revisions (local) and optionally as proposed change items when the chapter is in “review mode”.

Each proposed change is a small, targeted operation (insert/delete/format). These are displayed in the editor (existing TipTap decorations).

Reviewers with the right role can accept or reject proposals. Accepted changes are folded into the next major revision; rejected changes are dropped. The ChangeSet maintains open, accepted, rejected.

Permissions
Author/Editor: can squash, accept/reject.

Reviewer: can propose; cannot squash. (Server enforces.)

Conflict handling
If cloud rev differs when pushing a dirty chapter, mark conflictState='needs_review' and request a manual merge. (You already have conflict handling patterns for books/scenes that we can reuse. 
)

Revisions model
Quick revisions (debounced): very frequent, local-first. Store either:

(A) operational delta (preferred), or

(B) full snapshots for simplicity now; server can compact later.

Squash: Convert a chain of quick revisions into one major revision with an optional message. Set lastMajorRevisionId to that new major revision.

Versioning fields on Chapter:

revLocal: bump on each quick save.

revCloud: set by server after successful sync.

syncState: dirty while local changes exist.

Migration (from scenes → chapters)
Schema: add chapters table/collection; mark scenes as deprecated entity for content.

Adapter: for versions that only have legacy scenes:

Create chapters from each legacy “chapter’s first scene” (or per your existing “Chapter/Scene” grouping).

Build TipTap content by packing each former scene into a TipTap “scene node” inside the chapter’s doc (you already have custom nodes like SceneBeatExtension to represent structured pieces).

Gradual switch: Editor reads from chapter.content. The old getSceneContent remains for fallback only; after migration, stop calling it.

Key sharing (if needed)
You already abstract encryption/key flows for scenes in BookContext using encryptionService and DAL (create/load/update scenes). Mirror that for chapters:

Per-book content key (BK): BK encrypts chapter payloads.

Key wrapping for sharing: wrap BK per collaborator with their public key; store wrapped keys with the book. On accept invite, collaborator unwraps BK and can decrypt chapter payloads.

Roles:

Author/Owner: can rotate BK; re-wrap for collaborators.

Editor/Reviewer: read BK; limited write per role.

At-rest policy: Chapter content and revisions.delta encrypted at rest; trackedChanges can be encrypted as part of chapter payload.

For now, reuse your scene encryption endpoints, but pointed at chapters. The existing patterns for save/load encrypted content in BookContext are the template (e.g., encryptionService.saveSceneContent(...) / loadSceneContent(...)) to implement saveChapterContent(...) / loadChapterContent(...). 

Acceptance criteria
Opening Writing mode loads chapters via GET /books/:bookId/versions/:versionId/chapters.

If empty, user can create the first chapter; the app creates linked plot nodes (Outline, Act1, Chapter1, Scene1) and attaches IDs to the chapter.

Editor shows the chapter TipTap doc and persists edits as quick revisions (debounced) locally; Save/Blur squashes to a major revision.

Chapter list in EditorHeader is grouped by Act; no mock structure usage remains. (Replaces the current hardcoded structure. 
)

Footer save indicator reflects real debounce/sync state (not mock cycling). 

Collaborators can propose changes; Author/Editor can accept/reject; accepted proposals land in the next major revision.

Engineering plan (Writing page only)
types.ts

Introduce Chapter, Revision, ChangeSet as above. Mark Scene as deprecated (keep for migration).

BookContext

Add getChapters, createChapter, updateChapterContent, saveQuickRevision, squashRevisions, proposeChange, acceptChange, rejectChange.

Mirror your scene encryption logic for chapter content persistence (see existing methods around encrypted scene content for patterns). 

Routes

Wire GET /books/:bookId/versions/:versionId/chapters into getChapters.

Implement POST routes or DAL methods for create/update/revisions if not present.

EditorHeader.tsx

Replace the internal structure mock with BookContext data (group by actId; fall back to “Ungrouped” if missing). The hardcoded object is here and must go. 

Editor.tsx

Stop importing chapterContent mock; bind editor state to the active chapter from BookContext. (It currently imports mock content. 
)

On transaction, debounce → saveQuickRevision(activeChapterId, delta) and mark syncState='dirty'.

EditorFooter.tsx

Replace mock rotating save status with state derived from debouncePending + chapter syncState. (The mock cycle is in useEffect.) 

Bootstrap when empty

On load, if getChapters(...) returns [], render the inline CTA:

“Create Chapter” → createChapter which also creates the plot nodes and links.

Testing

Unit: BookContext chapter methods (rev bumps, squash behavior, proposal lifecycle).

Integration: Editor loads/saves chapter JSON; header grouping by acts; save indicator state transitions.

Migration: legacy versions with scenes still open; adapter creates Chapter doc from scenes.

Rollout notes
Ship behind a feature flag: chaptersAsUnit=true.

Keep scene code paths for one release for rollback.

Data migration job can be online (lazy transform per open) or batch.

What changes in files right now
EditorHeader.tsx: remove the hardcoded structure and use BookContext.getChapters grouped by actId. (Mock structure is currently defined inline. 
)

Editor.tsx: stop reading chapterContent mock; use the BookContext for active chapter content (it already imports the context, so this is a wiring change). 

EditorFooter.tsx: replace the mock status cycling with live save/sync state. (The rotating mock status is in the second useEffect.) 

BookContext.tsx: copy the scene encryption patterns to chapter equivalents (your current scene functions show the pattern for save/load/update encrypted content). 



