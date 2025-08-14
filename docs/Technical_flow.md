# Technical Flow Documentation

## 🏗️ Application Architecture Overview

### Core Data Flow: MyBooksView → BookDetails → BookForge

```
📱 App.tsx (Main Router)
    ↓
🔐 AuthGate (Authentication Layer)
    ↓
📚 BookContextProvider (Global State)
    ↓
📖 MyBooksView.tsx → BookDetailsPage.tsx → BookForgePage.tsx
```

---

## 📁 File Purposes & Responsibilities

### 1. 🔐 Authentication & Encryption Layer

#### `useAuthStore.ts`
- **Purpose**: User authentication state management
- **Flow**: Login → Token management → User session persistence
- **Key Functions**: 
  - `login()` - Authenticates user and stores tokens
  - `logout()` - Clears session and redirects
  - `ensureAccessToken()` - Refreshes tokens automatically
  - `isAuthenticated` - Boolean state for auth status

#### `encryptionService.ts`
- **Purpose**: End-to-end encryption for all user content
- **Flow**: User passphrase → UDEK generation → Book-specific keys (BSK) → Content encryption
- **Key Functions**: 
  - `initialize(userId, passphrase)` - Sets up encryption keys from passphrase
  - `loadChapterContent(chapterId, userId)` - Decrypt chapter data for editing
  - `saveChapterContent(chapterId, content, userId)` - Encrypt and store chapter data
  - Multi-device key sync (planned for future)
- **Architecture**: Singleton service with UDEK (User Data Encryption Key) and BSK (Book-Specific Key) hierarchy

### 2. 💾 Data Persistence Layer

#### `dal.ts` (Data Access Layer - 933 lines)
- **Purpose**: SQLite database interface with transaction management
- **Key Tables**: 
  - `books` - Book metadata and sync state
  - `versions` - Book versions with encrypted content
  - `chapters` - Chapter data with encryption
  - `scenes` - Scene-level content (legacy)
  - `user_keys` - Encrypted user encryption keys
- **Critical Functions**:
  - `getUserBooks(userId)` - Fetch all books for user
  - `getBook(bookId)` / `putBook(book)` - Book CRUD operations
  - `getChaptersByVersion(bookId, versionId, userId)` - Load chapters for version
  - `putChapter(chapter)` - Save chapter with transaction state
  - `getDirtyChapters(userId)` - Find uncommitted transactions
- **Transaction States**: 
  - `'idle'` - Successfully committed to database
  - `'dirty'` - Pending commit, may be lost on logout

### 3. 🌐 Global State Management

#### `BookContext.tsx` (2396 lines - Central Hub)
- **Purpose**: Global book state management & data orchestration
- **Key State**:
  - `authoredBooks: Book[]` - Books owned by user
  - `editableBooks: Book[]` - Books user can edit (collaboration)
  - `reviewableBooks: Book[]` - Books user can review
  - `loading: boolean` - Global loading state
  - `error: string | null` - Global error state
- **Critical Functions**:
  - `getBook(bookId)` - Retrieve book from memory/database
  - `updateBook(bookId, updates)` - Update book metadata
  - `createVersion(bookId, versionData)` - Create new book version
  - `deleteVersion(bookId, versionId)` - Remove version and cleanup
  - `getCharacters(bookId, versionId)` - Character management
  - `syncAllBooks()` - Background sync with server
  - `getDirtyBooks()` / `getConflictedBooks()` - Transaction state monitoring
- **Data Sources**: Combines local SQLite + remote API + encrypted content

### 4. 📚 Chapter Management

#### `useChapters.ts` (1028 lines - Chapter Operations)
- **Purpose**: Chapter-specific CRUD operations with encryption integration
- **Key Functions**:
  - `createChapter(title, actId?)` - Creates new chapter with encryption setup
  - `updateChapter(chapterId, updates)` - Update chapter metadata
  - `deleteChapter(chapterId)` - Remove chapter and cleanup encryption
  - `saveChapterContent(chapterId, content, isMinor?)` - Auto-save with encryption
  - `refreshChapters()` - Reload chapters from database
  - `createAct(title)` / `deleteAct(actId)` - Act management for narrative structure
