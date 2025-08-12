We need a clean, implementation-ready PRD you can hand to Copilot. it’s generic (works for covers, dividers, character/world/location/object images, etc.), offline-first, and fits your Tauri + React + SQLite + /api/books/:id/files stack.

PRD: Offline-First File & Image Assets for AuthorStudio (Tauri)
1) Summary
Build a generic, offline-first asset system for all book-related files (cover images, formatting dividers, character images, world/location/object images, gallery/attachments). Assets are stored locally first, referenced in JSON via a FileRef, and synced to the backend when online. Other devices/users can fetch remote assets and cache them locally for offline use.

2) Goals & Non-Goals
Goals

Single pipeline for all asset types (covers, dividers, characters, worlds, locations, objects, generic files).

Instant local save; render via local path; defer upload to network availability.

Deterministic dedupe via sha256.

Robust sync: upload pending; resolve URLs; download to cache on other devices.

Pluggable backends (existing /api/books/:id/files now; Firebase later).

Non-Goals

Rich DAM features (versioned transforms, annotations).

Multi-CDN management.

Complex DRM.

3) Supported Use Cases
Set/replace book cover (offline & online).

Insert divider image into a chapter (TipTap node).

Attach character/world/location/object images (avatars + galleries).

Generic attachments (future-proof).

Second device opens the book → images load via remote URL, then cache locally.

4) Terminology
Asset: physical file + metadata (db row).

FileRef: JSON-safe reference embedded in your domain objects and TipTap content.

Link: relation between an asset and an entity (book/character/etc.) with a role.

5) Data Model
5.1 SQLite Schema
sql
Copy
Edit
-- Physical assets (one row per unique (sha256, bytes))
CREATE TABLE IF NOT EXISTS file_assets (
  id TEXT PRIMARY KEY,             -- uuid/nanoid
  sha256 TEXT NOT NULL,            -- dedupe key
  ext TEXT NOT NULL,               -- 'jpg','png','webp','gif','pdf', ...
  mime TEXT NOT NULL,              -- 'image/jpeg', ...
  size_bytes INTEGER NOT NULL,
  width INTEGER,                   -- images only (nullable)
  height INTEGER,                  -- images only (nullable)
  local_path TEXT,                 -- absolute path in appLocalDataDir (nullable if not cached yet)
  remote_id TEXT,                  -- BE id
  remote_url TEXT,                 -- canonical URL to serve
  status TEXT NOT NULL,            -- 'local_only' | 'pending_upload' | 'uploaded' | 'failed'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(sha256)                   -- dedupe
);

-- Link assets to domain entities (many-to-many)
CREATE TABLE IF NOT EXISTS file_asset_links (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,       -- 'book' | 'character' | 'world' | 'location' | 'object' | 'chapter' | 'divider'
  entity_id TEXT NOT NULL,         -- e.g., bookId, characterId...
  role TEXT NOT NULL,              -- 'cover' | 'avatar' | 'gallery' | 'divider' | 'attachment' | 'map' | 'lore' | ...
  sort_order INTEGER DEFAULT 0,
  tags TEXT,                       -- JSON array of string tags (optional)
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(asset_id, entity_type, entity_id, role)
);

CREATE INDEX IF NOT EXISTS idx_file_assets_status ON file_assets(status);
CREATE INDEX IF NOT EXISTS idx_links_entity ON file_asset_links(entity_type, entity_id);
5.2 FileRef (embedded in JSON & TipTap)
ts
Copy
Edit
type FileRef = {
  assetId: string;
  sha256: string;
  role: 'cover' | 'avatar' | 'gallery' | 'divider' | 'attachment' | 'map' | 'lore';
  mime?: string;
  width?: number;
  height?: number;
  remoteId?: string;
  remoteUrl?: string;   // preferred for rendering if available
  localPath?: string;   // fallback for offline; convert via convertFileSrc()
};
Examples:

Book.coverImage?: FileRef

Character.avatar?: FileRef

Book.gallery?: FileRef[]

TipTap image node attrs: { assetId: string, alt?: string, title?: string }

6) Storage Layout (Local)
php-template
Copy
Edit
appLocalDataDir/
  books/
    <bookId>/
      files/
        <sha256>/
          original.<ext>
          thumb_256.<ext>      (optional)
          thumb_1024.<ext>     (optional)
7) Client Architecture
7.1 Modules
AssetService (TS): public API for UI

importLocalFile(file: File, ctx: { entityType, entityId, role, bookId })

