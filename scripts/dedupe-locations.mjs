/**
 * Deduplication + data quality fixes for locations.json
 * 
 * What this script does:
 * 1. Remove AMK Hub duplicate (keep first, richer entry)
 * 2. Merge Tiong Bahru Plaza into one entry with rooms[]
 * 3. Merge VivoCity into one entry with rooms[]
 * 4. Fix i12 Katong: correct floor conflict → rooms[] (L3 + L4)
 * 
 * Evidence:
 * - Tiong Bahru Plaza: official map shows 4 rooms (Level 2, B1 confirmed)
 * - i12 Katong: MomsPumpHere says L3 + L4
 * - VivoCity: existing data has B2 + L2 as separate entries
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, '..', 'data', 'locations.json');

const raw = JSON.parse(readFileSync(dataPath, 'utf-8'));
const locations = raw.locations;

const before = locations.length;
console.log(`Before: ${before} locations`);

// --- Helper: merge sources, deduping by URL ---
function mergeSources(sourcesA, sourcesB) {
    const seen = new Set();
    const merged = [];
    for (const s of [...sourcesA, ...sourcesB]) {
        const key = s.url || s.id;
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(s);
        }
    }
    return merged;
}

// --- Helper: union string arrays ---
function unionArrays(a, b) {
    return [...new Set([...a, ...b])];
}

// ============================================================
// 1. AMK Hub: remove duplicate (same id "amk-hub-l3")
// ============================================================
{
    const indices = [];
    locations.forEach((loc, i) => {
        if (loc.id === 'amk-hub-l3') indices.push(i);
    });
    if (indices.length > 1) {
        // Keep the FIRST (richer sources, higher confidence), remove the rest
        const first = locations[indices[0]];
        for (let k = 1; k < indices.length; k++) {
            const dup = locations[indices[k]];
            // Merge sources into first
            first.sources = mergeSources(first.sources, dup.sources);
            first.amenities = unionArrays(first.amenities, dup.amenities);
            if (dup.confidence > first.confidence) first.confidence = dup.confidence;
        }
        // Mark duplicates for removal (reverse order)
        for (let k = indices.length - 1; k >= 1; k--) {
            locations.splice(indices[k], 1);
        }
        console.log(`AMK Hub: removed ${indices.length - 1} duplicate(s)`);
    }
}

// ============================================================
// 2. Tiong Bahru Plaza: merge into one with rooms[]
// ============================================================
{
    const indices = [];
    locations.forEach((loc, i) => {
        if (loc.venueName === 'Tiong Bahru Plaza') indices.push(i);
    });
    if (indices.length > 1) {
        // Use first as base
        const base = locations[indices[0]];

        // Merge all sources
        for (let k = 1; k < indices.length; k++) {
            const dup = locations[indices[k]];
            base.sources = mergeSources(base.sources, dup.sources);
            base.amenities = unionArrays(base.amenities, dup.amenities);
        }

        // Convert to multi-room (evidence: official map shows 4 rooms)
        base.id = 'tiong-bahru-plaza';
        base.addressText = '302 Tiong Bahru Road, Singapore, 168732';
        base.floor = '2, B1';  // Summary from confirmed evidence
        base.landmark = 'Multiple nursing rooms';
        base.hours = '10:00 - 22:00';
        base.rooms = [
            { id: 'tbp-l2', floor: 'Level 2', landmark: 'Near restrooms' },
            { id: 'tbp-b1', floor: 'Basement 1' },
        ];
        base.notes = 'Official map shows 4 nursing rooms. 2 additional locations need evidence.';
        base.verificationLevel = 'verified';
        base.confidence = 60;

        // Update official source
        const officialSource = base.sources.find(s => s.url?.includes('tiongbahruplaza.com.sg'));
        if (officialSource) {
            officialSource.name = 'Tiong Bahru Plaza Official';
            officialSource.type = 'evidence';
            officialSource.isOfficial = true;
            officialSource.httpStatus = 200;
            officialSource.evidenceDeepLinkUrl = 'https://www.tiongbahruplaza.com.sg/map';
        }

        // Remove duplicates (reverse order)
        for (let k = indices.length - 1; k >= 1; k--) {
            locations.splice(indices[k], 1);
        }
        console.log(`Tiong Bahru Plaza: merged ${indices.length} entries → 1 with rooms[]`);
    }
}

// ============================================================
// 3. VivoCity: merge B2 + L2 into one with rooms[]
// ============================================================
{
    const indices = [];
    locations.forEach((loc, i) => {
        if (loc.venueName === 'VivoCity') indices.push(i);
    });
    if (indices.length > 1) {
        const base = locations[indices[0]]; // vivocity-b2
        const other = locations[indices[1]]; // vivocity-l2

        base.id = 'vivocity';
        base.floor = 'B2, L2';
        base.landmark = 'Multiple nursing rooms';
        base.rooms = [
            {
                id: 'vivocity-b2',
                floor: 'Basement 2',
                landmark: "Near Toys 'R' Us",
                amenities: base.amenities,
            },
            {
                id: 'vivocity-l2',
                floor: 'Level 2',
                landmark: 'Near playground',
                amenities: other.amenities,
            },
        ];
        base.amenities = unionArrays(base.amenities, other.amenities);
        base.sources = mergeSources(base.sources, other.sources);
        if (other.confidence > base.confidence) base.confidence = other.confidence;

        // Remove second entry
        const removeIdx = locations.findIndex(l => l === other);
        if (removeIdx !== -1) locations.splice(removeIdx, 1);

        console.log('VivoCity: merged 2 entries → 1 with rooms[]');
    }
}

// ============================================================
// 4. i12 Katong: fix floor conflict → rooms[] L3 + L4
//    Evidence: MomsPumpHere says L3 (before restrooms) + L4 (next to male restroom)
// ============================================================
{
    const idx = locations.findIndex(l => l.id === 'katong-i12-l2');
    if (idx !== -1) {
        const loc = locations[idx];
        loc.id = 'i12-katong';
        loc.floor = '3, 4';
        loc.landmark = 'Multiple nursing rooms';
        loc.rooms = [
            {
                id: 'i12-l3',
                floor: 'Level 3',
                landmark: 'Before the entrance to the restrooms',
            },
            {
                id: 'i12-l4',
                floor: 'Level 4',
                landmark: 'Next to the male restroom',
            },
        ];
        // Clear the conflict — resolved by evidence
        loc.conflicts = [];
        loc.evidence = [
            {
                field: 'floor',
                value: 'L3, L4',
                rawValue: 'Level 3, before the entrance to the restrooms / Level 4, next to the male restroom',
                sourceId: 'bfa95c16-346d-40bd-888b-042ee746c882',  // Directory Listing (MomsPumpHere)
                confidence: 80,
                updatedAt: new Date().toISOString(),
            },
        ];
        loc.verificationLevel = 'verified';
        loc.confidence = 80;
        loc.status = 'active';

        // Update the MomsPumpHere source with deep link
        const mphSource = loc.sources.find(s => s.url?.includes('momspumphere'));
        if (mphSource) {
            mphSource.type = 'evidence';
            mphSource.evidenceDeepLinkUrl = 'https://www.momspumphere.com/places/place/details/3729_i12-katong-breastfeeding-room-singapore';
        }

        // Mark "Official Guide" as unreachable (httpStatus: 0)
        const officialGuide = loc.sources.find(s => s.name === 'Official Guide');
        if (officialGuide) {
            officialGuide.type = 'related';  // can't reach it, downgrade
        }

        console.log('i12 Katong: floor conflict resolved → rooms[] L3 + L4');
    }
}

const after = locations.length;
console.log(`After: ${after} locations (removed ${before - after})`);

// Write back
writeFileSync(dataPath, JSON.stringify(raw, null, 4) + '\n', 'utf-8');
console.log('Written to', dataPath);
