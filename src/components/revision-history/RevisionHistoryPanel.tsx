import React, { useState, useEffect, useCallback } from 'react';
import { ChapterRevisionManager } from '../../services/ChapterRevisionManager';
import { ChapterRevision } from '../../types/chapterRevisionTypes';
import { RevisionTimeline } from './RevisionTimeline';
import { DiffViewer } from './DiffViewer';
import { toast } from '../../hooks/use-toast';

interface RevisionHistoryPanelProps {
  chapterId?: string;
  onRestoreRevision?: (revisionId: string) => void;
  className?: string;
}

interface RevisionHistoryState {
  revisions: ChapterRevision[];
  selectedRevision: ChapterRevision | null;
  compareRevision: ChapterRevision | null;
  isLoading: boolean;
  error: string | null;
}

export const RevisionHistoryPanel: React.FC<RevisionHistoryPanelProps> = ({
  chapterId,
  onRestoreRevision,
  className = ''
}) => {
  const [state, setState] = useState<RevisionHistoryState>({
    revisions: [],
    selectedRevision: null,
    compareRevision: null,
    isLoading: false,
    error: null
  });

  const revisionManager = ChapterRevisionManager.getInstance();

  // Load revisions for the current chapter
  const loadRevisions = useCallback(async () => {
    if (!chapterId) {
      setState(prev => ({ ...prev, revisions: [], selectedRevision: null, compareRevision: null }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const revisions = await revisionManager.getRevisionHistory(chapterId);
      setState(prev => ({
        ...prev,
        revisions,
        isLoading: false,
        // Auto-select the latest revision if none selected
        selectedRevision: prev.selectedRevision || (revisions.length > 0 ? revisions[0] : null)
      }));
    } catch (error) {
      console.error('Failed to load revisions:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load revisions',
        isLoading: false
      }));
    }
  }, [chapterId, revisionManager]);

  // Load revisions when chapter changes
  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  // Listen for new revisions being created
  useEffect(() => {
    const handleNewRevision = () => {
      if (chapterId) {
        loadRevisions();
      }
    };

    const handleRevisionError = (event: CustomEvent) => {
      const { error } = event.detail;
      setState(prev => ({
        ...prev,
        error: `Revision error: ${error.message || error}`
      }));
    };

    window.addEventListener('chapterRevisionAutoSave', handleNewRevision);
    window.addEventListener('chapterRevisionMajorCommit', handleNewRevision);
    window.addEventListener('chapterRevisionError', handleRevisionError as any);

    return () => {
      window.removeEventListener('chapterRevisionAutoSave', handleNewRevision);
      window.removeEventListener('chapterRevisionMajorCommit', handleNewRevision);
      window.removeEventListener('chapterRevisionError', handleRevisionError as any);
    };
  }, [chapterId, loadRevisions]);

  // Handle revision selection
  const handleSelectRevision = (revision: ChapterRevision) => {
    setState(prev => ({ ...prev, selectedRevision: revision }));
  };

  // Handle revision comparison
  const handleCompareRevision = (revision: ChapterRevision) => {
    setState(prev => ({ ...prev, compareRevision: revision }));
  };

  // Handle revision restoration
  const handleRestoreRevision = async (revision: ChapterRevision) => {
    if (!chapterId) return;

    try {
      await revisionManager.restoreToRevision(chapterId, revision.rev_id);
      
      toast({
        title: "Revision Restored",
        description: `Successfully restored to revision from ${new Date(revision.timestamp).toLocaleString()}`,
        variant: "default",
      });

      // Notify parent component
      if (onRestoreRevision) {
        onRestoreRevision(revision.rev_id);
      }

      // Reload revisions to reflect the restoration
      await loadRevisions();
    } catch (error) {
      console.error('Failed to restore revision:', error);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Failed to restore revision",
        variant: "destructive",
      });
    }
  };

  // Clear comparison
  const handleClearComparison = () => {
    setState(prev => ({ ...prev, compareRevision: null }));
  };

  if (!chapterId) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-600 dark:text-gray-400">
            Select a chapter to view revision history
          </p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2 text-red-500">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading revisions</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{state.error}</p>
          <button
            onClick={loadRevisions}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Left Panel - Revision Timeline */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Revision History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {state.revisions.length} revision{state.revisions.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <RevisionTimeline
          revisions={state.revisions}
          selectedRevision={state.selectedRevision}
          compareRevision={state.compareRevision}
          isLoading={state.isLoading}
          onSelectRevision={handleSelectRevision}
          onCompareRevision={handleCompareRevision}
          onRestoreRevision={handleRestoreRevision}
        />
      </div>

      {/* Right Panel - Diff Viewer */}
      <div className="flex-1 flex flex-col">
        {state.compareRevision ? (
          <DiffViewer
            revisionA={state.selectedRevision}
            revisionB={state.compareRevision}
            onClearComparison={handleClearComparison}
          />
        ) : state.selectedRevision ? (
          <div className="flex-1 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Revision Details
              </h4>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(state.selectedRevision.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    state.selectedRevision.is_minor 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {state.selectedRevision.is_minor ? 'Auto-save' : 'Major'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Words:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {state.selectedRevision.word_count || 0}
                  </span>
                </div>
              </div>
              
              {state.selectedRevision.message && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Message:</span>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {state.selectedRevision.message}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select another revision to compare changes
              </p>
              <button
                onClick={() => handleRestoreRevision(state.selectedRevision!)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Restore This Revision
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-400">
              Select a revision to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
