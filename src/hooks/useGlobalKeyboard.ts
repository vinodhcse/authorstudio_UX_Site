import { useEffect } from 'react';
import { useAuthStore } from '../auth/useAuthStore';
import { appLog } from '../auth/fileLogger';

export const useGlobalKeyboard = () => {
  const { lock, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Check for Ctrl+L (Windows/Linux) or Cmd+L (Mac)
      const isLockShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l';
      
      if (isLockShortcut) {
        // Prevent default browser behavior (like opening location bar)
        event.preventDefault();
        event.stopPropagation();
        
        // Only lock if user is authenticated
        if (isAuthenticated) {
          try {
            await appLog.info('global-keyboard', 'Lock shortcut triggered');
            await lock();
            await appLog.success('global-keyboard', 'Lock successful via keyboard shortcut');
          } catch (error) {
            await appLog.error('global-keyboard', 'Lock failed via keyboard shortcut', error);
          }
        }
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [lock, isAuthenticated]);
};
