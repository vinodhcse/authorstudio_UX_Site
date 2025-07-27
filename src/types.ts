

export interface Character {
  id: string;
  name: string;
  image: string;
  quote: string;
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

export type ActiveTab = 'My Books' | 'Editing' | 'Reviewing';
export type BookDetailsTab = 'Versions' | 'Collaborators' | 'Recent Activity';