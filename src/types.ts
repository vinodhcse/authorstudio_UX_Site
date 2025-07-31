

export interface Relationship {
  name: string;
  relationship: string;
  loyalty?: number;
  threat?: number;
  status?: string;
  description?: string;
  influence?: string;
}

export interface Character {
  id: string;
  name: string;
  image: string;
  quote: string;
  
  // Core Identity
  fullName?: string;
  aliases?: string[];
  title?: string;
  age?: number;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  species?: string;
  gender?: string;
  sexuality?: string;
  pronouns?: string;
  
  // Physical Appearance
  height?: string;
  weight?: string;
  build?: string;
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
  skinTone?: string;
  facialFeatures?: string;
  distinguishingMarks?: string;
  clothing?: string;
  accessories?: string;
  
  // Personality Core
  personalityType?: string;
  coreTraits?: string[];
  positiveTraits?: string[];
  negativeTraits?: string[];
  fears?: string[];
  desires?: string[];
  motivations?: string[];
  moralAlignment?: string;
  
  // Background & History
  backstory?: string;
  childhood?: string;
  education?: string;
  formativeEvents?: string[];
  trauma?: string;
  secrets?: string[];
  
  // Skills & Abilities
  primarySkills?: string[];
  secondarySkills?: string[];
  combatSkills?: string[];
  socialSkills?: string[];
  intellectualSkills?: string[];
  magicalAbilities?: string[];
  weaknesses?: string[];
  
  // Relationships
  familyRelations?: {
    parents?: string;
    siblings?: string;
    spouse?: string;
    children?: string;
    guardians?: string;
  };
  romanticInterests?: Relationship[];
  allies?: Relationship[];
  enemies?: Relationship[];
  mentors?: Relationship[];
  
  // Story Elements
  characterArc?: string;
  internalConflict?: string;
  externalConflict?: string;
  growth?: string;
  role?: string;
  importance?: string;
  firstAppearance?: string;
  lastAppearance?: string;
  
  // Dialogue & Voice
  speechPatterns?: string[];
  vocabulary?: string;
  accent?: string;
  catchphrases?: string[];
  
  // Development Notes
  characterTheme?: string;
  symbolism?: string;
  inspiration?: string;
  notes?: string;
  tags?: string[];
}

export type CollaboratorRole = 'AUTHOR' | 'EDITOR' | 'REVIEWER' | 'ADMIN';

export interface Collaborator {
  id:string;
  avatar: string;
  name?: string;
  email?: string;
  role?: CollaboratorRole;
}

export type VersionStatus = 'DRAFT' | 'IN_REVIEW' | 'FINAL';

export interface Version {
    id: string;
    name: string;
    status: VersionStatus;
    wordCount: number;
    createdAt: string;
    contributor: {
        name: string;
        avatar: string;
    }
}

export type ActivityAction = 'created version' | 'updated details' | 'invited collaborator' | 'deleted version' | 'reviewed version';

export interface Activity {
    id: string;
    user: {
        name: string;
        avatar: string;
    };
    action: ActivityAction;
    target: string;
    timestamp: string;
}

export type PublishedStatus = 'Published' | 'Unpublished' | 'Scheduled';

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  coverImage?: string;
  coverImages?: string[];
  lastModified: string;
  progress: number;
  wordCount: number;
  genre: string;
  subgenre?: string;
  collaboratorCount: number;
  collaborators: Collaborator[];
  characters: Character[];
  featured: boolean;
  bookType: string;
  prose: string;
  language: string;
  publisher: string;
  publishedStatus: PublishedStatus;
  publisherLink?: string;
  printISBN?: string;
  ebookISBN?: string;
  publisherLogo?: string;
  synopsis: string;
  description?: string;
  versions?: Version[];
  activity?: Activity[];
}

export type Theme = 'light' | 'dark' | 'system';

export type ActiveTab = 'My Books' | 'Editing' | 'Reviewing' | 'WhisperTest';
export type BookDetailsTab = 'Versions' | 'Collaborators' | 'Recent Activity';