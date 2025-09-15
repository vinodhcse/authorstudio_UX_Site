// World Building Types

export interface WorldData {
    id: string;
    name: string;
    description: string;
    maps: string[];
    themes: string[];
    history: HistoryEvent[];
    locations: Location[];
    objects: WorldObject[];
    lore: Lore[];
    magicSystems: MagicSystem[];
    tags: string[];
}

export interface HistoryEvent {
    event: string;
    eventNote: string;
    date: string;
    linkedTimelineEvent?: string;
}

export interface Location {
    id: string;
    name: string;
    type: string;
    region: string;
    description: string;
    image?: string;
    parentLocation?: string;
    history: HistoryEvent[];
    geography: Geography;
    culture: Culture;
    politics: Politics;
    economy: Economy;
    timelineEvents: HistoryEvent[];
    beliefsAndMyths: string[];
    landmarks: string[];
    parentWorldId: string;
}

export interface Geography {
    terrain: string;
    climate: string;
    floraFauna: string[];
}

export interface Culture {
    traditions: string[];
    language: string[];
    religion: string[];
    governance: string;
}

export interface Politics {
    alliances: string[];
    conflicts: string[];
    leaders: string[];
}

export interface Economy {
    trade: string[];
    resources: string[];
    technology: string;
}

export interface WorldObject {
    id: string;
    name: string;
    type: string;
    origin: string;
    description: string;
    image?: string;
    powers: string[];
    limitations: string[];
    currentHolder?: string;
    pastOwners: string[];
    timelineEvents: HistoryEvent[];
    parentWorldId: string;
}

export interface Lore {
    id: string;
    title: string;
    category: 'myth' | 'prophecy' | 'historical event' | 'legend';
    description: string;
    timeline: Timeline;
    keyFigures: string[];
    locationsInvolved: string[];
    objectsInvolved: string[];
    outcome: string;
    culturalImpact: string;
    parentWorldId: string;
}

export interface Timeline {
    startYear: string;
    endYear: string;
    age: string;
}

export interface MagicSystem {
    id: string;
    name: string;
    category: string;
    sourceOfPower: string;
    practitioners: string[];
    rules: string[];
    limitations: string[];
    notableUsers: string[];
    importantObjects: string[];
    locationsOfPower: string[];
    loreReferences: string[];
    culturalImpact: string;
    parentWorldId: string;
}
