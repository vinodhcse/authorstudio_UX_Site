

import React from 'react';
import { Book } from './types';

export const PenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);

export const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const SystemIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
);


export const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

export const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);

export const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"></polyline></svg>
);

export const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

export const TypeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="4 7 4 4 20 4 20 7"></polyline>
        <line x1="9" y1="20" x2="15" y2="20"></line>
        <line x1="12" y1="4" x2="12" y2="20"></line>
    </svg>
);

export const FontIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M7 20V4h10v16"></path>
        <path d="M6 4v0a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v0"></path>
        <path d="M6 20v0a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v0"></path>
    </svg>
);

export const IndentIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="3 8 7 12 3 16"></polyline>
        <line x1="21" y1="12" x2="11" y2="12"></line>
        <line x1="21" y1="6" x2="11" y2="6"></line>
        <line x1="21" y1="18" x2="11" y2="18"></line>
    </svg>
);

export const LineHeightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 6h18"></path>
        <path d="M3 12h18"></path>
        <path d="M3 18h18"></path>
        <path d="M6 3v18"></path>
    </svg>
);

export const SpacingIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="6" height="10" x="9" y="7" rx="2"></rect>
        <path d="m15.5 17 1.5-1.5-1.5-1.5"></path>
        <path d="m8.5 17-1.5-1.5 1.5-1.5"></path>
        <path d="M12 2v5"></path>
        <path d="M12 17v5"></path>
    </svg>
);

export const WidthIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 12h18m-9-9v18"></path>
        <path d="m8 8 4-4 4 4"></path>
        <path d="m8 16 4 4 4-4"></path>
    </svg>
);

export const DividerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <polyline points="8 8 12 4 16 8"></polyline>
        <polyline points="16 16 12 20 8 16"></polyline>
    </svg>
);

export const CursorIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"></path>
        <path d="M12 20.9V17a4 4 0 0 1 0-8 4 4 0 0 1 0 8v3.9"></path>
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0"></path>
    </svg>
);

export const TypewriterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2 18h20"></path>
        <path d="M6.5 6C6.5 4.61929 7.61929 3.5 9 3.5H15C16.3807 3.5 17.5 4.61929 17.5 6V18H6.5V6Z"></path>
        <path d="M8 10h8"></path>
        <path d="M8 14h6"></path>
    </svg>
);

export const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

export const ExternalLinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
);

export const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

export const ThumbsDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
    </svg>
);

export const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 6 6 18"></path>
        <path d="M6 6l12 12"></path>
    </svg>
);

/*export const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9zM22 12l-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9zM10 3v4M3 10h4M3 21l4-4M21 3l-4 4"/></svg>
);*/

export const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3L10.1 8.8 4.3 10.7 10.1 12.6 12 18.4 13.9 12.6 19.7 10.7 13.9 8.8 12 3z" />
    <path d="M22 12l-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9z" />
    <path d="M10 3v4M3 10h4M3 21l4-4M21 3l-4 4" />
  </svg>
);


export const GitCommitIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>
);

export const ListIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);

export const FilePlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
);

export const Wand2Icon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9a3 3 0 0 0-3-3"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
);

export const TextQuoteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 6H3"/><path d="M21 12H8"/><path d="M21 18H8"/><path d="M3 12v6"/></svg>
);

export const GripVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
);

export const HardDriveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>
);

export const CloudIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
);

export const BoldIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
);

export const ItalicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
);

export const UnderlineIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
);

export const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export const MessageSquareIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

// Additional Formatting Icons
export const StrikethroughIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
);

export const SuperscriptIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m4 19 8-8"/><path d="m12 19-8-8"/><path d="M20 12h-4c0-1.5.44-2 1.5-2.5S20 8.334 20 7c0-.5-.5-1-1-1h-4"/></svg>
);

export const SubscriptIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m4 5 8 8"/><path d="m12 5-8 8"/><path d="M20 19h-4c0-1.5.442-2 1.5-2.5S20 15.334 20 14c0-.5-.5-1-1-1h-4"/></svg>
);

export const HighlightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
);

export const CodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);

