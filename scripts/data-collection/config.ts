/**
 * Data Collection Configuration
 */

// Rate limiting settings
export const RATE_LIMIT = {
    requestsPerSecond: 1,
    backoffMultiplier: 2,
    maxRetries: 3,
    initialDelayMs: 1000,
};

// Feature normalization mapping
export const FEATURE_MAPPINGS: Record<string, string> = {
    // Common variations -> normalized tokens
    "breastfeeding": "breastfeeding_area",
    "nursing area": "breastfeeding_area",
    "nursing room": "breastfeeding_area",
    "lactation room": "breastfeeding_area",
    "changing table": "changing_table",
    "diaper changing": "changing_table",
    "nappy changing": "changing_table",
    "diaper disposal": "diaper_disposal",
    "nappy bin": "diaper_disposal",
    "hot water": "hot_water_dispenser",
    "water dispenser": "hot_water_dispenser",
    "private": "private_room",
    "private room": "private_room",
    "enclosed": "private_room",
    "family toilet": "family_toilet",
    "family restroom": "family_toilet",
    "stroller": "stroller_space",
    "pram": "stroller_space",
    "sink": "sink",
    "wash basin": "sink",
    "microwave": "microwave",
    "bottle warmer": "bottle_warmer",
    "wheelchair": "wheelchair_accessible",
    "accessible": "wheelchair_accessible",
};

// Valid normalized feature tokens
export const VALID_FEATURES = [
    "breastfeeding_area",
    "changing_table",
    "diaper_disposal",
    "hot_water_dispenser",
    "private_room",
    "family_toilet",
    "stroller_space",
    "sink",
    "microwave",
    "bottle_warmer",
    "wheelchair_accessible",
] as const;

// Singapore regions for categorization
export const SINGAPORE_REGIONS = {
    central: ["orchard", "marina", "cbd", "tanjong pagar", "chinatown", "bugis", "city hall", "raffles place", "dhoby ghaut"],
    north: ["woodlands", "sembawang", "yishun", "ang mo kio", "bishan"],
    east: ["changi", "tampines", "pasir ris", "bedok", "paya lebar", "simei"],
    west: ["jurong", "clementi", "bukit batok", "choa chu kang", "boon lay"],
    northeast: ["sengkang", "punggol", "hougang", "serangoon"],
} as const;

// Venue type mappings
export const VENUE_TYPES = {
    mall: ["mall", "shopping", "plaza", "centre", "center"],
    hospital: ["hospital", "medical", "clinic", "polyclinic"],
    airport: ["airport", "terminal", "changi"],
    attraction: ["museum", "zoo", "gardens", "park", "resort", "sentosa"],
    transit: ["mrt", "bus interchange", "station"],
    library: ["library"],
    community: ["community", "cc", "rc"],
} as const;

// Source configurations
export const SOURCES = {
    littleDayOut: {
        name: "Little Day Out",
        baseUrl: "https://www.littledayout.com",
        listUrl: "https://www.littledayout.com/nursing-rooms-in-singapore",
    },
    sassyMama: {
        name: "Sassy Mama",
        baseUrl: "https://www.sassymamasg.com",
    },
    sgNursingRooms: {
        name: "SG Nursing Rooms",
        baseUrl: "https://www.sgnursingrooms.com",
    },
    capitaland: {
        name: "CapitaLand",
        baseUrl: "https://www.capitaland.com",
    },
} as const;

// OneMap API (Singapore official geocoding)
export const ONEMAP_API = {
    searchUrl: "https://www.onemap.gov.sg/api/common/elastic/search",
    // No API key needed for basic search
};

// OpenStreetMap Nominatim (fallback)
export const OSM_NOMINATIM = {
    searchUrl: "https://nominatim.openstreetmap.org/search",
    userAgent: "MilkMap/1.0 (nursing-rooms-sg)",
};
