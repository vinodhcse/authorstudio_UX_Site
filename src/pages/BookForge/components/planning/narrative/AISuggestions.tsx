import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  LightBulbIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { AISuggestion } from '../../../../../types/narrative-layout';

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onDismiss: (suggestionId: string) => void;
  onApply: (suggestionId: string) => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  suggestions,
  onDismiss,
  onApply
}) => {
  if (suggestions.length === 0) return null;

  const getSeverityIcon = (severity: AISuggestion['severity']) => {
    switch (severity) {
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <InformationCircleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <LightBulbIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity: AISuggestion['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTypeLabel = (type: AISuggestion['type']) => {
    switch (type) {
      case 'character-balance':
        return 'Character Balance';
      case 'pacing-anomaly':
        return 'Pacing Issue';
      case 'lore-connection':
        return 'Lore Connection';
      case 'plot-hole':
        return 'Plot Consistency';
      default:
        return 'AI Suggestion';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      <AnimatePresence>
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, x: 300, y: 20 }}
            animate={{ opacity: 1, x: 0, y: index * 10 }}
            exit={{ opacity: 0, x: 300 }}
            className={`mb-2 rounded-lg shadow-lg border-2 overflow-hidden ${getSeverityBg(suggestion.severity)}`}
          >
            {/* Header */}
            <div className="p-3 pb-2">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(suggestion.severity)}
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    {getTypeLabel(suggestion.type)}
                  </span>
                </div>
                <button
                  onClick={() => onDismiss(suggestion.id)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                {suggestion.title}
              </h4>
              
              <p className="text-gray-700 dark:text-gray-300 text-xs mb-2 line-clamp-2">
                {suggestion.description}
              </p>

              <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Affects {suggestion.affectedNodeIds.length} node(s)
              </div>
            </div>

            {/* Actions */}
            <div className="px-3 pb-3 flex gap-2">
              <motion.button
                onClick={() => onApply(suggestion.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Apply Fix
              </motion.button>
              <motion.button
                onClick={() => onDismiss(suggestion.id)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dismiss
              </motion.button>
            </div>

            {/* Suggested Action Preview */}
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Suggested Action:
              </div>
              <div className="text-xs text-gray-800 dark:text-gray-200">
                {suggestion.suggestedAction}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Show count if more suggestions exist */}
      {suggestions.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-2"
        >
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full shadow">
            +{suggestions.length - 3} more suggestions
          </span>
        </motion.div>
      )}
    </div>
  );
};

// Sample AI suggestions for demonstration
export const generateSampleAISuggestions = (): AISuggestion[] => [
  {
    id: 'ai-suggestion-1',
    type: 'character-balance',
    severity: 'medium',
    title: 'Character Absence Detected',
    description: 'Nemar hasn\'t appeared in the last 2 chapters. Consider adding a scene or reference to maintain character presence.',
    affectedNodeIds: ['chapter-2', 'chapter-3'],
    suggestedAction: 'Add a scene with Nemar in Chapter 3 or reference his activities from another character\'s perspective.'
  },
  {
    id: 'ai-suggestion-2',
    type: 'pacing-anomaly',
    severity: 'low',
    title: 'Pacing Inconsistency',
    description: 'Chapter 2 has a significantly slower pace compared to the established rhythm. This might affect reader engagement.',
    affectedNodeIds: ['chapter-2'],
    suggestedAction: 'Consider adding more action or tension to Chapter 2, or restructuring scenes for better flow.'
  },
  {
    id: 'ai-suggestion-3',
    type: 'lore-connection',
    severity: 'high',
    title: 'Unused Lore Element',
    description: 'The "Blood Knight" timeline event could be connected to the current scenes for richer world-building.',
    affectedNodeIds: ['scene-1', 'scene-2'],
    suggestedAction: 'Link the Blood Knight lore to Nemar\'s discovery scene to add historical depth and foreshadowing.'
  },
  {
    id: 'ai-suggestion-4',
    type: 'plot-hole',
    severity: 'high',
    title: 'Character Motivation Gap',
    description: 'Elder Theron\'s reaction to Nemar\'s powers seems inconsistent with his established character traits.',
    affectedNodeIds: ['scene-2'],
    suggestedAction: 'Revise Elder Theron\'s dialogue to better reflect his wisdom and prior knowledge of magical events.'
  }
];
