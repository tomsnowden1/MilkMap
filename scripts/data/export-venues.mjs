
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const INPUT_FILE = path.resolve('data/locations.json');
const OUTPUT_FILE = path.resolve('data/venues_export.csv');

// Regex for 6-digit postal code (Singapore specific context)
const POSTAL_REGEX = /\b(\d{6})\b/;

function loadData() {
    try {
        const raw = fs.readFileSync(INPUT_FILE, 'utf8');
        const data = JSON.parse(raw);
        return data;
    } catch (err) {
        console.error("Error reading locations.json:", err.message);
        process.exit(1);
    }
}

function flattenData(data) {
    if (Array.isArray(data)) {
        // could be array of objects or array of arrays
        return data.flatMap(item => {
            if (Array.isArray(item)) return flattenData(item);
            return item;
        });
    } else if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data.locations)) {
            return flattenData(data.locations);
        }
        // single object? treat as one record
        return [data];
    }
    return [];
}

function normalizeRecord(record) {
    if (!record || typeof record !== 'object') return null;

    // Extract fields with fallbacks
    const venueName = (record.venueName || record.venue_name || record.venue || record.name || "").trim();
    const address = (record.addressText || record.address || record.venue_address || record.location?.address || "").trim();

    // Postal Code: try explicit field, then extract from address
    let postalCode = (record.postalCode || record.postal_code || record.postal || "").trim();
    if (!postalCode && address) {
        const match = address.match(POSTAL_REGEX);
        if (match) {
            postalCode = match[1];
        }
    }

    const floor = (record.floor || record.floor_level || "").trim();
    const landmark = (record.landmark || record.directions || "").trim();

    // ID: Use existing or generate stable hash
    let locationId = (record.id || record.location_id || "").trim();
    if (!locationId) {
        // Deterministic hash based on core fields
        const key = `${venueName}|${postalCode}|${floor}|${landmark}`.toLowerCase();
        locationId = crypto.createHash('md5').update(key).digest('hex');
    }

    // Return finalized object
    return {
        venue_name: venueName,
        address: address,
        postal_code: postalCode,
        floor: floor,
        landmark: landmark,
        location_id: locationId
    };
}

function toCsvLine(fields) {
    return fields.map(f => {
        // Escape quotes by doubling them
        const escaped = String(f).replace(/"/g, '""');
        // Wrap in quotes if contains comma, quote, or newline
        if (/["\n,]/.test(escaped)) {
            return `"${escaped}"`;
        }
        return escaped; // or just always quote for safety? The prompt asks for proper quoting.
        // Simple strategy: explicitly quote if needed, otherwise safe.
        // Actually simpler to just wrap in quotes if it has any special char.
        return `"${escaped}"`;
    }).join(',');
}

function main() {
    console.log(`Loading ${INPUT_FILE}...`);
    const data = loadData();

    const flatRecords = flattenData(data);
    console.log(`Found ${flatRecords.length} raw records.`);

    const processed = flatRecords
        .map(normalizeRecord)
        .filter(r => r !== null && (r.venue_name || r.address)); // Ensure some content exists

    // Deduplication
    const seen = new Set();
    const uniqueRecords = [];

    for (const rec of processed) {
        // Unique key: venue_name + postal_code + floor + landmark
        const key = `${rec.venue_name}|${rec.postal_code}|${rec.floor}|${rec.landmark}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        uniqueRecords.push(rec);
    }

    console.log(`Unique records after deduplication: ${uniqueRecords.length}`);

    // Sort by venue_name then postal_code
    uniqueRecords.sort((a, b) => {
        const nameComp = a.venue_name.localeCompare(b.venue_name);
        if (nameComp !== 0) return nameComp;
        return a.postal_code.localeCompare(b.postal_code);
    });

    // CSV Output
    const headers = ['venue_name', 'address', 'postal_code', 'floor', 'landmark', 'location_id'];
    const lines = [headers.join(',')];

    for (const rec of uniqueRecords) {
        const values = [
            rec.venue_name,
            rec.address,
            rec.postal_code,
            rec.floor,
            rec.landmark,
            rec.location_id
        ];
        lines.push(toCsvLine(values));
    }

    fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
    console.log(`Exported to ${OUTPUT_FILE}`);
}

main();
