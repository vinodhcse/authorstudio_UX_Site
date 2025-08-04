import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronDownIcon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { NarrativeNode, CreateNodeModalData } from '../../../../../types/narrative-layout';

interface EnhancedCreateNodeModalProps {
  isVisible: boolean;
  modalData: CreateNodeModalData;
  onClose: () => void;
  onCreate: (nodeData: Partial<NarrativeNode>) => void;
  existingNode?: NarrativeNode | null;
  availableNodes?: NarrativeNode[];
}

// Mock data - replace with actual data from your context
const mockData = {
  characters: [
    { id: 'char1', name: 'Aria Blackthorne', role: 'protagonist' },
    { id: 'char2', name: 'Marcus Steel', role: 'deuteragonist' },
    { id: 'char3', name: 'The Shadow King', role: 'antagonist' },
    { id: 'char4', name: 'Elena Brightwater', role: 'supporting' },
    { id: 'char5', name: 'Tobias the Wise', role: 'mentor' }
  ],
  locations: [
    { id: 'loc1', name: 'Crystal Caverns', type: 'dungeon', world: 'Aethermoor' },
    { id: 'loc2', name: 'Skyhold Academy', type: 'academy', world: 'Aethermoor' },
    { id: 'loc3', name: 'The Whispering Woods', type: 'forest', world: 'Aethermoor' },
    { id: 'loc4', name: 'Fortress of Despair', type: 'stronghold', world: 'Shadowlands' }
  ],
  objects: [
    { id: 'obj1', name: 'Shadowbane Sword', type: 'weapon' },
    { id: 'obj2', name: 'Crystal of Eternal Light', type: 'artifact' },
    { id: 'obj3', name: 'Ancient Tome of Secrets', type: 'knowledge' }
  ],
  lore: [
    { id: 'lore1', name: 'The Great Sundering', type: 'historical_event' },
    { id: 'lore2', name: 'Order of the Silver Dawn', type: 'organization' },
    { id: 'lore3', name: 'Laws of Elemental Magic', type: 'magic_system' }
  ],
  timelineEvents: [
    { 
      id: 'event1', 
      name: 'The Dark Lord Returns', 
      note: 'Ancient evil awakens from centuries of slumber',
      date: 'Year 1, Day 1',
      tag: 'Present'
    },
    { 
      id: 'event2', 
      name: 'Battle of Shadowmere', 
      note: 'The great battle that shaped the realm',
      date: '50 years ago',
      tag: 'Past'
    },
    { 
      id: 'event3', 
      name: 'Vision of the Chosen One', 
      note: 'Prophecy reveals the hero who will save the world',
      date: 'Next week',
      tag: 'Future'
    },
    { 
      id: 'event4', 
      name: 'Memory of First Love', 
      note: 'Character recalls their lost love',
      date: '5 years ago',
      tag: 'Flashback'
    }
  ]
};

// Enhanced input component matching BookDetails styling
const FormInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  multiline?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', multiline = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
      />
    )}
  </div>
);

