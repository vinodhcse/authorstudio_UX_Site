import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import type { Book, Version } from '../types/bookTypes';
import { Character, PlotArc, Scene, Chapter } from '../types';
import { NarrativeFlowNode, NarrativeEdge } from '../types/narrative-layout';
import { WorldData, Location, WorldObject, Lore, MagicSystem } from '../pages/BookForge/components/planning/types/WorldBuildingTypes';
import { appLog } from '../auth/fileLogger';
import {
  putBook,
  getUserBooks,
  createVersion as createVersionDAL,
  putVersion,
  deleteVersion as deleteVersionDAL,
  getVersion as getVersionDAL,
  getVersionsByBook,
  deleteBook as deleteBookDAL,
} from '../data/simpleDexie';
import {
  markBookDirty,
  determineSyncAction,
  mergeBookLocalAndCloud,
  logSyncDecision
} from '../utils/syncUtils';
import { useAuthStore } from '../auth/useAuthStore';
import { apiClient } from '../lib/apiClient';
import { syncBookToCloud } from '../data/dal';
import { encryptionService } from '../services/encryptionService';
import { syncVersionsForBook } from '../sync/versionSync';
import { simpleDb } from '../data/simpleDexie';
import { enqueueOutbox } from '../data/simpleDexie';
import { listLocalRevisions } from '../services/chapterRevisionService';
import { drainOutbox, installOnlineDrain } from '../services/outboxService';
import { dalEvents } from '../data/events';

// Helper function to create a token getter for API calls
const createTokenGetter = () => {
  const callId = Math.random().toString(36).substring(2, 8);
  return async () => {
    console.log(`🔑 [TOKEN_GETTER_${callId}] Starting token getter call`);
    try {
      const result = await useAuthStore.getState().ensureAccessToken();
      console.log(`🔑 [TOKEN_GETTER_${callId}] Token getter completed`, { 
        hasResult: !!result,
        resultLength: result?.length,
        resultSample: result ? `${result.substring(0, 15)}...` : 'null'
      });
      return result;
    } catch (error) {
      console.log(`🔑 [TOKEN_GETTER_${callId}] Token getter failed`, { error });
      throw error;
    }
  };
};

// Context interface - keeping the existing public API intact
interface BookContextType {
  // Current state
  books: Book[];
  authoredBooks: Book[];
  editableBooks: Book[];
  reviewableBooks: Book[];
  loading: boolean;
  error: string | null;
  
  // World Building UI state
  selectedWorldId: string | null;
  setSelectedWorldId: (worldId: string | null) => void;
  
  // Book operations
  getBook: (bookId: string) => Book | null;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;
  
  // Version operations
  getVersion: (bookId: string, versionId: string) => Promise<Version | null>;
  updateVersion: (bookId: string, versionId: string, updates: Partial<Version>) => Promise<void>;
  createVersion: (bookId: string, versionData: Omit<Version, 'id'>) => Promise<Version>;
  deleteVersion: (bookId: string, versionId: string) => Promise<void>;
  getBookVersions: (bookId: string) => Promise<Version[] | null>;
  // Character operations
  getCharacters: (bookId: string, versionId: string) => Promise<Character[]>;
  getCharacter: (bookId: string, versionId: string, characterId: string) => Promise<Character | null>;
  createCharacter: (bookId: string, versionId: string, characterData: Omit<Character, 'id'>) => Promise<Character>;
  updateCharacter: (bookId: string, versionId: string, characterId: string, updates: Partial<Character>) => Promise<void>;
  deleteCharacter: (bookId: string, versionId: string, characterId: string) => Promise<void>;
  
  // Plot Arc operations
  getPlotArcs: (bookId: string, versionId: string) => Promise<PlotArc[]>;
  getPlotArc: (bookId: string, versionId: string, plotArcId: string) => Promise<PlotArc | null>;
  createPlotArc: (bookId: string, versionId: string, plotArcData: Omit<PlotArc, 'id'>) => Promise<PlotArc>;
  updatePlotArc: (bookId: string, versionId: string, plotArcId: string, updates: Partial<PlotArc>) => Promise<void>;
  deletePlotArc: (bookId: string, versionId: string, plotArcId: string) => Promise<void>;

  // Plot Canvas operations (Narrative Structure)
  getPlotCanvas: (bookId: string, versionId: string) => Promise<{ nodes: NarrativeFlowNode[]; edges: NarrativeEdge[] } | null>;
  updatePlotCanvas: (bookId: string, versionId: string, plotCanvas: { nodes: NarrativeFlowNode[]; edges: NarrativeEdge[] }) => Promise<void>;
  
  // World operations
  getWorlds: (bookId: string, versionId: string) => Promise<WorldData[]>;
  getWorld: (bookId: string, versionId: string, worldId: string) => Promise<WorldData | null>;
  createWorld: (bookId: string, versionId: string, worldData: Omit<WorldData, 'id'>) => Promise<WorldData>;
  updateWorld: (bookId: string, versionId: string, worldId: string, updates: Partial<WorldData>) => Promise<void>;
  deleteWorld: (bookId: string, versionId: string, worldId: string) => Promise<void>;
  
  // Location operations
  getLocations: (bookId: string, versionId: string, worldId: string) => Promise<Location[]>;
  getLocation: (bookId: string, versionId: string, worldId: string, locationId: string) => Promise<Location | null>;
  createLocation: (bookId: string, versionId: string, worldId: string, locationData: Omit<Location, 'id'>) => Promise<Location>;
  updateLocation: (bookId: string, versionId: string, worldId: string, locationId: string, updates: Partial<Location>) => Promise<void>;
  deleteLocation: (bookId: string, versionId: string, worldId: string, locationId: string) => Promise<void>;
  
  // World Object operations
  getWorldObjects: (bookId: string, versionId: string, worldId: string) => Promise<WorldObject[]>;
  getWorldObject: (bookId: string, versionId: string, worldId: string, objectId: string) => Promise<WorldObject | null>;
  createWorldObject: (bookId: string, versionId: string, worldId: string, objectData: Omit<WorldObject, 'id'>) => Promise<WorldObject>;
  updateWorldObject: (bookId: string, versionId: string, worldId: string, objectId: string, updates: Partial<WorldObject>) => Promise<void>;
  deleteWorldObject: (bookId: string, versionId: string, worldId: string, objectId: string) => Promise<void>;
  
  // Lore operations
  getLore: (bookId: string, versionId: string, worldId: string) => Promise<Lore[]>;
  getLoreItem: (bookId: string, versionId: string, worldId: string, loreId: string) => Promise<Lore | null>;
  createLore: (bookId: string, versionId: string, worldId: string, loreData: Omit<Lore, 'id'>) => Promise<Lore>;
  updateLore: (bookId: string, versionId: string, worldId: string, loreId: string, updates: Partial<Lore>) => Promise<void>;
  deleteLore: (bookId: string, versionId: string, worldId: string, loreId: string) => Promise<void>;
  
