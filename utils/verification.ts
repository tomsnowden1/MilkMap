import { Location, Source, VerificationLevel, Evidence, EvidenceSchema } from "../data/locations.schema";
import { z } from "zod";

/**
 * Check if a source is considered active/valid (status 2xx)
 */
export function isSourceActive(source: Source): boolean {
    if (!source.httpStatus) {
        // Assume valid if URL exists and not marked dead
        return !!source.url || !!source.urlResolved;
    }
    return source.httpStatus >= 200 && source.httpStatus < 300;
}

/**
 * Normalize floor strings to standard format (e.g., "Level 3" -> "L3")
 * Returns empty string if invalid or not found
 */
export function normalizeFloor(input: string): string {
    if (!input) return "";
    let clean = input.trim().toUpperCase();

    // Remote "LEVEL ", "FLOOR ", "BASEMENT " prefixes
    clean = clean.replace(/^(LEVEL|FLOOR|STOREY|LVL|FLR)\s*/, "L");
    clean = clean.replace(/^BASEMENT\s*/, "B");

    // "3F" -> "L3"
    if (clean.match(/^\d+F$/)) {
        clean = "L" + clean.replace("F", "");
    }

    // "3" -> "L3", "B2" -> "B2"
    if (clean.match(/^\d+$/)) {
        clean = "L" + clean;
    }

    return clean;
}

/**
 * Calculate confidence score for a specific field based on evidence
 * - Official source: +50
 * - Verified directory: +30
 * - User submission/other: +10
 * - Max 100
 */
export function calculateFieldConfidence(field: string, evidences: Evidence[], sources: Source[]): number {
    const fieldEvidence = evidences.filter(e => e.field === field);
    if (fieldEvidence.length === 0) return 0;

    let score = 0;
    const contributingSources = new Set<string>();

    for (const ev of fieldEvidence) {
        if (!ev.sourceId || contributingSources.has(ev.sourceId)) continue;

        const source = sources.find(s => s.id === ev.sourceId);
        if (!source || !isSourceActive(source)) continue;

        contributingSources.add(ev.sourceId);

        if (source.isOfficial) score += 50;
        else if (source.type === "evidence") score += 30; // Strong evidence link
        else score += 10;
    }

    return Math.min(score, 100);
}

/**
 * Recalculate verification details for a location
 * Returns updated Location object with new verificationLevel, confidence, and conflicts
 */
export function recalculateVerification(location: Location): Location {
    const activeSources = location.sources.filter(isSourceActive);
    const evidence = location.evidence || [];
    const conflicts: string[] = [];

    // 1. Check for conflicts in key fields (Floor)
    // Group evidence by field
    const floorValues = new Set<string>();

    evidence.filter(e => e.field === "floor").forEach(e => {
        const norm = normalizeFloor(e.value);
        if (norm) floorValues.add(norm);
    });

    // Also check current location value if no evidence for it yet (legacy data)
    if (floorValues.size === 0 && location.floor) {
        const norm = normalizeFloor(location.floor);
        if (norm) floorValues.add(norm);
    }

    // If >1 distinct floor values from *reliable* sources, flag conflict
    // (Simple version: any disagreement is a conflict for now, human review needed)
    if (floorValues.size > 1) {
        conflicts.push("floor");
    }

    // 2. Calculate aggregation confidence
    // Overall confidence is average of available fields or base score
    let totalScore = 0;
    let scoredFields = 0;

    const floorScore = calculateFieldConfidence("floor", evidence, location.sources);
    if (floorScore > 0) { totalScore += floorScore; scoredFields++; }

    // If no specific field evidence, use source count proxy (legacy compat)
    if (scoredFields === 0) {
        totalScore = Math.min(activeSources.length * 25, 50); // Cap at 50 without field evidence
    } else {
        totalScore = totalScore / scoredFields; // Average of fields
    }

    // 3. Determine Verification Level
    // Rule: ≥2 independent active sources -> verified
    // AND NO conflicts
    let level: VerificationLevel = "unverified";

    if (activeSources.length >= 2 && conflicts.length === 0) {
        // Boost strictness: Must have explicit evidence if sources > 2?
        // For now, keep source count rule but ensure no conflicts
        level = "verified";
    } else if (activeSources.length > 0) {
        level = "user-reported";
    }

    return {
        ...location,
        verificationLevel: level,
        confidence: Math.round(totalScore),
        conflicts: conflicts,
        // Update fields if we have a "winner" logic? 
        // For now, we don't auto-update fields, just status. 
        // We let humans resolve conflicts listed in `conflicts`.
    };
}

export function hasConflicts(location: Location): boolean {
    return (location.conflicts && location.conflicts.length > 0);
}
