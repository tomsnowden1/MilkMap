/**
 * Utility functions for data normalization and matching
 */

import {
    FEATURE_MAPPINGS,
    VALID_FEATURES,
    SINGAPORE_REGIONS,
    VENUE_TYPES,
} from "./config";
import type { Feature, RawCandidate } from "./types";

/**
 * Normalize a feature string to a valid token
 */
export function normalizeFeature(raw: string): Feature | null {
    const lower = raw.toLowerCase().trim();

    // Check direct mappings first
    if (FEATURE_MAPPINGS[lower]) {
        return FEATURE_MAPPINGS[lower] as Feature;
    }

    // Check if it's already a valid token
    if ((VALID_FEATURES as readonly string[]).includes(lower)) {
        return lower as Feature;
    }

    // Fuzzy match - check if any mapping key is contained in the input
    for (const [key, value] of Object.entries(FEATURE_MAPPINGS)) {
        if (lower.includes(key) || key.includes(lower)) {
            return value as Feature;
        }
    }

    return null;
}

/**
 * Normalize an array of feature strings
 */
export function normalizeFeatures(features: string[]): Feature[] {
    const normalized = new Set<Feature>();

    for (const f of features) {
        const norm = normalizeFeature(f);
        if (norm) {
            normalized.add(norm);
        }
    }

    return [...normalized];
}

/**
 * Determine Singapore region from address
 */
export function determineRegion(address: string): string {
    const lower = address.toLowerCase();

    for (const [region, keywords] of Object.entries(SINGAPORE_REGIONS)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return region;
            }
        }
    }

    return "unknown";
}

/**
 * Determine venue type from name/description
 */
export function determineVenueType(text: string): string {
    const lower = text.toLowerCase();

    for (const [type, keywords] of Object.entries(VENUE_TYPES)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return type;
            }
        }
    }

    return "other";
}

/**
 * Generate a stable ID from venue + floor + location
 */
export function generateId(
    venue: string,
    floorLevel?: string,
    locationDetail?: string
): string {
    const parts = [venue, floorLevel || "", locationDetail || ""]
        .map((p) =>
            p
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
        )
        .filter(Boolean);

    return parts.join("_");
}

/**
 * Clean and normalize a venue name
 */
export function normalizeVenueName(name: string): string {
    return name
        .trim()
        .replace(/\s+/g, " ") // Normalize whitespace
        .replace(/^(the|a|an)\s+/i, "") // Remove articles
        .replace(/\s*(shopping\s*)?(mall|centre|center|plaza)$/i, "") // Remove common suffixes
        .trim();
}

/**
 * Calculate similarity score between two venue names (0-1)
 */
export function venueSimilarity(name1: string, name2: string): number {
    const norm1 = normalizeVenueName(name1).toLowerCase();
    const norm2 = normalizeVenueName(name2).toLowerCase();

    if (norm1 === norm2) return 1.0;

    // Check if one contains the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
        return 0.9;
    }

    // Simple word overlap ratio
    const words1 = new Set(norm1.split(/\s+/));
    const words2 = new Set(norm2.split(/\s+/));
    const intersection = [...words1].filter((w) => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return intersection / union;
}

/**
 * Check if two candidates likely refer to the same room
 */
export function areSameRoom(
    c1: RawCandidate,
    c2: RawCandidate
): { match: boolean; score: number; reason: string } {
    // Must be from different sources
    if (c1.sourceUrl === c2.sourceUrl) {
        return { match: false, score: 0, reason: "same_source" };
    }

    // Check venue name similarity
    const venueSim = venueSimilarity(c1.venue, c2.venue);
    if (venueSim < 0.5) {
        return { match: false, score: venueSim, reason: "venue_mismatch" };
    }

    // If both have floor levels, they should match
    if (c1.floorLevel && c2.floorLevel) {
        const floor1 = c1.floorLevel.toLowerCase().replace(/[^a-z0-9]/g, "");
        const floor2 = c2.floorLevel.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (floor1 !== floor2) {
            // Different floors = different rooms
            return { match: false, score: 0.3, reason: "floor_mismatch" };
        }
    }

    // Calculate overall score
    let score = venueSim;
    let reason = `venue_match:${venueSim.toFixed(2)}`;

    // Bonus for matching floor
    if (c1.floorLevel && c2.floorLevel) {
        score += 0.2;
        reason += "+floor_match";
    }

    // Bonus for matching postal code
    if (
        c1.postalCode &&
        c2.postalCode &&
        c1.postalCode === c2.postalCode
    ) {
        score += 0.2;
        reason += "+postal_match";
    }

    return {
        match: score >= 0.7,
        score: Math.min(score, 1.0),
        reason,
    };
}

/**
 * Merge features from multiple candidates
 */
export function mergeFeatures(candidates: RawCandidate[]): Feature[] {
    const allFeatures = new Set<Feature>();

    for (const c of candidates) {
        const normalized = normalizeFeatures(c.features);
        normalized.forEach((f) => allFeatures.add(f));
    }

    return [...allFeatures];
}

/**
 * Extract postal code from Singapore address
 */
export function extractPostalCode(address: string): string | undefined {
    // Singapore postal codes are 6 digits
    const match = address.match(/\b(\d{6})\b/);
    return match ? match[1] : undefined;
}

/**
 * Clean text by removing extra whitespace and HTML entities
 */
export function cleanText(text: string): string {
    return text
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
}