  // Magic System operations
  getMagicSystems: (bookId: string, versionId: string, worldId: string) => Promise<MagicSystem[]>;
  getMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemId: string) => Promise<MagicSystem | null>;
  createMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemData: Omit<MagicSystem, 'id'>) => Promise<MagicSystem>;
  updateMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemId: string, updates: Partial<MagicSystem>) => Promise<void>;
  deleteMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemId: string) => Promise<void>;
  
  // Scene operations (encrypted content)
  getSceneContent: (sceneId: string) => Promise<string | null>;
  updateSceneContent: (sceneId: string, content: string) => Promise<void>;
  createScene: (bookId: string, versionId: string, chapterId: string, title: string, content?: string) => Promise<Scene>;
  getBookScenes: (bookId: string) => Promise<Scene[]>;
  
  // Chapter operations (encrypted content with local storage)
  getChapterContent: (chapterId: string) => Promise<any>;
  saveChapterContentLocal: (chapterId: string, bookId: string, versionId: string, content: any) => Promise<void>;
  getChaptersByVersion: (bookId: string, versionId: string) => Promise<Chapter[]>;
  
  // Book CRUD operations
  createBook: (bookData: Omit<Book, 'id'>) => Promise<Book>;
  deleteBook: (bookId: string) => Promise<void>;
  
  // Sync operations
  syncBook: (bookId: string) => Promise<void>;
  syncAllBooks: () => Promise<void>;
  syncChapters: () => Promise<void>;
  resolveConflict: (bookId: string, resolution: 'local' | 'cloud' | 'merge') => Promise<void>;
  getDirtyBooks: () => Book[];
  getConflictedBooks: () => Book[];
  
  // Utility methods
  generateId: () => string;
  refreshData: () => void;
  createSampleData: () => Promise<void>;
  // Revisions
  listChapterRevisions?: (chapterId: string) => Promise<any[]>;
  restoreChapterRevision?: (bookId: string, versionId: string, chapterId: string, rev: any) => Promise<void>;
  // Editor sync signals (avoid window events)
  lastRestored?: { chapterId: string; content: any; at: number } | null;
  notifyChapterRestored?: (chapterId: string, content: any) => void;
  restoringChapterId?: string | null;
  startRestore?: (chapterId: string) => void;
  endRestore?: () => void;
}

// Create context
const BookContext = createContext<BookContextType | undefined>(undefined);

// Hook to use the context
export const useBookContext = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    console.error('useBookContext called outside of BookContextProvider. Current stack:', new Error().stack);
    throw new Error('useBookContext must be used within a BookContextProvider');
  }
  return context;
};

