/**
 * TypeScript types for data collection
 */

import type { VALID_FEATURES } from "./config";

// Normalized feature type
export type Feature = (typeof VALID_FEATURES)[number];

// Raw candidate from a single source
export interface RawCandidate {
    name: string;
    venue: string;
    venueType?: string;
    address?: string;
    postalCode?: string;
    floorLevel?: string;
    locationDetail?: string;
    features: string[]; // Raw, not normalized yet
    openingHours?: string;
    sourceUrl: string;
    sourceName: string;
    extractedAt: string;
    notes?: string;
}

// Geocoded location
export interface GeocodedLocation {
    latitude: number;
    longitude: number;
    confidence: "high" | "medium" | "low";
    source: "onemap" | "osm" | "manual";
}

// Verified room with 2+ sources
export interface VerifiedRoom {
    id: string;
    name: string;
    venue: string;
    venueType: string;
    address: string;
    postalCode: string;
    region: string;
    areaAccess: string; // "public" | "ticketed" | "members" | "patients"
    floorLevel: string;
    locationDetail: string;
    latitude: number | null;
    longitude: number | null;
    features: Feature[];
    openingHours: string;
    sourceUrl1: string;
    sourceUrl2: string;
    lastVerifiedAt: string;
    notes: string;
}

// Unverified room (single source only)
export interface UnverifiedRoom {
    id: string;
    name: string;
    venue: string;
    venueType: string;
    address: string;
    postalCode: string;
    region: string;
    floorLevel: string;
    locationDetail: string;
    latitude: number | null;
    longitude: number | null;
    features: Feature[];
    openingHours: string;
    sourceUrl: string;
    sourceName: string;
    extractedAt: string;
    notes: string;
}

// Source attribution row
export interface SourceRow {
    roomId: string;
    sourceUrl: string;
    sourceName: string;
    extractedAt: string;
    notes: string;
}

// Geocoding result from APIs
export interface GeocodeResult {
    latitude: number;
    longitude: number;
    matchedAddress: string;
    confidence: number;
}

// Crawler response
export interface CrawlResult {
    url: string;
    html: string;
    statusCode: number;
    fetchedAt: string;
}

// Verification match result
export interface MatchResult {
    candidate1: RawCandidate;
    candidate2: RawCandidate;
    matchScore: number;
    matchReason: string;
}
