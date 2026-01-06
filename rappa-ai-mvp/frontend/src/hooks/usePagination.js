/**
 * usePagination Hook
 * 
 * Provides pagination functionality for large datasets
 */

import { useState, useMemo } from 'react';

export function usePagination(items, itemsPerPage = 20) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(itemsPerPage);

    // Calculate total pages
    const totalPages = Math.ceil(items.length / pageSize);

    // Get current page items
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return items.slice(startIndex, endIndex);
    }, [items, currentPage, pageSize]);

    // Navigation functions
    const goToPage = (page) => {
        const pageNumber = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(pageNumber);
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const previousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToFirstPage = () => setCurrentPage(1);
    const goToLastPage = () => setCurrentPage(totalPages);

    // Change page size
    const changePageSize = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1); // Reset to first page
    };

    // Reset pagination when items change
    useMemo(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [items.length, totalPages]);

    return {
        currentPage,
        pageSize,
        totalPages,
        paginatedItems,
        goToPage,
        nextPage,
        previousPage,
        goToFirstPage,
        goToLastPage,
        changePageSize,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        startIndex: (currentPage - 1) * pageSize + 1,
        endIndex: Math.min(currentPage * pageSize, items.length),
        totalItems: items.length,
    };
}

export default usePagination;
