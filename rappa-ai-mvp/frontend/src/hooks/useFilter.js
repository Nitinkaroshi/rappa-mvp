/**
 * useFilter Hook
 * 
 * Provides advanced filtering functionality with multiple filter types
 */

import { useState, useMemo } from 'react';

export function useFilter(items) {
    const [filters, setFilters] = useState({
        status: [],
        dateRange: { start: null, end: null },
        documentType: [],
        template: [],
        confidenceMin: 0,
    });

    // Apply all filters
    const filteredItems = useMemo(() => {
        let result = [...items];

        // Filter by status
        if (filters.status.length > 0) {
            result = result.filter(item => filters.status.includes(item.status));
        }

        // Filter by date range
        if (filters.dateRange.start) {
            result = result.filter(item => {
                const itemDate = new Date(item.created_at || item.createdAt);
                return itemDate >= new Date(filters.dateRange.start);
            });
        }
        if (filters.dateRange.end) {
            result = result.filter(item => {
                const itemDate = new Date(item.created_at || item.createdAt);
                return itemDate <= new Date(filters.dateRange.end);
            });
        }

        // Filter by document type
        if (filters.documentType.length > 0) {
            result = result.filter(item =>
                filters.documentType.includes(item.document_type || item.documentType)
            );
        }

        // Filter by template
        if (filters.template.length > 0) {
            result = result.filter(item =>
                filters.template.includes(item.template_id || item.templateId)
            );
        }

        // Filter by minimum confidence
        if (filters.confidenceMin > 0) {
            result = result.filter(item => {
                const confidence = parseFloat(item.confidence || 0);
                return confidence >= filters.confidenceMin;
            });
        }

        return result;
    }, [items, filters]);

    // Update a specific filter
    const updateFilter = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value,
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            status: [],
            dateRange: { start: null, end: null },
            documentType: [],
            template: [],
            confidenceMin: 0,
        });
    };

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        return (
            filters.status.length > 0 ||
            filters.dateRange.start !== null ||
            filters.dateRange.end !== null ||
            filters.documentType.length > 0 ||
            filters.template.length > 0 ||
            filters.confidenceMin > 0
        );
    }, [filters]);

    return {
        filters,
        filteredItems,
        updateFilter,
        clearFilters,
        hasActiveFilters,
    };
}

export default useFilter;
