export type DiffHunk = {
  id: string;
  path: (string | number)[];
  kind: 'insert' | 'delete' | 'modify';
  leftSnippet?: any;
  rightSnippet?: any;
};

function idGen() { return `diff_${Math.random().toString(36).slice(2,8)}`; }

// Very lightweight structural diff: compares arrays of content nodes by index and type/text
export function diffTipTap(left: any, right: any): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const l = (left?.content as any[]) || [];
  const r = (right?.content as any[]) || [];
  const max = Math.max(l.length, r.length);
  for (let i = 0; i < max; i++) {
    const ln = l[i];
    const rn = r[i];
    if (ln && !rn) {
      hunks.push({ id: idGen(), path: ['content', i], kind: 'delete', leftSnippet: ln });
    } else if (!ln && rn) {
      hunks.push({ id: idGen(), path: ['content', i], kind: 'insert', rightSnippet: rn });
    } else if (ln && rn) {
      if (ln.type !== rn.type || JSON.stringify(ln.attrs) !== JSON.stringify(rn.attrs) || (ln.text || '') !== (rn.text || '')) {
        hunks.push({ id: idGen(), path: ['content', i], kind: 'modify', leftSnippet: ln, rightSnippet: rn });
      } else {
        // Recurse into child content
        if (ln.content || rn.content) {
          const child = diffTipTap({ content: ln.content || [] }, { content: rn.content || [] });
          child.forEach(h => hunks.push({ ...h, path: ['content', i, ...h.path] }));
        }
      }
    }
  }
  return hunks;
}


export function applyDiffHunk(base: any, hunk: DiffHunk): any {
  const path = hunk.path;
  const parentPath = path.slice(0, -1);
  const key = path[path.length - 1];
  // clone parent if needed for future granular ops; currently modify via rootCloned below
  const rootCloned = JSON.parse(JSON.stringify(base));
  // Navigate to parent in rootCloned
  let cursor = rootCloned;
  for (let i = 0; i < parentPath.length; i++) cursor = cursor[parentPath[i] as any] = Array.isArray(cursor[parentPath[i] as any]) ? [...cursor[parentPath[i] as any]] : { ...cursor[parentPath[i] as any] };

  if (hunk.kind === 'insert') {
    if (Array.isArray(cursor)) {
      (cursor as any[]).splice(key as number, 0, hunk.rightSnippet);
    } else if (Array.isArray(cursor[key as any])) {
      (cursor[key as any] as any[]).splice(0, 0, hunk.rightSnippet);
    } else {
      cursor[key as any] = hunk.rightSnippet;
    }
  } else if (hunk.kind === 'delete') {
    if (Array.isArray(cursor)) {
      (cursor as any[]).splice(key as number, 1);
    } else if (Array.isArray(cursor[key as any])) {
      (cursor[key as any] as any[]).splice(0, 1);
    } else {
      delete cursor[key as any];
    }
  } else if (hunk.kind === 'modify') {
    if (Array.isArray(cursor)) {
      (cursor as any[])[key as number] = hunk.rightSnippet;
    } else {
      cursor[key as any] = hunk.rightSnippet;
    }
  }
  return rootCloned;
}

export function applyAllDiffs(base: any, hunks: DiffHunk[]): any {
  return hunks.reduce((acc, h) => applyDiffHunk(acc, h), base);
}
