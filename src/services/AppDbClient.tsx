import { invoke } from '@tauri-apps/api/tauri';

// Type definitions matching the Rust structures
export interface Book {
  title: string;
  subtitle?: string;
  author?: string;
  author_id?: string;
  cover_image?: string;
  last_modified: string;
  progress: number;
  word_count: number;
  genre: string;
  subgenre?: string;
  collaborator_count: number;
  featured: boolean;
  book_type: string;
  prose: string;
  language: string;
  publisher: string;
  published_status: 'Published' | 'Unpublished' | 'Scheduled';
  publisher_link?: string;
  print_isbn?: string;
  ebook_isbn?: string;
  publisher_logo?: string;
  synopsis: string;
  description?: string;
  is_shared?: boolean;
  sync_state?: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';
  conflict_state?: 'none' | 'needs_review' | 'blocked';
  updated_at?: number;
}

export interface BookRecord extends Book {
  id: { tb: string; id: string };
}

export interface Version {
  book_id: string;
  name: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'FINAL';
  word_count: number;
  created_at: string;
  is_current: boolean;
  sync_state?: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';
  conflict_state?: 'none' | 'needs_review' | 'blocked';
  updated_at?: number;
}

export interface VersionRecord extends Version {
  id: { tb: string; id: string };
}

export interface Chapter {
  book_id: string;
  version_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
  word_count: number;
  has_proposals: boolean;
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';
  author_id: string;
  last_modified_by: string;
  summary?: string;
  goals?: string;
  notes?: string;
  is_complete: boolean;
  sync_state?: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';
  conflict_state?: 'none' | 'needs_review' | 'blocked';
}

export interface ChapterRecord extends Chapter {
  id: { tb: string; id: string };
}

export interface Character {
  book_id: string;
  name: string;
  image?: string;
  quote?: string;
  full_name?: string;
  age?: number;
  gender?: string;
  role?: string;
  backstory?: string;
  personality_type?: string;
  motivations?: string; // JSON string of array
  notes?: string;
  tags?: string; // JSON string of array
}

export interface CharacterRecord extends Character {
  id: { tb: string; id: string };
}

// Database client class
export class AppDbClient {
  // Book operations
  async createBook(book: Book): Promise<string> {
    return invoke('app_create_book', { book });
  }

  async getBooks(): Promise<BookRecord[]> {
    return invoke('app_get_books');
  }

  async getBookById(bookId: string): Promise<BookRecord | null> {
    return invoke('app_get_book_by_id', { bookId });
  }

  async updateBook(bookId: string, book: Book): Promise<string> {
    return invoke('app_update_book', { bookId, book });
  }

  async deleteBook(bookId: string): Promise<string> {
    return invoke('app_delete_book', { bookId });
  }

  // Version operations
  async createVersion(version: Version): Promise<string> {
    return invoke('app_create_version', { version });
  }

  async getVersionsByBook(bookId: string): Promise<VersionRecord[]> {
    return invoke('app_get_versions_by_book', { bookId });
  }

  // Chapter operations
  async createChapter(chapter: Chapter): Promise<string> {
    return invoke('app_create_chapter', { chapter });
  }

  async getChaptersByVersion(bookId: string, versionId: string): Promise<ChapterRecord[]> {
    return invoke('app_get_chapters_by_version', { bookId, versionId });
  }

  // Character operations
  async createCharacter(character: Character): Promise<string> {
    return invoke('app_create_character', { character });
  }

  async getCharactersByBook(bookId: string): Promise<CharacterRecord[]> {
    return invoke('app_get_characters_by_book', { bookId });
  }

  // Utility operations
  async deleteAllData(): Promise<string> {
    return invoke('app_delete_all_data');
  }
}

// Helper functions to create sample data
export function createSampleBook(title: string = "Sample Book"): Book {
  return {
    title,
    subtitle: "A test book",
    author: "Test Author",
    author_id: "author-123",
    last_modified: new Date().toISOString(),
    progress: 0.25,
    word_count: 5000,
    genre: "Fiction",
    subgenre: "Fantasy",
    collaborator_count: 1,
    featured: false,
    book_type: "Novel",
    prose: "Third Person",
    language: "English",
    publisher: "Self Published",
    published_status: "Unpublished",
    synopsis: "A sample book for testing purposes.",
    description: "This is a longer description of the sample book.",
    is_shared: false,
    sync_state: "idle",
    conflict_state: "none",
    updated_at: Date.now(),
  };
}

export function createSampleVersion(bookId: string, name: string = "First Draft"): Version {
  return {
    book_id: bookId,
    name,
    status: "DRAFT",
    word_count: 5000,
    created_at: new Date().toISOString(),
    is_current: true,
    sync_state: "idle",
    conflict_state: "none",
    updated_at: Date.now(),
  };
}

export function createSampleChapter(bookId: string, versionId: string, title: string = "Chapter 1", position: number = 1): Chapter {
  return {
    book_id: bookId,
    version_id: versionId,
    title,
    position,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    word_count: 1000,
    has_proposals: false,
    status: "DRAFT",
    author_id: "author-123",
    last_modified_by: "author-123",
    summary: "This is a sample chapter.",
    goals: "Introduce the main character",
    notes: "Remember to add more description",
    is_complete: false,
    sync_state: "idle",
    conflict_state: "none",
  };
}

export function createSampleCharacter(bookId: string, name: string = "John Doe"): Character {
  return {
    book_id: bookId,
    name,
    full_name: `${name} Smith`,
    age: 25,
    gender: "Male",
    role: "Protagonist",
    backstory: "Born in a small town...",
    personality_type: "ENFJ",
    motivations: JSON.stringify(["Save the world", "Find love"]),
    notes: "Main character with strong moral compass",
    tags: JSON.stringify(["hero", "young", "brave"]),
  };
}
