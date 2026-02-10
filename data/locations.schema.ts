import { z } from "zod";

// Amenity types available in nursing/baby-care rooms
export const AmenitySchema = z.enum([
    "changing_table",
    "nursing_chair",
    "hot_water",
    "sink",
    "private_room",
    "microwave",
    "fridge",
    "highchair",
    "toys",
]);

export type Amenity = z.infer<typeof AmenitySchema>;

// Venue type  
export const VenueTypeSchema = z.enum(["mall", "attraction", "other"]);
export type VenueType = z.infer<typeof VenueTypeSchema>;

// Location status
export const LocationStatusSchema = z.enum([
    "active",
    "unverified",
    "reported_closed",
]);
export type LocationStatus = z.infer<typeof LocationStatusSchema>;

// Verification Level
export const VerificationLevelSchema = z.enum(["unverified", "user-reported", "verified"]);
export type VerificationLevel = z.infer<typeof VerificationLevelSchema>;

// Evidence extracted from a source
export const EvidenceSchema = z.object({
    field: z.enum(["floor", "landmark", "hours", "amenities"]),
    value: z.string().describe("Normalized value"),
    rawValue: z.string().describe("Original text from source"),
    sourceId: z.string().uuid().describe("ID of the source this evidence came from"),
    confidence: z.number().min(0).max(100).default(0),
    updatedAt: z.string().datetime().describe("ISO timestamp when evidence was extracted"),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

// Source of information for a location
export const SourceSchema = z.object({
    id: z.string().uuid().optional().describe("Unique identifier for source"),
    name: z.string().describe("Source name (e.g., 'Official Website', 'User Submission')"),
    url: z.union([z.string().url(), z.literal("")]).describe("Original URL where this information was found"),
    urlResolved: z.string().url().optional().describe("Resolved URL after redirects"),
    httpStatus: z.number().int().optional().describe("Last known HTTP status code"),
    lastChecked: z.string().datetime().optional().describe("ISO timestamp when link was last checked"),
    contentHash: z.string().optional().describe("Hash of content for change detection"),
    extractedAt: z.string().datetime().describe("ISO timestamp when data was extracted from source"),
    type: z.enum(["evidence", "related"]).default("related").describe("Type of source: evidence (has facts) or related link"),
    isOfficial: z.boolean().default(false).describe("Is this an official source (e.g. mall website)"),
});

export type Source = z.infer<typeof SourceSchema>;

// Main location schema
export const LocationSchema = z.object({
    id: z.string().describe("Unique identifier for the location"),
    // venueName is the primary name identifier for locations
    venueName: z.string().min(1).optional().describe("Name of the venue/building"),
    venueType: VenueTypeSchema.describe("Type of venue"),
    addressText: z.string().optional().describe("Human-readable address"),
    lat: z.number().min(-90).max(90).describe("Latitude"),
    lng: z.number().min(-180).max(180).describe("Longitude"),
    floor: z.string().optional().describe("Floor level (e.g., 'L1', 'B2', '3')"),
    landmark: z.string().optional().describe("Nearby landmark or directions"),
    hours: z.string().optional().describe("Operating hours if different from venue"),
    amenities: z.array(AmenitySchema).default([]).describe("Available amenities"),
    cost: z.string().default("free").describe("Cost to use (defaults to 'free')"),
    sources: z.array(SourceSchema).min(1).describe("Sources for this location data"),
    evidence: z.array(EvidenceSchema).default([]).describe("Facts extracted from sources"),
    conflicts: z.array(z.string()).default([]).describe("List of fields with conflicting evidence"),
    verifiedAt: z.string().datetime().optional().describe("ISO timestamp when location was last verified"),
    verificationLevel: VerificationLevelSchema.default("unverified").describe("Verification level based on evidence"),
    confidence: z.number().min(0).max(100).default(50).describe("Confidence score (0-100)"),
    status: LocationStatusSchema.default("unverified").describe("Current status of location"),
    notes: z.string().optional().describe("Additional notes or details"),
    isSample: z.boolean().default(false).describe("Mark as sample data (not shown in production UI)"),
});

export type Location = z.infer<typeof LocationSchema>;

// Array of locations schema
export const LocationsDataSchema = z.object({
    locations: z.array(LocationSchema),
    lastUpdated: z.string().datetime().optional().describe("ISO timestamp when data was last updated"),
});

export type LocationsData = z.infer<typeof LocationsDataSchema>;

// For data scraping candidates
export const CandidateLocationSchema = z.object({
    sourceUrl: z.string().url().describe("URL where candidate was found"),
    venueName: z.string().min(1).describe("Venue name"),
    addressText: z.string().optional().describe("Address or location description"),
    floor: z.string().optional().describe("Floor information if available"),
    amenitiesText: z.string().optional().describe("Raw text describing amenities"),
    notes: z.string().optional().describe("Any additional notes"),
    lat: z.number().optional().describe("Latitude if geocoded"),
    lng: z.number().optional().describe("Longitude if geocoded"),
});

export type CandidateLocation = z.infer<typeof CandidateLocationSchema>;

export const CandidatesDataSchema = z.object({
    candidates: z.array(CandidateLocationSchema),
    source: z.string().describe("Source identifier (e.g., 'sgnursingrooms', 'momspumphere')"),
    scrapedAt: z.string().datetime().describe("ISO timestamp when scraping occurred"),
});

export type CandidatesData = z.infer<typeof CandidatesDataSchema>;
