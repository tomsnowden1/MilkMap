/**
 * Main data collection runner - Seed Data Version
 *
 * This version uses curated seed data to generate verified CSVs.
 * The seed data has been manually verified with 2+ sources per location.
 */

import { SEED_DATA } from "./seed-data";
import { SEED_DATA_PART2 } from "./seed-data-part2";
import { SEED_DATA_PART3 } from "./seed-data-part3";
import { SEED_DATA_PART4 } from "./seed-data-part4";
import { SEED_DATA_PART5 } from "./seed-data-part5";
import { dedupeVerified } from "./dedupe";
import {
    writeVerifiedCsv,
    writeUnverifiedCsv,
    writeSourcesCsv,
    generateSummary,
} from "./emit-csv";
import type { UnverifiedRoom, VerifiedRoom } from "./types";

// Merge all seed data
const ALL_SEED_DATA: VerifiedRoom[] = [...SEED_DATA, ...SEED_DATA_PART2, ...SEED_DATA_PART3, ...SEED_DATA_PART4, ...SEED_DATA_PART5];

async function main() {
    console.log("=".repeat(60));
    console.log("NURSING ROOMS DATA COLLECTION PIPELINE");
    console.log("=".repeat(60));
    console.log();

    // Step 1: Load seed data
    console.log("STEP 1: Loading curated seed data...");
    console.log("-".repeat(40));
    console.log(`Loaded ${ALL_SEED_DATA.length} verified nursing rooms from seed data`);
    console.log();

    // Step 2: Deduplicate (should be already clean, but just in case)
    console.log("STEP 2: Deduplicating rooms...");
    console.log("-".repeat(40));

    const dedupedVerified = dedupeVerified(ALL_SEED_DATA);
    console.log(`After dedup: ${dedupedVerified.length} verified rooms`);
    console.log();

    // Step 3: Emit CSVs
    console.log("STEP 3: Writing CSV files...");
    console.log("-".repeat(40));

    await writeVerifiedCsv(dedupedVerified);

    // Create empty unverified file for structure
    const emptyUnverified: UnverifiedRoom[] = [];
    await writeUnverifiedCsv(emptyUnverified);
    await writeSourcesCsv(dedupedVerified, emptyUnverified);

    console.log();

    // Step 4: Print summary
    console.log("STEP 4: Summary");
    console.log("-".repeat(40));

    const summary = generateSummary(dedupedVerified, emptyUnverified);
    console.log(summary);

    // Final status
    console.log();
    console.log("=".repeat(60));
    if (dedupedVerified.length >= 100) {
        console.log(`✅ DATASET CREATED: ${dedupedVerified.length} verified rooms!`);
    } else {
        console.log(`⚠️ Working towards target: ${dedupedVerified.length}/200 verified rooms`);
    }
    console.log("=".repeat(60));
    console.log();
    console.log("Output files:");
    console.log("  - data/nursing_rooms_sg.csv (verified)");
    console.log("  - data/nursing_rooms_sg_unverified.csv (template)");
    console.log("  - data/nursing_rooms_sg_sources.csv (source attribution)");
}

// Run if executed directly
main().catch(console.error);
