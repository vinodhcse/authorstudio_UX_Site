import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { RevisionHistoryPanel } from '../../components/revision-history';
import { useToolWindowStore } from '../../stores/toolWindowStore';

interface RevisionHistoryToolProps {
  // Props for standalone usage
  chapterId?: string;
  bookId?: string;
  versionId?: string;
}

const RevisionHistoryTool: React.FC<RevisionHistoryToolProps> = ({
  chapterId: propChapterId,
  bookId: propBookId,
  versionId: propVersionId
}) => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { currentBookId, currentVersionId } = useToolWindowStore();

  // Get IDs from props, URL params, or store
  const bookId = propBookId || params.bookId || currentBookId;
  const versionId = propVersionId || params.versionId || currentVersionId;
  const chapterId = propChapterId || searchParams.get('chapterId') || undefined;

  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>(chapterId);

  useEffect(() => {
    setSelectedChapterId(chapterId);
  }, [chapterId]);

  // Listen for chapter selection changes from other parts of the app
  useEffect(() => {
    const handleChapterSelection = (event: CustomEvent) => {
      const { chapterId: newChapterId } = event.detail;
      setSelectedChapterId(newChapterId);
    };

    window.addEventListener('chapterSelected', handleChapterSelection as any);
    return () => {
      window.removeEventListener('chapterSelected', handleChapterSelection as any);
    };
  }, []);

  const handleRestoreRevision = (revisionId: string) => {
    // Emit event to notify other components about revision restoration
    const event = new CustomEvent('revisionRestored', {
      detail: { revisionId, chapterId: selectedChapterId }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="h-12 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📝</span>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Revision History
          </h1>
        </div>
        
        {selectedChapterId && (
          <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
            Chapter: {selectedChapterId}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-3rem)]">
        <RevisionHistoryPanel
          chapterId={selectedChapterId}
          onRestoreRevision={handleRestoreRevision}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default RevisionHistoryTool;
