# PRD: Offline-first DOCX Importer (Tauri + React + Vite + TipTap JSON)

## 1) Goal

- Import a .docx file locally (no network), convert to TipTap JSON chapters, persist immediately into Dexie (offline-first), associate with an Act, and enqueue for existing cloud sync.
- Provide a local job system showing progress in a modern animated popup (Framer Motion), with “pages into book” animation.

## 2) Scope

- Desktop app: Tauri + React + Vite.
- Inputs: DOCX file, optional Act selection/name.
- Conversion: DOCX → HTML (Mammoth) → TipTap JSON (@tiptap/html generateJSON with extensions).
- Rules:
  - Split chapters by <h1> heading blocks.
  - Detect canonical scene break patterns in the original document and emit SceneDivider TipTap nodes in a JSON post-processing pass. Rendering is controlled later by Typography settings.
- Persistence: Insert chapters into Dexie immediately (syncState='dirty') to leverage existing cloud sync.
- Act assignment:
  - If actId provided → attach.
  - If only actName provided → find or create Act and Outline node.
  - If none provided → default Act (e.g., “Imported”), create if missing with outline node.
- Job system: Local job tracking with progress/status and an animated popup.

## 3) Assumptions

- Existing Dexie schema includes books, acts, chapters, outline nodes, and a sync pipeline.
- “TipTap JSON 3.0” refers to your current TipTap JSON schema including your custom nodes.
- A SceneDivider custom node is/will be available on FE.

## 4) NPM Packages

Runtime/conversion
- mammoth (browser build) — DOCX → HTML
- @tiptap/html — generateJSON
- @tiptap/core
- @tiptap/extension-document
- @tiptap/extension-paragraph
- @tiptap/extension-text
- @tiptap/extension-bold
- @tiptap/extension-italic
- @tiptap/extension-underline
- @tiptap/extension-blockquote
- @tiptap/extension-hard-break
- Custom: SceneDivider TipTap extension

App/runtime
- dexie (+ dexie-observable/live-query if used)
- uuid or nanoid
- framer-motion
- lottie-react (optional)
- zod (optional)
- @tauri-apps/api, @tauri-apps/plugin-dialog, @tauri-apps/plugin-fs
- date-fns (optional)

Vite alias to use Mammoth browser build

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      mammoth: 'mammoth/mammoth.browser.js',
    },
  },
});
```

## 5) Data Model (Dexie)

- books: { id, title, ... }
- acts: { id, bookId, name, position, createdAt, updatedAt, revLocal, syncState }
- chapters: { id, bookId, versionId?, actId, title, content (TipTap JSON), position, createdAt, updatedAt, revLocal, syncState }
- outlineNodes: { id, bookId, actId, chapterId?, type ('ACT'|'CHAPTER'|...), position, createdAt, updatedAt }
- jobs: { id, type ('import_docx'), status ('queued'|'running'|'completed'|'failed'|'canceled'), progress (0-100), totalSteps, currentStep, meta, startedAt, endedAt, error? }

## 6) UX Flow

- User opens Import DOCX modal.
- Inputs: File, Act (select or new name).
- On start: Modal turns into job popup with animation and progress.
- On completion: Success state with “View Chapters”; errors show retry.

## 7) Job Architecture

- In-memory queue + Dexie.jobs persistence.
- States: queued → running → completed/failed/canceled.
- Steps / progress markers (example):
  1. reading_docx (5%)
  2. converting_to_html (15%)
  3. preprocessing_html (25%)
  4. splitting_chapters (35%)
  5. converting_to_tiptap (65%)
  6. persisting_to_db (85%)
  7. finalizing (100%)
- Update Dexie and a JobStore per step for UI reactivity.

## 8) Conversion Logic

- Read file:
  - input[type=file] → file.arrayBuffer(), or
  - Tauri FS plugin for path → ArrayBuffer/Uint8Array.
- mammoth.convertToHtml({ arrayBuffer }, { convertImage: none, styleMap: [b/i/u/Quote mappings] })
- Scene Divider detection:
  - Do not depend on a user-selected divider style during import.
  - Convert to TipTap JSON first, then replace any standalone paragraph whose plain text matches canonical patterns with a `{ type: 'sceneDivider', attrs: { id } }` node. Canonical patterns include: `***`, `•••`, `■■■`, `———` (em-dash triple), plus a few safe fallbacks.
- Split chapters by `<h1>(.*?)</h1>`.
- TipTap JSON:
  - generateJSON(fullHtml, extensions), include SceneDivider extension so the marker becomes a node.

Example conversion utility (simplified)

```ts
import mammoth from 'mammoth';
import { generateJSON } from '@tiptap/html';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Blockquote from '@tiptap/extension-blockquote';
import HardBreak from '@tiptap/extension-hard-break';
import { SceneDividerExtension } from '@/extensions/SceneDividerExtension';
import { v4 as uuidv4 } from 'uuid';

const baseExtensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Underline,
  Blockquote,
  HardBreak,
  SceneDividerExtension,
];

