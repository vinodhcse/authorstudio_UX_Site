
Awesome—thanks for pasting the spec. I read it end-to-end and compared it to what we planned earlier (local-first + controlled acceptance of collaborator changes, TipTap/ProseMirror core, Firestore cloud, Tauri SQLite offline). Here’s a straight, practical audit: what’s solid ✅, what’s risky ⚠️, and precise fixes 🛠️ you can drop in.

What looks solid ✅
Local-first write path with dirty marking and explicit/periodic cloud sync. Good for perf and offline reliability.

Chapter is the storage unit and you still link Acts/Outline/Scenes. You’re also auto-creating the first Scene node—good.

Revision objects exist with major/minor, author attribution, and optional messages.

Explicit sync states (idle/dirty/pushing/pulling/conflict) are a clear start.

A squash policy to control bloat is called out.

Gaps & Loopholes (and how to fix them)
1) Conflict detection is too weak (clock skew & overwrites)
Issue
Using revLocal/revCloud as timestamps is race-prone (clock skew across devices) and doesn’t encode causality. Two users saving “cleanly” can still clobber each other.

Fix (minimal lift)
Replace timestamp “revisions” with version vectors:

version: { deviceId: number } map (vector clock).

Increment your own version[deviceId]++ on every local commit (minor or major).

Persist cloudVersion on successful push.

On push, include precondition: cloudVersionUnchanged (see §5). If server sees a divergent version (vector not ≤ cloud), respond 409 CONFLICT with the latest document & version → enter conflict.

If you want even simpler: use Firestore’s precondition lastUpdateTime + a monotonic per-device counter. Still better than timestamps.

2) Revisions are full snapshots; storage will explode
Issue
content per revision is a full TipTap JSON snapshot. That’s huge, especially for per-keystroke minors (even squashed).

Fix
Store ProseMirror Steps (patches) for minors; checkpoint snapshots only every N steps or on majors:

revision.content → optional; keep only for majors & periodic checkpoints.

revision.steps: StepJSON[] and revision.clientID: deviceId.

On load, reconstruct content from last snapshot + subsequent steps.

On squash: compose steps and keep a single checkpoint.

TipTap = ProseMirror under the hood—you can serialize steps (step.toJSON()) and reapply with EditorView.dispatch({ tr }).

3) “Controlled acceptance” isn’t truly modeled
Issue
You want reviewers to accept/reject changes. The current model only has booleans and arrays (needsReview, approvedBy, …), but there’s no thing to accept.

Fix
Introduce Proposals as first-class citizens:

ts
Copy
Edit
type ProposalStatus = 'open' | 'approved' | 'rejected' | 'superseded';

interface ChangeProposal {
  id: string;
  baseVersion: VersionVector;   // the version the author diffed against
  steps: StepJSON[];            // the proposed patch
  summary?: string;             // author’s message
  authorId: string;
  createdAt: string;
  reviewers: string[];          // assigned reviewers
  approvals: string[];          // userIds
  rejections: string[];         // userIds
  status: ProposalStatus;
}
Store proposals separately from revisions:

chapter.proposals: ChangeProposal[] (or a subcollection if it grows).

Review UI applies steps as a preview layer (read-only overlay transaction).

On “Approve”, server validates baseVersion:

If doc diverged, auto-rebase the steps (ProseMirror can remap steps) or mark status='superseded' and prompt the proposer to rebase.

This preserves your “controlled acceptance” while allowing live collaborative edits to continue in parallel.

4) Single syncState isn’t enough for concurrency
Issue
syncState at chapter level can’t represent concurrent operations (e.g., cloud pull while a push retries).

Fix
Keep chapter-level syncState for UI, but internally track a queue of ops:

ts
Copy
Edit
type SyncOp = 
  | { kind: 'push', revRange: [fromCounter, toCounter], id: string }
  | { kind: 'pull', sinceVersion?: VersionVector, id: string };

