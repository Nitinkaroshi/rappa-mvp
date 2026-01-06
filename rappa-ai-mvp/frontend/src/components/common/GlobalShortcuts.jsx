import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import ShortcutsHelp from './ShortcutsHelp';

export default function GlobalShortcuts() {
    const navigate = useNavigate();
    const [showHelp, setShowHelp] = useState(false);

    // Listen for custom event from UI buttons (e.g. Sidebar)
    useEffect(() => {
        const handleOpen = () => setShowHelp(true);
        window.addEventListener('open-shortcuts-help', handleOpen);
        return () => window.removeEventListener('open-shortcuts-help', handleOpen);
    }, []);

    // Global shortcuts
    useKeyboardShortcuts({
        onNew: () => navigate('/upload'),
        onSearch: () => {
            // Try to find search input
            const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');
            if (searchInput) {
                searchInput.focus();
            }
        },
        onHelp: () => setShowHelp(true),
    });

    return (
        <ShortcutsHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
    );
}