- **Transaction Flow**: Create → Encrypt → Save → Mark as 'idle'
- **State Management**: Returns `{ chapters, isLoading, error, ...functions }`

---

## 🔄 Data Flow Analysis

### Phase 1: Application Startup

```typescript
// App.tsx - Main application initialization
useEffect(() => {
  // 1. Load theme from localStorage or system preference
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme) {
    setTheme(savedTheme);
    applyTheme(savedTheme);
  } else {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = isDarkMode ? 'dark' : 'light';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }
}, []);

// AuthGate - Authentication check
useEffect(() => {
  // Check for existing session
  // Redirect to login if not authenticated
  // Initialize encryption service if authenticated
}, []);
```

### Phase 2: BookContext Initialization

```typescript
// BookContext.tsx - Global state setup
useEffect(() => {
  async function loadUserData() {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // 1. Load all books for user
      const books = await getUserBooks(user.id);
      console.log('📚 Loaded books:', books.length);
      
      // 2. Separate books by access level
      const authored = books.filter(book => book.owner_id === user.id);
      const editable = books.filter(book => book.collaborative_access?.includes('edit'));
      const reviewable = books.filter(book => book.collaborative_access?.includes('review'));
      
      setAuthoredBooks(authored);
      setEditableBooks(editable);
      setReviewableBooks(reviewable);
      
      // 3. Initialize encryption service
      await encryptionService.initialize(user.id, userPassphrase);
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }
  
  loadUserData();
}, [user]); // Triggers on login/logout

// Network status monitoring
useEffect(() => {
  const handleOnline = () => {
    console.log('🌐 Connection restored, triggering sync');
    syncAllBooks();
  };
  
  const handleOffline = () => {
    console.log('📴 Connection lost, switching to offline mode');
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Background sync timer
useEffect(() => {
  const interval = setInterval(() => {
    if (isAuthenticated && isOnline) {
      console.log('🔄 Background sync triggered');
      syncAllBooks();
    }
  }, 5 * 60 * 1000); // Every 5 minutes
  
  return () => clearInterval(interval);
}, [isAuthenticated, isOnline]);
```

### Phase 3: MyBooksView.tsx - Books Dashboard

```typescript
const MyBooksView: React.FC<{books: Book[]}> = ({ books }) => {
  const { createSampleData, syncAllBooks, getDirtyBooks, getConflictedBooks, loading } = useBookContext();
  const { isAuthenticated, user, isOnline } = useAuthStore();
  
  // Sync status monitoring
  const dirtyBooks = getDirtyBooks();
  const conflictedBooks = getConflictedBooks();
  
  // Manual sync trigger
  const handleSyncAll = async () => {
    try {
      console.log('🔄 Manual sync triggered by user');
      await syncAllBooks();
      toast.success('Books synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed: ' + error.message);
    }
  };
  
  // Sample data creation for new users
  const handleCreateSampleData = async () => {
    try {
      console.log('📝 Creating sample data');
      await createSampleData();
      toast.success('Sample books created');
    } catch (error) {
      console.error('Failed to create sample data:', error);
      toast.error('Failed to create sample data');
    }
  };
  
  return (
    <div>
      {/* Authentication status banners */}
      {!isAuthenticated && <AuthWarningBanner />}
      {isAuthenticated && !isOnline && <OfflineBanner />}
      
      {/* Sync status indicators */}
      {dirtyBooks.length > 0 && <DirtyBooksWarning count={dirtyBooks.length} />}
      {conflictedBooks.length > 0 && <ConflictWarning count={conflictedBooks.length} />}
      
      {/* Book grid */}
      {books.length === 0 ? (
        <EmptyState onCreateSample={handleCreateSampleData} />
      ) : (
        <BookGrid books={books} />
      )}
    </div>
  );
};
```

