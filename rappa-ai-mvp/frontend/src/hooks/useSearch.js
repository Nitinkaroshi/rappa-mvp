/**
 * useSearch Hook
 * 
 * Provides debounced search functionality with filtering
 */

import { useState, useEffect, useMemo } from 'react';

export function useSearch(items, searchFields, debounceMs = 300) {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs]);

    // Filter items based on search term
    const filteredItems = useMemo(() => {
        if (!debouncedSearchTerm.trim()) {
            return items;
        }

        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();

        return items.filter(item => {
            return searchFields.some(field => {
                const value = getNestedValue(item, field);
                return value && String(value).toLowerCase().includes(lowerSearchTerm);
            });
        });
    }, [items, debouncedSearchTerm, searchFields]);

    // Helper to get nested object values
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    return {
        searchTerm,
        setSearchTerm,
        filteredItems,
        isSearching: searchTerm !== debouncedSearchTerm,
    };
}

export default useSearch;
