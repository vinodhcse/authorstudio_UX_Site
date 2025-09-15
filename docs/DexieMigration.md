Replace SurrealDB Integration with Dexie + JSON Backup
1. Background

The current offline-first layer uses SurrealDB (via RocksDB) with Tauri commands (app_surreal.rs, lib.rs, dal.ts). This adds complexity and inconsistency.

We want to swap out only the SurrealDB integration while keeping:

Frontend types (types.ts) unchanged

Contexts (BookContext.tsx) unchanged

Cloud sync logic unchanged

DAL function signatures unchanged

2. Goals

Replace SurrealDB backend with a hybrid local DB:

Dexie (IndexedDB) → primary local store for books, versions, chapters, assets, revisions, sessions.

JSON files in app_data_dir → backup only (written on major commits, app close, idle intervals).

Maintain existing DAL APIs (getUserBooks, putBook, putVersion, getVersionContentData, putChapter, commitRevision, etc.).

Minimize FE changes — BookContext and sync flows keep working as today.

3. Non-Goals

No changes to cloud API contracts.

No changes to FE types or UI integration.

No changes to encryption or session handling flows, except replacing Surreal queries.

4. New Architecture
4.1 Runtime topology

Dexie (renderer, primary)
Tables:

books (Book paylaod with Versions[String])

versions (Version headers including book Id, full version payload: plotCanvas, characters, worlds, plotArcs, chapterIds[String])



chapters (full chapter content JSON + encrypted fields)

revision_index (revision metadata, points to backups)

assets, asset_links, job_queue

Local JSON (Tauri FS, backup) -> inside tauri app data dir

books/<bookId>/versions/<versionId>/<version_id>.json

books/<bookId>/versions/<versionId>/chapters/<chapterId>.json

books/<bookId>/revisions/<chapterId>/<revId>.json (major commits only)

books/<bookId>/assets/<asset_id>.json (major commits only)

Atomic write pattern: *.tmp → fsync → rename


Session management
In sqllite.ts, let's replace surrealDB integration with Tauri store plugin

Cloud Sync

Unchanged: Dexie is source of truth; JSON backups are not synced.

Existing sync logic in BookContext continues as-is.

4.2 IO strategy

Normal reads/writes → Dexie only.

Backups → written only on:

Major commit (revId snapshot)

App close

Idle interval (e.g., every 30m if dirty)

Recovery: If Dexie is corrupted, rebuild from backup files.

5. Migration Tasks
Rust / Tauri

Remove SurrealDB setup (app_surreal.rs, lib.rs).

Add FS helpers for atomic JSON write/read in lib.rs.

Expose commands for backup writes (optional).

Frontend

dal.ts

Replace SurrealDB calls with Dexie queries and fs backup writes.

Preserve all existing function names, signatures, and returned shapes.

sqlite.ts → delete / archive (not used).

BookContext.tsx → no changes required.


5.) Acceptance Criteria

All DAL functions work without Surreal.

BookContext and cloud sync remain unchanged.

Dexie is used as primary offline DB.

JSON backups exist in app_data_dir.

Recovery script can rebuild Dexie from backups.