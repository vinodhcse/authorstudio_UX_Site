/**
 * Example Usage of Data Normalization Methods
 * 
 * This file demonstrates how to use the normalization methods for Book, Version, and Collaborator entities
 * when working with SurrealDB integration in the AuthorStudio application.
 */

import { invoke } from '@tauri-apps/api/core';
import { 
  normalizeBook, 
  denormalizeBook,
  normalizeVersion,
  denormalizeVersion,
  normalizeCollaborator,
  denormalizeCollaborator,
  normalizeBookForDB,
  normalizeVersionForDB,
  normalizeCollaboratorForDB
} from '../utils/dataTransform';
import type { Book, Version } from '../types/bookTypes';
import type { Collaborator } from '../types';

// ================================
// EXAMPLE 1: Book Normalization
// ================================

const frontendBook: Book = {
  id: "book-123",
  title: "My Amazing Novel",
  authorId: "user-456",
  wordCount: 50000,
  lastModified: "2024-01-15T10:30:00Z",
  progress: 75,
  genre: "Fantasy",
  bookType: "Novel",
  prose: "Third Person",
  language: "English",
  publisher: "Indie Press",
  publishedStatus: "Unpublished",
  synopsis: "An epic fantasy adventure...",
  featured: false,
  collaboratorCount: 3,
  collaborators: [],
  versions: []
};

// When inserting/updating in database:
const normalizedForDB = normalizeBook(frontendBook);
console.log("Normalized for DB:", normalizedForDB);
/* Output will be:
{
  book_id: "book-123",
  title: "My Amazing Novel",
  author_id: "user-456",
  word_count: 50000,
  last_modified: "2024-01-15T10:30:00Z",
  progress: 75,
  genre: "Fantasy",
  book_type: "Novel",
  prose: "Third Person",
  language: "English",
  publisher: "Indie Press",
  published_status: "Unpublished",
  synopsis: "An epic fantasy adventure...",
  featured: false,
  collaborator_count: 3,
  status: "ACTIVE"
  // ... other normalized fields
}
*/

// When retrieving from database (assuming DB returned snake_case):
const dbBook = {
  book_id: "book-123",
  title: "My Amazing Novel",
  author_id: "user-456",
  word_count: 50000,
  last_modified: "2024-01-15T10:30:00Z",
  // ... other DB fields in snake_case
};

const denormalizedBook = denormalizeBook(dbBook);
console.log("Denormalized from DB:", denormalizedBook);
/* Output will be:
{
  id: "book-123",
  title: "My Amazing Novel",
  authorId: "user-456",
  wordCount: 50000,
  lastModified: "2024-01-15T10:30:00Z",
  // ... other fields in camelCase
}
*/

// ================================
// EXAMPLE 2: Version Normalization
// ================================

const frontendVersion: Version = {
  id: "version-789",
  name: "First Draft",
  status: "active",
  wordCount: 45000,
  createdAt: "2024-01-10T09:00:00Z",
  contributor: {
    name: "John Doe",
    avatar: "https://example.com/avatar.jpg"
  },
  chapters: [],
  characters: [],
  plotArcs: [],
  worlds: [],
  plotCanvas: null
};

// When inserting/updating in database:
const normalizedVersion = normalizeVersion(frontendVersion);
console.log("Normalized Version:", normalizedVersion);
/* Output will be:
{
  version_id: "version-789",
  name: "First Draft",
  status: "active",
  word_count: 45000,
  created_at: "2024-01-10T09:00:00Z",
  contributor: {
    name: "John Doe",
    avatar: "https://example.com/avatar.jpg"
  },
  chapters: [],
  characters: [],
  plot_arcs: [],
  worlds: [],
  plot_canvas: null
}
*/

// When retrieving from database:
const dbVersion = {
  version_id: "version-789",
  name: "First Draft",
  status: "active",
  word_count: 45000,
  created_at: "2024-01-10T09:00:00Z",
  // ... other DB fields
};

const denormalizedVersion = denormalizeVersion(dbVersion);
console.log("Denormalized Version:", denormalizedVersion);

// ================================
// EXAMPLE 3: Collaborator Normalization
// ================================

const frontendCollaborator: Collaborator = {
  id: "user-999",
  avatar: "https://example.com/collaborator-avatar.jpg",
  name: "Jane Smith",
  email: "jane@example.com",
  role: "EDITOR"
};

