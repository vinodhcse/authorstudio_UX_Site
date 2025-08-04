import React, { useState, useContext, createContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, Theme } from '../../types';
import { 
  PersonIcon, 
  MirrorIcon, 
  BrainIcon, 
  ScrollIcon, 
  ZapIcon, 
  UsersIcon, 
  AwardIcon, 
  FileTextIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  HeartIcon,
  TrophyIcon,
  CheckCircleIcon,
  RefreshIcon,
  TrashIcon,
  PlusIcon
} from '../../constants';
import { listen } from '@tauri-apps/api/event';

interface CharacterProfileBuilderProps {
  books: Book[];
   theme: Theme;
   setTheme: (theme: Theme) => void;
}

// Character Profile Data Structure
interface CharacterProfile {
  // Identity & Basics
  fullName: string;
  aliases: string[];
  gender: string;
  pronouns: string;
  age: number;
  race: string;
  occupation: string;
  citizenship: string;
  lifestyle: string;
  characterRole: 'Protagonist' | 'Antagonist' | 'Both';
  characterType: 'Primary' | 'Secondary' | 'Tertiary';

  // Appearance & Physical Description
  height: string;
  weight: string;
  build: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  eyeShape: string;
  faceShape: string;
  vision: string;
  distinguishingFeatures: string[];
  accessories: string[];
  health: string;
  clothingStyle: string;
  mannerisms: string[];
  physicalQuirks: string[];
  disabilities: string;

  // Personality & Psychology
  traits: string[];
  goals: string[];
  beliefs: string[];
  strengths: string[];
  weaknesses: string[];
  motto: string;
  fears: string[];
  internalConflicts: string[];
  externalConflicts: string[];
  dialogueQuirks: string[];
  personality: 'Introvert' | 'Extrovert' | 'Ambivert';
  dominantTrait: 'Confident' | 'Emotional' | 'Logical';
  selfPerception: string;
  othersPerception: string;
  mentalHealth: string;
  copingStyles: { [key: string]: string };
  secrets: string[];

  // Backstory & History
  birthplace: string;
  childhood: string;
  family: { [key: string]: string };
  education: string;
  majorEvents: string[];
  achievements: string[];
  failures: string[];
  romanticHistory: string;
  reputation: string;
  spiritualBeliefs: string;

  // Skills & Abilities
  weaponsMastery: { [key: string]: number };
  magicAbilities: { type: string; school: string; strength: number }[];
  specialTalents: { [key: string]: number };
  limitations: string[];
  signatureMove: string;

  // Relationships & Social Dynamics
  relationships: {
    name: string;
    type: string;
    role: 'Good' | 'Bad' | 'Complex';
    description: string;
  }[];
  groupAffiliations: string[];
  rivalries: string[];
  influence: string;

  // Greatest Feats & Preferences
  greatestFeat: string;
  favoriteActivities: string[];
  mostValued: string[];
  mostHated: string[];
}

// Context for Character Profile State
const CharacterProfileContext = createContext<{
  profile: CharacterProfile;
  updateProfile: (updates: Partial<CharacterProfile>) => void;
}>({
  profile: {} as CharacterProfile,
  updateProfile: () => {}
});

// Initial empty profile
const initialProfile: CharacterProfile = {
  fullName: '',
  aliases: [],
  gender: '',
  pronouns: '',
  age: 25,
  race: '',
  occupation: '',
  citizenship: '',
  lifestyle: '',
  characterRole: 'Protagonist',
  characterType: 'Primary',
  height: '',
  weight: '',
  build: '',
  hairColor: '',
  hairStyle: '',
  eyeColor: '',
  eyeShape: '',
  faceShape: '',
  vision: '',
  distinguishingFeatures: [],
  accessories: [],
  health: '',
  clothingStyle: '',
  mannerisms: [],
  physicalQuirks: [],
  disabilities: '',
  traits: [],
  goals: [],
  beliefs: [],
  strengths: [],
  weaknesses: [],
  motto: '',
  fears: [],
  internalConflicts: [],
  externalConflicts: [],
  dialogueQuirks: [],
  personality: 'Ambivert',
  dominantTrait: 'Logical',
  selfPerception: '',
  othersPerception: '',
  mentalHealth: '',
  copingStyles: {},
  secrets: [],
  birthplace: '',
  childhood: '',
  family: {},
  education: '',
  majorEvents: [],
  achievements: [],
  failures: [],
  romanticHistory: '',
  reputation: '',
  spiritualBeliefs: '',
  weaponsMastery: {},
  magicAbilities: [],
  specialTalents: {},
  limitations: [],
  signatureMove: '',
  relationships: [],
  groupAffiliations: [],
  rivalries: [],
  influence: '',
  greatestFeat: '',
  favoriteActivities: [],
  mostValued: [],
  mostHated: []
};

// Tab Configuration
const tabs = [
  { id: 'identity', label: 'Identity & Basics', icon: PersonIcon },
  { id: 'appearance', label: 'Appearance', icon: MirrorIcon },
  { id: 'personality', label: 'Personality', icon: BrainIcon },
  { id: 'backstory', label: 'Backstory', icon: ScrollIcon },
  { id: 'skills', label: 'Skills & Abilities', icon: ZapIcon },
  { id: 'relationships', label: 'Relationships', icon: UsersIcon },
  { id: 'feats', label: 'Feats & Preferences', icon: AwardIcon },
  { id: 'summary', label: 'Summary', icon: FileTextIcon }
];

