import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { appLog } from '../auth/fileLogger';
import { useAuthStore } from '../auth/useAuthStore';
import * as dal from '../data/dal'; // Import the new DAL

interface DbClientProps {
  open: boolean;
  onClose: () => void;
}

const DbClient: React.FC<DbClientProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [table, setTable] = useState('person');
  const [customQuery, setCustomQuery] = useState('SELECT * FROM person LIMIT 200');
  const [dalBooks, setDalBooks] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any>({});

  // Comprehensive Database Validation
  const validateAllDatabases = async () => {
    setError(null);
    setLoading(true);
    const results: any = {};

    try {
      // Get authenticated user information
      const authStore = useAuthStore.getState();
      const authenticatedUserId = authStore.user?.id;
      const userEmail = authStore.user?.email;
      
      // Use authenticated user ID or fallback
      const testUserId = authenticatedUserId || 'test_user_123';
      
      appLog.info('db-validation', 'Starting validation with user context', { 
        authenticatedUserId, 
        userEmail, 
        testUserId,
        isAuthenticated: authStore.isAuthenticated 
      });

      // Test 1: User Keys Validation
      appLog.info('db-validation', 'Testing user keys...');
      try {
        // Check if user keys exist
        const existingKeys = await dal.getUserKeys(testUserId);
        results.userKeys = {
          exists: !!existingKeys,
          data: existingKeys,
          status: existingKeys ? 'Found existing keys' : 'No keys found',
          userId: testUserId
        };

        // If no keys, create test keys
        if (!existingKeys) {
          const testKeys = {
            udekWrapAppkey: new Uint8Array([1, 2, 3, 4, 5]),
            kdfSalt: new Uint8Array([6, 7, 8, 9, 10]),
            kdfIters: 100000
          };
          await dal.setUserKeys(testUserId, testKeys);
          
          // Verify keys were saved
          const savedKeys = await dal.getUserKeys(testUserId);
          results.userKeys.created = !!savedKeys;
          results.userKeys.status = savedKeys ? 'Keys created and verified' : 'Failed to create keys';
        }
      } catch (err) {
        results.userKeys = { error: String(err), status: 'Failed' };
      }

      // Test 2: Session Data Validation
      appLog.info('db-validation', 'Testing session data...');
      try {
        let sessionData = null;
        if (userEmail) {
          sessionData = await invoke<any>('session_get_by_email', { email: userEmail });
        } else if (authenticatedUserId) {
          sessionData = await invoke<any>('session_get_by_user_id', { user_id: authenticatedUserId });
        } else {
          sessionData = await invoke<any>('session_get');
        }
        
        results.session = {
          exists: !!sessionData,
          data: sessionData,
          status: sessionData ? `Session found for ${userEmail || authenticatedUserId || 'current user'}` : 'No session data',
          authContext: { userEmail, authenticatedUserId, isAuthenticated: authStore.isAuthenticated }
        };
      } catch (err) {
        results.session = { error: String(err), status: 'Failed to retrieve session' };
      }

      // Test 3: Books Validation
      appLog.info('db-validation', 'Testing books...');
      try {
        const books = await dal.getUserBooks('test_user_123');
        results.books = {
          count: books.length,
          data: books,
          status: `Found ${books.length} books`
        };

        // Test book creation if no books exist
        if (books.length === 0) {
          const newBook = await dal.createBook('Validation Test Book', 'test_user_123');
          const updatedBooks = await dal.getUserBooks('test_user_123');
          results.books.created = !!newBook;
          results.books.count = updatedBooks.length;
          results.books.status = `Created test book, now have ${updatedBooks.length} books`;
        }
      } catch (err) {
        results.books = { error: String(err), status: 'Failed' };
      }

      // Test 4: Versions Validation  
      appLog.info('db-validation', 'Testing versions...');
      try {
        const books = await dal.getUserBooks('test_user_123');
        if (books.length > 0) {
          const versions = await dal.getVersionsByBook(books[0].book_id, 'test_user_123');
          results.versions = {
            count: versions.length,
            bookId: books[0].book_id,
            data: versions,
            status: `Found ${versions.length} versions for book ${books[0].title}`
          };

          // Create version if none exist
          if (versions.length === 0) {
            const newVersion = await dal.createVersion(books[0].book_id, 'Test Version', 'test_user_123');
            const updatedVersions = await dal.getVersionsByBook(books[0].book_id, 'test_user_123');
            results.versions.created = !!newVersion;
            results.versions.count = updatedVersions.length;
            results.versions.status = `Created test version, now have ${updatedVersions.length} versions`;
          }
        } else {
          results.versions = { status: 'No books available for version testing' };
        }
      } catch (err) {
        results.versions = { error: String(err), status: 'Failed' };
      }

      // Test 5: Chapters Validation
      appLog.info('db-validation', 'Testing chapters...');
      try {
        const books = await dal.getUserBooks('test_user_123');
        if (books.length > 0) {
          const versions = await dal.getVersionsByBook(books[0].book_id, 'test_user_123');
          if (versions.length > 0) {
            const chapters = await dal.getChaptersByVersion(books[0].book_id, versions[0].version_id, 'test_user_123');
            results.chapters = {
              count: chapters.length,
              bookId: books[0].book_id,
              versionId: versions[0].version_id,
              data: chapters,
              status: `Found ${chapters.length} chapters`
            };

            // Create chapter if none exist
            if (chapters.length === 0) {
              const newChapter = await dal.createChapter(books[0].book_id, versions[0].version_id, 'Test Chapter', 'test_user_123');
              const updatedChapters = await dal.getChaptersByVersion(books[0].book_id, versions[0].version_id, 'test_user_123');
              results.chapters.created = !!newChapter;
              results.chapters.count = updatedChapters.length;
              results.chapters.status = `Created test chapter, now have ${updatedChapters.length} chapters`;
            }
          } else {
            results.chapters = { status: 'No versions available for chapter testing' };
          }
        } else {
          results.chapters = { status: 'No books available for chapter testing' };
        }
      } catch (err) {
        results.chapters = { error: String(err), status: 'Failed' };
      }

      // Test 6: Asset System Validation
      appLog.info('db-validation', 'Testing asset system...');
      try {
        const assets = await invoke<any[]>('asset_list_all');
        const assetLinks = await invoke<any[]>('link_list_all');
        results.assets = {
          assetCount: assets.length,
          linkCount: assetLinks.length,
          assets: assets.slice(0, 5), // Show first 5 assets
          links: assetLinks.slice(0, 5), // Show first 5 links
          status: `Found ${assets.length} assets and ${assetLinks.length} links`
        };
      } catch (err) {
        results.assets = { error: String(err), status: 'Failed to retrieve assets' };
      }

      // Test 7: Database Schema Validation
      appLog.info('db-validation', 'Testing database schema...');
      try {
        const tables = await invoke<any>('surreal_query', { 
          query: 'INFO FOR DB;' 
        });
        results.schema = {
          data: tables,
          status: 'Schema information retrieved'
        };
      } catch (err) {
        results.schema = { error: String(err), status: 'Failed to get schema info' };
      }

      // Test 8: File System Validation
      appLog.info('db-validation', 'Testing file system...');
      try {
        const configDir = await invoke<string>('get_config_dir');
        results.fileSystem = {
          configDir,
          status: `Config directory: ${configDir}`
        };
      } catch (err) {
        results.fileSystem = { error: String(err), status: 'Failed to get config directory' };
      }

      setValidationResults(results);
      setRows([results]);
      appLog.info('db-validation', 'Validation completed', { results });

    } catch (err: any) {
      setError(String(err));
      appLog.error('db-validation', 'Validation failed', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  // DAL Test Functions
  const dalCreateBook = async () => {
    setError(null);
    setLoading(true);
    try {
      const book = await dal.createBook(`DAL Test Book ${Date.now()}`, 'test_user_123');
      appLog.info('dal-test', 'Created book via DAL', { book });
      setRows([book]);
      await dalGetBooks(); // Refresh the list
    } catch (err: any) {
      setError(String(err));
      appLog.error('dal-test', 'Failed to create book via DAL', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const dalGetBooks = async () => {
    setError(null);
    setLoading(true);
    try {
      const books = await dal.getUserBooks('test_user_123');
      setDalBooks(books);
      setRows(books);
      appLog.info('dal-test', 'Got books via DAL', { count: books.length });
    } catch (err: any) {
      setError(String(err));
      appLog.error('dal-test', 'Failed to get books via DAL', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const dalCreateVersion = async () => {
    if (dalBooks.length === 0) {
      setError('No books available. Create a book first.');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const book = dalBooks[0];
      const version = await dal.createVersion(book.book_id, `Version ${Date.now()}`, 'test_user_123');
      appLog.info('dal-test', 'Created version via DAL', { version });
      setRows([version]);
    } catch (err: any) {
      setError(String(err));
      appLog.error('dal-test', 'Failed to create version via DAL', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const dalCreateChapter = async () => {
    if (dalBooks.length === 0) {
      setError('No books available. Create a book first.');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const book = dalBooks[0];
      // First ensure there's a version
      const versions = await dal.getVersionsByBook(book.book_id, 'test_user_123');
      let version = versions.find(v => v.is_current === 1);
      
      if (!version) {
        version = await dal.createVersion(book.book_id, 'Draft', 'test_user_123');
      }
      
      const chapter = await dal.createChapter(book.book_id, version.version_id, `Chapter ${Date.now()}`, 'test_user_123');
      appLog.info('dal-test', 'Created chapter via DAL', { chapter });
      setRows([chapter]);
    } catch (err: any) {
      setError(String(err));
      appLog.error('dal-test', 'Failed to create chapter via DAL', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        appGetBooks(); // Trigger app books retrieval
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const runCustom = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('surreal_query', { query: customQuery });
      setRows(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Test Database Functions
  const testCreatePerson = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('test_create_person', {
        name: `Test Person ${Date.now()}`,
        age: Math.floor(Math.random() * 50) + 18
      });
      setRows([res]);
      appLog.info('db-client', 'Test person created', { result: res });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to create test person', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const testGetPeople = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('test_get_people');
      setRows(Array.isArray(res) ? res : []);
      appLog.info('db-client', 'Test people retrieved', { count: Array.isArray(res) ? res.length : 0 });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to get test people', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const testCreateBook = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('app_create_book', {
        title: `Test Book ${Date.now()}`,
        author: `Test Author ${Math.floor(Math.random() * 100)}`
      });
      setRows([res]);
      appLog.info('db-client', 'Test book created', { result: res });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to create test book', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const testGetBooks = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('app_get_books');
      setRows(Array.isArray(res) ? res : []);
      appLog.info('db-client', 'Test books retrieved', { count: Array.isArray(res) ? res.length : 0 });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to get test books', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const testDeleteAllPeople = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('test_delete_all_people');
      setRows([{ message: 'All test people deleted', result: res }]);
      appLog.info('db-client', 'All test people deleted', { result: res });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to delete test people', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const testDeleteAllBooks = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('test_delete_all_books');
      setRows([{ message: 'All test books deleted', result: res }]);
      appLog.info('db-client', 'All test books deleted', { result: res });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to delete test books', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };


  // App Database Test Functions
  const appCreateSession = async () => {
    setError(null);
    setLoading(true);
    try {
      const sessionData = {
        user_id: 'test_user_123',
        email: 'test@example.com',
        name: 'Test User',
      };
      const res = await invoke<any>('app_save_session', { session: sessionData });
      setRows([res]);
      appLog.info('db-client', 'App session created', { result: res });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to create app book', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const appGetAppSessions = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('app_get_session');
      setRows(Array.isArray(res) ? res : (res == null ? [] : [res]));
      appLog.info('db-client', 'App sessions retrieved', { count: Array.isArray(res) ? res.length : 0 });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to get app sessions', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  // App Database Test Functions
  const appCreateBook = async () => {
    setError(null);
    setLoading(true);
    try {
      const bookData = {
        title: `App Book ${Date.now()}`,
        subtitle: null,
        author: `App Author ${Math.floor(Math.random() * 100)}`,
        author_id: null,
        cover_image: null,
        last_modified: new Date().toISOString(),
        progress: 0.0,
        word_count: 0,
        genre: 'Fiction',
        subgenre: null,
        collaborator_count: 1,
        featured: false,
        book_type: 'Novel',
        prose: 'Standard',
        language: 'English',
        publisher: 'Self-Published',
        published_status: 'Unpublished',
        publisher_link: null,
        print_isbn: null,
        ebook_isbn: null,
        publisher_logo: null,
        synopsis: 'Test book synopsis',
        description: 'Test book description',
        is_shared: false,
        sync_state: 'idle',
        conflict_state: 'none',
        updated_at: Date.now(),
        book_genre: 'Fantasy',
      };
      const res = await invoke<any>('app_create_book', { book: bookData });
      setRows([res]);
      appLog.info('db-client', 'App book created', { result: res });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to create app book', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const appGetBooks = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('app_get_books');
      setRows(Array.isArray(res) ? res : []);
      appLog.info('db-client', 'App books retrieved', { count: Array.isArray(res) ? res.length : 0 });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to get app books', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const appDeleteAllBooks = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await invoke<any>('app_delete_all_data');
      setRows([{ message: 'All app data deleted', result: res }]);
      appLog.info('db-client', 'All app data deleted', { result: res });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to delete app data', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  // Main Database Test Functions
  const mainCreateBook = async () => {
    setError(null);
    setLoading(true);
    try {
      const bookId = `book_${Date.now()}`;
      const ownerUserId = 'test_user_123';
      const bookData = {
        book_id: bookId,
        owner_user_id: ownerUserId,
        title: `Main Book ${Date.now()}`,
        is_shared: 0,
        enc_metadata: null,
        enc_schema: null,
        rev_local: null,
        rev_cloud: null,
        sync_state: 'idle',
        conflict_state: 'none',
        last_local_change: Date.now(),
        last_cloud_change: null,
        updated_at: Date.now(),
      };
      const res = await invoke<any>('book_create', { row: bookData });
      setRows([{ message: 'Main book created', bookId, result: res }]);
      appLog.info('db-client', 'Main book created', { bookId, result: res });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to create main book', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const mainGetBooks = async () => {
    setError(null);
    setLoading(true);
    try {
      const ownerUserId = 'test_user_123';
      const res = await invoke<any>('book_get_by_user', { ownerUserId });
      setRows(Array.isArray(res) ? res : []);
      appLog.info('db-client', 'Main books retrieved', { count: Array.isArray(res) ? res.length : 0 });
    } catch (err: any) {
      setError(String(err));
      appLog.error('db-client', 'Failed to get main books', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Database Client</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="flex-1 p-4 grid grid-cols-4 gap-4">
          <div>
            <div className="mb-2 text-xs text-gray-500">Table</div>
            <select value={table} onChange={e => setTable(e.target.value)} className="w-full mb-4 p-2 border rounded text-sm">
              <option value="person">person</option>
              <option value="book">book</option>
              <option value="version">version</option>
              <option value="chapter">chapter</option>
              <option value="scene">scene</option>
            </select>

            <div className="mb-2 mt-4 text-xs text-gray-500">App Database (Ctrl+Shift+F)</div>
            <div className="space-y-2">
              <button
                onClick={appCreateBook}
                className="w-full p-2 text-xs bg-green-700 text-white rounded hover:bg-green-800"
              >
                Create App Book
              </button>
              <button
                onClick={appGetBooks}
                className="w-full p-2 text-xs bg-blue-700 text-white rounded hover:bg-blue-800"
              >
                Get App Books
              </button>
              <button
                onClick={appDeleteAllBooks}
                className="w-full p-2 text-xs bg-red-700 text-white rounded hover:bg-red-800"
              >
                Delete All App Books
              </button>
            </div>

            <div className="mb-2 text-xs text-gray-500">Test Database</div>
            <div className="space-y-2">
              <button
                onClick={appCreateSession}
                className="w-full p-2 text-xs bg-green-700 text-white rounded hover:bg-green-800"
              >
                Create App Session
              </button>
              <button
                onClick={appGetAppSessions}
                className="w-full p-2 text-xs bg-blue-700 text-white rounded hover:bg-blue-800"
              >
                Get App Sessions
              </button>
              <button
                onClick={appDeleteAllBooks}
                className="w-full p-2 text-xs bg-red-700 text-white rounded hover:bg-red-800"
              >
                Delete All App Session
              </button>
            </div>

            <div className="mb-2 text-xs text-gray-500">Test Database</div>
            <div className="space-y-2">
              <button
                onClick={testCreatePerson}
                className="w-full p-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Test Person
              </button>
              <button
                onClick={testGetPeople}
                className="w-full p-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Get All People
              </button>
              <button
                onClick={testCreateBook}
                className="w-full p-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Test Book
              </button>
              <button
                onClick={testGetBooks}
                className="w-full p-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Get All Books
              </button>
              <button
                onClick={testDeleteAllPeople}
                className="w-full p-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete All People
              </button>
              <button
                onClick={testDeleteAllBooks}
                className="w-full p-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete All Books
              </button>
            </div>

            <div className="mb-2 mt-4 text-xs text-gray-500">🔍 COMPREHENSIVE DATABASE VALIDATION</div>
            <div className="space-y-2">
              <button
                onClick={validateAllDatabases}
                className="w-full p-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-bold"
              >
                🔍 VALIDATE ALL DATABASES
              </button>
              <div className="text-xs text-gray-600 mt-1">
                Tests: User Keys, Sessions, Books, Versions, Chapters, Assets, Schema, Files
              </div>
            </div>

            <div className="mb-2 mt-4 text-xs text-gray-500">DAL Integration (via mainDal.ts)</div>
            <div className="space-y-2">
              <button
                onClick={dalCreateBook}
                className="w-full p-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                DAL Create Book
              </button>
              <button
                onClick={dalGetBooks}
                className="w-full p-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                DAL Get Books
              </button>
              <button
                onClick={dalCreateVersion}
                className="w-full p-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                DAL Create Version
              </button>
              <button
                onClick={dalCreateChapter}
                className="w-full p-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                DAL Create Chapter
              </button>
            </div>

            

            <div className="mb-2 mt-4 text-xs text-gray-500">Main Database</div>
            <div className="space-y-2">
              <button
                onClick={mainCreateBook}
                className="w-full p-2 text-xs bg-green-800 text-white rounded hover:bg-green-900"
              >
                Create Main Book
              </button>
              <button
                onClick={mainGetBooks}
                className="w-full p-2 text-xs bg-blue-800 text-white rounded hover:bg-blue-900"
              >
                Get Main Books
              </button>
            </div>

            
          </div>

          <div className="col-span-3">
            <div className="mb-2 text-xs text-gray-500">Query</div>
            <textarea 
              value={customQuery} 
              onChange={e => setCustomQuery(e.target.value)} 
              className="w-full h-24 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm" 
            />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={runCustom} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Run</button>
              <button onClick={() => { setCustomQuery(`SELECT * FROM ${table} LIMIT 200`); }} className="px-3 py-1 border rounded text-sm">Reset</button>
              {loading && <span className="text-sm text-gray-500">Loading...</span>}
              {error && <span className="text-sm text-red-500">{error}</span>}
            </div>

            <div className="mt-4 max-h-[60vh] overflow-auto text-xs">
              <pre className="whitespace-pre-wrap">{JSON.stringify(rows, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DbClient;
