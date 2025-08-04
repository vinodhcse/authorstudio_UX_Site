# Character Screen Time Layout

## Overview
The Character Screen Time Layout is a matrix-style ReactFlow visualization that shows character presence across the narrative structure. It displays characters on the X-axis and plot nodes (Acts → Chapters → Scenes) on the Y-axis.

## Features

### 🎯 Core Functionality
- **Matrix Layout**: Grid-style layout with characters as filters and plot nodes as hierarchy
- **Character Filtering**: Multi-select characters to focus on specific character arcs
- **Hierarchical Plot Structure**: Expandable Acts → Chapters → Scenes
- **Character Presence Indicators**: Visual badges showing how characters appear in each plot node

### 🎨 Visual Elements
- **Plot Node Cards**: Title, goal, status, and character presence indicators
- **Character Presence Types**:
  - ✅ **Active Participation**: Character actively participates in the scene
  - @ **Mentioned Only**: Character is referenced but not present
  - ❌ **Not Present**: Character is absent from this plot node

### 🔧 Interactive Behaviors
- **Expand/Collapse**: Click on Acts or Chapters to expand/collapse their children
- **Character Filter Toggle**: Show/hide character selection panel
- **Multi-Character Selection**: Select multiple characters to analyze their screen time
- **Hover Details**: Tooltip descriptions for character presence

## Data Structure

### Character Interface
```typescript
interface Character {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    color: string;
}
```

### Plot Node Interface
```typescript
interface PlotNodeData {
    id: string;
    type: 'act' | 'chapter' | 'scene';
    title: string;
    goal?: string;
    status: 'planned' | 'in-progress' | 'completed';
    parentId?: string;
    level: number;
    characterPresence: {
        [characterId: string]: {
            type: 'active' | 'mentioned' | 'absent';
            description?: string;
        };
    };
}
```

## Usage

### Integration
The layout is integrated into the PlotArcsBoard component and activated when the layout parameter is set to 'character-screentime':

```typescript
{currentLayout === 'character-screentime' ? (
    <CharacterScreenTimeLayout 
        theme={theme === 'system' ? 'dark' : theme}
    />
) : /* Other layouts */}
```

### URL Parameters
- `layout=character-screentime`: Activates this layout
- Layout changes are reflected in the URL for bookmarking and sharing

## Mock Data
Currently uses mock data for demonstration:
- 5 sample characters with different roles and colors
- Sample Acts and Chapters with realistic character presence data
- Various character participation patterns (active, mentioned, absent)

## Future Enhancements
1. **Search Integration**: Filter plot nodes by search query
2. **Character Analytics**: Show character screen time statistics
3. **Export Functionality**: Export character presence matrix
4. **Real Data Integration**: Connect to actual project data
5. **Drag & Drop**: Reorder characters in the filter
6. **Character Grouping**: Group characters by role or importance
7. **Time-based Analysis**: Show character presence over story timeline

## Technical Implementation
- **ReactFlow**: Uses ReactFlow for the interactive node-based visualization
- **Custom Node Types**: Custom PlotNodeComponent for specialized rendering
- **State Management**: React hooks for expansion state and character selection
- **Responsive Design**: Adapts to different screen sizes
- **Theme Support**: Light and dark theme compatibility

## Performance Considerations
- Efficient filtering of visible nodes based on expansion state
- Memoized calculations for nodes and edges
- Optimized re-renders using useCallback and useMemo
