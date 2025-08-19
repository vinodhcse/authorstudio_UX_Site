// Authoritative Book Types - matches the refactor specification

export interface FileRef { 
  id: string; 
  url?: string; 
  meta?: Record<string, any> 
}

export interface Version {
  id: string;
  name: string;
  status?: 'active' | 'archived';
  wordCount?: number;
  createdAt?: string;
  contributor?: { name?: string; avatar?: string };
  
  // Free-form children under each version:
  chapters?: any[];        // encrypted or rich-json blocks
  plotCanvas?: { nodes: any[]; edges: any[] } | null;
  characters?: any[];
  plotArcs?: any[];
  worlds?: any[];
  
  // Sync/meta at the version level
  revLocal?: string;
  revCloud?: string;
  syncState?: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict' | 'error';
  conflictState?: 'none' | 'needs_review' | 'blocked';
  updatedAt?: number;
}

export interface Book {
  id: string;
  bookId?: string;              // keep for compatibility
  title: string;
  subtitle?: string;
  author?: string;
  authorId?: string;
  coverImage?: string;          // legacy
  coverImageRef?: FileRef;      // new
  coverImages?: string[];
  lastModified: string;
  progress: number;
  wordCount: number;
  genre: string;
  subgenre?: string;
  collaboratorCount: number;
  featured: boolean;
  bookType: string;
  prose: string;
  language: string;
  publisher: string;
  publishedStatus: string;
  publisherLink?: string;
  printISBN?: string;
  ebookISBN?: string;
  publisherLogo?: string;
  synopsis: string;
  description?: string;

  // Collaboration (optional to keep existing UI happy)
  collaborators?: Array<{ id: string; role: 'AUTHOR' | 'EDITOR' | 'REVIEWER' | 'ADMIN'; name?: string; avatar?: string }>;

  // IMPORTANT: Free-form JSON array of versions with all children
  versions: Version[];

  // Sync / conflict
  isShared?: boolean;
  revLocal?: string;
  revCloud?: string;
  syncState?: 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict' | 'error';
  conflictState?: 'none' | 'needs_review' | 'blocked';
  updatedAt?: number;
}

// Sync utility types
export type SyncState = 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict' | 'error';
export type ConflictState = 'none' | 'needs_review' | 'blocked';
export type ConflictResolution = 'local' | 'cloud' | 'merge';
