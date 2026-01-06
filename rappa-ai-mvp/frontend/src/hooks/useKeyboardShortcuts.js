/**
 * useKeyboardShortcuts Hook
 * 
 * Global keyboard shortcuts for the application
 */

import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts({
    onSave,
    onExport,
    onNew,
    onSearch,
    onHelp,
} = {}) {
    const navigate = useNavigate();

    // Alt+S - Save
    useHotkeys('alt+s', (e) => {
        e.preventDefault();
        onSave?.();
    }, [onSave]);

    // Alt+E - Export
    useHotkeys('alt+e', (e) => {
        e.preventDefault();
        onExport?.();
    }, [onExport]);

    // Alt+N - New/Upload
    useHotkeys('alt+n', (e) => {
        e.preventDefault();
        if (onNew) {
            onNew();
        } else {
            navigate('/upload');
        }
    }, [onNew, navigate]);

    // Alt+K or Ctrl+K - Search (Ctrl+K is usually safe/standard for command palette)
    useHotkeys('alt+k, ctrl+k, cmd+k', (e) => {
        e.preventDefault();
        onSearch?.();
    }, [onSearch]);

    // Alt+/ - Show help
    useHotkeys('alt+/', (e) => {
        e.preventDefault();
        onHelp?.();
    }, [onHelp]);

    // Alt+D - Dashboard (Note: Chrome focuses address bar with Alt+D, so we might need preventDefault hard, or use Alt+Shift+D)
    // trying alt+shift+d to be safer
    useHotkeys('alt+shift+d, alt+d', (e) => {
        e.preventDefault();
        navigate('/dashboard');
    }, [navigate]);

    // Alt+H - Home
    useHotkeys('alt+h', (e) => {
        e.preventDefault();
        navigate('/');
    }, [navigate]);

    // Escape - Close modals (handled by individual components)
}

export default useKeyboardShortcuts;
