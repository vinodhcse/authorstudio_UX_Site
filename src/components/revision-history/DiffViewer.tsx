import React, { useMemo } from 'react';
import { ChapterRevision } from '../../types/chapterRevisionTypes';
import { ChapterRevisionManager } from '../../services/ChapterRevisionManager';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DiffViewerProps {
  revisionA: ChapterRevision | null;
  revisionB: ChapterRevision | null;
  onClearComparison: () => void;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  revisionA,
  revisionB,
  onClearComparison
}) => {
  const revisionManager = ChapterRevisionManager.getInstance();

  // Extract text content from TipTap JSON
  const extractTextContent = (revision: ChapterRevision | null): string => {
    if (!revision?.snapshot?.content) return '';
    
    return revisionManager.extractTextFromDoc(revision.snapshot);
  };

  // Calculate diff between two revisions
  const diffResult = useMemo(() => {
    if (!revisionA || !revisionB) return [];

    const textA = extractTextContent(revisionA);
    const textB = extractTextContent(revisionB);

    // Simple line-by-line diff
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');

    const diff: DiffLine[] = [];
    let aIndex = 0;
    let bIndex = 0;

    while (aIndex < linesA.length || bIndex < linesB.length) {
      const lineA = linesA[aIndex];
      const lineB = linesB[bIndex];

      if (aIndex >= linesA.length) {
        // Only B lines left (additions)
        diff.push({ type: 'added', content: lineB, lineNumber: bIndex + 1 });
        bIndex++;
      } else if (bIndex >= linesB.length) {
        // Only A lines left (removals)
        diff.push({ type: 'removed', content: lineA, lineNumber: aIndex + 1 });
        aIndex++;
      } else if (lineA === lineB) {
        // Lines match
        diff.push({ type: 'unchanged', content: lineA, lineNumber: aIndex + 1 });
        aIndex++;
        bIndex++;
      } else {
        // Lines differ - simple heuristic: check if next lines match
        const nextAIndex = linesA.findIndex((line, idx) => idx > aIndex && line === lineB);
        const nextBIndex = linesB.findIndex((line, idx) => idx > bIndex && line === lineA);

        if (nextAIndex !== -1 && (nextBIndex === -1 || nextAIndex - aIndex <= nextBIndex - bIndex)) {
          // Looks like lines were removed from A
          for (let i = aIndex; i < nextAIndex; i++) {
            diff.push({ type: 'removed', content: linesA[i], lineNumber: i + 1 });
          }
          diff.push({ type: 'unchanged', content: lineB, lineNumber: bIndex + 1 });
          aIndex = nextAIndex + 1;
          bIndex++;
        } else if (nextBIndex !== -1) {
          // Looks like lines were added to B
          for (let i = bIndex; i < nextBIndex; i++) {
            diff.push({ type: 'added', content: linesB[i], lineNumber: i + 1 });
          }
          diff.push({ type: 'unchanged', content: lineA, lineNumber: aIndex + 1 });
          bIndex = nextBIndex + 1;
          aIndex++;
        } else {
          // Lines are different - treat as replacement
          diff.push({ type: 'removed', content: lineA, lineNumber: aIndex + 1 });
          diff.push({ type: 'added', content: lineB, lineNumber: bIndex + 1 });
          aIndex++;
          bIndex++;
        }
      }
    }

    return diff;
  }, [revisionA, revisionB, revisionManager]);

  if (!revisionA || !revisionB) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          Select two revisions to compare
        </p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Comparing Revisions
            </h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded bg-red-200" />
                <span>Removed</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded bg-green-200" />
                <span>Added</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClearComparison}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Revision info */}
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-white dark:bg-gray-900 rounded border">
            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Revision A (Older)
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {formatTimestamp(revisionA.timestamp)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {revisionA.word_count} words • {revisionA.is_minor ? 'Auto-save' : 'Major'}
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-gray-900 rounded border">
            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Revision B (Newer)
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {formatTimestamp(revisionB.timestamp)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {revisionB.word_count} words • {revisionB.is_minor ? 'Auto-save' : 'Major'}
            </div>
          </div>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {diffResult.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No differences found between these revisions
              </p>
            </div>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {diffResult.map((line, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    line.type === 'added'
                      ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                      : line.type === 'removed'
                      ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                      : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <span className={`text-xs w-8 text-right ${
                      line.type === 'added' ? 'text-green-600' : 
                      line.type === 'removed' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {line.lineNumber || ''}
                    </span>
                    <span className={`text-xs w-4 ${
                      line.type === 'added' ? 'text-green-600' : 
                      line.type === 'removed' ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    <span className={`flex-1 whitespace-pre-wrap ${
                      line.type === 'added' ? 'text-green-800 dark:text-green-200' : 
                      line.type === 'removed' ? 'text-red-800 dark:text-red-200' : 
                      'text-gray-800 dark:text-gray-200'
                    }`}>
                      {line.content || ' '}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
