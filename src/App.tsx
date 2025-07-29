

import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Theme, Book, Version } from './types';
import Header from './components/Header';
import MyBooksView from './components/MyBooksView';
import { MOCK_BOOKS } from './constants';
import CreateBookModal from './components/CreateBookModal';
import BookDetailsPage from './pages/BookDetails/BookDetailsPage';
import BookForgePage from './pages/BookForge/BookForgePage';
import CustomNodeTest from './components/CustomNodeTest';
import NameGeneratorPage from './pages/Tools/NameGeneratorPage';
import CharacterProfileBuilder from './pages/Tools/CharacterProfileBuilder';

// Tool Window Components
import NameGeneratorTool from './pages/Tools/NameGeneratorTool';
import CharacterTrackerTool from './pages/Tools/CharacterTrackerTool';

const MainLayout: React.FC<{
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onOpenCreateModal: () => void;
    books: Book[];
}> = ({ theme, setTheme, onOpenCreateModal, books }) => {
    return (
        <>
            <Header
                theme={theme}
                setTheme={setTheme}
                onOpenCreateModal={onOpenCreateModal}
                books={books}
            />
            <main className="px-8 sm:px-16 lg:px-24 py-8">
                <Outlet />
            </main>
        </>
    );
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const applyTheme = (t: Theme) => {
        if (t === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };
    
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


  const handleThemeChange = (newTheme: Theme) => {
    let finalTheme: 'light' | 'dark';
    if (newTheme === 'system') {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        finalTheme = isDarkMode ? 'dark' : 'light';
        localStorage.removeItem('theme');
    } else {
        finalTheme = newTheme;
        localStorage.setItem('theme', newTheme);
    }
    setTheme(finalTheme);
    if (finalTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  };
  
  const handleUpdateBook = (bookId: string, updatedData: Partial<Book>) => {
      setBooks(currentBooks => currentBooks.map(b =>
          b.id === bookId ? { ...b, ...updatedData } : b
      ));
  };

  const handleCreateVersion = (bookId: string, newVersion: Version) => {
      setBooks(currentBooks => currentBooks.map(b =>
          b.id === bookId ? { ...b, versions: [...(b.versions || []), newVersion] } : b
      ));
  };


  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-gray-800 dark:text-gray-200 transition-colors duration-300 font-sans overflow-x-hidden">
        <div 
            className="absolute inset-0 z-0 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 dark:from-gray-950 dark:via-black dark:to-black animate-animated-gradient"
            style={{backgroundSize: '400% 400%'}}
        ></div>

        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-green-700 dark:to-green-900 blur-3xl animate-blob-pulse opacity-40 dark:opacity-50"></div>
        <div 
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-gray-600 to-gray-800 dark:from-orange-700 dark:to-orange-900 blur-3xl animate-blob-pulse opacity-40 dark:opacity-50 transform translate-x-1/2 -translate-y-1/4"
          style={{animationDelay: '-10s'}}
        ></div>

        <div className="relative z-10 h-full">
            <Routes>
                <Route
                    element={
                        <MainLayout 
                            theme={theme}
                            setTheme={handleThemeChange}
                            onOpenCreateModal={() => setCreateModalOpen(true)}
                            books={books}
                        />
                    }
                >
                    <Route path="/" element={<MyBooksView books={books} />} />
                    <Route 
                        path="/book/:bookId" 
                        element={
                            <BookDetailsPage 
                                books={books}
                                onUpdateBook={handleUpdateBook}
                                onCreateVersion={handleCreateVersion}
                            />
                        } 
                    />
                    <Route path="/editing" element={<div className="flex items-center justify-center h-96 text-gray-500">Editing Content Area</div>} />
                    <Route path="/reviewing" element={<div className="flex items-center justify-center h-96 text-gray-500">Reviewing Content Area</div>} />
                    <Route path="/test-nodes" element={<CustomNodeTest />} />
                </Route>
                <Route path="/tools/name-generator" element={<NameGeneratorPage books={books} theme={theme} setTheme={handleThemeChange}/>} />
                <Route path="/tools/character-profile-builder" element={<CharacterProfileBuilder books={books} theme={theme} setTheme={handleThemeChange} />} />
                
                {/* Tool Window Routes - These will be loaded in child windows */}
                <Route path="/tool/name-generator" element={<NameGeneratorPage books={books} theme={theme} setTheme={handleThemeChange}/>} />
                <Route path="/tool/character-tracker" element={<CharacterProfileBuilder books={books} theme={theme} setTheme={handleThemeChange} />} />
                <Route path="/tool/plot-assistant" element={<div className="p-8 text-center">Plot Assistant Tool - Coming Soon!</div>} />
                <Route path="/tool/world-builder" element={<div className="p-8 text-center">World Builder Tool - Coming Soon!</div>} />
                <Route path="/tool/timeline" element={<div className="p-8 text-center">Timeline Tool - Coming Soon!</div>} />
                
                <Route path="/book/:bookId/version/:versionId" element={<BookForgePage books={books} theme={theme} setTheme={handleThemeChange} />} />
            </Routes>
            <AnimatePresence>
                {isCreateModalOpen && (
                  <CreateBookModal onClose={() => setCreateModalOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};


export default App;