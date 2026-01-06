/**
 * DataGridView Component
 * 
 * Excel-like data grid for viewing extracted and custom fields
 * Features:
 * - Sortable columns
 * - Filterable data
 * - Inline editing
 * - Column resizing
 * - Export visible data
 * - Sticky headers
 */

import { useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, Search, X, Edit2, Check, Download } from 'lucide-react';
import toast from '../../utils/toast.jsx';

export default function DataGridView({
    fields = [],
    customFields = [],
    onFieldUpdate,
    onCustomFieldUpdate,
    readOnly = false
}) {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');

    // Combine extracted fields and custom fields into single dataset
    const data = useMemo(() => {
        const extractedData = fields
            .filter(f => !f.field_name.startsWith('_')) // Filter out metadata
            .map(f => ({
                id: `field_${f.id}`,
                fieldName: f.field_name,
                value: f.current_value || f.original_value || '',
                originalValue: f.original_value || '',
                isEdited: f.is_edited || false,
                confidence: f.confidence || 'N/A',
                source: 'Extracted',
                type: 'extracted',
                rawData: f
            }));

        const customData = customFields.map(f => ({
            id: `custom_${f.id}`,
            fieldName: f.field_name,
            value: f.field_value || '',
            originalValue: '',
            isEdited: false,
            confidence: 'N/A',
            source: 'Custom',
            type: 'custom',
            rawData: f
        }));

        return [...extractedData, ...customData];
    }, [fields, customFields]);

    // Define columns
    const columns = useMemo(
        () => [
            {
                accessorKey: 'fieldName',
                header: 'Field Name',
                cell: ({ getValue }) => (
                    <div className="font-medium text-gray-900">
                        {getValue().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                ),
                size: 200,
            },
            {
                accessorKey: 'value',
                header: 'Value',
                cell: ({ row, getValue }) => {
                    const cellId = `${row.original.id}_value`;
                    const isEditing = editingCell === cellId;

                    if (isEditing && !readOnly) {
                        return (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit(row.original);
                                        if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                />
                                <button
                                    onClick={() => handleSaveEdit(row.original)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div className="flex items-center justify-between group">
                            <span className="text-gray-900">{getValue() || <span className="text-gray-400 italic">No value</span>}</span>
                            {!readOnly && (
                                <button
                                    onClick={() => handleStartEdit(cellId, getValue())}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-indigo-600 hover:bg-indigo-50 rounded transition"
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                        </div>
                    );
                },
                size: 300,
            },
            {
                accessorKey: 'originalValue',
                header: 'Original Value',
                cell: ({ getValue, row }) => {
                    const original = getValue();
                    const isEdited = row.original.isEdited;

                    if (!isEdited || !original) return <span className="text-gray-400">—</span>;

                    return <span className="text-gray-600 text-sm">{original}</span>;
                },
                size: 200,
            },
            {
                accessorKey: 'isEdited',
                header: 'Status',
                cell: ({ getValue }) => {
                    const isEdited = getValue();
                    return (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isEdited
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                            }`}>
                            {isEdited ? 'Edited' : 'Original'}
                        </span>
                    );
                },
                size: 100,
            },
            {
                accessorKey: 'confidence',
                header: 'Confidence',
                cell: ({ getValue }) => {
                    const confidence = getValue();
                    if (confidence === 'N/A') return <span className="text-gray-400">—</span>;

                    const numConfidence = parseFloat(confidence);
                    const color = numConfidence >= 90 ? 'text-green-600' :
                        numConfidence >= 70 ? 'text-yellow-600' : 'text-red-600';

                    return <span className={`font-medium ${color}`}>{confidence}%</span>;
                },
                size: 100,
            },
            {
                accessorKey: 'source',
                header: 'Source',
                cell: ({ getValue }) => {
                    const source = getValue();
                    return (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${source === 'Extracted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                            }`}>
                            {source}
                        </span>
                    );
                },
                size: 100,
            },
        ],
        [editingCell, editValue, readOnly]
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const handleStartEdit = (cellId, currentValue) => {
        setEditingCell(cellId);
        setEditValue(currentValue || '');
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
        setEditValue('');
    };

    const handleSaveEdit = async (rowData) => {
        try {
            if (rowData.type === 'extracted') {
                await onFieldUpdate?.(rowData.rawData.id, editValue);
            } else {
                await onCustomFieldUpdate?.(rowData.rawData.id, { field_value: editValue });
            }

            setEditingCell(null);
            setEditValue('');
            toast.success('Field updated successfully');
        } catch (error) {
            toast.error('Failed to update field');
        }
    };

    const handleExportVisible = () => {
        const visibleData = table.getFilteredRowModel().rows.map(row => ({
            'Field Name': row.original.fieldName,
            'Value': row.original.value,
            'Original Value': row.original.originalValue,
            'Status': row.original.isEdited ? 'Edited' : 'Original',
            'Confidence': row.original.confidence,
            'Source': row.original.source,
        }));

        const csv = [
            Object.keys(visibleData[0]).join(','),
            ...visibleData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fields_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Data exported successfully');
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-gray-900">Data Grid View</h3>
                    <span className="text-sm text-gray-600">
                        {table.getFilteredRowModel().rows.length} of {data.length} fields
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Search fields..."
                            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                        {globalFilter && (
                            <button
                                onClick={() => setGlobalFilter('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Export */}
                    <button
                        onClick={handleExportVisible}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition"
                    >
                        <Download size={16} />
                        Export Visible
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b-2 border-gray-200"
                                        style={{ width: header.getSize() }}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={`flex items-center gap-2 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-900' : ''
                                                    }`}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {header.column.getIsSorted() && (
                                                    <span>
                                                        {header.column.getIsSorted() === 'asc' ? (
                                                            <ArrowUp size={14} className="text-indigo-600" />
                                                        ) : (
                                                            <ArrowDown size={14} className="text-indigo-600" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                                    {globalFilter ? 'No fields match your search' : 'No fields to display'}
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td
                                            key={cell.id}
                                            className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                    <div>
                        Showing {table.getFilteredRowModel().rows.length} field{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-4">
                        <span>{fields.length} extracted</span>
                        <span>•</span>
                        <span>{customFields.length} custom</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
