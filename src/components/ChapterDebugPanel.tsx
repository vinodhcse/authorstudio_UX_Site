import React, { useState, useEffect } from 'react';
import { useChapters } from '../hooks/useChapters';
import { useBookContext, useCurrentBookAndVersion } from '../contexts/BookContext';
import { diagnoseDatabaseState } from '../data/diagnostics';
import { getVersion as getVersionFromDAL } from '../data/dal';
import { appLog } from '../auth/fileLogger';
import { useAuthStore } from '../auth/useAuthStore';
import { Chapter } from '../types';
import { forceSyncDirtyChapters, checkDirtyChapters } from '../utils/chapterSync';

interface ChapterDebugPanelProps {
  className?: string;
}

export const ChapterDebugPanel: React.FC<ChapterDebugPanelProps> = ({ className = '' }) => {
  const { bookId, versionId } = useCurrentBookAndVersion();
  const { getChaptersByVersion, getVersion } = useBookContext();
  const { 
    chapters, 
    createChapter, 
    isLoading, 
    error 
  } = useChapters(bookId, versionId); // Pass bookId and versionId parameters!
  
  const [testTitle, setTestTitle] = useState('Debug Test Chapter');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [dbChapters, setDbChapters] = useState<any[]>([]);
  const [versionData, setVersionData] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    appLog.info('chapter-debug', message);
  };

  // Check database state
  const checkDatabaseState = async () => {
    try {
      addLog('Running database diagnostics...');
      await diagnoseDatabaseState();
      addLog('Database diagnostics completed - check console');
    } catch (error) {
      addLog(`Database diagnostics failed: ${error}`);
    }
  };

  // Check chapters from BookContext
  const checkBookContextChapters = async () => {
    if (!bookId || !versionId) {
      addLog('No book/version ID available');
      return;
    }

    try {
      addLog(`Fetching chapters from BookContext for book ${bookId}, version ${versionId}`);
      const chapters = await getChaptersByVersion(bookId, versionId);
      setDbChapters(chapters);
      addLog(`Found ${chapters.length} chapters in BookContext`);
    } catch (error) {
      addLog(`Error fetching chapters: ${error}`);
    }
  };

  // Check version data
  const checkVersionData = async () => {
    if (!versionId || !bookId) {
      addLog('No book/version ID available');
      return;
    }

    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        addLog('User not authenticated');
        return;
      }

      addLog(`Fetching version data for ${versionId}`);
      const version = await getVersionFromDAL(versionId, user.id);
      setVersionData(version);
      
      // Parse content_data if it exists
      let contentData = null;
      if (version?.content_data) {
        try {
          contentData = typeof version.content_data === 'string' 
            ? JSON.parse(version.content_data) 
            : version.content_data;
        } catch (error) {
          addLog(`Error parsing content_data: ${error}`);
        }
      }
      
      addLog(`Version data fetched - has ${contentData?.chapters?.length || 0} chapters in content_data`);
    } catch (error) {
      addLog(`Error fetching version: ${error}`);
    }
  };

  // Create test chapter
  const createTestChapter = async () => {
    if (!testTitle.trim()) {
      addLog('Please enter a chapter title');
      return;
    }

    try {
      const { user } = useAuthStore.getState();
      addLog(`Creating chapter: "${testTitle}"`);
      addLog(`Book ID: ${bookId}, Version ID: ${versionId}`);
      addLog(`User authenticated: ${!!user}, User ID: ${user?.id || 'none'}`);
      
      if (!bookId) {
        addLog('ERROR: No book ID available');
        return;
      }
      
      if (!user?.id) {
        addLog('ERROR: User not authenticated or no user ID');
        return;
      }
      
      const newChapter = await createChapter(testTitle);
      if (newChapter) {
        addLog(`Chapter created successfully with ID: ${newChapter.id}`);
      } else {
        addLog('Chapter creation returned null - check console for errors');
      }
      
      // Check if it appears in BookContext immediately
      setTimeout(async () => {
        await checkBookContextChapters();
        await checkVersionData();
      }, 100);
      
    } catch (error) {
      addLog(`Error creating chapter: ${error}`);
    }
  };

  // Setup event listeners
  useEffect(() => {
    const handleChapterEvent = (event: CustomEvent) => {
      addLog(`Event received: ${event.type} - ${JSON.stringify(event.detail)}`);
    };

    window.addEventListener('chapterCreated', handleChapterEvent as EventListener);
    window.addEventListener('chapterUpdated', handleChapterEvent as EventListener);
    window.addEventListener('chapterDeleted', handleChapterEvent as EventListener);

    return () => {
      window.removeEventListener('chapterCreated', handleChapterEvent as EventListener);
      window.removeEventListener('chapterUpdated', handleChapterEvent as EventListener);
      window.removeEventListener('chapterDeleted', handleChapterEvent as EventListener);
    };
  }, []);

  return (
    <div className={`bg-gray-800 text-white p-4 rounded-lg space-y-4 ${className}`}>
      <h3 className="text-lg font-bold text-yellow-400">Chapter Debug Panel</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Control Panel */}
        <div className="space-y-3">
          <h4 className="font-semibold text-blue-300">Controls</h4>
          
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Chapter title"
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
            <button
              onClick={createTestChapter}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
            >
              {isLoading ? 'Creating...' : 'Create Test Chapter'}
            </button>
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={checkDatabaseState}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
            >
              Check Database
            </button>
            <button
              onClick={checkBookContextChapters}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
            >
              Check BookContext Chapters
            </button>
            <button
              onClick={checkVersionData}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded"
            >
              Check Version Data
            </button>
            <button
              onClick={async () => {
                addLog('Checking for dirty chapters...');
                const dirtyStatus = await checkDirtyChapters();
                addLog(`Found ${dirtyStatus.count} dirty chapters: ${dirtyStatus.chapters.map(ch => ch.title).join(', ')}`);
                
                if (dirtyStatus.count > 0) {
                  addLog('Force syncing dirty chapters...');
                  const syncResult = await forceSyncDirtyChapters();
                  addLog(`Sync completed: ${syncResult.synced} synced, ${syncResult.failed} failed`);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            >
              Force Sync Dirty Chapters
            </button>
          </div>
        </div>

        {/* Status Panel */}
        <div className="space-y-3">
          <h4 className="font-semibold text-green-300">Status</h4>
          
          <div className="text-sm space-y-1">
            <div>Book ID: <span className="text-cyan-300">{bookId || 'None'}</span></div>
            <div>Version ID: <span className="text-cyan-300">{versionId || 'None'}</span></div>
            <div>useChapters count: <span className="text-cyan-300">{chapters.length}</span></div>
            <div>BookContext count: <span className="text-cyan-300">{dbChapters.length}</span></div>
            <div>Loading: <span className="text-cyan-300">{isLoading ? 'Yes' : 'No'}</span></div>
            <div>Error: <span className="text-red-300">{error || 'None'}</span></div>
          </div>

          {versionData && (
            <div className="text-xs">
              <div className="text-gray-400">Version chapters:</div>
              <pre className="text-cyan-300 bg-gray-900 p-2 rounded max-h-32 overflow-y-auto">
                {JSON.stringify(versionData.chapters || [], null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Debug Logs */}
      <div>
        <h4 className="font-semibold text-red-300 mb-2">Debug Logs</h4>
        <div className="bg-black p-3 rounded max-h-48 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="text-sm text-gray-300 font-mono">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chapter Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-purple-300 mb-2">useChapters ({chapters.length})</h4>
          <div className="bg-gray-900 p-2 rounded max-h-32 overflow-y-auto">
            {chapters.map(ch => (
              <div key={ch.id} className="text-xs text-gray-300 border-b border-gray-700 py-1">
                <span className="text-yellow-300">{ch.title}</span> - {ch.id}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-green-300 mb-2">BookContext ({dbChapters.length})</h4>
          <div className="bg-gray-900 p-2 rounded max-h-32 overflow-y-auto">
            {dbChapters.map(ch => (
              <div key={ch.id} className="text-xs text-gray-300 border-b border-gray-700 py-1">
                <span className="text-yellow-300">{ch.title}</span> - {ch.id}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterDebugPanel;
