import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { NarrativeNode, CreateNodeModalData } from '../../../../../types/narrative-layout';

interface CreateNodeModalProps {
  isVisible: boolean;
  modalData: CreateNodeModalData;
  onClose: () => void;
  onCreate: (nodeData: Partial<NarrativeNode>) => void;
  existingNode?: NarrativeNode | null;
  theme: 'light' | 'dark';
  availableNodes?: NarrativeNode[];
}

// Mock data - replace with actual data from your context
const mockBooks = [
  {
    id: 'book1',
    title: 'The Shadow Realm',
    versions: [
      {
        id: 'v1',
        name: 'First Draft',
        characters: [
          { id: 'char1', name: 'Aria Blackthorne', role: 'protagonist' },
          { id: 'char2', name: 'Marcus Steel', role: 'deuteragonist' },
          { id: 'char3', name: 'The Shadow King', role: 'antagonist' },
          { id: 'char4', name: 'Elena Brightwater', role: 'supporting' },
          { id: 'char5', name: 'Tobias the Wise', role: 'mentor' }
        ],
        worlds: [
          {
            id: 'world1',
            name: 'Aethermoor',
            locations: [
              { id: 'loc1', name: 'Crystal Caverns', type: 'dungeon' },
              { id: 'loc2', name: 'Skyhold Academy', type: 'academy' },
              { id: 'loc3', name: 'The Whispering Woods', type: 'forest' }
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
            ]
          },
          {
            id: 'world2',
            name: 'The Shadowlands',
            locations: [
              { id: 'loc4', name: 'Fortress of Despair', type: 'stronghold' },
              { id: 'loc5', name: 'The Void Gates', type: 'portal' }
            ],
            objects: [
              { id: 'obj4', name: 'Crown of Shadows', type: 'relic' },
              { id: 'obj5', name: 'Soul Reaper Blade', type: 'cursed_weapon' }
            ],
            lore: [
              { id: 'lore4', name: 'The Shadow Pact', type: 'ancient_agreement' },
              { id: 'lore5', name: 'Cult of the Void', type: 'dark_organization' }
            ]
          }
        ]
      }
    ]
  }
];

