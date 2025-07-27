

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../../../types';
import { ChevronDownIcon } from '../../../constants';

// --- PREDEFINED DATA ---
const languages = [ 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Other' ];
const genreOptions = [ 'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Thriller', 'Horror', 'Historical Fiction', 'Biography', 'Self-Help', 'Business', 'Health', 'Travel' ];
const proseOptions = [ 'First Person', 'Second Person', 'Third Person Limited', 'Third Person Omniscient' ];
const getSubGenreOptions = (genre: string) => {
  const subGenres: Record<string, string[]> = {
    'Fiction': ['Literary Fiction', 'Contemporary Fiction', 'Historical Fiction', 'Adventure', 'Coming of Age'],
    'Non-Fiction': ['Biography', 'Memoir', 'Self-Help', 'Health', 'Business', 'Travel', 'History'],
    'Science Fiction': ['Space Opera', 'Cyberpunk', 'Dystopian', 'Time Travel', 'Hard SF'],
    'Fantasy': ['Epic Fantasy', 'Urban Fantasy', 'Dark Fantasy', 'High Fantasy', 'Paranormal'],
    'Mystery': ['Cozy Mystery', 'Hard-boiled', 'Police Procedural', 'Detective', 'Noir'],
    'Romance': ['Contemporary Romance', 'Historical Romance', 'Paranormal Romance', 'Romantic Suspense'],
    'Thriller': ['Psychological Thriller', 'Legal Thriller', 'Medical Thriller', 'Political Thriller'],
    'Horror': ['Supernatural Horror', 'Psychological Horror', 'Gothic Horror', 'Slasher']
  };
  return subGenres[genre] || [];
};

// --- FORM FIELD COMPONENTS ---
const FormInput: React.FC<{ name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, type?: string, optional?: boolean }> = 
({ name, label, value, onChange, placeholder, type = "text", optional=false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-800 dark:text-gray-300">
            {label} {optional && <span className="text-gray-500 dark:text-gray-400">(Optional)</span>}
        </label>
        <div className="mt-1">
            <input type={type} name={name} id={name} value={value} onChange={onChange} className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400" placeholder={placeholder} />
        </div>
    </div>
);

const FormTextarea: React.FC<{ name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder: string, optional?: boolean, rows?: number }> = 
({ name, label, value, onChange, placeholder, optional = false, rows = 3 }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-800 dark:text-gray-300">
            {label} {optional && <span className="text-gray-500 dark:text-gray-400">(Optional)</span>}
        </label>
        <div className="mt-1">
            <textarea id={name} name={name} value={value} onChange={onChange} rows={rows} className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400" placeholder={placeholder}></textarea>
        </div>
    </div>
);

const FormSelect: React.FC<{name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({ name, label, value, onChange, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-800 dark:text-gray-300">{label}</label>
        <select id={name} name={name} value={value} onChange={onChange} className="mt-1 block w-full pl-3 pr-10 py-2 md:py-3 text-base border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm md:text-base rounded-lg text-gray-800 dark:text-gray-200">
            {children}
        </select>
    </div>
);

const ComboBox: React.FC<{
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
    optional?: boolean;
}> = ({ name, label, value, onChange, options, placeholder, optional }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsTyping(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isTyping) setIsTyping(true);
        onChange(e.target.value);
    }
    
    const handleInputFocus = () => {
        setIsOpen(true);
    }
    
    const handleOptionClick = (opt: string) => {
        onChange(opt);
        setIsOpen(false);
        setIsTyping(false);
    }

    const filteredOptions = isTyping ? options.filter(opt => opt.toLowerCase().includes(value.toLowerCase())) : options;

    return (
        <div ref={wrapperRef}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-800 dark:text-gray-300">
                {label} {optional && <span className="text-gray-500 dark:text-gray-400">(Optional)</span>}
            </label>
            <div className="mt-1 relative">
                <input
                    type="text"
                    name={name}
                    id={name}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                 <button type="button" onClick={() => setIsOpen(!isOpen)} className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.ul
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-10 mt-1 w-full bg-gray-50 dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar"
                        >
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(opt => (
                                    <li key={opt}
                                        onClick={() => handleOptionClick(opt)}
                                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                                    >
                                        {opt}
                                    </li>
                                ))
                            ) : (
                                <li className="cursor-default select-none relative py-2 px-4 text-gray-700 dark:text-gray-400">Nothing found.</li>
                            )}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


// Main Modal Component
interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onUpdateBook: (bookData: Partial<Book>) => void;
}

const EditBookModal: React.FC<EditBookModalProps> = ({ isOpen, onClose, book, onUpdateBook }) => {
    type Tab = 'details' | 'publisher';
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [formData, setFormData] = useState<Partial<Book>>({});
    const [subGenreOptions, setSubGenreOptions] = useState<string[]>([]);

    useEffect(() => {
        if (book && isOpen) {
            const initialData = {
                title: book.title || '',
                subtitle: book.subtitle || '',
                author: book.author || '',
                language: book.language || 'English',
                bookType: book.bookType || 'Novel',
                genre: book.genre || '',
                subgenre: book.subgenre || '',
                prose: book.prose || '',
                synopsis: book.synopsis || '',
                description: book.description || '',
                publisher: book.publisher || '',
                publisherLink: book.publisherLink || '',
                printISBN: book.printISBN || '',
                ebookISBN: book.ebookISBN || '',
            };
            setFormData(initialData);
            setSubGenreOptions(getSubGenreOptions(initialData.genre));
        }
    }, [book, isOpen]);
    
    const handleFormChange = (name: keyof Book, value: string) => {
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'genre') {
                newState.subgenre = ''; // Reset subgenre when genre changes
                setSubGenreOptions(getSubGenreOptions(value));
            }
            return newState;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateBook(formData);
    };

    if (!isOpen || !book) return null;

    const tabs: {id: Tab, label: string}[] = [{id: 'details', label: 'Book Details'}, {id: 'publisher', label: 'Publisher'}];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-800/50 custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Book Details</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Refine the details of "{book.title}"</p>
                    </div>

                    <div className="flex w-full p-1 rounded-full bg-gray-200/70 dark:bg-gray-800/50">
                       {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className="relative w-full px-4 py-2 text-sm font-medium rounded-full focus:outline-none transition-colors"
                            >
                                <span className={`relative z-10 ${activeTab === tab.id ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                                    {tab.label}
                                </span>
                                {activeTab === tab.id && (
                                <motion.div
                                    className="absolute inset-0 bg-white dark:bg-black rounded-full shadow-md"
                                    layoutId="editModalTabPill"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                                )}
                            </button>
                       ))}
                    </div>
                    
                    <div className="relative min-h-[350px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: activeTab === 'details' ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: activeTab === 'details' ? -20 : 20 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="space-y-6"
                            >
                                {activeTab === 'details' ? (
                                    <>
                                        <FormInput name="title" label="Book Title" value={formData.title || ''} onChange={(e) => handleFormChange('title', e.target.value)} placeholder="Enter your book title" />
                                        <FormInput name="subtitle" label="Subtitle" value={formData.subtitle || ''} onChange={(e) => handleFormChange('subtitle', e.target.value)} placeholder="Enter book subtitle" optional />
                                        <FormInput name="author" label="Author Name" value={formData.author || ''} onChange={(e) => handleFormChange('author', e.target.value)} placeholder="Enter author name" />
                                        <FormTextarea name="synopsis" label="Synopsis" value={formData.synopsis || ''} onChange={(e) => handleFormChange('synopsis', e.target.value)} placeholder="Enter book synopsis" rows={4} />
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <ComboBox name="genre" label="Genre" value={formData.genre || ''} onChange={(v) => handleFormChange('genre', v)} options={genreOptions} placeholder="Select or type genre"/>
                                            <ComboBox name="subgenre" label="Subgenre" value={formData.subgenre || ''} onChange={(v) => handleFormChange('subgenre', v)} options={subGenreOptions} placeholder="Select or type subgenre" optional/>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <FormSelect name="bookType" label="Book Type" value={formData.bookType || 'Novel'} onChange={(e) => handleFormChange('bookType', e.target.value)}>
                                                <option className="bg-gray-100 dark:bg-gray-800">Novel</option>
                                                <option className="bg-gray-100 dark:bg-gray-800">Screenplay</option>
                                                <option className="bg-gray-100 dark:bg-gray-800">Novella</option>
                                                <option className="bg-gray-100 dark:bg-gray-800">Series</option>
                                            </FormSelect>
                                            <ComboBox name="prose" label="Book Prose" value={formData.prose || ''} onChange={(v) => handleFormChange('prose', v)} options={proseOptions} placeholder="Select or type prose"/>
                                        </div>
                                        <ComboBox name="language" label="Language" value={formData.language || ''} onChange={(v) => handleFormChange('language', v)} options={languages} placeholder="Select or type language"/>
                                    </>
                                ) : (
                                     <>
                                        <FormInput name="publisher" label="Publisher Name" value={formData.publisher || ''} onChange={(e) => handleFormChange('publisher', e.target.value)} placeholder="Enter publisher name" />
                                        <FormInput name="publisherLink" label="Publisher Link" value={formData.publisherLink || ''} onChange={(e) => handleFormChange('publisherLink', e.target.value)} placeholder="https://..." optional />
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <FormInput name="printISBN" label="Print ISBN" value={formData.printISBN || ''} onChange={(e) => handleFormChange('printISBN', e.target.value)} placeholder="Enter print ISBN" optional />
                                            <FormInput name="ebookISBN" label="E-book ISBN" value={formData.ebookISBN || ''} onChange={(e) => handleFormChange('ebookISBN', e.target.value)} placeholder="Enter e-book ISBN" optional />
                                        </div>
                                     </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    
                    <div className="pt-6 flex justify-end gap-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-500/10 hover:bg-gray-500/20 dark:bg-gray-700 dark:hover:bg-gray-600 backdrop-blur-sm border border-white/20 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors">
                            Cancel
                        </button>
                         <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/20">
                            Update Book
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default EditBookModal;