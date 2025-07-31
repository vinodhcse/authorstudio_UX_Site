import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Book, Version, Character } from '../types';
import { MOCK_BOOKS } from '../constants';

// Additional types for version-level data
export interface PlotArc {
  id: string;
  title: string;
  description: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  scenes: PlotScene[];
  characters: string[]; // character IDs
  timeline: {
    startChapter?: number;
    endChapter?: number;
    duration?: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlotScene {
  id: string;
  title: string;
  description: string;
  chapter?: number;
  wordCount?: number;
  status: 'DRAFT' | 'WRITTEN' | 'EDITED' | 'FINAL';
  characters: string[];
  plotPoints: string[];
  notes?: string;
}

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

// Enhanced version interface with version-level data
export interface EnhancedVersion extends Version {
  characters: Character[];
  plotArcs: PlotArc[];
  worldBuilding: WorldBuildingElement[];
}

// Enhanced book interface
export interface EnhancedBook extends Omit<Book, 'versions' | 'characters'> {
  versions: EnhancedVersion[];
}

// Context interface
interface BookContextType {
  // Current state
  books: EnhancedBook[];
  loading: boolean;
  error: string | null;
  
  // Book operations
  getBook: (bookId: string) => EnhancedBook | null;
  updateBook: (bookId: string, updates: Partial<EnhancedBook>) => void;
  
  // Version operations
  getVersion: (bookId: string, versionId: string) => EnhancedVersion | null;
  updateVersion: (bookId: string, versionId: string, updates: Partial<EnhancedVersion>) => void;
  createVersion: (bookId: string, versionData: Omit<EnhancedVersion, 'id'>) => EnhancedVersion;
  
  // Character operations
  getCharacters: (bookId: string, versionId: string) => Character[];
  getCharacter: (bookId: string, versionId: string, characterId: string) => Character | null;
  createCharacter: (bookId: string, versionId: string, characterData: Omit<Character, 'id'>) => Character;
  updateCharacter: (bookId: string, versionId: string, characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (bookId: string, versionId: string, characterId: string) => void;
  
  // Plot Arc operations
  getPlotArcs: (bookId: string, versionId: string) => PlotArc[];
  getPlotArc: (bookId: string, versionId: string, arcId: string) => PlotArc | null;
  createPlotArc: (bookId: string, versionId: string, arcData: Omit<PlotArc, 'id'>) => PlotArc;
  updatePlotArc: (bookId: string, versionId: string, arcId: string, updates: Partial<PlotArc>) => void;
  deletePlotArc: (bookId: string, versionId: string, arcId: string) => void;
  
  // World Building operations
  getWorldBuilding: (bookId: string, versionId: string) => WorldBuildingElement[];
  getWorldBuildingElement: (bookId: string, versionId: string, elementId: string) => WorldBuildingElement | null;
  createWorldBuildingElement: (bookId: string, versionId: string, elementData: Omit<WorldBuildingElement, 'id'>) => WorldBuildingElement;
  updateWorldBuildingElement: (bookId: string, versionId: string, elementId: string, updates: Partial<WorldBuildingElement>) => void;
  deleteWorldBuildingElement: (bookId: string, versionId: string, elementId: string) => void;
  
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

// Convert legacy books to enhanced books with version-level data
const convertToEnhancedBooks = (books: Book[]): EnhancedBook[] => {
  return books.map(book => {
    console.log('BookContext: Converting book:', book);
    const enhancedVersions: EnhancedVersion[] = (book.versions || []).map(version => ({
      ...version,
      characters: book.characters || [], // Move characters to version level
      plotArcs: generateSamplePlotArcs(book.id, version.id),
      worldBuilding: generateSampleWorldBuilding(book.id, version.id),
    }));

    return {
      ...book,
      versions: enhancedVersions,
    };
  });
};

// Generate sample plot arcs for each version
const generateSamplePlotArcs = (bookId: string, versionId: string): PlotArc[] => {
  const baseArcs = [
    {
      id: `arc-${bookId}-${versionId}-1`,
      title: 'Opening Hook',
      description: 'Establish the protagonist and their world, introduce the inciting incident',
      status: 'COMPLETED' as const,
      scenes: [
        {
          id: `scene-${bookId}-${versionId}-1`,
          title: 'Opening Scene',
          description: 'Introduce the protagonist in their normal world',
          chapter: 1,
          wordCount: 2500,
          status: 'FINAL' as const,
          characters: ['char1'],
          plotPoints: ['Character introduction', 'World establishment'],
          notes: 'Strong opening that hooks the reader'
        }
      ],
      characters: ['char1'],
      timeline: { startChapter: 1, endChapter: 3, duration: '3 chapters' },
      tags: ['opening', 'character-introduction'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z'
    },
    {
      id: `arc-${bookId}-${versionId}-2`,
      title: 'Rising Action',
      description: 'Build tension and develop character relationships',
      status: 'IN_PROGRESS' as const,
      scenes: [
        {
          id: `scene-${bookId}-${versionId}-2`,
          title: 'First Challenge',
          description: 'Protagonist faces their first major obstacle',
          chapter: 5,
          wordCount: 3200,
          status: 'WRITTEN' as const,
          characters: ['char1', 'char2'],
          plotPoints: ['First obstacle', 'Character growth'],
          notes: 'Important character development moment'
        }
      ],
      characters: ['char1', 'char2', 'char3'],
      timeline: { startChapter: 4, endChapter: 12, duration: '9 chapters' },
      tags: ['rising-action', 'character-development'],
      createdAt: '2024-01-16T09:00:00Z',
      updatedAt: '2024-01-25T11:15:00Z'
    },
    {
      id: `arc-${bookId}-${versionId}-3`,
      title: 'Climax',
      description: 'The final confrontation and resolution',
      status: 'PLANNING' as const,
      scenes: [],
      characters: ['char1', 'char2', 'char3'],
      timeline: { startChapter: 18, endChapter: 20, duration: '3 chapters' },
      tags: ['climax', 'resolution'],
      createdAt: '2024-01-17T14:00:00Z',
      updatedAt: '2024-01-17T14:00:00Z'
    }
  ];

  return baseArcs;
};

// Generate sample world building elements
const generateSampleWorldBuilding = (bookId: string, versionId: string): WorldBuildingElement[] => {
  const baseElements = [
    {
      id: `world-${bookId}-${versionId}-1`,
      type: 'LOCATION' as const,
      title: 'Shadowhaven',
      description: 'A mysterious city built in the shadow of ancient mountains',
      details: {
        geography: 'Located in a valley surrounded by towering peaks, with perpetual mist',
        history: 'Founded centuries ago by refugees fleeing a great war',
        politics: 'Governed by a council of elder families',
        economy: 'Based on shadow crystal mining and mysterious trade routes',
        culture: 'Values secrecy and knowledge, with a complex social hierarchy'
      },
      relatedElements: [`world-${bookId}-${versionId}-2`],
      relatedCharacters: ['char1'],
      tags: ['city', 'mysterious', 'ancient'],
      createdAt: '2024-01-15T12:00:00Z',
      updatedAt: '2024-01-22T16:45:00Z'
    },
    {
      id: `world-${bookId}-${versionId}-2`,
      type: 'MAGIC_SYSTEM' as const,
      title: 'Shadow Magic',
      description: 'A form of magic that draws power from darkness and shadow',
      details: {
        magic: 'Practitioners can manipulate shadows, become incorporeal, and see through darkness. Power increases at night and in dark places. Overuse can lead to "shadow sickness" where users begin to fade from reality.',
        relationships: ['Tied to the shadow realm', 'Opposed by light magic']
      },
      relatedElements: [`world-${bookId}-${versionId}-1`],
      relatedCharacters: ['char1'],
      tags: ['magic', 'shadow', 'supernatural'],
      createdAt: '2024-01-16T08:30:00Z',
      updatedAt: '2024-01-23T10:20:00Z'
    },
    {
      id: `world-${bookId}-${versionId}-3`,
      type: 'ORGANIZATION' as const,
      title: 'Royal Inquisitors',
      description: 'Elite investigators serving the crown',
      details: {
        politics: 'Direct servants of the monarchy, investigating supernatural crimes and threats',
        culture: 'Bound by strict codes of honor and duty, often operating alone',
        relationships: ['Serves the Crown', 'Investigates supernatural threats']
      },
      relatedElements: [],
      relatedCharacters: ['char1'],
      tags: ['organization', 'investigation', 'royal'],
      createdAt: '2024-01-17T11:00:00Z',
      updatedAt: '2024-01-24T13:30:00Z'
    }
  ];

  return baseElements;
};

interface BookContextProviderProps {
  children: ReactNode;
}

export const BookContextProvider: React.FC<BookContextProviderProps> = ({ children }) => {
  const [books, setBooks] = useState<EnhancedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize books data
  useEffect(() => {
    try {
      console.log('BookContext: Original MOCK_BOOKS:', MOCK_BOOKS);
      const enhancedBooks = convertToEnhancedBooks(MOCK_BOOKS);
      console.log('BookContext: Enhanced books:', enhancedBooks);
      setBooks(enhancedBooks);
      console.log('BookContext: Final books state:', books, enhancedBooks);
      setLoading(false);
    } catch (err) {
      console.error('BookContext: Error loading books:', err);
      setError('Failed to load books data');
      setLoading(false);
    }
  }, []);

  // Utility function to generate IDs
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Book operations
  const getBook = (id: string): EnhancedBook | null => {
    return books.find(book => book.id === id) || null;
  };

  const updateBook = (id: string, updates: Partial<EnhancedBook>): void => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === id ? { ...book, ...updates } : book
      )
    );
  };

  // Version operations
  const getVersion = (bookId: string, versionId: string): EnhancedVersion | null => {
    const book = getBook(bookId);
    return book?.versions.find(version => version.id === versionId) || null;
  };

  const updateVersion = (bookId: string, versionId: string, updates: Partial<EnhancedVersion>): void => {
    setBooks(prevBooks =>
      prevBooks.map(book =>
        book.id === bookId
          ? {
              ...book,
              versions: book.versions.map(version =>
                version.id === versionId ? { ...version, ...updates } : version
              )
            }
          : book
      )
    );
  };

  const createVersion = (bookId: string, versionData: Omit<EnhancedVersion, 'id'>): EnhancedVersion => {
    const newVersion: EnhancedVersion = {
      ...versionData,
      id: generateId(),
    };

    setBooks(prevBooks =>
      prevBooks.map(book =>
        book.id === bookId
          ? { ...book, versions: [...book.versions, newVersion] }
          : book
      )
    );

    return newVersion;
  };

  // Character operations (version-level)
  const getCharacters = (bookId: string, versionId: string): Character[] => {
    const version = getVersion(bookId, versionId);
    return version?.characters || [];
  };

  const getCharacter = (bookId: string, versionId: string, characterId: string): Character | null => {
    const characters = getCharacters(bookId, versionId);
    return characters.find(char => char.id === characterId) || null;
  };

  const createCharacter = (bookId: string, versionId: string, characterData: Omit<Character, 'id'>): Character => {
    const book = getBook(bookId);
    const version = getVersion(bookId, versionId);
    
    if (!book || !version) {
      throw new Error('Book or version not found');
    }

    const newCharacter: Character = {
      ...characterData,
      id: generateId(),
    };

    const updatedCharacters = [...version.characters, newCharacter];
    updateVersion(bookId, versionId, { characters: updatedCharacters });

    return newCharacter;
  };

  const updateCharacter = (bookId: string, versionId: string, characterId: string, updates: Partial<Character>): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedCharacters = version.characters.map(char =>
      char.id === characterId ? { ...char, ...updates } : char
    );

    updateVersion(bookId, versionId, { characters: updatedCharacters });
  };

  const deleteCharacter = (bookId: string, versionId: string, characterId: string): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedCharacters = version.characters.filter(char => char.id !== characterId);
    updateVersion(bookId, versionId, { characters: updatedCharacters });
  };