getFileRef(assetId): Promise<FileRef>

resolveSrc(fileRef): string (remoteUrl → local file URL)

replaceAsset(…), linkAsset(…), unlinkAsset(…)

AssetDB (TS): CRUD for file_assets, file_asset_links

SyncEngine (TS): periodic/triggered job to:

upload pending_upload → update remote_*

backfill local cache for refs with remoteUrl but no local_path

Rust Tauri Commands (src-tauri):

compute_sha256(path | bytes)

probe_image(path) → width/height/mime

ensure_dir(path)

(optional) generate_thumbnails(path, sizes[])

7.2 Upload API (Backend)
Use existing:

yaml
Copy
Edit
POST /api/books/:bookId/files
FormData:
  file: (binary)
  tags: cover | avatar | gallery | divider | attachment | ...
  description: string (optional)
Response 200:
  { id: string, downloadUrl: string, mime: string, width?: number, height?: number }
If bookId isn’t applicable (e.g., character without a book), use the owning book or add parallel endpoints later. For now, assume assets are namespaced by book.

8) User Flows
8.1 Import Image (Offline or Online)
User picks file.

Compute sha256; determine ext/mime; probe width/height.

Write to appLocalDataDir/books/<bookId>/files/<sha256>/original.<ext>.

Create file_assets row: status='pending_upload' (if online=false) or local_only then immediately push to pending_upload.

Create/ensure file_asset_links row for {entityType, entityId, role}.

Return FileRef for UI; render using convertFileSrc(localPath).

8.2 Sync (Upload)
Trigger on connectivity regain, app resume, or timer.

For each status in ('local_only','pending_upload'):

POST FormData → receive { id, downloadUrl }.

Update file_assets: remote_id, remote_url, status='uploaded'.

Patch any cached FileRef in memory/docs (if needed).

8.3 Second Device / Other User
Loads document with FileRefs referencing remoteUrl.

Render from remoteUrl immediately (progressive).

Background: download to local cache (if allowed), update local_path.

8.4 Replace Cover While Offline
New local asset row + link with role='cover'.

Mark previous cover link as removed (unlink).

UI shows new cover from localPath.

Sync later uploads the new cover; server reflects new cover after upload.

9) TipTap Integration
9.1 Image Node Spec
type: 'image'

attrs: { assetId: string, alt?: string, title?: string, width?: number, height?: number }

Rendering: resolve via resolveSrc(fileRefById(assetId)):

Prefer remoteUrl; else convertFileSrc(localPath).

9.2 Paste/Drop Handler
Intercept pasted/dropped files → call importLocalFile(...) with role='attachment' or 'divider' depending on context → insert node with assetId.

10) Error Handling & Edge Cases
Upload fail: status='failed', exponential backoff; surface toast and retry button.

Duplicate file: if sha256 exists, reuse file_assets row; only add a new link.

MIME/extension mismatch: normalize by detected MIME; correct extension.

Max file size: configurable; reject early with helpful message.

Missing local file: if remoteUrl exists, attempt re-download; else flag as broken.

Permission / path traversal: only write inside appLocalDataDir.

Link uniqueness: one cover per entity—enforce by unlinking previous cover when creating a new cover link for the same entity.

11) Security & Privacy
Allow-list MIME types (png, jpg, webp, gif, svg (optional sanitization), pdf (attachments)).

Sanitize EXIF (optional): strip GPS using Rust image libs.

Optional local encryption-at-rest: if enabled, store encrypted original + keep small decrypted thumbnail for rendering, or decrypt on demand to a temp file.

12) Performance
Hashing: use streaming (Rust) for large files.

Thumbnails: generate once; use in UI lists to avoid loading originals.

Upload queue: concurrency=2 (configurable); pause/resume on network changes.

13) Cleanup / GC
When unlinking an asset: if no more links and status='uploaded', keep local cache; optionally GC by policy (LRU/size limit). If never uploaded and unlinked, safe to delete bytes + row.

On “Remove cover”: unlink the cover link; keep asset if still referenced elsewhere.

14) Telemetry (optional)
Counters: imports, uploads, failures, retries.

Timing: hash time, upload time, thumbnail time.

Sizes: average file size, cache footprint.

15) Testing & Acceptance Criteria
Unit

Hash function deterministic.

Dedupe: second import of same bytes returns same asset row.

Link uniqueness: setting cover twice results in 1 active cover link.

Integration

