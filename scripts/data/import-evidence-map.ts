
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { parse } from "csv-parse/sync";
import { Location, LocationsData, Source } from "../../data/locations.schema";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");
const EVIDENCE_MAP_FILE = path.resolve(process.cwd(), "data/venue_evidence_map.csv");

// Helper to normalize strings for matching
function normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function main() {
    console.log("Starting Evidence Map Import...");

    // Load Locations
    if (!fs.existsSync(LOCATIONS_FILE)) {
        console.error("Locations file not found!");
        process.exit(1);
    }
    const locationsRaw = fs.readFileSync(LOCATIONS_FILE, "utf-8");
    const data: LocationsData = JSON.parse(locationsRaw);

    // Load CSV
    if (!fs.existsSync(EVIDENCE_MAP_FILE)) {
        console.error("Evidence map file not found!");
        process.exit(1);
    }
    const csvRaw = fs.readFileSync(EVIDENCE_MAP_FILE, "utf-8");

    // Parse with explicit typing
    const records = parse(csvRaw, {
        columns: true,
        skip_empty_lines: true
    }) as any[];

    console.log(`Loaded ${records.length} CSV records.`);

    let matchedCount = 0;
    let sourcesAdded = 0;
    let unmatched: string[] = [];

    for (const row of records) {
        const postal = row.postal_code ? String(row.postal_code).trim() : "";
        const venueName = row.venue_name ? String(row.venue_name).trim() : "";

        if (!postal && !venueName) continue;

        // Find matching location
        let match: Location | undefined;

        if (postal) {
            match = data.locations.find(l => {
                return l.addressText?.includes(postal);
            });
        }

        if (!match && venueName) {
            const target = normalize(venueName);
            match = data.locations.find(l => normalize(l.venueName || "") === target);
        }

        if (match) {
            matchedCount++;

            // Process Evidence 1
            if (row.evidence_url_1) {
                if (addSource(match, String(row.evidence_url_1), String(row.evidence_type_1), String(row.extracted_hints_1))) {
                    sourcesAdded++;
                }
            }

            // Process Evidence 2
            if (row.evidence_url_2) {
                if (addSource(match, String(row.evidence_url_2), String(row.evidence_type_2), String(row.extracted_hints_2))) {
                    sourcesAdded++;
                }
            }

        } else {
            unmatched.push(`${venueName} (${postal})`);
        }
    }

    // Save
    if (sourcesAdded > 0) {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(data, null, 4));
        console.log(`\n✅ Saved locations.json. Added ${sourcesAdded} new sources.`);
    } else {
        console.log("\nNo new sources to add.");
    }

    console.log(`\nSummary:`);
    console.log(`- Matched Locations: ${matchedCount}`);
    console.log(`- Unmatched Rows: ${unmatched.length}`);
    if (unmatched.length > 0) {
        console.log("Top unmatched:", unmatched.slice(0, 5));
    }
}

function addSource(location: Location, url: string, type: string, hints: string): boolean {
    if (!url) return false;

    // Check if source exists (dedupe by URL)
    const cleanUrl = url.trim().replace(/\/$/, "");

    const exists = location.sources.some(s => {
        const sUrl = (s.url || "").trim().replace(/\/$/, "");
        const sRes = (s.urlResolved || "").trim().replace(/\/$/, "");
        return sUrl === cleanUrl || sRes === cleanUrl;
    });

    if (exists) return false;

    // Create new source
    const isOfficial = type?.toLowerCase().includes("official");
    const sourceType = isOfficial ? "evidence" : "related";

    const newSource: Source = {
        id: crypto.randomUUID(),
        name: isOfficial ? "Official Source" : "Directory Listing",
        url: url.trim(),
        type: sourceType as "evidence" | "related",
        isOfficial: isOfficial,
        extractedAt: new Date().toISOString()
    };

    location.sources.push(newSource);
    return true;
}

main().catch(console.error);
