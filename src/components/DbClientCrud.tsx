import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';
import { useAuthStore } from '../auth/useAuthStore';

interface DbClientProps {
  open: boolean;
  onClose: () => void;
}

interface CrudSection {
  title: string;
  table: string;
  items: any[];
  loading: boolean;
  newItem: any;
}

const DbClientCrud: React.FC<DbClientProps> = ({ open, onClose }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'userKeys' | 'session' | 'books' | 'versions'>('session');
  
  const [sections, setSections] = useState<Record<string, CrudSection>>({
    userKeys: {
      title: 'User Keys',
      table: 'user_keys',
      items: [],
      loading: false,
      newItem: { user_id: user?.id || '', kdf_iters: 100000 }
    },
    session: {
      title: 'Session',
      table: 'session',
      items: [],
      loading: false,
      newItem: { user_id: user?.id || '', email: user?.email || '', session_state: 'active' }
    },
    books: {
      title: 'Books',
      table: 'book',
      items: [],
      loading: false,
      newItem: { 
        owner_user_id: user?.id || '',
        title: 'New Book',
        is_shared: 0,
        sync_state: 'idle',
        conflict_state: 'none',
        is_authored: 1,
        is_editable: 1,
        access_role: 'author'
      }
    },
    versions: {
      title: 'Versions',
      table: 'version',
      items: [],
      loading: false,
      newItem: {
        book_id: '',
        owner_user_id: user?.id || '',
        title: 'Version 1',
        is_current: 1,
        sync_state: 'idle',
        conflict_state: 'none'
      }
    }
  });

  const [error, setError] = useState<string | null>(null);

  // Load data for a specific section
  const loadData = async (sectionKey: string) => {
    try {
      setSections(prev => ({
        ...prev,
        [sectionKey]: { ...prev[sectionKey], loading: true }
      }));

      let data: any[] = [];
      
      switch (sectionKey) {
        case 'userKeys':
          if (user?.id) {
            const result = await invoke<any>('user_keys_get', { userId: user.id });
            data = result ? [result] : [];
          }
          break;
        case 'session':
          const sessionResult = await invoke<any>('session_get');
          data = sessionResult ? [sessionResult] : [];
          break;
        case 'books':
          if (user?.id) {
            data = await invoke<any[]>('book_get_by_user', { ownerUserId: user.id });
          }
          break;
        case 'versions':
          data = await invoke<any[]>('surreal_query', {
            query: 'SELECT * FROM version ORDER BY updated_at DESC LIMIT 50'
          });
          break;
      }

      setSections(prev => ({
        ...prev,
        [sectionKey]: { ...prev[sectionKey], items: data || [], loading: false }
      }));
      setError(null);
    } catch (err) {
      setError(`Failed to load ${sectionKey}: ${err}`);
      setSections(prev => ({
        ...prev,
        [sectionKey]: { ...prev[sectionKey], loading: false }
      }));
    }
  };

  // Create new item
  const createItem = async (sectionKey: string) => {
    try {
      const section = sections[sectionKey];
      
      switch (sectionKey) {
        case 'userKeys':
          await invoke('user_keys_upsert', { row: section.newItem });
          break;
        case 'session':
          await invoke('session_upsert', section.newItem);
          break;
        case 'books':
          const bookId = `book_${Date.now()}`;
          await invoke('book_create', { 
            row: { 
              ...section.newItem, 
              book_id: bookId,
              updated_at: Date.now()
            } 
          });
          break;
        case 'versions':
          const versionId = `version_${Date.now()}`;
          await invoke('version_create', { 
            row: { 
              ...section.newItem, 
              version_id: versionId,
              created_at: Date.now(),
              updated_at: Date.now()
            } 
          });
          break;
      }
      
      await loadData(sectionKey);
      appLog.info('db-client', `Created new ${sectionKey} item`);
    } catch (err) {
      setError(`Failed to create ${sectionKey}: ${err}`);
    }
  };

  // Delete item
  const deleteItem = async (sectionKey: string, item: any) => {
    try {
      switch (sectionKey) {
        case 'userKeys':
          await invoke('surreal_query', {
            query: 'DELETE user_keys WHERE user_id = $userId',
            vars: { userId: item.user_id }
          });
          break;
        case 'session':
          await invoke('session_clear');
          break;
        case 'books':
          await invoke('book_delete', { 
            bookId: item.book_id, 
            ownerUserId: item.owner_user_id 
          });
          break;
        case 'versions':
          await invoke('surreal_query', {
            query: 'DELETE version WHERE version_id = $versionId',
            vars: { versionId: item.version_id }
          });
          break;
      }
      
      await loadData(sectionKey);
      appLog.info('db-client', `Deleted ${sectionKey} item`);
    } catch (err) {
      setError(`Failed to delete ${sectionKey}: ${err}`);
    }
  };

  // Update new item form data
  const updateNewItem = (sectionKey: string, field: string, value: any) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        newItem: { ...prev[sectionKey].newItem, [field]: value }
      }
    }));
  };

  // Load data when tab changes
  useEffect(() => {
    if (open) {
      loadData(activeTab);
    }
  }, [activeTab, open, user?.id]);

  if (!open) return null;

  const currentSection = sections[activeTab];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Database CRUD Operations</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          {Object.entries(sections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 font-medium ${
                activeTab === key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Create New Item Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-3">Create New {currentSection.title}</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(currentSection.newItem).map(([field, value]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  {field.includes('_at') || field === 'kdf_iters' || field.startsWith('is_') ? (
                    <input
                      type="number"
                      value={Number(value) || 0}
                      onChange={(e) => updateNewItem(activeTab, field, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(value || '')}
                      onChange={(e) => updateNewItem(activeTab, field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => createItem(activeTab)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create {currentSection.title}
            </button>
          </div>

          {/* Items List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Existing {currentSection.title} ({currentSection.items.length})</h3>
              <button
                onClick={() => loadData(activeTab)}
                disabled={currentSection.loading}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {currentSection.loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {currentSection.loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : currentSection.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No {currentSection.title.toLowerCase()} found</div>
            ) : (
              <div className="space-y-2">
                {currentSection.items.map((item, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {Object.entries(item).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium text-gray-600">{key}:</span>
                              <span className="ml-2">
                                {value === null ? 'null' : 
                                 typeof value === 'object' ? JSON.stringify(value).slice(0, 50) + '...' :
                                 String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(activeTab, item)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DbClientCrud;
