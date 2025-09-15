// Idle timeout warning modal
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface IdleWarningModalProps {
  isOpen: boolean;
  remainingTime: number;
  onExtend: () => void;
  onDismiss: () => void;
}

const IdleWarningModal: React.FC<IdleWarningModalProps> = ({
  isOpen,
  remainingTime,
  onExtend,
  onDismiss
}) => {
  const remainingSeconds = Math.ceil(remainingTime / 1000);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsDisplay = remainingSeconds % 60;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gray-800 rounded-2xl border border-gray-600 shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Session Timeout Warning
                  </h3>
                  <p className="text-gray-400 text-sm">
                    You'll be logged out due to inactivity
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 text-sm">Time remaining:</span>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-orange-400 mb-1">
                    {remainingMinutes}:{remainingSecondsDisplay.toString().padStart(2, '0')}
                  </div>
                  <div className="text-gray-500 text-sm">
                    minutes:seconds
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ 
                      duration: remainingTime / 1000,
                      ease: 'linear'
                    }}
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onExtend}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  Stay Logged In
                </button>
                
                <button
                  onClick={onDismiss}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  Continue Working
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                Your session will be cleared automatically for security
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IdleWarningModal;
