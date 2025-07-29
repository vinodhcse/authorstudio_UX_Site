import React from 'react';
import { MinusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useToolWindowStore } from '../stores/toolWindowStore';

interface ToolWindowControlsProps {
  bookId?: string;
  versionId?: string;
  toolName?: string;
}

const ToolWindowControls: React.FC<ToolWindowControlsProps> = ({ 
  bookId, 
  versionId, 
  toolName 
}) => {
  const { dockWindow, closeTool } = useToolWindowStore();

  const handleMinimize = async () => {
    console.log('Minimizing window - Props:', { bookId, versionId, toolName });
    console.log('Window context:', (window as any).__BOOK_CONTEXT__);
    
    if (bookId && versionId && toolName) {
      const windowId = `${bookId}-${versionId}-${toolName}`;
      console.log('Generated windowId:', windowId);
      await dockWindow(windowId);
    } else {
      console.error('Missing props for minimize:', { bookId, versionId, toolName });
    }
  };

  const handleClose = async () => {
    if (bookId && versionId && toolName) {
      const windowId = `${bookId}-${versionId}-${toolName}`;
      await closeTool(windowId);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {toolName ? toolName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Tool Window'}
        </h3>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={handleMinimize}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Minimize to dock"
        >
          <MinusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          title="Close window"
        >
          <XMarkIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
};

export default ToolWindowControls;
