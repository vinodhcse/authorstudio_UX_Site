# Tiptap Custom Nodes - Integration Guide

## Overview
This guide demonstrates how to use the three new interactive block sections integrated into the Tiptap v3 editor:

1. **🔗 Scene Beat Section** - Interactive scene planning with React Flow integration
2. **🗒️ Note Section** - Persistent reminder and note-taking system  
3. **🎭 Character Impersonation Section** - AI-powered character roleplay blocks

## Quick Start

### Using the Slash Menu
Type `/` in the editor to open the floating menu, then select one of the new options:

- **🔗 Scene Beat** - Creates a collapsible scene planning block
- **🗒️ Note Section** - Adds a note-taking area with label support
- **🎭 Character Impersonation** - Starts an AI character conversation

### Scene Beat Section Features

#### Basic Usage
```typescript
// Programmatically insert a Scene Beat
editor.chain().focus().setSceneBeat({
  chapterName: 'Chapter 1',
  sceneBeatIndex: 1,
  summary: 'Opening scene description',
  goal: 'Introduce the protagonist',
  characters: ['Nemar', 'Attican'],
  worldEntities: ['The Crystal Tower'],
  status: 'Draft'
}).run();
```

#### Interactive Features
- **Expand/Collapse**: Click the chevron to toggle detailed view
- **Edit Mode**: Click "Edit" to modify scene details
- **Character Detection**: Click "🔍 Detect Characters" for AI character analysis
- **Status Management**: Toggle between Draft/In Progress/Complete/Published
- **React Flow Sync**: Automatically syncs with canvas visualization

#### Status Indicators
- 🟡 **Draft** - Initial planning phase
- 🔵 **In Progress** - Currently being written
- 🟢 **Complete** - Scene is finished
- 🟣 **Published** - Scene is finalized

### Note Section Features

#### Basic Usage
```typescript
// Programmatically insert a Note Section
editor.chain().focus().setNoteSection({
  content: 'Remember to check character motivations',
  labels: ['character-development', 'plot']
}).run();
```

#### Label System
- **@label syntax**: Type `@plot` or `@character` to create colored labels
- **Auto-completion**: Quick label insertion with common writing tags
- **Color coding**: Labels are automatically color-coded for organization
- **Auto-save**: Notes are automatically saved as you type

#### Common Labels
- `@plot` - Story plot points
- `@character` - Character development notes
- `@worldbuilding` - World and setting details
- `@dialogue` - Dialogue improvements
- `@research` - Research reminders
- `@revision` - Revision notes

### Character Impersonation Features

#### Basic Usage
```typescript
// Programmatically insert Character Impersonation
editor.chain().focus().setCharacterImpersonation({
  activeCharacter: 'Nemar',
  availableCharacters: ['Nemar', 'Attican', 'Elissa', 'Ferris', 'Garius']
}).run();
```

#### Interactive Chat System
- **Character Selection**: Switch between available characters
- **Conversation Display**: View chat history with character avatars
- **AI Responses**: Get AI-generated character responses
- **Character Context**: Maintains character personality and voice

#### Character Database
The system includes predefined characters:
- **Nemar** - The determined protagonist
- **Attican** - The wise mentor figure  
- **Elissa** - The skilled archer
- **Ferris** - The loyal companion
- **Garius** - The strategic leader

## Advanced Integration

### React Flow Canvas Integration

The Scene Beat nodes automatically sync with a React Flow canvas for visual story mapping:

```typescript
import { ReactFlowIntegration } from './EditorEnhancements';

// Subscribe to Scene Beat changes
const flowIntegration = ReactFlowIntegration.getInstance();
const unsubscribe = flowIntegration.subscribe((nodes, edges) => {
  // Update your React Flow component
  setFlowNodes(nodes);
  setFlowEdges(edges);
});
```

### Data Persistence

All custom nodes support automatic save/load functionality:

```typescript
import { CustomNodeStorage } from './EditorEnhancements';

// Save node data
CustomNodeStorage.saveNodeData('scene-beat-1', sceneData);

// Load node data
const savedData = CustomNodeStorage.loadNodeData('scene-beat-1');

// Export all data
const allData = CustomNodeStorage.exportAllData();

// Import data
CustomNodeStorage.importData(importedData);
```

### Extending the Components

#### Adding New Character
```typescript
// Extend the character database in CharacterImpersonationNode.tsx
const characterDatabase = {
  // ... existing characters
  'NewCharacter': {
    name: 'New Character',
    avatar: '🧙‍♂️',
    personality: 'Mysterious and wise',
    voice: 'Speaks in riddles and metaphors'
  }
};
```

#### Custom Scene Beat Status
```typescript
// Add new status in SceneBeatNode.tsx
const statusOptions = [
  // ... existing options
  { value: 'under-review', label: 'Under Review', color: 'orange' }
];
```

## Styling and Theming

All components support dark mode and use TailwindCSS for styling:

```css
/* Custom styles can be added to index.css */
.scene-beat-expanded {
  @apply transition-all duration-300 ease-in-out;
}

.note-section-labels {
  @apply flex flex-wrap gap-2 mt-2;
}

.character-chat-bubble {
  @apply max-w-xs lg:max-w-md p-3 rounded-lg;
}
```

## Animation Effects

Framer Motion provides smooth animations:

- **Scene Beat**: Expand/collapse with height transitions
- **Note Section**: Fade-in label creation
- **Character Chat**: Message bubble animations

## Troubleshooting

### Common Issues

1. **Commands not working**: Ensure extensions are properly imported in Editor.tsx
2. **Styling issues**: Check TailwindCSS classes and dark mode variants
3. **React Flow sync**: Verify ReactFlowIntegration singleton is properly initialized
4. **Save/load problems**: Check localStorage permissions and data format

### Debug Mode

Enable debug logging by adding to your component:

```typescript
// Add to any custom node component
useEffect(() => {
  console.log('Node data:', nodeData);
  console.log('Editor instance:', editor);
}, [nodeData, editor]);
```

## Best Practices

1. **Scene Organization**: Use Scene Beat status to track writing progress
2. **Note Management**: Use labels consistently for better organization  
3. **Character Consistency**: Reference the character database for personality traits
4. **Performance**: Limit React Flow nodes to prevent performance issues
5. **Data Backup**: Regularly export custom node data for backup

## API Reference

### Scene Beat Node Props
```typescript
interface SceneBeatData {
  chapterName: string;
  sceneBeatIndex: number;
  summary: string;
  goal: string;
  characters: string[];
  worldEntities: string[];
  status: 'Draft' | 'In Progress' | 'Complete' | 'Published';
  reactFlowNodeId?: string;
  timeline?: TimelineEvent[];
}
```

### Note Section Props
```typescript
interface NoteSectionData {
  content: string;
  labels: string[];
  isPrivate?: boolean;
  reminder?: {
    date: string;
    importance: 'low' | 'medium' | 'high';
  };
}
```

### Character Impersonation Props
```typescript
interface CharacterImpersonationData {
  activeCharacter: string;
  availableCharacters: string[];
  conversation?: ConversationMessage[];
  context?: {
    scene: string;
    mood: string;
    relationships: Record<string, string>;
  };
}
```

This comprehensive integration provides a powerful suite of interactive tools for creative writing within the Tiptap editor environment.
