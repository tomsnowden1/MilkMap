
import fs from "fs/promises";
import path from "path";
import { LocationsData } from "../../data/locations.schema";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");

async function main() {
    console.log("Starting verification analysis...");

    // Read locations
    const rawData = await fs.readFile(LOCATIONS_FILE, "utf-8");
    const data: LocationsData = JSON.parse(rawData);

    const stats = {
        total: 0,
        verified: 0,
        userReported: 0,
        unverified: 0,
        totalSources: 0,
        activeSources: 0,
        deadSources: 0,
        conflicts: 0
    };

    const conflicts: any[] = [];

    for (const location of data.locations) {
        stats.total++;

        switch (location.verificationLevel) {
            case "verified": stats.verified++; break;
            case "user-reported": stats.userReported++; break;
            default: stats.unverified++; break;
        }

        let locationActiveSources = 0;
        let locationDeadSources = 0;

        if (location.sources) {
            for (const source of location.sources) {
                stats.totalSources++;
                const isDead = source.httpStatus && source.httpStatus >= 400;
                const isLive = !isDead && (!source.httpStatus || (source.httpStatus >= 200 && source.httpStatus < 300));

                if (isDead) {
                    stats.deadSources++;
                    locationDeadSources++;
                } else {
                    stats.activeSources++;
                    locationActiveSources++;
                }
            }
        }

        // Conflict Detection Rules (Simple)
        // 1. Verified but < 2 active sources (should not happen if verification logic runs)
        if (location.verificationLevel === "verified" && locationActiveSources < 2) {
            conflicts.push({
                location: location.venueName,
                issue: "Marked verified but fewer than 2 active sources",
                activeSources: locationActiveSources
            });
            stats.conflicts++;
        }

        // 2. Multiple active sources but unverified? (Maybe sources disagree or logic failed)
        if (location.verificationLevel === "unverified" && locationActiveSources >= 2) {
            conflicts.push({
                location: location.venueName,
                issue: "Unverified but has >= 2 active sources (Ready for verification?)",
                activeSources: locationActiveSources
            });
            stats.conflicts++;
        }
    }

    console.log("\n=== Data Quality Report ===");
    console.log(`Total Locations: ${stats.total}`);
    console.log(`- Verified: ${stats.verified}`);
    console.log(`- User Reported: ${stats.userReported}`);
    console.log(`- Unverified: ${stats.unverified}`);
    console.log(`\nSource Health:`);
    console.log(`- Total Sources: ${stats.totalSources}`);
    console.log(`- Active: ${stats.activeSources}`);
    console.log(`- Dead/Broken: ${stats.deadSources}`);

    if (conflicts.length > 0) {
        console.log(`\n=== Conflicts / Anomalies (${stats.conflicts}) ===`);
        conflicts.forEach(c => {
            console.log(`[${c.location}] ${c.issue}`);
        });
    } else {
        console.log(`\nNo obvious conflicts detected.`);
    }
}

main().catch(console.error);