### Phase 4: BookDetailsPage.tsx Navigation

```typescript
// User clicks "Edit Book" → Navigate to BookDetailsPage
// URL: /book/:bookId

const BookDetailsPage = () => {
  const { bookId } = useParams();
  const { getBook, updateBook, createVersion, deleteVersion } = useBookContext();
  
  const book = getBook(bookId);
  
  useEffect(() => {
    console.log('📖 BookDetailsPage loaded for book:', bookId);
    // Load additional book metadata if needed
  }, [bookId]);
  
  // Version management
  const handleCreateVersion = async (versionData) => {
    try {
      const newVersion = await createVersion(bookId, versionData);
      console.log('✨ New version created:', newVersion.id);
      navigate(`/book/${bookId}/version/${newVersion.id}`);
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  };
  
  return (
    <div>
      {/* Book metadata editing */}
      <BookMetadataForm book={book} onSave={(updates) => updateBook(bookId, updates)} />
      
      {/* Version management */}
      <VersionList 
        versions={book.versions} 
        onCreateVersion={handleCreateVersion}
        onDeleteVersion={(versionId) => deleteVersion(bookId, versionId)}
      />
      
      {/* Navigation to writing interface */}
      <Button onClick={() => navigate(`/book/${bookId}/version/${currentVersionId}`)}>
        Start Writing
      </Button>
    </div>
  );
};
```

### Phase 5: BookForgePage.tsx - Writing Interface

```typescript
const BookForgePage = () => {
  const { bookId, versionId } = useParams<{ bookId: string, versionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Load current book & version from context
  const { currentBook, currentVersion, loading, error } = useCurrentBookAndVersion();
  
  // Load chapters for this specific version
  const shouldLoadChapters = Boolean(bookId && versionId);
  const { 
    chapters, 
    createChapter,
    updateChapter,
    deleteChapter,
    saveChapterContent, 
    createAct,
    deleteAct,
    reorderChapter,
    isLoading: chaptersLoading
  } = useChapters(
    shouldLoadChapters ? bookId! : '', 
    shouldLoadChapters ? versionId! : ''
  );
  
  // Chapter selection state
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isChapterLoading, setIsChapterLoading] = useState(false);
  
  // Derive current chapter from selection
  const currentChapter = selectedChapterId 
    ? chapters.find(ch => ch.id === selectedChapterId)
    : null;
  
  // URL parameter handling for chapter navigation
  useEffect(() => {
    console.log('🔄 BookForgePage URL params changed:', { bookId, versionId });
    
    const chapterParam = searchParams.get('chapter');
    if (chapterParam && chapters.find(ch => ch.id === chapterParam)) {
      setSelectedChapterId(chapterParam);
    } else if (chapters.length > 0 && !selectedChapterId) {
      // Auto-select first chapter if none selected
      setSelectedChapterId(chapters[0].id);
    }
  }, [searchParams, chapters, selectedChapterId]);
  
  // Chapter content loading
  useEffect(() => {
    async function loadChapterContent() {
      if (!selectedChapterId || !user?.id) return;
      
      try {
        setIsChapterLoading(true);
        console.log('📄 Loading chapter content:', selectedChapterId);
        
        const content = await encryptionService.loadChapterContent(selectedChapterId, user.id);
        setEditorContent(content);
        
        console.log('✅ Chapter content loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load chapter content:', error);
        setError('Failed to load chapter content');
      } finally {
        setIsChapterLoading(false);
      }
    }
    
    loadChapterContent();
  }, [selectedChapterId, user?.id]);
  
  // Auto-save functionality
  useEffect(() => {
    if (!selectedChapterId || !hasUnsavedChanges) return;
    
    const saveTimer = setTimeout(() => {
      console.log('💾 Auto-saving chapter:', selectedChapterId);
      saveChapterContent(selectedChapterId, editorContent, true); // isMinor = true for auto-save
    }, 30000); // 30 second delay
    
    return () => clearTimeout(saveTimer);
  }, [editorContent, selectedChapterId, hasUnsavedChanges]);
  
  return (
    <div className="book-forge-page">
      {/* Header with chapter navigation */}
      <EditorHeader 
        book={currentBook}
        version={currentVersion}
        currentChapter={currentChapter}
        chapters={chapters} // Pass chapters directly to avoid data source inconsistency
        onCreateChapter={createChapter}
        onUpdateChapter={updateChapter}
        onDeleteChapter={deleteChapter}
        onNavigateToChapter={(chapterId) => {
          setSelectedChapterId(chapterId);
          setSearchParams(prev => ({ ...prev, chapter: chapterId }));
        }}
        isChapterLoading={chaptersLoading}
      />
      
      {/* Main editor */}
      {isChapterLoading ? (
        <LoadingSpinner />
      ) : currentChapter ? (
        <Editor 
          content={editorContent}
          onChange={setEditorContent}
          onSave={() => saveChapterContent(selectedChapterId, editorContent)}
        />
      ) : (
        <EmptyChapterState onCreateChapter={createChapter} />
      )}
      
      {/* Footer with save status */}
      <EditorFooter 
        saveStatus={saveStatus}
        wordCount={wordCount}
        lastSaved={lastSaved}
      />
    </div>
  );
};
```

