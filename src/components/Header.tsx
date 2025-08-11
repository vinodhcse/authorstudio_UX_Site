

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Theme, ActiveTab, Book } from '../types';
import { SunIcon, MoonIcon, SystemIcon, SearchIcon, BookOpenIcon, ChevronDownIcon, PenIcon, PlusIcon } from '../constants';
import { useAuthStore } from '../auth';


const logoContainerVariants: Variants = {
  rest: {},
  hover: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const logoItemVariants: Variants = {
  rest: { 
    y: 0, 
    filter: 'drop-shadow(0px 0px 0px rgba(192, 132, 252, 0))'
  },
  hover: {
    y: -5,
    filter: 'drop-shadow(0px 0px 8px rgba(192, 132, 252, 0.8))',
    transition: { type: 'spring', stiffness: 300, damping: 10 }
  },
};


const Logo: React.FC = () => {
  const logoText = "AuthorStudio";
  const navigate = useNavigate();

  return (
    <motion.div
      variants={logoContainerVariants}
      initial="rest"
      whileHover="hover"
      className="flex items-center gap-2 cursor-pointer"
      onClick={() => navigate('/')}
    >
      <motion.div variants={logoItemVariants}>
        <PenIcon className="h-7 w-7 text-gray-900 dark:text-white"/>
      </motion.div>
      <h1 className="text-3xl font-bold tracking-tight flex items-center">
          {[...logoText].map((char, i) => (
              <motion.span key={i} variants={logoItemVariants} className="bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {char}
              </motion.span>
          ))}
      </h1>
    </motion.div>
  );
};


interface TabProps {
  name: string;
  path: string;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

const Tab: React.FC<TabProps> = ({ name, path, isActive, onClick, className }) => {
    const tabContent = (
      <motion.div
        className={`group relative px-4 py-2 text-sm font-medium transition-colors rounded-full focus:outline-none`}
        whileHover={{ scale: isActive ? 1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className={`relative z-10 transition-colors ${
          isActive
            ? 'text-white dark:text-black'
            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
        }`}>
          {name}
        </span>
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-black dark:bg-white rounded-full"
            layoutId="activeTabPill"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </motion.div>
    );
    
    const fullClassName = `no-underline focus:outline-none ${className || ''}`;

    if (onClick) {
        return (
            <button onClick={(e) => { e.preventDefault(); onClick(); }} className={fullClassName}>
                {tabContent}
            </button>
        )
    }

    return (
        <Link to={path} className={fullClassName}>
            {tabContent}
        </Link>
    );
};

const SearchBar: React.FC = () => (
  <div className="relative group w-full">
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
    <input
      type="text"
      placeholder="Search books..."
      className="bg-transparent pl-10 pr-4 py-2 w-48 border border-transparent focus:w-full transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-full text-sm placeholder-gray-400 dark:placeholder-gray-500 text-white dark:text-black"
    />
  </div>
);

const BookDetailsProgress: React.FC<{ book: Book }> = ({ book }) => (
    <div className="text-center px-4 w-full">
        <p className="font-bold text-white dark:text-black truncate text-sm">{book.title}</p>
        <div className="w-full bg-black/20 dark:bg-white/10 rounded-full h-1.5 mt-1">
          <motion.div
            className="h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-green-500"
            initial={{ width: '0%' }}
            animate={{ width: `${book.progress}%` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
    </div>
);


const DropdownMenu: React.FC<{ trigger: React.ReactNode; children: React.ReactNode }> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <div className="flex items-center">
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-48 bg-gradient-to-br from-gray-800 to-black dark:from-slate-100 dark:to-slate-200 rounded-lg shadow-lg p-2 z-50 border border-gray-700/50 dark:border-gray-200/50"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onOpenCreateModal: () => void;
  books: Book[];
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme, onOpenCreateModal, books }) => {
  const location = useLocation();
  const params = useParams<{ bookId?: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const isBookDetailsPage = location.pathname.startsWith('/book/');
  const book = isBookDetailsPage && params.bookId ? books.find(b => b.id === params.bookId) : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mainTabs: {name: ActiveTab, path: string}[] = [
    { name: 'My Books', path: '/' },
    { name: 'Editing', path: '/editing' },
    { name: 'Reviewing', path: '/reviewing' },
    { name: 'WhisperTest', path: '/test-whisper' },
  ];

  const mainNavTabsForMobile = mainTabs.map(t => t.name);

  return (
    <header className="sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
             <Logo />
          </div>

          <div className="hidden lg:flex flex-grow items-center justify-center">
            {isBookDetailsPage ? (
                <div className="flex items-center gap-2 bg-gradient-to-br from-gray-800 to-black dark:from-slate-200 dark:to-gray-50 rounded-full px-4 py-1 border border-gray-700 dark:border-gray-300 shadow-inner min-w-[32rem]">
                    {book && <BookDetailsProgress book={book} />}
                    <div className="w-px h-6 bg-gray-700 dark:bg-gray-300"></div>
                    <DropdownMenu trigger={<div className="flex items-center gap-2 px-3 py-1.5 text-sm text-white dark:text-black hover:text-purple-400 dark:hover:text-purple-500 cursor-pointer"><>Author</><ChevronDownIcon className="h-4 w-4" /></div>}>
                        <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Author</a>
                        <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Editor</a>
                        <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Reviewer</a>
                    </DropdownMenu>
                    <div className="w-px h-6 bg-gray-700 dark:bg-gray-300"></div>
                    <DropdownMenu trigger={<button className="p-2 text-white dark:text-black hover:text-purple-400 dark:hover:text-purple-500"><BookOpenIcon className="h-5 w-5"/></button>}>
                        <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Getting Started</a>
                        <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Writing Guide</a>
                    </DropdownMenu>
                </div>
            ) : (
                <div className="flex items-center justify-center gap-4">
                    <Tab className="order-1" name="My Books" path="/" isActive={location.pathname === '/'} />
                    <Tab className="order-2" name="Editing" path="/editing" isActive={location.pathname === '/editing'} />
                    <Tab className="order-4" name="Reviewing" path="/reviewing" isActive={location.pathname === '/reviewing'} />
                    <Tab className="order-5" name="WhisperTest" path="/test-whisper" isActive={location.pathname === '/test-whisper'} />
                    
                    <div className="order-3 flex items-center gap-2 bg-gradient-to-br from-gray-800 to-black dark:from-slate-200 dark:to-gray-50 rounded-full px-4 py-1 border border-gray-700 dark:border-gray-300 shadow-inner min-w-[32rem]">
                        <SearchBar />
                        <div className="w-px h-6 bg-gray-700 dark:bg-gray-300"></div>
                        <DropdownMenu trigger={<div className="flex items-center gap-2 px-3 py-1.5 text-sm text-white dark:text-black hover:text-purple-400 dark:hover:text-purple-500 cursor-pointer"><>Author</><ChevronDownIcon className="h-4 w-4" /></div>}>
                            <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Author</a>
                            <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Editor</a>
                            <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Reviewer</a>
                        </DropdownMenu>
                        <div className="w-px h-6 bg-gray-700 dark:bg-gray-300"></div>
                        <DropdownMenu trigger={<button className="p-2 text-white dark:text-black hover:text-purple-400 dark:hover:text-purple-500"><BookOpenIcon className="h-5 w-5"/></button>}>
                            <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Getting Started</a>
                            <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">Writing Guide</a>
                        </DropdownMenu>
                    </div>
                </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0">
             <button
                onClick={onOpenCreateModal}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-sky-500 dark:hover:bg-sky-600 dark:text-white dark:shadow-sky-500/30 transition-all transform hover:scale-105 shadow-md shadow-purple-500/20"
              >
                <PlusIcon className="h-4 w-4" />
                Create
              </button>
            <DropdownMenu trigger={<button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">{theme === 'dark' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}</button>}>
                <button onClick={() => setTheme('light')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <SunIcon className="h-4 w-4"/> Light</button>
                <button onClick={() => setTheme('dark')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <MoonIcon className="h-4 w-4"/> Dark</button>
                <button onClick={() => setTheme('system')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"> <SystemIcon className="h-4 w-4"/> System</button>
            </DropdownMenu>

            <DropdownMenu trigger={<img src="https://picsum.photos/seed/user/40/40" alt="User Avatar" className="w-9 h-9 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900 ring-transparent hover:ring-purple-500 transition-all"/>}>
                <div className="px-4 py-2 text-sm text-gray-300 dark:text-gray-700 border-b border-gray-600 dark:border-gray-300">
                  <div className="font-medium">{user?.name || 'User'}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{user?.email}</div>
                </div>
                <a href="#" className="block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10">My Account</a>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 text-sm rounded-md text-gray-300 dark:text-gray-700 hover:bg-white/10 dark:hover:bg-black/10"
                >
                  Logout
                </button>
            </DropdownMenu>
          </div>
        </div>
        {!isBookDetailsPage && (
            <div className="flex lg:hidden items-center justify-center border-t border-gray-200 dark:border-gray-800 py-2 gap-4 custom-scrollbar overflow-x-auto">
                {mainNavTabsForMobile.map((tabName) => {
                    const tab = mainTabs.find(t => t.name === tabName)!;
                    return (
                        <Tab 
                            key={tab.name} 
                            name={tab.name} 
                            path={tab.path} 
                            isActive={location.pathname === tab.path}
                        />
                    )
                })}
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;