// Provider component
export const BookContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  // Signal so Editor can react to restores without global events
  const [lastRestored, setLastRestored] = useState<{ chapterId: string; content: any; at: number } | null>(null);
  const [restoringChapterId, setRestoringChapterId] = useState<string | null>(null);

  // Computed book categories based on user permissions
  const authoredBooks = books.filter(book => book.authorId === user?.id);
  const editableBooks = books.filter(book => 
    book.authorId === user?.id || 
    book.collaborators?.some(c => c.id === user?.id && ['AUTHOR', 'EDITOR', 'ADMIN'].includes(c.role))
  );
  const reviewableBooks = books.filter(book => 
    book.collaborators?.some(c => c.id === user?.id && ['REVIEWER', 'EDITOR', 'ADMIN'].includes(c.role))
  );

  // Load books when user changes or becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadBooks();
    } else {
      setBooks([]);
    }
  }, [isAuthenticated, user?.id]);

  // Listen for DAL dirty events to update local UI state instantly
  useEffect(() => {
    const onBookDirty = (e: Event) => {
      const { bookId } = (e as CustomEvent<{ bookId: string }>).detail || {};
      if (!bookId) return;
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, syncState: 'dirty' as const, revLocal: crypto.randomUUID(), updatedAt: Date.now() } : b));
    };
    const onVersionDirty = (e: Event) => {
      const { bookId } = (e as CustomEvent<{ bookId: string }>).detail || {};
      if (!bookId) return;
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, syncState: 'dirty' as const, revLocal: crypto.randomUUID(), updatedAt: Date.now() } : b));
    };
    const onChapterDirty = (e: Event) => {
      const { bookId } = (e as CustomEvent<{ bookId: string }>).detail || {};
      if (!bookId) return;
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, syncState: 'dirty' as const, revLocal: crypto.randomUUID(), updatedAt: Date.now() } : b));
    };
    dalEvents.addEventListener('book:dirty', onBookDirty);
    dalEvents.addEventListener('version:dirty', onVersionDirty);
    dalEvents.addEventListener('chapter:dirty', onChapterDirty);

    const onBookClean = (e: Event) => {
      const { bookId } = (e as CustomEvent<{ bookId: string }>).detail || {};
      if (!bookId) return;
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, syncState: 'idle' as const, conflictState: 'none' as const } : b));
    };
    const onVersionClean = (e: Event) => {
      const { bookId } = (e as CustomEvent<{ bookId: string }>).detail || {};
      if (!bookId) return;
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, syncState: 'idle' as const } : b));
    };
    const onChapterClean = (e: Event) => {
      const { bookId } = (e as CustomEvent<{ bookId: string }>).detail || {};
      if (!bookId) return;
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, syncState: 'idle' as const } : b));
    };
    dalEvents.addEventListener('book:clean', onBookClean);
    dalEvents.addEventListener('version:clean', onVersionClean);
    dalEvents.addEventListener('chapter:clean', onChapterClean);
    return () => {
      dalEvents.removeEventListener('book:dirty', onBookDirty);
      dalEvents.removeEventListener('version:dirty', onVersionDirty);
      dalEvents.removeEventListener('chapter:dirty', onChapterDirty);
      dalEvents.removeEventListener('book:clean', onBookClean);
      dalEvents.removeEventListener('version:clean', onVersionClean);
      dalEvents.removeEventListener('chapter:clean', onChapterClean);
    };
  }, []);

  // Auto-drain outbox on online status
  useEffect(() => {
    if (!user?.id) return;
    const uninstall = installOnlineDrain(user.id);
    return () => { try { uninstall && uninstall(); } catch { /* ignore */ } };
  }, [user?.id]);

  /**
   * Load books from local database and sync with cloud
   */
  const loadBooks = async () => {
    if (!user?.id) {
      await appLog.warn('book-context', 'Cannot load books: no user ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await appLog.info('book-context', 'Loading books for user', { userId: user.id });

      // Always start with local data (offline-first)
      const localBooks = await getUserBooks(user.id);
      setBooks(localBooks);

      await appLog.success('book-context', 'Loaded local books', { count: localBooks.length });

  // If online, sync with cloud
      if (navigator.onLine) {
        await syncWithCloud(localBooks);
      }

    } catch (error) {
      await appLog.error('book-context', 'Failed to load books', { userId: user.id, error });
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync local books with cloud data
   */
  const syncWithCloud = async (localBooks: Book[]) => {
    if (!user?.id) return;

    try {
      await appLog.info('book-context', 'Starting cloud sync');

      const tokenGetter = createTokenGetter();
      const cloudData = await apiClient.getUserBooks(tokenGetter);
      
      // Combine all cloud books
      const allCloudBooks = [
        ...cloudData.authoredBooks,
        ...cloudData.editableBooks,
        ...cloudData.reviewableBooks
      ];

      // Create maps for efficient lookup
      const localBooksMap = new Map(localBooks.map(book => [book.id, book]));
      const cloudBooksMap = new Map(allCloudBooks.map(book => [book.id, book]));
      const allBookIds = new Set([...localBooksMap.keys(), ...cloudBooksMap.keys()]);

      const syncedBooks: Book[] = [];

      for (const bookId of allBookIds) {
        const localBook = localBooksMap.get(bookId);
        const cloudBook = cloudBooksMap.get(bookId);

        await logSyncDecision(bookId, 'evaluating', { 
          hasLocal: !!localBook, 
          hasCloud: !!cloudBook,
          localSync: localBook?.syncState,
          cloudRev: cloudBook?.revCloud || cloudBook?.revLocal
        });

        if (!localBook && cloudBook) {
          // New book from cloud - add it
          const normalizedBook = {
            ...cloudBook,
            revCloud: cloudBook.revCloud || cloudBook.revLocal,
            syncState: 'idle' as const,
          };
          await putBook(normalizedBook);
          syncedBooks.push(normalizedBook);
          await logSyncDecision(bookId, 'pulled_new', {});

          // Download any cloud assets for this book (async, don't wait)
          const downloadAssetsAsync = async () => {
            try {
              const { AssetSyncService } = await import('../services/AssetSyncService');
              await AssetSyncService.downloadBookAssets(bookId);
              await appLog.info('book-context', 'Downloaded assets for new book from cloud', { bookId });
            } catch (assetError) {
              await appLog.warn('book-context', 'Failed to download assets for new book', { bookId, error: assetError });
            }
          };
          downloadAssetsAsync(); // Fire and forget

        } else if (localBook && !cloudBook) {
          // Local-only book - push if dirty
          if (localBook.syncState === 'dirty') {
            // TODO: Implement pushBookToCloud for Dexie cloud sync
          }
          syncedBooks.push(localBook);

        } else if (localBook && cloudBook) {
          // Both exist - determine sync action
          const action = determineSyncAction(localBook, cloudBook);
          
          switch (action) {
            case 'push':
              // TODO: Implement pushBookToCloud for Dexie cloud sync
              syncedBooks.push(localBook);
              await logSyncDecision(bookId, 'pushed', {});
              break;

            case 'pull':
              const mergedBook = mergeBookLocalAndCloud(localBook, cloudBook);
              await putBook(mergedBook);
              syncedBooks.push(mergedBook);
              await logSyncDecision(bookId, 'pulled', {});

              // Download any cloud assets for this book
              try {
                const { AssetSyncService } = await import('../services/AssetSyncService');
                await AssetSyncService.downloadBookAssets(bookId);
                await appLog.info('book-context', 'Downloaded assets for pulled book', { bookId });
              } catch (assetError) {
                await appLog.warn('book-context', 'Failed to download assets for pulled book', { bookId, error: assetError });
                // Continue - asset download failure shouldn't block book sync
              }
              break;

            case 'conflict':
              const conflictBook = { ...localBook, conflictState: 'needs_review' as const };
              await putBook(conflictBook);
              syncedBooks.push(conflictBook);
              await logSyncDecision(bookId, 'conflict', {});
              break;

            default:
              syncedBooks.push(localBook);
              await logSyncDecision(bookId, 'idle', {});
          }
        }
      }

      setBooks(syncedBooks);
      await appLog.success('book-context', 'Cloud sync completed', { 
        totalBooks: syncedBooks.length,
        conflicts: syncedBooks.filter(b => b.conflictState === 'needs_review').length
      });

      // After book-level sync, perform nested version/chapter sync for each book
      if (navigator.onLine && user?.id) {
        for (const b of syncedBooks) {
          try {
            await syncVersionsForBook(b.id, user.id);
          } catch (e) {
            await appLog.warn('book-context', 'Nested sync failed for book', { bookId: b.id, error: e });
          }
        }
      }

    } catch (error) {
      await appLog.error('book-context', 'Cloud sync failed', { error });
      // Don't throw - offline-first means we continue with local data
    }
  };

  /**
   * Push a book to cloud
   */
  const pushBookToCloud = async (book: Book): Promise<Book> => {
    try {
      await syncBookToCloud(book.id, user?.id);
      const updatedBook = { ...book, syncState: 'idle' as const, conflictState: 'none' as const };
      await putBook(updatedBook);
      return updatedBook;
    } catch (error) {
      await appLog.error('book-context', 'Failed to push book to cloud', { bookId: book.id, error });
      throw error;
    }
  };

  // Book operations
  const getBook = (bookId: string): Book | null => {
    return books.find(book => book.id === bookId) || null;
  };

  const updateBook = async (bookId: string, updates: Partial<Book>): Promise<void> => {
    try {
      const book = getBook(bookId);
      if (!book) {
        throw new Error(`Book not found: ${bookId}`);
      }

      const updatedBook = markBookDirty({ ...book, ...updates });
      await putBook(updatedBook);

      // Update local state
      setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));

      // Try to sync to cloud if online
      if (navigator.onLine) {
        try {
          await pushBookToCloud(updatedBook);
          // Update state again with synced version
          setBooks(prev => prev.map(b => b.id === bookId ? { ...updatedBook, syncState: 'idle' } : b));
          
          // Sync any pending assets for this book
          try {
            const { AssetSyncService } = await import('../services/AssetSyncService');
            await AssetSyncService.syncBookAssets(bookId);
          } catch (assetError) {
            await appLog.warn('book-context', 'Failed to sync book assets to cloud', { bookId, error: assetError });
            // Continue - asset sync failure shouldn't block book update
          }
        } catch (error) {
          await appLog.warn('book-context', 'Failed to sync book update to cloud', { bookId, error });
          // Continue - offline-first means local changes are preserved
        }
      }

      await appLog.success('book-context', 'Book updated', { bookId });
    } catch (error) {
      await appLog.error('book-context', 'Failed to update book', { bookId, error });
      throw error;
    }
  };

  const createBook = async (bookData: Omit<Book, 'id'>): Promise<Book> => {
    try {
      const newBook = {
        ...bookData,
        authorId: bookData.authorId || user?.id,
        id: crypto.randomUUID(),
        revLocal: crypto.randomUUID(),
        syncState: 'dirty' as const,
        conflictState: 'none' as const,
        updatedAt: Date.now(),
      };
      await putBook(newBook);

     
          // Create version directly using Version interface
      const version: Version = {
        id: 'ver_'+crypto.randomUUID(),
        bookId:newBook.id,
        name: 'Manuscript',
        status: 'active',
        wordCount: 0,
        createdAt: new Date().toISOString(),
        contributor: { name: user?.name || 'Unknown' },
        chapters: [],
        characters:[],
        plotArcs: [],
        worlds:[],
        plotCanvas: null,
        revLocal: crypto.randomUUID(),
        syncState: 'dirty',
        conflictState: 'none',
        updatedAt: Date.now(),
      };

      await createVersionDAL(version);

      setBooks(prev => [...prev, newBook]);
          
      await appLog.success('book-context', 'Book created', { bookId: newBook.id });
      return newBook;
    } catch (error) {
      await appLog.error('book-context', 'Failed to create book', { error });
      throw error;
    }
  };

  const deleteBook = async (bookId: string): Promise<void> => {
    try {
      await deleteBookDAL(bookId);
      await apiClient.deleteBook(bookId);
      setBooks(prev => prev.filter(book => book.id !== bookId));
      await appLog.success('book-context', 'Book deleted', { bookId });
    } catch (error) {
      await appLog.error('book-context', 'Failed to delete book', { bookId, error });
      throw error;
    }
  };

  // Version operations
  const getVersion = async (bookId: string, versionId: string): Promise<Version | null> => {
    try {
      const version = await getVersionDAL(versionId);
      if (!version) {
        return null;
      }
      
      // With simplified approach, no conversion needed
      return version;
    } catch (error) {
      await appLog.error('book-context', 'Failed to get version', { bookId, versionId, error });
      return null;
    }
  };

  // Version operations
  const getBookVersions = async (bookId: string): Promise<Version[] | null> => {
    try {
      const versions = await getVersionsByBook(bookId);
      // With simplified approach, no conversion needed
      return versions;
    } catch (error) {
      await appLog.error('book-context', 'Failed to get versions', { bookId, error });
      return null;
    }
  };


  const updateVersion = async (bookId: string, versionId: string, updates: Partial<Version>): Promise<void> => {
    try {
      const existingVersion = await getVersionDAL(versionId);
      if (!existingVersion) {
        throw new Error(`Version not found: ${versionId}`);
      }

      // Update version in database
      const updatedVersion: Version = {
        ...existingVersion,
        ...updates,
        updatedAt: Date.now(),
        revLocal: crypto.randomUUID(), // New revision
        syncState: 'dirty'
      };

      await putVersion(updatedVersion);

      // Update parent book's revision and sync state
      const book = getBook(bookId);
      if (book) {
        const updatedBook = {
          ...book,
          revLocal: crypto.randomUUID(),
          syncState: 'dirty' as const,
          updatedAt: Date.now()
        };
        await putBook(updatedBook);
        setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
      }

      await appLog.success('book-context', 'Version updated', { bookId, versionId });

      // Notify listeners that the version has been updated so UIs can refresh derived data (e.g., characters)
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('version:updated', { detail: { bookId, versionId } }));
        }
      } catch {}
    } catch (error) {
      await appLog.error('book-context', 'Failed to update version', { bookId, versionId, error });
      throw error;
    }
  };

  const createVersion = async (bookId: string, versionData: Omit<Version, 'id'>): Promise<Version> => {
    try {
      const book = getBook(bookId);
      if (!book) throw new Error(`Book not found: ${bookId}`);

      const versionId = crypto.randomUUID();
      const now = Date.now();

      // Create version directly using Version interface
      const version: Version = {
        id: versionId,
        bookId:bookId,
        name: versionData.name,
        status: 'active',
        wordCount: 0,
        createdAt: new Date(now).toISOString(),
        contributor: { name: user?.name || 'Unknown' },
        chapters: versionData.chapters || [],
        characters: versionData.characters || [],
        plotArcs: versionData.plotArcs || [],
        worlds: versionData.worlds || [],
        plotCanvas: versionData.plotCanvas || null,
        revLocal: crypto.randomUUID(),
        syncState: 'dirty',
        conflictState: 'none',
        updatedAt: now
      };

      await createVersionDAL(version);

      // Update book to include this version ID and update book revision
      const updatedBook = {
        ...book,
        versions: [...book.versions, versionId],
        revLocal: crypto.randomUUID(),
        syncState: 'dirty' as const,
        updatedAt: now
      };

      await putBook(updatedBook);
      setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));

      // Return the created version
      const newVersion: Version = {
        id: versionId,
        bookId,
        name: versionData.name,
        status: 'active',
        wordCount: 0,
        createdAt: new Date(now).toISOString(),
        contributor: { 
          name: user?.name || 'Unknown'
          // avatar is optional and will be undefined
        },
        chapters: versionData.chapters || [],
        plotCanvas: versionData.plotCanvas || null,
        characters: versionData.characters || [],
        plotArcs: versionData.plotArcs || [],
        worlds: versionData.worlds || [],
        revLocal: crypto.randomUUID(),
        syncState: 'dirty',
        conflictState: 'none',
        updatedAt: now
      };

      await appLog.success('book-context', 'Version created', { bookId, versionId });
      return newVersion;
    } catch (error) {
      await appLog.error('book-context', 'Failed to create version', { bookId, error });
      throw error;
    }
  };
  

  const deleteVersion = async (bookId: string, versionId: string): Promise<void> => {
    try {
      const book = getBook(bookId);
      if (!book) throw new Error(`Book not found: ${bookId}`);

      // Delete version from database
      await deleteVersionDAL(versionId);

      // Update book to remove this version ID and update book revision
      const updatedVersions = book.versions.filter(id => id !== versionId);
      const updatedBook = {
        ...book,
        versions: updatedVersions,
        revLocal: crypto.randomUUID(),
        syncState: 'dirty' as const,
        updatedAt: Date.now()
      };

      await putBook(updatedBook);
      setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));

      await appLog.success('book-context', 'Version deleted', { bookId, versionId });
    } catch (error) {
      await appLog.error('book-context', 'Failed to delete version', { bookId, versionId, error });
      throw error;
    }
  };

  // Character operations
  const getCharacters = async (bookId: string, versionId: string): Promise<Character[]> => {
    const version = await getVersion(bookId, versionId);
    return version?.characters?.filter((c: any) => c.versionId === versionId) || [];
  };

  const getCharacter = async (bookId: string, versionId: string, characterId: string): Promise<Character | null> => {
    const characters = await getCharacters(bookId, versionId);
    return characters.find((c: any) => c.id === characterId) || null;
  };

  const createCharacter = async (bookId: string, versionId: string, characterData: Omit<Character, 'id'>): Promise<Character> => {
    const version = await getVersion(bookId, versionId);
    if (!version) throw new Error(`Version not found: ${versionId} in book ${bookId}`);

    const newCharacter = {
      ...characterData,
      id: crypto.randomUUID(),
      versionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedVersion = {
      ...version,
      characters: [...(version.characters || []), newCharacter],
      updatedAt: Date.now(),
    };

    await updateVersion(bookId, versionId, updatedVersion);
    return newCharacter;
  };

  const updateCharacter = async (bookId: string, versionId: string, characterId: string, updates: Partial<Character>): Promise<void> => {
    const version = await getVersion(bookId, versionId);
    if (!version) return;

    const characterIndex = (version.characters || []).findIndex((c: any) => c.id === characterId && c.versionId === versionId);
    if (characterIndex === -1) return;

    const updatedCharacter = { ...version.characters![characterIndex], ...updates };
    const updatedCharacters = [...(version.characters || [])];
    updatedCharacters[characterIndex] = updatedCharacter;

    const updatedVersion = { 
      ...version, 
      characters: updatedCharacters,
      updatedAt: Date.now()
    };

    await updateVersion(bookId, versionId, updatedVersion);
  };

  const deleteCharacter = async (bookId: string, versionId: string, characterId: string): Promise<void> => {
    const version = await getVersion(bookId, versionId);
    if (!version) return;

    const updatedCharacters = version.characters?.filter((c: any) => c.id !== characterId || c.versionId !== versionId) || [];
    const updatedVersion = { 
      ...version, 
      characters: updatedCharacters,
      updatedAt: Date.now()
    };

    await updateVersion(bookId, versionId, updatedVersion);
  };

  // Plot Arc operations
  const getPlotArcs = async (bookId: string, versionId: string): Promise<PlotArc[]> => {
    const version = await getVersion(bookId, versionId);
    return version?.plotArcs?.filter((p: any) => p.versionId === versionId) || [];
  };

  const getPlotArc = async (bookId: string, versionId: string, plotArcId: string): Promise<PlotArc | null> => {
    const plotArcs = await getPlotArcs(bookId, versionId);
    return plotArcs.find((p: any) => p.id === plotArcId) || null;
  };

  const createPlotArc = async (bookId: string, versionId: string, plotArcData: Omit<PlotArc, 'id'>): Promise<PlotArc> => {
    const version = await getVersion(bookId, versionId);
    if (!version) throw new Error(`Version not found: ${versionId} in book ${bookId}`);

    const newPlotArc = {
      ...plotArcData,
      id: crypto.randomUUID(),
      versionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedVersion = {
      ...version,
      plotArcs: [...(version.plotArcs || []), newPlotArc],
      updatedAt: Date.now(),
    };

    await updateVersion(bookId, versionId, updatedVersion);
    return newPlotArc;
  };

  const updatePlotArc = async (bookId: string, versionId: string, plotArcId: string, updates: Partial<PlotArc>): Promise<void> => {
    const version = await getVersion(bookId, versionId);
    if (!version) return;

    const plotArcIndex = (version.plotArcs || []).findIndex((p: any) => p.id === plotArcId && p.versionId === versionId);
    if (plotArcIndex === -1) return;

    const updatedPlotArc = { ...version.plotArcs![plotArcIndex], ...updates };
    const updatedPlotArcs = [...(version.plotArcs || [])];
    updatedPlotArcs[plotArcIndex] = updatedPlotArc;

    const updatedVersion = { 
      ...version, 
      plotArcs: updatedPlotArcs,
      updatedAt: Date.now()
    };

    await updateVersion(bookId, versionId, updatedVersion);
  };

  const deletePlotArc = async (bookId: string, versionId: string, plotArcId: string): Promise<void> => {
    const version = await getVersion(bookId, versionId);
    if (!version) return;

    const updatedPlotArcs = version.plotArcs?.filter((p: any) => p.id !== plotArcId || p.versionId !== versionId) || [];
    const updatedVersion = { 
      ...version, 
      plotArcs: updatedPlotArcs,
      updatedAt: Date.now()
    };

    await updateVersion(bookId, versionId, updatedVersion);
  };

  // Plot Canvas operations (Narrative Structure)
  const getPlotCanvas = async (bookId: string, versionId: string): Promise<{ nodes: NarrativeFlowNode[]; edges: NarrativeEdge[] } | null> => {
    const version = await getVersion(bookId, versionId);
    const plotCanvas = version?.plotCanvas;
    return plotCanvas ? { nodes: plotCanvas.nodes, edges: plotCanvas.edges } : null;
  };

  const updatePlotCanvas = async (bookId: string, versionId: string, plotCanvas: { nodes: NarrativeFlowNode[]; edges: NarrativeEdge[] }): Promise<void> => {
    const version = await getVersion(bookId, versionId);
    if (!version) return;

    const updatedVersion = {
      ...version,
      plotCanvas: {
        nodes: plotCanvas.nodes,
        edges: plotCanvas.edges,
      },
      updatedAt: Date.now(),
    };

    await updateVersion(bookId, versionId, updatedVersion);
    try {
      // Notify any listeners (e.g., PlotArcsBoard) that plot canvas changed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('plot_canvas:updated', { detail: { bookId, versionId } })
        );
      }
    } catch {}
  };

  // World operations
  const getWorlds = async (bookId: string, versionId: string): Promise<WorldData[]> => {
    const version = await getVersion(bookId, versionId);
    return version?.worlds || [];
  };

  const getWorld = async (bookId: string, versionId: string, worldId: string): Promise<WorldData | null> => {
    const worlds = await getWorlds(bookId, versionId);
    return worlds.find((w: any) => w.id === worldId) || null;
  };

  const createWorld = async (bookId: string, versionId: string, worldData: Omit<WorldData, 'id'>): Promise<WorldData> => {
    const version = await getVersion(bookId, versionId);
    if (!version) throw new Error(`Version not found: ${versionId} in book ${bookId}`);

    const newWorld = {
      ...worldData,
      id: crypto.randomUUID(),
      versionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedVersion = {
      ...version,
      worlds: [...(version.worlds || []), newWorld],
      updatedAt: Date.now(),
    };

    await updateVersion(bookId, versionId, updatedVersion);
    return newWorld;
  };

  const updateWorld = async (bookId: string, versionId: string, worldId: string, updates: Partial<WorldData>): Promise<void> => {
    const version = await getVersion(bookId, versionId);
    if (!version) return;

    const worldIndex = (version.worlds || []).findIndex((w: any) => w.id === worldId && w.versionId === versionId);
    if (worldIndex === -1) return;

    const updatedWorld = { ...version.worlds![worldIndex], ...updates };
    const updatedWorlds = [...(version.worlds || [])];
    updatedWorlds[worldIndex] = updatedWorld;

    const updatedVersion = { 
      ...version, 
      worlds: updatedWorlds,
      updatedAt: Date.now()
    };

    await updateVersion(bookId, versionId, updatedVersion);
  };

  const deleteWorld = async (bookId: string, versionId: string, worldId: string): Promise<void> => {
    const version = await getVersion(bookId, versionId);
    if (!version) return;

    const updatedWorlds = version.worlds?.filter((w: any) => w.id !== worldId || w.versionId !== versionId) || [];
    const updatedVersion = { 
      ...version, 
      worlds: updatedWorlds,
      updatedAt: Date.now()
    };

    await updateVersion(bookId, versionId, updatedVersion);
  };

  // Location operations
  const getLocations = async (bookId: string, versionId: string, worldId: string): Promise<Location[]> => {
    const world = await getWorld(bookId, versionId, worldId);
    return world?.locations || [];
  };

  const getLocation = async (bookId: string, versionId: string, worldId: string, locationId: string): Promise<Location | null> => {
    const locations = await getLocations(bookId, versionId, worldId);
    return locations.find((l: any) => l.id === locationId) || null;
  };

  const createLocation = async (bookId: string, versionId: string, worldId: string, locationData: Omit<Location, 'id'>): Promise<Location> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) throw new Error(`World not found: ${worldId} in version ${versionId} of book ${bookId}`);

    const newLocation = {
      ...locationData,
      id: crypto.randomUUID(),
    };

    const updatedWorld = {
      ...world,
      locations: [...(world.locations || []), newLocation],
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
    return newLocation;
  };

  const updateLocation = async (bookId: string, versionId: string, worldId: string, locationId: string, updates: Partial<Location>): Promise<void> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) return;

    const locationIndex = (world.locations || []).findIndex((l: any) => l.id === locationId);
    if (locationIndex === -1) return;

    const updatedLocation = { ...world.locations![locationIndex], ...updates };
    const updatedLocations = [...(world.locations || [])];
    updatedLocations[locationIndex] = updatedLocation;

    const updatedWorld = {
      ...world,
      locations: updatedLocations,
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
  };

  const deleteLocation = async (bookId: string, versionId: string, worldId: string, locationId: string): Promise<void> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedLocations = world.locations?.filter((l: any) => l.id !== locationId) || [];
    const updatedWorld = {
      ...world,
      locations: updatedLocations,
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
  };

  // World Object operations
  const getWorldObjects = async (bookId: string, versionId: string, worldId: string): Promise<WorldObject[]> => {
    const world = await getWorld(bookId, versionId, worldId);
    return world?.objects || [];
  };

  const getWorldObject = async (bookId: string, versionId: string, worldId: string, objectId: string): Promise<WorldObject | null> => {
    const worldObjects = await getWorldObjects(bookId, versionId, worldId);
    return worldObjects.find((o: any) => o.id === objectId) || null;
  };

  const createWorldObject = async (bookId: string, versionId: string, worldId: string, objectData: Omit<WorldObject, 'id'>): Promise<WorldObject> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) throw new Error(`World not found: ${worldId} in version ${versionId} of book ${bookId}`);

    const newWorldObject = {
      ...objectData,
      id: crypto.randomUUID(),
    };

    const updatedWorld = {
      ...world,
      objects: [...(world.objects || []), newWorldObject],
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
    return newWorldObject;
  };

  const updateWorldObject = async (bookId: string, versionId: string, worldId: string, objectId: string, updates: Partial<WorldObject>): Promise<void> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) return;

    const worldObjectIndex = (world.objects || []).findIndex((o: any) => o.id === objectId);
    if (worldObjectIndex === -1) return;

    const updatedWorldObject = { ...world.objects![worldObjectIndex], ...updates };
    const updatedObjects = [...(world.objects || [])];
    updatedObjects[worldObjectIndex] = updatedWorldObject;

    const updatedWorld = {
      ...world,
      objects: updatedObjects,
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
  };

  const deleteWorldObject = async (bookId: string, versionId: string, worldId: string, objectId: string): Promise<void> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedObjects = world.objects?.filter((o: any) => o.id !== objectId) || [];
    const updatedWorld = {
      ...world,
      objects: updatedObjects,
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
  };

  // Lore operations
  const getLore = async (bookId: string, versionId: string, worldId: string): Promise<Lore[]> => {
    const world = await getWorld(bookId, versionId, worldId);
    return world?.lore || [];
  };

  const getLoreItem = async (bookId: string, versionId: string, worldId: string, loreId: string): Promise<Lore | null> => {
    const loreItems = await getLore(bookId, versionId, worldId);
    return loreItems.find((l: any) => l.id === loreId) || null;
  };

  const createLore = async (bookId: string, versionId: string, worldId: string, loreData: Omit<Lore, 'id'>): Promise<Lore> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) throw new Error(`World not found: ${worldId} in version ${versionId} of book ${bookId}`);

    const newLore = {
      ...loreData,
      id: crypto.randomUUID(),
    };

    const updatedWorld = {
      ...world,
      lore: [...(world.lore || []), newLore],
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
    return newLore;
  };

  const updateLore = async (bookId: string, versionId: string, worldId: string, loreId: string, updates: Partial<Lore>): Promise<void> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) return;

    const loreIndex = (world.lore || []).findIndex((l: any) => l.id === loreId);
    if (loreIndex === -1) return;

    const updatedLore = { ...world.lore![loreIndex], ...updates };
    const updatedLoreItems = [...(world.lore || [])];
    updatedLoreItems[loreIndex] = updatedLore;

    const updatedWorld = {
      ...world,
      lore: updatedLoreItems,
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
  };

  const deleteLore = async (bookId: string, versionId: string, worldId: string, loreId: string): Promise<void> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedLore = world.lore?.filter((l: any) => l.id !== loreId) || [];
    const updatedWorld = {
      ...world,
      lore: updatedLore,
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
  };

  // Magic System operations
  const getMagicSystems = async (bookId: string, versionId: string, worldId: string): Promise<MagicSystem[]> => {
    const world = await getWorld(bookId, versionId, worldId);
    return world?.magicSystems || [];
  };

  const getMagicSystem = async (bookId: string, versionId: string, worldId: string, magicSystemId: string): Promise<MagicSystem | null> => {
    const magicSystems = await getMagicSystems(bookId, versionId, worldId);
    return magicSystems.find((m: any) => m.id === magicSystemId) || null;
  };

  const createMagicSystem = async (bookId: string, versionId: string, worldId: string, magicSystemData: Omit<MagicSystem, 'id'>): Promise<MagicSystem> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) throw new Error(`World not found: ${worldId} in version ${versionId} of book ${bookId}`);

    const newMagicSystem = {
      ...magicSystemData,
      id: crypto.randomUUID(),
    };

    const updatedWorld = {
      ...world,
      magicSystems: [...(world.magicSystems || []), newMagicSystem],
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
    return newMagicSystem;
  };

  const updateMagicSystem = async (bookId: string, versionId: string, worldId: string, magicSystemId: string, updates: Partial<MagicSystem>): Promise<void> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) return;

    const magicSystemIndex = (world.magicSystems || []).findIndex((m: any) => m.id === magicSystemId);
    if (magicSystemIndex === -1) return;

    const updatedMagicSystem = { ...world.magicSystems![magicSystemIndex], ...updates };
    const updatedMagicSystems = [...(world.magicSystems || [])];
    updatedMagicSystems[magicSystemIndex] = updatedMagicSystem;

    const updatedWorld = {
      ...world,
      magicSystems: updatedMagicSystems,
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
  };

  const deleteMagicSystem = async (bookId: string, versionId: string, worldId: string, magicSystemId: string): Promise<void> => {
    const world = await getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedMagicSystems = world.magicSystems?.filter((m: any) => m.id !== magicSystemId) || [];
    const updatedWorld = {
      ...world,
      magicSystems: updatedMagicSystems,
    };

    await updateWorld(bookId, versionId, worldId, updatedWorld);
  };

  // Scene operations (encrypted content)
  const getSceneContent = async (sceneId: string): Promise<string | null> => {
    try {
      // TODO: Implement proper scene content retrieval
      // const result = await apiClient.getSceneContent(sceneId);
      // return result?.content || null;
      return null;
    } catch (error) {
      await appLog.error('book-context', 'Failed to get scene content', { sceneId, error });
      return null;
    }
  };

  const updateSceneContent = async (sceneId: string, _content: string): Promise<void> => {
    try {
      // TODO: Implement proper scene content update
      // await apiClient.updateSceneContent(sceneId, { content });
      await appLog.success('book-context', 'Scene content updated', { sceneId });
    } catch (error) {
      await appLog.error('book-context', 'Failed to update scene content', { sceneId, error });
      throw error;
    }
  };

  const createScene = async (bookId: string, versionId: string, chapterId: string, title: string, content?: string): Promise<Scene> => {
    // Create a simplified scene that matches the Scene interface
    const newScene: Scene = {
      id: crypto.randomUUID(),
      title,
      encScheme: 'udek',
      syncState: 'idle',
      conflictState: 'none',
      wordCount: content ? content.split(' ').length : 0,
      updatedAt: Date.now(),
    };

    // TODO: Implement proper scene storage within chapters/version structure
    await appLog.success('book-context', 'Scene created', { sceneId: newScene.id, bookId, versionId, chapterId });

    return newScene;
  };

  const getBookScenes = async (bookId: string): Promise<Scene[]> => {
    // TODO: Implement proper scene retrieval
    await appLog.info('book-context', 'Getting book scenes', { bookId });
    return [];
  };

  // Chapter operations (encrypted content with local storage)
  const getChapterContent = async (chapterId: string): Promise<any> => {
    try {
      if (!user?.id) return null;
      return await encryptionService.loadChapterContent(chapterId, user.id);
    } catch (error) {
      await appLog.error('book-context', 'Failed to get chapter content', { chapterId, error });
      return null;
    }
  };
 
  const saveChapterContentLocal = async (chapterId: string, bookId: string, versionId: string, content: any): Promise<void> => {
    try {
      if (!user?.id) throw new Error('No user');
      await encryptionService.saveChapterContent(chapterId, bookId, versionId, user.id, content, false);
  // Enqueue an outbox update to push when online
  await enqueueOutbox({ entity: 'chapter', action: 'update', bookId, versionId, chapterId, payload: { title: content?.title, updatedAt: Date.now() } });
      await appLog.success('book-context', 'Chapter content saved locally', { chapterId });
    } catch (error) {
      await appLog.error('book-context', 'Failed to save chapter content locally', { chapterId, error });
      throw error;
    }
  };

  const getChaptersByVersion = async (_bookId: string, versionId: string): Promise<Chapter[]> => {
    // Use simplified Dexie chapters table; map to UI Chapter type minimally
    const rows = await simpleDb.chapters.where('versionId').equals(versionId).toArray();
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title || 'Untitled Chapter',
      position: 0,
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString(),
      image: undefined,
      linkedPlotNodeId: '',
      linkedAct: '',
      linkedOutline: '',
      linkedScenes: [],
      content: { type: 'doc', content: [], metadata: { totalCharacters: 0, totalWords: r.wordCount || 0 } },
      revisions: [],
      currentRevisionId: '',
      collaborativeState: { pendingChanges: [], needsReview: false, reviewerIds: [], approvedBy: [], rejectedBy: [], mergeConflicts: [] },
      revLocal: r.revLocal,
      revCloud: r.revCloud,
      syncState: r.syncState,
      conflictState: r.conflictState,
      encScheme: r.encScheme,
      contentEnc: (r.contentEnc ? JSON.stringify(Array.from(r.contentEnc)) : undefined) as any,
      contentIv: (r.contentIv ? JSON.stringify(Array.from(r.contentIv)) : undefined) as any,
      wordCount: r.wordCount || 0,
      hasProposals: false,
      summary: '',
      goals: '',
      characters: [],
      tags: [],
      notes: '',
      isComplete: false,
      status: 'DRAFT',
      authorId: user?.id || '',
      lastModifiedBy: user?.id || '',
    }));
  };

  // Sync operations
  const syncBook = async (bookId: string): Promise<void> => {
    const book = getBook(bookId);
    if (!book) return;

    try {
      await appLog.info('book-context', 'Syncing book', { bookId });

      // Push local changes to cloud
      if (book.syncState === 'dirty') {
        await pushBookToCloud(book);
      }

      // TODO: Implement pull and merge logic if needed

      await appLog.success('book-context', 'Book synced', { bookId });
    } catch (error) {
      await appLog.error('book-context', 'Failed to sync book', { bookId, error });
    }
  };

  const syncAllBooks = async (): Promise<void> => {
    for (const book of books) {
      try {
        await syncBook(book.id);
      } catch (error) {
        await appLog.error('book-context', 'Failed to sync book', { bookId: book.id, error });
      }
    }
  };

  const syncChapters = async (): Promise<void> => {
    if (!navigator.onLine || !user?.id) return;
    for (const b of books) {
      try {
        await syncVersionsForBook(b.id, user.id);
      } catch (e) {
        await appLog.warn('book-context', 'Chapter sync failed', { bookId: b.id, error: e });
      }
    }
    // Drain any queued outbox items at the end of sync
    try { await drainOutbox(user?.id); } catch { /* ignore */ }
  };

  // Expose simple revision helpers (optional, for UI usage later)
  const listChapterRevisions = async (chapterId: string) => {
    return await listLocalRevisions(chapterId);
  };
  const restoreChapterRevision = async (bookId: string, versionId: string, chapterId: string, rev: any) => {
    // rev.snapshot should be a TipTap JSON snapshot
    await saveChapterContentLocal(chapterId, bookId, versionId, rev.snapshot);
  };
  const notifyChapterRestored = (chapterId: string, content: any) => {
    setLastRestored({ chapterId, content, at: Date.now() });
  };
  const startRestore = (chapterId: string) => setRestoringChapterId(chapterId);
  const endRestore = () => setRestoringChapterId(null);

  const resolveConflict = async (bookId: string, resolution: 'local' | 'cloud' | 'merge'): Promise<void> => {
    const book = getBook(bookId);
    if (!book) return;

    try {
      if (resolution === 'local') {
        // Keep local version - discard cloud changes
        const updatedBook = { ...book, conflictState: 'none' as const };
        await putBook(updatedBook);
        setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
        await appLog.info('book-context', 'Conflict resolved - kept local version', { bookId });
      } else if (resolution === 'cloud') {
        // Discard local changes - pull from cloud
        await syncBook(bookId);
        await appLog.info('book-context', 'Conflict resolved - pulled cloud version', { bookId });
      } else if (resolution === 'merge') {
        // TODO: Implement merge logic
        await appLog.info('book-context', 'Merge conflict - manual intervention required', { bookId });
      }
    } catch (error) {
      await appLog.error('book-context', 'Failed to resolve conflict', { bookId, error });
    }
  };

  // Utility methods
  const generateId = (): string => crypto.randomUUID();

  const refreshData = async (): Promise<void> => {
    await loadBooks();
  };

  const createSampleData = async (): Promise<void> => {
    // TODO: Implement sample data creation
  };

  // Utility functions for sync operations
  const getDirtyBooks = (): Book[] => {
    return books.filter(book => book.syncState === 'dirty');
  };

  const getConflictedBooks = (): Book[] => {
    return books.filter(book => book.conflictState && book.conflictState !== 'none');
  };

  // Provider value
  const value = {
    books,
    authoredBooks,
    editableBooks,
    reviewableBooks,
    loading,
    error,
    selectedWorldId,
    setSelectedWorldId,
    getBook,
    updateBook,
    getVersion,
    updateVersion,
    createVersion,
    deleteVersion,
    getBookVersions,
    getCharacters,
    getCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    getPlotArcs,
    getPlotArc,
    createPlotArc,
    updatePlotArc,
    deletePlotArc,
    getPlotCanvas,
    updatePlotCanvas,
    getWorlds,
    getWorld,
    createWorld,
    updateWorld,
    deleteWorld,
    getLocations,
    getLocation,
    createLocation,
    updateLocation,
    deleteLocation,
    getWorldObjects,
    getWorldObject,
    createWorldObject,
    updateWorldObject,
    deleteWorldObject,
    getLore,
    getLoreItem,
    createLore,
    updateLore,
    deleteLore,
    getMagicSystems,
    getMagicSystem,
    createMagicSystem,
    updateMagicSystem,
    deleteMagicSystem,
    getSceneContent,
    updateSceneContent,
    createScene,
    getBookScenes,
    getChapterContent,
    saveChapterContentLocal,
    getChaptersByVersion,
    createBook: (data: Omit<Book, 'id'>) => createBook(data),
    deleteBook: (id: string) => deleteBook(id),
    syncBook,
    syncAllBooks,
    syncChapters,
    resolveConflict,
    getDirtyBooks,
    getConflictedBooks,
    generateId,
    refreshData,
    createSampleData,
  // Optional revision helpers
  listChapterRevisions,
  restoreChapterRevision,
  // Editor sync signals
  lastRestored,
  notifyChapterRestored,
  restoringChapterId,
  startRestore,
  endRestore,
  };

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
};

