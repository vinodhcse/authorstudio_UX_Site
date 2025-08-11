// AuthGate component to protect routes and handle authentication flow
import React, { useEffect, useState } from 'react';
import { useAuthStore } from './useAuthStore';
import UnlockOffline from './UnlockOffline';
import IdleWarningModal from './IdleWarningModal';
import { useIdleTimer, DEFAULT_IDLE_CONFIG } from './idleTimer';
import { motion } from 'framer-motion';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AuthGate: React.FC<AuthGateProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading, appKey } = useAuthStore();
  const [showUnlock, setShowUnlock] = useState(false);
  
  // Idle timer - only active when authenticated and app key is available
  const {
    showWarning,
    remainingTime,
    extendSession,
    dismissWarning
  } = useIdleTimer(DEFAULT_IDLE_CONFIG);

  useEffect(() => {
    // Check if we need to show unlock screen
    const checkAuthStatus = async () => {
      if (!isAuthenticated && !isLoading) {
        // Check if there's a stored session that needs unlocking
        try {
          const { getSessionRow } = await import('./sqlite');
          const session = await getSessionRow();
          
          if (session) {
            // Session exists, show unlock screen
            setShowUnlock(true);
          } else {
            // No session, user needs to login first
            setShowUnlock(false);
          }
        } catch (error) {
          console.error('Failed to check session:', error);
          setShowUnlock(false);
        }
      } else if (isAuthenticated) {
        setShowUnlock(false);
      }
    };

    checkAuthStatus();
  }, [isAuthenticated, isLoading]);

  // If appKey is cleared (due to idle timeout), show unlock screen
  useEffect(() => {
    if (isAuthenticated && !appKey) {
      setShowUnlock(true);
    }
  }, [isAuthenticated, appKey]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-white text-lg">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Show unlock screen if needed
  if (showUnlock) {
    return <UnlockOffline onUnlock={() => setShowUnlock(false)} />;
  }

  // Show authentication required fallback
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50">
            <h1 className="text-2xl font-bold text-white mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-400 mb-6">
              Please log in to access Author Studio
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
            >
              Go to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show protected content
  return (
    <>
      {children}
      
      {/* Idle Warning Modal */}
      <IdleWarningModal
        isOpen={showWarning && isAuthenticated}
        remainingTime={remainingTime}
        onExtend={extendSession}
        onDismiss={dismissWarning}
      />
      
      {/* Offline Banner */}
      <OfflineBanner />
    </>
  );
};

// Offline status banner
const OfflineBanner: React.FC = () => {
  const { isOnline } = useAuthStore();

  if (isOnline) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium"
    >
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        Offline – sync disabled until online
      </div>
    </motion.div>
  );
};

export default AuthGate;
