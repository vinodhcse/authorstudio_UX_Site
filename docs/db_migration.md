PRD — Migrate Local Persistence from SQLite to SurrealDB (Embedded/RocksDB) + Vector Search
1) Why / Background

Originally, local store used SQLite via @tauri-apps/plugin-sql; we've migrated to SurrealDB embedded with Rust commands.
 

App logic relies on a DAL (data/dal.ts) exposing CRUD and sync helpers used heavily by BookContext (getUserBooks, putBook, putVersion, getDirtyChapters, etc.). 

Auth/session UX included unlock/sealed flows depending on a local session row (previously via ./sqlite). We preserved this UX while moving storage to Surreal.
 
 

We want JSON-first storage, plus semantic search across Version-related entities using local embeddings.

2) Goals

Replace SQLite with SurrealDB embedded (RocksDB backend) for all local persistence (books, versions, chapters, version content JSON, encrypted fields, session/meta).

Keep existing React Context APIs stable (BookContext, AuthContext, hooks) so UI code changes are minimal. (Rename internals only.)

Implement vector search per Version on: Chapters, Characters, Plot Arcs, Worlds.

Keep ACID guarantees for multi-entity writes (book → version → chapter) using SurrealDB transactions.

Maintain current encryption + unlock flows (passphrase → app key, sealed/unsealed session), but store the session in SurrealDB instead of the old SQLite helper. 
 

Enable future sync reuse (existing apiClient calls and “dirty” markers continue to work from the new DAL).

3) Non-Goals

No changes to remote Firestore or cloud API schema.

No changes to the UI component props beyond what is strictly needed to wire the new DAL.

No new collaboration logic; keep current conflict/sync flags as-is.

4) Architecture (New)
4.1 Runtime topology

SurrealDB embedded in the Tauri backend, persisted to a RocksDB directory under the app data folder.

A new Rust command layer (Tauri commands) exposes atomic operations & transactions (similar to how we previously serialized writes).

Frontend TypeScript calls a new Surreal DAL that proxies to these commands.

4.2 Data Model Mapping

Map existing domain types (Books, Versions, Chapters, Characters, Worlds, PlotArcs) to SurrealDB tables:

book (id, owner_user_id, is_shared, revLocal, revCloud, sync/conflict states, enc_metadata blob)

version (id, bookId FK, title, sync/conflict, contentData JSON bucket for plotCanvas/characters/worlds/plotArcs)

chapter (id, versionId FK, title, orderIndex, contentEnc, contentIv, sync/conflict, wordCount, metadata)

character, plotarc, world (id, versionId, JSON fields)

session (the old ./sqlite row becomes a Surreal record: user_id, appkey_wrap_salt/iters/probe, refresh_token_enc, device_private_key_enc, sealed/unsealed state, device_id)

Keep field names as close as possible to minimize BookContext/Auth changes (they already expect things like revLocal, revCloud, syncState, etc.). 

4.3 Vector Search Layout

Create a passage table per Version scope (or one global table with versionId partition):

Fields: id, bookId, versionId, entityType (chapter|character|plotarc|world), entityId, text, embedding (vector), updatedAt.

Index: HNSW (COSINE or DOT) on embedding for scale; for small datasets brute force KNN is OK initially.

Chunking: for Chapters, chunk by paragraph/section; for Characters/PlotArcs/Worlds, chunk by main text fields (description, notes, etc.).

On create/update/delete of any entity, update corresponding passages within a single Surreal transaction to keep text ↔ embedding consistent.

4.4 Transactions

Replace serialized exclusive SQLite TXs (the current enqueueExclusive + BEGIN EXCLUSIVE) with SurrealDB transactions in the Rust layer. The DAL issues one Tauri command per atomic action (same philosophy as today). 

5) Developer Experience / Interfaces
5.1 New Tauri Commands (Rust)

db.init() – open embedded SurrealDB (RocksDB path), define tables/indexes if missing.

db.tx(operations) – run a batch of put/delete + vector-index updates in one transaction.

book.getByUser(userId) / book.put(row) / book.delete(id)

version.put(row) / version.get(id)

chapter.put(row) / chapter.get(id) / chapter.listByVersion(versionId)

versionContent.get(versionId) / versionContent.update(versionId, patch) (plotCanvas, characters, worlds, plotArcs)

session.get() / session.upsert(row) / session.seal() / session.activate() (replaces ./sqlite helpers used in Auth flows) 
 