export const AlignLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="11" y1="14" x2="3" y2="14"/><line x1="11" y1="18" x2="3" y2="18"/></svg>
);

export const AlignCenterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="14" x2="7" y2="14"/><line x1="17" y1="18" x2="7" y2="18"/></svg>
);

export const AlignRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="13" y2="14"/><line x1="21" y1="18" x2="13" y2="18"/></svg>
);

export const AlignJustifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
);

export const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
);

export const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

export const TableIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 12h18"/></svg>
);

export const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/></svg>
);

export const CheckSquareIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
);

export const SquareIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
);

export const ListOrderedIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
);

export const TerminalIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
);

export const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

export const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);

export const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55.47.98.97 1.21C11.25 18.48 11.61 18.78 12 19.03c.39-.25.75-.55 1.03-.82c.5-.23.97-.66.97-1.21v-2.34c0-.59-.64-1.07-1.2-.98L12 14l-.8-.32c-.56-.09-1.2.39-1.2.98z"/><path d="M6 8.5L10.5 9"/><path d="M17.5 9L18 8.5"/><path d="M7 10l2 8l2-2l1 2l2-8"/></svg>
);

export const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

export const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

/*export const PaletteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
);*/

export const PaletteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22c4.97 0 8-4.03 8-8a8 8 0 1 0-8 8z" />
    <path d="M12 22a2 2 0 0 1-2-2 2 2 0 0 1 2-2h1a2 2 0 0 0 2-2c0-1-1-2-2-2h-1" />
    <circle cx="8.5" cy="10.5" r="1" fill="currentColor" />
    <circle cx="12" cy="7.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="10.5" r="1" fill="currentColor" />
  </svg>
);


export const StickyNoteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v5l5-5"/></svg>
);

export const QuoteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
);

// Additional Icons for Custom Nodes
export const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 18 15 12 9 6"/></svg>
);

export const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

export const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
);

export const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>
);

export const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

export const StickyNotePlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v5l5-5"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/></svg>
);

export const TheaterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05a9 9 0 0 1 9.95 10M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6M12 6l4 4-4 4"/></svg>
);

export const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

export const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);

export const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="15 18 9 12 15 6"/></svg>
);

export const PersonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export const MirrorIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3v18"/><path d="m16 7-4 4-4-4"/><path d="m16 17-4-4-4 4"/></svg>
);

export const BrainIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>
);

export const ScrollIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v11a2 2 0 0 0 2 2Z"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></svg>
);

export const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

export const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
);

export const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);

export const SlashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 2 2 22"/></svg>
);


