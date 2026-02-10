
import fs from "fs/promises";
import path from "path";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");

async function main() {
    console.log("Cleaning up test fixtures...");

    const rawData = await fs.readFile(LOCATIONS_FILE, "utf-8");
    const data = JSON.parse(rawData);

    const initialCount = data.locations.length;

    // Remove i12 Katong Test Fixture
    data.locations = data.locations.filter((l: any) => l.id !== "i12-katong-test");

    const removedCount = initialCount - data.locations.length;

    if (removedCount > 0) {
        data.lastUpdated = new Date().toISOString();
        await fs.writeFile(LOCATIONS_FILE, JSON.stringify(data, null, 4));
        console.log(`Removed ${removedCount} test fixture(s).`);
    } else {
        console.log("No test fixtures found.");
    }
}

main().catch(console.error);
