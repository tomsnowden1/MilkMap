/**
 * Verification logic - cross-reference candidates between sources
 */

import type { RawCandidate, MatchResult, VerifiedRoom, UnverifiedRoom, Feature } from "./types";
import {
    areSameRoom,
    generateId,
    determineRegion,
    mergeFeatures,
    normalizeFeatures,
} from "./utils";

/**
 * Find all matching pairs between two source lists
 */
export function findMatches(
    source1: RawCandidate[],
    source2: RawCandidate[]
): MatchResult[] {
    const matches: MatchResult[] = [];

    for (const c1 of source1) {
        for (const c2 of source2) {
            const result = areSameRoom(c1, c2);
            if (result.match) {
                matches.push({
                    candidate1: c1,
                    candidate2: c2,
                    matchScore: result.score,
                    matchReason: result.reason,
                });
            }
        }
    }

    // Sort by score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
}

/**
 * Cross-reference all candidates and split into verified vs unverified
 */
export function verifyAndSplit(
    allCandidates: RawCandidate[]
): {
    verified: VerifiedRoom[];
    unverified: UnverifiedRoom[];
    matches: MatchResult[];
} {
    console.log(`[Verify] Processing ${allCandidates.length} total candidates...`);

    // Group candidates by source
    const bySource = new Map<string, RawCandidate[]>();
    for (const c of allCandidates) {
        const source = new URL(c.sourceUrl).hostname;
        if (!bySource.has(source)) {
            bySource.set(source, []);
        }
        bySource.get(source)!.push(c);
    }

    console.log(`[Verify] Candidates from ${bySource.size} different sources`);

    // Find all cross-source matches
    const allMatches: MatchResult[] = [];
    const sources = [...bySource.keys()];

    for (let i = 0; i < sources.length; i++) {
        for (let j = i + 1; j < sources.length; j++) {
            const matches = findMatches(
                bySource.get(sources[i])!,
                bySource.get(sources[j])!
            );
            allMatches.push(...matches);
        }
    }

    console.log(`[Verify] Found ${allMatches.length} potential matches`);

    // Track which candidates have been matched
    const matchedUrls = new Set<string>();

    // Build verified rooms from matches
    const verified: VerifiedRoom[] = [];

    for (const match of allMatches) {
        // Skip if either candidate already used
        if (
            matchedUrls.has(match.candidate1.sourceUrl) ||
            matchedUrls.has(match.candidate2.sourceUrl)
        ) {
            continue;
        }

        // Mark as matched
        matchedUrls.add(match.candidate1.sourceUrl);
        matchedUrls.add(match.candidate2.sourceUrl);

        const c1 = match.candidate1;
        const c2 = match.candidate2;

        // Merge data from both sources
        const features = mergeFeatures([c1, c2]);
        const venue = c1.venue.length >= c2.venue.length ? c1.venue : c2.venue;
        const address = c1.address || c2.address || "";
        const postalCode = c1.postalCode || c2.postalCode || "";
        const floorLevel = c1.floorLevel || c2.floorLevel || "";
        const locationDetail = c1.locationDetail || c2.locationDetail || "";

        verified.push({
            id: generateId(venue, floorLevel, locationDetail),
            name: `Nursing Room at ${venue}`,
            venue,
            venueType: c1.venueType || c2.venueType || "other",
            address,
            postalCode,
            region: determineRegion(address || venue),
            areaAccess: "public",
            floorLevel,
            locationDetail,
            latitude: null, // Will be geocoded later
            longitude: null,
            features: features as Feature[],
            openingHours: c1.openingHours || c2.openingHours || "",
            sourceUrl1: c1.sourceUrl,
            sourceUrl2: c2.sourceUrl,
            lastVerifiedAt: new Date().toISOString(),
            notes: `Matched: ${match.matchReason}`,
        });
    }

    // Build unverified list from remaining candidates
    const unverified: UnverifiedRoom[] = [];

    for (const c of allCandidates) {
        if (matchedUrls.has(c.sourceUrl)) continue;

        const features = normalizeFeatures(c.features);

        unverified.push({
            id: generateId(c.venue, c.floorLevel),
            name: c.name,
            venue: c.venue,
            venueType: c.venueType || "other",
            address: c.address || "",
            postalCode: c.postalCode || "",
            region: determineRegion(c.address || c.venue),
            floorLevel: c.floorLevel || "",
            locationDetail: c.locationDetail || "",
            latitude: null,
            longitude: null,
            features: features as Feature[],
            openingHours: c.openingHours || "",
            sourceUrl: c.sourceUrl,
            sourceName: c.sourceName,
            extractedAt: c.extractedAt,
            notes: c.notes || "",
        });
    }

    console.log(`[Verify] Result: ${verified.length} verified, ${unverified.length} unverified`);

    return { verified, unverified, matches: allMatches };
}
