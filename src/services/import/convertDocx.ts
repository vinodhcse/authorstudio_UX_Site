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
import { SceneDividerExtension } from '../../extensions/SceneDividerExtension';
import { v4 as uuidv4 } from 'uuid';

// Include custom SceneDivider so TipTap parses our divider markup
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

export interface ConvertedChapter {
  title: string;
  content: any; // TipTap JSON
}

export async function convertDocxToChapters(arrayBuffer: ArrayBuffer): Promise<ConvertedChapter[]> {
  // Convert DOCX to HTML via mammoth (browser build)
  console.log('Converting DOCX to HTML, size:', arrayBuffer.byteLength);
  let html = '';
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer }, {
      styleMap: [
        'b => strong',
        'i => em',
        'u => underline',
        'p[style-name="Quote"] => blockquote',
      ],
    } as any);
    html = result.value || '';
  } catch (e1) {
    console.warn('[import] mammoth.convertToHtml failed (pass 1). Retrying with image/table stripping...', e1);
    try {
      const transforms: any = (mammoth as any).transforms;
      const stripElements = transforms && transforms.element
        ? transforms.element(function (el: any) {
            if (!el) return el;
            if (el.type === 'image' || el.type === 'table' || el.type === 'footnote' || el.type === 'endnote' || el.type === 'noteReference') {
              return [];
            }
            return el;
          })
        : undefined;
      const result2 = await mammoth.convertToHtml({ arrayBuffer }, {
        styleMap: [
          'b => strong',
          'i => em',
          'u => underline',
          'p[style-name="Quote"] => blockquote',
        ],
        ...(stripElements ? { transformDocument: stripElements } : {}),
      } as any);
      html = result2.value || '';
    } catch (e2) {
      console.warn('[import] mammoth.convertToHtml failed (pass 2). Falling back to raw text...', e2);
      const raw = await mammoth.extractRawText({ arrayBuffer }).catch(() => ({ value: '' } as any));
      const text = (raw as any)?.value || '';
      const safeContent = generateJSON(`<p>${escapeHtml(text)}</p>`, baseExtensions);
      return text.trim().length ? [{ title: 'Imported Document', content: safeContent }] : [];
    }
  }

  console.log('Mammoth conversion completed, HTML length:', html.length);
  // No HTML markers. We'll convert to TipTap JSON and then replace pattern paragraphs with sceneDivider nodes.

  // Split chapters by H1/H2 headings; keep title
  const segments: { title: string; bodyHtml: string }[] = [];
  const temp = document.createElement('div');
  temp.innerHTML = html;
  let capturing = false;
  let currentTitle: string | null = null;
  let currentBodyParts: string[] = [];
  const isChapterHeading = (el: HTMLElement) => {
    const tag = el.tagName.toLowerCase();
    const txt = (el.textContent || '').trim();
    if (!txt) return false;
    if (tag === 'h1') return true;
    if (tag === 'h2') {
      const upper = txt.toUpperCase();
      return /^(CHAPTER\b|PROLOGUE\b|EPILOGUE\b|PART\b)/.test(upper);
    }
    return false;
  };
  const childNodes = Array.from(temp.childNodes);
  for (const node of childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (isChapterHeading(el)) {
        if (capturing && currentTitle && currentBodyParts.length) {
          const bodyHtml = currentBodyParts.join('');
          if (hasMeaningfulText(bodyHtml)) segments.push({ title: currentTitle, bodyHtml });
        }
        capturing = true;
        currentTitle = (el.textContent || '').trim() || 'Untitled Chapter';
        currentBodyParts = [];
        continue;
      }
    }
    if (capturing) {
      const htmlPart = (node as HTMLElement).outerHTML || node.textContent || '';
      currentBodyParts.push(htmlPart);
    }
  }
  if (capturing && currentTitle && currentBodyParts.length) {
    const bodyHtml = currentBodyParts.join('');
    if (hasMeaningfulText(bodyHtml)) segments.push({ title: currentTitle, bodyHtml });
  }
  if (segments.length === 0 && hasMeaningfulText(html)) {
    segments.push({ title: 'Imported Document', bodyHtml: html });
  }

  const isDividerPara = (txt: string) => {
    const s = (txt || '').replace(/[\s\u200B]+/g, '').trim();
    return s === '***' || s === '•••' || s === '■■■' || s === '———' || s === '*•*' || s === '—•—';
  };

  const chapters: ConvertedChapter[] = segments.map(seg => {
    try {
      // First, plain JSON from HTML
      const raw = generateJSON(seg.bodyHtml, baseExtensions);
      // Then, scan its content and replace any divider-style paragraphs with sceneDivider nodes
      if (raw && Array.isArray((raw as any).content)) {
        const out: any[] = [];
        for (const node of (raw as any).content) {
          if (node?.type === 'paragraph') {
            const txt = collectText(node);
            if (isDividerPara(txt)) {
              out.push({ type: 'sceneDivider', attrs: { id: uuidv4() } });
              continue;
            }
          }
          out.push(node);
        }
        (raw as any).content = out;
      }
      return { title: seg.title, content: raw };
    } catch (segErr) {
      console.warn('[import] Failed to convert segment to TipTap JSON, falling back to plain paragraph', segErr);
      const textOnly = stripHtml(seg.bodyHtml).trim();
      return {
        title: seg.title,
        content: generateJSON(`<p>${escapeHtml(textOnly)}</p>`, baseExtensions),
      };
    }
  });

  return chapters;
}

// Helpers
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hasMeaningfulText(html: string): boolean {
  // Ignore content that is only whitespace/images/hr
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  // Remove common non-textual nodes
  tmp.querySelectorAll('img, figure, hr, br').forEach(n => n.parentElement?.removeChild(n));
  const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
  return text.length > 20; // threshold to skip metadata/title pages
}

// Collect text content from a TipTap paragraph-like node
function collectText(node: any): string {
  try {
    const texts: string[] = [];
    const walk = (n: any) => {
      if (!n) return;
      if (n.type === 'text' && typeof n.text === 'string') texts.push(n.text);
      const content = Array.isArray(n.content) ? n.content : [];
      for (const c of content) walk(c);
    };
    walk(node);
    return texts.join(' ');
  } catch {
    return '';
  }
}
