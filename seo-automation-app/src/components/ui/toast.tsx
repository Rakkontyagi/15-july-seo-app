'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils/cn';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => removeToast(toast.id), 150);
  };

  const typeConfig = {
    success: {
      icon: CheckCircle,
      className: 'border-green-200 bg-green-50 text-green-800',
      iconClassName: 'text-green-500',
    },
    error: {
      icon: AlertCircle,
      className: 'border-red-200 bg-red-50 text-red-800',
      iconClassName: 'text-red-500',
    },
    warning: {
      icon: AlertTriangle,
      className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      iconClassName: 'text-yellow-500',
    },
    info: {
      icon: Info,
      className: 'border-blue-200 bg-blue-50 text-blue-800',
      iconClassName: 'text-blue-500',
    },
  };

  const config = typeConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-lg transition-all duration-300',
        config.className,
        isVisible 
          ? 'animate-in slide-in-from-right-full' 
          : 'animate-out slide-out-to-right-full'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClassName)} />
        
        <div className="flex-1 space-y-1">
          <div className="font-medium">{toast.title}</div>
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

// Convenience functions for different toast types
export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    success: (title: string, description?: string, action?: Toast['action']) =>
      addToast({ type: 'success', title, description, action }),
    
    error: (title: string, description?: string, action?: Toast['action']) =>
      addToast({ type: 'error', title, description, action }),
    
    warning: (title: string, description?: string, action?: Toast['action']) =>
      addToast({ type: 'warning', title, description, action }),
    
    info: (title: string, description?: string, action?: Toast['action']) =>
      addToast({ type: 'info', title, description, action }),
  };
}