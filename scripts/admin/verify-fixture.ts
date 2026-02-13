
import fs from "fs/promises";
import path from "path";
import { Location, LocationsData } from "../../data/locations.schema";
import { recalculateVerification } from "../../utils/verification";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");

async function main() {
    console.log("Creating i12 Katong fixture for manual UI verification...");

    // Read locations
    const rawData = await fs.readFile(LOCATIONS_FILE, "utf-8");
    const data: LocationsData = JSON.parse(rawData);

    // Find or create i12 Katong
    let katongIndex = data.locations.findIndex(l => l.venueName.includes("i12 Katong"));

    if (katongIndex === -1) {
        console.log("Creating new i12 Katong record...");
        const newLoc: Location = {
            id: "i12-katong-test",
            venueName: "i12 Katong (Test Fixture)",
            venueType: "mall",
            lat: 1.306,
            lng: 103.905,
            sources: [],
            evidence: [],
            conflicts: [],
            verificationLevel: "unverified",
            confidence: 0,
            amenities: ["nursing_chair", "sink"],
            cost: "free",
            status: "active",
            isSample: false // Show in UI
        };
        data.locations.unshift(newLoc);
        katongIndex = 0;
    }

    const loc = data.locations[katongIndex];

    // Reset to "Conflict" state
    loc.sources = [
        { id: "s1", name: "Official Guide", url: "https://i12katong.com/guide", type: "evidence", isOfficial: true, extractedAt: new Date().toISOString() },
        { id: "s2", name: "Mom Blog", url: "https://momblog.com/i12", type: "evidence", isOfficial: false, extractedAt: new Date().toISOString() }
    ];

    loc.evidence = [
        { field: "floor", value: "L4", rawValue: "Level 4", sourceId: "s1", confidence: 50, updatedAt: new Date().toISOString() },
        { field: "floor", value: "L2", rawValue: "Level 2", sourceId: "s2", confidence: 10, updatedAt: new Date().toISOString() }
    ];

    // Recalculate
    const updated = recalculateVerification(loc);
    Object.assign(loc, updated);

    console.log(`Updated i12 Katong status: ${loc.verificationLevel}`);
    console.log(`Conflicts: ${JSON.stringify(loc.conflicts)}`);

    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(LOCATIONS_FILE, JSON.stringify(data, null, 4));
    console.log("Fixture saved. Please check UI for 'Data Conflict' badge on i12 Katong.");
}

main().catch(console.error);