vector.upsertPassages([{entityType,entityId,versionId,text,embedding}])

vector.search({versionId, queryEmbedding, k}) -> [{entityType, entityId, text, score}]

5.2 TypeScript DAL (new file: data/surrealDal.ts)

Mirror existing DAL method names to avoid touching BookContext/Auth flows:

initializeDatabase → kept, but calls db.init() (Surreal).

getUserBooks, putBook, putVersion, getDirtyChapters, putChapter, getVersionsByBook, getVersionContentData, updateVersionContentData, etc. Implemented atop the new commands; return the same shapes BookContext expects. (BookContext imports these today. 
)

5.3 Vector Search API (frontend-friendly)

New helper semanticSearch(versionId: string, query: string, k = 10)

compute local embedding (Tauri side with your model)

call vector.search

map results back to domain entities

6) Schema & SurrealQL (illustrative)
-- Books & Versions
DEFINE TABLE book SCHEMALESS;
DEFINE INDEX book_owner ON TABLE book FIELDS owner_user_id;

DEFINE TABLE version SCHEMALESS;
DEFINE INDEX ver_book ON TABLE version FIELDS bookId;

DEFINE TABLE chapter SCHEMALESS;
DEFINE INDEX chap_ver ON TABLE chapter FIELDS versionId;

-- Version content bucket (plotCanvas, characters, worlds, plotArcs)
DEFINE TABLE version_content SCHEMALESS;
DEFINE INDEX vc_ver ON TABLE version_content FIELDS versionId;

-- Session (replaces ./sqlite session row)
DEFINE TABLE session SCHEMALESS;

-- Vector passages
DEFINE TABLE passage SCHEMALESS;
DEFINE INDEX passage_ver ON TABLE passage FIELDS versionId;
DEFINE INDEX passage_vec ON TABLE passage
  FIELDS embedding HNSW DIMENSIONS <D> METRIC COSINE;  -- <D> set to your model dims


KNN search (conceptual):

SELECT entityType, entityId, text, score
FROM passage
WHERE versionId = $versionId
ORDER BY embedding <||> $queryEmbedding
LIMIT $k;

7) Migration Plan
7.1 Phase 0 — Add SurrealDB alongside SQLite (read-only parity checks)

Add Surreal runtime + init command.

Add surrealDal.ts implementing read-only equivalents (getUserBooks, getVersionsByBook, getVersionContentData).

Write a migration script (Tauri command migrateFromSqlite) to read from old DAL and write to Surreal. Keep both DBs for now.

Books → book

Versions → version + version_content

Chapters → chapter (including encrypted fields contentEnc, contentIv)

Session row → session

Verify counts and sample records match.

7.2 Phase 1 — Switch writes to Surreal, reads still allowed from SQLite (shadow mode)

Flip DAL exports to point to surrealDal.ts (maintain function names).

Keep a feature flag LOCAL_DB_DRIVER = 'surreal' | 'sqlite' for rollback.

Ensure BookContext workflows (create/update book/version/character/world) remain intact. (They currently call DAL and mark dirty/sync, e.g. updateBook → putBook → cloud try.) 

7.3 Phase 2 — Vector indexing

Add embedding generation in Tauri (deterministic chunking).

On entity create/update/delete, update passage rows + HNSW index in the same transaction as the entity write.

Provide semanticSearch(versionId, queryText) wrapper.

7.4 Phase 3 — Remove SQLite

Remove old ./sqlite utilities called by AuthGate/Unlock and point them to Surreal session table. (AuthGate/Unlock currently import ./sqlite to read session and decide sealed/unlock flows. Replace with Surreal equivalents.) 
 

Drop @tauri-apps/plugin-sql dependency.

8) File-level Tasks (what to ask Copilot to code)
8.1 New / Backend (Rust)

src-tauri/src/surreal.rs

init_db(path: String) -> Result<()> — open/create RocksDB, run DEFINE TABLE/INDEX if absent.

run_tx(ops: Vec<Op>) -> Result<T> — generic transaction runner.

CRUD endpoints mirroring DAL surface: book_put, book_get_by_user, version_put, chapter_put, chapter_list_by_version, version_content_update, session_get, session_upsert, session_seal/activate.

Vector endpoints: vector_upsert_passages, vector_search.

src-tauri/src/embeddings.rs

Wrapper to call local embedding model (already planned).

Utility embed_texts(texts: Vec<String>) -> Vec<Vec<f32>>.

