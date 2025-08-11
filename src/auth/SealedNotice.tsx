// SealedNotice component - shown when session is sealed
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon, WifiIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from './useAuthStore';

interface SealedNoticeProps {
  onLogin?: () => void;
}

const SealedNotice: React.FC<SealedNoticeProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const { isLoading, isOnline } = useAuthStore();

  const handleLoginOnline = () => {
    setError('');
    if (onLogin) {
      onLogin();
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to permanently delete all sealed data? This cannot be undone.')) {
      useAuthStore.getState().clearLocalData();
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
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-4"
          >
            <LockClosedIcon className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Data Sealed
          </h1>
          
          <p className="text-gray-400">
            Your data is safely sealed on this device
          </p>
          
          {/* Online/Offline Status */}
          <div className="flex items-center justify-center mt-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isOnline 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              <WifiIcon className="w-4 h-4" />
              {isOnline ? 'Online' : 'Offline - Internet Required'}
            </div>
          </div>
        </div>

        {/* Sealed Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50"
        >
          <div className="text-center mb-6">
            <UserIcon className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Sealed Session
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              This device contains sealed data that requires online authentication to access. 
              Log in as the same user who sealed this data to unlock it.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4"
            >
              {error}
            </motion.div>
          )}

          {/* Login Online Button */}
          <button
            onClick={handleLoginOnline}
            disabled={isLoading || !isOnline}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-4"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </>
            ) : !isOnline ? (
              <>
                <WifiIcon className="w-5 h-5" />
                Internet Required
              </>
            ) : (
              <>
                <LockClosedIcon className="w-5 h-5" />
                Log In Online to Unseal
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <h3 className="text-blue-400 font-medium text-sm mb-2">How This Works:</h3>
            <ul className="text-blue-300 text-xs space-y-1">
              <li>• Your data remains encrypted on this device</li>
              <li>• Online login verifies your identity</li>
              <li>• Only the same user can unseal the data</li>
              <li>• Different user login keeps data sealed</li>
            </ul>
          </div>

          {/* Advanced Options */}
          <details className="mt-4">
            <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300 transition-colors">
              Advanced Options
            </summary>
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <p className="text-gray-400 text-sm mb-4">
                If you no longer need this sealed data, you can permanently delete it.
                <strong className="text-red-400"> This cannot be undone.</strong>
              </p>
              <button
                onClick={handleClearData}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                Permanently Delete Sealed Data
              </button>
            </div>
          </details>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Your data is encrypted and safely stored
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SealedNotice;