const createCoverImages = (seed: string) => [
  `https://picsum.photos/seed/${seed}/800/600`,
  `https://picsum.photos/seed/${seed}2/800/600`,
  `https://picsum.photos/seed/${seed}3/800/600`,
  `https://picsum.photos/seed/${seed}4/800/600`,
  `https://picsum.photos/seed/${seed}5/800/600`,
];

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'There\'s more to me than meets the eye.',
    subtitle: 'An Urban Fantasy Thriller',
    author: 'Alex J. Doe',
    coverImage: 'https://picsum.photos/seed/a/800/1200',
    coverImages: createCoverImages('char-bg'),
    lastModified: 'Recently viewed',
    progress: 80,
    wordCount: 52364,
    genre: 'Mystery',
    subgenre: 'Urban Fantasy',
    collaboratorCount: 2,
    collaborators: [
        {id: 'c1', name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://picsum.photos/seed/collab1/40/40', role: 'EDITOR'}, 
        {id: 'c2', name: 'Bob Johnson', email: 'bob@example.com', avatar: 'https://picsum.photos/seed/collab2/40/40', role: 'REVIEWER'}
    ],
    characters: [
      { 
        id: 'char1', 
        name: 'Kaelen Shadowborn', 
        image: 'https://picsum.photos/seed/char1/800/1200', 
        quote: 'The shadows whisper secrets the light cannot comprehend.',
        
        // Core Identity
        fullName: 'Kaelen Vex Shadowborn',
        aliases: ['Shadow Walker', 'The Whisperer', 'Vex'],
        title: 'Former Royal Inquisitor',
        age: 32,
        dateOfBirth: 'Autumn Solstice, Year 1291',
        placeOfBirth: 'Shadowhaven, Northern Territories',
        nationality: 'Valdorian',
        species: 'Human (Shadow-touched)',
        gender: 'Male',
        sexuality: 'Heterosexual',
        pronouns: 'he/him',
        
        // Physical Appearance
        height: '6\'2"',
        weight: '175 lbs',
        build: 'Lean and athletic',
        hairColor: 'Black with silver streaks',
        hairStyle: 'Medium length, often tied back',
        eyeColor: 'Silver-grey',
        skinTone: 'Pale with faint shadow markings',
        facialFeatures: 'Sharp jawline, high cheekbones, slightly pointed ears',
        distinguishingMarks: 'Intricate shadow tattoos on forearms, scar across left temple',
        clothing: 'Dark leather coat, silver-buckled boots, shadow-woven cloak',
        accessories: 'Silver pendant with shadow crystal, leather gloves',
        
        // Personality Core
        personalityType: 'INTJ - The Architect',
        coreTraits: ['Analytical', 'Reserved', 'Loyal', 'Haunted', 'Protective'],
        positiveTraits: ['Intelligent', 'Dedicated', 'Resourceful', 'Empathetic', 'Strategic'],
        negativeTraits: ['Brooding', 'Secretive', 'Self-doubting', 'Isolationist', 'Guilt-ridden'],
        fears: ['Losing control of shadow powers', 'Hurting innocents', 'Confronting his past'],
        desires: ['Redemption', 'Peace', 'Understanding his abilities', 'Protecting others'],
        motivations: ['Atoning for past mistakes', 'Uncovering truth about shadow realm'],
        moralAlignment: 'Chaotic Good',
        
        // Background & History
        backstory: 'Once a respected Royal Inquisitor, Kaelen\'s life changed when he was exposed to shadow realm energy during a mission gone wrong. The exposure gave him supernatural abilities but cost him his position and nearly his sanity.',
        childhood: 'Raised by his grandmother after parents died in a plague. Showed early aptitude for investigation and justice.',
        education: 'Royal Academy of Investigation, graduated top of class',
        formativeEvents: [
          'Parents\' death when he was 8',
          'Discovery of investigative talents at 12',
          'Graduation from Royal Academy at 20',
          'The Shadow Incident at 28',
          'Exile from the Royal Court at 29'
        ],
        trauma: 'Shadow realm exposure, witnessing innocent deaths during failed mission',
        secrets: ['Can communicate with shadow entities', 'Has prophetic dreams', 'Is being hunted by former colleagues'],
        
        // Skills & Abilities
        primarySkills: ['Shadow manipulation', 'Investigation', 'Combat tactics', 'Stealth', 'Deduction'],
        secondarySkills: ['Lockpicking', 'Negotiation', 'Research', 'Survival', 'First aid'],
        combatSkills: ['Swordsmanship', 'Shadow magic', 'Hand-to-hand combat', 'Tactical planning'],
        socialSkills: ['Reading people', 'Intimidation', 'Protective instincts'],
        intellectualSkills: ['Pattern recognition', 'Memory palace technique', 'Language (Ancient Valdorian)'],
        magicalAbilities: ['Shadow walking', 'Shadow sight', 'Shadow binding', 'Emotional sensing through shadows'],
        weaknesses: ['Bright light disrupts powers', 'Emotional instability affects control', 'Physical exhaustion from overuse'],
        
        // Relationships
        familyRelations: {
          parents: 'Deceased - Marcus and Elara Shadowborn',
          siblings: 'None',
          spouse: 'None',
          children: 'None',
          guardians: 'Grandmother Nyx (deceased)'
        },
        romanticInterests: [
          { name: 'Seraphina', relationship: 'Romantic interest', status: 'Complicated', description: 'Mutual attraction, conflicted by duty' }
        ],
        allies: [
          { name: 'Seraphina', relationship: 'Trusted partner', loyalty: 9 },
          { name: 'Roric', relationship: 'Reluctant ally', loyalty: 6 }
        ],
        enemies: [
          { name: 'High Inquisitor Malachar', relationship: 'Former mentor turned enemy', threat: 10 },
          { name: 'Shadow Council', relationship: 'Ancient enemies', threat: 8 }
        ],
        mentors: [
          { name: 'Grandmother Nyx', relationship: 'Guardian/Mentor', status: 'Deceased', influence: 'Taught him to trust his instincts' }
        ],
        
        // Story Elements
        characterArc: 'From guilt-ridden exile to redeemed protector who learns to accept his powers and past',
        internalConflict: 'Struggling between his desire to help others and fear of his dangerous abilities',
        externalConflict: 'Being hunted by former colleagues while trying to prevent shadow realm invasion',
        growth: 'Learning to trust others, accepting his shadow nature as part of who he is',
        role: 'Protagonist - The reluctant hero with a dark past',
        importance: 'Primary',
        firstAppearance: 'Chapter 1',
        lastAppearance: 'Epilogue',
        
        // Dialogue & Voice
        speechPatterns: ['Speaks formally when nervous', 'Uses shadow metaphors', 'Often trails off when thinking'],
        vocabulary: 'Educated, occasionally archaic terms',
        accent: 'Slight Northern Valdorian accent',
        catchphrases: ['The shadows know', 'In darkness, truth'],
        
        // Development Notes
        characterTheme: 'Redemption through acceptance',
        symbolism: 'Represents the balance between light and dark',
        inspiration: 'Classic detective archetype meets supernatural elements',
        notes: 'Key to bridging human and shadow realm storylines',
        tags: ['protagonist', 'detective', 'supernatural', 'haunted', 'redeemer']
      },
      { 
        id: 'char2', 
        name: 'Seraphina Brightflame', 
        image: 'https://picsum.photos/seed/char2/800/1200', 
        quote: 'Destiny is not a path given, but a road forged in fire.',
        
        // Core Identity
        fullName: 'Seraphina Aria Brightflame',
        aliases: ['Sera', 'The Phoenix Warrior', 'Flame Bearer'],
        title: 'Captain of the Royal Guard',
        age: 28,
        dateOfBirth: 'Summer\'s Peak, Year 1295',
        placeOfBirth: 'Solareth, Capital of Valdoria',
        nationality: 'Valdorian',
        species: 'Human (Fire-blessed)',
        gender: 'Female',
        sexuality: 'Heterosexual',
        pronouns: 'she/her',
        
        // Physical Appearance  
        height: '5\'8"',
        weight: '140 lbs',
        build: 'Athletic and strong',
        hairColor: 'Auburn with golden highlights',
        hairStyle: 'Long, often braided for combat',
        eyeColor: 'Emerald green with gold flecks',
        skinTone: 'Sun-kissed olive',
        facialFeatures: 'Strong features, determined expression, high cheekbones',
        distinguishingMarks: 'Phoenix tattoo on right shoulder, small scar on chin',
        clothing: 'Royal guard armor with flame motifs, practical combat gear',
        accessories: 'Phoenix feather pendant, flame-blessed sword',
        
        // Personality & Relationships
        personalityType: 'ENFJ - The Protagonist',
        coreTraits: ['Brave', 'Compassionate', 'Determined', 'Loyal', 'Inspiring'],
        role: 'Deuteragonist - The loyal warrior',
        characterArc: 'From duty-bound soldier to independent leader who learns to balance duty with personal desires',
        romanticInterests: [
          { name: 'Kaelen', relationship: 'Romantic interest', status: 'Developing', description: 'Growing attraction despite conflicting duties' }
        ],
        allies: [
          { name: 'Kaelen', relationship: 'Trusted partner', loyalty: 9 },
          { name: 'Royal Guard Unit', relationship: 'Commands respect', loyalty: 8 }
        ],
        importance: 'Primary'
      },
      { 
        id: 'char3', 
        name: 'King Roric Ironhart', 
        image: 'https://picsum.photos/seed/char3/800/1200', 
        quote: 'A crown weighs nothing, but the head that wears it bears the world.',
        
        // Core Identity
        fullName: 'Roric Aldwin Ironhart III',
        aliases: ['The Iron King', 'Defender of the Realm'],
        title: 'King of Valdoria',
        age: 45,
        dateOfBirth: 'Winter\'s End, Year 1278',
        importance: 'Primary'
      },
      { 
        id: 'char4', 
        name: 'Elena Mistweaver', 
        image: 'https://picsum.photos/seed/char4/800/1200', 
        quote: 'Magic is not about power, but about understanding the threads that bind all things.',
        
        // Core Identity
        fullName: 'Elena Cordelia Mistweaver',
        aliases: ['The Weaver', 'Mist Sage'],
        title: 'Court Mage',
        age: 38,
        species: 'Human (Mage)',
        gender: 'Female',
        height: '5\'5"',
        hairColor: 'Silver-white',
        eyeColor: 'Violet',
        role: 'Supporting Character - The wise mentor',
        importance: 'Secondary',
        primarySkills: ['Elemental magic', 'Divination', 'Healing', 'Enchanting'],
        backstory: 'The royal court\'s most trusted mage, Elena has served three generations of the Ironhart dynasty.',
        personalityType: 'INFJ - The Advocate',
        coreTraits: ['Wise', 'Patient', 'Mysterious', 'Protective', 'Intuitive']
      },
      { 
        id: 'char5', 
        name: 'Captain Marcus Steelwind', 
        image: 'https://picsum.photos/seed/char5/800/1200', 
        quote: 'Honor is not in the victory, but in how we face the battle.',
        
        // Core Identity
        fullName: 'Marcus Alexander Steelwind',
        aliases: ['Steel', 'The Fortress'],
        title: 'Captain of the City Watch',
        age: 40,
        species: 'Human',
        gender: 'Male',
        height: '6\'0"',
        hairColor: 'Brown with gray streaks',
        eyeColor: 'Brown',
        role: 'Supporting Character - The reliable ally',
        importance: 'Secondary',
        primarySkills: ['Leadership', 'Swordsmanship', 'Tactics', 'Investigation'],
        backstory: 'A veteran soldier who rose through the ranks to lead the city watch.',
        personalityType: 'ESTJ - The Executive',
        coreTraits: ['Dependable', 'Just', 'Disciplined', 'Pragmatic', 'Loyal']
      },
      { 
        id: 'char6', 
        name: 'Lyra Nightingale', 
        image: 'https://picsum.photos/seed/char6/800/1200', 
        quote: 'Every shadow hides a secret, and every secret has its price.',
        
        // Core Identity
        fullName: 'Lyra Evelyn Nightingale',
        aliases: ['Night', 'The Songbird'],
        title: 'Master Thief',
        age: 24,
        species: 'Human',
        gender: 'Female',
        height: '5\'3"',
        hairColor: 'Black',
        eyeColor: 'Green',
        role: 'Supporting Character - The reluctant ally',
        importance: 'Secondary',
        primarySkills: ['Stealth', 'Lockpicking', 'Acrobatics', 'Information gathering'],
        backstory: 'An orphan who learned to survive on the streets and became the city\'s most skilled thief.',
        personalityType: 'ESTP - The Entrepreneur',
        coreTraits: ['Cunning', 'Independent', 'Resourceful', 'Witty', 'Loyal (to few)']
      },
      { 
        id: 'char7', 
        name: 'High Inquisitor Malachar', 
        image: 'https://picsum.photos/seed/char7/800/1200', 
        quote: 'Order must be maintained, even if it means sacrificing the few for the many.',
        
        // Core Identity
        fullName: 'Malachar Darius Blackthorn',
        aliases: ['The Iron Fist', 'Shadow Hunter'],
        title: 'High Inquisitor',
        age: 52,
        species: 'Human',
        gender: 'Male',
        height: '6\'1"',
        hairColor: 'Gray',
        eyeColor: 'Steel blue',
        role: 'Primary Antagonist',
        importance: 'Primary',
        primarySkills: ['Divine magic', 'Interrogation', 'Leadership', 'Combat'],
        backstory: 'Kaelen\'s former mentor who believes in order above all else.',
        personalityType: 'ENTJ - The Commander',
        coreTraits: ['Authoritarian', 'Disciplined', 'Ruthless', 'Intelligent', 'Zealous']
      },
      { 
        id: 'char8', 
        name: 'Brother Thomas', 
        image: 'https://picsum.photos/seed/char8/800/1200', 
        quote: 'Faith is not the absence of doubt, but the courage to act despite it.',
        
        // Core Identity
        fullName: 'Thomas Benedict Lightheart',
        aliases: ['Tom', 'The Gentle Priest'],
        title: 'Temple Priest',
        age: 35,
        species: 'Human',
        gender: 'Male',
        height: '5\'10"',
        hairColor: 'Brown',
        eyeColor: 'Blue',
        role: 'Supporting Character - The moral compass',
        importance: 'Tertiary',
        primarySkills: ['Healing magic', 'Counseling', 'Ancient languages', 'Herbalism'],
        backstory: 'A humble priest who provides spiritual guidance to the protagonists.',
        personalityType: 'ISFJ - The Protector',
        coreTraits: ['Compassionate', 'Wise', 'Humble', 'Patient', 'Faithful']
      },
      { 
        id: 'char9', 
        name: 'Tavern Keeper Grim', 
        image: 'https://picsum.photos/seed/char9/800/1200', 
        quote: 'A good ale and a warm hearth can solve more problems than any sword.',
        
        // Core Identity
        fullName: 'Grimwald Ironfoot',
        aliases: ['Grim', 'Old Iron'],
        title: 'Tavern Keeper',
        age: 58,
        species: 'Dwarf',
        gender: 'Male',
        height: '4\'8"',
        hairColor: 'Gray beard',
        eyeColor: 'Brown',
        role: 'Supporting Character - The information broker',
        importance: 'Tertiary',
        primarySkills: ['Brewing', 'Information gathering', 'Diplomacy', 'Axe fighting'],
        backstory: 'A retired dwarf warrior who now runs the most popular tavern in the city.',
        personalityType: 'ESFP - The Entertainer',
        coreTraits: ['Jovial', 'Observant', 'Protective', 'Wise', 'Hospitable']
      },
      { 
        id: 'char10', 
        name: 'Lady Isabelle Thornwick', 
        image: 'https://picsum.photos/seed/char10/800/1200', 
        quote: 'Politics is like gardening - you must know when to prune and when to let grow.',
        
        // Core Identity
        fullName: 'Isabelle Rosemary Thornwick',
        aliases: ['Lady Thorn', 'The Rose'],
        title: 'Court Noble',
        age: 42,
        species: 'Human',
        gender: 'Female',
        height: '5\'6"',
        hairColor: 'Blonde',
        eyeColor: 'Blue',
        role: 'Supporting Character - The political manipulator',
        importance: 'Tertiary',
        primarySkills: ['Diplomacy', 'Intrigue', 'Economics', 'Manipulation'],
        backstory: 'A cunning noble who plays the political game for the good of the realm.',
        personalityType: 'ENTJ - The Commander',
        coreTraits: ['Ambitious', 'Intelligent', 'Manipulative', 'Strategic', 'Patriotic']
      }
    ],
    featured: true,
    bookType: 'Novel',
    prose: 'First Person',
    language: 'English',
    publisher: 'Indie',
    publishedStatus: 'Unpublished',
    publisherLink: 'https://example-publisher.com',
    printISBN: '978-0-123456-78-9',
    ebookISBN: '978-0-123456-79-6',
    synopsis: 'A detective with a troubled past finds himself entangled in a web of deceit when a seemingly simple case of a missing person unravels a conspiracy that reaches the highest echelons of power.',
    description: 'A riveting urban fantasy where ancient magic clashes with modern technology, forcing a cynical detective to confront his own supernatural heritage.',
    versions: [
        { id: 'v1', name: 'Manuscript v1', status: 'FINAL', wordCount: 52000, createdAt: '2 months ago', contributor: { name: 'Alex J. Doe', avatar: 'https://picsum.photos/seed/user/40/40' }},
        { id: 'v2', name: 'Editor Pass', status: 'IN_REVIEW', wordCount: 52364, createdAt: '1 month ago', contributor: { name: 'Jane Smith', avatar: 'https://picsum.photos/seed/collab1/40/40' }},
        { id: 'v3', name: 'Draft v2', status: 'DRAFT', wordCount: 53010, createdAt: '2 days ago', contributor: { name: 'Alex J. Doe', avatar: 'https://picsum.photos/seed/user/40/40' }},
    ],
    activity: [
        { id: 'a1', user: { name: 'Alex J. Doe', avatar: 'https://picsum.photos/seed/user/40/40'}, action: 'created version', target: 'Draft v2', timestamp: '2 days ago' },
        { id: 'a2', user: { name: 'Jane Smith', avatar: 'https://picsum.photos/seed/collab1/40/40'}, action: 'updated details', target: 'Synopsis', timestamp: '5 days ago' },
        { id: 'a4', user: { name: 'Bob Johnson', avatar: 'https://picsum.photos/seed/collab2/40/40'}, action: 'reviewed version', target: 'Editor Pass', timestamp: '2 weeks ago' },
        { id: 'a5', user: { name: 'Alex J. Doe', avatar: 'https://picsum.photos/seed/user/40/40'}, action: 'deleted version', target: 'Old Intro Chapter', timestamp: '3 weeks ago' },
        { id: 'a3', user: { name: 'Alex J. Doe', avatar: 'https://picsum.photos/seed/user/40/40'}, action: 'invited collaborator', target: 'bob@example.com', timestamp: '1 month ago' },
    ]
  },
  {
    id: '2',
    title: 'Eclipse of Fate',
    author: 'Maria Garcia',
    coverImage: 'https://picsum.photos/seed/b/400/600',
    coverImages: createCoverImages('b'),
    lastModified: '2 days ago',
    progress: 45,
    wordCount: 23791,
    genre: 'Fantasy',
    collaboratorCount: 1,
    collaborators: [{id: 'c3', avatar: 'https://picsum.photos/seed/collab3/40/40', name: 'Chris Lee', email: 'chris@example.com', role: 'AUTHOR'}],
    characters: [],
    featured: false,
    bookType: 'Novel',
    prose: 'Multiple POV',
    language: 'English',
    publisher: 'Major Publishing House',
    publishedStatus: 'Unpublished',
    synopsis: 'A captivating tale that weaves through multiple perspectives, exploring the depths of human nature and the complexities of modern life. This literary masterpiece challenges conventional storytelling while maintaining an emotional core that resonates with readers across generations.',
    versions: [
       { id: 'v1', name: 'Initial Draft', status: 'DRAFT', wordCount: 23791, createdAt: '2 days ago', contributor: { name: 'Maria Garcia', avatar: 'https://picsum.photos/seed/collab3/40/40' }}
    ],
    activity: []
  },
  {
    id: '3',
    title: 'Of Shadows and Secrets',
    author: 'Ken Watanabe',
    coverImages: createCoverImages('c'),
    lastModified: 'about a month ago',
    progress: 80,
    wordCount: 52364,
    genre: 'Mystery',
    collaboratorCount: 2,
    collaborators: [
        {id: 'c1', avatar: 'https://picsum.photos/seed/collab1/40/40', name: 'Jane Smith', email: 'jane@example.com', role: 'EDITOR'},
        {id: 'c2', avatar: 'https://picsum.photos/seed/collab2/40/40', name: 'Bob Johnson', email: 'bob@example.com', role: 'REVIEWER'}
    ],
    characters: [],
    featured: false,
    bookType: 'Novella',
    prose: 'Third Person Limited',
    language: 'English',
    publisher: 'Crimson Quill',
    publishedStatus: 'Published',
    synopsis: 'In a city shrouded in perpetual twilight, a librarian discovers an ancient book that writes itself, chronicling a series of crimes that are yet to happen. He must race against time to stop the ink-stained future from becoming a bloody reality.',
    versions: [],
    activity: []
  },
  {
    id: '4',
    title: 'Lost in the Abyss',
    author: 'Samantha Riley',
    coverImage: 'https://picsum.photos/seed/d/400/600',
    coverImages: createCoverImages('d'),
    lastModified: '9 days ago',
    progress: 33,
    wordCount: 14208,
    genre: 'Science Fiction',
    collaboratorCount: 3,
    collaborators: [
        {id: 'c4', avatar: 'https://picsum.photos/seed/collab4/40/40', name: 'David Chen', email: 'david@example.com', role: 'AUTHOR'},
        {id: 'c5', avatar: 'https://picsum.photos/seed/collab5/40/40', name: 'Emily White', email: 'emily@example.com', role: 'AUTHOR'}, 
        {id: 'c6', avatar: 'https://picsum.photos/seed/collab6/40/40', name: 'Frank Black', email: 'frank@example.com', role: 'EDITOR'}
    ],
    characters: [],
    featured: false,
    bookType: 'Series',
    prose: 'First Person',
    language: 'English (UK)',
    publisher: 'Galaxy Press',
    publishedStatus: 'Unpublished',
    synopsis: 'The sole survivor of a deep space exploration mission awakens from cryo-sleep to find the ship adrift in an uncharted nebula. With the ship\'s AI as her only companion, she must unravel the mystery of what happened to her crew.',
    versions: [],
    activity: []
  },
  {
    id: '5',
    title: 'The Crimson Cipher',
    author: 'Eleanor Vance',
    coverImage: 'https://picsum.photos/seed/e/400/600',
    coverImages: createCoverImages('e'),
    lastModified: '3 weeks ago',
    progress: 95,
    wordCount: 88102,
    genre: 'Thriller',
    collaboratorCount: 1,
    collaborators: [{id: 'c7', avatar: 'https://picsum.photos/seed/collab7/40/40', name: 'George Harris', email: 'george@example.com', role: 'REVIEWER'}],
    characters: [],
    featured: false,
    bookType: 'Standalone',
    prose: 'Third Person Omniscient',
    language: 'English',
    publisher: 'Major Publishing House',
    publishedStatus: 'Published',
    synopsis: 'A brilliant cryptographer is blackmailed into breaking an unbreakable code, only to discover it’s the key to a global conspiracy. Now, hunted by a shadowy organization, she must use her skills to expose the truth before she is silenced forever.',
    versions: [],
    activity: []
  },
  {
    id: '6',
    title: 'Echoes of a Forgotten Star',
    author: 'A. A. Medina',
    coverImage: 'https://picsum.photos/seed/f/400/600',
    coverImages: createCoverImages('f'),
    lastModified: '5 days ago',
    progress: 15,
    wordCount: 8450,
    genre: 'Sci-Fi Fantasy',
    collaboratorCount: 4,
    collaborators: [
        {id: 'c8', avatar: 'https://picsum.photos/seed/collab8/40/40', name: 'Ivy Green', email: 'ivy@example.com', role: 'AUTHOR'},
        {id: 'c9', avatar: 'https://picsum.photos/seed/collab9/40/40', name: 'Jack Daniels', email: 'jack@example.com', role: 'EDITOR'},
        {id: 'c10', avatar: 'https://picsum.photos/seed/collab10/40/40', name: 'Karen Page', email: 'karen@example.com', role: 'REVIEWER'},
        {id: 'c11', avatar: 'https://picsum.photos/seed/collab11/40/40', name: 'Leo Fitz', email: 'leo@example.com', role: 'REVIEWER'}
    ],
    characters: [],
    featured: false,
    bookType: 'Epic',
    prose: 'Multiple POV',
    language: 'Invented',
    publisher: 'Self-Published',
    publishedStatus: 'Unpublished',
    synopsis: 'In a world where magic is fading, a young historian discovers a map that leads to the last source of cosmic power. She embarks on a perilous journey with a band of unlikely heroes to rekindle the dying stars.',
    versions: [],
    activity: []
  },
];

// Planning Page Icons
export const LayoutGridIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

export const LayoutListIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

export const FilterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
    </svg>
);

export const ViewIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

export const MapIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"></polygon>
        <line x1="8" y1="2" x2="8" y2="18"></line>
        <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
);

export const TimelineIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="12" cy="12" r="3"></circle>
        <circle cx="18" cy="12" r="3"></circle>
    </svg>
);

export const NetworkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="2"></circle>
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
    </svg>
);