Offline import renders from localPath.

Pending upload → online → uploaded, FileRef gets remoteUrl.

Second device: renders from remoteUrl, then caches locally.

Error

Simulate 500 → status=failed; visible retry works.

Missing local file but has remoteUrl → re-downloads.

AC (samples)

AC-1: Import image offline; it appears immediately as cover; when online, it uploads within 30s and updates to uploaded.

AC-2: Replace cover while offline → new image visible; after sync, backend shows new cover; previous cover remains in gallery (if linked) or is just unlinked.

AC-3: A chapter with TipTap image nodes loads on another device with correct images (first remote, then cached).

16) Implementation Plan (Tasks)
DB migrations: create file_assets, file_asset_links.

Rust commands: compute_sha256, probe_image, ensure_dir (+ optional generate_thumbnails).

AssetDB CRUD (TS).

AssetService:

importLocalFile(file, ctx)

resolveSrc(fileRef)

linkAsset(assetId, entityType, entityId, role)

unlinkAsset(assetId, entityType, entityId, role)

getFileRef(assetId)

SyncEngine:

uploadPending(bookId, token)

cacheRemoteIfMissing(fileRef, bookId)

triggers on connectivity/app focus/timer

TipTap:

image node with assetId

paste/drop handlers

renderer uses resolveSrc

UI:

Cover picker

Gallery manager (sortable)

Upload queue toast/state

Policies:

MIME allow list

Size limits

GC thresholds

17) Reference Types (TS)
ts
Copy
Edit
export type EntityType =
  | 'book' | 'character' | 'world' | 'location' | 'object' | 'chapter' | 'divider';

export type AssetRole =
  | 'cover' | 'avatar' | 'gallery' | 'divider' | 'attachment' | 'map' | 'lore';

export type FileRef = {
  assetId: string;
  sha256: string;
  role: AssetRole;
  mime?: string;
  width?: number;
  height?: number;
  remoteId?: string;
  remoteUrl?: string;
  localPath?: string;
};

export type ImportContext = {
  entityType: EntityType;
  entityId: string;
  role: AssetRole;
  bookId: string; // for namespacing local cache & backend route
  tags?: string[]; // serialized for upload
  description?: string;
};
18) Key Functions (Copilot targets, pseudocode)
ts
Copy
Edit
// AssetService.importLocalFile
async function importLocalFile(file: File, ctx: ImportContext): Promise<FileRef> {
  const sha = await rust.compute_sha256(file);               // streaming
  const { mime, width, height } = await rust.probe_image(file);
  const { localPath } = await writeToLocalCache(file, ctx.bookId, sha, mime); // ensures dir
  const assetId = nanoid();
  await AssetDB.insertAsset({
    id: assetId, sha256: sha, ext: extFromMime(mime), mime,
    size_bytes: file.size, width, height,
    local_path: localPath, status: 'pending_upload'
  });
  await AssetDB.upsertLink({ asset_id: assetId, entity_type: ctx.entityType,
    entity_id: ctx.entityId, role: ctx.role, tags: ctx.tags, description: ctx.description });

  return {
    assetId, sha256: sha, role: ctx.role, mime, width, height,
    localPath, remoteUrl: undefined
  };
}

// SyncEngine.uploadPending
async function uploadPending(bookId: string, apiBase: string, token: string) {
  const items = await AssetDB.listByStatus('pending_upload');
  for (const it of items) {
    const form = {
      file: { file: await fs.readBinaryFile(it.local_path), fileName: `${it.sha256}.${it.ext}`, mime: it.mime },
      tags: pickTagsFromLinks(it.id), // e.g., 'cover'
      description: firstDescriptionFromLinks(it.id),
    };
    const res = await http.post(`${apiBase}/api/books/${bookId}/files`, form, token);
    if (res.ok) await AssetDB.markUploaded(it.id, res.data.id, res.data.downloadUrl);
    else await AssetDB.markFailed(it.id);
  }
}

// Resolve for <img src=...>
function resolveSrc(ref: FileRef): string | undefined {
  if (ref.remoteUrl) return ref.remoteUrl;
  if (ref.localPath) return convertFileSrc(ref.localPath);
  return undefined;
}
19) Config
MAX_UPLOAD_MB (default 25)

UPLOAD_CONCURRENCY (default 2)

ALLOWED_MIME = ['image/png','image/jpeg','image/webp','image/gif']

SYNC_INTERVAL_MS (default 30_000)