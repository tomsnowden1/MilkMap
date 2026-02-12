
import fs from "fs";
import path from "path";
import { LocationsData } from "../data/locations.schema";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");

const rawData = fs.readFileSync(LOCATIONS_FILE, "utf-8");
const data: LocationsData = JSON.parse(rawData);

const verified = data.locations.filter(l => l.verificationLevel === "verified");

console.log(`\nVerified Locations: ${verified.length}`);
verified.forEach(l => {
    console.log(`- ${l.venueName} (${l.sources.length} sources)`);
    l.sources.filter(s => s.isOfficial || s.type === "evidence").forEach(s => {
        console.log(`  * [${s.isOfficial ? "A" : "B"}] ${s.url}`);
    });
});
