# useChapters Hook - Offline/Online Fixes & Improvements

## Issues Fixed

### ✅ 1. **Removed Premature API Calls**
**Problem**: `apiClient.createPlotNode()` was being called during chapter creation, causing failures when offline.

**Solution**: 
- Removed all `apiClient.createPlotNode()` calls from `createChapter()`
- Create narrative nodes locally using `setNarrativeNodes()` 
- Only call chapter API when online, with graceful fallback

### ✅ 2. **Full Offline Support**
**Problem**: System failed when offline due to API dependencies.

**Solution**:
```typescript
// Only call API if online, otherwise mark as dirty for later sync
let apiSuccess = false;
if (isOnline) {
  try {
    await apiClient.createChapter(bookId, versionId, { ... });
    apiSuccess = true;
  } catch (apiErr) {
    appLog.warn('useChapters', 'Failed to create chapter in API (offline?), saving locally', apiErr);
  }
}

// Set sync state based on API success
syncState: apiSuccess ? 'idle' : 'dirty',
revCloud: apiSuccess ? new Date().getTime().toString() : undefined,
```

### ✅ 3. **Version Data Sync**
**Problem**: Book→Version data wasn't being updated with narrative nodes.

**Solution**:
```typescript
// Update version's plotCanvas with new nodes
if (updatePlotCanvas && bookId && versionId) {
  updatePlotCanvas(bookId, versionId, {
    nodes: [...narrativeNodes, chapterNode, sceneNode],
    edges: narrativeEdges
  });
}
```

### ✅ 4. **Proper Content Structure with SceneBeat**
**Problem**: Was using `sceneMetaSection` instead of `SceneBeatExtension`.

**Solution**:
```typescript
// OLD (incorrect)
{
  type: 'sceneMetaSection',
  attrs: { summary: '', goals: '', characters: [], plotNodeId: sceneNode.id, collapsed: false }
}

// NEW (correct)
{
  type: 'sceneBeat',
  attrs: {
    chapterName: title,
    sceneBeatIndex: 1,
    summary: '',
    goal: '',
    characters: [],
    worldEntities: [],
    status: 'Draft',
    plotNodeId: sceneNode.id // Link to scene node
  }
}
```

### ✅ 5. **Real User Data Integration**
**Problem**: Hardcoded user data (`'current-user'`, `'Current User'`).

**Solution**:
```typescript
// Get current user from auth store
const { user, isOnline } = useAuthStore();

// Use real user data
authorId: user?.id || 'unknown-user',
authorName: user?.name || 'Unknown User',
lastEditedBy: user?.id || 'unknown-user',
lastModifiedBy: user?.id || 'unknown-user'
```

### ✅ 6. **Online/Offline Sync Logic**
**Problem**: No checks for online status before cloud operations.

**Solution**:
```typescript
const syncToCloud = useCallback(async (chapterId?: string) => {
  // Check if online before attempting sync
  if (!isOnline) {
    const errorMessage = 'Cannot sync to cloud: You are currently offline';
    setError(errorMessage);
    appLog.warn('useChapters', 'Sync to cloud failed: offline');
    return;
  }
  // ... rest of sync logic
}, [bookId, versionId, chapters, isOnline, narrativeNodes, narrativeEdges, updatePlotCanvas]);
```

## New Architecture Benefits

### 1. **Local-First Approach**
- All operations work offline
- Data saved locally immediately
- Cloud sync happens when online and requested

### 2. **Proper Narrative Structure**
```typescript
// Narrative Node Creation (Local)
Outline Node (if not exists)
  ↓
Act Node (if not exists) 
  ↓
Chapter Node (always new)
  ↓
Scene Node (always new)

// Update version's plotCanvas with all nodes
updatePlotCanvas(bookId, versionId, { nodes, edges })
```

### 3. **Sync State Management**
```typescript
type SyncState = 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';

// Chapter created offline
syncState: 'dirty',
revLocal: '1755059600234',
revCloud: undefined

// Chapter synced to cloud  
syncState: 'idle',
revLocal: '1755059600234', 
revCloud: '1755059600234'
```