export const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isVisible,
  modalData,
  onClose,
  onCreate,
  existingNode,
  availableNodes = []
}) => {
  const [selectedNodeType, setSelectedNodeType] = useState<NarrativeNode['type']>(modalData.nodeType);
  const [selectedLinkedNodes, setSelectedLinkedNodes] = useState<string[]>([]);
  const [showNodeTypeSelector] = useState(!existingNode && !modalData.parentId);
  const [activeTab, setActiveTab] = useState<'create' | 'select'>('create');
  
  // Search states
  const [characterSearch, setCharacterSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [objectSearch, setObjectSearch] = useState('');
  const [loreSearch, setLoreSearch] = useState('');
  const [nodeSearch, setNodeSearch] = useState('');

  // Dropdown states
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showObjectDropdown, setShowObjectDropdown] = useState(false);
  const [showLoreDropdown, setShowLoreDropdown] = useState(false);
  const [showPovDropdown, setShowPovDropdown] = useState(false);
  const [showNodeDropdown, setShowNodeDropdown] = useState(false);

  // Get mock data (replace with actual context data)
  const currentBook = mockBooks[0];
  const currentVersion = currentBook.versions[0];
  
  // Get available data
  const availableCharacters = currentVersion.characters;
  const allLocations = currentVersion.worlds.flatMap(world => 
    world.locations.map(loc => ({ ...loc, worldName: world.name }))
  );
  const allObjects = currentVersion.worlds.flatMap(world => 
    world.objects.map(obj => ({ ...obj, worldName: world.name }))
  );
  const allLore = currentVersion.worlds.flatMap(world => 
    world.lore.map(lore => ({ ...lore, worldName: world.name }))
  );
  
  // Filter based on search
  const filteredCharacters = availableCharacters.filter(char => 
    char.name.toLowerCase().includes(characterSearch.toLowerCase())
  );
  
  const filteredLocations = allLocations.filter(loc => 
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.worldName.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredObjects = allObjects.filter(obj => 
    obj.name.toLowerCase().includes(objectSearch.toLowerCase()) ||
    obj.worldName.toLowerCase().includes(objectSearch.toLowerCase())
  );

  const filteredLore = allLore.filter(lore => 
    lore.name.toLowerCase().includes(loreSearch.toLowerCase()) ||
    lore.worldName.toLowerCase().includes(loreSearch.toLowerCase())
  );

  const filteredNodes = availableNodes.filter(node => 
    node.data?.title?.toLowerCase().includes(nodeSearch.toLowerCase()) ||
    node.data?.description?.toLowerCase().includes(nodeSearch.toLowerCase())
  ).map(node => ({
    id: node.id,
    name: node.data?.title || 'Untitled Node',
    type: node.type,
    title: node.data?.title || 'Untitled Node'
  }));

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
    povCharacterId: '', // Primary POV character for the scene
    // Character arc specific
    characterId: '',
    arcType: 'secondary' as 'main' | 'secondary' | 'background',
    emotionalJourney: [] as string[],
    // Location/Object/Lore arc specific
    locationId: '',
    objectId: '',
    loreId: ''
  });

  // Initialize form with existing node data if editing
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
        povCharacterId: (data as any).povCharacterId || '',
        characterId: (data as any).characterId || '',
        arcType: (data as any).arcType || 'secondary',
        emotionalJourney: (data as any).emotionalJourney || [],
        locationId: (data as any).locationId || '',
        objectId: (data as any).objectId || '',
        loreId: (data as any).loreId || ''
      });
    } else {
      // Reset form for new node
      setFormData({
        title: getDefaultTitle(modalData.nodeType),
        description: getDefaultDescription(modalData.nodeType),
        goal: getDefaultGoal(modalData.nodeType),
        status: 'not-completed',
        characters: [],
        locations: [],
        objects: [],
        lore: [],
        povCharacterId: '',
        characterId: '',
        arcType: 'secondary',
        emotionalJourney: [],
        locationId: '',
        objectId: '',
        loreId: ''
      });
    }
  }, [existingNode, modalData.nodeType, isVisible]);

  const getDefaultTitle = (nodeType: NarrativeNode['type']): string => {
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

  const getDefaultDescription = (nodeType: NarrativeNode['type']): string => {
    switch (nodeType) {
      case 'outline': return 'Define the overall story structure and themes';
      case 'act': return 'Describe this act\'s role in the story progression';
      case 'chapter': return 'Outline the events and developments in this chapter';
      case 'scene': return 'Detail the specific events and interactions in this scene';
      case 'character-arc': return 'Describe the character\'s growth and transformation';
      case 'location-arc': return 'Explain the location\'s significance to the story';
      case 'object-arc': return 'Define the object\'s importance and role';
      case 'lore-arc': return 'Detail the lore element\'s connection to the narrative';
      default: return 'Click to edit this node...';
    }
  };

  const getDefaultGoal = (nodeType: NarrativeNode['type']): string => {
    switch (nodeType) {
      case 'outline': return 'Tell a complete and engaging story';
      case 'act': return 'Advance the overall story arc';
      case 'chapter': return 'Achieve specific chapter objectives';
      case 'scene': return 'Accomplish scene-specific purpose';
      case 'character-arc': return 'Complete character development';
      case 'location-arc': return 'Establish location significance';
      case 'object-arc': return 'Define object importance';
      case 'lore-arc': return 'Expand world understanding';
      default: return 'Achieve node objectives';
    }
  };

  // Node type options as dropdown instead of icons
  const nodeTypeOptions = [
    { value: 'outline', label: 'Outline', description: 'Overall story structure' },
    { value: 'act', label: 'Act', description: 'Story progression section' },
    { value: 'chapter', label: 'Chapter', description: 'Chapter or major scene group' },
    { value: 'scene', label: 'Scene', description: 'Individual scene or event' },
    { value: 'character-arc', label: 'Character Arc', description: 'Character development journey' },
    { value: 'location-arc', label: 'Location Arc', description: 'Location-based storyline' },
    { value: 'object-arc', label: 'Object Arc', description: 'Object-centered plot thread' },
    { value: 'lore-arc', label: 'Lore Arc', description: 'World-building narrative thread' }
  ];

  // Helper functions for multi-select
  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleSubmit = () => {
    // Create the node data based on type
    const baseData = {
      title: formData.title,
      description: formData.description,
      goal: formData.goal
    };

    // Add type-specific data
    const typeSpecificData: any = { ...baseData };
    
    if (selectedNodeType === 'scene') {
      typeSpecificData.characters = formData.characters;
      typeSpecificData.locations = formData.locations;
      typeSpecificData.objects = formData.objects;
      typeSpecificData.lore = formData.lore;
      typeSpecificData.povCharacterId = formData.povCharacterId;
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

    onCreate({
      type: selectedNodeType,
      status: formData.status,
      data: typeSpecificData,
      linkedNodeIds: selectedLinkedNodes
    });
    
    onClose();
  };

  // Define interface for dropdown items
  interface DropdownItem {
    id: string;
    name: string;
    role?: string;
    type?: string;
    worldName?: string;
    [key: string]: any;
  }

  // Render searchable dropdown component
  const SearchableDropdown: React.FC<{
    title: string;
    items: DropdownItem[];
    selectedItems: string[];
    onToggleItem: (id: string) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    displayField: string;
    isOpen: boolean;
    onToggleOpen: () => void;
    multiSelect?: boolean;
    groupByField?: string;
  }> = ({ 
    title, 
    items, 
    selectedItems, 
    onToggleItem, 
    searchValue, 
    onSearchChange,
    displayField,
    isOpen,
    onToggleOpen,
    multiSelect = true,
    groupByField
  }) => {
    // Group items if groupByField is provided
    const groupedItems = groupByField 
      ? items.reduce((groups, item) => {
          const groupKey = item[groupByField] || 'Other';
          if (!groups[groupKey]) groups[groupKey] = [];
          groups[groupKey].push(item);
          return groups;
        }, {} as Record<string, DropdownItem[]>)
      : { 'All': items };

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </label>
        <div 
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer flex items-center justify-between"
          onClick={onToggleOpen}
        >
          <span className="text-gray-700 dark:text-gray-300">
            {selectedItems.length > 0 
              ? multiSelect 
                ? `${selectedItems.length} selected`
                : items.find(item => item.id === selectedItems[0])?.[displayField] || 'Selected'
              : `Select ${title.toLowerCase()}...`
            }
          </span>
          <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={`Search ${title.toLowerCase()}...`}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                <div key={groupName}>
                  {groupByField && (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {groupName}
                      </span>
                    </div>
                  )}
                  {groupItems.map((item: DropdownItem) => (
                    <div
                      key={item.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                        selectedItems.includes(item.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                      onClick={() => onToggleItem(item.id)}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item[displayField]}
                        </div>
                        {item.role && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.role}
                          </div>
                        )}
                        {item.type && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.type}
                          </div>
                        )}
                      </div>
                      {selectedItems.includes(item.id) && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {items.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No {title.toLowerCase()} found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {existingNode ? 'Edit Node' : 'Create New Node'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Tabs for Create vs Select Existing */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Create New Node
              </button>
              <button
                onClick={() => setActiveTab('select')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'select'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Link Existing Node
              </button>
            </div>

            {activeTab === 'create' ? (
              <div className="space-y-6">
                {/* Node Type Selector (only if not editing and no parent) */}
                {showNodeTypeSelector && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Node Type
                    </label>
                    <select
                      value={selectedNodeType}
                      onChange={(e) => setSelectedNodeType(e.target.value as NarrativeNode['type'])}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {nodeTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Basic Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Enter node title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Describe what happens in this node..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Goal
                  </label>
                  <input
                    type="text"
                    value={formData.goal}
                    onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="What should this node achieve?"
                  />
                </div>

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
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="not-completed">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Type-specific fields */}
                {selectedNodeType === 'scene' && (
                  <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Scene Details</h3>
                    
                    {/* Primary POV Character */}
                    <SearchableDropdown
                      title="Primary POV Character"
                      items={filteredCharacters}
                      selectedItems={formData.povCharacterId ? [formData.povCharacterId] : []}
                      onToggleItem={(id) => setFormData(prev => ({ ...prev, povCharacterId: id }))}
                      searchValue={characterSearch}
                      onSearchChange={setCharacterSearch}
                      displayField="name"
                      isOpen={showPovDropdown}
                      onToggleOpen={() => setShowPovDropdown(!showPovDropdown)}
                      multiSelect={false}
                    />

                    {/* Characters */}
                    <SearchableDropdown
                      title="Characters"
                      items={filteredCharacters}
                      selectedItems={formData.characters}
                      onToggleItem={(id) => setFormData(prev => ({ 
                        ...prev, 
                        characters: toggleArrayItem(prev.characters, id) 
                      }))}
                      searchValue={characterSearch}
                      onSearchChange={setCharacterSearch}
                      displayField="name"
                      isOpen={showCharacterDropdown}
                      onToggleOpen={() => setShowCharacterDropdown(!showCharacterDropdown)}
                    />

                    {/* Locations */}
                    <SearchableDropdown
                      title="Locations"
                      items={filteredLocations}
                      selectedItems={formData.locations}
                      onToggleItem={(id) => setFormData(prev => ({ 
                        ...prev, 
                        locations: toggleArrayItem(prev.locations, id) 
                      }))}
                      searchValue={locationSearch}
                      onSearchChange={setLocationSearch}
                      displayField="name"
                      isOpen={showLocationDropdown}
                      onToggleOpen={() => setShowLocationDropdown(!showLocationDropdown)}
                      groupByField="worldName"
                    />

                    {/* Objects */}
                    <SearchableDropdown
                      title="Objects"
                      items={filteredObjects}
                      selectedItems={formData.objects}
                      onToggleItem={(id) => setFormData(prev => ({ 
                        ...prev, 
                        objects: toggleArrayItem(prev.objects, id) 
                      }))}
                      searchValue={objectSearch}
                      onSearchChange={setObjectSearch}
                      displayField="name"
                      isOpen={showObjectDropdown}
                      onToggleOpen={() => setShowObjectDropdown(!showObjectDropdown)}
                      groupByField="worldName"
                    />

                    {/* Lore */}
                    <SearchableDropdown
                      title="Lore"
                      items={filteredLore}
                      selectedItems={formData.lore}
                      onToggleItem={(id) => setFormData(prev => ({ 
                        ...prev, 
                        lore: toggleArrayItem(prev.lore, id) 
                      }))}
                      searchValue={loreSearch}
                      onSearchChange={setLoreSearch}
                      displayField="name"
                      isOpen={showLoreDropdown}
                      onToggleOpen={() => setShowLoreDropdown(!showLoreDropdown)}
                      groupByField="worldName"
                    />
                  </div>
                )}

                {selectedNodeType === 'character-arc' && (
                  <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Character Arc Details</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Character
                      </label>
                      <select
                        value={formData.characterId}
                        onChange={(e) => setFormData(prev => ({ ...prev, characterId: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select character...</option>
                        {availableCharacters.map(char => (
                          <option key={char.id} value={char.id}>
                            {char.name} ({char.role})
                          </option>
                        ))}
                      </select>
                    </div>

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
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="main">Main Arc</option>
                        <option value="secondary">Secondary Arc</option>
                        <option value="background">Background Arc</option>
                      </select>
                    </div>
                  </div>
                )}

                {(selectedNodeType === 'location-arc' || selectedNodeType === 'object-arc' || selectedNodeType === 'lore-arc') && (
                  <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedNodeType === 'location-arc' ? 'Location' : 
                       selectedNodeType === 'object-arc' ? 'Object' : 'Lore'} Arc Details
                    </h3>
                    
                    {selectedNodeType === 'location-arc' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location
                        </label>
                        <select
                          value={formData.locationId}
                          onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Select location...</option>
                          {allLocations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} ({loc.worldName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedNodeType === 'object-arc' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Object
                        </label>
                        <select
                          value={formData.objectId}
                          onChange={(e) => setFormData(prev => ({ ...prev, objectId: e.target.value }))}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Select object...</option>
                          {allObjects.map(obj => (
                            <option key={obj.id} value={obj.id}>
                              {obj.name} ({obj.worldName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedNodeType === 'lore-arc' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Lore
                        </label>
                        <select
                          value={formData.loreId}
                          onChange={(e) => setFormData(prev => ({ ...prev, loreId: e.target.value }))}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Select lore...</option>
                          {allLore.map(lore => (
                            <option key={lore.id} value={lore.id}>
                              {lore.name} ({lore.worldName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Link to Existing Node
                </h3>
                <SearchableDropdown
                  title="Existing Nodes"
                  items={filteredNodes}
                  selectedItems={selectedLinkedNodes}
                  onToggleItem={(id) => setSelectedLinkedNodes(prev => toggleArrayItem(prev, id))}
                  searchValue={nodeSearch}
                  onSearchChange={setNodeSearch}
                  displayField="name"
                  isOpen={showNodeDropdown}
                  onToggleOpen={() => setShowNodeDropdown(!showNodeDropdown)}
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleSubmit}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {existingNode ? 'Update Node' : 'Create Node'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
