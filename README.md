# AuthorStudio - Vite.js Application

This is a modern React application built with Vite.js, TypeScript, and Tailwind CSS for an AI-powered book authoring platform.

## Features

- **Modern Build System**: Powered by Vite.js for fast development and optimized builds
- **TypeScript**: Full TypeScript support for better development experience
- **Tailwind CSS**: Utility-first CSS framework with custom animations and themes
- **TipTap Editor**: Rich text editor for content creation
- **React Router**: Client-side routing for seamless navigation
- **Framer Motion**: Smooth animations and transitions

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
│   ├── BookDetails/    # Book details and management
│   └── BookForge/      # Rich text editor interface
├── data/               # Mock data and content
├── types.ts           # TypeScript type definitions
├── constants.tsx      # Application constants and icons
├── main.tsx          # Application entry point
├── App.tsx           # Main application component
└── index.css         # Global styles and Tailwind imports
```

## Run Locally

**Prerequisites:** Node.js (v16 or higher)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

## Technologies Used

- **React 18** - UI library
- **Vite.js** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **TipTap 3.0.7** - Modern rich text editor (latest version)
- **Floating UI** - Advanced positioning for TipTap menus
- **Framer Motion** - Animation library
- **React Router** - Client-side routing

## Development Notes

This application has been converted from a browser-native ES modules setup to a proper Vite.js application and upgraded to TipTap 3.0.7, providing:

- Faster hot module replacement (HMR)
- Optimized build process
- Better TypeScript integration
- Proper dependency management
- Enhanced development experience
- **Latest TipTap 3.0.7 features** with improved performance and new capabilities

### TipTap 3.0.7 Upgrade

The editor has been upgraded from TipTap 2.4.0 to 3.0.7, which includes:

- **Breaking Changes Handled**: Updated BubbleMenu and FloatingMenu implementations
- **Improved Performance**: Better rendering and state management
- **Enhanced API**: More robust editor configuration and extension system
- **Better TypeScript Support**: Improved type definitions and intellisense
- **Modern Architecture**: Uses Floating UI for better menu positioning
