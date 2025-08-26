# Phase 3: Revision History UI & Diff Visualization

## 🎯 Phase 3 Objectives

Building upon the completed Phase 2 revision management service, Phase 3 focuses on creating the user interface components that allow writers to:

1. **View Revision Timeline** - Browse through chapter revision history
2. **Compare Revisions** - Side-by-side diff visualization 
3. **Restore Previous Versions** - One-click restoration to any revision
4. **Revision Metadata** - View timestamps, word counts, and commit messages
5. **Visual Diff Highlighting** - Clear indication of added, removed, and modified content

## 🏗️ Architecture Plan

### Component Structure
```
RevisionHistoryPanel/
├── RevisionTimeline.tsx        // Left panel: revision list
├── DiffViewer.tsx             // Right panel: side-by-side comparison
├── RevisionCard.tsx           // Individual revision entry
├── DiffHighlight.tsx          // Text diff highlighting
└── RevisionControls.tsx       // Actions (restore, compare, etc.)
```

### Integration Points
- **Tool Window System**: Add revision history as a dockable panel
- **ChapterRevisionManager**: Use existing service methods
- **TipTap Editor**: Integrate restoration functionality
- **Toast System**: User feedback for actions

## 📋 Implementation Tasks

### Task 1: Create Revision Timeline Component
- [ ] `RevisionTimeline.tsx` - Scrollable list of revisions
- [ ] `RevisionCard.tsx` - Individual revision display
- [ ] Fetch revisions using ChapterRevisionManager
- [ ] Display timestamps, word counts, commit messages
- [ ] Handle selection for comparison

### Task 2: Build Diff Viewer
- [ ] `DiffViewer.tsx` - Side-by-side comparison
- [ ] `DiffHighlight.tsx` - Text highlighting utilities
- [ ] Convert TipTap JSON to readable text
- [ ] Implement diff algorithm for content comparison
- [ ] Color-coded additions, deletions, modifications

### Task 3: Revision Controls
- [ ] `RevisionControls.tsx` - Action buttons
- [ ] Restore to revision functionality
- [ ] Compare selected revisions
- [ ] Delete old revisions (with confirmation)
- [ ] Export revision as separate document

### Task 4: Tool Window Integration
- [ ] Register revision history in tool window system
- [ ] Dockable panel with resize functionality
- [ ] Context-aware chapter selection
- [ ] Persistent panel state

### Task 5: Editor Integration
- [ ] Restore content to TipTap editor
- [ ] Highlight current revision in timeline
- [ ] Auto-refresh on new revisions
- [ ] Conflict resolution for unsaved changes

## 🎨 UI Design Specifications

### Revision Timeline (Left Panel)
```
┌─────────────────────────────┐
│ Chapter: "The Beginning"    │
├─────────────────────────────┤
│ [●] Major - 2:30 PM         │
│     "Added character intro" │
│     📝 1,245 words          │
├─────────────────────────────┤
│ [ ] Auto - 2:28 PM          │
│     📝 1,180 words          │
├─────────────────────────────┤
│ [ ] Auto - 2:25 PM          │
│     📝 1,095 words          │
└─────────────────────────────┘
```

### Diff Viewer (Right Panel)
```
┌───────────────┬───────────────┐
│ Revision A    │ Revision B    │
│ (2:25 PM)     │ (2:30 PM)     │
├───────────────┼───────────────┤
│ The old text  │ The new text  │
│ was simple.   │ was complex.  │
│               │ + Added line  │
│ - Removed     │               │
└───────────────┴───────────────┘
```

## 🔧 Technical Implementation

### Data Flow
```
1. RevisionTimeline fetches revisions via ChapterRevisionManager.getRevisionHistory()
2. User selects revision → Update DiffViewer with comparison
3. User clicks restore → ChapterRevisionManager.restoreToRevision()
4. Editor content updates → Timeline refreshes to show current state
```

### State Management
```typescript
interface RevisionHistoryState {
  revisions: ChapterRevision[];
  selectedRevision: string | null;
  compareRevision: string | null;
  isLoading: boolean;
  currentChapterId: string | null;
}
```

### Diff Algorithm
- Use existing `calculateDiff()` from ChapterRevisionManager
- Convert TipTap JSON to plain text for comparison
- Implement word-level and character-level diff highlighting
- Support for structural changes (headings, paragraphs, etc.)

## 🎯 Success Criteria

### User Experience
- [ ] Smooth timeline scrolling with lazy loading
- [ ] Instant diff highlighting without lag
- [ ] One-click restoration with confirmation
- [ ] Clear visual indicators for revision types
- [ ] Responsive design for different panel sizes

### Performance
- [ ] Handle 100+ revisions without performance issues
- [ ] Diff calculation under 100ms for typical chapters
- [ ] Efficient memory usage for large documents
- [ ] Smooth animations and transitions

### Integration
- [ ] Seamless integration with existing tool window system
- [ ] Real-time updates when new revisions are created
- [ ] Proper cleanup when chapter changes
- [ ] Error handling with user-friendly messages

## 🚀 Phase 3 Roadmap

### Week 1: Core Components
- Create basic revision timeline
- Implement revision card display
- Set up diff viewer structure

### Week 2: Diff Engine
- Build text comparison algorithm
- Implement diff highlighting
- Add side-by-side viewer

### Week 3: Integration
- Tool window system integration
- Editor restoration functionality
- Real-time updates

### Week 4: Polish
- Performance optimization
- UI/UX improvements
- Testing and bug fixes

## 📚 Dependencies

### Existing Services
- ✅ ChapterRevisionManager (Phase 2)
- ✅ Tool Window System
- ✅ TipTap Editor Integration
- ✅ Toast Notification System

### New Dependencies
- [ ] Diff library (consider `diff` or custom implementation)
- [ ] Virtual scrolling for large revision lists
- [ ] Text highlighting utilities

---

**Ready to begin Phase 3 implementation!** 🚀
