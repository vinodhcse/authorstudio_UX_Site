import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Book, Version } from '../types/bookTypes';
import { Character, PlotArc, Scene, Chapter } from '../types';
import { NarrativeFlowNode, NarrativeEdge } from '../types/narrative-layout';
import { WorldData, Location, WorldObject, Lore, MagicSystem } from '../pages/BookForge/components/planning/types/WorldBuildingTypes';
import { appLog } from '../auth/fileLogger';
import { 
  createBook as createBookDAL,
  putBook,
  deleteBook as deleteBookDAL,
  getUserBooks,
  now,
  normalizeBook
} from '../data/dal';
import {
  markBookDirty,
  updateVersionInBook,
  addVersionToBook,
  removeVersionFromBook,
  getDirtyBooks,
  getConflictedBooks,
  determineSyncAction,
  mergeBookLocalAndCloud,
  resolveBookConflict,
  logSyncDecision
} from '../utils/syncUtils';
import { useAuthStore } from '../auth/useAuthStore';
import { apiClient } from '../lib/apiClient';

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
  getVersion: (bookId: string, versionId: string) => Version | null;
  updateVersion: (bookId: string, versionId: string, updates: Partial<Version>) => void;
  createVersion: (bookId: string, versionData: Omit<Version, 'id'>) => Promise<Version>;
  deleteVersion: (bookId: string, versionId: string) => Promise<void>;
  
  // Character operations
  getCharacters: (bookId: string, versionId: string) => Character[];
  getCharacter: (bookId: string, versionId: string, characterId: string) => Character | null;
  createCharacter: (bookId: string, versionId: string, characterData: Omit<Character, 'id'>) => Promise<Character>;
  updateCharacter: (bookId: string, versionId: string, characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (bookId: string, versionId: string, characterId: string) => void;
  
  // Plot Arc operations
  getPlotArcs: (bookId: string, versionId: string) => PlotArc[];
  getPlotArc: (bookId: string, versionId: string, plotArcId: string) => PlotArc | null;
  createPlotArc: (bookId: string, versionId: string, plotArcData: Omit<PlotArc, 'id'>) => Promise<PlotArc>;
  updatePlotArc: (bookId: string, versionId: string, plotArcId: string, updates: Partial<PlotArc>) => void;
  deletePlotArc: (bookId: string, versionId: string, plotArcId: string) => void;

  // Plot Canvas operations (Narrative Structure)
  getPlotCanvas: (bookId: string, versionId: string) => { nodes: NarrativeFlowNode[]; edges: NarrativeEdge[] } | null;
  updatePlotCanvas: (bookId: string, versionId: string, plotCanvas: { nodes: NarrativeFlowNode[]; edges: NarrativeEdge[] }) => void;
  
  // World operations
  getWorlds: (bookId: string, versionId: string) => WorldData[];
  getWorld: (bookId: string, versionId: string, worldId: string) => WorldData | null;
  createWorld: (bookId: string, versionId: string, worldData: Omit<WorldData, 'id'>) => Promise<WorldData>;
  updateWorld: (bookId: string, versionId: string, worldId: string, updates: Partial<WorldData>) => void;
  deleteWorld: (bookId: string, versionId: string, worldId: string) => void;
  
  // Location operations
  getLocations: (bookId: string, versionId: string, worldId: string) => Location[];
  getLocation: (bookId: string, versionId: string, worldId: string, locationId: string) => Location | null;
  createLocation: (bookId: string, versionId: string, worldId: string, locationData: Omit<Location, 'id' | 'parentWorldId'>) => Promise<Location>;
  updateLocation: (bookId: string, versionId: string, worldId: string, locationId: string, updates: Partial<Location>) => void;
  deleteLocation: (bookId: string, versionId: string, worldId: string, locationId: string) => void;
  
  // World Object operations
  getWorldObjects: (bookId: string, versionId: string, worldId: string) => WorldObject[];
  getWorldObject: (bookId: string, versionId: string, worldId: string, objectId: string) => WorldObject | null;
  createWorldObject: (bookId: string, versionId: string, worldId: string, objectData: Omit<WorldObject, 'id' | 'parentWorldId'>) => Promise<WorldObject>;
  updateWorldObject: (bookId: string, versionId: string, worldId: string, objectId: string, updates: Partial<WorldObject>) => void;
  deleteWorldObject: (bookId: string, versionId: string, worldId: string, objectId: string) => void;
  
  // Lore operations
  getLore: (bookId: string, versionId: string, worldId: string) => Lore[];
  getLoreItem: (bookId: string, versionId: string, worldId: string, loreId: string) => Lore | null;
  createLore: (bookId: string, versionId: string, worldId: string, loreData: Omit<Lore, 'id' | 'parentWorldId'>) => Promise<Lore>;
  updateLore: (bookId: string, versionId: string, worldId: string, loreId: string, updates: Partial<Lore>) => void;
  deleteLore: (bookId: string, versionId: string, worldId: string, loreId: string) => void;
  
  // Magic System operations
  getMagicSystems: (bookId: string, versionId: string, worldId: string) => MagicSystem[];
  getMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemId: string) => MagicSystem | null;
  createMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemData: Omit<MagicSystem, 'id' | 'parentWorldId'>) => Promise<MagicSystem>;
  updateMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemId: string, updates: Partial<MagicSystem>) => void;
  deleteMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemId: string) => void;
  
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
          const normalizedBook = normalizeBook(cloudBook);
          normalizedBook.revCloud = cloudBook.revCloud || cloudBook.revLocal;
          normalizedBook.syncState = 'idle';
          await putBook(normalizedBook);
          syncedBooks.push(normalizedBook);
          await logSyncDecision(bookId, 'pulled_new', {});

        } else if (localBook && !cloudBook) {
          // Local-only book - push if dirty
          if (localBook.syncState === 'dirty') {
            await pushBookToCloud(localBook);
          }
          syncedBooks.push(localBook);

        } else if (localBook && cloudBook) {
          // Both exist - determine sync action
          const action = determineSyncAction(localBook, cloudBook);
          
          switch (action) {
            case 'push':
              const pushedBook = await pushBookToCloud(localBook);
              syncedBooks.push(pushedBook);
              await logSyncDecision(bookId, 'pushed', {});
              break;

            case 'pull':
              const mergedBook = mergeBookLocalAndCloud(localBook, cloudBook);
              await putBook(mergedBook);
              syncedBooks.push(mergedBook);
              await logSyncDecision(bookId, 'pulled', {});
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
      const tokenGetter = createTokenGetter();
      const result = await apiClient.updateBook(book.id, book, tokenGetter);
      
      const updatedBook = {
        ...book,
        revCloud: result.revCloud || result.revLocal || book.revLocal,
        syncState: 'idle' as const,
        conflictState: 'none' as const
      };

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
      const newBook = normalizeBook({
        ...bookData,
        authorId: bookData.authorId || user?.id,
        id: crypto.randomUUID()
      });

      await createBookDAL(newBook);
      setBooks(prev => [...prev, newBook]);

      await appLog.success('book-context', 'Book created', { bookId: newBook.id });
      return newBook;
    } catch (error) {
      await appLog.error('book-context', 'Failed to create book', { error });
      throw error;
    }
  };

  const deleteBook = async (bookId: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      await deleteBookDAL(bookId, user.id);
      setBooks(prev => prev.filter(book => book.id !== bookId));
      await appLog.success('book-context', 'Book deleted', { bookId });
    } catch (error) {
      await appLog.error('book-context', 'Failed to delete book', { bookId, error });
      throw error;
    }
  };

  // Version operations
  const getVersion = (bookId: string, versionId: string): Version | null => {
    const book = getBook(bookId);
    return book?.versions.find(v => v.id === versionId) || null;
  };

  const updateVersion = (bookId: string, versionId: string, updates: Partial<Version>): void => {
    const book = getBook(bookId);
    if (!book) return;

    const updatedBook = updateVersionInBook(book, versionId, updates);
    putBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
  };

  const createVersion = async (bookId: string, versionData: Omit<Version, 'id'>): Promise<Version> => {
    const book = getBook(bookId);
    if (!book) throw new Error(`Book not found: ${bookId}`);

    const updatedBook = addVersionToBook(book, versionData);
    const newVersion = updatedBook.versions[updatedBook.versions.length - 1];

    await putBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));

    return newVersion;
  };

  const deleteVersion = async (bookId: string, versionId: string): Promise<void> => {
    const book = getBook(bookId);
    if (!book) throw new Error(`Book not found: ${bookId}`);

    const updatedBook = removeVersionFromBook(book, versionId);
    await putBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
  };

  // Sync operations
  const syncBook = async (bookId: string): Promise<void> => {
    if (!navigator.onLine) {
      throw new Error('Cannot sync: offline');
    }

    const book = getBook(bookId);
    if (!book) {
      throw new Error(`Book not found: ${bookId}`);
    }

    try {
      const tokenGetter = createTokenGetter();
      const cloudBook = await apiClient.getBook(bookId, tokenGetter);
      
      if (!cloudBook) {
        // Book doesn't exist on cloud - push it
        await pushBookToCloud(book);
        return;
      }

      const action = determineSyncAction(book, cloudBook);
      
      switch (action) {
        case 'push':
          await pushBookToCloud(book);
          break;
        case 'pull':
          const mergedBook = mergeBookLocalAndCloud(book, cloudBook);
          await putBook(mergedBook);
          setBooks(prev => prev.map(b => b.id === bookId ? mergedBook : b));
          break;
        case 'conflict':
          const conflictBook = { ...book, conflictState: 'needs_review' as const };
          await putBook(conflictBook);
          setBooks(prev => prev.map(b => b.id === bookId ? conflictBook : b));
          break;
      }
    } catch (error) {
      await appLog.error('book-context', 'Failed to sync book', { bookId, error });
      throw error;
    }
  };

  const syncAllBooks = async (): Promise<void> => {
    if (!navigator.onLine) {
      throw new Error('Cannot sync: offline');
    }

    const dirtyBooks = getDirtyBooks(books);
    
    for (const book of dirtyBooks) {
      try {
        await syncBook(book.id);
      } catch (error) {
        await appLog.error('book-context', 'Failed to sync book in batch', { bookId: book.id, error });
        // Continue with other books
      }
    }
  };

  const resolveConflict = async (bookId: string, resolution: 'local' | 'cloud' | 'merge'): Promise<void> => {
    const book = getBook(bookId);
    if (!book) {
      throw new Error(`Book not found: ${bookId}`);
    }

    try {
      const tokenGetter = createTokenGetter();
      const cloudBook = await apiClient.getBook(bookId, tokenGetter);
      
      if (!cloudBook) {
        throw new Error('Cloud book not found for conflict resolution');
      }

      const resolvedBook = resolveBookConflict(book, cloudBook, resolution);
      
      if (resolution === 'local' || resolution === 'merge') {
        // Push resolved version to cloud
        await pushBookToCloud(resolvedBook);
      }

      await putBook(resolvedBook);
      setBooks(prev => prev.map(b => b.id === bookId ? resolvedBook : b));

      await appLog.success('book-context', 'Conflict resolved', { bookId, resolution });
    } catch (error) {
      await appLog.error('book-context', 'Failed to resolve conflict', { bookId, resolution, error });
      throw error;
    }
  };

  // Helper functions for UI
  const getDirtyBooksHelper = (): Book[] => getDirtyBooks(books);
  const getConflictedBooksHelper = (): Book[] => getConflictedBooks(books);

  const generateId = (): string => crypto.randomUUID();

  const refreshData = (): void => {
    if (isAuthenticated && user?.id) {
      loadBooks();
    }
  };

  // Placeholder implementations for version-specific data operations
  // These would need to be implemented based on your specific requirements
  const getCharacters = (bookId: string, versionId: string): Character[] => {
    const version = getVersion(bookId, versionId);
    return version?.characters || [];
  };

  const getCharacter = (bookId: string, versionId: string, characterId: string): Character | null => {
    const characters = getCharacters(bookId, versionId);
    return characters.find(c => c.id === characterId) || null;
  };

  const createCharacter = async (bookId: string, versionId: string, characterData: Omit<Character, 'id'>): Promise<Character> => {
    const newCharacter: Character = {
      ...characterData,
      id: generateId()
    };

    const version = getVersion(bookId, versionId);
    if (!version) throw new Error('Version not found');

    const updatedCharacters = [...(version.characters || []), newCharacter];
    updateVersion(bookId, versionId, { characters: updatedCharacters });

    return newCharacter;
  };

  const updateCharacter = (bookId: string, versionId: string, characterId: string, updates: Partial<Character>): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedCharacters = (version.characters || []).map(char => 
      char.id === characterId ? { ...char, ...updates } : char
    );
    updateVersion(bookId, versionId, { characters: updatedCharacters });
  };

  const deleteCharacter = (bookId: string, versionId: string, characterId: string): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedCharacters = (version.characters || []).filter(char => char.id !== characterId);
    updateVersion(bookId, versionId, { characters: updatedCharacters });
  };

  // Similar implementations for other data types (PlotArcs, Worlds, etc.)
  // For brevity, I'm providing simplified versions that follow the same pattern

  const getPlotArcs = (bookId: string, versionId: string): PlotArc[] => {
    const version = getVersion(bookId, versionId);
    return version?.plotArcs || [];
  };

  const getPlotArc = (bookId: string, versionId: string, plotArcId: string): PlotArc | null => {
    const plotArcs = getPlotArcs(bookId, versionId);
    return plotArcs.find(p => p.id === plotArcId) || null;
  };

  const createPlotArc = async (bookId: string, versionId: string, plotArcData: Omit<PlotArc, 'id'>): Promise<PlotArc> => {
    const newPlotArc: PlotArc = { ...plotArcData, id: generateId() };
    const version = getVersion(bookId, versionId);
    if (!version) throw new Error('Version not found');

    const updatedPlotArcs = [...(version.plotArcs || []), newPlotArc];
    updateVersion(bookId, versionId, { plotArcs: updatedPlotArcs });
    return newPlotArc;
  };

  const updatePlotArc = (bookId: string, versionId: string, plotArcId: string, updates: Partial<PlotArc>): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedPlotArcs = (version.plotArcs || []).map(arc => 
      arc.id === plotArcId ? { ...arc, ...updates } : arc
    );
    updateVersion(bookId, versionId, { plotArcs: updatedPlotArcs });
  };

  const deletePlotArc = (bookId: string, versionId: string, plotArcId: string): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedPlotArcs = (version.plotArcs || []).filter(arc => arc.id !== plotArcId);
    updateVersion(bookId, versionId, { plotArcs: updatedPlotArcs });
  };

  const getPlotCanvas = (bookId: string, versionId: string): { nodes: NarrativeFlowNode[]; edges: NarrativeEdge[] } | null => {
    const version = getVersion(bookId, versionId);
    return version?.plotCanvas || null;
  };

  const updatePlotCanvas = (bookId: string, versionId: string, plotCanvas: { nodes: NarrativeFlowNode[]; edges: NarrativeEdge[] }): void => {
    updateVersion(bookId, versionId, { plotCanvas });
  };

  // World operations
  const getWorlds = (bookId: string, versionId: string): WorldData[] => {
    const version = getVersion(bookId, versionId);
    return version?.worlds || [];
  };

  const getWorld = (bookId: string, versionId: string, worldId: string): WorldData | null => {
    const worlds = getWorlds(bookId, versionId);
    return worlds.find(w => w.id === worldId) || null;
  };

  const createWorld = async (bookId: string, versionId: string, worldData: Omit<WorldData, 'id'>): Promise<WorldData> => {
    const newWorld: WorldData = { ...worldData, id: generateId() };
    const version = getVersion(bookId, versionId);
    if (!version) throw new Error('Version not found');

    const updatedWorlds = [...(version.worlds || []), newWorld];
    updateVersion(bookId, versionId, { worlds: updatedWorlds });
    return newWorld;
  };

  const updateWorld = (bookId: string, versionId: string, worldId: string, updates: Partial<WorldData>): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedWorlds = (version.worlds || []).map(world => 
      world.id === worldId ? { ...world, ...updates } : world
    );
    updateVersion(bookId, versionId, { worlds: updatedWorlds });
  };

  const deleteWorld = (bookId: string, versionId: string, worldId: string): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedWorlds = (version.worlds || []).filter(world => world.id !== worldId);
    updateVersion(bookId, versionId, { worlds: updatedWorlds });
  };

  // Placeholder implementations for other operations
  // These would need proper implementation based on your data structure
  const getLocations = (bookId: string, versionId: string, worldId: string): Location[] => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.locations || [];
  };

  const getLocation = (bookId: string, versionId: string, worldId: string, locationId: string): Location | null => {
    const locations = getLocations(bookId, versionId, worldId);
    return locations.find(l => l.id === locationId) || null;
  };

  const createLocation = async (bookId: string, versionId: string, worldId: string, locationData: Omit<Location, 'id' | 'parentWorldId'>): Promise<Location> => {
    const newLocation: Location = { 
      ...locationData, 
      id: generateId(),
      parentWorldId: worldId
    };

    const world = getWorld(bookId, versionId, worldId);
    if (!world) throw new Error('World not found');

    const updatedLocations = [...(world.locations || []), newLocation];
    updateWorld(bookId, versionId, worldId, { locations: updatedLocations });
    return newLocation;
  };

  const updateLocation = (bookId: string, versionId: string, worldId: string, locationId: string, updates: Partial<Location>): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedLocations = (world.locations || []).map(loc => 
      loc.id === locationId ? { ...loc, ...updates } : loc
    );
    updateWorld(bookId, versionId, worldId, { locations: updatedLocations });
  };

  const deleteLocation = (bookId: string, versionId: string, worldId: string, locationId: string): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedLocations = (world.locations || []).filter(loc => loc.id !== locationId);
    updateWorld(bookId, versionId, worldId, { locations: updatedLocations });
  };

  // Similar patterns for WorldObjects, Lore, MagicSystems...
  // Implementing stubs for now to maintain API compatibility

  const getWorldObjects = (bookId: string, versionId: string, worldId: string): WorldObject[] => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.objects || [];
  };

  const getWorldObject = (bookId: string, versionId: string, worldId: string, objectId: string): WorldObject | null => {
    const objects = getWorldObjects(bookId, versionId, worldId);
    return objects.find(o => o.id === objectId) || null;
  };

  const createWorldObject = async (bookId: string, versionId: string, worldId: string, objectData: Omit<WorldObject, 'id' | 'parentWorldId'>): Promise<WorldObject> => {
    const newObject: WorldObject = { 
      ...objectData, 
      id: generateId(),
      parentWorldId: worldId
    };

    const world = getWorld(bookId, versionId, worldId);
    if (!world) throw new Error('World not found');

    const updatedObjects = [...(world.objects || []), newObject];
    updateWorld(bookId, versionId, worldId, { objects: updatedObjects });
    return newObject;
  };

  const updateWorldObject = (bookId: string, versionId: string, worldId: string, objectId: string, updates: Partial<WorldObject>): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedObjects = (world.objects || []).map(obj => 
      obj.id === objectId ? { ...obj, ...updates } : obj
    );
    updateWorld(bookId, versionId, worldId, { objects: updatedObjects });
  };

  const deleteWorldObject = (bookId: string, versionId: string, worldId: string, objectId: string): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedObjects = (world.objects || []).filter(obj => obj.id !== objectId);
    updateWorld(bookId, versionId, worldId, { objects: updatedObjects });
  };

  const getLore = (bookId: string, versionId: string, worldId: string): Lore[] => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.lore || [];
  };

  const getLoreItem = (bookId: string, versionId: string, worldId: string, loreId: string): Lore | null => {
    const lore = getLore(bookId, versionId, worldId);
    return lore.find(l => l.id === loreId) || null;
  };

  const createLore = async (bookId: string, versionId: string, worldId: string, loreData: Omit<Lore, 'id' | 'parentWorldId'>): Promise<Lore> => {
    const newLore: Lore = { 
      ...loreData, 
      id: generateId(),
      parentWorldId: worldId
    };

    const world = getWorld(bookId, versionId, worldId);
    if (!world) throw new Error('World not found');

    const updatedLore = [...(world.lore || []), newLore];
    updateWorld(bookId, versionId, worldId, { lore: updatedLore });
    return newLore;
  };

  const updateLore = (bookId: string, versionId: string, worldId: string, loreId: string, updates: Partial<Lore>): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedLore = (world.lore || []).map(loreItem => 
      loreItem.id === loreId ? { ...loreItem, ...updates } : loreItem
    );
    updateWorld(bookId, versionId, worldId, { lore: updatedLore });
  };

  const deleteLore = (bookId: string, versionId: string, worldId: string, loreId: string): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedLore = (world.lore || []).filter(loreItem => loreItem.id !== loreId);
    updateWorld(bookId, versionId, worldId, { lore: updatedLore });
  };

  const getMagicSystems = (bookId: string, versionId: string, worldId: string): MagicSystem[] => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.magicSystems || [];
  };

  const getMagicSystem = (bookId: string, versionId: string, worldId: string, magicSystemId: string): MagicSystem | null => {
    const magicSystems = getMagicSystems(bookId, versionId, worldId);
    return magicSystems.find(m => m.id === magicSystemId) || null;
  };

  const createMagicSystem = async (bookId: string, versionId: string, worldId: string, magicSystemData: Omit<MagicSystem, 'id' | 'parentWorldId'>): Promise<MagicSystem> => {
    const newMagicSystem: MagicSystem = { 
      ...magicSystemData, 
      id: generateId(),
      parentWorldId: worldId
    };

    const world = getWorld(bookId, versionId, worldId);
    if (!world) throw new Error('World not found');

    const updatedMagicSystems = [...(world.magicSystems || []), newMagicSystem];
    updateWorld(bookId, versionId, worldId, { magicSystems: updatedMagicSystems });
    return newMagicSystem;
  };

  const updateMagicSystem = (bookId: string, versionId: string, worldId: string, magicSystemId: string, updates: Partial<MagicSystem>): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedMagicSystems = (world.magicSystems || []).map(system => 
      system.id === magicSystemId ? { ...system, ...updates } : system
    );
    updateWorld(bookId, versionId, worldId, { magicSystems: updatedMagicSystems });
  };

  const deleteMagicSystem = (bookId: string, versionId: string, worldId: string, magicSystemId: string): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (!world) return;

    const updatedMagicSystems = (world.magicSystems || []).filter(system => system.id !== magicSystemId);
    updateWorld(bookId, versionId, worldId, { magicSystems: updatedMagicSystems });
  };

  // Placeholder implementations for scene and chapter operations
  // These would need integration with your encryption service
  const getSceneContent = async (sceneId: string): Promise<string | null> => {
    // TODO: Implement with encryption service
    await appLog.warn('book-context', 'getSceneContent not yet implemented', { sceneId });
    return null;
  };

  const updateSceneContent = async (sceneId: string, _content: string): Promise<void> => {
    // TODO: Implement with encryption service
    await appLog.warn('book-context', 'updateSceneContent not yet implemented', { sceneId });
  };

  const createScene = async (bookId: string, versionId: string, chapterId: string, title: string, _content?: string): Promise<Scene> => {
    // TODO: Implement with encryption service
    await appLog.warn('book-context', 'createScene not yet implemented', { bookId, versionId, chapterId });
    return {
      id: generateId(),
      title,
      encScheme: 'udek',
      syncState: 'idle',
      conflictState: 'none',
      updatedAt: now(),
      wordCount: 0
    };
  };

  const getBookScenes = async (bookId: string): Promise<Scene[]> => {
    // TODO: Implement with encryption service
    await appLog.warn('book-context', 'getBookScenes not yet implemented', { bookId });
    return [];
  };

  const getChapterContent = async (chapterId: string): Promise<any> => {
    // TODO: Implement with encryption service
    await appLog.warn('book-context', 'getChapterContent not yet implemented', { chapterId });
    return null;
  };

  const saveChapterContentLocal = async (chapterId: string, bookId: string, versionId: string, _content: any): Promise<void> => {
    // TODO: Implement with encryption service
    await appLog.warn('book-context', 'saveChapterContentLocal not yet implemented', { chapterId, bookId, versionId });
  };

  const getChaptersByVersion = async (bookId: string, versionId: string): Promise<Chapter[]> => {
    // TODO: Implement with encryption service
    await appLog.warn('book-context', 'getChaptersByVersion not yet implemented', { bookId, versionId });
    return [];
  };

  const syncChapters = async (): Promise<void> => {
    // TODO: Implement chapter sync
    await appLog.warn('book-context', 'syncChapters not yet implemented');
  };

  const createSampleData = async (): Promise<void> => {
    // TODO: Implement sample data creation
    await appLog.warn('book-context', 'createSampleData not yet implemented');
  };

  const value: BookContextType = {
    // State
    books,
    authoredBooks,
    editableBooks,
    reviewableBooks,
    loading,
    error,
    selectedWorldId,
    setSelectedWorldId,

    // Book operations
    getBook,
    updateBook,
    createBook,
    deleteBook,

    // Version operations
    getVersion,
    updateVersion,
    createVersion,
    deleteVersion,

    // Character operations
    getCharacters,
    getCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,

    // Plot Arc operations
    getPlotArcs,
    getPlotArc,
    createPlotArc,
    updatePlotArc,
    deletePlotArc,

    // Plot Canvas operations
    getPlotCanvas,
    updatePlotCanvas,

    // World operations
    getWorlds,
    getWorld,
    createWorld,
    updateWorld,
    deleteWorld,

    // Location operations
    getLocations,
    getLocation,
    createLocation,
    updateLocation,
    deleteLocation,

    // World Object operations
    getWorldObjects,
    getWorldObject,
    createWorldObject,
    updateWorldObject,
    deleteWorldObject,

    // Lore operations
    getLore,
    getLoreItem,
    createLore,
    updateLore,
    deleteLore,

    // Magic System operations
    getMagicSystems,
    getMagicSystem,
    createMagicSystem,
    updateMagicSystem,
    deleteMagicSystem,

    // Scene operations
    getSceneContent,
    updateSceneContent,
    createScene,
    getBookScenes,

    // Chapter operations
    getChapterContent,
    saveChapterContentLocal,
    getChaptersByVersion,

    // Sync operations
    syncBook,
    syncAllBooks,
    syncChapters,
    resolveConflict,
    getDirtyBooks: getDirtyBooksHelper,
    getConflictedBooks: getConflictedBooksHelper,

    // Utility methods
    generateId,
    refreshData,
    createSampleData
  };

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
};

export default BookContext;