export async function convertDocxToChapters(arrayBuffer: ArrayBuffer) {
  const result = await mammoth.convertToHtml({ arrayBuffer }, {
    convertImage: mammoth.images.none,
    styleMap: [
      'b => strong',
      'i => em',
      'u => underline',
      "p[style-name='Quote'] => blockquote",
    ],
  });

  let html = result.value || '';

  const chunks = html.split(/<h1>(.*?)<\/h1>/g);
  const chapters: { title: string; content: any[] }[] = [];

  for (let i = 1; i < chunks.length; i += 2) {
    const title = (chunks[i] || '').trim() || `Chapter ${i / 2 + 1}`;
    const body = (chunks[i + 1] || '').trim();
    const fullHtml = `<h1>${title}<\/h1>${body}`;
    const json = generateJSON(fullHtml, baseExtensions);
    const content = (json?.content || []).map(block => {
      if (block.type !== 'paragraph') return block;
      const text = (block.content || []).map((n: any) => n.text || '').join('').trim();
      const canonical = ['***', '•••', '■■■', '———'];
      if (canonical.includes(text)) {
        return { type: 'sceneDivider', attrs: { id: uuidv4() } };
      }
      return block;
    });
    chapters.push({ title, content });
  }

  return chapters;
}
```

## 9) Dexie Write + Act/Outline Creation

- Resolve target Act:
  - actId → use.
  - actName → find or create Act + Outline node.
  - none → ensure default “Imported” act exists (or “Act I”), create if missing + outline node.
- Insert each chapter:
  - chapters.add({ title, content, actId, position, timestamps, revLocal, syncState='dirty' })
  - Create outline node for the chapter when applicable.


```ts
import { db } from '@/db';
import { nanoid } from 'nanoid';

export async function persistImportedChapters({
  bookId, actId, actName, chapters,
}: {
  bookId: string;
  actId?: string;
  actName?: string;
  chapters: { title: string; content: any[] }[];
}) {
  return db.transaction('rw', db.acts, db.chapters, db.outlineNodes, async () => {
    let targetActId = actId;

    if (!targetActId) {
      if (actName) {
        const existing = await db.acts.where({ bookId, name: actName }).first();
        if (existing) targetActId = existing.id; else {
          targetActId = nanoid();
          const now = Date.now();
          await db.acts.add({
            id: targetActId, bookId, name: actName, position: 999,
            createdAt: now, updatedAt: now, revLocal: `rev_${now}_${nanoid(5)}`,
            syncState: 'dirty',
          });
          await ensureActOutlineNode({ bookId, actId: targetActId, now });
        }
      } else {
        const defaultName = 'Imported';
        const existing = await db.acts.where({ bookId, name: defaultName }).first();
        if (existing) targetActId = existing.id; else {
          targetActId = nanoid();
          const now = Date.now();
          await db.acts.add({
            id: targetActId, bookId, name: defaultName, position: 999,
            createdAt: now, updatedAt: now, revLocal: `rev_${now}_${nanoid(5)}`,
            syncState: 'dirty',
          });
          await ensureActOutlineNode({ bookId, actId: targetActId, now });
        }
      }
    }

    let position = (await db.chapters.where({ bookId, actId: targetActId }).count()) || 0;

    for (const ch of chapters) {
      const id = nanoid();
      const now = Date.now();
      const revLocal = `rev_${now}_${nanoid(5)}`;

      await db.chapters.add({
        id, bookId, actId: targetActId, title: ch.title, content: ch.content,
        position: position++, createdAt: now, updatedAt: now, revLocal, syncState: 'dirty',
      });

      await ensureChapterOutlineNode({ bookId, actId: targetActId, chapterId: id, now });
    }

    return { actId: targetActId, count: chapters.length };
  });
}

async function ensureActOutlineNode({ bookId, actId, now }: { bookId: string; actId: string; now: number }) {
  const existing = await db.outlineNodes.where({ bookId, actId, type: 'ACT' }).first();
  if (!existing) {
    await db.outlineNodes.add({ id: nanoid(), bookId, actId, type: 'ACT', position: 0, createdAt: now, updatedAt: now });
  }
}

async function ensureChapterOutlineNode({ bookId, actId, chapterId, now }:
  { bookId: string; actId: string; chapterId: string; now: number }) {
  await db.outlineNodes.add({ id: nanoid(), bookId, actId, chapterId, type: 'CHAPTER', position: 0, createdAt: now, updatedAt: now });
}
```

## 10) Import Job Orchestration

- API: `startImportDocxJob({ file|arrayBuffer, bookId, actId?, actName? }) → Promise<JobId>`
- Creates Dexie.jobs record (status='queued'), runs async pipeline with progress updates and final status.

```ts
import { nanoid } from 'nanoid';
import { jobsStore } from '@/stores/jobs';
import { db } from '@/db';
import { convertDocxToChapters } from '@/services/import/convertDocx';
import { persistImportedChapters } from '@/services/import/persist';

