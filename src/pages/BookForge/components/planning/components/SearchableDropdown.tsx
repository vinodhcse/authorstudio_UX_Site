import React, { useState } from 'react';

interface SearchableDropdownProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    customValue?: string;
    onCustomChange?: (value: string) => void;
    allowCustom?: boolean;
    className?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder = "Search...",
    customValue = "",
    onCustomChange,
    allowCustom = true,
    className = ""
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOptionSelect = (option: string) => {
        if (option === 'custom') {
            onChange('custom');
            setSearchTerm('Custom...');
        } else {
            onChange(option);
            setSearchTerm(option);
        }
        setIsOpen(false);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        if (value && value !== 'custom') {
            setSearchTerm('');
        }
    };

    const handleInputBlur = () => {
        // Delay closing to allow for option clicks
        setTimeout(() => setIsOpen(false), 150);
        if (!value || value === 'custom') {
            setSearchTerm('');
        } else {
            setSearchTerm(value);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={placeholder}
                />
                
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 shadow-lg">
                        {filteredOptions.map(option => (
                            <button
                                key={option}
                                onClick={() => handleOptionSelect(option)}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm ${
                                    value === option ? 'bg-blue-100 dark:bg-blue-900' : ''
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                        {allowCustom && (
                            <button
                                onClick={() => handleOptionSelect('custom')}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm font-medium border-t border-gray-200 dark:border-gray-600 ${
                                    value === 'custom' ? 'bg-blue-100 dark:bg-blue-900' : ''
                                }`}
                            >
                                Custom...
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {value === 'custom' && allowCustom && onCustomChange && (
                <input
                    type="text"
                    value={customValue}
                    onChange={(e) => onCustomChange(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter custom value..."
                />
            )}
        </div>
    );
};

export default SearchableDropdown;
