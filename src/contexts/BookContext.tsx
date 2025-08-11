import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Book, Version, Character, PlotArc, Scene } from '../types';
import { WorldData, Location, WorldObject, Lore, MagicSystem } from '../pages/BookForge/components/planning/types/WorldBuildingTypes';
import { appLog } from '../auth/fileLogger';
import { 
  getUserBooks, 
  getScenesByBook,
  getScene,
  putBook,
  deleteBook as deleteBookFromDB,
  BookRow
} from '../data/dal';
import { useAuthStore } from '../auth/useAuthStore';
import { encryptionService } from '../services/encryptionService';
import { apiClient } from '../lib/apiClient';

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
  books: Book[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // World Building UI state
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);

  // Initialize books data from encrypted storage
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const { user, isAuthenticated } = useAuthStore.getState();
        
        if (!isAuthenticated || !user) {
          await appLog.info('book-context', 'User not authenticated, loading empty state');
          setBooks([]);
          setLoading(false);
          return;
        }

        await appLog.info('book-context', 'Loading encrypted books for user', { userId: user.id });
        
        // TODO: In a real implementation, you'd need the user's passphrase
        // For now, we'll skip encryption service initialization and load basic book metadata
        
        // Load books from encrypted database
        const bookRows = await getUserBooks(user.id);
        
        // Convert BookRow[] to Book[] 
        const books: Book[] = bookRows.map((bookRow) => {
          return {
            id: bookRow.book_id,
            title: bookRow.title,
            author: user.name,
            description: 'Encrypted book description', // TODO: decrypt actual description
            synopsis: 'Encrypted synopsis', // TODO: decrypt actual synopsis
            lastModified: new Date(bookRow.updated_at || Date.now()).toISOString(),
            progress: 0, // TODO: calculate from scenes
            wordCount: 0, // TODO: calculate from scenes
            genre: 'Fiction', // TODO: decrypt from metadata
            collaboratorCount: 0, // TODO: count from grants
            collaborators: [], // TODO: load from grants
            characters: [], // TODO: load from version data
            featured: false,
            bookType: 'Novel',
            prose: 'Fiction',
            language: 'English',
            publisher: '',
            publishedStatus: 'Unpublished' as const,
            versions: [], // TODO: load versions from encrypted storage
            activity: [], // TODO: load activity log
            isShared: Boolean(bookRow.is_shared),
            syncState: bookRow.sync_state as any,
            revLocal: bookRow.rev_local,
            revCloud: bookRow.rev_cloud,
            updatedAt: bookRow.updated_at,
          };
        });
        
        setBooks(books);
        setLoading(false);
        await appLog.success('book-context', `Loaded ${books.length} encrypted books`);
        
      } catch (err) {
        await appLog.error('book-context', 'Error loading encrypted books', err);
        setError('Failed to load books');
        setLoading(false);
      }
    };

    loadBooks();
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
        updatedAt: Date.now()
      };
      
      // Update local state first
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
        updated_at: Date.now()
      };

      await putBook(bookRow);

      // Try to sync to cloud if online
      if (navigator.onLine) {
        try {
          // Ensure we have a valid access token before making API calls
          const { ensureAccessToken } = useAuthStore.getState();
          await ensureAccessToken();
          
          await apiClient.updateBook(id, updatedBook);
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
        }
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
        await apiClient.createVersion(bookId, versionData);
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
        syncState: 'idle',
        conflictState: 'none'
      };

      // Save to local database
      const bookRow = {
        book_id: bookId,
        owner_user_id: user.id,
        title: newBook.title,
        is_shared: newBook.isShared ? 1 : 0,
        sync_state: 'dirty',
        conflict_state: 'none',
        last_local_change: Date.now(),
        updated_at: Date.now()
      };
      
      await putBook(bookRow);
      
      // Try to sync to cloud if online
      if (navigator.onLine) {
        try {
          // Ensure we have a valid access token before making API calls
          const { ensureAccessToken } = useAuthStore.getState();
          await ensureAccessToken();
          
          await apiClient.createBook(newBook);
          // Update sync state to indicate successful cloud sync
          bookRow.sync_state = 'idle';
          await putBook(bookRow);
          newBook.syncState = 'idle';
          
          await appLog.info('book-context', 'Book synced to cloud successfully', { bookId });
        } catch (cloudError) {
          await appLog.warn('book-context', 'Failed to sync book to cloud, will retry later', { bookId, error: cloudError });
          // Keep sync_state as 'dirty' for retry later
        }
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
          await apiClient.deleteBook(bookId);
          await appLog.info('book-context', 'Book deleted from cloud successfully', { bookId });
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

  const contextValue: BookContextType = {
    // Current state
    books,
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
