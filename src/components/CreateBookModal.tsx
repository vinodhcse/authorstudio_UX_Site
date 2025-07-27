import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const FileInput: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setCoverFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCoverFile(e.target.files[0]);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book Cover (Required)</label>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`mt-1 flex justify-center items-center px-6 pt-5 pb-6 md:pt-10 md:pb-12 border-2 border-dashed rounded-lg transition-colors backdrop-blur-sm ${isDragging ? 'border-purple-500 bg-purple-500/20' : 'border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/5'}`}
            >
                <div className="space-y-1 text-center">
                    {coverFile ? (
                        <>
                           <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                           <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">{coverFile.name}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400">{(coverFile.size / 1024).toFixed(2)} KB</p>
                        </>
                    ) : (
                        <>
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-300">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const FormInput: React.FC<{ id: string, label: string, placeholder: string, type?: string, optional?: boolean }> = ({ id, label, placeholder, type = "text", optional=false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-800 dark:text-gray-300">
            {label} {optional && <span className="text-gray-500 dark:text-gray-400">(Optional)</span>}
        </label>
        <div className="mt-1">
            <input type={type} name={id} id={id} className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400" placeholder={placeholder} />
        </div>
    </div>
);

const FormTextarea: React.FC<{ id: string, label: string, placeholder: string, optional?: boolean }> = ({ id, label, placeholder, optional = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-800 dark:text-gray-300">
            {label} {optional && <span className="text-gray-500 dark:text-gray-400">(Optional)</span>}
        </label>
        <div className="mt-1">
            <textarea id={id} name={id} rows={3} className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400" placeholder={placeholder}></textarea>
        </div>
    </div>
);


interface CreateBookModalProps {
    onClose: () => void;
}

const CreateBookModal: React.FC<CreateBookModalProps> = ({ onClose }) => {
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
                className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-800/50 custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Book</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start your next masterpiece.</p>
                    </div>

                    <form className="space-y-6">
                        <FormInput id="book-title" label="Book Title" placeholder="Enter your book title" />
                        <FormInput id="subtitle" label="Subtitle" placeholder="Enter book subtitle" optional />
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                             <FormInput id="author-name" label="Author Name" placeholder="Enter author name" />
                             <div>
                                <label htmlFor="language" className="block text-sm font-medium text-gray-800 dark:text-gray-300">Language</label>
                                <select id="language" name="language" className="mt-1 block w-full pl-3 pr-10 py-2 md:py-3 text-base border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm md:text-base rounded-lg text-gray-800 dark:text-gray-200">
                                    <option className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">English</option>
                                    <option className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">Spanish</option>
                                    <option className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">French</option>
                                </select>
                             </div>
                        </div>
                        <FormTextarea id="description" label="Description" placeholder="Enter book description" optional />
                        <FormInput id="initial-version" label="Initial Version Name" placeholder="e.g., Manuscript, Draft 1" />
                        <FileInput />
                    </form>
                    
                    <div className="pt-6 flex justify-end gap-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-500/10 hover:bg-gray-500/20 dark:bg-gray-700 dark:hover:bg-gray-600 backdrop-blur-sm border border-white/20 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors">
                            Cancel
                        </button>
                         <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/20">
                            Create Book
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CreateBookModal;