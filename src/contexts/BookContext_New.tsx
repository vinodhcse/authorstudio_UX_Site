import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Book, Version, Character, PlotArc } from '../types';
import { MOCK_BOOKS } from '../constants';
import { WorldData, Location, WorldObject, Lore, MagicSystem } from '../pages/BookForge/components/planning/types/WorldBuildingTypes';

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
  updateBook: (bookId: string, updates: Partial<Book>) => void;
  
  // Version operations
  getVersion: (bookId: string, versionId: string) => Version | null;
  updateVersion: (bookId: string, versionId: string, updates: Partial<Version>) => void;
  createVersion: (bookId: string, versionData: Omit<Version, 'id'>) => Version;
  
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
  
  // Utility methods
  generateId: () => string;
  refreshData: () => void;
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

  // Initialize books data
  useEffect(() => {
    try {
      console.log('BookContext: Using MOCK_BOOKS directly:', MOCK_BOOKS);
      setBooks(MOCK_BOOKS);
      setLoading(false);
    } catch (err) {
      console.error('BookContext: Error loading books:', err);
      setError('Failed to load books');
      setLoading(false);
    }
  }, []);

  // Book operations
  const getBook = (id: string): Book | null => {
    return books.find(book => book.id === id) || null;
  };

  const updateBook = (id: string, updates: Partial<Book>): void => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === id ? { ...book, ...updates } : book
      )
    );
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

  const createVersion = (bookId: string, versionData: Omit<Version, 'id'>): Version => {
    const newVersion: Version = {
      ...versionData,
      id: generateId(),
    };

    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? {
              ...book,
              versions: [...(book.versions || []), newVersion]
            }
          : book
      )
    );

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

  // Utility methods
  const generateId = (): string => {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const refreshData = (): void => {
    setBooks(MOCK_BOOKS);
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
    
    // Utility methods
    generateId,
    refreshData,
  };

  return (
    <BookContext.Provider value={contextValue}>
      {children}
    </BookContext.Provider>
  );
};

export default BookContext;
