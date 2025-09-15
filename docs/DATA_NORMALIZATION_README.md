# Data Normalization for SurrealDB Integration

## Purpose

The purpose of normalization methods for book data is to handle the **naming convention differences** between the frontend and database layers:

- **Frontend (TypeScript)**: Uses `camelCase` naming convention
- **SurrealDB**: Uses `snake_case` naming convention

Without normalization methods, developers would need to manually map field names every time they interact with the database, leading to:
- Inconsistent code
- Runtime errors from field name mismatches
- Maintenance nightmares when schema changes
- Duplicated transformation logic throughout the codebase

## Solution

We've implemented **bidirectional normalization methods** for each entity:

### For Each Entity (Book, Version, Collaborator):

1. **`normalize()`** - Convert from FE camelCase to DB snake_case + add entity_id
2. **`denormalize()`** - Convert from DB snake_case to FE camelCase

## Entity Mapping Examples

### Book Entity

#### Normalize (FE → DB)
```typescript
// Frontend format (camelCase)
const frontendBook = {
  id: "book-123",
  authorId: "user-456", 
  wordCount: 50000,
  bookType: "Novel",
  publishedStatus: "Unpublished"
};

// After normalization (snake_case + entity_id)
const dbBook = {
  book_id: "book-123",    // Added entity_id
  author_id: "user-456",  // camelCase → snake_case
  word_count: 50000,      // camelCase → snake_case
  book_type: "Novel",     // camelCase → snake_case
  published_status: "Unpublished" // camelCase → snake_case
};
```

#### Denormalize (DB → FE)
```typescript
// Database format (snake_case)
const dbBook = {
  book_id: "book-123",
  author_id: "user-456",
  word_count: 50000,
  book_type: "Novel",
  published_status: "Unpublished"
};

// After denormalization (camelCase)
const frontendBook = {
  id: "book-123",          // book_id → id
  authorId: "user-456",    // snake_case → camelCase
  wordCount: 50000,        // snake_case → camelCase
  bookType: "Novel",       // snake_case → camelCase
  publishedStatus: "Unpublished" // snake_case → camelCase
};
```

### Version Entity

#### Normalize (FE → DB)
```typescript
// Frontend format
const frontendVersion = {
  id: "version-789",
  wordCount: 45000,
  createdAt: "2024-01-10T09:00:00Z",
  plotCanvas: { nodes: [], edges: [] }
};

// After normalization
const dbVersion = {
  version_id: "version-789",  // Added entity_id
  word_count: 45000,          // camelCase → snake_case
  created_at: "2024-01-10T09:00:00Z", // camelCase → snake_case
  plot_canvas: { nodes: [], edges: [] } // camelCase → snake_case
};
```

#### Denormalize (DB → FE)
```typescript
// Database format
const dbVersion = {
  version_id: "version-789",
  word_count: 45000,
  created_at: "2024-01-10T09:00:00Z",
  plot_canvas: { nodes: [], edges: [] }
};

// After denormalization
const frontendVersion = {
  id: "version-789",        // version_id → id
  wordCount: 45000,         // snake_case → camelCase
  createdAt: "2024-01-10T09:00:00Z", // snake_case → camelCase
  plotCanvas: { nodes: [], edges: [] } // snake_case → camelCase
};
```

### Collaborator Entity

#### Normalize (FE → DB)
```typescript
// Frontend format
const frontendCollaborator = {
  id: "user-999",
  name: "Jane Smith",
  email: "jane@example.com",
  role: "EDITOR"
};

// After normalization (with bookId context)
const dbCollaborator = {
  collaborator_id: "user-999", // Added entity_id
  book_id: "book-123",         // Added from context
  user_id: "user-999",         // The actual user ID
  name: "Jane Smith",
  email: "jane@example.com",
  role: "EDITOR",
  created_at: "2024-01-15T10:30:00Z", // Auto-generated
  updated_at: "2024-01-15T10:30:00Z", // Auto-generated
  status: "ACTIVE"             // Default status
};
```

#### Denormalize (DB → FE)
```typescript
// Database format
const dbCollaborator = {
  collaborator_id: "user-999",
  book_id: "book-123",
  user_id: "user-999",
  name: "Jane Smith",
  email: "jane@example.com",
  role: "EDITOR",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
  status: "ACTIVE"
};

// After denormalization
const frontendCollaborator = {
  id: "user-999",        // user_id → id
  name: "Jane Smith",
  email: "jane@example.com",
  role: "EDITOR"
  // Note: DB-specific fields like created_at, book_id are excluded
};
```

## SurrealThing Type for ID Enforcement

```typescript
export type SurrealThing =
  | string
  | { tb: string; id: string | number | { String?: string; Number?: number } };
```

This type ensures proper SurrealDB record identification by enforcing the table:id format.

## Usage in DAL Functions

### During Insert/Update (FE → DB)
```typescript
export async function createBook(book: Book): Promise<void> {
  // Use normalization to convert to DB format
  const dbBook = normalizeBookForDB(book);
  
  await invoke('app_create_book', {
    book: dbBook  // Sent in snake_case format
  });
}
```

### During Retrieval (DB → FE)
```typescript
export async function getUserBooks(userId: string): Promise<Book[]> {
  // Get snake_case data from DB
  const dbBooks = await invoke('app_get_user_books', { user_id: userId }) as any[];
  
  // Use denormalization to convert to FE format
  const books = dbBooks.map(denormalizeBook);
  
  return books; // Returns camelCase format
}
```

## File Structure

```
src/
├── utils/
│   └── dataTransform.ts          # Main normalization methods
├── data/
│   └── dal.ts                    # Updated to use normalization
├── examples/
│   └── dataTransformExamples.ts  # Usage examples
└── types/
    ├── bookTypes.ts              # FE type definitions
    └── types.ts                  # Additional FE types
```

## Benefits

1. **🎯 Consistency**: All DB operations use snake_case, all FE operations use camelCase
2. **🛡️ Type Safety**: TypeScript prevents field name errors at compile time
3. **🔧 Maintainability**: Single source of truth for field mappings
4. **🚀 Developer Experience**: No need to remember naming differences
5. **🏗️ SurrealDB Integration**: Proper ID handling and record management
6. **📦 Scalability**: Easy to extend for new entities

## Key Principles

- **Normalize**: Use when sending data TO the database
- **Denormalize**: Use when receiving data FROM the database
- **Entity IDs**: Always add `{entity}_id` field during normalization
- **Context**: Some entities (like Collaborator) need additional context (bookId)
- **Defaults**: Normalization methods provide sensible defaults for missing fields

This approach ensures clean separation between frontend and database concerns while maintaining type safety and developer productivity.