export async function startImportDocxJob(params: {
  file?: File; arrayBuffer?: ArrayBuffer; bookId: string; actId?: string; actName?: string;
}) {
  const id = nanoid();
  const meta = { ...params, fileName: params.file?.name || params.path || '' };
  const now = Date.now();

  await db.jobs.add({ id, type: 'import_docx', status: 'queued', progress: 0, totalSteps: 7, currentStep: 0, meta, startedAt: now });

  (async () => {
    try {
      jobsStore.update(id, { status: 'running', currentStep: 1, progress: 5 });

  let arrayBuffer: ArrayBuffer;
  if (params.arrayBuffer) arrayBuffer = params.arrayBuffer;
  else if (params.file) arrayBuffer = await params.file.arrayBuffer();
  else throw new Error('No file/arrayBuffer provided');

      jobsStore.update(id, { currentStep: 2, progress: 15 });

  const chapters = await convertDocxToChapters(arrayBuffer);

      jobsStore.update(id, { currentStep: 6, progress: 85 });

      await persistImportedChapters({
        bookId: params.bookId,
        actId: params.actId,
        actName: params.actName,
        chapters,
      });

      jobsStore.update(id, { currentStep: 7, progress: 100, status: 'completed' });
      await db.jobs.update(id, { progress: 100, status: 'completed', endedAt: Date.now() });
    } catch (e: any) {
      jobsStore.update(id, { status: 'failed' });
      await db.jobs.update(id, { status: 'failed', error: String(e), endedAt: Date.now() });
    }
  })();

  return id;
}
```

## 11) UI Spec: Job Popup (Framer Motion)

- Theme: match existing popups/themes.
- Header: “Importing DOCX…”, file name, target Act.
- Progress: bar + percentage + step indicator.
- Animation: Framer Motion “pages” flying into a book icon; optional Lottie.
- Controls: Hide/minimize; optional cancel; View Details on success.
- Accessibility: ARIA dialog, Esc to close, focus trap.

```tsx
import { motion, AnimatePresence } from 'framer-motion';

export function ImportJobPopup({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <AnimatePresence>
      {job && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="modal-panel"
          >
            <header>
              <h3>Importing DOCX…</h3>
              <p>{job.meta?.fileName}</p>
            </header>

            <div className="animation-area">
              <div className="pages">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="page"
                    animate={{ x: [0, 40, 80], y: [0, -10, 0], rotate: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }} />
                ))}
              </div>
              <div className="book-icon" />
            </div>

            <div className="progress">
              <div className="bar"><div className="fill" style={{ width: `${job.progress || 0}%` }} /></div>
              <div className="percent">{Math.round(job.progress || 0)}%</div>
              <div className="step">Step {job.currentStep}/{job.totalSteps}</div>
            </div>

            <footer><button onClick={onClose}>Hide</button></footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## 12) Update EditorFooter's jobProgress bar
- Utilize the EditorFotter.tsx to load the job progress in BooKForgePage using the existing ProgressBar
- Utilize the setJobProgress to update the percent complete on the Job progress or Book Title section. 
- Ensure the current job step is also being shown if possibe
- If the user clicks on the progressw bar, show a popup of the list of jobs currently progressing and clicking on each of the job should load a popup for hte jonb detail with the currently ongoing process (this can be a link  to the initial popup used)
- Lets supprot differn job types including import jobs, export jobs, AI jobs...


## 13) Scene Divider Handling

- Input field in modal for Scene Divider (default ***).
- Preprocessing: replace that string (when on its own paragraph line) with `<hr data-scene-divider="true" />` prior to generateJSON.
- SceneDivider TipTap extension must parse/render this marker to your configured node.

## 14) Sync Considerations

- Newly inserted chapters set `syncState='dirty'` and `revLocal` so your existing sync picks them up.
- Ensure ordering for act → chapters → outline nodes is consistent on sync.

## 15) Edge Cases

- Large DOCX: progress is approximate; keep UI responsive.
- No H1 headings: import as a single chapter titled “Imported Chapter”.
- Conversion errors per chapter: skip/continue with log; job overall may still succeed.
- Cancellation (optional): stop at safe boundaries; prefer transactional writes.

## 16) Validation & Telemetry

- Validate: file type, size, scene divider length (1–10 chars).
- Local log of job lifecycle (optional).

## 17) Developer Notes

- Mammoth via browser build requires Vite alias (see above).
- Optionally offload DOCX → HTML to Rust (Tauri command) for performance, then HTML → TipTap in JS.

## 17) Deliverables

- Import modal with inputs (file, act, scene divider).
- Job store + Dexie.jobs integration.
- Conversion service (Mammoth + generateJSON + SceneDivider).
- Persistence service to Dexie with act/outline creation and chapter inserts.
- Framer Motion popup with progress + optional Lottie animation.
- Unit tests for conversion and persistence.

## 18) Installation (example)

```bash
npm i mammoth @tiptap/html @tiptap/core @tiptap/extension-document @tiptap/extension-paragraph @tiptap/extension-text @tiptap/extension-bold @tiptap/extension-italic @tiptap/extension-underline @tiptap/extension-blockquote @tiptap/extension-hard-break dexie framer-motion lottie-react nanoid zod date-fns @tauri-apps/api @tauri-apps/plugin-dialog @tauri-apps/plugin-fs
```
