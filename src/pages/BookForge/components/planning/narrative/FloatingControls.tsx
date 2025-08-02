import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon, 
  FunnelIcon, 
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { NarrativeFilters, CreateNodeModalData, NarrativeNode } from '../../../../../types/narrative-layout';

interface FloatingControlsProps {
  // View Controls Props
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onShowAll: () => void;
  onResetToHierarchy: () => void;
  onAdjustLayout: () => void;
  
  // Quick Create Props
  createNodeShortcuts: Array<{
    type: NarrativeNode['type'];
    label: string;
    color: string;
  }>;
  onCreateNode: (modalData: CreateNodeModalData) => void;
  onDragStart: (event: any, type: NarrativeNode['type']) => void;
  
  // Filter Props
  filters: NarrativeFilters;
  onFiltersChange: (filters: NarrativeFilters) => void;
  
  // Mock data for filters
  availableCharacters: Array<{ id: string; name: string; }>;
  availableLocations: Array<{ id: string; name: string; }>;
  availableObjects: Array<{ id: string; name: string; }>;
  availableTimelineEvents: Array<{ id: string; name: string; tag: string; }>;
}

const FloatingControls: React.FC<FloatingControlsProps> = ({
  onExpandAll,
  onCollapseAll,
  onShowAll,
  onResetToHierarchy,
  onAdjustLayout,
  createNodeShortcuts,
  onCreateNode,
  onDragStart,
  filters,
  onFiltersChange,
  availableCharacters,
  availableLocations,
  availableObjects,
  availableTimelineEvents
}) => {
  const [isViewControlsOpen, setIsViewControlsOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const MultiSelectDropdown: React.FC<{
    label: string;
    options: Array<{ id: string; name: string; }>;
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
    placeholder?: string;
  }> = ({ label, options, selectedIds, onChange, placeholder = "Select items..." }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (id: string) => {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter(item => item !== id));
      } else {
        onChange([...selectedIds, id]);
      }
    };

    return (
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
          >
            <span className="truncate">
              {selectedIds.length === 0 
                ? placeholder 
                : `${selectedIds.length} selected`
              }
            </span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(option.id)}
                      onChange={() => toggleOption(option.id)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {option.name}
                    </span>
                  </label>
                ))}
                {options.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No options available
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-4 right-4 z-40 flex gap-2">
      {/* View Controls Button */}
      <div className="relative">
        <motion.button
          onClick={() => setIsViewControlsOpen(!isViewControlsOpen)}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <EyeIcon className="w-6 h-6" />
        </motion.button>
        
        <AnimatePresence>
          {isViewControlsOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="absolute top-14 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-48"
            >
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                VIEW CONTROLS
              </div>
              <div className="space-y-2">
                <motion.button
                  onClick={onExpandAll}
                  className="w-full px-3 py-2 text-sm rounded font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Expand All
                </motion.button>
                <motion.button
                  onClick={onCollapseAll}
                  className="w-full px-3 py-2 text-sm rounded font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-900/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Collapse All
                </motion.button>
                <motion.button
                  onClick={onShowAll}
                  className="w-full px-3 py-2 text-sm rounded font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Show All
                </motion.button>
                <motion.button
                  onClick={onResetToHierarchy}
                  className="w-full px-3 py-2 text-sm rounded font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Hierarchy
                </motion.button>
                <motion.button
                  onClick={onAdjustLayout}
                  className="w-full px-3 py-2 text-sm rounded font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Auto Layout
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Create Button */}
      <div className="relative">
        <motion.button
          onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
          className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusIcon className="w-6 h-6" />
        </motion.button>
        
        <AnimatePresence>
          {isQuickCreateOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="absolute top-14 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-56"
            >
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                QUICK CREATE
              </div>
              <div className="grid grid-cols-2 gap-2">
                {createNodeShortcuts.map(({ type, label, color }) => (
                  <motion.button
                    key={type}
                    draggable
                    onDragStart={(event: any) => onDragStart(event, type)}
                    onClick={() => {
                      onCreateNode({
                        parentId: null,
                        nodeType: type,
                        position: { x: Math.random() * 500 + 100, y: Math.random() * 400 + 100 },
                        isVisible: true
                      });
                    }}
                    className={`px-3 py-2 text-xs rounded font-medium bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 hover:bg-${color}-200 dark:hover:bg-${color}-900/50 cursor-grab active:cursor-grabbing`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                💡 Drag buttons to canvas or click to place randomly
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Button */}
      <div className="relative">
        <motion.button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FunnelIcon className="w-6 h-6" />
        </motion.button>
        
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="absolute top-14 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-72 max-h-96 overflow-y-auto"
            >
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                FILTERS
              </div>
              
              <MultiSelectDropdown
                label="Characters"
                options={availableCharacters}
                selectedIds={filters.characters}
                onChange={(selectedIds) => onFiltersChange({ ...filters, characters: selectedIds })}
                placeholder="Filter by characters..."
              />
              
              <MultiSelectDropdown
                label="Locations"
                options={availableLocations}
                selectedIds={filters.locations}
                onChange={(selectedIds) => onFiltersChange({ ...filters, locations: selectedIds })}
                placeholder="Filter by locations..."
              />
              
              <MultiSelectDropdown
                label="Objects"
                options={availableObjects}
                selectedIds={filters.objects}
                onChange={(selectedIds) => onFiltersChange({ ...filters, objects: selectedIds })}
                placeholder="Filter by objects..."
              />
              
              <MultiSelectDropdown
                label="Timeline Events"
                options={availableTimelineEvents}
                selectedIds={filters.timelineEvents || []}
                onChange={(selectedIds) => onFiltersChange({ ...filters, timelineEvents: selectedIds })}
                placeholder="Filter by timeline events..."
              />
              
              {/* Clear All Filters */}
              <motion.button
                onClick={() => onFiltersChange({
                  characters: [],
                  locations: [],
                  objects: [],
                  nodeTypes: [],
                  status: [],
                  timelineEvents: []
                })}
                className="w-full mt-3 px-3 py-2 text-sm rounded font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear All Filters
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FloatingControls;
