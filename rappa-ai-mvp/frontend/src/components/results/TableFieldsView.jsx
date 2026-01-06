import { useState } from 'react';
import { ArrowUpDown, Table as TableIcon } from 'lucide-react';

export default function TableFieldsView({ fields }) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter only table fields (fields that are arrays or have table-like structure)
  const tableFields = fields.filter(field => {
    // Check if field is part of a table structure
    // Table fields typically have names like: table_1_row_1_col_1, or are arrays
    return field.field_name.includes('table_') ||
           field.field_name.includes('row_') ||
           Array.isArray(field.current_value);
  });

  // Group fields into table structure
  const parseTableData = () => {
    const tables = {};

    fields.forEach(field => {
      // Match patterns like: table_1_row_1_item_description
      const tableMatch = field.field_name.match(/table_(\d+)_row_(\d+)_(.+)/);

      if (tableMatch) {
        const [, tableId, rowId, columnName] = tableMatch;
        const tableKey = `table_${tableId}`;

        if (!tables[tableKey]) {
          tables[tableKey] = {
            rows: {},
            columns: new Set()
          };
        }

        if (!tables[tableKey].rows[rowId]) {
          tables[tableKey].rows[rowId] = {};
        }

        tables[tableKey].rows[rowId][columnName] = field.current_value;
        tables[tableKey].columns.add(columnName);
      }
    });

    // Convert to array format
    return Object.entries(tables).map(([tableId, data]) => ({
      id: tableId,
      columns: Array.from(data.columns),
      rows: Object.values(data.rows)
    }));
  };

  const tablesData = parseTableData();

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortRows = (rows, column) => {
    if (!column) return rows;

    return [...rows].sort((a, b) => {
      const aVal = a[column] || '';
      const bVal = b[column] || '';

      if (sortDirection === 'asc') {
        return aVal.toString().localeCompare(bVal.toString());
      } else {
        return bVal.toString().localeCompare(aVal.toString());
      }
    });
  };

  if (tablesData.length === 0) {
    return (
      <div className="p-8 text-center">
        <TableIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No table data extracted from this document</p>
        <p className="text-sm text-gray-400 mt-1">Table fields will appear here when detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tablesData.map((table, tableIndex) => (
        <div key={table.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">
                Table {tableIndex + 1} Fields
              </h3>
              <span className="text-sm text-gray-600">
                ({table.rows.length} {table.rows.length === 1 ? 'row' : 'rows'})
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                    #
                  </th>
                  {table.columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{column.replace(/_/g, ' ')}</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-indigo-600" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortRows(table.rows, sortColumn).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-500">
                      {rowIndex + 1}
                    </td>
                    {table.columns.map((column) => (
                      <td key={column} className="px-4 py-3 text-sm text-gray-900">
                        {row[column] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
