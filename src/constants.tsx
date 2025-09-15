

import React from 'react';
import { Book, Character, PlotArc } from './types';

// World Building Data
import { WorldData } from './pages/BookForge/components/planning/types/WorldBuildingTypes';

// Sample Plot Arcs
export const SAMPLE_PLOT_ARCS: PlotArc[] = [
    {
        id: 'arc_001',
        title: 'The Shadow Awakening',
        description: 'Kaelen discovers his shadow powers and begins to understand their origin.',
        status: 'COMPLETED',
        scenes: [
            {
                id: 'scene_001',
                title: 'First Contact with Shadows',
                description: 'Kaelen\'s first encounter with shadow realm energy.',
                chapter: 1,
                wordCount: 2500,
                status: 'FINAL',
                characters: ['char1'],
                plotPoints: ['Shadow energy exposure', 'Power manifestation', 'Initial confusion'],
                notes: 'Key opening scene that sets up the entire magical system.'
            },
            {
                id: 'scene_002',
                title: 'Learning to Control',
                description: 'Kaelen begins training with his newfound abilities.',
                chapter: 3,
                wordCount: 3000,
                status: 'FINAL',
                characters: ['char1'],
                plotPoints: ['Training montage', 'First successful shadow walk', 'Mentor figure appears'],
                notes: 'Character development and skill building.'
            }
        ],
        characters: ['char1'],
        timeline: {
            startChapter: 1,
            endChapter: 5,
            duration: '2 weeks in-story'
        },
        tags: ['magic system', 'character development', 'origin story'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
    },
    {
        id: 'arc_002',
        title: 'The Investigation Begins',
        description: 'Kaelen starts investigating the mysterious shadow incidents across the city.',
        status: 'IN_PROGRESS',
        scenes: [
            {
                id: 'scene_003',
                title: 'Crime Scene Analysis',
                description: 'Kaelen investigates the first shadow-related incident.',
                chapter: 6,
                wordCount: 2800,
                status: 'WRITTEN',
                characters: ['char1'],
                plotPoints: ['Evidence gathering', 'Shadow trace detection', 'Connection to larger plot'],
                notes: 'Introduces the mystery element.'
            }
        ],
        characters: ['char1'],
        timeline: {
            startChapter: 6,
            endChapter: 12,
            duration: '1 month in-story'
        },
        tags: ['mystery', 'investigation', 'world building'],
        createdAt: '2024-01-20T11:00:00Z',
        updatedAt: '2024-01-25T14:45:00Z'
    }
];

export const MOCK_CHARACTER_DATA: Character[] = [
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
    ];

export const MOCK_WORLD_DATA: WorldData[] = [
    {
        id: "world_001",
        name: "Middle-earth",
        description: "A vast land inhabited by Men, Elves, Dwarves, Hobbits, and many other creatures. The central stage of the War of the Ring.",
        maps: ["https://example.com/maps/middleearth.png"],
        themes: ["Good vs Evil", "Hope", "Corruption", "Friendship"],
        history: [
            {
                event: "Origins of Middle-earth",
                eventNote: "Created in the Music of the Ainur, Middle-earth has endured wars against Morgoth and Sauron.",
                date: "First Age"
            }
        ],
        locations: [
            {
                id: "loc_shire",
                name: "The Shire",
                type: "Region",
                region: "Eriador",
                description: "A peaceful region, home to Hobbits. Known for rolling green hills and simple living.",
                image: "https://example.com/images/shire.jpg",
                history: [
                    {
                        event: "Founding of the Shire",
                        eventNote: "Hobbits settled in this region and established their homeland.",
                        date: "1601 T.A."
                    }
                ],
                geography: {
                    terrain: "Rolling hills and farmland",
                    climate: "Temperate",
                    floraFauna: ["Oak trees", "Apple orchards", "Sheep", "Ponies"]
                },
                culture: {
                    traditions: ["Birthday parties", "Harvest festivals"],
                    language: ["Westron"],
                    religion: ["None organized"],
                    governance: "Nominally ruled by the Thain."
                },
                politics: {
                    alliances: [],
                    conflicts: [],
                    leaders: ["Thain Paladin Took II"]
                },
                economy: {
                    trade: ["Farming", "Ale brewing"],
                    resources: ["Grain", "Livestock"],
                    technology: "Pre-industrial"
                },
                beliefsAndMyths: ["Legends of Bullroarer Took"],
                landmarks: ["Bag End", "Green Dragon Inn"],
                timelineEvents: [
                    {
                        event: "Departure of Frodo",
                        eventNote: "Frodo leaves the Shire on his quest to destroy the Ring.",
                        date: "September 23, 3018 T.A."
                    }
                ],
                parentWorldId: "world_001"
            },
            {
                id: "loc_mordor",
                name: "Mordor",
                type: "Dark Realm",
                region: "Eastern Middle-earth",
                description: "A volcanic wasteland dominated by Mount Doom, the stronghold of the Dark Lord Sauron.",
                image: "https://example.com/images/mordor.jpg",
                history: [
                    {
                        event: "Rise of Sauron",
                        eventNote: "Sauron established his fortress of Barad-dûr in this land.",
                        date: "Second Age"
                    }
                ],
                geography: {
                    terrain: "Volcanic wasteland and ash plains",
                    climate: "Hot and dry",
                    floraFauna: ["Sparse vegetation", "Orcs", "Fell beasts"]
                },
                culture: {
                    traditions: ["Dark sorcery", "War"],
                    language: ["Black Speech"],
                    religion: ["Worship of Sauron"],
                    governance: "Absolute tyranny under Sauron"
                },
                politics: {
                    alliances: ["Haradrim", "Easterlings"],
                    conflicts: ["War against the Free Peoples"],
                    leaders: ["Sauron", "Witch-king of Angmar"]
                },
                economy: {
                    trade: ["War materials", "Slavery"],
                    resources: ["Iron", "Coal"],
                    technology: "Industrial warfare"
                },
                beliefsAndMyths: ["The One Ring's creation"],
                landmarks: ["Barad-dûr", "Mount Doom", "Black Gate"],
                timelineEvents: [
                    {
                        event: "War of the Ring",
                        eventNote: "The final battle against the forces of darkness.",
                        date: "3019 T.A."
                    }
                ],
                parentWorldId: "world_001"
            },
            {
                id: "loc_gondor",
                name: "Gondor",
                type: "Kingdom",
                region: "Southern Middle-earth",
                description: "The greatest kingdom of Men in Middle-earth, heir to the glory of Númenor.",
                image: "https://example.com/images/gondor.jpg",
                history: [
                    {
                        event: "Founding of Gondor",
                        eventNote: "Founded by Elendil and his sons after the fall of Númenor.",
                        date: "3320 S.A."
                    }
                ],
                geography: {
                    terrain: "Mountains, plains, and coastal regions",
                    climate: "Mediterranean",
                    floraFauna: ["White trees", "Eagles", "Horses"]
                },
                culture: {
                    traditions: ["Noble lineages", "Scholarly pursuits"],
                    language: ["Westron", "Sindarin"],
                    religion: ["Eru Ilúvatar"],
                    governance: "Hereditary monarchy with stewards"
                },
                politics: {
                    alliances: ["Rohan", "Shire"],
                    conflicts: ["War against Mordor"],
                    leaders: ["Aragorn (King Elessar)", "Denethor (Steward)"]
                },
                economy: {
                    trade: ["Maritime commerce", "Craftsmanship"],
                    resources: ["Stone", "Metals", "Crops"],
                    technology: "Advanced for the age"
                },
                beliefsAndMyths: ["Return of the King prophecy"],
                landmarks: ["Minas Tirith", "Osgiliath", "Dol Amroth"],
                timelineEvents: [
                    {
                        event: "War of the Ring",
                        eventNote: "The final battle against the forces of darkness.",
                        date: "3019 T.A."
                    }
                ],
                parentWorldId: "world_001"
            }
        ],
        objects: [
            {
                id: "obj_ring",
                name: "The One Ring",
                type: "Magical Artifact",
                origin: "Forged by Sauron in Mount Doom.",
                description: "A golden ring with the power to dominate all other Rings of Power.",
                image: "https://example.com/images/one-ring.jpg",
                powers: ["Invisibility", "Domination of wills", "Enhanced perception"],
                limitations: [
                    "Corrupts its bearer",
                    "Can only be destroyed in Mount Doom",
                    "Draws Sauron's attention"
                ],
                currentHolder: "char_frodo",
                pastOwners: ["char_sauron", "char_isildur", "char_gollum"],
                timelineEvents: [
                    {
                        event: "War of the Ring",
                        eventNote: "The final battle against the forces of darkness.",
                        date: "3019 T.A."
                    }
                ],
                parentWorldId: "world_001"
            },
            {
                id: "obj_anduril",
                name: "Andúril",
                type: "Legendary Sword",
                origin: "Reforged from the shards of Narsil by the elves of Rivendell.",
                description: "The Flame of the West, sword of Aragorn, King of Gondor.",
                image: "https://example.com/images/anduril.jpg",
                powers: ["Exceptional sharpness", "Unbreakable", "Symbol of kingship"],
                limitations: ["Requires worthy wielder"],
                currentHolder: "char_aragorn",
                pastOwners: ["char_isildur", "char_elendil"],
                timelineEvents: [
                    {
                        event: "War of the Ring",
                        eventNote: "The final battle against the forces of darkness.",
                        date: "3019 T.A."
                    }
                ],
                parentWorldId: "world_001"
            }
        ],
        lore: [
            {
                id: "lore_war_of_ring",
                title: "The War of the Ring",
                category: "historical event",
                description: "The final conflict of the Third Age, uniting the Free Peoples against Sauron.",
                timeline: {
                    startYear: "3018",
                    endYear: "3019",
                    age: "Third Age"
                },
                keyFigures: ["char_frodo", "char_aragorn", "char_gandalf"],
                locationsInvolved: ["loc_gondor", "loc_mordor", "loc_shire"],
                objectsInvolved: ["obj_ring"],
                outcome: "Destruction of the One Ring and downfall of Sauron.",
                culturalImpact: "Remembered in the Red Book of Westmarch.",
                parentWorldId: "world_001"
            },
            {
                id: "lore_creation_of_ring",
                title: "The Forging of the One Ring",
                category: "myth",
                description: "Sauron secretly forged the One Ring to control all other Rings of Power.",
                timeline: {
                    startYear: "1600",
                    endYear: "1600",
                    age: "Second Age"
                },
                keyFigures: ["char_sauron"],
                locationsInvolved: ["loc_mordor"],
                objectsInvolved: ["obj_ring"],
                outcome: "Creation of the most powerful ring, leading to the War of the Last Alliance.",
                culturalImpact: "The beginning of Sauron's dominion over Middle-earth.",
                parentWorldId: "world_001"
            }
        ],
        magicSystems: [
            {
                id: "magic_ring_power",
                name: "The Power of the Rings",
                category: "Artifact-Based Magic",
                sourceOfPower: "Forged by Sauron in Mount Doom, tied to his essence.",
                practitioners: ["Ringbearers"],
                rules: [
                    "Grants invisibility and prolonged life",
                    "Corrupts the bearer's will over time",
                    "Strengthens Sauron's power when worn"
                ],
                limitations: [
                    "Only destroyed in Mount Doom",
                    "Draws Sauron's gaze to the bearer",
                    "Gradually dominates the wearer's mind"
                ],
                notableUsers: ["char_sauron", "char_frodo", "char_gollum"],
                importantObjects: ["obj_ring"],
                locationsOfPower: ["loc_mordor", "Mount Doom"],
                loreReferences: ["lore_creation_of_ring", "lore_war_of_ring"],
                culturalImpact: "Feared by all races; central to the Third Age conflict.",
                parentWorldId: "world_001"
            },
            {
                id: "magic_elven_song",
                name: "Elven Song Magic",
                category: "Natural Magic",
                sourceOfPower: "Connection to the Music of Creation and the natural world.",
                practitioners: ["Elves", "Some Rangers"],
                rules: [
                    "Powered by harmony with nature",
                    "Requires deep understanding of music and language",
                    "Stronger in ancient elven realms"
                ],
                limitations: [
                    "Weakens as the world ages",
                    "Requires pure intent",
                    "Cannot be used for domination"
                ],
                notableUsers: ["char_elrond", "char_galadriel", "char_legolas"],
                importantObjects: ["Vilya", "Nenya"],
                locationsOfPower: ["Rivendell", "Lothlórien"],
                loreReferences: ["lore_creation_of_ring"],
                culturalImpact: "Preserves elven realms and aids the Free Peoples.",
                parentWorldId: "world_001"
            }
        ],
        tags: ["fantasy", "epic", "saga", "tolkien"]
    }
];

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

export const SAMPLE_CHAPTER_Content  = [{
    "id": "kHPEr3GZ25UHkBUttJI5",
    "title": "Chapter 1",
    "position": 2,
    "content": {
        "blocks": [
            { "type": "paragraph", "content": [{ "type": "text", "text": "Chapter 1" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Mystery of Duality" }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "In the realm, an intricate balance prevails, woven into every aspect of existence. All things come paired - Day and Night, Life and Death, Happiness and Sorrow." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "But one pair raises more questions than it provides answers." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "Good and Bad!" }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "For every human has the potential to be either good or bad. But can they be both? And does such a middle ground exist – The Elusive gray." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "Amidst the clash of absolutes, we ponder if the elusive gray exists, where characters are not just heroes or villains, but a fusion of both light and shadow." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "Yet, how shall a man be judged to be destined for Heaven or Hell?" }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "Is it solely a tally of good and bad deeds throughout his life, or does a deeper essence determine one's virtue?" }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "This leads to an even more pertinent question: does a concrete notion of good and bad truly exist? Perhaps it is inherent in nature to encompass both, while humans endeavor to draw distinct boundaries between them." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "This question has stumped even the most brilliant minds to grace the realm. However, they all stress one undeniable truth - allowing a single mistake to veer you from the path of virtue can make it far easier for your dark side to corrupt you." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "And they do agree to one fact - Being Virtuous is not a destination, but an ongoing journey that continues until one's demise." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "Irrespective of the wisdom that eludes us to discover the answer to this question, I do envy a man who can remain virtuous all his life. For nothing is more challenging than to uphold virtue consistently in every moment of one's existence." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "- From the journal of Prince Dorian Primus" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"You released the Maurg King from his imprisonment?\" Count Marius shouted, clutching his chest with one hand in disbelief." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron squirmed uncomfortably before raising his head resolutely to meet the Count's gaze. \"Yes, Count Marius, I unintentionally liberated the most powerful predator of all time from his eons-long incarceration.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "The remainder of the command entourage, assembled in the fortress's command chamber, gasped at their presumed protector's disclosure." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron was able to read the thoughts in every occupant's mind. " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "\"Was he a protector or a destroyer?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "As Marius looked at Theron incredulously, Commander Logan Nelarius found his voice first. \"But how could someone without the power of elemental magic release the most dangerous creature to ever walk in the realm.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron drew his Weamris sword from its sheath and extracted the Primus stone from its pommel. Theron held the gleaming Primus stone in his hand and displayed it to the room's inhabitants." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa exclaimed in surprise. \"Is that a Guardis stone?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Everybody, including Theron, turned to gaze in surprise at Elissa. Elissa realized she had blurted out the stone's identity and looked around, embarrassed." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron addressed the lingering question on everyone's mind. \"How did you know the name of this stone, Aunty?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa gave everyone an embarrassed look." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius rediscovered his voice. \"A right question indeed. Elissa, how could a border town farmer like you know about the Guardis stone, a well-guarded secret in Sukra shared only with the king's trusted minds and advisors? In fact, I believe that only a handful of individuals in Sukra are aware of its existence.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa gathered her wits as she sensed Marius quickly attempting to truth-seek her response. \"I was apprised of their existence through a story narrated by my mother during my teen years.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius and the rest of the room's water casters could hear Lady Elissa's voice quivering at the recollection of her mother." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius cast a sly glance at Elissa for a brief moment before Logan diverted their attention. \"It is irrelevant.\" He shifted his gaze to Theron. \"Is that a Guardis stone?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron nodded as he regarded his aunt even more astutely than Marius did. Theron was beginning to believe there were several details about his aunt that he had neglected to notice. He resolved to discuss her knowledge later, as she appeared to possess secrets that even her brother was unaware of. Adrian was as shocked by his sister's knowledge of the Guardis stone as others." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"This is, indeed, a Guardis stone. In fact, this is not just a Guardis stone, but the Primus stone.\" Theron continued to glance at his aunt." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron noted the recognition on Elissa's face, even though she refrained from revealing her knowledge of the stone." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"What is a Primus stone?\" Marius inquired." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron was even more startled to discover that his aunt, a rural border town farmholder, was more knowledgeable about the Primus stone than one of the most renowned generals of their generation and, more crucially, a very close friend of the king." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "As he turned to face Marius, Theron gathered his thoughts. \"Of all the four Guardis stones that exist, the Primus stone is the most powerful.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Logan massaged the stubble on his chin. \"But what exactly is a Guardis stone?\" He glanced around the room at Adrian and Gwen, the room's other two inhabitants." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Adrian shook his head as he questioned Theron as well. \"Yes, may I ask what a Guardis stone is?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron sighed as he examined the stone. \"This little stone is the catalyst for the Second Ajnan War.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Logan's frown widened even further. \"What are you referring to? How might this stone have triggered the Ajnans to attack us?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius responded ahead of Theron. \"Simple. Whoever owns all the Guardis stones would compel all sentient races to kneel to them in submission.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron regarded the astute count with a nod. Marius was not regarded as the best general for nothing. \"True. Jurak recently acquired one such stone with which he single-handedly slaughtered ten thousand castle guards.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"What! It’s unbelievable to hear that an Ajnan clan chief managed to slaughter ten thousand trained castle guards on his own?\" Logan remarked." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Yes, and he has chosen to ally with Sylvius to obtain the Guardis stone stored within Sukra.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius shook his head incredulously. \"So, Jurak wishes to travel to the Sukran capital, where the king retains possession of the final Guardis stone.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron noted another astonished expression on his aunt's face but chose not to address it at the moment." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Yes, Jurak can sense the location of another Guardis stone within Sukra, and he may attempt to backstab Sylvius after they pass the fortress, as the Ajnans will no longer require Sylvius any longer then,\" Theron responded." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Logan shook his head in disbelief. \"But how is the Guardis stone so powerful? I've never heard of these magical stones, which seems strange given their reputed strength.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius waved his arms at Logan. \"It is one of Sukra's most closely guarded secrets.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"All these details are well, but why is the stone more important for the Ajnans, who lack Sukran magical abilities?\" Logan reasoned." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Anyone who can form a bond with a stone can use the stone's power. It is a reservoir of unfathomable power.\" Theron spoke gently in response." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Loads of shit. Where did the Ajnans obtain such a large amount of magical power to store in the stones?\" Logan remarked cryptically." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron let out a deep sigh." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "There was no going back now." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"The Guardis stones do not possess Ajnan magical power. They actually hold the power of the Maurg King.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "The occupants of the room descended into utter silence as everyone realized how the Guardis stone was connected to the return of the Maurg King." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron gave a gloomy nod. \"Yes, these Guardis stones were placed on top of a tombstone on Mount Guardian by representatives of the three races to confine the Maurg King. These stones ensured that the Maurg King's power was absorbed rather than allowing him to escape from millennia of incarceration.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"As a result, the stones retain an immeasurable amount of power,\" Theron stated." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"The Ajnans are not barbarians living on a barren mountain for no reason. Their whole kingdom is built around the Guardian Mountain, which imprisoned the Maurg King for millennia. The unicorn assigned the Ajnan race to guard the Maurg King's tombstone, believing they are the only race capable of resisting the Maurg King's seduction.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"How did the unicorn get involved in this story?\" Logan inquired." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"It appears that the unicorn advised our first Sukran King, Evander Primus, about these Guardis stones and their potential utility in imprisoning the Maurg King.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Everyone exclaimed in surprise as every strand of knowledge they had heard about the unicorn started to align." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"So, four Guardis stones exist?\" Marius inquired deliberatively." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Indeed.\" Theron clutched his primus stone in his hand. \"And this Guardis stone, the strongest of the four, was put on the tombstone as a safeguard, ensuring that it cannot be removed even if any race turns rogue.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Then how did the Maurg King escape his imprisonment if no one was supposed to remove the stone from the tombstone?\" Marius squinted." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron fidgeted once more uncomfortably before responding in a stuttering tone. \"The Maurg King was released because I picked up this Primus stone, which no single individual is anticipated to pick up until all three races are present.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius hissed in his direction. \"Why would you want to meddle with something so lethal?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron felt a wave of shame wash over him. \"I was so engaged fighting undead creatures and defending the Ajnan Princess that I was unaware I had mistakenly removed the Primus stone .\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa exclaimed with surprise at her nephew. \"Undead creatures!\" Once more, the entire room became quiet." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "After a period of silence, Theron nodded furiously but shook his head to contain his emotions. \"Indeed, the Guardian Mountain is an accursed place where the Maurg King raised dead monsters to do his bidding.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "“The Valkyrs,” Theron replied, hoping that one word would enlighten his companions." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "He was greeted with wild gasps from the surrounding occupants of the room." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"The Ajnans have been safeguarding us and the rest of the kingdom against these undead Valkrys creatures dispatched by the Maurg King to annihilate his adversaries and release him from an everlasting prison designed to confine him for all eternity.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"What is an undead creature?\" Logan spoke seriously in hushed tones." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"These animals had been dormant in the Guardian Mountain for a long time. They came to life as a result of the Maurg King's peculiar wizardry.\" Theron remained silent as he recalled the nightmare." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"They were beings composed of several different species. I saw one with the head of a man and the body of a snake and another with the head of a wolf and the body of a man.\" Theron shivered as he recalled the undead creatures." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"But what were these creatures doing in the accursed forest?\" Gwen inquired, terrified of even contemplating animals like those described by Theron." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"The Maurg King created them in order to demolish the gravestone and free him. However, the Primus stone's protection kept these creatures at bay, stopping the Maurg King from escaping his prison and barred anybody from demolishing the monument from the outside.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "The group as a whole grew silent as they processed this knowledge." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius inquired once again. \"Let us put the Maurg King's events on hold for the time being. So, there are only two Guardis stones in this valley now. Both you and Ajnan's commander, Jurak, are in possession of such stones, am I right?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron shook his head. \"No, the valley has three stones. One is mine, while the other is Jurak's. Toraz, the Ajnan King, owns the third.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Gwen regained her voice after being silent for most of the conversation. \"But Theron, I recall you stealing Jurak's Guardis stone at the castle when you provoked him into a duel?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron let out a sigh. \"Yes, but I had to return the stone to Jurak to save the Ajnan Princess.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Ajnan Princess?\" Gwen asked." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Indeed, it has been a long story after you left me in Ajnan lands.\" Theron sighed." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Did you realize that by returning the Guardis stone to Jurak, you were passing up a wonderful opportunity to save all the Sukrans in the valley?\" Marius uttered an incomprehensible snarl." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron returned the Count's gaze resolutely. \"Certainly, Count Marius. I recognized that surrendering the Guardis stone to Jurak would nullify my attempts to convince the Elder Council to assist the Ajnan King in destroying Jurak's troops. I recognized that I would endanger the Sukrans and my family.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"I didn't believe you would be such a big fool to trade a stranger’s life for the lives of hundreds of thousands of your brethren.\" Marius frowned at him, incredulous." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"At the very least, I didn't remain frozen when I saw a power-hungry individual attempt to murder small children directly in front of me.\" Theron returned the count's scowl." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius blanched as if slapped. Theron proceeded with a finger pointing at him. \" I am certainly an idiot, in contrast to bright individuals such as you and Sylvius, who appear to believe they understand who deserves to live or die.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"I am an idiot who has no idea how to determine who should live and who should die,\" Theron growled." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron shook his head. \"There are only two possible perspectives on events like these. Either you must be as radical as Sylvius, who believes he can choose who should be spared or killed. Or fools like myself who haven't the foggiest notion how to decide so.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"However, it is guys like you and Erasmus who stand in the center, incapable of accepting either side. And hence, when confronted with such a predicament, you stay uncertain.\" Theron hissed in the commander's direction." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"So, you're defending your decision as being right?\" Logan defended his master, who had grown silent in his remorse." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"I chose to save the princess over my aunt, uncle, and the rest of my valley neighbors because I couldn't let anyone die so that I could take the easy way out of the conflict. I couldn't force myself to sacrifice the princess just because I had exhausted all other options for rescuing the valley's inhabitants.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron shifted his gaze to his aunt, a lump forming in his throat. \"I felt that if I sacrificed the princess to spare the Sukrans in this town from the Ajnan War, I would be no different from Sylvius or the other power-hungry noble lords willing to snuff out thousands of innocent lives to obtain their ambitions.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "As he addressed his uncle and aunt, Theron felt tears sliding down his cheek. \"I humbly beg your pardon, Aunt Elissa and Uncle Adrian. This was the most difficult decision I've ever had to make. I didn’t think twice before I resolved to give my life on the plains, but I couldn't bring myself to betray you. However, I felt I would have brought shame to my upbringing if I had let a young girl die in your place.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa took a step closer to her boy, who was displaying his feelings for her to perceive. \"Oh, my boy, I've never been prouder of you than I am right now. You showed your genuine character when many seasoned individuals, such as our revered count, were unable to make a judgment.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa consoled Theron as he cried in relief." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Adrian took a step toward them. \"And you still found a means to defend us despite allowing Jurak to escape with the Guardis stone. Boy, you have nothing to be embarrassed about.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron broke free from Elissa's embrace and approached his uncle. He was overjoyed that his family recognized why he had put them in danger." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius peered at the youth, whose actions had slapped him figuratively in the face. Marius recognized that, despite Theron's valid point, the lad was utterly wrong. However, what irritated him was that Theron had intentionally chosen to be naive." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"This decision of yours helps me to comprehend you much better!\" Marius murmured." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "When Elissa and Theron turned to face Marius and protest, he halted them with a raised hand." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Theron, don't you believe everything is either black or white?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron was startled by the old count's accurate deductions. He nodded in agreement." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"I don't want to believe that there is a gray side to a man's character,\" Theron answered." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius sighed at him. \"Boy, I understand your desire to be intentionally naive in this regard. However, you are absolutely wrong.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"My Lord, what do you mean?\" Adrian inquired." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"The lines between black and white are always blurry at best, which is where most people tend to fall. No human or creature is pure white or pure black in this realm.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"And your clever nephew has taken the easy way out to preserve his sanity by adhering to a simple life principle so that he could respect himself.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"We all know that he craves respect the most in his life. In fact, he values respect more than his own life right now.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"To maintain his self-esteem, he has decided to simplify his life by categorizing things as either right or wrong.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "“But—” Adrian attempted to defend his boy." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"There is no absolute right or wrong. Occasionally, it is possible to be both right and wrong simultaneously,\" Marius proceeded." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"The same is true for being either wicked or honorable.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"There has never been a creature that has graced this realm that can be described as either entirely evil or completely honorable throughout its existence.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Many dabble on both ends of the spectrum, thereby falling into the gray area that we commonly refer to as the middle ground.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Sir Marius, would you describe Sylvius as a wicked man willing to strangle millions of innocents to accomplish his objective?\" Adrian frowned, unable to accept Marius's assertions." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"After all, a man who kills once and a man who kills multiple times are both deemed murderers. You cannot show compassion to the former because, unlike the latter, he has only committed the offense once,\" Adrian complained." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"What if the former, in your example, murdered to protect his family from murderous adversaries?\" Marius countered. \"Would you consider him a murderer even if our law regards him as a murderer?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"That is why Sylvius is not a wicked person by any stretch of the imagination. He may have become bitter recently, but no one can disregard his sacrifices over the years for the sake of this kingdom.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "“Adrian, how many men have you killed as a soldier?” Marius asked Adrian." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"I was simply carrying out my duty to defend my people by killing someone.\" Adrian was caught off guard and tried to defend himself." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "“Duty!” Marius directed his finger towards Adrian." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"When one's duty is questioned, it is never easy to categorize an action as wicked or honorable.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius turned and scrutinized Theron." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"When you are not liable for the lives of others, it is simpler for you to preach about human values. But would you have made the same choice if you were in charge of the entire valley?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"What would you choose between honor and duty?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Every man born in this realm would have at some point pondered this question.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"And I am sure that this young boy has reflected on this question so much in his life that he has taken the easy way out of this damning question.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Easy way?\" Adrian inquired." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "“He has decided that he would stick with the honorable side irrespective of the cost he has to pay for his choice.”" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"If I accept that the majority of men have committed both righteous and wrongful acts in their lifetimes, then the purpose I seek to achieve in this life would become meaningless,\" Theron revealed." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"It means I've given up on my life's mission to reform these people if I believed that they would revert to dishonorable conduct due to circumstances.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"To earn respect, a man must be consistent in his actions. If somebody changes the color of his skin depending on the occasion, he is not worthy of respect.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"You may have chosen duty over honor, but how do you know your decision was correct?\" Theron questioned the astute general." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Boy, my actions today may appear incorrect to you right now, but put yourself in my position. Would you have surrendered yourself and the tens of thousands of people under your protection to your adversaries just to save an exodus of infants and young children?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron was taken aback by the query. \"But—\" he blurted." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"No buts, son. Duty is paramount. On any given day, duty takes precedence over honor.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"When choosing between duty and honor, duty is always the better option,\" Marius preached. \"Where would you find honor if you relinquished your duty?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius pointed his finger at Adrian before Theron could object. \"Would you consider your uncle's decision to adhere to his duty as a soldier of the realm over his personal desire to rush to the Ajnan Kingdom to rescue you when he heard you were stranded in an enemy kingdom?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Sir, is it necessary to raise this question at this time?\" Adrian inquired with remorse about prioritizing his duty over his nephew." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron was silent for a short while. \"I believe my uncle made a wise decision. The likelihood of him infiltrating an enemy kingdom alone and rescuing me was much lower than his likelihood of assisting the rest of the fortress soldiers in effectively defending this valley.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"An answer that is diplomatic at best.\" Marius laughed. \"Isn't it the same as my decision to sacrifice the little ones to save many who would otherwise be slaughtered without a fight?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Wouldn't I have made a graver error if I had betrayed those who had fled to this fortress seeking my protection by surrendering to our enemies because I was not callous enough to see a few children murdered in front of me?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius proceeded. \"If I had surrendered to our enemies without a fight, wouldn't I be forced to watch as everyone was savagely murdered?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius turned to Elissa. \"You made a valid point earlier, Lady Elissa. You questioned the value of adhering to your duty at the expense of your soul. But if the price of duty is the soul, a soldier should be willing to sacrifice his soul for the duty he swore to uphold at all times." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Duty always takes precedence, son. I would always choose duty over honor.\" Marius concluded with style." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "When everyone recounted the difficult decisions they had to make in the preceding days, a startled silence descended upon the group." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Finally, Marius aimed his finger at Theron. \"I realize you want to remain intentionally naive and believe everything is black and white. You may disagree with the decision I made between duty and honor.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"But I hope you are not unfortunate enough, like me, to have to choose between duty and honor when everything you stand for is on the line.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron grew silent, mulling over the points shared by the wise count." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "Was he in error? Was he mistaken to believe everything was merely black and white when everything he knew indicated otherwise?" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "He had always been aware that the majority of people filled the middle ground, but he had always wished to avoid this miserable existence." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "You would neither be content with your selfishness nor with your occasional selflessness." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "But he couldn't dismiss the wise general's valid statement as incorrect." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "He was most alarmed by the old count's wish that he would not be unfortunate enough to make the same decision as Marius." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "But he had known his entire life that no man was more unfortunate than him." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Everything he had touched up to this point had withered despite his efforts." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "So far in his life, he had always lost when it counted the most. However, regardless of the circumstances, he had always taken satisfaction in upholding his honor and convictions." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "And he shivered at the prospect of having to choose between duty and honor, knowing that he was the most unfortunate Sukran to roam the land." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa decided to speak up after sensing that Marius' outpouring of reasoning and emotion could influence Theron away from his chosen path. She couldn’t let Marius' arguments change Theron after she worked so hard to raise him to be a lovely and honorable man." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "If the cost of saving her boy was crushing Marius’ sanity, so be it." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "It better be Marius' sanity that is lost, not her boy’s." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "She would choose her boy over anyone at any cost. Unlike Theron or Marius, she had no qualms about making this decision." }] },
            { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "Family was paramount to her. Not even duty, let alone honor." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "And she detested hearing a woman's words repeated in her ears. " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "Duty is paramount." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "It was time for her to intervene on behalf of the child whose decision to save the princess instead of his family resonated with her." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "She did not know whether Theron's decision was right or wrong, but she admired his determination. She did not want his resolve to be called into question by Marius' persuasive arguments." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Sir Marius!\" Elissa made her first intervention in this passionate discussion. \"Your eloquence in presenting your arguments has made me question my earlier decision regarding duty and honor.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa aimed a finger at Marius. \"I'm not sure if you're right or Theron is right.\" She paused for a moment before continuing. \"However, I am certain that when a man makes an effort to defend his decision to others, he himself does not believe he made the right choice.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius gaped at the farmer, who had precisely read his mind." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"You did not appear intent on convincing Theron about the decision you made today; rather, you appeared intent on convincing yourself that you made the right decision in order to maintain your belief that you are an honorable man despite the decision you made today.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"I may not be well-versed and educated in the disciplines of morality and ethics, but I can read minds. I can certainly tell that you questioned your decision after you made it, whereas Theron accepted his decision as correct.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"It may be morally right or wrong, but I do not believe a man has made the correct decision if he revisits the decision repeatedly.\" Elissa pointed out." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"You have unquestionably made the wrong decision if you are questioning your decision.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Marius was dumbfounded by Elissa's ability to defeat him with only a few words." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "He knew Elissa was correct. He was questioning whether he had made the right choice." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Adrian hung his head in humiliation and remorse because he had chosen duty over family. However, Theron appeared relieved to discover that his aunt supported his choice." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron believed he had made the correct choice if his aunt thought so. No one he had met, not even the unicorn, could match Aunt Elissa's profound intellect." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "He breathed a murmur of relief when he realized he had made the correct choice to save the princess." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Gwen interrupted the uneasy stillness that had grown around the gathering." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "“Well.” Gwen finally contributed to the conversation. \"It was enlightening to learn about different perspectives on right and wrong, but this discussion does not help us learn how to stop the army at our doorstep or the new enemy that has arisen after centuries of imprisonment.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "“So, I say let’s get back to the topic of defeating the armies arrayed against us, let alone the most powerful predator roaming the realm once more.”" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "The entire chamber reflected on their ability to defeat the gigantic Maurg King." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Adrian found a way to shatter the unpleasant silence. \"At the very least, we are spared the full Maurg race. Instead, we just need to confront a single Maurg, even though he may have been his race's king at one point. How challenging could it be?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Others accepted the argument because it bolstered their spirits. Theron hesitated to disclose the entire truth but ultimately chose to be candid." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"We are not up against just one Maurg,\" Theron responded with a firm face." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"What do you mean?\" Elissa and Gwen both inquired concurrently." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"The unicorn revealed that the Maurgan race is flourishing beyond the deserts overlooking the Ajnan kingdom. According to the unicorn, the Maurgan race was waiting for their king's return before invading Sukra,\" Theron responded glumly." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "A flurry of exclamation and surprise sounded from various occupants of the room." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "\"Did the unicorn mention the Maurgan race's numbers?\" Logan quietly inquired." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "For a few seconds, Theron remained silent before resolving his mind to share the truth. \"According to the unicorn, they outnumber the other races by a factor of at least a hundred thousand to one.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Each and every member of the gang gulped in terror and comprehended the ordeal that awaited them when this war ended." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron let the group process his information in their minds." }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa recollected her thoughts first. \"Are you certain you destroyed the Maurg King's corpse, and we won't have to worry about him for the next several years?\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Theron nodded. \"Indeed, Aunty. He remains a force to be wary of, even though he is roaming as a spirit. However, the unicorn stated that we do not need to be concerned about him just yet.\"" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "Elissa put her hands together and gave a supportive nod. \"Then, gentlemen and ladies, let us put the Maurgs aside for now and concentrate on our current dilemma...The Second Ajnan War.\"" }] }
        ]
    },
    "createdAt": "2025-07-06T05:03:14.845Z"
}];

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
    characters: MOCK_CHARACTER_DATA,
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
        { 
            id: 'v1', 
            name: 'Manuscript v1', 
            status: 'FINAL', 
            wordCount: 52000, 
            createdAt: '2 months ago', 
            contributor: { name: 'Alex J. Doe', avatar: 'https://picsum.photos/seed/user/40/40'},
            characters: MOCK_CHARACTER_DATA,
            plotArcs: SAMPLE_PLOT_ARCS,
            worlds: MOCK_WORLD_DATA,
            chapters: SAMPLE_CHAPTER_Content,
        },
        { 
            id: 'v2', 
            name: 'Editor Pass', 
            status: 'IN_REVIEW', 
            wordCount: 52364, 
            createdAt: '1 month ago', 
            contributor: { name: 'Jane Smith', avatar: 'https://picsum.photos/seed/collab1/40/40'},
            characters: [],
            plotArcs: SAMPLE_PLOT_ARCS,
            worlds: MOCK_WORLD_DATA,
            chapters: SAMPLE_CHAPTER_Content
        },
        { 
            id: 'v3', 
            name: 'Draft v2', 
            status: 'DRAFT', 
            wordCount: 53010, 
            createdAt: '2 days ago', 
            contributor: { name: 'Alex J. Doe', avatar: 'https://picsum.photos/seed/user/40/40' },
            characters: [],
            plotArcs: SAMPLE_PLOT_ARCS,
            worlds: MOCK_WORLD_DATA,
            chapters: SAMPLE_CHAPTER_Content
        },
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
       { 
           id: 'v1', 
           name: 'Initial Draft', 
           status: 'DRAFT', 
           wordCount: 23791, 
           createdAt: '2 days ago', 
           contributor: { name: 'Maria Garcia', avatar: 'https://picsum.photos/seed/collab3/40/40' },
           characters: [],
           plotArcs: [],
           worlds: []
       }
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

export const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

// Harry Potter Narrative Layout Data for BookContext
export const HARRY_POTTER_NARRATIVE_DATA = {
  plotArcs: [
    {
      id: 'arc_main_story',
      title: 'Harry Potter and the Philosopher\'s Stone',
      description: 'A boy wizard discovers his magical heritage and faces the dark wizard who killed his parents',
      status: 'COMPLETED' as const,
      scenes: [
        {
          id: 'scene_privet_drive',
          title: 'The Boy Who Lived',
          description: 'Harry is delivered to the Dursleys',
          chapter: 1,
          wordCount: 2500,
          status: 'FINAL' as const,
          characters: ['harry_potter', 'dumbledore', 'mcgonagall', 'hagrid'],
          plotPoints: ['Voldemort\'s defeat', 'Harry placed with Dursleys', 'Letter left for Harry'],
          notes: 'Establishes the premise and sets up Harry\'s tragic beginning'
        },
        {
          id: 'scene_zoo_incident',
          title: 'The Snake Incident',
          description: 'Harry talks to a snake at the zoo',
          chapter: 2,
          wordCount: 1800,
          status: 'FINAL' as const,
          characters: ['harry_potter', 'dudley_dursley'],
          plotPoints: ['Harry\'s first sign of magic', 'Parseltongue ability revealed'],
          notes: 'First hint of Harry\'s magical abilities'
        }
      ],
      characters: ['harry_potter', 'dumbledore', 'hagrid', 'mcgonagall'],
      timeline: {
        startChapter: 1,
        endChapter: 17,
        duration: 'One school year'
      },
      tags: ['main plot', 'coming of age', 'hero\'s journey'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ],
  characters: [
    {
      id: 'harry_potter',
      name: 'Harry Potter',
      image: 'https://picsum.photos/seed/harry/400/600',
      quote: 'I don\'t think you\'re a waste of space.',
      fullName: 'Harry James Potter',
      aliases: ['The Boy Who Lived', 'The Chosen One'],
      age: 11,
      species: 'Human (Wizard)',
      gender: 'Male',
      pronouns: 'he/him',
      height: '4\'8"',
      build: 'Small and skinny',
      hairColor: 'Black and messy',
      eyeColor: 'Bright green',
      distinguishingMarks: 'Lightning bolt scar on forehead',
      personalityType: 'ISFP - The Adventurer',
      coreTraits: ['Brave', 'Loyal', 'Curious', 'Modest', 'Sometimes reckless'],
      fears: ['Loss of loved ones', 'Voldemort', 'Being alone'],
      desires: ['Belonging', 'Family', 'To be normal', 'To help others'],
      motivations: ['Finding his place in the wizarding world', 'Understanding his past'],
      backstory: 'Orphaned as a baby when Voldemort killed his parents. Lived with abusive relatives until age 11.',
      characterArc: 'From neglected orphan to confident hero who defeats Voldemort',
      role: 'Protagonist',
      tags: ['protagonist', 'wizard', 'gryffindor']
    },
    {
      id: 'hermione_granger',
      name: 'Hermione Granger',
      image: 'https://picsum.photos/seed/hermione/400/600',
      quote: 'Books! And cleverness! There are more important things, but friendship and bravery.',
      fullName: 'Hermione Jean Granger',
      age: 11,
      species: 'Human (Muggle-born witch)',
      gender: 'Female',
      pronouns: 'she/her',
      hairColor: 'Bushy brown',
      eyeColor: 'Brown',
      personalityType: 'ISTJ - The Logistician',
      coreTraits: ['Intelligent', 'Studious', 'Loyal', 'Perfectionist', 'Justice-oriented'],
      fears: ['Failure', 'Being expelled', 'Not being good enough'],
      desires: ['Academic success', 'Acceptance', 'Making a difference'],
      motivations: ['Proving herself in the wizarding world', 'Helping her friends'],
      characterArc: 'From know-it-all outcast to valued friend and brilliant witch',
      role: 'Deuteragonist',
      tags: ['main character', 'witch', 'gryffindor', 'muggle-born']
    },
    {
      id: 'ron_weasley',
      name: 'Ron Weasley',
      image: 'https://picsum.photos/seed/ron/400/600',
      quote: 'Bloody hell!',
      fullName: 'Ronald Bilius Weasley',
      age: 11,
      species: 'Human (Wizard)',
      gender: 'Male',
      pronouns: 'he/him',
      hairColor: 'Red',
      eyeColor: 'Blue',
      personalityType: 'ESFP - The Entertainer',
      coreTraits: ['Loyal', 'Humorous', 'Brave', 'Insecure', 'Hot-tempered'],
      fears: ['Spiders', 'Being overshadowed', 'Poverty'],
      desires: ['Recognition', 'Achievement', 'Being special'],
      motivations: ['Proving himself worthy', 'Supporting his friends'],
      characterArc: 'From insecure youngest son to confident and brave friend',
      role: 'Tritagonist',
      tags: ['main character', 'wizard', 'gryffindor', 'pure-blood']
    }
  ],
  worlds: [
    {
      id: 'wizarding_world',
      name: 'The Wizarding World',
      description: 'A hidden magical society existing alongside the mundane world',
      theme: 'Wonder and magic hidden in plain sight',
      locations: [
        {
          id: 'hogwarts',
          name: 'Hogwarts School of Witchcraft and Wizardry',
          type: 'School',
          description: 'A magical school housed in a medieval castle in Scotland',
          geography: 'Scottish Highlands, surrounded by mountains, forest, and a lake',
          significance: 'Primary setting, Harry\'s first true home',
          parentWorldId: 'wizarding_world'
        },
        {
          id: 'diagon_alley',
          name: 'Diagon Alley',
          type: 'Commercial District',
          description: 'Hidden magical shopping street in London',
          geography: 'Cobblestone street behind The Leaky Cauldron pub',
          significance: 'Gateway to the wizarding world for Harry',
          parentWorldId: 'wizarding_world'
        },
        {
          id: 'privet_drive',
          name: 'Privet Drive',
          type: 'Residential Street',
          description: 'Mundane suburban street where Harry lives with the Dursleys',
          geography: 'Little Whinging, Surrey, England',
          significance: 'Harry\'s prison and protection before Hogwarts',
          parentWorldId: 'wizarding_world'
        }
      ],
      objects: [
        {
          id: 'philosophers_stone',
          name: 'The Philosopher\'s Stone',
          type: 'Magical Artifact',
          description: 'Legendary alchemical substance capable of granting immortality',
          powers: ['Grants immortality', 'Turns any metal into gold', 'Creates Elixir of Life'],
          currentHolder: 'nicolas_flamel',
          significance: 'Central MacGuffin driving the plot',
          parentWorldId: 'wizarding_world'
        }
      ],
      lore: [
        {
          id: 'boy_who_lived',
          title: 'The Boy Who Lived',
          category: 'legend',
          description: 'The story of how baby Harry Potter survived the Killing Curse',
          keyFigures: ['harry_potter', 'voldemort', 'lily_potter', 'james_potter'],
          outcome: 'Voldemort\'s temporary defeat and Harry becoming famous',
          parentWorldId: 'wizarding_world'
        }
      ]
    }
  ]
};

