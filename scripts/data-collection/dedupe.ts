/**
 * Deduplication logic
 */

import type { VerifiedRoom, UnverifiedRoom, Feature } from "./types";
import { generateId, venueSimilarity } from "./utils";

/**
 * Deduplicate verified rooms by (venue + floor_level + location_detail)
 */
export function dedupeVerified(rooms: VerifiedRoom[]): VerifiedRoom[] {
    const seen = new Map<string, VerifiedRoom>();

    for (const room of rooms) {
        const key = generateId(room.venue, room.floorLevel, room.locationDetail);

        if (seen.has(key)) {
            // Merge with existing
            const existing = seen.get(key)!;

            // Merge features
            const allFeatures = new Set([...existing.features, ...room.features]);
            existing.features = [...allFeatures] as Feature[];

            // Keep better address
            if (!existing.address && room.address) {
                existing.address = room.address;
            }

            // Keep better postal code
            if (!existing.postalCode && room.postalCode) {
                existing.postalCode = room.postalCode;
            }

            // Keep better location detail
            if (!existing.locationDetail && room.locationDetail) {
                existing.locationDetail = room.locationDetail;
            }

            // Append notes
            if (room.notes && !existing.notes.includes(room.notes)) {
                existing.notes = `${existing.notes}; ${room.notes}`.replace(/^; /, "");
            }
        } else {
            // Clone to avoid mutations
            seen.set(key, { ...room });
        }
    }

    return [...seen.values()];
}

/**
 * Deduplicate unverified rooms
 */
export function dedupeUnverified(rooms: UnverifiedRoom[]): UnverifiedRoom[] {
    const seen = new Map<string, UnverifiedRoom>();

    for (const room of rooms) {
        const key = generateId(room.venue, room.floorLevel, room.locationDetail);

        if (seen.has(key)) {
            // Merge features with existing
            const existing = seen.get(key)!;
            const allFeatures = new Set([...existing.features, ...room.features]);
            existing.features = [...allFeatures] as Feature[];
        } else {
            seen.set(key, { ...room });
        }
    }

    return [...seen.values()];
}

/**
 * Find fuzzy duplicates that might have different names
 */
export function findFuzzyDuplicates(
    rooms: VerifiedRoom[]
): Array<{ room1: VerifiedRoom; room2: VerifiedRoom; similarity: number }> {
    const duplicates: Array<{
        room1: VerifiedRoom;
        room2: VerifiedRoom;
        similarity: number;
    }> = [];

    for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
            const r1 = rooms[i];
            const r2 = rooms[j];

            const similarity = venueSimilarity(r1.venue, r2.venue);

            // Same postal code + high venue similarity = likely duplicate
            if (similarity >= 0.7 && r1.postalCode && r1.postalCode === r2.postalCode) {
                duplicates.push({ room1: r1, room2: r2, similarity });
            }
        }
    }

    return duplicates;
}