// Enhanced multi-select component with chips
const MultiSelectDropdown: React.FC<{
  label: string;
  items: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  displayField: string;
  searchPlaceholder: string;
  singleSelect?: boolean;
}> = ({ 
  label, 
  items, 
  selectedIds, 
  onSelectionChange, 
  displayField, 
  searchPlaceholder,
  singleSelect = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredItems = items.filter(item => 
    item[displayField].toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleToggleItem = (id: string) => {
    if (singleSelect) {
      onSelectionChange([id]);
      setIsOpen(false);
    } else {
      const newSelection = selectedIds.includes(id)
        ? selectedIds.filter(selectedId => selectedId !== id)
        : [...selectedIds, id];
      onSelectionChange(newSelection);
    }
  };

  const handleRemoveChip = (id: string) => {
    onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
  };

  const selectedItems = items.filter(item => selectedIds.includes(item.id));

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      {/* Selected items as chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm border border-purple-200 dark:border-purple-700"
            >
              <span>{item[displayField]}</span>
              <button
                onClick={() => handleRemoveChip(item.id)}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
              >
                <XCircleIcon className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 text-left bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-lg focus:ring-purple-500 focus:border-purple-500 flex items-center justify-between text-gray-800 dark:text-gray-200"
        >
          <span className="text-gray-500 dark:text-gray-400">
            {singleSelect && selectedItems.length > 0 
              ? selectedItems[0][displayField]
              : `Select ${label.toLowerCase()}...`
            }
          </span>
          <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
            >
              {/* Search input */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-purple-500 focus:border-purple-500"
                    onKeyDown={(e) => e.stopPropagation()} // Prevent dropdown from closing
                  />
                </div>
              </div>

              {/* Items list */}
              <div className="max-h-48 overflow-y-auto">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleItem(item.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                        selectedIds.includes(item.id) ? 'bg-purple-50 dark:bg-purple-900/30' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {item[displayField]}
                        </div>
                        {item.role && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.role}
                          </div>
                        )}
                        {item.type && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.type}
                          </div>
                        )}
                      </div>
                      {selectedIds.includes(item.id) && (
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No items found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export // Timeline Event Selector Component with Create Option
interface TimelineEventSelectorProps {
  selectedTimelineEvent: string;
  onTimelineEventChange: (eventId: string) => void;
  availableEvents: Array<{ id: string; name: string; tag: string; note?: string; }>;
}

const TimelineEventSelector: React.FC<TimelineEventSelectorProps> = ({
  selectedTimelineEvent,
  onTimelineEventChange,
  availableEvents
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    tag: 'Present',
    note: ''
  });

  const handleCreateEvent = () => {
    if (newEvent.name.trim()) {
      const newEventId = `timeline-${Date.now()}`;
      // In a real app, this would create the event in the backend
      const createdEvent = {
        id: newEventId,
        name: newEvent.name,
        tag: newEvent.tag,
        note: newEvent.note
      };
      
      // Add to available events (in real app, this would be done via context/state management)
      availableEvents.push(createdEvent);
      
      // Select the new event
      onTimelineEventChange(newEventId);
      
      // Reset form
      setNewEvent({ name: '', tag: 'Present', note: '' });
      setShowCreateForm(false);
      setIsOpen(false);
    }
  };

  const selectedEvent = availableEvents.find(e => e.id === selectedTimelineEvent);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        Timeline Event (Optional)
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
        >
          <span className="truncate">
            {selectedEvent ? selectedEvent.name : 'Select or create timeline event...'}
          </span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-auto"
            >
              {/* Clear Selection Option */}
              <button
                type="button"
                onClick={() => {
                  onTimelineEventChange('');
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600"
              >
                Clear selection
              </button>

              {/* Existing Events */}
              {availableEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    onTimelineEventChange(event.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 text-sm ${
                    selectedTimelineEvent === event.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{event.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.tag === 'Past' ? 'bg-amber-100 text-amber-800' :
                      event.tag === 'Present' ? 'bg-blue-100 text-blue-800' :
                      event.tag === 'Future' ? 'bg-green-100 text-green-800' :
                      event.tag === 'Flashback' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.tag}
                    </span>
                  </div>
                  {event.note && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {event.note}
                    </div>
                  )}
                </button>
              ))}

              {/* Create New Event Section */}
              <div className="border-t border-gray-200 dark:border-gray-600">
                {!showCreateForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full px-4 py-3 text-left hover:bg-orange-50 dark:hover:bg-orange-900/30 text-sm text-orange-600 dark:text-orange-400 font-medium border-t border-orange-200 dark:border-orange-700/50 transition-colors"
                  >
                    + Create new timeline event
                  </button>
                ) : (
                  <div className="p-4 space-y-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-700/50">
                    <div>
                      <label className="block text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">
                        Event Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter event name..."
                        value={newEvent.name}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-orange-300 dark:border-orange-600 rounded-md bg-white/90 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 placeholder-orange-600 dark:placeholder-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">
                        Event Tag
                      </label>
                      <select
                        value={newEvent.tag}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, tag: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-orange-300 dark:border-orange-600 rounded-md bg-white/90 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="Past">Past</option>
                        <option value="Present">Present</option>
                        <option value="Future">Future</option>
                        <option value="Flashback">Flashback</option>
                        <option value="Flashforward">Flashforward</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">
                        Event Note
                      </label>
                      <input
                        type="text"
                        placeholder="Optional note about this event..."
                        value={newEvent.note}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-orange-300 dark:border-orange-600 rounded-md bg-white/90 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 placeholder-orange-600 dark:placeholder-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCreateEvent}
                        disabled={!newEvent.name.trim()}
                        className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Create Event
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewEvent({ name: '', tag: 'Present', note: '' });
                        }}
                        className="px-4 py-2 text-sm bg-white/80 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-600 rounded-md hover:bg-orange-100 dark:hover:bg-orange-800/70 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Show selected event details */}
      {selectedEvent && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedEvent.name}</span>
            <span className={`px-2 py-1 rounded-full ${
              selectedEvent.tag === 'Past' ? 'bg-amber-100 text-amber-800' :
              selectedEvent.tag === 'Present' ? 'bg-blue-100 text-blue-800' :
              selectedEvent.tag === 'Future' ? 'bg-green-100 text-green-800' :
              selectedEvent.tag === 'Flashback' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedEvent.tag}
            </span>
          </div>
          {selectedEvent.note && (
            <div className="text-gray-600 dark:text-gray-400 mt-1">{selectedEvent.note}</div>
          )}
        </div>
      )}
    </div>
  );
};

export const EnhancedCreateNodeModal: React.FC<EnhancedCreateNodeModalProps> = ({
  isVisible,
  modalData,
  onClose,
  onCreate,
  existingNode,
  availableNodes = []
}) => {
  // Tab and node type state
  const [activeTab, setActiveTab] = useState<'create' | 'select'>('create');
  const [selectedNodeType, setSelectedNodeType] = useState<NarrativeNode['type']>(
    existingNode?.type || modalData.nodeType || 'scene'
  );
  const [selectedLinkedNodes, setSelectedLinkedNodes] = useState<string[]>([]);
  const [showNodeTypeSelector] = useState(!existingNode && !modalData.parentId);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    status: 'not-completed' as 'not-completed' | 'in-progress' | 'completed',
    // Scene-specific fields
    characters: [] as string[],
    locations: [] as string[],
    objects: [] as string[],
    lore: [] as string[],
    timelineEvents: [] as string[],
    povCharacterId: '',
    // Character arc specific
    characterId: '',
    arcType: 'secondary' as 'main' | 'secondary' | 'background',
    emotionalJourney: [] as string[],
    // Location/Object/Lore arc specific
    locationId: '',
    objectId: '',
    loreId: ''
  });

  // Initialize form data
  useEffect(() => {
    if (existingNode) {
      const data = existingNode.data;
      setFormData({
        title: data.title,
        description: data.description,
        goal: data.goal,
        status: existingNode.status,
        characters: (data as any).characters || [],
        locations: (data as any).locations || [],
        objects: (data as any).objects || [],
        lore: (data as any).lore || [],
        timelineEvents: (data as any).timelineEvents || [],
        povCharacterId: (data as any).povCharacterId || '',
        characterId: (data as any).characterId || '',
        arcType: (data as any).arcType || 'secondary',
        emotionalJourney: (data as any).emotionalJourney || [],
        locationId: (data as any).locationId || '',
        objectId: (data as any).objectId || '',
        loreId: (data as any).loreId || ''
      });
      setSelectedNodeType(existingNode.type);
    } else {
      // Reset for new node
      const defaultTitle = getDefaultTitle(selectedNodeType);
      setFormData({
        title: defaultTitle,
        description: getDefaultDescription(selectedNodeType),
        goal: getDefaultGoal(selectedNodeType),
        status: 'not-completed',
        characters: [],
        locations: [],
        objects: [],
        lore: [],
        timelineEvents: [],
        povCharacterId: '',
        characterId: '',
        arcType: 'secondary',
        emotionalJourney: [],
        locationId: '',
        objectId: '',
        loreId: ''
      });
    }
  }, [existingNode, selectedNodeType, isVisible]);

  // Helper functions for default values
  const getDefaultTitle = (nodeType: NarrativeNode['type']) => {
    switch (nodeType) {
      case 'outline': return 'New Story Outline';
      case 'act': return 'New Act';
      case 'chapter': return 'New Chapter';
      case 'scene': return 'New Scene';
      case 'character-arc': return 'New Character Arc';
      case 'location-arc': return 'New Location Arc';
      case 'object-arc': return 'New Object Arc';
      case 'lore-arc': return 'New Lore Arc';
      default: return 'New Node';
    }
  };

  const getDefaultDescription = (nodeType: NarrativeNode['type']) => {
    switch (nodeType) {
      case 'outline': return 'The main story structure and flow...';
      case 'act': return 'This act focuses on...';
      case 'chapter': return 'In this chapter...';
      case 'scene': return 'This scene shows...';
      case 'character-arc': return 'Character development and journey...';
      case 'location-arc': return 'Location significance and changes...';
      case 'object-arc': return 'Object importance and role...';
      case 'lore-arc': return 'Lore revelation and impact...';
      default: return '';
    }
  };

  const getDefaultGoal = (nodeType: NarrativeNode['type']) => {
    switch (nodeType) {
      case 'scene': return 'What should this scene accomplish?';
      case 'chapter': return 'What should this chapter achieve?';
      default: return '';
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'select') {
      // Handle selecting existing nodes
      if (selectedLinkedNodes.length > 0) {
        onCreate({
          linkedNodeIds: selectedLinkedNodes
        } as any);
      }
    } else {
      // Handle creating new node
      let typeSpecificData: any = {
        title: formData.title,
        description: formData.description,
        goal: formData.goal
      };

      // Add type-specific data
      if (selectedNodeType === 'scene') {
        typeSpecificData.characters = formData.characters;
        typeSpecificData.locations = formData.locations;
        typeSpecificData.objects = formData.objects;
        typeSpecificData.lore = formData.lore;
        typeSpecificData.povCharacterId = formData.povCharacterId;
        typeSpecificData.timelineEvents = formData.timelineEvents;
      } else if (selectedNodeType === 'character-arc') {
        typeSpecificData.characterId = formData.characterId;
        typeSpecificData.arcType = formData.arcType;
        typeSpecificData.emotionalJourney = formData.emotionalJourney;
      } else if (selectedNodeType === 'location-arc') {
        typeSpecificData.locationId = formData.locationId;
      } else if (selectedNodeType === 'object-arc') {
        typeSpecificData.objectId = formData.objectId;
      } else if (selectedNodeType === 'lore-arc') {
        typeSpecificData.loreId = formData.loreId;
      }

      const nodeData: any = {
        type: selectedNodeType,
        status: formData.status,
        data: typeSpecificData,
        linkedNodeIds: selectedLinkedNodes
      };

      onCreate(nodeData);
    }
    onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 max-w-2xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-gray-700/50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {existingNode 
                  ? `Edit ${selectedNodeType === 'scene' ? 'Scene' : selectedNodeType === 'character-arc' ? 'Character Arc' : 'Node'}` 
                  : `Create ${selectedNodeType === 'scene' ? 'Scene' : selectedNodeType === 'character-arc' ? 'Character Arc' : 'Node'}`
                }
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {activeTab === 'select' 
                  ? 'Select existing nodes to link with this node'
                  : selectedNodeType === 'scene' 
                    ? 'Configure scene details, characters, and world elements'
                    : selectedNodeType === 'character-arc'
                      ? 'Set up character development and journey'
                      : 'Set up your narrative node details'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Tabs for Create vs Select Existing */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'create'
                      ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Create New
                </button>
                <button
                  onClick={() => setActiveTab('select')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'select'
                      ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Select Existing
                </button>
              </div>

              {activeTab === 'create' ? (
                <>
                  {/* Node Type Selection */}
                  {showNodeTypeSelector && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Node Type
                      </label>
                      <select
                        value={selectedNodeType}
                        onChange={(e) => setSelectedNodeType(e.target.value as NarrativeNode['type'])}
                        className="w-full p-3 bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200"
                      >
                        <option value="outline">Story Outline</option>
                        <option value="act">Act</option>
                        <option value="chapter">Chapter</option>
                        <option value="scene">Scene</option>
                        <option value="character-arc">Character Arc</option>
                        <option value="location-arc">Location Arc</option>
                        <option value="object-arc">Object Arc</option>
                        <option value="lore-arc">Lore Arc</option>
                      </select>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Basic Information
                    </h3>
                    
                    <FormInput
                      label="Title"
                      value={formData.title}
                      onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
                      placeholder="Enter title..."
                    />

                    <FormInput
                      label="Description"
                      value={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      placeholder="Describe this node..."
                      multiline
                    />

                    {(selectedNodeType === 'scene' || selectedNodeType === 'chapter') && (
                      <FormInput
                        label="Goal"
                        value={formData.goal}
                        onChange={(value) => setFormData(prev => ({ ...prev, goal: value }))}
                        placeholder={`What should this ${selectedNodeType} achieve?`}
                      />
                    )}
                  </div>

                  {/* Type-specific fields */}
                  {selectedNodeType === 'scene' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Scene Elements
                      </h3>

                      <MultiSelectDropdown
                        label="Point of View Character"
                        items={mockData.characters}
                        selectedIds={formData.povCharacterId ? [formData.povCharacterId] : []}
                        onSelectionChange={(ids) => setFormData(prev => ({ ...prev, povCharacterId: ids[0] || '' }))}
                        displayField="name"
                        searchPlaceholder="Search characters..."
                        singleSelect
                      />

                      <MultiSelectDropdown
                        label="Characters"
                        items={mockData.characters}
                        selectedIds={formData.characters}
                        onSelectionChange={(ids) => setFormData(prev => ({ ...prev, characters: ids }))}
                        displayField="name"
                        searchPlaceholder="Search characters..."
                      />

                      <MultiSelectDropdown
                        label="Locations"
                        items={mockData.locations}
                        selectedIds={formData.locations}
                        onSelectionChange={(ids) => setFormData(prev => ({ ...prev, locations: ids }))}
                        displayField="name"
                        searchPlaceholder="Search locations..."
                      />

                      <MultiSelectDropdown
                        label="Objects"
                        items={mockData.objects}
                        selectedIds={formData.objects}
                        onSelectionChange={(ids) => setFormData(prev => ({ ...prev, objects: ids }))}
                        displayField="name"
                        searchPlaceholder="Search objects..."
                      />

                      <MultiSelectDropdown
                        label="Lore"
                        items={mockData.lore}
                        selectedIds={formData.lore}
                        onSelectionChange={(ids) => setFormData(prev => ({ ...prev, lore: ids }))}
                        displayField="name"
                        searchPlaceholder="Search lore..."
                      />

                      {/* Timeline Event (Single Selection with Create Option) */}
                      <TimelineEventSelector
                        selectedTimelineEvent={formData.timelineEvents[0] || ''}
                        onTimelineEventChange={(eventId) => setFormData(prev => ({ 
                          ...prev, 
                          timelineEvents: eventId ? [eventId] : [] 
                        }))}
                        availableEvents={mockData.timelineEvents}
                      />
                    </div>
                  )}

                  {selectedNodeType === 'character-arc' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Character Arc Details
                      </h3>

                      <MultiSelectDropdown
                        label="Character"
                        items={mockData.characters}
                        selectedIds={formData.characterId ? [formData.characterId] : []}
                        onSelectionChange={(ids) => setFormData(prev => ({ ...prev, characterId: ids[0] || '' }))}
                        displayField="name"
                        searchPlaceholder="Search characters..."
                        singleSelect
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Arc Type
                        </label>
                        <select
                          value={formData.arcType}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            arcType: e.target.value as 'main' | 'secondary' | 'background' 
                          }))}
                          className="w-full p-3 bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200"
                        >
                          <option value="main">Main Character</option>
                          <option value="secondary">Secondary Character</option>
                          <option value="background">Background Character</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedNodeType === 'location-arc' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Location Arc Details
                      </h3>

                      <MultiSelectDropdown
                        label="Location"
                        items={mockData.locations}
                        selectedIds={formData.locationId ? [formData.locationId] : []}
                        onSelectionChange={(ids) => setFormData(prev => ({ ...prev, locationId: ids[0] || '' }))}
                        displayField="name"
                        searchPlaceholder="Search locations..."
                        singleSelect
                      />
                    </div>
                  )}

                  {selectedNodeType === 'object-arc' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Object Arc Details
                      </h3>

                      <MultiSelectDropdown
                        label="Object"
                        items={mockData.objects}
                        selectedIds={formData.objectId ? [formData.objectId] : []}
                        onSelectionChange={(ids) => setFormData(prev => ({ ...prev, objectId: ids[0] || '' }))}
                        displayField="name"
                        searchPlaceholder="Search objects..."
                        singleSelect
                      />
                    </div>
                  )}

                  {selectedNodeType === 'lore-arc' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Lore Arc Details
                      </h3>

                      <MultiSelectDropdown
                        label="Lore"
                        items={mockData.lore}
                        selectedIds={formData.loreId ? [formData.loreId] : []}
                        onSelectionChange={(ids) => setFormData(prev => ({ ...prev, loreId: ids[0] || '' }))}
                        displayField="name"
                        searchPlaceholder="Search lore..."
                        singleSelect
                      />
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        status: e.target.value as 'not-completed' | 'in-progress' | 'completed' 
                      }))}
                      className="w-full p-3 bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200"
                    >
                      <option value="not-completed">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </>
              ) : (
                /* Select Existing Tab */
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Select Existing Nodes
                  </h3>
                  
                  {availableNodes.length > 0 ? (
                    <MultiSelectDropdown
                      label="Available Nodes"
                      items={availableNodes.map(node => ({
                        id: node.id,
                        name: node.data?.title || 'Untitled Node',
                        type: node.type
                      }))}
                      selectedIds={selectedLinkedNodes}
                      onSelectionChange={setSelectedLinkedNodes}
                      displayField="name"
                      searchPlaceholder="Search existing nodes..."
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No existing nodes available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/20 dark:border-gray-700/50">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-700/70 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {activeTab === 'select' 
                ? 'Link Nodes' 
                : existingNode 
                  ? `Update ${selectedNodeType === 'scene' ? 'Scene' : 'Node'}` 
                  : `Create ${selectedNodeType === 'scene' ? 'Scene' : 'Node'}`
              }
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
