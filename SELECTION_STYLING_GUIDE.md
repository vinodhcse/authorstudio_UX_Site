# Custom Node Selection Styling - Enhancement Guide

## Overview
The custom nodes now have enhanced visual feedback when selected, making it clear when you're editing within a specific section.

## Selection Visual Features

### 🔗 Scene Beat Nodes
- **Border**: Blue-tinted border with soft glow
- **Background**: Subtle blue gradient overlay
- **Indicator**: Blue vertical bar on the left side of the header
- **Shadow**: Enhanced shadow with blue tint

### 🗒️ Note Section Nodes  
- **Border**: Yellow/amber-tinted border with soft glow
- **Background**: Subtle yellow gradient overlay
- **Indicator**: Yellow vertical bar on the left side of the header
- **Shadow**: Enhanced shadow with warm tint

### 🎭 Character Impersonation Nodes
- **Border**: Purple-tinted border with soft glow
- **Background**: Subtle purple gradient overlay
- **Indicator**: Purple vertical bar on the left side of the header
- **Shadow**: Enhanced shadow with purple tint

## How It Works

### Automatic Selection Detection
When you click on or focus within any custom node:
1. **ProseMirror** automatically adds the `ProseMirror-selectednode` class
2. **CSS styling** applies the appropriate visual feedback based on node type
3. **Color coding** helps you immediately identify which type of section you're editing

### Visual Hierarchy
```css
/* Normal State */
.scene-beat-node {
  /* Default styling */
}

/* Selected State */
.scene-beat-node.ProseMirror-selectednode {
  /* Enhanced styling with blue theme */
}
```

### Node Type Identification
Each node type has its own CSS class:
- `.scene-beat-node` - Blue theme
- `.note-section-node` - Yellow/amber theme  
- `.character-impersonation-node` - Purple theme

## Implementation Details

### CSS Classes Added
```css
/* Selection indicator bar */
.ProseMirror-selectednode .node-header::before {
  content: '';
  position: absolute;
  left: -8px;
  width: 4px;
  height: 20px;
  border-radius: 2px;
}
```

### Dark Mode Support
All selection styles include dark mode variants:
- Adjusted colors for better contrast
- Maintained visual hierarchy
- Consistent user experience across themes

### Smooth Transitions
```css
transition: all 0.2s ease-in-out;
```
- All selection changes are smoothly animated
- No jarring visual jumps
- Professional, polished appearance

## Testing the Selection Styling

### Manual Test
1. Open the Book Forge editor
2. Add any custom node using the `/` slash menu
3. Click on the node to select it
4. Observe the visual feedback:
   - Colored border appears
   - Subtle background gradient
   - Left-side indicator bar
   - Enhanced shadow

### Browser Test File
A test HTML file (`selection-test.html`) is included to preview the styling:
- Interactive nodes you can click to select/deselect
- All three node types demonstrated
- Shows the exact styling that will appear in the editor

## Troubleshooting

### Selection Not Visible
1. **Check CSS Import**: Ensure `index.css` is properly imported
2. **Verify Classes**: Make sure node components have the correct CSS classes
3. **Browser Cache**: Clear browser cache if styles don't update

### Color Conflicts
1. **TailwindCSS**: The styling uses standard Tailwind color values
2. **Dark Mode**: Automatic switching between light/dark variants
3. **Specificity**: Selection styles have higher specificity than default styles

### Performance Considerations
- **CSS Transitions**: Lightweight 0.2s transitions
- **GPU Acceleration**: Transform properties use hardware acceleration
- **Minimal Repaints**: Only affected properties trigger repaints

## Customization

### Changing Colors
To customize the selection colors, modify the CSS variables in `index.css`:

```css
/* Scene Beat - Change to green theme */
.scene-beat-node.ProseMirror-selectednode {
  border: 2px solid rgb(34 197 94 / 0.8);
  box-shadow: 0 0 0 2px rgb(34 197 94 / 0.5);
}
```

### Adding New Node Types
For new custom node types:
1. Add the appropriate CSS class to the component
2. Define selection styles in `index.css`
3. Choose a unique color theme
4. Test in both light and dark modes

## Accessibility

### Visual Indicators
- **High Contrast**: Selection borders are clearly visible
- **Color Blind Friendly**: Different visual patterns beyond just color
- **Screen Readers**: Proper semantic structure maintained

### Keyboard Navigation
- **Focus Management**: Selection styling works with keyboard navigation
- **Tab Order**: Maintains logical tab sequence
- **Screen Reader Compatibility**: No interference with assistive technologies

This enhancement significantly improves the user experience by providing clear, immediate visual feedback when editing within custom node sections.
