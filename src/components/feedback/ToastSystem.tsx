import { toast as sonnerToast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, RefreshCw, Undo2 } from 'lucide-react';
import { getSuccessMessage, getErrorMessage } from '@/lib/ux-messages';

// Enhanced toast wrapper with consistent styling and varied messages
export const toast = {
  success: (message?: string, options?: { description?: string; duration?: number }) => {
    const displayMessage = message || getSuccessMessage('save');
    return sonnerToast.success(displayMessage, {
      description: options?.description,
      duration: options?.duration || 3000,
      icon: <CheckCircle2 className="w-5 h-5 text-success" />,
    });
  },

  error: (message?: string, options?: { 
    description?: string; 
    duration?: number;
    action?: { label: string; onClick: () => void };
    retry?: () => void;
  }) => {
    const displayMessage = message || getErrorMessage('generic');
    return sonnerToast.error(displayMessage, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: <XCircle className="w-5 h-5 text-destructive" />,
      action: options?.retry ? {
        label: 'Tentar novamente',
        onClick: options.retry,
      } : options?.action,
    });
  },

  warning: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <AlertTriangle className="w-5 h-5 text-warning" />,
    });
  },

  info: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <Info className="w-5 h-5 text-info" />,
    });
  },

  loading: (message?: string, options?: { description?: string }) => {
    return sonnerToast.loading(message || 'Processando...', {
      description: options?.description,
      icon: <RefreshCw className="w-5 h-5 text-primary animate-spin" />,
    });
  },

  // Special toast for undoable actions
  undoable: (
    message: string, 
    options: { 
      description?: string; 
      onUndo: () => void;
      duration?: number;
    }
  ) => {
    return sonnerToast(message, {
      description: options.description,
      duration: options.duration || 5000,
      action: {
        label: 'Desfazer',
        onClick: options.onUndo,
      },
      icon: <Undo2 className="w-5 h-5 text-muted-foreground" />,
    });
  },

  // Promise-based toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading || 'Processando...',
      success: (data) => {
        if (typeof options.success === 'function') {
          return options.success(data);
        }
        return options.success || getSuccessMessage('save');
      },
      error: (error) => {
        if (typeof options.error === 'function') {
          return options.error(error);
        }
        return options.error || getErrorMessage('generic');
      },
    });
  },

  // Dismiss specific or all toasts
  dismiss: (toastId?: string | number) => {
    if (toastId) {
      sonnerToast.dismiss(toastId);
    } else {
      sonnerToast.dismiss();
    }
  },

  // Custom toast with full control
  custom: sonnerToast,
};

// Hook for toast with automatic cleanup
import { useCallback } from 'react';

export function useToast() {
  const showSuccess = useCallback((message?: string, options?: Parameters<typeof toast.success>[1]) => {
    return toast.success(message, options);
  }, []);

  const showError = useCallback((message?: string, options?: Parameters<typeof toast.error>[1]) => {
    return toast.error(message, options);
  }, []);

  const showWarning = useCallback((message: string, options?: Parameters<typeof toast.warning>[1]) => {
    return toast.warning(message, options);
  }, []);

  const showInfo = useCallback((message: string, options?: Parameters<typeof toast.info>[1]) => {
    return toast.info(message, options);
  }, []);

  const showLoading = useCallback((message?: string, options?: Parameters<typeof toast.loading>[1]) => {
    return toast.loading(message, options);
  }, []);

  const showUndoable = useCallback((
    message: string,
    options: Parameters<typeof toast.undoable>[1]
  ) => {
    return toast.undoable(message, options);
  }, []);

  const promiseToast = useCallback(<T,>(
    promise: Promise<T>,
    options: Parameters<typeof toast.promise>[1]
  ) => {
    return toast.promise(promise, options);
  }, []);

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading,
    undoable: showUndoable,
    promise: promiseToast,
    dismiss: toast.dismiss,
  };
}