src-tauri/src/lib.rs

Register Tauri commands.

8.2 New / Frontend (TS)

data/surrealDal.ts (drop-in replacement)

initializeDatabase → calls Tauri init_db

getUserBooks, putBook, putVersion, getVersionsByBook, getVersionContentData, updateVersionContentData, getChaptersByVersion, putChapter, getDirtyChapters, getUserKeys equivalents, etc. (Match signatures used by BookContext.) 

Vector: semanticSearch(versionId, query, k) → Tauri commands.

data/migrateFromSqlite.ts

Reads with old SQLite DAL; writes to Surreal in batches with progress.

auth/sessionStore.ts

Surreal replacements for ./sqlite helpers used by AuthGate and useAuthStore unlock (get/upsert/seal/activate session). 
 

8.3 Modifications

BookContext.tsx

Change DAL imports from ../data/dal to ../data/surrealDal (names preserved).

No business logic changes expected; keep syncDirtyChaptersToCloud as-is. (Still calls getDirtyChapters and putChapter.) 

AuthGate.tsx / UnlockOffline.tsx / useAuthStore.ts

Replace ./sqlite imports with new auth/sessionStore.ts (Surreal) maintaining the same method names: getSessionRow, upsertSessionRow, sealSession, activateSession. (These flows control sealed/unlock and are referenced in multiple places.) 
 
 

9) Transactions — Examples

Create Version with content + initial passages (one TX):

insert version

insert version_content (plotCanvas/characters/worlds/plotArcs as provided)

derive initial passages from those JSONs; embed; insert passage[]

commit

Save Chapter (contentEnc/contentIv + passage updates):

update chapter

delete old passage for that chapter

chunk new text, embed, insert new passage[]

commit

10) Security / Keys

Store session row (app key wrap salt/iters, probe, device keys, refresh token enc, sealed/unsealed flags) in Surreal session. Same fields, same logic as today’s unlock (passphrase → derive app key → verify probe). (UnlockOffline triggers useAuthStore.unlock(passphrase) now; keep that.) 
 

Chapter payload remains encrypted (contentEnc, contentIv) exactly like now; only the storage engine changes.

11) Testing Plan

Unit: DAL methods (surrealDal) return the same shapes BookContext expects; vector indexing produces stable top-k for known queries.

Integration:

Create/Edit/Delete book/version/chapter → verify persistence and vector rows.

Unlock flow with wrong/right passphrase. (UnlockOffline + AuthGate states.) 
 

Migration: run migrateFromSqlite and diff counts per table; spot-check sample IDs.

12) Rollout

Release behind feature flag (LOCAL_DB_DRIVER='surreal').

Ship a one-time migration command exposed in a hidden dev menu.

After two releases, remove SQLite code path.

13) Acceptance Criteria

App boots with SQLite removed, all reads/writes go through Surreal.

Book/Version/Chapter CRUD works; chapters remain encrypted on disk; unlock & sealed flows unchanged. (AuthGate shows the same states and transitions.) 
 

semanticSearch(versionId, query) returns relevant results across Chapters/Characters/PlotArcs/Worlds within 200ms for 10k passages on a typical dev machine.

Migrated users retain all local data and can continue syncing dirty chapters to cloud exactly as before. (BookContext syncDirtyChaptersToCloud still runs and clears sync_state to idle.) 
 

No UI prop changes required; only DAL import path changed.

Copilot-friendly TODO checklist

 Add Surreal embedded to Tauri; create surreal.rs with init_db, CRUD, TX, vector endpoints.

 Implement embeddings.rs (local model wrapper).

 Create data/surrealDal.ts mirroring old dal.ts signatures.

 Build auth/sessionStore.ts to replace ./sqlite helpers (same methods).

 Switch BookContext.tsx imports from ../data/dal → ../data/surrealDal. 

 Switch AuthGate.tsx, useAuthStore.ts, UnlockOffline.tsx to new session helpers. 
 
 

 Write migrateFromSqlite.ts (read old DAL → write Surreal).

 Define Surreal tables/indexes (incl. HNSW) and ensure TX coverage for entity + passages updates.

 Add semanticSearch(versionId, query) path and UI wiring (non-breaking).

 Remove SQLite code path and dependency when stable.

If you want, I can also generate scaffold code for surrealDal.ts (TS interfaces + stubbed functions matching your current calls) and a Surreal schema bootstrap in Rust next.