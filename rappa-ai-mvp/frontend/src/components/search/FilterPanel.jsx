/**
 * FilterPanel Component
 * 
 * Advanced filtering panel with multiple filter types
 */

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function FilterPanel({ filters, updateFilter, clearFilters, hasActiveFilters }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const statusOptions = [
        { value: 'completed', label: 'Completed', color: 'green' },
        { value: 'processing', label: 'Processing', color: 'blue' },
        { value: 'failed', label: 'Failed', color: 'red' },
        { value: 'pending', label: 'Pending', color: 'yellow' },
    ];

    const toggleStatus = (status) => {
        const newStatus = filters.status.includes(status)
            ? filters.status.filter(s => s !== status)
            : [...filters.status, status];
        updateFilter('status', newStatus);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
            >
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Filters</span>
                    {hasActiveFilters && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                            Active
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearFilters();
                            }}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                        >
                            Clear All
                        </button>
                    )}
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </button>

            {/* Filter Options */}
            {isExpanded && (
                <div className="p-4 border-t border-gray-200 space-y-6">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => toggleStatus(option.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filters.status.includes(option.value)
                                            ? `bg-${option.color}-100 text-${option.color}-700 border-2 border-${option.color}-300`
                                            : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">From</label>
                                <input
                                    type="date"
                                    value={filters.dateRange.start || ''}
                                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">To</label>
                                <input
                                    type="date"
                                    value={filters.dateRange.end || ''}
                                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Confidence Score Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Confidence: {filters.confidenceMin}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={filters.confidenceMin}
                            onChange={(e) => updateFilter('confidenceMin', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Filters
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    updateFilter('status', ['completed']);
                                    updateFilter('confidenceMin', 90);
                                }}
                                className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition"
                            >
                                High Quality
                            </button>
                            <button
                                onClick={() => {
                                    updateFilter('status', ['failed']);
                                }}
                                className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                            >
                                Failed Only
                            </button>
                            <button
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    updateFilter('dateRange', { start: today, end: today });
                                }}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                            >
                                Today
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
