

import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Theme } from './types';
import Header from './components/Header';
import DbClient from './components/DbClient';
import MyBooksView from './components/MyBooksView';
import EditingBooksView from './components/EditingBooksView';
import ReviewingBooksView from './components/ReviewingBooksView';
import CreateBookModal from './components/CreateBookModal';
import BookDetailsPage from './pages/BookDetails/BookDetailsPage';
import BookForgePage from './pages/BookForge/BookForgePage';
import CharacterDetailsPage from './pages/CharacterDetailsPage';
import CustomNodeTest from './components/CustomNodeTest';
import NameGeneratorPage from './pages/Tools/NameGeneratorPage';
import CharacterProfileBuilder from './pages/Tools/CharacterProfileBuilder';
import WhisperTestPage from './pages/WhisperTestPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ErrorBoundary from './components/ErrorBoundary';
// Import new authentication system
import { AuthGate } from './auth';
import { BookContextProvider, useBookContext } from './contexts/BookContext';

// Component that uses BookContext to provide authored books to MyBooksView
const MyBooksWithContext: React.FC = () => {
    const { authoredBooks } = useBookContext();
    return <MyBooksView books={authoredBooks} />;
};

const MainLayout: React.FC<{
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onOpenCreateModal: () => void;
    isCreateModalOpen: boolean;
    setCreateModalOpen: (open: boolean) => void;
}> = ({ theme, setTheme, onOpenCreateModal, isCreateModalOpen, setCreateModalOpen }) => {
    const { books } = useBookContext();
    
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
            
            <AnimatePresence>
              {isCreateModalOpen && (
                <CreateBookModal onClose={() => setCreateModalOpen(false)} />
              )}
            </AnimatePresence>
        </>
    );
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDbClientOpen, setDbClientOpen] = useState(false);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle DB inspector
      if (e.key.toLowerCase() === 'd' && e.ctrlKey && e.shiftKey) {
        setDbClientOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  return (
    <AuthGate
      fallback={
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      }
    >
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
            <ErrorBoundary>
              <BookContextProvider>
              <Routes>
                {/* Main protected routes */}
                <Route
                  element={
                    <MainLayout 
                      theme={theme}
                      setTheme={handleThemeChange}
                      onOpenCreateModal={() => setCreateModalOpen(true)}
                      isCreateModalOpen={isCreateModalOpen}
                      setCreateModalOpen={setCreateModalOpen}
                    />
                  }
                >
                  <Route path="/" element={<MyBooksWithContext />} />
                  <Route 
                    path="/book/:bookId" 
                    element={<BookDetailsPage />} 
                  />
                  <Route 
                    path="/book/:bookId/version/:versionId/character/:characterId" 
                    element={<CharacterDetailsPage theme={theme} setTheme={handleThemeChange} />} 
                  />
                  <Route path="/editing" element={<EditingBooksView />} />
                  <Route path="/reviewing" element={<ReviewingBooksView />} />
                  <Route path="/test-nodes" element={<CustomNodeTest />} />
                  <Route path="/test-whisper" element={<WhisperTestPage />} />
                  <Route path="/tools/name-generator" element={<NameGeneratorPage theme={theme} setTheme={handleThemeChange}/>} />
                  <Route path="/tools/character-profile-builder" element={<CharacterProfileBuilder theme={theme} setTheme={handleThemeChange} />} />
                </Route>
                
                {/* Tool Window Routes */}
                <Route path="/tool/name-generator" element={
                  <NameGeneratorPage theme={theme} setTheme={handleThemeChange}/>
                } />
                <Route path="/tool/character-tracker" element={
                  <CharacterProfileBuilder theme={theme} setTheme={handleThemeChange} />
                } />
                
                {/* BookForgePage - Full screen editor */}
                <Route path="/book/:bookId/version/:versionId" element={
                  <BookForgePage theme={theme} setTheme={handleThemeChange} />
                } />
              </Routes>
            </BookContextProvider>
          </ErrorBoundary>
            <DbClient open={isDbClientOpen} onClose={() => setDbClientOpen(false)} />
        </div>
      </div>
    </AuthGate>
  );
};


export default App;