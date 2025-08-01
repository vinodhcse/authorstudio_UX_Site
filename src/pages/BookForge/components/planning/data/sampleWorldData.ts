import { WorldData } from '../types/WorldBuildingTypes';

export const sampleWorldData: WorldData = {
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
            timelineEvents: ["lore_departure_frodo"],
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
            timelineEvents: ["lore_war_of_ring"],
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
            timelineEvents: ["lore_war_of_ring"],
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
            timelineEvents: ["lore_war_of_ring"],
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
            timelineEvents: ["lore_war_of_ring"],
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
};
