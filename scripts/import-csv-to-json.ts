/**
 * Import CSV data into locations.json
 * Maps CSV fields to the LocationSchema format
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Feature mapping from CSV to schema
const featureMap: Record<string, string> = {
    'breastfeeding_area': 'nursing_chair',
    'changing_table': 'changing_table',
    'hot_water_dispenser': 'hot_water',
    'private_room': 'private_room',
    'sink': 'sink',
    'bottle_warmer': 'microwave', // closest match
    'microwave': 'microwave',
    'stroller_space': 'other',
    'wheelchair_accessible': 'other',
};

// Venue type mapping
const venueTypeMap: Record<string, string> = {
    'mall': 'mall',
    'airport': 'mall',
    'attraction': 'attraction',
    'hospital': 'other',
    'transit': 'other',
    'community': 'other',
    'library': 'other',
};

// Read CSV
const csvPath = join(__dirname, '../data/nursing_rooms_sg.csv');
const csvContent = readFileSync(csvPath, 'utf-8');

const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
});

console.log(`Loaded ${records.length} rooms from CSV`);

// Transform to locations.json format matching LocationSchema
const locations = records.map((row: any) => {
    const features = row.features.split(',').map((f: string) => f.trim());
    const mappedAmenities = features
        .map((f: string) => featureMap[f])
        .filter((a: string | undefined) => a && a !== 'other');

    return {
        id: row.id,
        venueName: row.venue,
        venueType: venueTypeMap[row.venue_type] || 'other',
        addressText: `${row.address}, ${row.postal_code}`,
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
        floor: row.floor_level,
        landmark: row.location_detail,
        hours: row.opening_hours,
        amenities: mappedAmenities,
        sources: [
            {
                name: 'Website',
                url: row.source_url_1,
                extractedAt: row.last_verified_at,
            },
            {
                name: 'Website',
                url: row.source_url_2,
                extractedAt: row.last_verified_at,
            },
        ],
        lastVerifiedAt: row.last_verified_at,
        status: 'active' as const,
        isSample: false,
    };
});

// Wrap in object with locations array
const output = {
    locations: locations,
    lastUpdated: new Date().toISOString(),
};

// Write to locations.json
const outputPath = join(__dirname, '../data/locations.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Wrote ${locations.length} locations to ${outputPath}`);
console.log('\nSample location:');
console.log(JSON.stringify(locations[0], null, 2));