chapter.syncQueue: SyncOp[];
Only one active op at a time; retries re-enqueue with backoff.

Derive syncState from the queue head (pushing/pulling) or from presence of conflicts.

5) Cloud API needs optimistic concurrency, not “PUT whole chapter”
Issue
Blind PUT with whole chapter is prone to lost updates; also large payloads.

Fix
Narrow endpoints and use preconditions:

bash
Copy
Edit
GET    /chapters/{id}?sinceVersion=...
POST   /chapters/{id}:apply-steps   // body: { steps[], baseVersion, deviceId }
POST   /chapters/{id}:checkpoint    // body: { snapshot, version }
POST   /chapters/{id}/proposals     // create proposal
POST   /chapters/{id}/proposals/{pid}:approve
POST   /chapters/{id}/proposals/{pid}:reject
Every mutating call carries If-Match: <cloudVersionETag> (or Firestore: precondition: lastUpdateTime).

Server returns { newVersion, conflicts? }. If mismatch → 409.

You can still keep your convenience sync route, but under the hood call the granular ops.

6) “Auto-sync after 60 minutes” is risky for laptops & app exits
Issue
You may lose work on OS sleep/crash.

Fix
Trigger syncs opportunistically:

On editor idle (3–5s after typing stops) → local only, but

On “blur / tab close / app quit / battery low / network regain” → enqueue a push (minor batches).

On network regain, backoff-bounded drain of dirty chapters.

7) Role & permission model is missing
Issue
Controlled acceptance implies policy.

Fix
Add lightweight ACL per chapter:

ts
Copy
Edit
interface ChapterACL {
  owners: string[];
  editors: string[];
  proposers: string[];  // can create proposals
  reviewers: string[];  // can approve/reject
  viewers: string[];
  minApprovals?: number; // e.g., 1 or 2
}
Enforce in the API; surface in UI (who can ‘Propose Change’ vs ‘Commit Major’).

8) Presence, cursors, and lock vs. suggestion mode
Issue
Real-time collaboration needs clarity: are others editing live, or proposing?

Fix
Add Document Mode toggle per user:

mode: 'edit' | 'suggest'

edit → pushes steps directly (like Google Docs live).

suggest → generates a Proposal (doesn’t mutate base until approved).

Show ephemeral presence (user cursors) via a lightweight pub/sub (no persistence).

Optional range locks for sensitive blocks (e.g., scene meta sections):

Soft locks (advisory)—attempted edits outside your lock warn and default to proposals.

9) Migration implications of “Chapter as unit”
Risk
Long chapters mean large snapshots & expensive merges; also rebuilding from many steps is slow.

Fix
Keep “Chapter as the sync unit”, but internally shard the TipTap doc into segments:

segments: [intro, scene1, scene2, ...] by node boundaries.

Steps are tagged with segmentId.

Checkpoint per segment; replay many fewer steps per open.

This keeps your UX while giving performance similar to scene-granularity.

10) Images & attachments
Make sure asset mutations are atomic with content:

If an image insert step refers to assetId, the asset upload must complete and return an id before the step is accepted server-side, or the server must hold the step in a staging state and finalize once the asset is durable.

11) Security & integrity
Local: continue encrypting chapter payloads in SQLite (you already do for book data). Don’t forget proposals and steps tables.

Integrity: hash each checkpoint (sha256) and store the hash in the revision header. Optional, but helps detect corruption.

Concrete schema tweaks 🛠️
Chapter (delta from yours)
ts
Copy
Edit
interface Chapter {
  id: string;
  // ... your fields ...
  version: Record<string /*deviceId*/, number>;   // vector clock
  cloudVersion?: Record<string, number>;
  revisions: RevisionHeader[];  // headers only (id, author, ts, isMinor, message, checkpoint:boolean)
  proposals?: ChangeProposal[];

  // performance
  segments?: SegmentIndex[];    // optional: segmentId -> pos range
}

