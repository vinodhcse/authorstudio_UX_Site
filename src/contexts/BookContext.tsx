import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Book, Version, Character, PlotArc, Scene } from '../types';
import { WorldData, Location, WorldObject, Lore, MagicSystem } from '../pages/BookForge/components/planning/types/WorldBuildingTypes';
import { appLog } from '../auth/fileLogger';
import { 
  getUserBooks, 
  getBook as getBookFromDB,
  getScenesByBook,
  getScene,
  putBook,
  deleteBook as deleteBookFromDB,
  BookRow,
  BookMetadata
} from '../data/dal';
import { useAuthStore } from '../auth/useAuthStore';
import { encryptionService } from '../services/encryptionService';
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

export interface WorldBuildingElement {
  id: string;
  type: 'LOCATION' | 'CULTURE' | 'RELIGION' | 'TECHNOLOGY' | 'MAGIC_SYSTEM' | 'ORGANIZATION' | 'EVENT' | 'OTHER';
  title: string;
  description: string;
  details: {
    geography?: string;
    history?: string;
    politics?: string;
    economy?: string;
    culture?: string;
    religion?: string;
    technology?: string;
    magic?: string;
    relationships?: string[];
  };
  relatedElements: string[]; // IDs of related elements
  relatedCharacters: string[]; // character IDs
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Context interface
interface BookContextType {
  // Current state
  books: Book[]; // All books (for backward compatibility)
  authoredBooks: Book[]; // Books user owns
  editableBooks: Book[]; // Books user can edit (collaboration)
  reviewableBooks: Book[]; // Books user can review (collaboration)
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
  
  // Character operations
  getCharacters: (bookId: string, versionId: string) => Character[];
  getCharacter: (bookId: string, versionId: string, characterId: string) => Character | null;
  createCharacter: (bookId: string, versionId: string, characterData: Omit<Character, 'id'>) => Character;
  updateCharacter: (bookId: string, versionId: string, characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (bookId: string, versionId: string, characterId: string) => void;
  
  // Plot Arc operations
  getPlotArcs: (bookId: string, versionId: string) => PlotArc[];
  getPlotArc: (bookId: string, versionId: string, plotArcId: string) => PlotArc | null;
  createPlotArc: (bookId: string, versionId: string, plotArcData: Omit<PlotArc, 'id'>) => PlotArc;
  updatePlotArc: (bookId: string, versionId: string, plotArcId: string, updates: Partial<PlotArc>) => void;
  deletePlotArc: (bookId: string, versionId: string, plotArcId: string) => void;
  
  // World operations
  getWorlds: (bookId: string, versionId: string) => WorldData[];
  getWorld: (bookId: string, versionId: string, worldId: string) => WorldData | null;
  createWorld: (bookId: string, versionId: string, worldData: Omit<WorldData, 'id'>) => WorldData;
  updateWorld: (bookId: string, versionId: string, worldId: string, updates: Partial<WorldData>) => void;
  deleteWorld: (bookId: string, versionId: string, worldId: string) => void;
  
  // Location operations
  getLocations: (bookId: string, versionId: string, worldId: string) => Location[];
  getLocation: (bookId: string, versionId: string, worldId: string, locationId: string) => Location | null;
  createLocation: (bookId: string, versionId: string, worldId: string, locationData: Omit<Location, 'id' | 'parentWorldId'>) => Location;
  updateLocation: (bookId: string, versionId: string, worldId: string, locationId: string, updates: Partial<Location>) => void;
  deleteLocation: (bookId: string, versionId: string, worldId: string, locationId: string) => void;
  
  // World Object operations
  getWorldObjects: (bookId: string, versionId: string, worldId: string) => WorldObject[];
  getWorldObject: (bookId: string, versionId: string, worldId: string, objectId: string) => WorldObject | null;
  createWorldObject: (bookId: string, versionId: string, worldId: string, objectData: Omit<WorldObject, 'id' | 'parentWorldId'>) => WorldObject;
  updateWorldObject: (bookId: string, versionId: string, worldId: string, objectId: string, updates: Partial<WorldObject>) => void;
  deleteWorldObject: (bookId: string, versionId: string, worldId: string, objectId: string) => void;
  
  // Lore operations
  getLore: (bookId: string, versionId: string, worldId: string) => Lore[];
  getLoreItem: (bookId: string, versionId: string, worldId: string, loreId: string) => Lore | null;
  createLore: (bookId: string, versionId: string, worldId: string, loreData: Omit<Lore, 'id' | 'parentWorldId'>) => Lore;
  updateLore: (bookId: string, versionId: string, worldId: string, loreId: string, updates: Partial<Lore>) => void;
  deleteLore: (bookId: string, versionId: string, worldId: string, loreId: string) => void;
  
  // Magic System operations
  getMagicSystems: (bookId: string, versionId: string, worldId: string) => MagicSystem[];
  getMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemId: string) => MagicSystem | null;
  createMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemData: Omit<MagicSystem, 'id' | 'parentWorldId'>) => MagicSystem;
  updateMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemId: string, updates: Partial<MagicSystem>) => void;
  deleteMagicSystem: (bookId: string, versionId: string, worldId: string, magicSystemId: string) => void;
  
  // Scene operations (encrypted content)
  getSceneContent: (sceneId: string) => Promise<string | null>;
  updateSceneContent: (sceneId: string, content: string) => Promise<void>;
  createScene: (bookId: string, versionId: string, chapterId: string, title: string, content?: string) => Promise<Scene>;
  getBookScenes: (bookId: string) => Promise<Scene[]>;
  
  // Book CRUD operations
  createBook: (bookData: Omit<Book, 'id'>) => Promise<Book>;
  deleteBook: (bookId: string) => Promise<void>;
  
  // Sync operations
  syncBook: (bookId: string) => Promise<void>;
  syncAllBooks: () => Promise<void>;
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
    throw new Error('useBookContext must be used within a BookContextProvider');
  }
  return context;
};

interface BookContextProviderProps {
  children: ReactNode;
}

