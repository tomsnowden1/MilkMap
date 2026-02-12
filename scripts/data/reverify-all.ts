
import fs from "fs";
import path from "path";
import { Location, LocationsData } from "../../data/locations.schema";
import { recalculateVerification } from "../../utils/verification";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");

async function main() {
    console.log("Starting Full Data Reverification...");

    // Load Locations
    if (!fs.existsSync(LOCATIONS_FILE)) {
        console.error("Locations file not found!");
        process.exit(1);
    }
    const locationsRaw = fs.readFileSync(LOCATIONS_FILE, "utf-8");
    const data: LocationsData = JSON.parse(locationsRaw);

    let updatedCount = 0;
    let verifiedCount = 0;
    let conflictCount = 0;
    let missingEvidenceCount = 0;

    for (let i = 0; i < data.locations.length; i++) {
        const loc = data.locations[i];

        // Preserve ID and other static fields, update verification derived fields
        const oldLevel = loc.verificationLevel;
        const oldConf = loc.confidence;
        const oldConflicts = JSON.stringify(loc.conflicts || []);

        const verificationResult = recalculateVerification(loc);

        // Apply updates
        loc.verificationLevel = verificationResult.verificationLevel;
        loc.confidence = verificationResult.confidence;
        loc.conflicts = verificationResult.conflicts;

        // Check for changes
        const newConflicts = JSON.stringify(loc.conflicts || []);
        if (oldLevel !== loc.verificationLevel || oldConf !== loc.confidence || oldConflicts !== newConflicts) {
            updatedCount++;
        }

        // Stats
        if (loc.verificationLevel === "verified") verifiedCount++;
        if (loc.conflicts && loc.conflicts.length > 0) conflictCount++;
        if (loc.verificationLevel === "unverified" && loc.status !== "reported_closed") missingEvidenceCount++;
    }

    // Save
    if (updatedCount > 0) {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(data, null, 4));
        console.log(`\n✅ Saved locations.json. Updated ${updatedCount} records.`);
    } else {
        console.log("\nNo changes needed.");
    }

    console.log(`\n=== Verification Summary ===`);
    console.log(`Total Locations: ${data.locations.length}`);
    console.log(`- Verified: ${verifiedCount}`);
    console.log(`- Conflicts: ${conflictCount}`);
    console.log(`- Missing Evidence: ${missingEvidenceCount}`);
}

main().catch(console.error);
