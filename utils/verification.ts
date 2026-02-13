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
 * Calculate confidence score and determine verification tier
 */
export function recalculateVerification(location: Location): Location {
    const activeSources = location.sources.filter(isSourceActive);
    const evidence = location.evidence || [];
    const conflicts: string[] = [];

    // 1. Conflict Detection (Floor)
    const floorValues = new Set<string>();
    evidence.filter(e => e.field === "floor").forEach(e => {
        const norm = normalizeFloor(e.value);
        if (norm) floorValues.add(norm);
    });

    // Check legacy floor if no evidence
    if (floorValues.size === 0 && location.floor) {
        const norm = normalizeFloor(location.floor);
        if (norm) floorValues.add(norm);
    }

    if (floorValues.size > 1) {
        conflicts.push("floor");
    }

    // 2. Evidence Tiers Analysis
    // Tier A: Official sources (e.g. mall website)
    const tierASources = activeSources.filter(s => s.isOfficial);

    // Tier B: Strong Evidence Directories (e.g. specialized nursing room maps)
    const tierBSources = activeSources.filter(s => !s.isOfficial && s.type === "evidence");

    // Tier C: General/User mentions
    const tierCSources = activeSources.filter(s => !s.isOfficial && s.type !== "evidence");

    // 3. Calculate Confidence Score (0-100)
    let score = 0;

    // Base score from sources
    score += (tierASources.length * 50); // Official is huge trust
    score += (tierBSources.length * 30); // Directories are trusted
    score += (tierCSources.length * 10); // Mentions count for a little

    // Penalize conflicts
    if (conflicts.length > 0) {
        score -= 20;
    }

    // Cap at 100
    score = Math.min(Math.max(score, 0), 100);

    // 4. Determine Verification Level
    // STRICT rules:
    // - Verified: (1+ Tier A) OR (2+ Tier B) AND No Conflicts
    let level: VerificationLevel = "unverified";

    const hasTierA = tierASources.length > 0;
    const hasStrongTierB = tierBSources.length >= 2;
    // const hasEnoughTierC = tierCSources.length >= 4; // Maybe later

    if (conflicts.length === 0) {
        if (hasTierA) {
            level = "verified";
        } else if (hasStrongTierB) {
            level = "verified";
        } else if (activeSources.length > 0) {
            level = "user-reported";
        }
    } else {
        // Conflicts exist -> cannot be fully verified without human review
        level = "user-reported";
    }

    // Special case: If score is very high (>80) but we have minor conflicts, maybe still 'user-reported'
    // For now, simple logic is fine.

    return {
        ...location,
        verificationLevel: level,
        confidence: score,
        conflicts: conflicts,
    };
}

/**
 * Calculate field confidence (Updated for Tiers)
 */
export function calculateFieldConfidence(field: string, evidences: Evidence[], sources: Source[]): number {
    // Re-use logic or simplify since we now have global confidence
    // For now, let's keep it consistent with the global scoring weights
    const fieldEvidence = evidences.filter(e => e.field === field);
    if (fieldEvidence.length === 0) return 0;

    let score = 0;
    const contributingSources = new Set<string>();

    for (const ev of fieldEvidence) {
        if (!ev.sourceId || contributingSources.has(ev.sourceId)) continue;
        const source = sources.find(s => s.id === ev.sourceId);
        if (!source || !isSourceActive(source)) continue;

        contributingSources.add(ev.sourceId);

        if (source.isOfficial) score += 50;       // Tier A
        else if (source.type === "evidence") score += 30; // Tier B
        else score += 10;                         // Tier C
    }

    return Math.min(score, 100);
}

export function hasConflicts(location: Location): boolean {
    return (location.conflicts && location.conflicts.length > 0);
}
