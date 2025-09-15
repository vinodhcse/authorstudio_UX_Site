import React, { useState } from 'react';
import { ChapterRevision } from '../../types/chapterRevisionTypes';
import { 
  ClockIcon, 
  DocumentTextIcon, 
  EyeIcon, 
  ArrowPathIcon,
  EllipsisVerticalIcon 
} from '@heroicons/react/24/outline';

interface RevisionCardProps {
  revision: ChapterRevision;
  isSelected: boolean;
  isCompared: boolean;
  isLatest: boolean;
  onSelect: () => void;
  onCompare: () => void;
  onRestore: () => void;
}

export const RevisionCard: React.FC<RevisionCardProps> = ({
  revision,
  isSelected,
  isCompared,
  isLatest,
  onSelect,
  onCompare,
  onRestore
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div
      className={`relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : isCompared
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            revision.is_minor ? 'bg-blue-500' : 'bg-green-500'
          }`} />
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            revision.is_minor
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}>
            {revision.is_minor ? 'Auto' : 'Major'}
          </span>
          {isLatest && (
            <span className="text-xs font-medium px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Latest
            </span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <EyeIcon className="w-4 h-4" />
                <span>Compare</span>
              </button>
              {!isLatest && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Restore</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Message */}
        {revision.message && (
          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
            {revision.message}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>{formatTimestamp(revision.timestamp)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="w-3 h-3" />
              <span>{revision.word_count} words</span>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {formatTime(revision.timestamp)}
          </span>
        </div>

        {/* Author */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          by {revision.author_name}
        </div>
      </div>

      {/* Selection indicators */}
      {isSelected && (
        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r" />
      )}
      {isCompared && (
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-l" />
      )}
    </div>
  );
};