---

## 🔄 UseEffect Flows & Triggers

### BookContext.tsx Effects

#### 1. Initial Data Loading
```typescript
useEffect(() => {
  async function loadAllUserData() {
    if (!user?.id) return;
    
    console.log('🚀 BookContext: Loading all user data');
    setLoading(true);
    
    try {
      // Load books
      const books = await getUserBooks(user.id);
      console.log('📚 Loaded books:', books.length);
      
      // Categorize by access level
      const authored = books.filter(book => book.owner_id === user.id);
      const editable = books.filter(book => book.collaborative_access?.includes('edit'));
      const reviewable = books.filter(book => book.collaborative_access?.includes('review'));
      
      setAuthoredBooks(authored);
      setEditableBooks(editable);
      setReviewableBooks(reviewable);
      
      // Load character data for all books
      await loadCharactersForBooks(books);
      
      // Load world building data
      await loadWorldBuildingData(books);
      
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }
  
  loadAllUserData();
}, [user]); // Triggers on login/logout
```

#### 2. Network Status Monitoring
```typescript
useEffect(() => {
  const handleOnline = () => {
    console.log('🌐 Network restored - triggering background sync');
    setIsOnline(true);
    
    // Sync all dirty books
    syncAllBooks();
  };
  
  const handleOffline = () => {
    console.log('📴 Network lost - switching to offline mode');
    setIsOnline(false);
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

#### 3. Background Sync Timer
```typescript
useEffect(() => {
  if (!isAuthenticated) return;
  
  const syncInterval = setInterval(() => {
    if (isOnline) {
      console.log('⏰ Background sync timer triggered');
      syncAllBooks();
    }
  }, 5 * 60 * 1000); // Every 5 minutes
  
  return () => clearInterval(syncInterval);
}, [isAuthenticated, isOnline]);
```

### useChapters.ts Effects

#### 1. Chapter Loading
```typescript
const loadChapters = useCallback(async () => {
  if (!bookId || !versionId || !user?.id) {
    setIsLoading(false);
    return;
  }

  try {
    setIsLoading(true);
    setError(null);
    
    console.log('📄 Loading chapters for version:', { bookId, versionId });

    // Load chapters from database
    const chapterRows = await getChaptersByVersion(bookId, versionId, user.id);
    console.log('📊 Raw chapter rows:', chapterRows.length);

    // Decrypt chapter content
    const { encryptionService } = await import('../services/encryptionService');
    const chaptersData: Chapter[] = [];
    
    for (const row of chapterRows) {
      try {
        let decryptedContent = null;
        
        if (row.content_enc && row.content_enc.length > 0) {
          decryptedContent = await encryptionService.loadChapterContent(row.chapter_id, user.id);
        } else {
          // Fallback content for empty chapters
          decryptedContent = createDefaultChapterContent(row.title);
        }
        
        const chapter: Chapter = {
          id: row.chapter_id,
          title: row.title,
          content: decryptedContent,
          position: row.position,
          linkedAct: row.linked_act,
          wordCount: calculateWordCount(decryptedContent),
          lastModified: new Date(row.updated_at),
          syncState: row.sync_state as 'idle' | 'dirty'
        };
        
        chaptersData.push(chapter);
        
      } catch (decryptError) {
        console.warn(`⚠️ Failed to decrypt chapter ${row.chapter_id}:`, decryptError);
        // Add chapter with fallback content
        chaptersData.push(createFallbackChapter(row));
      }
    }
    
    // Sort by position
    chaptersData.sort((a, b) => a.position - b.position);
    
    setChapters(chaptersData);
    console.log('✅ Chapters loaded successfully:', chaptersData.length);
    
  } catch (error) {
    console.error('❌ Failed to load chapters:', error);
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
}, [bookId, versionId, user?.id]);

useEffect(() => {
  loadChapters();
}, [loadChapters]);
```

#### 2. Chapter Events Listener
```typescript
useEffect(() => {
  const handleChapterEvents = () => {
    console.log('🔄 Chapter event detected, refreshing chapters');
    loadChapters();
  };
  
  // Listen for chapter CRUD events
  window.addEventListener('chapterCreated', handleChapterEvents);
  window.addEventListener('chapterUpdated', handleChapterEvents);
  window.addEventListener('chapterDeleted', handleChapterEvents);
  
  return () => {
    window.removeEventListener('chapterCreated', handleChapterEvents);
    window.removeEventListener('chapterUpdated', handleChapterEvents);
    window.removeEventListener('chapterDeleted', handleChapterEvents);
  };
}, [loadChapters]);
```

### BookForgePage.tsx Effects

#### 1. URL Parameter Management
```typescript
useEffect(() => {
  console.log('🔗 URL parameters changed:', { bookId, versionId });
  console.log('📊 Available chapters:', chapters.map(ch => ({ id: ch.id, title: ch.title })));
  
  const chapterParam = searchParams.get('chapter');
  const modeParam = searchParams.get('mode') || 'Writing';
  const tabParam = searchParams.get('tab') || 'PlotArcs';
  
  // Update active mode and tab
  setActiveMode(modeParam);
  setActivePlanningTab(getTabName(tabParam));
  
  // Handle chapter selection
  if (chapterParam) {
    const targetChapter = chapters.find(ch => ch.id === chapterParam);
    if (targetChapter) {
      console.log('🎯 Selecting chapter from URL:', targetChapter.title);
      setSelectedChapterId(chapterParam);
    } else {
      console.warn('⚠️ Chapter not found in URL params:', chapterParam);
      // Remove invalid chapter from URL
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('chapter');
        return newParams;
      });
    }
  } else if (chapters.length > 0 && !selectedChapterId) {
    // Auto-select first chapter if none selected
    console.log('🎯 Auto-selecting first chapter:', chapters[0].title);
    setSelectedChapterId(chapters[0].id);
    setSearchParams(prev => ({ ...prev, chapter: chapters[0].id }));
  }
}, [searchParams, chapters, selectedChapterId]);
```

#### 2. Chapter Content Loading
```typescript
useEffect(() => {
  async function loadCurrentChapterContent() {
    if (!selectedChapterId || !user?.id) {
      setEditorContent(null);
      return;
    }
    
    try {
      setIsChapterLoading(true);
      console.log('📖 Loading content for chapter:', selectedChapterId);
      
      const content = await encryptionService.loadChapterContent(selectedChapterId, user.id);
      setEditorContent(content);
      setHasUnsavedChanges(false);
      
      console.log('✅ Chapter content loaded successfully');
      
      // Update document title
      const chapter = chapters.find(ch => ch.id === selectedChapterId);
      if (chapter) {
        document.title = `${chapter.title} - ${currentBook?.title || 'AuthorStudio'}`;
      }
      
    } catch (error) {
      console.error('❌ Failed to load chapter content:', error);
      setError('Failed to load chapter content: ' + error.message);
    } finally {
      setIsChapterLoading(false);
    }
  }
  
  loadCurrentChapterContent();
}, [selectedChapterId, user?.id, chapters, currentBook?.title]);
```

#### 3. Auto-save with Debouncing
```typescript
useEffect(() => {
  if (!selectedChapterId || !editorContent || !hasUnsavedChanges) return;
  
  const autoSaveTimer = setTimeout(() => {
    console.log('💾 Auto-saving chapter content');
    saveChapterContent(selectedChapterId, editorContent, true); // isMinor = true
  }, 30000); // 30 seconds after last change
  
  return () => {
    clearTimeout(autoSaveTimer);
  };
}, [editorContent, selectedChapterId, hasUnsavedChanges, saveChapterContent]);