export const BookContextProvider: React.FC<BookContextProviderProps> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [authoredBooks, setAuthoredBooks] = useState<Book[]>([]);
  const [editableBooks, setEditableBooks] = useState<Book[]>([]);
  const [reviewableBooks, setReviewableBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // World Building UI state
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);

  // Helper function to convert BookRow to Book with decryption
  const convertBookRowToBook = async (bookRow: BookRow, user: any): Promise<Book> => {
    // Initialize with basic data
    const book: Book = {
      id: bookRow.book_id,
      title: bookRow.title,
      author: user.name,
      description: '',
      synopsis: '',
      lastModified: new Date(bookRow.updated_at || Date.now()).toISOString(),
      progress: 0,
      wordCount: 0,
      genre: 'Fiction',
      collaboratorCount: 0,
      collaborators: [],
      characters: [],
      featured: false,
      bookType: 'Novel',
      prose: 'Fiction',
      language: 'English',
      publisher: '',
      publishedStatus: 'Unpublished' as const,
      versions: [],
      activity: [],
      isShared: Boolean(bookRow.is_shared),
      syncState: bookRow.sync_state as any,
      conflictState: bookRow.conflict_state as any,
      revLocal: bookRow.rev_local,
      revCloud: bookRow.rev_cloud,
      updatedAt: bookRow.updated_at,
    };

    // Try to decrypt metadata if available
    if (bookRow.enc_metadata && encryptionService.isInitialized()) {
      try {
        // Convert metadata from storage format if needed
        let metadataBytes: Uint8Array;
        const rawMetadata = bookRow.enc_metadata as any; // SQLite may return as string
        
        if (typeof rawMetadata === 'string') {
          // Handle JSON string format from SQLite
          if (rawMetadata.startsWith('[') && rawMetadata.endsWith(']')) {
            const arrayData = JSON.parse(rawMetadata);
            metadataBytes = new Uint8Array(arrayData);
          } else {
            throw new Error('Invalid metadata format');
          }
        } else if (rawMetadata instanceof Uint8Array) {
          metadataBytes = rawMetadata;
        } else if (Array.isArray(rawMetadata)) {
          metadataBytes = new Uint8Array(rawMetadata);
        } else {
          throw new Error('Unsupported metadata type');
        }

        // Get the appropriate encryption key
        const bookKey = await encryptionService.getBookKey(
          user.id, 
          bookRow.book_id, 
          Boolean(bookRow.is_shared)
        );

        // Decrypt the metadata (need to extract IV from the first 12 bytes)
        const iv = metadataBytes.slice(0, 12);
        const encryptedData = metadataBytes.slice(12);
        
        // Convert to base64 strings for the decryption function
        const { uint8ArrayToBase64 } = await import('../crypto/aes');
        const contentEnc = uint8ArrayToBase64(encryptedData);
        const contentIv = uint8ArrayToBase64(iv);
        
        const { decryptSceneContent } = await import('../crypto/aes');
        const decryptedMetadata = await decryptSceneContent(contentEnc, contentIv, bookKey);
        const metadata = JSON.parse(decryptedMetadata);

        // Merge decrypted metadata
        Object.assign(book, {
          description: metadata.description || '',
          synopsis: metadata.synopsis || '',
          genre: metadata.genre || 'Fiction',
          subgenre: metadata.subgenre || '',
          bookType: metadata.bookType || 'Novel',
          prose: metadata.prose || 'Fiction',
          language: metadata.language || 'English',
          publisher: metadata.publisher || '',
          publishedStatus: metadata.publishedStatus || 'Unpublished',
          publisherLink: metadata.publisherLink || '',
          printISBN: metadata.printISBN || '',
          ebookISBN: metadata.ebookISBN || '',
        });

        await appLog.info('book-context', 'Decrypted book metadata', { bookId: bookRow.book_id });
      } catch (error) {
        await appLog.warn('book-context', 'Failed to decrypt book metadata, using defaults', { 
          bookId: bookRow.book_id, 
          error 
        });
      }
    }

    return book;
  };

  // Helper function to convert cloud book data to our Book format
  const convertCloudBookToBook = async (cloudBook: any, stateUser: any): Promise<Book> => {
    const book: Book = {
      id: cloudBook.id,
      title: cloudBook.title,
      author: cloudBook.authorName || cloudBook.author || stateUser.name,
      authorId: cloudBook.authorId,
      description: cloudBook.description || '',
      synopsis: cloudBook.synopsis || '',
      lastModified: cloudBook.lastModified || cloudBook.updatedAt || new Date().toISOString(),
      progress: cloudBook.progress || 0,
      wordCount: cloudBook.wordCount || 0,
      genre: cloudBook.genre || 'Fiction',
      subgenre: cloudBook.subgenre || cloudBook.subGenre || '',
      collaboratorCount: cloudBook.collaborators?.length || 0,
      collaborators: cloudBook.collaborators || [],
      characters: cloudBook.characters || [],
      featured: cloudBook.featured || false,
      bookType: cloudBook.bookType || 'Novel',
      prose: cloudBook.prose || cloudBook.bookProse || 'Fiction',
      language: cloudBook.language || 'English',
      publisher: cloudBook.publisher || cloudBook.publisherName || '',
      publishedStatus: cloudBook.publishedStatus || 'Unpublished',
      publisherLink: cloudBook.publisherLink || '',
      printISBN: cloudBook.printISBN || '',
      ebookISBN: cloudBook.ebookISBN || '',
      versions: cloudBook.versions || [],
      activity: cloudBook.activity || [],
      isShared: (cloudBook.collaborators?.length || 0) > 0,
      syncState: 'idle', // Cloud books are already synced
      conflictState: 'none',
      revLocal: cloudBook.revCloud,
      revCloud: cloudBook.revCloud,
      updatedAt: new Date(cloudBook.updatedAt || cloudBook.lastModified || Date.now()).getTime(),
      coverImage: cloudBook.coverImage || cloudBook.bookImage,
    };
    return book;
  };

  // Subscribe to auth state changes to reload books when authentication changes
  const { isAuthenticated, user } = useAuthStore();

  // Initialize books data from encrypted storage and cloud
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const authState = useAuthStore.getState();
        const { user: stateUser, isAuthenticated: stateAuthenticated } = authState;
        
        await appLog.info('book-context', 'Loading books - auth state check', { 
          isAuthenticated: stateAuthenticated,
          hasUser: !!stateUser,
          userId: stateUser?.id || 'none',
          hookUser: user?.id || 'none',
          hookAuth: isAuthenticated
        });
        
        if (!stateAuthenticated || !stateUser) {
          await appLog.info('book-context', 'User not authenticated, loading empty state');
          setBooks([]);
          setLoading(false);
          return;
        }

        await appLog.info('book-context', 'Loading books for user', { userId: stateUser.id });
        
        // Initialize encryption service if not already initialized
        if (!encryptionService.isInitialized()) {
          try {
            // Check if user already has keys stored
            const { getUserKeys } = await import('../data/dal');
            const existingKeys = await getUserKeys(stateUser.id);
            
            if (existingKeys) {
              // User has existing keys - for now we'll skip encryption to avoid errors
              // In production, you'd prompt for the user's passphrase
              await appLog.info('book-context', 'User has existing encrypted keys, skipping encryption service initialization');
            } else {
              // New user - initialize with demo passphrase
              const passphrase = 'demo-passphrase-' + stateUser.id;
              await encryptionService.initialize(stateUser.id, passphrase);
              await appLog.info('book-context', 'Encryption service initialized for new user');
            }
          } catch (error) {
            await appLog.warn('book-context', 'Failed to initialize encryption service, will use plaintext fallback', { error });
          }
        }
        
        // Load books from local encrypted database
        const localBookRows = await getUserBooks(stateUser.id);
        await appLog.info('book-context', `Loaded ${localBookRows.length} books from local storage`);
        
        // Load books from cloud if online
        let cloudBooks: any = { authoredBooks: [], editableBooks: [], reviewableBooks: [] };
        if (navigator.onLine) {
          try {
            // Create a token getter function that uses the auth store
            const tokenGetter = createTokenGetter();
            
            cloudBooks = await apiClient.getUserBooks(tokenGetter);
            await appLog.info('book-context', `Loaded books from cloud`, { 
              authored: cloudBooks.authoredBooks?.length || 0,
              editable: cloudBooks.editableBooks?.length || 0,
              reviewable: cloudBooks.reviewableBooks?.length || 0
            });
          } catch (error) {
            await appLog.warn('book-context', 'Failed to load books from cloud, using local only', { error });
          }
        }
        
        // Create maps to track books by category
        const bookMap = new Map<string, Book>();
        const authoredBookIds = new Set<string>();
        const editableBookIds = new Set<string>();
        const reviewableBookIds = new Set<string>();
        
        // Process local books first (these are typically authored books)
        for (const bookRow of localBookRows) {
          const book = await convertBookRowToBook(bookRow, stateUser);
          bookMap.set(book.id, book);
          // Local books are typically authored by the user
          authoredBookIds.add(book.id);
        }
        
        // Process cloud authored books
        for (const cloudBook of (cloudBooks.authoredBooks || [])) {
          authoredBookIds.add(cloudBook.id);
          const existingLocalBook = bookMap.get(cloudBook.id);
          
          if (existingLocalBook) {
            // Check for conflicts before merging
            const cloudRevision = cloudBook.revCloud || cloudBook.rev_cloud || cloudBook.revision;
            if (cloudRevision) {
              await checkForConflicts(cloudBook.id, cloudRevision);
            }
            
            // Merge cloud data with local book
            const mergedBook: Book = {
              ...existingLocalBook,
              ...cloudBook,
              syncState: existingLocalBook.syncState === 'dirty' ? 'dirty' : 'idle',
              conflictState: existingLocalBook.conflictState,
              revCloud: cloudRevision,
            };
            bookMap.set(cloudBook.id, mergedBook);
          } else {
            // Cloud-only authored book
            const book = await convertCloudBookToBook(cloudBook, stateUser);
            bookMap.set(book.id, book);
          }
        }
        
        // Process cloud editable books
        for (const cloudBook of (cloudBooks.editableBooks || [])) {
          editableBookIds.add(cloudBook.id);
          const existingLocalBook = bookMap.get(cloudBook.id);
          
          if (existingLocalBook) {
            // Check for conflicts before merging
            const cloudRevision = cloudBook.revCloud || cloudBook.rev_cloud || cloudBook.revision;
            if (cloudRevision) {
              await checkForConflicts(cloudBook.id, cloudRevision);
            }
            
            // Merge cloud data with local book
            const mergedBook: Book = {
              ...existingLocalBook,
              ...cloudBook,
              syncState: existingLocalBook.syncState === 'dirty' ? 'dirty' : 'idle',
              conflictState: existingLocalBook.conflictState,
              revCloud: cloudRevision,
            };
            bookMap.set(cloudBook.id, mergedBook);
          } else {
            // Cloud-only editable book
            const book = await convertCloudBookToBook(cloudBook, stateUser);
            bookMap.set(book.id, book);
          }
        }
        
        // Process cloud reviewable books
        for (const cloudBook of (cloudBooks.reviewableBooks || [])) {
          reviewableBookIds.add(cloudBook.id);
          const existingLocalBook = bookMap.get(cloudBook.id);
          
          if (existingLocalBook) {
            // Check for conflicts before merging
            const cloudRevision = cloudBook.revCloud || cloudBook.rev_cloud || cloudBook.revision;
            if (cloudRevision) {
              await checkForConflicts(cloudBook.id, cloudRevision);
            }
            
            // Merge cloud data with local book
            const mergedBook: Book = {
              ...existingLocalBook,
              ...cloudBook,
              syncState: existingLocalBook.syncState === 'dirty' ? 'dirty' : 'idle',
              conflictState: existingLocalBook.conflictState,
              revCloud: cloudRevision,
            };
            bookMap.set(cloudBook.id, mergedBook);
          } else {
            // Cloud-only reviewable book
            const book = await convertCloudBookToBook(cloudBook, stateUser);
            bookMap.set(book.id, book);
          }
        }
        
        // Categorize books and set state
        const allBooks = Array.from(bookMap.values());
        const authored = allBooks.filter(book => authoredBookIds.has(book.id));
        const editable = allBooks.filter(book => editableBookIds.has(book.id));
        const reviewable = allBooks.filter(book => reviewableBookIds.has(book.id));
        
        setBooks(allBooks);
        setAuthoredBooks(authored);
        setEditableBooks(editable);
        setReviewableBooks(reviewable);
        setLoading(false);
        
        await appLog.success('book-context', `Loaded ${allBooks.length} total books`, {
          authored: authored.length,
          editable: editable.length, 
          reviewable: reviewable.length
        });
        
      } catch (err) {
        await appLog.error('book-context', 'Error loading books', err);
        setError('Failed to load books');
        setLoading(false);
      }
    };

    loadBooks();
  }, [isAuthenticated, user]); // Reload when auth state changes

  // Network status monitoring and auto-sync
  useEffect(() => {
    const handleOnline = async () => {
      await appLog.info('book-context', 'Network connection restored - attempting auto-sync');
      
      try {
        // Try to ensure we have a valid access token (this will restore auth state)
        const authState = useAuthStore.getState();
        if (authState.ensureAccessToken) {
          try {
            await authState.ensureAccessToken();
            await appLog.info('book-context', 'Access token ensured after coming online');
          } catch (tokenError) {
            await appLog.warn('book-context', 'Failed to ensure access token', { error: tokenError });
            return; // Don't attempt sync if auth failed
          }
        }
        
        // Check if we're authenticated now
        const updatedAuthState = useAuthStore.getState();
        if (!updatedAuthState.isAuthenticated || !updatedAuthState.user) {
          await appLog.warn('book-context', 'Cannot perform auto-sync - user not authenticated');
          return;
        }
        
        // Auto-sync dirty books
        const dirtyBooks = getDirtyBooks();
        if (dirtyBooks.length > 0) {
          await appLog.info('book-context', `Auto-syncing ${dirtyBooks.length} dirty books`);
          await syncAllBooks();
        }
      } catch (error) {
        await appLog.warn('book-context', 'Auto-sync failed after coming online', { error });
      }
    };

    const handleOffline = () => {
      appLog.info('book-context', 'Network connection lost - operating in offline mode');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Book operations
  const getBook = (id: string): Book | null => {
    return books.find(book => book.id === id) || null;
  };

  const updateBook = async (id: string, updates: Partial<Book>): Promise<void> => {
    try {
      const currentBook = getBook(id);
      if (!currentBook) {
        throw new Error('Book not found');
      }

      const updatedBook = { 
        ...currentBook, 
        ...updates, 
        lastModified: new Date().toISOString(),
        updatedAt: Date.now(),
        syncState: 'dirty' as const, // Immediately mark as dirty
        revLocal: generateRevision() // Generate new local revision
      };
      
      // Update local state first with dirty status
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === id ? updatedBook : book
        )
      );

      // Convert to database format and save
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const bookRow: BookRow = {
        book_id: updatedBook.id,
        owner_user_id: user.id,
        title: updatedBook.title,
        is_shared: updatedBook.isShared ? 1 : 0,
        sync_state: 'dirty',
        conflict_state: 'none',
        last_local_change: Date.now(),
        updated_at: Date.now(),
        rev_local: updatedBook.revLocal,
        rev_cloud: updatedBook.revCloud
      };

      await putBook(bookRow);

      // Try to sync to cloud if online and authenticated
      if (navigator.onLine) {
        try {
          // Check authentication state first
          const authState = useAuthStore.getState();
          if (!authState.isAuthenticated || !authState.user) {
            await appLog.warn('book-context', 'Skipping cloud sync - user not authenticated', { 
              isAuthenticated: authState.isAuthenticated,
              hasUser: !!authState.user
            });
            // Keep the book as dirty for later sync
            return;
          }
          
          const { ensureAccessToken } = authState;
          await ensureAccessToken();
          
          await apiClient.updateBook(id, updatedBook, createTokenGetter());
          
          // Update sync state to indicate successful cloud sync
          bookRow.sync_state = 'idle';
          await putBook(bookRow);
          
          // Update local state with synced status
          setBooks(prevBooks => 
            prevBooks.map(book => 
              book.id === id ? { ...book, syncState: 'idle' } : book
            )
          );
          
          await appLog.info('book-context', 'Book synced to cloud successfully', { bookId: id });
        } catch (cloudError) {
          await appLog.warn('book-context', 'Failed to sync book to cloud, will retry later', { bookId: id, error: cloudError });
          // Book remains dirty in both local state and database
        }
      } else {
        await appLog.info('book-context', 'Offline mode - book marked as dirty for later sync', { bookId: id });
      }

      await appLog.success('book-context', 'Book updated successfully', { bookId: id });
    } catch (error) {
      console.error('Failed to update book:', error);
      await appLog.error('book-context', 'Failed to update book', { bookId: id, error });
      throw error;
    }
  };

  // Version operations
  const getVersion = (bookId: string, versionId: string): Version | null => {
    const book = getBook(bookId);
    return book?.versions?.find((version: Version) => version.id === versionId) || null;
  };

  const updateVersion = (bookId: string, versionId: string, updates: Partial<Version>): void => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? {
              ...book,
              versions: book.versions?.map((version: Version) =>
                version.id === versionId ? { ...version, ...updates } : version
              ) || []
            }
          : book
      )
    );
  };

  const createVersion = async (bookId: string, versionData: Omit<Version, 'id'>): Promise<Version> => {
    const newVersion: Version = {
      ...versionData,
      id: generateId(),
    };

    const currentBook = getBook(bookId);
    if (!currentBook) {
      throw new Error('Book not found');
    }

    const updatedVersions = [...(currentBook.versions || []), newVersion];
    await updateBook(bookId, { versions: updatedVersions });

    // Try to sync to cloud if online
    if (navigator.onLine) {
      try {
        // Check authentication state before attempting sync
        const authState = useAuthStore.getState();
        if (!authState.isAuthenticated || !authState.user) {
          await appLog.warn('book-context', 'Skipping cloud sync for version - user not authenticated', { 
            isAuthenticated: authState.isAuthenticated,
            hasUser: !!authState.user
          });
          return newVersion;
        }
        
        await apiClient.createVersion(bookId, versionData, createTokenGetter());
        await appLog.info('book-context', 'Version synced to cloud successfully', { bookId, versionId: newVersion.id });
      } catch (cloudError) {
        await appLog.warn('book-context', 'Failed to sync version to cloud, will retry later', { bookId, versionId: newVersion.id, error: cloudError });
      }
    }

    return newVersion;
  };

  // Character operations
  const getCharacters = (bookId: string, versionId: string): Character[] => {
    const version = getVersion(bookId, versionId);
    return version?.characters || [];
  };

  const getCharacter = (bookId: string, versionId: string, characterId: string): Character | null => {
    const version = getVersion(bookId, versionId);
    return version?.characters.find(char => char.id === characterId) || null;
  };

  const createCharacter = (bookId: string, versionId: string, characterData: Omit<Character, 'id'>): Character => {
    const newCharacter: Character = {
      ...characterData,
      id: generateId(),
    };

    const version = getVersion(bookId, versionId);
    if (version) {
      const updatedCharacters = [...version.characters, newCharacter];
      updateVersion(bookId, versionId, { characters: updatedCharacters });
    }

    return newCharacter;
  };

  const updateCharacter = (bookId: string, versionId: string, characterId: string, updates: Partial<Character>): void => {
    const version = getVersion(bookId, versionId);
    if (version) {
      const updatedCharacters = version.characters.map((char: Character) =>
        char.id === characterId ? { ...char, ...updates } : char
      );
      updateVersion(bookId, versionId, { characters: updatedCharacters });
    }
  };

  const deleteCharacter = (bookId: string, versionId: string, characterId: string): void => {
    const version = getVersion(bookId, versionId);
    if (version) {
      const updatedCharacters = version.characters.filter(char => char.id !== characterId);
      updateVersion(bookId, versionId, { characters: updatedCharacters });
    }
  };

  // Plot Arc operations
  const getPlotArcs = (bookId: string, versionId: string): PlotArc[] => {
    const version = getVersion(bookId, versionId);
    return version?.plotArcs || [];
  };

  const getPlotArc = (bookId: string, versionId: string, plotArcId: string): PlotArc | null => {
    const version = getVersion(bookId, versionId);
    return version?.plotArcs.find(arc => arc.id === plotArcId) || null;
  };

  const createPlotArc = (bookId: string, versionId: string, plotArcData: Omit<PlotArc, 'id'>): PlotArc => {
    const newPlotArc: PlotArc = {
      ...plotArcData,
      id: generateId(),
    };

    const version = getVersion(bookId, versionId);
    if (version) {
      const updatedPlotArcs = [...version.plotArcs, newPlotArc];
      updateVersion(bookId, versionId, { plotArcs: updatedPlotArcs });
    }

    return newPlotArc;
  };

  const updatePlotArc = (bookId: string, versionId: string, plotArcId: string, updates: Partial<PlotArc>): void => {
    const version = getVersion(bookId, versionId);
    if (version) {
      const updatedPlotArcs = version.plotArcs.map(arc =>
        arc.id === plotArcId ? { ...arc, ...updates } : arc
      );
      updateVersion(bookId, versionId, { plotArcs: updatedPlotArcs });
    }
  };

  const deletePlotArc = (bookId: string, versionId: string, plotArcId: string): void => {
    const version = getVersion(bookId, versionId);
    if (version) {
      const updatedPlotArcs = version.plotArcs.filter(arc => arc.id !== plotArcId);
      updateVersion(bookId, versionId, { plotArcs: updatedPlotArcs });
    }
  };

  // World operations
  const getWorlds = (bookId: string, versionId: string): WorldData[] => {
    const version = getVersion(bookId, versionId);
    return version?.worlds || [];
  };

  const getWorld = (bookId: string, versionId: string, worldId: string): WorldData | null => {
    const version = getVersion(bookId, versionId);
    return version?.worlds.find(world => world.id === worldId) || null;
  };

  const createWorld = (bookId: string, versionId: string, worldData: Omit<WorldData, 'id'>): WorldData => {
    const newWorld: WorldData = {
      ...worldData,
      id: generateId(),
    };

    const version = getVersion(bookId, versionId);
    if (version) {
      const updatedWorlds = [...version.worlds, newWorld];
      updateVersion(bookId, versionId, { worlds: updatedWorlds });
    }

    return newWorld;
  };

  const updateWorld = (bookId: string, versionId: string, worldId: string, updates: Partial<WorldData>): void => {
    const version = getVersion(bookId, versionId);
    if (version) {
      const updatedWorlds = version.worlds.map(world =>
        world.id === worldId ? { ...world, ...updates } : world
      );
      updateVersion(bookId, versionId, { worlds: updatedWorlds });
    }
  };

  const deleteWorld = (bookId: string, versionId: string, worldId: string): void => {
    const version = getVersion(bookId, versionId);
    if (version) {
      const updatedWorlds = version.worlds.filter(world => world.id !== worldId);
      updateVersion(bookId, versionId, { worlds: updatedWorlds });
    }
  };

  // Location operations
  const getLocations = (bookId: string, versionId: string, worldId: string): Location[] => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.locations || [];
  };

  const getLocation = (bookId: string, versionId: string, worldId: string, locationId: string): Location | null => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.locations.find(loc => loc.id === locationId) || null;
  };

  const createLocation = (bookId: string, versionId: string, worldId: string, locationData: Omit<Location, 'id' | 'parentWorldId'>): Location => {
    const newLocation: Location = {
      ...locationData,
      id: generateId(),
      parentWorldId: worldId,
    };

    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedLocations = [...world.locations, newLocation];
      updateWorld(bookId, versionId, worldId, { locations: updatedLocations });
    }

    return newLocation;
  };

  const updateLocation = (bookId: string, versionId: string, worldId: string, locationId: string, updates: Partial<Location>): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedLocations = world.locations.map(loc =>
        loc.id === locationId ? { ...loc, ...updates } : loc
      );
      updateWorld(bookId, versionId, worldId, { locations: updatedLocations });
    }
  };

  const deleteLocation = (bookId: string, versionId: string, worldId: string, locationId: string): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedLocations = world.locations.filter(loc => loc.id !== locationId);
      updateWorld(bookId, versionId, worldId, { locations: updatedLocations });
    }
  };

  // World Object operations
  const getWorldObjects = (bookId: string, versionId: string, worldId: string): WorldObject[] => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.objects || [];
  };

  const getWorldObject = (bookId: string, versionId: string, worldId: string, objectId: string): WorldObject | null => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.objects.find(obj => obj.id === objectId) || null;
  };

  const createWorldObject = (bookId: string, versionId: string, worldId: string, objectData: Omit<WorldObject, 'id' | 'parentWorldId'>): WorldObject => {
    const newObject: WorldObject = {
      ...objectData,
      id: generateId(),
      parentWorldId: worldId,
    };

    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedObjects = [...world.objects, newObject];
      updateWorld(bookId, versionId, worldId, { objects: updatedObjects });
    }

    return newObject;
  };

  const updateWorldObject = (bookId: string, versionId: string, worldId: string, objectId: string, updates: Partial<WorldObject>): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedObjects = world.objects.map(obj =>
        obj.id === objectId ? { ...obj, ...updates } : obj
      );
      updateWorld(bookId, versionId, worldId, { objects: updatedObjects });
    }
  };

  const deleteWorldObject = (bookId: string, versionId: string, worldId: string, objectId: string): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedObjects = world.objects.filter(obj => obj.id !== objectId);
      updateWorld(bookId, versionId, worldId, { objects: updatedObjects });
    }
  };

  // Lore operations
  const getLore = (bookId: string, versionId: string, worldId: string): Lore[] => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.lore || [];
  };

  const getLoreItem = (bookId: string, versionId: string, worldId: string, loreId: string): Lore | null => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.lore.find(lore => lore.id === loreId) || null;
  };

  const createLore = (bookId: string, versionId: string, worldId: string, loreData: Omit<Lore, 'id' | 'parentWorldId'>): Lore => {
    const newLore: Lore = {
      ...loreData,
      id: generateId(),
      parentWorldId: worldId,
    };

    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedLore = [...world.lore, newLore];
      updateWorld(bookId, versionId, worldId, { lore: updatedLore });
    }

    return newLore;
  };

  const updateLore = (bookId: string, versionId: string, worldId: string, loreId: string, updates: Partial<Lore>): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedLore = world.lore.map(lore =>
        lore.id === loreId ? { ...lore, ...updates } : lore
      );
      updateWorld(bookId, versionId, worldId, { lore: updatedLore });
    }
  };

  const deleteLore = (bookId: string, versionId: string, worldId: string, loreId: string): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedLore = world.lore.filter(lore => lore.id !== loreId);
      updateWorld(bookId, versionId, worldId, { lore: updatedLore });
    }
  };

  // Magic System operations
  const getMagicSystems = (bookId: string, versionId: string, worldId: string): MagicSystem[] => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.magicSystems || [];
  };

  const getMagicSystem = (bookId: string, versionId: string, worldId: string, magicSystemId: string): MagicSystem | null => {
    const world = getWorld(bookId, versionId, worldId);
    return world?.magicSystems.find(magic => magic.id === magicSystemId) || null;
  };

  const createMagicSystem = (bookId: string, versionId: string, worldId: string, magicSystemData: Omit<MagicSystem, 'id' | 'parentWorldId'>): MagicSystem => {
    const newMagicSystem: MagicSystem = {
      ...magicSystemData,
      id: generateId(),
      parentWorldId: worldId,
    };

    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedMagicSystems = [...world.magicSystems, newMagicSystem];
      updateWorld(bookId, versionId, worldId, { magicSystems: updatedMagicSystems });
    }

    return newMagicSystem;
  };

  const updateMagicSystem = (bookId: string, versionId: string, worldId: string, magicSystemId: string, updates: Partial<MagicSystem>): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedMagicSystems = world.magicSystems.map(magic =>
        magic.id === magicSystemId ? { ...magic, ...updates } : magic
      );
      updateWorld(bookId, versionId, worldId, { magicSystems: updatedMagicSystems });
    }
  };

  const deleteMagicSystem = (bookId: string, versionId: string, worldId: string, magicSystemId: string): void => {
    const world = getWorld(bookId, versionId, worldId);
    if (world) {
      const updatedMagicSystems = world.magicSystems.filter(magic => magic.id !== magicSystemId);
      updateWorld(bookId, versionId, worldId, { magicSystems: updatedMagicSystems });
    }
  };

  // Scene operations (encrypted content)
  const getSceneContent = async (sceneId: string): Promise<string | null> => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Load and decrypt the scene content
      const content = await encryptionService.loadSceneContent(sceneId, user.id);
      return content;

    } catch (error) {
      await appLog.error('book-context', 'Failed to get scene content', { sceneId, error });
      return null;
    }
  };

  const updateSceneContent = async (sceneId: string, content: string): Promise<void> => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get current scene to get book/version/chapter info
      const currentScene = await getScene(sceneId, user.id);
      if (!currentScene) {
        throw new Error('Scene not found');
      }

      // Save encrypted content
      await encryptionService.saveSceneContent(
        sceneId,
        user.id,
        currentScene.book_id,
        currentScene.version_id,
        currentScene.chapter_id,
        content,
        Boolean(currentScene.enc_scheme === 'bsk')
      );

      await appLog.info('book-context', 'Scene content updated', { sceneId });

    } catch (error) {
      await appLog.error('book-context', 'Failed to update scene content', { sceneId, error });
      throw error;
    }
  };

  const createScene = async (
    bookId: string, 
    versionId: string, 
    chapterId: string, 
    title: string, 
    content: string = ''
  ): Promise<Scene> => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const sceneId = generateId();
      
      // Save encrypted scene content
      await encryptionService.saveSceneContent(
        sceneId,
        user.id,
        bookId,
        versionId,
        chapterId,
        { title, content },
        false // Private book for now
      );

      // Return Scene object
      const scene: Scene = {
        id: sceneId,
        title: title,
        encScheme: 'udek',
        syncState: 'dirty',
        conflictState: 'none',
        updatedAt: Date.now(),
        wordCount: content.split(/\s+/).length
      };

      await appLog.info('book-context', 'Scene created', { sceneId, bookId });
      return scene;

    } catch (error) {
      await appLog.error('book-context', 'Failed to create scene', { bookId, chapterId, error });
      throw error;
    }
  };

  const getBookScenes = async (bookId: string): Promise<Scene[]> => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const sceneRows = await getScenesByBook(bookId, user.id);
      
      // Convert SceneRow[] to Scene[]
      const scenes: Scene[] = sceneRows.map(row => ({
        id: row.scene_id,
        title: row.title || 'Untitled Scene',
        encScheme: row.enc_scheme as any,
        syncState: row.sync_state as any,
        conflictState: row.conflict_state as any,
        updatedAt: row.updated_at,
        wordCount: row.word_count,
        hasProposals: Boolean(row.has_proposals)
      }));

      return scenes;

    } catch (error) {
      await appLog.error('book-context', 'Failed to get book scenes', { bookId, error });
      return [];
    }
  };

  // Utility methods
  const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateRevision = (): string => {
    return `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  };

  const checkForConflicts = async (bookId: string, cloudRevision?: string): Promise<void> => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) return;

      const localBook = getBook(bookId);
      if (!localBook) return;

      // If we have a cloud revision and local book is dirty, check for conflicts
      if (cloudRevision && localBook.syncState === 'dirty' && localBook.revCloud !== cloudRevision) {
        // Local has been modified and cloud has changed - potential conflict
        const { markBookSyncState } = await import('../data/dal');
        await markBookSyncState(bookId, user.id, 'conflict');
        
        // Update local state
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === bookId 
              ? { ...book, syncState: 'conflict', conflictState: 'needs_review' } 
              : book
          )
        );

        await appLog.warn('book-context', 'Conflict detected for book', { 
          bookId, 
          localRev: localBook.revLocal,
          cloudRev: cloudRevision 
        });
      }
    } catch (error) {
      await appLog.error('book-context', 'Failed to check for conflicts', { bookId, error });
    }
  };

  const refreshData = (): void => {
    // Reload books from encrypted storage
    window.location.reload(); // Temporary implementation
  };

  const createSampleData = async (): Promise<void> => {
    try {
      const { user, isAuthenticated } = useAuthStore.getState();
      
      if (!isAuthenticated || !user) {
        await appLog.warn('book-context', 'Cannot create sample data - user not authenticated');
        return;
      }

      await appLog.info('book-context', 'Creating sample encrypted books...');
      
      // Create a sample book with encrypted content
      const sampleBookId = generateId();
      
      // Add book to database using putBook
      await putBook({
        book_id: sampleBookId,
        owner_user_id: user.id,
        title: 'My First Novel',
        is_shared: 0,
        sync_state: 'idle',
        conflict_state: 'none',
        last_local_change: Date.now(),
        updated_at: Date.now()
      });
      
      // Add scene with encrypted content using createScene
      const sampleContent = "It was a dark and stormy night when our story begins...";
      await createScene(sampleBookId, 'version-1', 'chapter-1', 'Opening Scene', sampleContent);
      
      await appLog.success('book-context', 'Sample data created successfully');
      
      // Refresh the books list
      refreshData();
      
    } catch (error) {
      await appLog.error('book-context', 'Failed to create sample data', error);
    }
  };

  const createBook = async (bookData: Omit<Book, 'id'>): Promise<Book> => {
    try {
      const { user, isAuthenticated } = useAuthStore.getState();
      
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }

      await appLog.info('book-context', 'Creating new book...', { title: bookData.title });
      
      const bookId = generateId();
      const newBook: Book = {
        ...bookData,
        id: bookId,
        authorId: user.id,
        author: user.name || bookData.author || 'Unknown Author',
        lastModified: new Date().toISOString(),
        updatedAt: Date.now(),
        syncState: 'dirty', // Always start as dirty since it's a new local book
        conflictState: 'none',
        revLocal: generateRevision(), // Generate initial revision
        revCloud: undefined // No cloud revision yet
      };

      // Prepare basic book row data
      const bookRow: BookRow = {
        book_id: bookId,
        owner_user_id: user.id,
        title: newBook.title,
        is_shared: newBook.isShared ? 1 : 0,
        sync_state: 'dirty',
        conflict_state: 'none',
        last_local_change: Date.now(),
        updated_at: Date.now(),
        rev_local: newBook.revLocal,
        rev_cloud: undefined,
        enc_metadata: undefined,
        enc_schema: undefined
      };

      // Try to encrypt metadata if encryption service is available
      if (encryptionService.isInitialized()) {
        try {
          // Prepare metadata for encryption
          const metadata: BookMetadata = {
            description: newBook.description || '',
            synopsis: newBook.synopsis || '',
            genre: newBook.genre || '',
            subgenre: newBook.subgenre || '',
            bookType: newBook.bookType || '',
            prose: newBook.prose || '',
            language: newBook.language || '',
            publisher: newBook.publisher || '',
            publishedStatus: newBook.publishedStatus || '',
            publisherLink: newBook.publisherLink || '',
            printISBN: newBook.printISBN || '',
            ebookISBN: newBook.ebookISBN || ''
          };

          // Get encryption key and encrypt metadata
          const isShared = newBook.isShared || false;
          const encScheme = isShared ? 'bsk' : 'udek';
          const key = await encryptionService.getBookKey(user.id, bookId, isShared);
          
          // Use AES encryption directly like scene content
          const { encryptSceneContent } = await import('../crypto/aes');
          const { contentEnc, contentIv } = await encryptSceneContent(JSON.stringify(metadata), key);
          
          // Convert to binary and pack (IV + data) like in updateBook
          const { base64ToUint8Array } = await import('../crypto/aes');
          const ivBytes = base64ToUint8Array(contentIv);
          const dataBytes = base64ToUint8Array(contentEnc);
          
          const encryptedMetadata = new Uint8Array(ivBytes.length + dataBytes.length);
          encryptedMetadata.set(ivBytes, 0);
          encryptedMetadata.set(dataBytes, ivBytes.length);

          bookRow.enc_metadata = encryptedMetadata;
          bookRow.enc_schema = encScheme;

          await appLog.info('book-context', 'Book metadata encrypted', { bookId });
        } catch (encryptionError) {
          await appLog.warn('book-context', 'Failed to encrypt book metadata, saving without encryption', { 
            bookId, 
            error: encryptionError 
          });
        }
      } else {
        await appLog.info('book-context', 'Encryption service not initialized, saving book without encrypted metadata', { bookId });
      }
      
      await putBook(bookRow);
      
      // Try to sync to cloud if online and authenticated
      if (navigator.onLine) {
        try {
          // Check authentication state before attempting sync
          const authState = useAuthStore.getState();
          if (!authState.isAuthenticated || !authState.user) {
            await appLog.warn('book-context', 'Skipping cloud sync for book creation - user not authenticated', { 
              isAuthenticated: authState.isAuthenticated,
              hasUser: !!authState.user
            });
            // Book remains dirty for later sync
          } else {
            // Ensure we have a valid access token before making API calls
            const { ensureAccessToken } = authState;
            await ensureAccessToken();
            
            await apiClient.createBook(newBook, createTokenGetter());
            // Update sync state to indicate successful cloud sync
            bookRow.sync_state = 'idle';
            await putBook(bookRow);
            newBook.syncState = 'idle';
            
            await appLog.info('book-context', 'Book synced to cloud successfully', { bookId });
          }
        } catch (cloudError) {
          await appLog.warn('book-context', 'Failed to sync book to cloud, will retry later', { bookId, error: cloudError });
          // Keep sync_state as 'dirty' for retry later
        }
      } else {
        await appLog.info('book-context', 'Offline mode - book will be synced when connection is restored', { bookId });
      }
      
      // Update local state
      setBooks(prev => [...prev, newBook]);
      
      await appLog.success('book-context', 'Book created successfully', { bookId });
      return newBook;
      
    } catch (error) {
      await appLog.error('book-context', 'Failed to create book', error);
      throw error;
    }
  };

  const deleteBook = async (bookId: string): Promise<void> => {
    try {
      const { user, isAuthenticated } = useAuthStore.getState();
      
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }

      await appLog.info('book-context', 'Deleting book...', { bookId });
      
      // Try to delete from cloud if online and authenticated
      if (navigator.onLine) {
        try {
          // Check authentication state before attempting sync
          const authState = useAuthStore.getState();
          if (!authState.isAuthenticated || !authState.user) {
            await appLog.warn('book-context', 'Skipping cloud deletion - user not authenticated', { 
              isAuthenticated: authState.isAuthenticated,
              hasUser: !!authState.user
            });
          } else {
            await apiClient.deleteBook(bookId, createTokenGetter());
            await appLog.info('book-context', 'Book deleted from cloud successfully', { bookId });
          }
        } catch (cloudError) {
          await appLog.warn('book-context', 'Failed to delete book from cloud, continuing with local deletion', { 
            bookId, 
            error: cloudError,
            message: cloudError instanceof Error ? cloudError.message : 'Unknown error'
          });
        }
      } else {
        await appLog.info('book-context', 'Offline mode - skipping cloud deletion', { bookId });
      }
      
      // Delete from local database
      await deleteBookFromDB(bookId, user.id);
      
      // Update local state
      setBooks(prev => prev.filter(book => book.id !== bookId));
      
      await appLog.success('book-context', 'Book deleted successfully', { bookId });
      
    } catch (error) {
      await appLog.error('book-context', 'Failed to delete book', error);
      throw error;
    }
  };

  // Sync operations
  const syncBook = async (bookId: string): Promise<void> => {
    try {
      const authState = useAuthStore.getState();
      const { user, isAuthenticated } = authState;
      
      if (!isAuthenticated || !user) {
        await appLog.warn('book-context', 'Cannot sync book - user not authenticated', { 
          bookId,
          isAuthenticated,
          hasUser: !!user
        });
        throw new Error('User not authenticated');
      }

      if (!navigator.onLine) {
        throw new Error('Cannot sync while offline');
      }

      await appLog.info('book-context', 'Syncing book to cloud', { bookId });

      const localBook = getBook(bookId);
      if (!localBook) {
        throw new Error('Book not found locally');
      }

      // Update sync state
      await updateBook(bookId, { syncState: 'pushing' });

      try {
        // Check if book exists on cloud first
        let bookExistsOnCloud = false;
        try {
          await apiClient.getBook(bookId, createTokenGetter());
          bookExistsOnCloud = true;
          await appLog.info('book-context', 'Book exists on cloud, will update', { bookId });
        } catch (getError: any) {
          if (getError.message?.includes('404') || getError.message?.includes('Not Found')) {
            bookExistsOnCloud = false;
            await appLog.info('book-context', 'Book does not exist on cloud, will create', { bookId });
          } else {
            throw getError; // Re-throw if it's not a 404
          }
        }

        if (bookExistsOnCloud) {
          // Book exists on cloud, update it
          await apiClient.updateBook(bookId, localBook, createTokenGetter());
          await appLog.info('book-context', 'Book updated on cloud successfully', { bookId });
        } else {
          // Book doesn't exist on cloud, create it
          await apiClient.createBook(localBook, createTokenGetter());
          await appLog.info('book-context', 'Book created on cloud successfully', { bookId });
        }
        
        // Update sync state to success directly in database and local state
        const { user } = useAuthStore.getState();
        if (user) {
          const bookRow = await getBookFromDB(bookId, user.id);
          if (bookRow) {
            bookRow.sync_state = 'idle';
            bookRow.rev_cloud = localBook.revLocal || '1';
            await putBook(bookRow);
          }
        }
        
        // Update local state
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === bookId ? { 
              ...book, 
              syncState: 'idle',
              conflictState: 'none',
              revCloud: localBook.revLocal || '1'
            } : book
          )
        );

        await appLog.success('book-context', 'Book synced successfully', { bookId });
      } catch (error) {
        await updateBook(bookId, { syncState: 'dirty' });
        throw error;
      }
    } catch (error) {
      await appLog.error('book-context', 'Failed to sync book', { bookId, error });
      throw error;
    }
  };

  const syncAllBooks = async (): Promise<void> => {
    try {
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.user) {
        await appLog.warn('book-context', 'Cannot sync all books - user not authenticated', { 
          isAuthenticated: authState.isAuthenticated,
          hasUser: !!authState.user
        });
        throw new Error('User not authenticated');
      }

      const dirtyBooks = getDirtyBooks();
      
      if (dirtyBooks.length === 0) {
        await appLog.info('book-context', 'No books to sync');
        return;
      }

      await appLog.info('book-context', 'Syncing all dirty books', { count: dirtyBooks.length });

      for (const book of dirtyBooks) {
        try {
          await syncBook(book.id);
        } catch (error) {
          await appLog.warn('book-context', 'Failed to sync individual book, continuing', { 
            bookId: book.id, 
            error 
          });
        }
      }

      await appLog.success('book-context', 'Finished syncing all books');
    } catch (error) {
      await appLog.error('book-context', 'Failed to sync all books', { error });
      throw error;
    }
  };

  const resolveConflict = async (bookId: string, resolution: 'local' | 'cloud' | 'merge'): Promise<void> => {
    try {
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.user) {
        await appLog.warn('book-context', 'Cannot resolve conflict - user not authenticated', { 
          bookId,
          isAuthenticated: authState.isAuthenticated,
          hasUser: !!authState.user
        });
        throw new Error('User not authenticated');
      }

      await appLog.info('book-context', 'Resolving book conflict', { bookId, resolution });

      switch (resolution) {
        case 'local':
          // Keep local version, force push to cloud
          await updateBook(bookId, {
            syncState: 'dirty',
            conflictState: 'none'
          });
          await syncBook(bookId);
          break;

        case 'cloud':
          // Accept cloud version
          if (navigator.onLine) {
            const { ensureAccessToken } = authState;
            await ensureAccessToken();
            const cloudBook = await apiClient.getBook(bookId, createTokenGetter());
            
            await updateBook(bookId, {
              ...cloudBook,
              syncState: 'idle',
              conflictState: 'none',
              revLocal: cloudBook.revCloud,
              updatedAt: Date.now()
            });
          }
          break;

        case 'merge':
          // TODO: Implement merge logic
          await appLog.warn('book-context', 'Merge resolution not implemented yet', { bookId });
          throw new Error('Merge resolution not implemented yet');
      }

      await appLog.success('book-context', 'Conflict resolved', { bookId, resolution });
      
    } catch (error) {
      await appLog.error('book-context', 'Failed to resolve conflict', { bookId, resolution, error });
      throw error;
    }
  };

  const getDirtyBooks = (): Book[] => {
    return books.filter(book => book.syncState === 'dirty');
  };

  const getConflictedBooks = (): Book[] => {
    return books.filter(book => book.conflictState !== 'none');
  };

  const contextValue: BookContextType = {
    // Current state
    books,
    authoredBooks,
    editableBooks,
    reviewableBooks,
    loading,
    error,
    
    // World Building UI state
    selectedWorldId,
    setSelectedWorldId,
    
    // Book operations
    getBook,
    updateBook,
    
    // Version operations
    getVersion,
    updateVersion,
    createVersion,
    
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
    
    // Scene operations (encrypted content)
    getSceneContent,
    updateSceneContent,
    createScene,
    getBookScenes,
    
    // Book CRUD operations
    createBook,
    deleteBook,
    
    // Sync operations
    syncBook,
    syncAllBooks,
    resolveConflict,
    getDirtyBooks,
    getConflictedBooks,
    
    // Utility methods
    generateId,
    refreshData,
    createSampleData,
  };

  return (
    <BookContext.Provider value={contextValue}>
      {children}
    </BookContext.Provider>
  );
};

// Custom hook to get current book and version from URL params
export const useCurrentBookAndVersion = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const { getBook, getVersion } = useBookContext();
  
  const currentBook = bookId ? getBook(bookId) : null;
  const currentVersion = currentBook && versionId && bookId ? getVersion(bookId, versionId) : null;
  
  return {
    bookId,
    versionId,
    currentBook,
    currentVersion,
    loading: !currentBook && !!bookId, // loading if we have bookId but no book found
    error: bookId && !currentBook ? 'Book not found' : null
  };
};

export default BookContext;