### 4. **Content Structure Improvements**
```json
{
  "type": "doc",
  "content": [
    { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Chapter 1" }] },
    {
      "type": "sceneBeat",
      "attrs": {
        "chapterName": "Chapter 1",
        "sceneBeatIndex": 1,
        "summary": "",
        "goal": "",
        "characters": [],
        "worldEntities": [],
        "status": "Draft",
        "plotNodeId": "scene_node_id_123"
      }
    },
    { "type": "paragraph", "content": [{ "type": "text", "text": "Start writing..." }] }
  ],
  "metadata": {
    "totalCharacters": 245,
    "totalWords": 42,
    "lastEditedAt": "2025-08-13T04:35:22.123Z",
    "lastEditedBy": "user_123"
  }
}
```

## Usage Examples

### 1. **Creating Chapter (Offline)**
```typescript
const { createChapter } = useChapters(bookId, versionId);

// Works offline - creates local narrative nodes and marks as dirty
const newChapter = await createChapter("Chapter 1");
// Result: syncState = 'dirty', revCloud = undefined
```

### 2. **Saving Content (Always Local First)**
```typescript
const { saveChapterContent } = useChapters(bookId, versionId);

// Always saves locally, marks as dirty
await saveChapterContent(chapterId, tiptapContent, true);
// Result: New revision added, syncState = 'dirty'
```

### 3. **Manual Cloud Sync**
```typescript
const { syncToCloud } = useChapters(bookId, versionId);

// Only works when online
await syncToCloud(); // Sync all dirty chapters
await syncToCloud(chapterId); // Sync specific chapter
```

### 4. **Checking Sync Status**
```typescript
const { chapters } = useChapters(bookId, versionId);

chapters.forEach(chapter => {
  switch (chapter.syncState) {
    case 'dirty': 
      console.log(`Chapter "${chapter.title}" has unsaved changes`);
      break;
    case 'pushing':
      console.log(`Chapter "${chapter.title}" is syncing to cloud`);
      break;
    case 'conflict':
      console.log(`Chapter "${chapter.title}" has sync conflicts`);
      break;
    case 'idle':
      console.log(`Chapter "${chapter.title}" is fully synced`);
      break;
  }
});
```

## Migration Impact

### Before (Problematic)
```typescript
// Failed offline due to API calls
await apiClient.createPlotNode(...); // ❌ Fails offline
await apiClient.createChapter(...);  // ❌ Required online

// Wrong content structure
type: 'sceneMetaSection' // ❌ Incorrect extension

// Hardcoded user data
authorId: 'current-user' // ❌ Not real user
```

### After (Improved)
```typescript
// Works offline with graceful degradation  
if (isOnline) {
  try { await apiClient.createChapter(...); } // ✅ Optional
  catch { /* Save locally only */ }           // ✅ Graceful fallback
}

// Correct content structure
type: 'sceneBeat' // ✅ Proper SceneBeatExtension

// Real user data
authorId: user?.id || 'unknown-user' // ✅ From useAuthStore
```

## Data Flow Summary

```
User Creates Chapter
      ↓
Create Narrative Nodes Locally (setNarrativeNodes)
      ↓
Update Version PlotCanvas (updatePlotCanvas)  
      ↓
Try API Call (if online)
      ↓
Set Sync State (idle/dirty based on API success)
      ↓
Local Chapter Created (always succeeds)

User Edits Content
      ↓
Save Locally (saveChapterContent)
      ↓
Add Revision + Mark Dirty
      ↓
Manual Sync to Cloud (syncToCloud when online)
```

This architecture ensures:
- ✅ **Offline-first**: All operations work without internet
- ✅ **Data integrity**: Local state always consistent  
- ✅ **Proper sync**: Clear indicators of sync status
- ✅ **Real user data**: Actual user information used
- ✅ **Correct structure**: Proper TipTap extensions and narrative nodes