// AI Helper Bar Component
const AIHelperBar: React.FC<{ 
  placeholder: string; 
  onGenerate: (prompt: string) => void;
  isGenerating?: boolean;
}> = ({ placeholder, onGenerate, isGenerating = false }) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt.trim());
      setPrompt('');
    }
  };

   

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50 mb-6"
    >
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder={placeholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            className="w-full px-4 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-800/80 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              Generating...
            </div>
          ) : (
            'Generate With AI'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

const CharacterProfileBuilder: React.FC<CharacterProfileBuilderProps> = ({ books, theme, setTheme }) => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('identity');
  const [profile, setProfile] = useState<CharacterProfile>(initialProfile);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visibleTabsStart, setVisibleTabsStart] = useState(0);

  const book = books.find(b => b.id === bookId);
  const maxVisibleTabs = 4; // Show 4 tabs at a time

  const updateProfile = (updates: Partial<CharacterProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const handleAIGeneration = async (tabId: string, prompt: string) => {
    setIsGenerating(true);
    // Simulate AI generation based on prompt and tab
    setTimeout(() => {
      // Mock AI responses based on tab and prompt context
      switch (tabId) {
        case 'identity':
          if (prompt.toLowerCase().includes('assassin') || prompt.toLowerCase().includes('rogue')) {
            updateProfile({
              fullName: 'Lyra Shadowmere',
              aliases: ['The Night Whisper', 'Shadow'],
              gender: 'Female',
              pronouns: 'She/Her',
              age: 32,
              race: 'Half-Elf',
              occupation: 'Guild Assassin',
              citizenship: 'Free City of Westmarch',
              lifestyle: 'Lives in the shadows, moving between safe houses',
              characterRole: 'Antagonist',
              characterType: 'Primary'
            });
          } else if (prompt.toLowerCase().includes('wizard') || prompt.toLowerCase().includes('mage')) {
            updateProfile({
              fullName: 'Aldric Starweaver',
              aliases: ['The Sage', 'Starweaver'],
              gender: 'Male',
              pronouns: 'He/Him',
              age: 45,
              race: 'Human',
              occupation: 'Court Wizard',
              citizenship: 'Kingdom of Aethermoor',
              lifestyle: 'Scholarly, spends time in towers and libraries',
              characterRole: 'Protagonist',
              characterType: 'Primary'
            });
          } else {
            updateProfile({
              fullName: 'Kira Ironheart',
              aliases: ['The Defender'],
              gender: 'Female',
              pronouns: 'She/Her',
              age: 28,
              race: 'Human',
              occupation: 'Knight-Errant',
              citizenship: 'Highland Clans',
              lifestyle: 'Travels constantly, seeking justice',
              characterRole: 'Protagonist',
              characterType: 'Primary'
            });
          }
          break;
          
        case 'appearance':
          updateProfile({
            height: '5\'8"',
            weight: '145 lbs',
            build: 'Athletic',
            hairColor: 'Auburn',
            hairStyle: 'Long, often braided',
            eyeColor: 'Emerald Green',
            eyeShape: 'Almond',
            faceShape: 'Oval',
            vision: 'Perfect',
            distinguishingFeatures: ['Small scar above left eyebrow', 'Intricate tattoo on right shoulder'],
            accessories: ['Silver pendant', 'Leather bracers'],
            health: 'Excellent physical condition',
            clothingStyle: 'Practical leathers and cloaks',
            mannerisms: ['Unconsciously touches sword hilt when nervous', 'Stands with perfect posture'],
            physicalQuirks: ['Left-handed', 'Drumming fingers when thinking'],
            disabilities: ''
          });
          break;
          
        case 'personality':
          updateProfile({
            personality: 'Introvert',
            dominantTrait: 'Logical',
            traits: ['Brave', 'Cautious', 'Loyal', 'Patient', 'Honest'],
            goals: ['Protect the innocent', 'Master her combat skills', 'Find her missing brother'],
            beliefs: ['Justice must be served', 'Strength protects the weak', 'Honor above all'],
            strengths: ['Unwavering determination', 'Strategic thinking', 'Inspiring leader'],
            weaknesses: ['Trusts too easily', 'Struggles with magic', 'Haunted by past failures'],
            motto: 'Shield the innocent, strike down evil',
            fears: ['Failing those who depend on her', 'Dark magic', 'Being alone'],
            internalConflicts: ['Balancing justice with mercy', 'Dealing with survivor\'s guilt'],
            externalConflicts: ['Fighting corrupt nobles', 'Battling dark forces'],
            dialogueQuirks: ['Speaks formally', 'Often quotes old proverbs'],
            selfPerception: 'A flawed but determined protector',
            othersPerception: 'A noble hero with an unbreakable spirit',
            mentalHealth: 'Generally stable, occasional nightmares',
            copingStyles: {
              'Loss': 'Throws herself into training',
              'Anger': 'Meditates and practices swordwork',
              'Change': 'Adapts quickly but needs time to process',
              'Stress': 'Seeks solitude in nature'
            },
            secrets: ['Blames herself for her mentor\'s death', 'Secretly fears she\'s not strong enough']
          });
          break;
          
        case 'backstory':
          updateProfile({
            birthplace: 'Mountain village of Ironhold',
            childhood: 'Raised by blacksmith parents, showed early aptitude for combat',
            family: {
              'Mother': 'Elena Ironheart - Village blacksmith',
              'Father': 'Marcus Ironheart - Retired soldier',
              'Sibling': 'Thomas Ironheart - Missing brother, last seen heading to capital'
            },
            education: 'Trained by Sir Gareth, a former knight. Self-taught in strategy and tactics.',
            majorEvents: [
              'Village attacked by bandits at age 16',
              'Mentor Sir Gareth killed protecting refugees',
              'Brother disappeared during diplomatic mission',
              'Knighted after saving the royal heir'
            ],
            achievements: ['Defeated the Crimson Bandit leader', 'Saved the royal heir from assassins'],
            failures: ['Failed to save her mentor', 'Lost track of her brother'],
            romanticHistory: 'Brief relationship with fellow knight, ended when duty called',
            reputation: 'Known throughout the realm as an honorable warrior',
            spiritualBeliefs: 'Follows the old gods of justice and protection'
          });
          break;
          
        case 'skills':
          updateProfile({
            weaponsMastery: {
              'Sword': 9,
              'Shield': 8,
              'Bow': 6,
              'Dagger': 7
            },
            magicAbilities: [
              { type: 'Divine Protection', school: 'Divine', strength: 5 },
              { type: 'Healing Light', school: 'Divine', strength: 4 }
            ],
            specialTalents: {
              'Leadership': 8,
              'Athletics': 9,
              'Investigation': 7,
              'Intimidation': 6
            },
            limitations: ['Cannot use arcane magic', 'Vulnerable to dark magic', 'Limited ranged combat'],
            signatureMove: 'Radiant Strike - A sword technique blessed with divine light that can cut through dark magic'
          });
          break;
          
        case 'relationships':
          updateProfile({
            relationships: [
              {
                name: 'Sir Gareth',
                type: 'Mentor',
                role: 'Good',
                description: 'Deceased mentor who taught her everything about being a knight. Still guides her in spirit.'
              },
              {
                name: 'Thomas Ironheart',
                type: 'Family',
                role: 'Good',
                description: 'Missing younger brother. Diplomatic and clever, disappeared on a secret mission.'
              },
              {
                name: 'Captain Vex',
                type: 'Rival',
                role: 'Complex',
                description: 'Former ally turned mercenary. They respect each other but disagree on methods.'
              }
            ],
            groupAffiliations: ['Order of the Silver Shield', 'Highland Clan Alliance'],
            rivalries: ['Captain Vex', 'The Shadow Guild'],
            influence: 'Respected among knights and common folk. Has the ear of several nobles.'
          });
          break;
          
        case 'feats':
          updateProfile({
            greatestFeat: 'Single-handedly held off a dragon while evacuating an entire village, earning the title "Dragon\'s Bane" despite not killing the beast.',
            favoriteActivities: ['Training at dawn', 'Reading tactical manuals', 'Woodworking', 'Stargazing'],
            mostValued: ['Her father\'s sword', 'Sir Gareth\'s teachings', 'The trust of the innocent', 'Family honor'],
            mostHated: ['Corruption and injustice', 'Those who prey on the weak', 'Dark magic', 'Cowardice in leaders']
          });
          break;
      }
      setIsGenerating(false);
    }, 2000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identity':
        return <IdentityTab />;
      case 'appearance':
        return <AppearanceTab />;
      case 'personality':
        return <PersonalityTab />;
      case 'backstory':
        return <BackstoryTab />;
      case 'skills':
        return <SkillsTab />;
      case 'relationships':
        return <RelationshipsTab />;
      case 'feats':
        return <FeatsTab />;
      case 'summary':
        return <SummaryTab />;
      default:
        return <IdentityTab />;
    }
  };

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const canGoNext = currentTabIndex < tabs.length - 1;
  const canGoPrev = currentTabIndex > 0;
  const canScrollLeft = visibleTabsStart > 0;
  const canScrollRight = visibleTabsStart + maxVisibleTabs < tabs.length;

  const scrollTabs = (direction: 'left' | 'right') => {
    if (direction === 'left' && canScrollLeft) {
      setVisibleTabsStart(prev => Math.max(0, prev - 1));
    } else if (direction === 'right' && canScrollRight) {
      setVisibleTabsStart(prev => Math.min(tabs.length - maxVisibleTabs, prev + 1));
    }
  };

   useEffect(() => {
    let unlisten: (() => void) | null = null;
  
    const setupThemeListener = async () => {
      try {
        console.log('Setting up theme listener...');
  
        // First check if theme was set by Tauri when window was created
        const tauriTheme = (window as any).__THEME__;
        console.log('Tauri theme from window context:', tauriTheme);
        
        let initialTheme: 'dark' | 'light';
        if (tauriTheme) {
          initialTheme = tauriTheme;
          // Apply the theme from Tauri context
          if (tauriTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          console.log('Applied Tauri theme:', tauriTheme);
        } else {
          // Fallback to checking document class
          const isDark = document.documentElement.classList.contains('dark');
          initialTheme = isDark ? 'dark' : 'light';
          console.log('Fallback theme detection:', initialTheme);
        }
        
        setTheme(initialTheme);
  
        unlisten = await listen('theme-changed', (event: any) => {
          console.log('Theme changed in child window:', event.payload);
          const newTheme = event.payload;
          setTheme(newTheme);
  
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
        });
  
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    };
  
    setupThemeListener();
  
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const visibleTabs = tabs.slice(visibleTabsStart, visibleTabsStart + maxVisibleTabs);

  return (
    <CharacterProfileContext.Provider value={{ profile, updateProfile }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-gray-950 dark:via-black dark:to-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Character Profile Builder
              </h1>
              {book && (
                <p className="text-gray-600 dark:text-gray-400">
                  Building character for: <span className="font-medium">{book.title}</span>
                </p>
              )}
            </div>

            {/* Tab Navigation - BookDetails Style with Carousel */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-2">
                {/* Left Scroll Arrow */}
                <motion.button
                  onClick={() => scrollTabs('left')}
                  disabled={!canScrollLeft}
                  className={`p-2 rounded-full transition-colors ${
                    canScrollLeft 
                      ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 shadow-md' 
                      : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  whileHover={{ scale: canScrollLeft ? 1.1 : 1 }}
                  whileTap={{ scale: canScrollLeft ? 0.9 : 1 }}
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </motion.button>

                {/* Tab Pills */}
                <div className="flex items-center space-x-1 p-1 rounded-full bg-gray-200/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50">
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="relative px-4 py-2 text-sm font-medium rounded-full focus:outline-none transition-colors flex items-center gap-2"
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                        <span className={`relative z-10 ${isActive ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                          {tab.label}
                        </span>
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 bg-white dark:bg-black rounded-full shadow-md"
                            layoutId="activeCharacterTabPill"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Scroll Arrow */}
                <motion.button
                  onClick={() => scrollTabs('right')}
                  disabled={!canScrollRight}
                  className={`p-2 rounded-full transition-colors ${
                    canScrollRight 
                      ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 shadow-md' 
                      : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  whileHover={{ scale: canScrollRight ? 1.1 : 1 }}
                  whileTap={{ scale: canScrollRight ? 0.9 : 1 }}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Tab Progress Indicators */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                {tabs.map((tab, index) => (
                  <div
                    key={tab.id}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTabIndex
                        ? 'bg-purple-500'
                        : index < currentTabIndex
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* AI Helper Bar */}
            <AIHelperBar
              placeholder={`Describe this ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} or reference a famous character...`}
              onGenerate={(prompt) => handleAIGeneration(activeTab, prompt)}
              isGenerating={isGenerating}
            />

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-8 mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center">
              <motion.button
                onClick={() => canGoPrev && setActiveTab(tabs[currentTabIndex - 1].id)}
                disabled={!canGoPrev}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                whileHover={{ scale: canGoPrev ? 1.02 : 1 }}
                whileTap={{ scale: canGoPrev ? 0.98 : 1 }}
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Previous
              </motion.button>

              <motion.button
                onClick={() => canGoNext && setActiveTab(tabs[currentTabIndex + 1].id)}
                disabled={!canGoNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                whileHover={{ scale: canGoNext ? 1.02 : 1 }}
                whileTap={{ scale: canGoNext ? 0.98 : 1 }}
              >
                {currentTabIndex === tabs.length - 1 ? 'Complete' : 'Next'}
                <ArrowRightIcon className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </CharacterProfileContext.Provider>
  );
};

// Tab Components
const IdentityTab: React.FC = () => {
  const { profile, updateProfile } = useContext(CharacterProfileContext);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Identity & Basics</h2>
        <p className="text-gray-600 dark:text-gray-400">Define your character's core identity and basic information</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name *
          </label>
          <input
            type="text"
            value={profile.fullName || ''}
            onChange={(e) => updateProfile({ fullName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Enter character's full name"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Aliases
          </label>
          <input
            type="text"
            value={profile.aliases?.join(', ') || ''}
            onChange={(e) => updateProfile({ aliases: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Nicknames, titles, other names (comma separated)"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gender
          </label>
          <input
            type="text"
            value={profile.gender || ''}
            onChange={(e) => updateProfile({ gender: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Male, Female, Non-binary, etc."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Pronouns
          </label>
          <input
            type="text"
            value={profile.pronouns || ''}
            onChange={(e) => updateProfile({ pronouns: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="She/Her, He/Him, They/Them, etc."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Age
          </label>
          <input
            type="number"
            value={profile.age || ''}
            onChange={(e) => updateProfile({ age: parseInt(e.target.value) || 25 })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Character's age"
            min="1"
            max="1000"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Race/Species
          </label>
          <input
            type="text"
            value={profile.race || ''}
            onChange={(e) => updateProfile({ race: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Human, Elf, Dwarf, Dragon, etc."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Occupation
          </label>
          <input
            type="text"
            value={profile.occupation || ''}
            onChange={(e) => updateProfile({ occupation: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Knight, Wizard, Merchant, Scholar, etc."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Citizenship/Origin
          </label>
          <input
            type="text"
            value={profile.citizenship || ''}
            onChange={(e) => updateProfile({ citizenship: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Kingdom, City, Realm, Planet, etc."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Character Role
          </label>
          <select
            value={profile.characterRole || 'Protagonist'}
            onChange={(e) => updateProfile({ characterRole: e.target.value as any })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="Protagonist">Protagonist</option>
            <option value="Antagonist">Antagonist</option>
            <option value="Both">Both</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Character Type
          </label>
          <select
            value={profile.characterType || 'Primary'}
            onChange={(e) => updateProfile({ characterType: e.target.value as any })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="Primary">Primary Character</option>
            <option value="Secondary">Secondary Character</option>
            <option value="Tertiary">Supporting Character</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Lifestyle
        </label>
        <textarea
          value={profile.lifestyle || ''}
          onChange={(e) => updateProfile({ lifestyle: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="Describe their daily life, social status, living conditions..."
        />
      </div>
    </div>
  );
};

// Appearance Tab Component
const AppearanceTab: React.FC = () => {
  const { profile, updateProfile } = useContext(CharacterProfileContext);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appearance & Physical Description</h2>
        <p className="text-gray-600 dark:text-gray-400">Define how your character looks and presents themselves</p>
      </div>
      
      {/* Physical Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height</label>
          <input
            type="text"
            value={profile.height || ''}
            onChange={(e) => updateProfile({ height: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="5'8&quot;, 175cm, etc."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight</label>
          <input
            type="text"
            value={profile.weight || ''}
            onChange={(e) => updateProfile({ weight: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="150 lbs, 70kg, etc."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Build</label>
          <select
            value={profile.build || ''}
            onChange={(e) => updateProfile({ build: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">Select build...</option>
            <option value="Slim">Slim</option>
            <option value="Athletic">Athletic</option>
            <option value="Muscular">Muscular</option>
            <option value="Average">Average</option>
            <option value="Stocky">Stocky</option>
            <option value="Heavy">Heavy</option>
            <option value="Petite">Petite</option>
            <option value="Tall">Tall</option>
          </select>
        </div>
      </div>

      {/* Hair & Eyes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hair</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
              <input
                type="text"
                value={profile.hairColor || ''}
                onChange={(e) => updateProfile({ hairColor: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Brown, Black, Blonde..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Style</label>
              <input
                type="text"
                value={profile.hairStyle || ''}
                onChange={(e) => updateProfile({ hairStyle: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Long, Short, Curly, Braided..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Eyes</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
              <input
                type="text"
                value={profile.eyeColor || ''}
                onChange={(e) => updateProfile({ eyeColor: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Blue, Green, Brown..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Shape</label>
              <select
                value={profile.eyeShape || ''}
                onChange={(e) => updateProfile({ eyeShape: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">Select shape...</option>
                <option value="Almond">Almond</option>
                <option value="Round">Round</option>
                <option value="Hooded">Hooded</option>
                <option value="Monolid">Monolid</option>
                <option value="Upturned">Upturned</option>
                <option value="Downturned">Downturned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Face & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Face Shape</label>
          <select
            value={profile.faceShape || ''}
            onChange={(e) => updateProfile({ faceShape: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">Select face shape...</option>
            <option value="Oval">Oval</option>
            <option value="Round">Round</option>
            <option value="Square">Square</option>
            <option value="Heart">Heart</option>
            <option value="Long">Long</option>
            <option value="Diamond">Diamond</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vision</label>
          <select
            value={profile.vision || ''}
            onChange={(e) => updateProfile({ vision: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">Select vision...</option>
            <option value="Perfect">Perfect Vision</option>
            <option value="Glasses">Wears Glasses</option>
            <option value="Contacts">Contact Lenses</option>
            <option value="Nearsighted">Nearsighted</option>
            <option value="Farsighted">Farsighted</option>
            <option value="Blind">Blind</option>
            <option value="Partial">Partial Vision</option>
          </select>
        </div>
      </div>

      {/* Distinguishing Features */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Distinguishing Features
        </label>
        <input
          type="text"
          value={profile.distinguishingFeatures?.join(', ') || ''}
          onChange={(e) => updateProfile({ distinguishingFeatures: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Scars, tattoos, birthmarks, prosthetics (comma separated)"
        />
      </div>

      {/* Accessories & Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Accessories
          </label>
          <input
            type="text"
            value={profile.accessories?.join(', ') || ''}
            onChange={(e) => updateProfile({ accessories: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Jewelry, watches, piercings (comma separated)"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Clothing Style
          </label>
          <input
            type="text"
            value={profile.clothingStyle || ''}
            onChange={(e) => updateProfile({ clothingStyle: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Casual, formal, gothic, bohemian..."
          />
        </div>
      </div>

      {/* Health & Quirks */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Health/Condition
          </label>
          <textarea
            value={profile.health || ''}
            onChange={(e) => updateProfile({ health: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="General health, medical conditions, fitness level..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mannerisms
          </label>
          <input
            type="text"
            value={profile.mannerisms?.join(', ') || ''}
            onChange={(e) => updateProfile({ mannerisms: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="How they walk, gesture, sit (comma separated)"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Physical Quirks/Tics
          </label>
          <input
            type="text"
            value={profile.physicalQuirks?.join(', ') || ''}
            onChange={(e) => updateProfile({ physicalQuirks: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Nervous habits, unique movements (comma separated)"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Coordination or Disabilities
          </label>
          <textarea
            value={profile.disabilities || ''}
            onChange={(e) => updateProfile({ disabilities: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="Physical limitations, coordination issues, disabilities..."
          />
        </div>
      </div>
    </div>
  );
};

const PersonalityTab: React.FC = () => {
  const { profile, updateProfile } = useContext(CharacterProfileContext);

  const personalityTypes = ['Introvert', 'Extrovert', 'Ambivert'];
  const dominantTraits = ['Confident', 'Emotional', 'Logical'];
  const commonTraits = [
    'Brave', 'Cautious', 'Honest', 'Deceptive', 'Kind', 'Cruel', 'Loyal', 'Treacherous',
    'Patient', 'Impulsive', 'Optimistic', 'Pessimistic', 'Humble', 'Arrogant', 'Creative',
    'Practical', 'Generous', 'Selfish', 'Forgiving', 'Vengeful', 'Calm', 'Hot-tempered'
  ];

  const copingStyles = ['Loss', 'Anger', 'Change', 'Stress'];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personality & Psychology</h2>
        <p className="text-gray-600 dark:text-gray-400">Explore your character's mind, motivations, and behavior</p>
      </div>

      {/* Personality Type & Dominant Trait */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Personality Type
          </label>
          <select
            value={profile.personality || 'Ambivert'}
            onChange={(e) => updateProfile({ personality: e.target.value as any })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            {personalityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Dominant Trait
          </label>
          <select
            value={profile.dominantTrait || 'Logical'}
            onChange={(e) => updateProfile({ dominantTrait: e.target.value as any })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            {dominantTraits.map(trait => (
              <option key={trait} value={trait}>{trait}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Traits Multi-Select */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Character Traits (Select Multiple)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50">
          {commonTraits.map(trait => (
            <label key={trait} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.traits?.includes(trait) || false}
                onChange={(e) => {
                  const currentTraits = profile.traits || [];
                  if (e.target.checked) {
                    updateProfile({ traits: [...currentTraits, trait] });
                  } else {
                    updateProfile({ traits: currentTraits.filter(t => t !== trait) });
                  }
                }}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{trait}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Goals
        </label>
        <div className="space-y-3">
          {profile.goals?.map((goal, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={goal}
                onChange={(e) => {
                  const newGoals = [...(profile.goals || [])];
                  newGoals[index] = e.target.value;
                  updateProfile({ goals: newGoals });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter a goal..."
              />
              <button
                onClick={() => {
                  const newGoals = profile.goals?.filter((_, i) => i !== index) || [];
                  updateProfile({ goals: newGoals });
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )) || []}
          <button
            onClick={() => {
              updateProfile({ goals: [...(profile.goals || []), ''] });
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Beliefs & Values */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Beliefs & Values
        </label>
        <div className="space-y-3">
          {profile.beliefs?.map((belief, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={belief}
                onChange={(e) => {
                  const newBeliefs = [...(profile.beliefs || [])];
                  newBeliefs[index] = e.target.value;
                  updateProfile({ beliefs: newBeliefs });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter a belief or value..."
              />
              <button
                onClick={() => {
                  const newBeliefs = profile.beliefs?.filter((_, i) => i !== index) || [];
                  updateProfile({ beliefs: newBeliefs });
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )) || []}
          <button
            onClick={() => {
              updateProfile({ beliefs: [...(profile.beliefs || []), ''] });
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Belief
          </button>
        </div>
      </div>

      {/* Strengths */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Strengths
        </label>
        <div className="space-y-3">
          {profile.strengths?.map((strength, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={strength}
                onChange={(e) => {
                  const newStrengths = [...(profile.strengths || [])];
                  newStrengths[index] = e.target.value;
                  updateProfile({ strengths: newStrengths });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter a strength..."
              />
              <button
                onClick={() => {
                  const newStrengths = profile.strengths?.filter((_, i) => i !== index) || [];
                  updateProfile({ strengths: newStrengths });
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )) || []}
          <button
            onClick={() => {
              updateProfile({ strengths: [...(profile.strengths || []), ''] });
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Strength
          </button>
        </div>
      </div>

      {/* Weaknesses */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Weaknesses
        </label>
        <div className="space-y-3">
          {profile.weaknesses?.map((weakness, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={weakness}
                onChange={(e) => {
                  const newWeaknesses = [...(profile.weaknesses || [])];
                  newWeaknesses[index] = e.target.value;
                  updateProfile({ weaknesses: newWeaknesses });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter a weakness..."
              />
              <button
                onClick={() => {
                  const newWeaknesses = profile.weaknesses?.filter((_, i) => i !== index) || [];
                  updateProfile({ weaknesses: newWeaknesses });
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )) || []}
          <button
            onClick={() => {
              updateProfile({ weaknesses: [...(profile.weaknesses || []), ''] });
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Weakness
          </button>
        </div>
      </div>

      {/* Motto & Fears */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motto/Ethics
          </label>
          <input
            type="text"
            value={profile.motto || ''}
            onChange={(e) => updateProfile({ motto: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Their guiding principle or life motto"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fears/Hates Most
          </label>
          <div className="space-y-3">
            {profile.fears?.map((fear, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={fear}
                  onChange={(e) => {
                    const newFears = [...(profile.fears || [])];
                    newFears[index] = e.target.value;
                    updateProfile({ fears: newFears });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter a fear..."
                />
                <button
                  onClick={() => {
                    const newFears = profile.fears?.filter((_, i) => i !== index) || [];
                    updateProfile({ fears: newFears });
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )) || []}
            <button
              onClick={() => {
                updateProfile({ fears: [...(profile.fears || []), ''] });
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Fear
            </button>
          </div>
        </div>
      </div>

      {/* Conflicts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Internal Conflicts
          </label>
          <div className="space-y-3">
            {profile.internalConflicts?.map((conflict, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={conflict}
                  onChange={(e) => {
                    const newConflicts = [...(profile.internalConflicts || [])];
                    newConflicts[index] = e.target.value;
                    updateProfile({ internalConflicts: newConflicts });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter internal conflict..."
                />
                <button
                  onClick={() => {
                    const newConflicts = profile.internalConflicts?.filter((_, i) => i !== index) || [];
                    updateProfile({ internalConflicts: newConflicts });
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )) || []}
            <button
              onClick={() => {
                updateProfile({ internalConflicts: [...(profile.internalConflicts || []), ''] });
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Internal Conflict
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            External Conflicts
          </label>
          <div className="space-y-3">
            {profile.externalConflicts?.map((conflict, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={conflict}
                  onChange={(e) => {
                    const newConflicts = [...(profile.externalConflicts || [])];
                    newConflicts[index] = e.target.value;
                    updateProfile({ externalConflicts: newConflicts });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter external conflict..."
                />
                <button
                  onClick={() => {
                    const newConflicts = profile.externalConflicts?.filter((_, i) => i !== index) || [];
                    updateProfile({ externalConflicts: newConflicts });
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )) || []}
            <button
              onClick={() => {
                updateProfile({ externalConflicts: [...(profile.externalConflicts || []), ''] });
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add External Conflict
            </button>
          </div>
        </div>
      </div>

      {/* Dialogue & Perception */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Dialogue Quirks
          </label>
          <div className="space-y-3">
            {profile.dialogueQuirks?.map((quirk, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={quirk}
                  onChange={(e) => {
                    const newQuirks = [...(profile.dialogueQuirks || [])];
                    newQuirks[index] = e.target.value;
                    updateProfile({ dialogueQuirks: newQuirks });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter dialogue quirk..."
                />
                <button
                  onClick={() => {
                    const newQuirks = profile.dialogueQuirks?.filter((_, i) => i !== index) || [];
                    updateProfile({ dialogueQuirks: newQuirks });
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )) || []}
            <button
              onClick={() => {
                updateProfile({ dialogueQuirks: [...(profile.dialogueQuirks || []), ''] });
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Dialogue Quirk
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mental Health Notes
          </label>
          <input
            type="text"
            value={profile.mentalHealth || ''}
            onChange={(e) => updateProfile({ mentalHealth: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Mental health considerations"
          />
        </div>
      </div>

      {/* Self vs Others Perception */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Self-Perception
          </label>
          <textarea
            value={profile.selfPerception || ''}
            onChange={(e) => updateProfile({ selfPerception: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="How they see themselves..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Others' Perception
          </label>
          <textarea
            value={profile.othersPerception || ''}
            onChange={(e) => updateProfile({ othersPerception: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="How others see them..."
          />
        </div>
      </div>

      {/* Coping Styles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emotional Coping Styles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {copingStyles.map(style => (
            <div key={style} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                How they cope with {style.toLowerCase()}:
              </label>
              <input
                type="text"
                value={profile.copingStyles?.[style] || ''}
                onChange={(e) => updateProfile({ 
                  copingStyles: { ...profile.copingStyles, [style]: e.target.value } 
                })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder={`How they handle ${style.toLowerCase()}...`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Secrets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Secrets/Regrets
        </label>
        <div className="space-y-3">
          {profile.secrets?.map((secret, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={secret}
                onChange={(e) => {
                  const newSecrets = [...(profile.secrets || [])];
                  newSecrets[index] = e.target.value;
                  updateProfile({ secrets: newSecrets });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter secret or regret..."
              />
              <button
                onClick={() => {
                  const newSecrets = profile.secrets?.filter((_, i) => i !== index) || [];
                  updateProfile({ secrets: newSecrets });
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )) || []}
          <button
            onClick={() => {
              updateProfile({ secrets: [...(profile.secrets || []), ''] });
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Secret
          </button>
        </div>
      </div>
    </div>
  );
};

const BackstoryTab: React.FC = () => {
  const { profile, updateProfile } = useContext(CharacterProfileContext);

  const familyRoles = ['Mother', 'Father', 'Sibling', 'Grandparent', 'Guardian', 'Other'];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Backstory & History</h2>
        <p className="text-gray-600 dark:text-gray-400">Chronicle your character's past and formative experiences</p>
      </div>

      {/* Birthplace & Childhood */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Birthplace
          </label>
          <input
            type="text"
            value={profile.birthplace || ''}
            onChange={(e) => updateProfile({ birthplace: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Where were they born?"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Childhood Summary
          </label>
          <textarea
            value={profile.childhood || ''}
            onChange={(e) => updateProfile({ childhood: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="Describe their childhood experiences..."
          />
        </div>
      </div>

      {/* Family Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Family</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familyRoles.map(role => (
            <div key={role} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {role}
              </label>
              <input
                type="text"
                value={profile.family?.[role] || ''}
                onChange={(e) => updateProfile({ 
                  family: { ...profile.family, [role]: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder={`${role} name and relationship`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Educational Background
        </label>
        <textarea
          value={profile.education || ''}
          onChange={(e) => updateProfile({ education: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="Schools, training, mentors, self-taught skills..."
        />
      </div>

      {/* Major Life Events */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Major Life Events
        </label>
        <div className="space-y-3">
          {profile.majorEvents?.map((event, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={event}
                onChange={(e) => {
                  const newEvents = [...(profile.majorEvents || [])];
                  newEvents[index] = e.target.value;
                  updateProfile({ majorEvents: newEvents });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter major life event..."
              />
              <button
                onClick={() => {
                  const newEvents = profile.majorEvents?.filter((_, i) => i !== index) || [];
                  updateProfile({ majorEvents: newEvents });
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )) || []}
          <button
            onClick={() => {
              updateProfile({ majorEvents: [...(profile.majorEvents || []), ''] });
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Major Event
          </button>
        </div>
      </div>

      {/* Achievements & Failures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Achievements
          </label>
          <div className="space-y-3">
            {profile.achievements?.map((achievement, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={achievement}
                  onChange={(e) => {
                    const newAchievements = [...(profile.achievements || [])];
                    newAchievements[index] = e.target.value;
                    updateProfile({ achievements: newAchievements });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter achievement..."
                />
                <button
                  onClick={() => {
                    const newAchievements = profile.achievements?.filter((_, i) => i !== index) || [];
                    updateProfile({ achievements: newAchievements });
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )) || []}
            <button
              onClick={() => {
                updateProfile({ achievements: [...(profile.achievements || []), ''] });
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Achievement
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Failures
          </label>
          <div className="space-y-3">
            {profile.failures?.map((failure, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={failure}
                  onChange={(e) => {
                    const newFailures = [...(profile.failures || [])];
                    newFailures[index] = e.target.value;
                    updateProfile({ failures: newFailures });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter failure or setback..."
                />
                <button
                  onClick={() => {
                    const newFailures = profile.failures?.filter((_, i) => i !== index) || [];
                    updateProfile({ failures: newFailures });
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )) || []}
            <button
              onClick={() => {
                updateProfile({ failures: [...(profile.failures || []), ''] });
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Failure
            </button>
          </div>
        </div>
      </div>

      {/* Romantic History */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Romantic History
        </label>
        <textarea
          value={profile.romanticHistory || ''}
          onChange={(e) => updateProfile({ romanticHistory: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="Past relationships, romantic experiences..."
        />
      </div>

      {/* Reputation & Beliefs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reputation
          </label>
          <textarea
            value={profile.reputation || ''}
            onChange={(e) => updateProfile({ reputation: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="How they're known in their community..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Spiritual/Religious Beliefs
          </label>
          <textarea
            value={profile.spiritualBeliefs || ''}
            onChange={(e) => updateProfile({ spiritualBeliefs: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="Religious or spiritual practices, beliefs..."
          />
        </div>
      </div>
    </div>
  );
};

const SkillsTab: React.FC = () => {
  const { profile, updateProfile } = useContext(CharacterProfileContext);

  const weaponTypes = ['Sword', 'Bow', 'Dagger', 'Staff', 'Axe', 'Spear', 'Crossbow', 'Mace', 'Whip', 'Throwing Knives'];
  const magicSchools = ['Elemental', 'Divine', 'Arcane', 'Nature', 'Shadow', 'Healing', 'Illusion', 'Necromancy', 'Enchantment', 'Transmutation'];
  const specialTalents = ['Tracking', 'Stealth', 'Persuasion', 'Leadership', 'Intimidation', 'Deception', 'Athletics', 'Acrobatics', 'Investigation', 'Medicine'];

  const getProficiencyLevel = (level: number) => {
    if (level >= 9) return 'Master';
    if (level >= 7) return 'Expert';
    if (level >= 5) return 'Proficient';
    if (level >= 3) return 'Novice';
    return 'Beginner';
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Skills & Abilities</h2>
        <p className="text-gray-600 dark:text-gray-400">Define your character's talents, powers, and capabilities</p>
      </div>

      {/* Weapons Mastery */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weapons Mastery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weaponTypes.map(weapon => (
            <div key={weapon} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {weapon}
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getProficiencyLevel(profile.weaponsMastery?.[weapon] || 0)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={profile.weaponsMastery?.[weapon] || 0}
                onChange={(e) => updateProfile({
                  weaponsMastery: { 
                    ...profile.weaponsMastery, 
                    [weapon]: parseInt(e.target.value) 
                  }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Magic Abilities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Magic/Supernatural Abilities</h3>
        <div className="space-y-4">
          {profile.magicAbilities?.map((ability, index) => (
            <div key={index} className="p-4 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ability Type
                  </label>
                  <input
                    type="text"
                    value={ability.type}
                    onChange={(e) => {
                      const newAbilities = [...(profile.magicAbilities || [])];
                      newAbilities[index] = { ...ability, type: e.target.value };
                      updateProfile({ magicAbilities: newAbilities });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Fireball, Healing, etc."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    School
                  </label>
                  <select
                    value={ability.school}
                    onChange={(e) => {
                      const newAbilities = [...(profile.magicAbilities || [])];
                      newAbilities[index] = { ...ability, school: e.target.value };
                      updateProfile({ magicAbilities: newAbilities });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select school...</option>
                    {magicSchools.map(school => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Strength
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getProficiencyLevel(ability.strength)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={ability.strength}
                    onChange={(e) => {
                      const newAbilities = [...(profile.magicAbilities || [])];
                      newAbilities[index] = { ...ability, strength: parseInt(e.target.value) };
                      updateProfile({ magicAbilities: newAbilities });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const newAbilities = profile.magicAbilities?.filter((_, i) => i !== index) || [];
                  updateProfile({ magicAbilities: newAbilities });
                }}
                className="mt-3 text-red-600 dark:text-red-400 text-sm hover:text-red-800 dark:hover:text-red-300"
              >
                Remove Ability
              </button>
            </div>
          )) || []}
          
          <button
            onClick={() => {
              const newAbility = { type: '', school: '', strength: 1 };
              updateProfile({ 
                magicAbilities: [...(profile.magicAbilities || []), newAbility] 
              });
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            + Add Magic Ability
          </button>
        </div>
      </div>

      {/* Special Talents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Special Talents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specialTalents.map(talent => (
            <div key={talent} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {talent}
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getProficiencyLevel(profile.specialTalents?.[talent] || 0)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={profile.specialTalents?.[talent] || 0}
                onChange={(e) => updateProfile({
                  specialTalents: { 
                    ...profile.specialTalents, 
                    [talent]: parseInt(e.target.value) 
                  }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Limitations & Signature Move */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Weaknesses/Limitations
          </label>
          <textarea
            value={profile.limitations?.join('\n') || ''}
            onChange={(e) => updateProfile({ limitations: e.target.value.split('\n').filter(l => l.trim()) })}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="What limits their abilities? (one per line)"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Signature Move/Spell
          </label>
          <textarea
            value={profile.signatureMove || ''}
            onChange={(e) => updateProfile({ signatureMove: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="Their most famous or powerful technique..."
          />
        </div>
      </div>
    </div>
  );
};

const RelationshipsTab: React.FC = () => {
  const { profile, updateProfile } = useContext(CharacterProfileContext);

  const relationshipTypes = ['Family', 'Friend', 'Enemy', 'Mentor', 'Student', 'Rival', 'Lover', 'Ally', 'Colleague', 'Acquaintance'];
  const relationshipRoles = ['Good', 'Bad', 'Complex'];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Relationships & Social Dynamics</h2>
        <p className="text-gray-600 dark:text-gray-400">Map your character's connections and social networks</p>
      </div>

      {/* Key Relationships */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Relationships</h3>
        <div className="space-y-4">
          {profile.relationships?.map((relationship, index) => (
            <div key={index} className="p-4 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    value={relationship.name}
                    onChange={(e) => {
                      const newRelationships = [...(profile.relationships || [])];
                      newRelationships[index] = { ...relationship, name: e.target.value };
                      updateProfile({ relationships: newRelationships });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Character name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    value={relationship.type}
                    onChange={(e) => {
                      const newRelationships = [...(profile.relationships || [])];
                      newRelationships[index] = { ...relationship, type: e.target.value };
                      updateProfile({ relationships: newRelationships });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select type...</option>
                    {relationshipTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <select
                    value={relationship.role}
                    onChange={(e) => {
                      const newRelationships = [...(profile.relationships || [])];
                      newRelationships[index] = { ...relationship, role: e.target.value as any };
                      updateProfile({ relationships: newRelationships });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select role...</option>
                    {relationshipRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      const newRelationships = profile.relationships?.filter((_, i) => i !== index) || [];
                      updateProfile({ relationships: newRelationships });
                    }}
                    className="w-full py-2 text-red-600 dark:text-red-400 text-sm hover:text-red-800 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={relationship.description}
                  onChange={(e) => {
                    const newRelationships = [...(profile.relationships || [])];
                    newRelationships[index] = { ...relationship, description: e.target.value };
                    updateProfile({ relationships: newRelationships });
                  }}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Describe the relationship dynamics..."
                />
              </div>
            </div>
          )) || []}
          
          <button
            onClick={() => {
              const newRelationship = { name: '', type: '', role: 'Good' as const, description: '' };
              updateProfile({ 
                relationships: [...(profile.relationships || []), newRelationship] 
              });
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            + Add Relationship
          </button>
        </div>
      </div>

      {/* Group Affiliations */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Group Affiliations
        </label>
        <input
          type="text"
          value={profile.groupAffiliations?.join(', ') || ''}
          onChange={(e) => updateProfile({ groupAffiliations: e.target.value.split(',').map(g => g.trim()).filter(g => g) })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Guilds, organizations, teams they belong to (comma separated)"
        />
      </div>

      {/* Rivalries */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Rivalries
        </label>
        <input
          type="text"
          value={profile.rivalries?.join(', ') || ''}
          onChange={(e) => updateProfile({ rivalries: e.target.value.split(',').map(r => r.trim()).filter(r => r) })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Ongoing competitive relationships (comma separated)"
        />
      </div>

      {/* Influence & Reputation */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Influence & Social Standing
        </label>
        <textarea
          value={profile.influence || ''}
          onChange={(e) => updateProfile({ influence: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="How much influence do they have? What's their social standing?"
        />
      </div>
    </div>
  );
};

const FeatsTab: React.FC = () => {
  const { profile, updateProfile } = useContext(CharacterProfileContext);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Greatest Feats & Preferences</h2>
        <p className="text-gray-600 dark:text-gray-400">Document your character's achievements and personal preferences</p>
      </div>

      {/* Greatest Feat */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Greatest Feat
        </label>
        <textarea
          value={profile.greatestFeat || ''}
          onChange={(e) => updateProfile({ greatestFeat: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="Describe their most impressive accomplishment or achievement..."
        />
      </div>

      {/* Favorite Activities */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Favorite Activities
        </label>
        <div className="space-y-3">
          {profile.favoriteActivities?.map((activity, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={activity}
                onChange={(e) => {
                  const newActivities = [...(profile.favoriteActivities || [])];
                  newActivities[index] = e.target.value;
                  updateProfile({ favoriteActivities: newActivities });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter a favorite activity..."
              />
              <button
                onClick={() => {
                  const newActivities = profile.favoriteActivities?.filter((_, i) => i !== index) || [];
                  updateProfile({ favoriteActivities: newActivities });
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )) || []}
          <button
            onClick={() => {
              updateProfile({ favoriteActivities: [...(profile.favoriteActivities || []), ''] });
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Favorite Activity
          </button>
        </div>
      </div>

      {/* Most Valued & Most Hated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Most Valued Things
          </label>
          <div className="space-y-3">
            {profile.mostValued?.map((valued, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={valued}
                  onChange={(e) => {
                    const newValued = [...(profile.mostValued || [])];
                    newValued[index] = e.target.value;
                    updateProfile({ mostValued: newValued });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter something they value..."
                />
                <button
                  onClick={() => {
                    const newValued = profile.mostValued?.filter((_, i) => i !== index) || [];
                    updateProfile({ mostValued: newValued });
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )) || []}
            <button
              onClick={() => {
                updateProfile({ mostValued: [...(profile.mostValued || []), ''] });
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Valued Thing
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Most Hated Things
          </label>
          <div className="space-y-3">
            {profile.mostHated?.map((hated, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={hated}
                  onChange={(e) => {
                    const newHated = [...(profile.mostHated || [])];
                    newHated[index] = e.target.value;
                    updateProfile({ mostHated: newHated });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter something they hate..."
                />
                <button
                  onClick={() => {
                    const newHated = profile.mostHated?.filter((_, i) => i !== index) || [];
                    updateProfile({ mostHated: newHated });
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )) || []}
            <button
              onClick={() => {
                updateProfile({ mostHated: [...(profile.mostHated || []), ''] });
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Hated Thing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryTab: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useContext(CharacterProfileContext);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const generateAISummary = async () => {
    setIsGeneratingSummary(true);
    // Simulate AI generation
    setTimeout(() => {
      setAiSummary(`${profile.fullName || 'This character'} is a ${profile.age || 'unknown age'} ${profile.race || 'being'} who serves as a ${profile.characterRole || 'character'} in the story. Known for their ${profile.traits?.slice(0, 3).join(', ') || 'unique traits'}, they are driven by ${profile.goals?.slice(0, 2).join(' and ') || 'their goals'}. With expertise in ${profile.occupation || 'their field'}, they face the challenge of ${profile.internalConflicts?.[0] || 'internal struggles'} while pursuing ${profile.greatestFeat || 'their greatest achievement'}. Their relationships, particularly with ${profile.relationships?.[0]?.name || 'key allies'}, shape their journey as they navigate the complexities of ${profile.lifestyle || 'their world'}.`);
      setIsGeneratingSummary(false);
    }, 2000);
  };

  const getCompletionPercentage = () => {
    const fields = [
      profile.fullName, profile.age, profile.race, profile.occupation,
      profile.height, profile.build, profile.hairColor, profile.eyeColor,
      profile.traits?.length, profile.goals?.length, profile.strengths?.length,
      profile.birthplace, profile.education, profile.greatestFeat
    ];
    const completedFields = fields.filter(field => field && (Array.isArray(field) ? field.length > 0 : field.toString().trim())).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const handleSaveCharacter = () => {
    // In a real app, this would save to a database
    const characterData = JSON.stringify(profile, null, 2);
    const blob = new Blob([characterData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.fullName || 'character'}_profile.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestart = () => {
    if (window.confirm('Are you sure you want to restart? All character data will be lost.')) {
      updateProfile(initialProfile);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Character Summary</h2>
        <p className="text-gray-600 dark:text-gray-400">Review and finalize your complete character profile</p>
      </div>

      {/* Completion Status */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200/50 dark:border-green-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Completion</h3>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{getCompletionPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
      </div>

      {/* AI-Generated Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Character Summary</h3>
          <motion.button
            onClick={generateAISummary}
            disabled={isGeneratingSummary}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
          </motion.button>
        </div>
        
        {aiSummary ? (
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{aiSummary}</p>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">Click "Generate Summary" to create an AI-powered character overview for dialogue simulation and consistency checks.</p>
        )}
      </div>

      {/* Character Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Identity Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PersonIcon className="w-5 h-5" />
            Identity
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {profile.fullName || 'Not set'}</p>
            <p><span className="font-medium">Age:</span> {profile.age || 'Not set'}</p>
            <p><span className="font-medium">Race:</span> {profile.race || 'Not set'}</p>
            <p><span className="font-medium">Role:</span> {profile.characterRole || 'Not set'}</p>
            <p><span className="font-medium">Occupation:</span> {profile.occupation || 'Not set'}</p>
          </div>
        </div>

        {/* Appearance Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <EyeIcon className="w-5 h-5" />
            Appearance
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Height:</span> {profile.height || 'Not set'}</p>
            <p><span className="font-medium">Build:</span> {profile.build || 'Not set'}</p>
            <p><span className="font-medium">Hair:</span> {profile.hairColor || 'Not set'} {profile.hairStyle || ''}</p>
            <p><span className="font-medium">Eyes:</span> {profile.eyeColor || 'Not set'}</p>
            <p><span className="font-medium">Features:</span> {profile.distinguishingFeatures?.slice(0, 2).join(', ') || 'None noted'}</p>
          </div>
        </div>

        {/* Personality Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <HeartIcon className="w-5 h-5" />
            Personality
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Type:</span> {profile.personality || 'Not set'}</p>
            <p><span className="font-medium">Traits:</span> {profile.traits?.slice(0, 3).join(', ') || 'Not set'}</p>
            <p><span className="font-medium">Strengths:</span> {profile.strengths?.slice(0, 2).join(', ') || 'Not set'}</p>
            <p><span className="font-medium">Goals:</span> {profile.goals?.slice(0, 2).join(', ') || 'Not set'}</p>
          </div>
        </div>

        {/* Skills Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5" />
            Skills
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Top Weapons:</span> {
              Object.entries(profile.weaponsMastery || {})
                .sort(([,a], [,b]) => b - a)
                .slice(0, 2)
                .map(([weapon]) => weapon)
                .join(', ') || 'None'
            }</p>
            <p><span className="font-medium">Magic Schools:</span> {
              profile.magicAbilities?.slice(0, 2).map(a => a.school).join(', ') || 'None'
            }</p>
            <p><span className="font-medium">Signature:</span> {profile.signatureMove || 'Not set'}</p>
          </div>
        </div>

        {/* Relationships Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Relationships
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Key People:</span> {
              profile.relationships?.slice(0, 3).map(r => r.name).join(', ') || 'None'
            }</p>
            <p><span className="font-medium">Groups:</span> {profile.groupAffiliations?.slice(0, 2).join(', ') || 'None'}</p>
            <p><span className="font-medium">Rivals:</span> {profile.rivalries?.slice(0, 2).join(', ') || 'None'}</p>
          </div>
        </div>

        {/* Achievements Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            Achievements
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Greatest Feat:</span> {
              profile.greatestFeat ? profile.greatestFeat.slice(0, 50) + '...' : 'Not set'
            }</p>
            <p><span className="font-medium">Achievements:</span> {profile.achievements?.slice(0, 2).join(', ') || 'None'}</p>
            <p><span className="font-medium">Valued:</span> {profile.mostValued?.slice(0, 2).join(', ') || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <motion.button
          onClick={handleSaveCharacter}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CheckCircleIcon className="w-5 h-5" />
          Confirm & Save Character
        </motion.button>

        <motion.button
          onClick={() => navigate(-1)}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Revisit Sections
        </motion.button>

        <motion.button
          onClick={handleRestart}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/40 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshIcon className="w-5 h-5" />
          Restart Character
        </motion.button>
      </div>
    </div>
  );
};

export default CharacterProfileBuilder;
