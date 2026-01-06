/**
 * ShortcutsHelp Component
 * 
 * Modal displaying all available keyboard shortcuts
 */

import { X, Keyboard } from 'lucide-react';

export default function ShortcutsHelp({ isOpen, onClose }) {
    if (!isOpen) return null;

    const shortcuts = [
        {
            category: 'Navigation', items: [
                { keys: ['Alt', 'D'], description: 'Go to Dashboard' },
                { keys: ['Alt', 'H'], description: 'Go to Home' },
                { keys: ['Alt', 'N'], description: 'New Upload' },
            ]
        },
        {
            category: 'Actions', items: [
                { keys: ['Alt', 'S'], description: 'Save Changes' },
                { keys: ['Alt', 'E'], description: 'Export Data' },
                { keys: ['Alt', 'K'], description: 'Focus Search' },
            ]
        },
        {
            category: 'General', items: [
                { keys: ['Alt', '/'], description: 'Show This Help' },
                { keys: ['Esc'], description: 'Close Modal' },
                { keys: ['Enter'], description: 'Open Selected Item' },
            ]
        },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Keyboard className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
                            <p className="text-sm text-gray-600">Speed up your workflow</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="p-6 space-y-6">
                    {shortcuts.map((category) => (
                        <div key={category.category}>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                {category.category}
                            </h3>
                            <div className="space-y-2">
                                {category.items.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition"
                                    >
                                        <span className="text-sm text-gray-700">
                                            {shortcut.description}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <span key={keyIndex} className="flex items-center gap-1">
                                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded">
                                                        {key}
                                                    </kbd>
                                                    {keyIndex < shortcut.keys.length - 1 && (
                                                        <span className="text-gray-400">+</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-600 text-center">
                        Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded">Alt</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded">/</kbd> anytime to see this help
                    </p>
                </div>
            </div>
        </div>
    );
}
