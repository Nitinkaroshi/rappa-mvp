import { LayoutGrid, FileText, Table, Maximize } from 'lucide-react';

export default function ViewSelector({ currentView, onViewChange }) {
  const views = [
    {
      id: 'data_only',
      name: 'Data Only',
      description: 'View extracted fields without document',
      icon: LayoutGrid
    },
    {
      id: 'document_fields',
      name: 'Document + General fields',
      description: 'View document with extracted general fields',
      icon: FileText
    },
    {
      id: 'document_tables',
      name: 'Document + Table fields',
      description: 'View document with extracted table data',
      icon: Table
    },
    {
      id: 'full',
      name: 'Full View',
      description: 'View everything - document, fields, and tables',
      icon: Maximize
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Select View</h2>
          <p className="text-indigo-100">Choose how you want to see your document results</p>
        </div>

        {/* View Options Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {views.map((view) => {
            const Icon = view.icon;
            const isSelected = currentView === view.id;

            return (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left group ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  isSelected
                    ? 'bg-indigo-600'
                    : 'bg-gray-100 group-hover:bg-indigo-100'
                }`}>
                  <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-600 group-hover:text-indigo-600'}`} />
                </div>

                {/* Text */}
                <h3 className={`text-lg font-bold mb-2 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                  {view.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {view.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
          <button
            onClick={() => onViewChange(null)}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