interface RevisionHeader {
  id: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  isMinor: boolean;
  message?: string;
  checkpoint: boolean;     // true when we stored a snapshot
  segmentIds?: string[];   // which segments changed
  deviceId: string;
  version: Record<string, number>;
  sha256?: string;         // only for checkpoints
}

interface StoredRevisionData {
  id: string;              // fk to header
  snapshot?: any;          // TipTap JSON (only if checkpoint)
  steps?: StepJSON[];      // minors or non-checkpoint majors
}
Local SQLite tables (sketch)
chapters(id PK, bookId, json, updatedAt)

chapter_revisions(id PK, chapterId, headerJson, hasSnapshot BOOL)

chapter_revision_data(revisionId PK, snapshot BLOB NULL, steps BLOB NULL)

chapter_proposals(id PK, chapterId, json)

Minimal algorithms (pseudo)
On local edit (idle debounce 500–1000ms)
pgsql
Copy
Edit
function commitMinor(editor, chapter, deviceId):
  steps = editor.getRecentStepsSince(lastCommit)
  if steps.length == 0: return

  chapter.version[deviceId] = (chapter.version[deviceId] || 0) + 1
  revId = makeRevId(deviceId, chapter.version[deviceId])

  save RevisionHeader{ id: revId, isMinor: true, checkpoint: false, version }
  save StoredRevisionData{ id: revId, steps }

  mark chapter.syncState='dirty'
  enqueue sync push (batchable)
Checkpoint policy
arduino
Copy
Edit
if stepsSinceLastCheckpoint > 100 or isMajorCommit:
  snapshot = editor.getJSON()
  save RevisionHeader{ checkpoint:true }
  save StoredRevisionData{ snapshot }
  stepsSinceLastCheckpoint = 0
Push (batched)
bash
Copy
Edit
POST /chapters/{id}:apply-steps
body: { steps: batchedSteps, baseVersion: chapter.cloudVersion, deviceId }
If 200: set chapter.cloudVersion = res.newVersion; set syncState='idle' if no more dirty
If 409: set syncState='conflict'; store serverDoc + serverVersion for resolver
Approve proposal
pgsql
Copy
Edit
POST /chapters/{id}/proposals/{pid}:approve
Server: rebase steps from proposal.baseVersion onto current doc; if rebase ok → apply steps, bump version; else mark superseded.
State machine (cleaned up)
idle →

local commit → dirty

remote change detected → pulling

dirty →

queue push → pushing

remote change detected (if you allow auto pull while dirty) → either parallel (with queue) or conflict directly if divergent and you try to auto-merge

pushing →

success → idle (if queue empty) | dirty (if more locals)

409 → conflict

network error → backoff, remain dirty

pulling →

success → idle (or apply → dirty if you merge locally)

divergent → conflict

conflict →

resolve (local wins / cloud wins / manual merge) → dirty or idle depending on result

Tiny implementation guardrails
ETags/Preconditions: If you don’t want custom vectors day one, at least use Firestore’s update(..., { lastUpdateTime: X }) precondition to fail fast on stale writes.

Before-quit hook in Tauri: flush the sync queue (bounded time).

Network regain event: trigger a drain of queued pushes.

Step size limit: if a single batch grows too big, chunk it.

Editor integration: keep a StepTracker plugin that collects steps and clears on commit.

Quick diffs to your JSON
Replace

revLocal, revCloud → version, cloudVersion

Add

revisions[] as headers; move payloads to chapter_revision_data

proposals[]

Keep

collaborativeState but point it at proposals and approvals (or drop and rely on proposals + ACL)

Verdict
Conceptually you’re very close. The biggest loopholes are (1) timestamp-based conflict detection, (2) snapshot-only revisions, and (3) “controlled acceptance” without an actual proposal artifact.

Implementing version vectors (or at minimum ETag/lastUpdateTime preconditions), steps + checkpoints, and first-class proposals with rebase on approval will make this production-grade without sacrificing our current UX.