const bookId = "book-123";

// When inserting/updating in database:
const normalizedCollaborator = normalizeCollaborator(frontendCollaborator, bookId);
console.log("Normalized Collaborator:", normalizedCollaborator);
/* Output will be:
{
  collaborator_id: "user-999",
  book_id: "book-123",
  user_id: "user-999",
  avatar: "https://example.com/collaborator-avatar.jpg",
  name: "Jane Smith",
  email: "jane@example.com",
  role: "EDITOR",
  created_at: "2024-01-15T...",
  updated_at: "2024-01-15T...",
  status: "ACTIVE"
}
*/

// When retrieving from database:
const dbCollaborator = {
  collaborator_id: "user-999",
  book_id: "book-123",
  user_id: "user-999",
  avatar: "https://example.com/collaborator-avatar.jpg",
  name: "Jane Smith",
  email: "jane@example.com",
  role: "EDITOR",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
  status: "ACTIVE"
};

const denormalizedCollaborator = denormalizeCollaborator(dbCollaborator);
console.log("Denormalized Collaborator:", denormalizedCollaborator);
/* Output will be:
{
  id: "user-999",
  avatar: "https://example.com/collaborator-avatar.jpg",
  name: "Jane Smith",
  email: "jane@example.com",
  role: "EDITOR"
}
*/

// ================================
// EXAMPLE 4: Using with enforced IDs for SurrealDB
// ================================

// For proper SurrealDB integration with enforced IDs:
const bookForDB = normalizeBookForDB(frontendBook);
console.log("Book with enforced SurrealDB ID:", bookForDB);

const versionForDB = normalizeVersionForDB(frontendVersion, bookId);
console.log("Version with enforced SurrealDB ID:", versionForDB);

const collaboratorForDB = normalizeCollaboratorForDB(frontendCollaborator, bookId);
console.log("Collaborator with enforced SurrealDB ID:", collaboratorForDB);

// ================================
// EXAMPLE 5: Practical DAL Usage
// ================================

export async function exampleCreateBook(book: Book) {
  try {
    // Use normalization in DAL function
    const normalizedBook = normalizeBookForDB(book);
    
    // Send to Tauri backend
    await invoke('app_create_book', {
      book: normalizedBook
    });
    
    console.log('Book created successfully');
  } catch (error) {
    console.error('Failed to create book:', error);
  }
}

export async function exampleGetBooks(userId: string): Promise<Book[]> {
  try {
    // Get from Tauri backend (returns snake_case data)
    const dbBooks = await invoke('app_get_user_books', { user_id: userId }) as any[];
    
    // Use denormalization to convert to frontend format
    const books = dbBooks.map(denormalizeBook);
    
    return books;
  } catch (error) {
    console.error('Failed to get books:', error);
    return [];
  }
}

export async function exampleUpdateCollaborator(collaborator: Collaborator, bookId: string) {
  try {
    // Normalize for database
    const normalizedCollaborator = normalizeCollaboratorForDB(collaborator, bookId);
    
    // Send to backend
    await invoke('app_update_collaborator', {
      collaborator: normalizedCollaborator
    });
    
    console.log('Collaborator updated successfully');
  } catch (error) {
    console.error('Failed to update collaborator:', error);
  }
}

// ================================
// Summary of Benefits
// ================================

/**
 * BENEFITS OF NORMALIZATION METHODS:
 * 
 * 1. **Consistent Data Format**: 
 *    - Frontend always uses camelCase
 *    - Database always uses snake_case
 *    - No more manual field mapping
 * 
 * 2. **Type Safety**: 
 *    - TypeScript ensures correct field types
 *    - Reduced runtime errors from field mismatches
 * 
 * 3. **Maintainability**: 
 *    - Centralized transformation logic
 *    - Easy to update when schema changes
 *    - Single source of truth for field mappings
 * 
 * 4. **SurrealDB Integration**: 
 *    - Proper ID enforcement using SurrealThing type
 *    - Handles complex nested objects correctly
 *    - Supports batch operations
 * 
 * 5. **Development Efficiency**: 
 *    - Developers don't need to remember field name differences
 *    - Consistent API across all entity types
 *    - Clear separation between FE and DB concerns
 */
