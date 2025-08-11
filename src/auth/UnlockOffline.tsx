// UnlockOffline component for passphrase entry
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from './useAuthStore';
import { appLog } from './fileLogger';

interface UnlockOfflineProps {
  onUnlock?: () => void;
}

const UnlockOffline: React.FC<UnlockOfflineProps> = ({ onUnlock }) => {
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState('');
  
  const { unlock, isLoading, isOnline } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passphrase.trim()) {
      setError('Please enter your passphrase');
      return;
    }

    try {
      setError('');
      await unlock(passphrase);
      
      // Clear passphrase from memory
      setPassphrase('');
      
      if (onUnlock) {
        onUnlock();
      }
    } catch (error) {
      appLog.error('unlock-offline', 'Unlock failed', error);
      setError(error instanceof Error ? error.message : 'Unlock failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4"
          >
            <LockClosedIcon className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Author Studio
          </h1>
          
          <p className="text-gray-400">
            Enter your passphrase to unlock
          </p>
          
          {/* Online/Offline Status */}
          <div className="flex items-center justify-center mt-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isOnline 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-orange-500/20 text-orange-400'
            }`}>
              <WifiIcon className="w-4 h-4" />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Unlock Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Passphrase Input */}
            <div>
              <label htmlFor="passphrase" className="block text-sm font-medium text-gray-300 mb-2">
                Passphrase
              </label>
              
              <div className="relative">
                <input
                  id="passphrase"
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter your passphrase"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                  autoFocus
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassphrase ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                {error}
              </motion.div>
            )}

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isLoading || !passphrase.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <LockClosedIcon className="w-5 h-5" />
                  Unlock
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          {!isOnline && (
            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-orange-400 text-sm text-center">
                <WifiIcon className="w-4 h-4 inline mr-2" />
                Working offline - sync disabled until online
              </p>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm mb-4">
            Your data is encrypted and stored locally
          </p>
          
          {/* Troubleshooting Section */}
          <details className="mt-4">
            <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300 transition-colors">
              Having trouble unlocking? Click here for help
            </summary>
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <p className="text-gray-400 text-sm mb-4">
                If you're unable to unlock with your passphrase, you can reset all local data. 
                <strong className="text-yellow-400"> Warning: This will log you out and clear all offline data.</strong>
              </p>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all local data? This will log you out and you\'ll need to sign in again.')) {
                    useAuthStore.getState().clearLocalData();
                  }
                }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                Clear Local Data & Reset
              </button>
            </div>
          </details>
        </div>
      </motion.div>
    </div>
  );
};

export default UnlockOffline;