  // Plot Arc operations
  const getPlotArcs = (bookId: string, versionId: string): PlotArc[] => {
    const version = getVersion(bookId, versionId);
    return version?.plotArcs || [];
  };

  const getPlotArc = (bookId: string, versionId: string, arcId: string): PlotArc | null => {
    const plotArcs = getPlotArcs(bookId, versionId);
    return plotArcs.find(arc => arc.id === arcId) || null;
  };

  const createPlotArc = (bookId: string, versionId: string, arcData: Omit<PlotArc, 'id'>): PlotArc => {
    const book = getBook(bookId);
    const version = getVersion(bookId, versionId);
    
    if (!book || !version) {
      throw new Error('Book or version not found');
    }

    const newArc: PlotArc = {
      ...arcData,
      id: generateId(),
    };

    const updatedArcs = [...version.plotArcs, newArc];
    updateVersion(bookId, versionId, { plotArcs: updatedArcs });

    return newArc;
  };

  const updatePlotArc = (bookId: string, versionId: string, arcId: string, updates: Partial<PlotArc>): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedArcs = version.plotArcs.map(arc =>
      arc.id === arcId ? { ...arc, ...updates } : arc
    );

    updateVersion(bookId, versionId, { plotArcs: updatedArcs });
  };

  const deletePlotArc = (bookId: string, versionId: string, arcId: string): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedArcs = version.plotArcs.filter(arc => arc.id !== arcId);
    updateVersion(bookId, versionId, { plotArcs: updatedArcs });
  };

  // World Building operations
  const getWorldBuilding = (bookId: string, versionId: string): WorldBuildingElement[] => {
    const version = getVersion(bookId, versionId);
    return version?.worldBuilding || [];
  };

  const getWorldBuildingElement = (bookId: string, versionId: string, elementId: string): WorldBuildingElement | null => {
    const elements = getWorldBuilding(bookId, versionId);
    return elements.find(element => element.id === elementId) || null;
  };

  const createWorldBuildingElement = (bookId: string, versionId: string, elementData: Omit<WorldBuildingElement, 'id'>): WorldBuildingElement => {
    const book = getBook(bookId);
    const version = getVersion(bookId, versionId);
    
    if (!book || !version) {
      throw new Error('Book or version not found');
    }

    const newElement: WorldBuildingElement = {
      ...elementData,
      id: generateId(),
    };

    const updatedElements = [...version.worldBuilding, newElement];
    updateVersion(bookId, versionId, { worldBuilding: updatedElements });

    return newElement;
  };

  const updateWorldBuildingElement = (bookId: string, versionId: string, elementId: string, updates: Partial<WorldBuildingElement>): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedElements = version.worldBuilding.map(element =>
      element.id === elementId ? { ...element, ...updates } : element
    );

    updateVersion(bookId, versionId, { worldBuilding: updatedElements });
  };

  const deleteWorldBuildingElement = (bookId: string, versionId: string, elementId: string): void => {
    const version = getVersion(bookId, versionId);
    if (!version) return;

    const updatedElements = version.worldBuilding.filter(element => element.id !== elementId);
    updateVersion(bookId, versionId, { worldBuilding: updatedElements });
  };

  const refreshData = (): void => {
    const enhancedBooks = convertToEnhancedBooks(MOCK_BOOKS);
    setBooks(enhancedBooks);
  };

  const contextValue: BookContextType = {
    books,
    loading,
    error,
    getBook,
    updateBook,
    getVersion,
    updateVersion,
    createVersion,
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
    getWorldBuilding,
    getWorldBuildingElement,
    createWorldBuildingElement,
    updateWorldBuildingElement,
    deleteWorldBuildingElement,
    generateId,
    refreshData,
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

export default BookContextProvider;