// Safe hook version that doesn't throw errors
export const useBookContextSafe = () => {
  const context = useContext(BookContext);
  return context;
};

// Custom hook to get current book and version from URL params
export const useCurrentBookAndVersion = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();

  // Use safe hook first to check if context is available
  const contextSafe = useBookContextSafe();

  const [currentBook, setCurrentBook] = React.useState<Book | null>(null);
  const [currentVersion, setCurrentVersion] = React.useState<Version | null>(null);
  const [loading, setLoading] = React.useState<boolean>(!!(bookId && versionId));
  const [error, setError] = React.useState<string | null>(null);
  const isContextLoading = contextSafe?.loading ?? false;
  const lastResolvedRef = React.useRef<{ bookId?: string; versionId?: string } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!contextSafe) {
      setCurrentBook(null);
      setCurrentVersion(null);
      setLoading(false);
      setError('BookContext not available');
      return;
    }

    const { getBook, getVersion } = contextSafe;

    // Resolve current book synchronously from context state
    const book = bookId ? getBook(bookId) : null;
    setCurrentBook(book);

    // If the context is still loading, reflect that and avoid producing errors yet
    if (isContextLoading) {
      // Only show loading spinner during initial hydration or when IDs actually change
      if (!lastResolvedRef.current || lastResolvedRef.current.bookId !== bookId || lastResolvedRef.current.versionId !== versionId) {
        setLoading(!!(bookId && versionId));
      }
      setError(null);
      // don't try resolving version until base data is ready
      return () => { cancelled = true; };
    }

    // If we have no bookId or versionId, nothing to resolve
    if (!bookId || !versionId) {
      setCurrentVersion(null);
      setLoading(false);
      setError(null);
      return () => { cancelled = true; };
    }

    // If the book isn't found yet, keep loading until the context has some books loaded
    if (!book) {
      const booksCount = contextSafe.books?.length ?? 0;
      if (booksCount === 0) {
        // Likely initial mount before books hydrate; keep loading
        setLoading(true);
        setError(null);
        return () => { cancelled = true; };
      } else {
        // Books are present but this ID wasn't found
        setCurrentVersion(null);
        setLoading(false);
        setError('Book not found');
        return () => { cancelled = true; };
      }
    }

  // Resolve version asynchronously; avoid toggling loading during routine context updates
    setError(null);
    getVersion(bookId, versionId)
      .then(v => {
        if (cancelled) return;
        setCurrentVersion(v);
    setLoading(false);
    // Track the last resolved IDs to prevent redundant reloads on saves/dirty events
    lastResolvedRef.current = { bookId, versionId };
        if (!v) setError('Version not found');
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Failed to resolve current version', err);
        setError('Version not found');
        setCurrentVersion(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, versionId, isContextLoading]);

  return {
    bookId,
    versionId,
    currentBook,
    currentVersion,
    loading,
    error,
  };
};

export default BookContext;
