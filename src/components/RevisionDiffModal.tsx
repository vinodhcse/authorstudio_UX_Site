import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Blockquote from '@tiptap/extension-blockquote';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import CodeBlock from '@tiptap/extension-code-block';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
// Custom nodes used in documents
import { SceneBeatExtension } from '../extensions/SceneBeatExtension';
import { NoteSectionExtension } from '../extensions/NoteSectionExtension';
import { CharacterImpersonationExtension } from '../extensions/CharacterImpersonationExtension';
import { DictationSectionNode } from '../components/custom-nodes/DictationSectionNode';
import { SimpleExtension } from '../extensions/SimpleExtension';
import { TestExtension } from '../extensions/TestExtension';
// import { diffTipTap, DiffHunk } from '../services/revisionDiff';

interface Props {
  open: boolean;
  onClose: () => void;
  leftDoc: any; // current content
  rightDoc: any; // revision content
  onApplyAll: (merged: any) => void;
  onCreateRevision: (merged: any) => void;
  onApplyBlock?: (merged: any) => void; // cherry-pick
}

const RevisionDiffModal: React.FC<Props> = ({ open, onClose, leftDoc, rightDoc, onApplyAll, onCreateRevision, onApplyBlock }) => {
  // Fallback to current editor JSON so left side isn't empty
  const safeLeft = useMemo(() => leftDoc ?? (window as any)?.__currentChapterJSON ?? { type: 'doc', content: [] }, [leftDoc]);
  const safeRight = useMemo(() => rightDoc ?? { type: 'doc', content: [] }, [rightDoc]);
  // View mode: line-by-line (default) or rich TipTap editors
  const [mode, setMode] = useState<'lines' | 'rich'>('rich');
  // Working copy of left (current) content that inline restores can modify without persisting yet
  const [workingDoc, setWorkingDoc] = useState<any>(safeLeft);
  useEffect(() => { setWorkingDoc(safeLeft); }, [safeLeft]);
  // Track current change index from Lines view for summary and restore
  const [currentChangeIdx, setCurrentChangeIdx] = useState(0);
  const groupsRef = useRef<any[]>([]);
  const rowsRef = useRef<any[]>([]);

  // Left editor (read-only)
  const sharedExtensions = [
    StarterKit.configure({
      bulletList: false,
      orderedList: false,
      listItem: false,
      codeBlock: false,
      code: false,
      strike: false,
      horizontalRule: false,
      blockquote: false,
      link: false,
    }),
    Underline,
    Strike,
    Code,
    Superscript,
    Subscript,
    Highlight.configure({ multicolor: true }),
    Blockquote,
    TextStyle,
    Color.configure({ types: [TextStyle.name, ListItem.name] }),
    BulletList,
    OrderedList,
    ListItem,
    TaskList,
    TaskItem,
    CodeBlock,
    HorizontalRule,
    Link.configure({ openOnClick: false }),
    Image,
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    // Custom nodes
    SceneBeatExtension,
    NoteSectionExtension,
    CharacterImpersonationExtension,
    TestExtension,
    SimpleExtension,
    DictationSectionNode,
  ];

  const leftEditor = useEditor({
    extensions: sharedExtensions,
  content: workingDoc,
    editable: false,
    editorProps: {
      attributes: {
  // Rely on prose + dark invert; ensure correct foregrounds by NOT inverting explicitly
  class: 'prose dark:prose-invert prose-lg max-w-none font-serif text-gray-900 dark:text-gray-100',
      },
    },
  });
  // Right editor (editable target)
  const rightEditor = useEditor({
    extensions: sharedExtensions,
    content: safeRight,
    editable: true,
    editorProps: {
      attributes: {
  class: 'prose dark:prose-invert prose-lg max-w-none font-serif text-gray-900 dark:text-gray-100',
      },
    },
  });

  // Utility: sanitize TipTap JSON to remove empty text nodes and ensure empty paragraphs use NBSP
  const sanitizeDoc = useMemo(() => {
    const NBSP = '\u00A0';
  const sanitizeNode = (node: any): any | null => {
      if (!node || typeof node !== 'object') return null;
      if (node.type === 'text') {
        const t = typeof node.text === 'string' ? node.text : '';
        if (t.length === 0) return null;
        return { ...node, text: t };
      }
      const content = Array.isArray(node.content) ? node.content.map(sanitizeNode).filter(Boolean) as any[] : undefined;
      if (node.type === 'paragraph') {
        const safeContent = content && content.length > 0 ? content : [{ type: 'text', text: NBSP }];
        return { ...node, content: safeContent };
      }
      if (content) return { ...node, content };
      return { ...node };
    };
    return (doc: any) => {
      if (!doc || typeof doc !== 'object') return { type: 'doc', content: [] };
      const content = Array.isArray(doc.content) ? doc.content.map(sanitizeNode).filter(Boolean) : [];
      return { type: 'doc', content };
    };
  }, []);

  // Update editors when docs change (only in lines mode to avoid clobbering rich-aligned content)
  useEffect(() => {
    if (leftEditor && open && mode === 'lines') leftEditor.commands.setContent(sanitizeDoc(workingDoc), { emitUpdate: false });
  }, [leftEditor, workingDoc, open, mode, sanitizeDoc]);
  useEffect(() => {
    if (rightEditor && open && mode === 'lines') rightEditor.commands.setContent(sanitizeDoc(safeRight), { emitUpdate: false });
  }, [rightEditor, safeRight, open, mode, sanitizeDoc]);

  // Build aligned docs for rich mode using paragraph-level diff from current-left perspective
  const [alignedLeft, setAlignedLeft] = useState<any | null>(null);
  const [alignedRight, setAlignedRight] = useState<any | null>(null);
  const alignedMapRef = useRef<{ emitToLeft: number[]; emitToRight: number[] } | null>(null);
  // Track which aligned paragraphs are visual placeholders (to resize them to match counterpart line count)
  const placeholderMetaRef = useRef<Array<{ side: 'left' | 'right'; alignedIdx: number; kind: 'add' | 'del' }>>([]);
  const buildAlignedDocsByParagraph = (leftDocIn: any, rightDocIn: any) => {
    const para = (nodes: any[]) => ({ type: 'paragraph', content: nodes.length ? nodes : [{ type: 'text', text: '\u00A0' }] });
    const txt = (t: string, mark?: 'add' | 'del') => mark ? ({ type: 'text', text: t, marks: [{ type: 'highlight', attrs: { color: mark === 'add' ? '#bbf7d0' : '#fecaca' } }] }) : ({ type: 'text', text: t });
    const textOf = (n: any): string => {
      if (!n) return '';
      if (n.type === 'text') return n.text || '';
      return (n.content || []).map(textOf).join('');
    };
  const leftNodes = (leftDocIn?.content ?? []) as any[];
  const rightNodes = (rightDocIn?.content ?? []) as any[];
  const leftArr = leftNodes.map(textOf) as string[];
  const rightArr = rightNodes.map(textOf) as string[];
  const leftTypes = leftNodes.map(n => n?.type || '');
  const rightTypes = rightNodes.map(n => n?.type || '');
    // LCS over paragraphs
    const m = leftArr.length, n = rightArr.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = (leftArr[i] === rightArr[j] && leftTypes[i] === rightTypes[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  type Op = { t: 'equal'; lIdx: number; rIdx: number } | { t: 'add'; lIdx: number } | { t: 'del'; rIdx: number };
  const ops: Op[] = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
  if (leftArr[i] === rightArr[j] && leftTypes[i] === rightTypes[j]) { ops.push({ t: 'equal', lIdx: i, rIdx: j }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: 'add', lIdx: i }); i++; }
      else { ops.push({ t: 'del', rIdx: j }); j++; }
    }
    while (i < m) { ops.push({ t: 'add', lIdx: i }); i++; }
    while (j < n) { ops.push({ t: 'del', rIdx: j }); j++; }

    const wl = (a = '', b = '') => {
      const aw = a.split(/(\s+)/).filter(Boolean);
      const bw = b.split(/(\s+)/).filter(Boolean);
      const dp2: number[][] = Array(aw.length + 1).fill(0).map(() => Array(bw.length + 1).fill(0));
      for (let x = aw.length - 1; x >= 0; x--) for (let y = bw.length - 1; y >= 0; y--) dp2[x][y] = aw[x] === bw[y] ? dp2[x + 1][y + 1] + 1 : Math.max(dp2[x + 1][y], dp2[x][y + 1]);
      const out: Array<{ t: 'same' | 'add' | 'del'; text: string }> = []; let x = 0, y = 0;
      while (x < aw.length && y < bw.length) { if (aw[x] === bw[y]) { out.push({ t: 'same', text: aw[x++] }); y++; } else if (dp2[x + 1][y] >= dp2[x][y + 1]) { out.push({ t: 'del', text: aw[x++] }); } else { out.push({ t: 'add', text: bw[y++] }); } }
      while (x < aw.length) out.push({ t: 'del', text: aw[x++] });
      while (y < bw.length) out.push({ t: 'add', text: bw[y++] });
      return out;
    };
  // Forward-looking pairing: prefer replace when an add closely matches a forthcoming del
  type Emit = { kind: 'equal'; lIdx: number; rIdx: number } | { kind: 'replace'; lIdx: number; rIdx: number } | { kind: 'add'; lIdx: number } | { kind: 'del'; rIdx: number };
  const emits: Emit[] = [];
  let k = 0;
    const simDetail = (a: string, b: string) => {
      const aw = a.split(/(\s+)/).filter(Boolean);
      const bw = b.split(/(\s+)/).filter(Boolean);
      if (aw.length === 0 && bw.length === 0) return { score: 1, lcs: 0, minLen: 0 };
      const dpS: number[][] = Array(aw.length + 1).fill(0).map(() => Array(bw.length + 1).fill(0));
      for (let x = aw.length - 1; x >= 0; x--) for (let y = bw.length - 1; y >= 0; y--) dpS[x][y] = aw[x] === bw[y] ? dpS[x + 1][y + 1] + 1 : Math.max(dpS[x + 1][y], dpS[x][y + 1]);
      const lcs = dpS[0][0];
      const score = lcs / Math.max(1, Math.max(aw.length, bw.length));
      return { score, lcs, minLen: Math.min(aw.length, bw.length) };
    };
    const consumedDel = new Set<number>();
    const WINDOW = 8;
    const THRESH = 0.45;
    while (k < ops.length) {
      const o = ops[k];
      if (o.t === 'equal') {
        emits.push({ kind: 'equal', lIdx: o.lIdx, rIdx: o.rIdx });
        k++;
        continue;
      }
      if (o.t === 'add') {
        const lIdx = o.lIdx;
        // look ahead for the best matching del within WINDOW
        let bestJ = -1; let bestScore = -1;
        for (let j2 = k + 1; j2 < Math.min(ops.length, k + 1 + WINDOW); j2++) {
          const cand = ops[j2];
          if (cand.t !== 'del') continue;
          if (consumedDel.has(cand.rIdx)) continue;
          if (leftTypes[lIdx] !== rightTypes[cand.rIdx]) continue;
          const { score, lcs, minLen } = simDetail(rightArr[cand.rIdx] || '', leftArr[lIdx] || '');
          if (minLen < 5 || lcs < 3 || score < THRESH) continue;
          if (score > bestScore) { bestScore = score; bestJ = j2; }
        }
        if (bestJ !== -1) {
          const d = ops[bestJ] as any; // del
          consumedDel.add(d.rIdx);
          emits.push({ kind: 'replace', lIdx, rIdx: d.rIdx });
        } else {
          emits.push({ kind: 'add', lIdx });
        }
        k++;
        continue;
      }
      if (o.t === 'del') {
        if (!consumedDel.has(o.rIdx)) emits.push({ kind: 'del', rIdx: o.rIdx });
        k++;
        continue;
      }
    }

    // Build aligned docs and maps
  const leftOut: any[] = [];
  const rightOut: any[] = [];
    const emitToLeft: number[] = [];
    const emitToRight: number[] = [];
  const placeholderMeta: Array<{ side: 'left' | 'right'; alignedIdx: number; kind: 'add' | 'del' }> = [];
    for (let idx = 0; idx < emits.length; idx++) {
      const e = emits[idx];
      if (e.kind === 'equal') {
        const sL = leftArr[e.lIdx];
        const sR = rightArr[e.rIdx];
        leftOut.push(sL.length ? para([txt(sL)]) : para([]));
        rightOut.push(sR.length ? para([txt(sR)]) : para([]));
        emitToLeft[idx] = leftOut.length - 1;
        emitToRight[idx] = rightOut.length - 1;
      } else if (e.kind === 'replace') {
        const a = rightArr[e.rIdx] || '';
        const b = leftArr[e.lIdx] || '';
        const segs = wl(a, b);
        leftOut.push(para(segs.map(s => txt(s.text, s.t === 'add' ? 'add' : undefined))));
        rightOut.push(para(segs.map(s => txt(s.text, s.t === 'del' ? 'del' : undefined))));
        emitToLeft[idx] = leftOut.length - 1;
        emitToRight[idx] = rightOut.length - 1;
      } else if (e.kind === 'add') {
        const s = leftArr[e.lIdx] || '';
        leftOut.push(s.length ? para([txt(s, 'add')]) : para([txt('', 'add')]));
        // visible green placeholder on right to preserve alignment
  rightOut.push(para([txt('\u00A0', 'add')]));
  placeholderMeta.push({ side: 'right', alignedIdx: rightOut.length - 1, kind: 'add' });
        emitToLeft[idx] = leftOut.length - 1;
        emitToRight[idx] = rightOut.length - 1;
      } else if (e.kind === 'del') {
        const s = rightArr[e.rIdx] || '';
        // visible red placeholder on left to preserve alignment
  leftOut.push(para([txt('\u00A0', 'del')]));
  placeholderMeta.push({ side: 'left', alignedIdx: leftOut.length - 1, kind: 'del' });
        rightOut.push(s.length ? para([txt(s, 'del')]) : para([txt('', 'del')]));
        emitToLeft[idx] = leftOut.length - 1;
        emitToRight[idx] = rightOut.length - 1;
      }
    }
    alignedMapRef.current = { emitToLeft, emitToRight };

    // Build groups from emits for navigation/restore (left-perspective kinds)
    const groups: ChangeGroup[] = [];
    for (let eIdx = 0; eIdx < emits.length; eIdx++) {
      const e = emits[eIdx];
      if (e.kind === 'equal') continue;
      const kind: 'add' | 'del' | 'replace' = e.kind;
      const leftParaIndices: number[] = Number.isFinite((e as any).lIdx) ? [(e as any).lIdx] : [];
      const rightParaIndices: number[] = Number.isFinite((e as any).rIdx) ? [(e as any).rIdx] : [];
      let prevEqualLeft: number | undefined;
      for (let p = eIdx - 1; p >= 0; p--) { const prev = emits[p]; if (prev.kind === 'equal') { prevEqualLeft = (prev as any).lIdx; break; } }
      groups.push({ kind, startRow: eIdx, endRow: eIdx, leftParaIndices, rightParaIndices, prevEqualLeftParaIndex: prevEqualLeft });
    }

  return { left: { type: 'doc', content: leftOut }, right: { type: 'doc', content: rightOut }, groups, placeholderMeta };
  };

  useEffect(() => {
    if (mode !== 'rich') { setAlignedLeft(null); setAlignedRight(null); return; }
  const { left, right, groups, placeholderMeta } = buildAlignedDocsByParagraph(workingDoc, safeRight);
    setAlignedLeft(left); setAlignedRight(right);
    groupsRef.current = groups;
  placeholderMetaRef.current = placeholderMeta;
    if (currentChangeIdx >= groups.length) setCurrentChangeIdx(0);
  }, [mode, workingDoc, safeRight, currentChangeIdx]);

  // Scroll to current change in rich mode
  useEffect(() => {
    if (!open || mode !== 'rich') return;
  const map = alignedMapRef.current;
  const groups = groupsRef.current;
  if (!map || !groups?.length) return;
    const g = groups[Math.min(currentChangeIdx, groups.length - 1)];
    if (!g) return;
  // Choose the first emit index in the group for scroll targeting
  const emitStart = g.startRow;
  const leftParaIdx = map.emitToLeft[emitStart];
  const rightParaIdx = map.emitToRight[emitStart];
    const scrollInto = (wrap: HTMLDivElement | null, paraIdx?: number) => {
      if (!wrap || paraIdx == null || paraIdx < 0) return;
      const pm = wrap.querySelector('.ProseMirror');
      if (!pm) return;
      const paras = pm.querySelectorAll('p');
      const el = paras[paraIdx] as HTMLElement | undefined;
      if (!el) return;
      const wrapRect = wrap.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - wrapRect.top + wrap.scrollTop;
      wrap.scrollTo({ top: Math.max(0, offset - 24), behavior: 'smooth' });
    };
    requestAnimationFrame(() => {
      scrollInto(leftWrapRef.current, leftParaIdx);
      scrollInto(rightWrapRef.current, rightParaIdx);
    });
  }, [open, mode, currentChangeIdx, alignedLeft, alignedRight]);

  // Groups for rich mode are produced alongside aligned docs; lines mode supplies groups via LinesDiffView.
  useEffect(() => {
    /* no-op */
  }, [mode, workingDoc, safeRight, currentChangeIdx]);

  // When in rich mode and we have aligned docs, set them into editors
  useEffect(() => {
    if (!open) return;
    if (mode === 'rich' && leftEditor && alignedLeft) leftEditor.commands.setContent(sanitizeDoc(alignedLeft), { emitUpdate: false });
  }, [mode, alignedLeft, leftEditor, open, sanitizeDoc]);
  useEffect(() => {
    if (!open) return;
    if (mode === 'rich' && rightEditor && alignedRight) rightEditor.commands.setContent(sanitizeDoc(alignedRight), { emitUpdate: false });
  }, [mode, alignedRight, rightEditor, open, sanitizeDoc]);

  // After rich content is rendered, resize placeholder paragraphs to match counterpart line count
  useEffect(() => {
    if (!open || mode !== 'rich') return;
    if (!alignedLeft || !alignedRight) return;
    // Defer until editors have painted
    const run = () => {
      const meta = placeholderMetaRef.current || [];
      if (!meta.length) return;
      const leftPM = leftWrapRef.current?.querySelector('.ProseMirror');
      const rightPM = rightWrapRef.current?.querySelector('.ProseMirror');
      if (!leftPM || !rightPM) return;
      const leftParas = leftPM.querySelectorAll('p');
      const rightParas = rightPM.querySelectorAll('p');
      const NBSP = '\u00A0';
      const makePlaceholder = (lines: number, color: string) => {
        const content: any[] = [];
        for (let i = 0; i < Math.max(1, lines); i++) {
          content.push({ type: 'text', text: NBSP, marks: [{ type: 'highlight', attrs: { color } }] });
          if (i < Math.max(1, lines) - 1) content.push({ type: 'hardBreak' });
        }
        return { type: 'paragraph', content };
      };
      const getLines = (el: Element | null | undefined): number => {
        const node = el as HTMLElement | null;
        if (!node) return 1;
        const rect = node.getBoundingClientRect();
        const styles = window.getComputedStyle(node);
        let lh = parseFloat(styles.lineHeight);
        if (!isFinite(lh)) {
          const fs = parseFloat(styles.fontSize) || 16;
          lh = fs * 1.4;
        }
        if (lh <= 0) lh = 20;
        return Math.max(1, Math.round(rect.height / lh));
      };

      let changed = false;
      const newLeft: any = JSON.parse(JSON.stringify(alignedLeft));
      const newRight: any = JSON.parse(JSON.stringify(alignedRight));

      for (const p of meta) {
        if (p.side === 'right') {
          const counterpart = leftParas[p.alignedIdx] as HTMLElement | undefined;
          const lines = getLines(counterpart);
          const node = makePlaceholder(lines, '#bbf7d0'); // add = green
          // Replace only if actually different to avoid loops
          if (JSON.stringify(newRight.content[p.alignedIdx]) !== JSON.stringify(node)) {
            newRight.content[p.alignedIdx] = node;
            changed = true;
          }
        } else if (p.side === 'left') {
          const counterpart = rightParas[p.alignedIdx] as HTMLElement | undefined;
          const lines = getLines(counterpart);
          const node = makePlaceholder(lines, '#fecaca'); // del = red
          if (JSON.stringify(newLeft.content[p.alignedIdx]) !== JSON.stringify(node)) {
            newLeft.content[p.alignedIdx] = node;
            changed = true;
          }
        }
      }

      if (changed) {
        if (leftEditor) leftEditor.commands.setContent(sanitizeDoc(newLeft), { emitUpdate: false });
        if (rightEditor) rightEditor.commands.setContent(sanitizeDoc(newRight), { emitUpdate: false });
      }
    };
    // Use rAF twice to ensure layout has stabilized
    requestAnimationFrame(() => requestAnimationFrame(run));

  // Re-run on window resize to keep line counts in sync
  const onResize = () => requestAnimationFrame(() => requestAnimationFrame(run));
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
  }, [open, mode, alignedLeft, alignedRight, leftEditor, rightEditor, sanitizeDoc]);

  // Sync scrolling
  const leftWrapRef = useRef<HTMLDivElement>(null);
  const rightWrapRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef<'left' | 'right' | null>(null);
  useEffect(() => {
    const leftEl = leftWrapRef.current;
    const rightEl = rightWrapRef.current;
    if (!leftEl || !rightEl) return;
    const onLeft = () => {
      if (syncingRef.current === 'right') return;
      syncingRef.current = 'left';
      const ratio = leftEl.scrollTop / (leftEl.scrollHeight - leftEl.clientHeight || 1);
      rightEl.scrollTop = ratio * (rightEl.scrollHeight - rightEl.clientHeight);
      syncingRef.current = null;
    };
    const onRight = () => {
      if (syncingRef.current === 'left') return;
      syncingRef.current = 'right';
      const ratio = rightEl.scrollTop / (rightEl.scrollHeight - rightEl.clientHeight || 1);
      leftEl.scrollTop = ratio * (leftEl.scrollHeight - leftEl.clientHeight);
      syncingRef.current = null;
    };
    leftEl.addEventListener('scroll', onLeft, { passive: true });
    rightEl.addEventListener('scroll', onRight, { passive: true });
    return () => {
      leftEl.removeEventListener('scroll', onLeft);
      rightEl.removeEventListener('scroll', onRight);
    };
  }, [open, mode]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // (block-level diff removed; we rely on line groups below for summary and restores)

  // no-op reference so linter knows prop is intentionally available
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  void onApplyBlock;

  // Restore current change from right into workingDoc (line-level group aware)
  const restoreCurrentChange = () => {
    const group = groupsRef.current[currentChangeIdx];
    if (!group) return;
    const leftContent: any[] = JSON.parse(JSON.stringify(workingDoc?.content ?? []));
    const rightContent: any[] = JSON.parse(JSON.stringify(safeRight?.content ?? []));
    const clone = (n: any) => JSON.parse(JSON.stringify(n));
    if (group.kind === 'replace') {
      const leftIdx = Math.min(...group.leftParaIndices);
      const rightIdx = Math.min(...group.rightParaIndices);
      if (Number.isFinite(leftIdx) && Number.isFinite(rightIdx)) {
        leftContent[leftIdx] = clone(rightContent[rightIdx]);
      }
    } else if (group.kind === 'add') {
      // add = insertion in current -> restoring should remove it from current
      const leftIdx = Math.min(...group.leftParaIndices);
      if (Number.isFinite(leftIdx)) leftContent.splice(leftIdx, 1);
    } else if (group.kind === 'del') {
      // del = deleted from current -> restoring should insert from previous into current
      const insertAfter = Number.isFinite(group.prevEqualLeftParaIndex) ? group.prevEqualLeftParaIndex : -1;
      const at = Math.max(0, insertAfter + 1);
      const rightIdx = Math.min(...group.rightParaIndices);
      if (Number.isFinite(rightIdx)) leftContent.splice(at, 0, clone(rightContent[rightIdx]));
    }
    setWorkingDoc({ ...(workingDoc || { type: 'doc' }), content: leftContent });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.98, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 20, opacity: 0 }}
            className="relative z-[95] w-[90vw] max-w-6xl h-[80vh] rounded-xl border border-gray-300 dark:border-gray-700 shadow-2xl overflow-hidden bg-white dark:bg-slate-900"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Revision Compare</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs rounded-md bg-slate-200 text-gray-900 dark:bg-slate-700 dark:text-white hover:opacity-90" onClick={() => { (window as any).__currentChapterJSON = workingDoc; window.dispatchEvent(new CustomEvent('chapter-json-updated', { detail: workingDoc })); try { window.dispatchEvent(new CustomEvent('chapterContentUpdated', { detail: { content: workingDoc } })); } catch {} onApplyAll(workingDoc); }}>Apply All</button>
                <button className="px-3 py-1.5 text-xs rounded-md bg-sky-600 dark:bg-sky-500 text-white hover:opacity-90" onClick={() => { (window as any).__currentChapterJSON = workingDoc; window.dispatchEvent(new CustomEvent('chapter-json-updated', { detail: workingDoc })); try { window.dispatchEvent(new CustomEvent('chapterContentUpdated', { detail: { content: workingDoc } })); } catch {} onCreateRevision(workingDoc); }}>Create New Revision</button>
                <button className="px-3 py-1.5 text-xs rounded-md bg-slate-200 text-gray-900 dark:bg-slate-700 dark:text-white hover:opacity-90" onClick={onClose}>Close</button>
              </div>
            </div>
            {/* Mode toggle */}
            <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-black/10 dark:border-white/10 flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-300">View:</span>
              <div className="inline-flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
                <button className={`px-3 py-1 text-xs ${mode==='lines' ? 'bg-slate-200 dark:bg-slate-700 text-gray-900 dark:text-white' : 'bg-transparent text-gray-700 dark:text-gray-300'}`} onClick={() => setMode('lines')}>Lines</button>
                <button className={`px-3 py-1 text-xs ${mode==='rich' ? 'bg-slate-200 dark:bg-slate-700 text-gray-900 dark:text-white' : 'bg-transparent text-gray-700 dark:text-gray-300'}`} onClick={() => setMode('rich')}>Rich</button>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button className="px-2 py-1 text-xs rounded-md bg-slate-200 text-gray-900 dark:bg-slate-700 dark:text-white" onClick={() => setCurrentChangeIdx(i => Math.max(0, i - 1))}>Prev</button>
                <span className="text-xs text-gray-600 dark:text-gray-300">{groupsRef.current.length ? `${currentChangeIdx+1}/${groupsRef.current.length}` : '0/0'}</span>
                <button className="px-2 py-1 text-xs rounded-md bg-slate-200 text-gray-900 dark:bg-slate-700 dark:text-white" onClick={() => setCurrentChangeIdx(i => Math.min((groupsRef.current.length-1)||0, i + 1))}>Next</button>
                <button className="px-2 py-1 text-xs rounded-md bg-emerald-600 text-white" onClick={restoreCurrentChange}>Restore current</button>
              </div>
            </div>

            {/* Content area */}
            {mode === 'rich' ? (
              <div className="grid grid-cols-2 h-[calc(80vh-210px)]">
                <div ref={leftWrapRef} className="h-full overflow-auto p-4 bg-white dark:bg-slate-900">
                  {leftEditor ? (
                    <EditorContent editor={leftEditor} />
                  ) : null}
                </div>
                <div ref={rightWrapRef} className="h-full overflow-auto p-4 border-l border-black/10 dark:border-white/10 bg-white dark:bg-slate-900">
                  {rightEditor ? (
                    <EditorContent editor={rightEditor} />
                  ) : null}
                </div>
              </div>
            ) : (
              <LinesDiffView
                leftDoc={workingDoc}
                rightDoc={safeRight}
                currentIdx={currentChangeIdx}
                onReady={(info) => {
                  rowsRef.current = info.rows;
                  groupsRef.current = info.groups;
                  if (currentChangeIdx >= info.groups.length) setCurrentChangeIdx(0);
                }}
                leftWrapRef={leftWrapRef}
                rightWrapRef={rightWrapRef}
              />
            )}
            {/* Diff summary with cherry-pick restore */}
            <div className="h-[120px] border-t border-black/10 dark:border-white/10 overflow-auto bg-gray-50 dark:bg-slate-800">
              <div className="p-3 text-xs text-gray-800 dark:text-gray-100 flex flex-col gap-2">
                {groupsRef.current.length === 0 && (
                  <div className="opacity-70">No differences detected.</div>
                )}
                {groupsRef.current.length > 0 && (() => {
                  const g = groupsRef.current[Math.min(currentChangeIdx, groupsRef.current.length - 1)];
                  if (!g) return null;
                  return (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className={`inline-block px-2 py-0.5 rounded mr-2 ${g.kind==='add' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : g.kind==='del' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'}`}>{g.kind.toUpperCase()}</span>
                        <span className="opacity-80">Change {currentChangeIdx + 1} of {groupsRef.current.length}</span>
                      </div>
                      <button className="shrink-0 px-2 py-1 rounded bg-slate-200 text-gray-900 dark:bg-slate-700 dark:text-white hover:opacity-90" onClick={restoreCurrentChange}>Restore</button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RevisionDiffModal;

// ---------- Helpers: line-by-line diff view ----------
type LinesDiffViewProps = {
  leftDoc: any;
  rightDoc: any;
  leftWrapRef: React.RefObject<HTMLDivElement>;
  rightWrapRef: React.RefObject<HTMLDivElement>;
  currentIdx: number;
  onReady: (info: { rows: RowWithMeta[]; groups: ChangeGroup[] }) => void;
};

type RowWithMeta = { type: 'equal' | 'add' | 'del' | 'replace'; left?: string; right?: string; leftParaIndex?: number; rightParaIndex?: number };
type ChangeGroup = { kind: 'add' | 'del' | 'replace'; startRow: number; endRow: number; leftParaIndices: number[]; rightParaIndices: number[]; prevEqualLeftParaIndex?: number };

const LinesDiffView: React.FC<LinesDiffViewProps> = ({ leftDoc, rightDoc, leftWrapRef, rightWrapRef, currentIdx, onReady }) => {
  // Convert TipTap JSON to plain text lines (paragraphs and hardBreaks)
  const extractParagraphs = (doc: any): string[] => {
    const blocks: any[] = doc?.content ?? [];
    const textOf = (n: any): string => {
      if (!n) return '';
      if (n.type === 'text') return n.text || '';
      return (n.content || []).map(textOf).join('');
    };
    return blocks.map(textOf);
  };
  const wrapPara = (text: string, width = 100): string[] => {
    const words = text.split(/(\s+)/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const next = line + w;
      if (next.length > width && line.length > 0) {
        lines.push(line);
        line = w.trimStart();
      } else {
        line = next;
      }
    }
    lines.push(line);
    return lines;
  };
  const leftParas = useMemo(() => extractParagraphs(leftDoc), [leftDoc]);
  const rightParas = useMemo(() => extractParagraphs(rightDoc), [rightDoc]);
  const leftLines = useMemo(() => leftParas.flatMap((p, pi) => wrapPara(p).map(txt => ({ text: txt, paraIndex: pi }))), [leftParas]);
  const rightLines = useMemo(() => rightParas.flatMap((p, pi) => wrapPara(p).map(txt => ({ text: txt, paraIndex: pi }))), [rightParas]);

  // LCS-based alignment
  const rows: RowWithMeta[] = useMemo(() => {
    const m = leftLines.length, n = rightLines.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        dp[i][j] = leftLines[i].text === rightLines[j].text ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out: RowWithMeta[] = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (leftLines[i].text === rightLines[j].text) { out.push({ type: 'equal', left: leftLines[i].text, right: rightLines[j].text, leftParaIndex: leftLines[i].paraIndex, rightParaIndex: rightLines[j].paraIndex }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', left: leftLines[i].text, leftParaIndex: leftLines[i].paraIndex }); i++; }
      else { out.push({ type: 'add', right: rightLines[j].text, rightParaIndex: rightLines[j].paraIndex }); j++; }
    }
    while (i < m) { out.push({ type: 'del', left: leftLines[i].text, leftParaIndex: leftLines[i].paraIndex }); i++; }
    while (j < n) { out.push({ type: 'add', right: rightLines[j].text, rightParaIndex: rightLines[j].paraIndex }); j++; }

  return out;
  }, [leftLines, rightLines]);

  // Build groups and notify parent
  const groups = useMemo<ChangeGroup[]>(() => {
    const g: ChangeGroup[] = [];
    let start = -1;
    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      const isChange = r.type !== 'equal';
      if (isChange && start === -1) start = idx;
      const atBoundary = (!isChange && start !== -1) || (isChange && idx === rows.length - 1);
      if (atBoundary) {
        const end = (!isChange && start !== -1) ? idx - 1 : (idx === rows.length - 1 ? idx : idx - 1);
        const slice = rows.slice(start, end + 1);
        const kinds = new Set(slice.map(s => s.type));
        const kind: 'add' | 'del' | 'replace' = kinds.size === 1 ? (kinds.has('add') ? 'add' : 'del') : 'replace';
        const leftParaIndices = slice.map(s => s.leftParaIndex).filter((v): v is number => Number.isFinite(v));
        const rightParaIndices = slice.map(s => s.rightParaIndex).filter((v): v is number => Number.isFinite(v));
        // find previous equal row for insertion anchor
        let prevEqualLeft: number | undefined;
        for (let p = start - 1; p >= 0; p--) { if (rows[p].type === 'equal' && Number.isFinite(rows[p].leftParaIndex)) { prevEqualLeft = rows[p].leftParaIndex!; break; } }
        g.push({ kind, startRow: start, endRow: end, leftParaIndices, rightParaIndices, prevEqualLeftParaIndex: prevEqualLeft });
        start = -1;
      }
    }
    return g;
  }, [rows]);

  useEffect(() => { onReady({ rows, groups }); }, [rows, groups, onReady]);

  const wordSegs = (a = '', b = ''): Array<{ t: 'same' | 'add' | 'del'; text: string }> => {
    const aw = a.split(/(\s+)/).filter(s => s.length > 0);
    const bw = b.split(/(\s+)/).filter(s => s.length > 0);
    const dp: number[][] = Array(aw.length + 1).fill(0).map(() => Array(bw.length + 1).fill(0));
    for (let i = aw.length - 1; i >= 0; i--) {
      for (let j = bw.length - 1; j >= 0; j--) {
        dp[i][j] = aw[i] === bw[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out: Array<{ t: 'same' | 'add' | 'del'; text: string }> = [];
    let i = 0, j = 0;
    while (i < aw.length && j < bw.length) {
      if (aw[i] === bw[j]) { out.push({ t: 'same', text: aw[i++] }); j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: 'del', text: aw[i++] }); }
      else { out.push({ t: 'add', text: bw[j++] }); }
    }
    while (i < aw.length) out.push({ t: 'del', text: aw[i++] });
    while (j < bw.length) out.push({ t: 'add', text: bw[j++] });
    return out;
  };

  // Render two synced columns with placeholders for alignment
  return (
    <div className="grid grid-cols-2 h-[calc(80vh-210px)]">
      <div ref={leftWrapRef} className="h-[calc(80vh-210px)] overflow-auto bg-white dark:bg-slate-900 p-0">
        <table className="w-full text-sm font-mono">
          <tbody className="text-gray-900 dark:text-gray-100">
            {rows.map((r, idx) => {
              const next = rows[idx + 1];
              const isReplacePair = r.type==='del' && next?.type==='add';
              return (
              <tr key={idx} className={`${r.type==='equal' ? '' : r.type==='del' ? 'bg-red-50 dark:bg-red-900/30' : r.type==='add' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-amber-50 dark:bg-amber-900/30'} ${idx>=groups[currentIdx]?.startRow && idx<=groups[currentIdx]?.endRow ? 'ring-1 ring-sky-300 dark:ring-sky-700' : ''}`}>
                <td className="w-12 select-none text-right pr-3 align-top text-xs text-gray-400 dark:text-gray-500">{r.type==='add' ? '' : idx+1}</td>
                <td className="px-3 py-1 whitespace-pre-wrap align-top">
                  {isReplacePair ? (
                    wordSegs(r.left, next.right).map((s, i) => (
                      <span key={i} className={s.t==='del' ? 'bg-red-200/70 dark:bg-red-700/40' : ''}>{s.text}</span>
                    ))
                  ) : (
                    r.left ?? ''
                  )}
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <div ref={rightWrapRef} className="h-[calc(80vh-210px)] overflow-auto border-l border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 p-0">
        <table className="w-full text-sm font-mono">
          <tbody className="text-gray-900 dark:text-gray-100">
            {rows.map((r, idx) => {
              const prev = rows[idx - 1];
              const isReplacePair = prev?.type==='del' && r.type==='add';
              return (
              <tr key={idx} className={`${r.type==='equal' ? '' : r.type==='del' ? 'bg-red-50 dark:bg-red-900/30' : r.type==='add' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-amber-50 dark:bg-amber-900/30'} ${idx>=groups[currentIdx]?.startRow && idx<=groups[currentIdx]?.endRow ? 'ring-1 ring-sky-300 dark:ring-sky-700' : ''}`}>
                <td className="w-12 select-none text-right pr-3 align-top text-xs text-gray-400 dark:text-gray-500">{r.type==='del' ? '' : idx+1}</td>
                <td className="px-3 py-1 whitespace-pre-wrap align-top">
                  {isReplacePair ? (
                    wordSegs(prev.left, r.right).map((s, i) => (
                      <span key={i} className={s.t==='add' ? 'bg-green-200/70 dark:bg-green-700/40' : ''}>{s.text}</span>
                    ))
                  ) : (
                    r.right ?? ''
                  )}
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
};