// Immediate save on certain triggers
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      
      // Attempt immediate save
      if (selectedChapterId && editorContent) {
        saveChapterContent(selectedChapterId, editorContent, false);
      }
    }
  };
  
  const handleVisibilityChange = () => {
    if (document.hidden && hasUnsavedChanges && selectedChapterId && editorContent) {
      console.log('💾 Page hidden, saving immediately');
      saveChapterContent(selectedChapterId, editorContent, false);
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [hasUnsavedChanges, selectedChapterId, editorContent, saveChapterContent]);
```

---

## ⚠️ Identified Architecture Issues

### 1. Transaction State Management Problems

**Issue**: Chapters can remain in 'dirty' state indefinitely
```typescript
// Problem in dal.ts putChapter function
export async function putChapter(chapter: ChapterRow): Promise<void> {
  // Saves chapter but doesn't always update sync_state to 'idle'
  // This causes chapters to appear lost after logout/login
}
```

**Root Cause**: 
- `putChapter()` saves content but doesn't always mark as 'idle'
- Multiple save paths don't consistently update transaction state
- No automatic cleanup of dirty transactions

**Impact**: 
- Users lose work after logout/login
- Inconsistent data between sessions
- Sync conflicts and data corruption

### 2. Data Source Inconsistencies

**Issue**: Multiple components fetch chapters separately
```typescript
// Problem: EditorHeader fetches chapters independently
const EditorHeader = () => {
  const { getChaptersByVersion } = useBookContext();
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  
  useEffect(() => {
    const chapters = await getChaptersByVersion(bookId, versionId);
    setAllChapters(chapters); // Different data source than main view
  }, [bookId, versionId]);
};

// Meanwhile, BookForgePage uses useChapters hook
const BookForgePage = () => {
  const { chapters } = useChapters(bookId, versionId); // Different data source
};
```

**Root Cause**: 
- EditorHeader used `getChaptersByVersion()` directly
- Main view used `useChapters()` hook
- No single source of truth for chapter data

**Impact**: 
- Dropdown shows wrong chapter counts
- UI inconsistencies between components
- Race conditions in data loading

### 3. Sync State Complexity

**Issue**: Multiple sync mechanisms can conflict
```typescript
// Problem: Multiple overlapping sync triggers
// 1. BookContext auto-sync every 5 minutes
useEffect(() => {
  const interval = setInterval(syncAllBooks, 5 * 60 * 1000);
}, []);

// 2. Network event sync
useEffect(() => {
  window.addEventListener('online', syncAllBooks);
}, []);

// 3. Manual sync from UI
const handleSyncAll = () => syncAllBooks();

// 4. useChapters refresh
const refreshChapters = () => loadChapters();
```

**Root Cause**: 
- Multiple independent sync mechanisms
- No coordination between sync operations
- Race conditions between local and remote state

**Impact**: 
- Conflicting sync operations
- Data inconsistencies
- Performance issues from redundant syncs

### 4. Encryption Service Singleton Issues

**Issue**: Multiple imports can create different instances
```typescript
// Problem: Inconsistent import patterns
import { encryptionService } from '../services/encryptionService'; // Static import

// vs

const { encryptionService } = await import('../services/encryptionService'); // Dynamic import
```

**Root Cause**: 
- Mixed static and dynamic imports
- Service not guaranteed to be singleton
- Initialization state can be inconsistent

**Impact**: 
- Decryption failures
- Inconsistent encryption state
- Memory leaks from multiple instances

### 5. Error Boundary and Recovery Issues

**Issue**: Limited error recovery mechanisms
```typescript
// Problem: Errors can crash entire component trees
const MyComponent = () => {
  const { chapters } = useChapters(bookId, versionId);
  // If chapters fail to load, entire component fails
  // No graceful degradation or retry mechanisms
};
```

**Root Cause**: 
- Insufficient error boundaries
- No retry logic for failed operations
- Limited fallback UI states

**Impact**: 
- App crashes on data errors
- Poor user experience
- Data loss in error scenarios

---

## 🔧 Recommended Fixes

### 1. Centralize Chapter Management
```typescript
// Fix: All components should use useChapters() hook
const EditorHeader = ({ chapters, ...props }) => {
  // Accept chapters as prop instead of fetching separately
  // No more independent chapter fetching
};

const BookForgePage = () => {
  const { chapters } = useChapters(bookId, versionId);
  
  return (
    <EditorHeader 
      chapters={chapters} // Pass chapters down
      {...otherProps}
    />
  );
};
```

### 2. Fix Transaction Commits
```typescript
// Fix: Ensure putChapter() always updates sync_state
export async function putChapter(chapter: ChapterRow): Promise<void> {
  await database.execute(
    'UPDATE chapters SET content_enc = ?, sync_state = ?, updated_at = ? WHERE chapter_id = ?',
    [chapter.content_enc, 'idle', Date.now(), chapter.chapter_id] // Always mark as 'idle'
  );
}
```

### 3. Unified Sync Strategy
```typescript
// Fix: Single sync coordinator
class SyncCoordinator {
  private syncInProgress = false;
  private pendingSyncRequests = new Set();
  
  async sync(trigger: 'manual' | 'auto' | 'network') {
    if (this.syncInProgress) {
      this.pendingSyncRequests.add(trigger);
      return;
    }
    
    this.syncInProgress = true;
    try {
      await this.performSync();
    } finally {
      this.syncInProgress = false;
      // Process any pending requests
    }
  }
}
```

### 4. Encryption Service Singleton
```typescript
// Fix: Ensure true singleton pattern
class EncryptionService {
  private static instance: EncryptionService | null = null;
  
  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }
}

export const encryptionService = EncryptionService.getInstance();
```

### 5. Add Error Boundaries and Recovery
```typescript
// Fix: Comprehensive error handling
const ChapterErrorBoundary = ({ children, onRetry }) => {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <ChapterErrorFallback 
          error={error} 
          onRetry={() => {
            resetError();
            onRetry();
          }}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

---

## 📊 Performance Considerations

### Database Optimization
- Use indexes on frequently queried columns
- Implement connection pooling
- Add query result caching
- Optimize transaction batch sizes

### Memory Management
- Implement chapter content lazy loading
- Add content cleanup for unused chapters
- Use WeakMap for temporary caches
- Monitor memory usage patterns

### Network Optimization
- Implement incremental sync
- Add request debouncing
- Use compression for large payloads
- Add offline queue management

This architecture analysis reveals a sophisticated but complex system with multiple potential points of failure in transaction and sync management layers. The recommended fixes focus on data consistency, centralized state management, and robust error handling.
