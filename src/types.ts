
import { WorldData } from './pages/BookForge/components/planning/types/WorldBuildingTypes';

// Asset System Types
export type EntityType =
  | 'book' | 'character' | 'world' | 'location' | 'object' | 'chapter' | 'divider';

export type AssetRole =
  | 'cover' | 'avatar' | 'gallery' | 'divider' | 'attachment' | 'map' | 'lore';

export type AssetStatus = 
  | 'local_only' | 'pending_upload' | 'uploaded' | 'failed';

export interface FileRef {
  assetId: string;
  sha256: string;
  role: AssetRole;
  mime?: string;
  width?: number;
  height?: number;
  remoteId?: string;
  remoteUrl?: string;
  localPath?: string;
}

export interface AssetImportResult extends FileRef {
  wasReused: boolean; // Indicates if this asset was already in the system
  uploadStatus?: 'uploaded' | 'pending_upload' | 'failed' | 'local_only';
}

export interface ImportContext {
  entityType: EntityType;
  entityId: string;
  role: AssetRole;
  bookId: string; // for namespacing local cache & backend route
  tags?: string[]; // serialized for upload
  description?: string;
}

export interface FileAsset {
  id: string;
  sha256: string;
  ext: string;
  mime: string;
  size_bytes: number;
  width?: number;
  height?: number;
  local_path?: string;
  remote_id?: string;
  remote_url?: string;
  status: AssetStatus;
  created_at: string;
  updated_at: string;
}

export interface FileAssetLink {
  id: string;
  asset_id: string;
  entity_type: EntityType;
  entity_id: string;
  role: AssetRole;
  sort_order: number;
  tags?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PlotArc {
  id: string;
  title: string;
  description: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  scenes: PlotScene[];
  characters: string[]; // character IDs
  timeline: {
    startChapter?: number;
    endChapter?: number;
    duration?: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlotScene {
  id: string;
  title: string;
  description: string;
  chapter?: number;
  wordCount?: number;
  status: 'DRAFT' | 'WRITTEN' | 'EDITED' | 'FINAL';
  characters: string[];
  plotPoints: string[];
  notes?: string;
}

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
  image: string; // Legacy field for backward compatibility
  avatarRef?: FileRef; // New asset reference for avatar
  galleryRefs?: FileRef[]; // New asset references for gallery
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
    characters: Character[];
    plotArcs: PlotArc[];
    worlds: WorldData[];
    chapters: any[];
    // New encrypted sync fields
    revLocal?: string;
    revCloud?: string;
    syncState?: SyncState;
    conflictState?: ConflictState;
    updatedAt?: number;
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

// Sync state types for encrypted data
export type SyncState = 'idle' | 'dirty' | 'pushing' | 'pulling' | 'conflict';
export type ConflictState = 'none' | 'needs_review' | 'blocked';
export type EncryptionScheme = 'udek' | 'bsk';

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  authorId?: string;
  coverImage?: string; // Legacy field for backward compatibility
  coverImageRef?: FileRef; // New asset reference
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
  // New encrypted sync fields
  isShared?: boolean;
  revLocal?: string;
  revCloud?: string;
  syncState?: SyncState;
  conflictState?: ConflictState;
  updatedAt?: number;
}

export type Theme = 'light' | 'dark' | 'system';

export type ActiveTab = 'My Books' | 'Editing' | 'Reviewing' | 'WhisperTest';
export type BookDetailsTab = 'Versions' | 'Collaborators' | 'Recent Activity';

// New encrypted data types
export interface Chapter {
  id: string;
  title: string;
  orderIndex?: number;
  revLocal?: string;
  revCloud?: string;
  syncState?: SyncState;
  conflictState?: ConflictState;
  updatedAt?: number;
  scenes: Scene[];
}

export interface Scene {
  id: string;
  title: string;
  encScheme: EncryptionScheme;
  contentEnc?: string; // base64 encrypted content
  contentIv?: string;  // base64 IV
  revLocal?: string;
  revCloud?: string;
  syncState?: SyncState;
  conflictState?: ConflictState;
  updatedAt?: number;
  wordCount?: number;
  hasProposals?: boolean;
}

// User key management
export interface UserKeys {
  udekWrapAppkey: Uint8Array;
  kdfSalt: Uint8Array;
  kdfIters: number;
  updatedAt: number;
}

// Grant for shared books
export interface Grant {
  grantId: string;
  ownerUserId: string;
  bookId: string;
  issuerUserId: string;
  bskWrapForMe: Uint8Array;
  perms: string; // 'view,suggest,edit'
  revoked: boolean;
  issuedAt: number;
  updatedAt: number;
}