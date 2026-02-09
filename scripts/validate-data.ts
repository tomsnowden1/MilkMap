#!/usr/bin/env tsx

import { readFileSync } from "fs";
import { join } from "path";
import { LocationsDataSchema } from "../data/locations.schema";

const DATA_PATH = join(process.cwd(), "data", "locations.json");

async function validateData() {
    try {
        console.log("📋 Validating locations.json...\n");

        // Read the JSON file
        const rawData = readFileSync(DATA_PATH, "utf-8");
        const jsonData = JSON.parse(rawData);

        // Validate against schema
        const result = LocationsDataSchema.safeParse(jsonData);

        if (!result.success) {
            console.error("❌ Validation failed:\n");
            console.error(result.error.format());
            process.exit(1);
        }

        const data = result.data;

        console.log("✅ Validation passed!");
        console.log(`📍 Total locations: ${data.locations.length}`);
        console.log(`🔄 Last updated: ${data.lastUpdated}\n`);

        // Summary stats
        const sampleCount = data.locations.filter(loc => loc.isSample).length;
        const activeCount = data.locations.filter(loc => loc.status === "active").length;
        const unverifiedCount = data.locations.filter(loc => loc.status === "unverified").length;

        console.log("📊 Status breakdown:");
        console.log(`   - Sample entries: ${sampleCount}`);
        console.log(`   - Active: ${activeCount}`);
        console.log(`   - Unverified: ${unverifiedCount}`);

        // Venue type breakdown
        const mallCount = data.locations.filter(loc => loc.venueType === "mall").length;
        const attractionCount = data.locations.filter(loc => loc.venueType === "attraction").length;

        console.log("\n🏢 Venue types:");
        console.log(`   - Malls: ${mallCount}`);
        console.log(`   - Attractions: ${attractionCount}`);

        console.log("\n✨ Data is valid and ready to use!");

    } catch (error) {
        console.error("❌ Error during validation:");
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

validateData();
