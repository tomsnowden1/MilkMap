
import fs from "fs/promises";
import path from "path";
import { Location, LocationsData } from "../../data/locations.schema";
import { recalculateVerification } from "../../utils/verification";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");

async function main() {
    console.log("Starting evidence migration...");

    // Read locations
    const rawData = await fs.readFile(LOCATIONS_FILE, "utf-8");
    const data: LocationsData = JSON.parse(rawData);

    let updatedCount = 0;

    for (const location of data.locations) {
        let changed = false;

        // 1. Initialize evidence array if missing
        if (!location.evidence) {
            location.evidence = [];
            changed = true;
        }

        // 2. Initialize conflicts array if missing
        if (!location.conflicts) {
            location.conflicts = [];
            changed = true;
        }

        // 3. Update sources with new fields
        if (location.sources) {
            location.sources.forEach(source => {
                // Determine source type/official
                // Simple heuristic for now: anything with "official" in name or known domains
                const lowerName = source.name.toLowerCase();
                const lowerUrl = (source.url || "").toLowerCase();

                if (!source.type) {
                    source.type = "related"; // Default to related until proven evidence
                    changed = true;
                }

                if (source.isOfficial === undefined) {
                    // Primitive official detection
                    source.isOfficial = lowerName.includes("official") ||
                        lowerUrl.includes("changiairport.com") ||
                        lowerUrl.includes("jewelchangiairport.com") ||
                        lowerUrl.includes("capitaland.com") ||
                        lowerUrl.includes("frasersproperty");

                    if (source.isOfficial) {
                        // Official sources imply evidence? Maybe not always, but high trust.
                        source.type = "evidence";
                    }
                    changed = true;
                }
            });
        }

        // 4. Recalculate Verification Level
        // This will strictly downgrade many "verified" to "user-reported" or "unverified"
        // because we haven't extracted specific field evidence yet.
        const prevLevel = location.verificationLevel;
        const updatedLoc = recalculateVerification(location);

        if (prevLevel !== updatedLoc.verificationLevel) {
            console.log(`[${location.venueName}] Status change: ${prevLevel} -> ${updatedLoc.verificationLevel}`);
            location.verificationLevel = updatedLoc.verificationLevel;
            location.confidence = updatedLoc.confidence;
            location.conflicts = updatedLoc.conflicts;
            changed = true;
        }
    }

    if (updatedCount >= 0) { // Always write for now to ensure schema conformity
        data.lastUpdated = new Date().toISOString();
        await fs.writeFile(LOCATIONS_FILE, JSON.stringify(data, null, 4));
        console.log(`Migration complete. Schema updated.`);
    }
}

main().catch(console.error);
