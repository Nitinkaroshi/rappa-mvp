/**
 * Toast Notifications Utility
 * 
 * Wrapper around react-hot-toast for consistent toast notifications
 * across the application.
 */

import toast from 'react-hot-toast';

/**
 * Toast configuration
 */
export const toastConfig = {
    // Default options for all toasts
    duration: 4000,
    position: 'top-right',

    // Styling
    style: {
        background: '#363636',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
    },

    // Success toast style
    success: {
        duration: 3000,
        iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
        },
    },

    // Error toast style
    error: {
        duration: 5000,
        iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
        },
    },

    // Loading toast style
    loading: {
        iconTheme: {
            primary: '#6366f1',
            secondary: '#fff',
        },
    },
};

/**
 * Show success toast
 */
export const showSuccess = (message, options = {}) => {
    return toast.success(message, {
        ...toastConfig.success,
        ...options,
    });
};

/**
 * Show error toast
 */
export const showError = (message, options = {}) => {
    return toast.error(message, {
        ...toastConfig.error,
        ...options,
    });
};

/**
 * Show loading toast
 */
export const showLoading = (message, options = {}) => {
    return toast.loading(message, {
        ...toastConfig.loading,
        ...options,
    });
};

/**
 * Show info toast
 */
export const showInfo = (message, options = {}) => {
    return toast(message, {
        icon: 'ℹ️',
        ...options,
    });
};

/**
 * Show warning toast
 */
export const showWarning = (message, options = {}) => {
    return toast(message, {
        icon: '⚠️',
        style: {
            ...toastConfig.style,
            background: '#f59e0b',
        },
        ...options,
    });
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId) => {
    toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
    toast.dismiss();
};

/**
 * Promise toast - shows loading, then success or error
 */
export const showPromise = (promise, messages) => {
    return toast.promise(
        promise,
        {
            loading: messages.loading || 'Loading...',
            success: messages.success || 'Success!',
            error: messages.error || 'Something went wrong',
        },
        toastConfig
    );
};

/**
 * Custom toast with action button
 */
export const showWithAction = (message, actionLabel, onAction, options = {}) => {
    return toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{message}</span>
            <button
                onClick={() => {
                    onAction();
                    toast.dismiss(t.id);
                }}
                style={{
                    padding: '6px 12px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                }}
            >
                {actionLabel}
            </button>
        </div>
    ), options);
};

// Export the toast object for advanced usage
export { toast };

// Export default
export default {
    success: showSuccess,
    error: showError,
    loading: showLoading,
    info: showInfo,
    warning: showWarning,
    promise: showPromise,
    withAction: showWithAction,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
};
