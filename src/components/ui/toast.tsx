import * as React from "react"
import { cn } from "../../lib/utils"

interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  onClose?: () => void;
  open?: boolean;
}

interface ToastActionElement {
  // Placeholder for action elements - can be expanded later
}

const Toast: React.FC<ToastProps> = ({ title, description, variant = 'default', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000); // Auto-dismiss after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
        variant === 'default'
          ? "border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
          : "border-red-800 bg-gradient-to-r from-red-900 to-red-800 text-red-100 dark:border-red-900 dark:bg-gradient-to-r dark:from-red-950 dark:to-red-900 dark:text-red-100"
      )}
    >
      <div className="grid gap-1">
        {title && (
          <div className="text-sm font-semibold">{title}</div>
        )}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      <button
        onClick={onClose}
        className={cn(
          "absolute right-2 top-2 rounded-md p-1 transition-opacity hover:opacity-100",
          variant === 'default'
            ? "text-gray-500 opacity-70 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            : "text-red-200 opacity-70 hover:text-red-100 dark:text-red-200 dark:hover:text-red-100"
        )}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const ToastViewport: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {children}
    </div>
  );
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Simplified exports to match the original interface
export {
  Toast,
  ToastViewport,
  ToastProvider,
  type ToastProps,
  type ToastActionElement,
};
