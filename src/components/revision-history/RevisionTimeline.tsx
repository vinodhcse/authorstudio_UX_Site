import React from 'react';
import { ChapterRevision } from '../../types/chapterRevisionTypes';
import { RevisionCard } from './RevisionCard';

interface RevisionTimelineProps {
  revisions: ChapterRevision[];
  selectedRevision: ChapterRevision | null;
  compareRevision: ChapterRevision | null;
  isLoading: boolean;
  onSelectRevision: (revision: ChapterRevision) => void;
  onCompareRevision: (revision: ChapterRevision) => void;
  onRestoreRevision: (revision: ChapterRevision) => void;
}

export const RevisionTimeline: React.FC<RevisionTimelineProps> = ({
  revisions,
  selectedRevision,
  compareRevision,
  isLoading,
  onSelectRevision,
  onCompareRevision,
  onRestoreRevision
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading revisions...</p>
        </div>
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-600 dark:text-gray-400">
            No revisions yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Start editing to create your first revision
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-2 p-2">
        {revisions.map((revision, index) => (
          <RevisionCard
            key={revision.rev_id}
            revision={revision}
            isSelected={selectedRevision?.rev_id === revision.rev_id}
            isCompared={compareRevision?.rev_id === revision.rev_id}
            isLatest={index === 0}
            onSelect={() => onSelectRevision(revision)}
            onCompare={() => onCompareRevision(revision)}
            onRestore={() => onRestoreRevision(revision)}
          />
        ))}
      </div>
    </div>
  );
};
