/**
 * SearchBar Component
 * 
 * Global search bar with keyboard shortcut support (Ctrl+K)
 */

import { useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

export default function SearchBar({
    value,
    onChange,
    placeholder = "Search...",
    isSearching = false,
    className = ""
}) {
    const inputRef = useRef(null);

    // Keyboard shortcut: Ctrl+K to focus search
    useHotkeys('ctrl+k, cmd+k', (e) => {
        e.preventDefault();
        inputRef.current?.focus();
    }, []);

    const handleClear = () => {
        onChange('');
        inputRef.current?.focus();
    };

    return (
        <div className={`relative ${className}`}>
            {/* Search Icon */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {isSearching ? (
                    <Loader size={18} className="animate-spin" />
                ) : (
                    <Search size={18} />
                )}
            </div>

            {/* Input */}
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />

            {/* Keyboard Hint & Clear Button */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {value && (
                    <button
                        onClick={handleClear}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition"
                        title="Clear search"
                    >
                        <X size={16} />
                    </button>
                )}

                {!value && (
                    <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
                        Ctrl+K
                    </kbd>
                )}
            </div>
        </div>
    );
}
