import { Location, Source, VerificationLevel } from "../data/locations.schema";

/**
 * Check if a source is considered active/valid
 */
export function isSourceActive(source: Source): boolean {
    if (!source.httpStatus) {
        // Assume valid if URL exists
        return !!source.url || !!source.urlResolved;
    }
    // Consider 2xx status as active
    return source.httpStatus >= 200 && source.httpStatus < 300;
}

/**
 * Calculate the verification level of a location based on its sources
 */
export function calculateVerificationLevel(location: Location): VerificationLevel {
    // If no sources, definitely unverified
    if (!location.sources || location.sources.length === 0) {
        return "unverified";
    }

    const activeSources = location.sources.filter(isSourceActive);

    // Rule: ≥2 independent active sources -> verified
    if (activeSources.length >= 2) {
        return "verified";
    }

    // Rule: 1 active source -> user-reported
    if (activeSources.length > 0) {
        return "user-reported";
    }

    return "unverified";
}

/**
 * Check for conflicts between sources (stub for now)
 */
export function hasConflicts(location: Location): boolean {
    // TODO: Implement field-level comparison
    return false;
}
