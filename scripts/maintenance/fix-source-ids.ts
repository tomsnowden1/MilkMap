
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");

function isValidUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

async function main() {
    console.log("Fixing source IDs to be valid UUIDs...");

    const rawData = await fs.readFile(LOCATIONS_FILE, "utf-8");
    const data = JSON.parse(rawData);

    let fixedCount = 0;
    const idMap = new Map<string, string>();

    // 1. Fix Sources
    for (const location of data.locations) {
        if (location.sources) {
            for (const source of location.sources) {
                if (source.id && !isValidUuid(source.id)) {
                    const newId = crypto.randomUUID();
                    console.log(`Fixing Source ID: ${source.id} -> ${newId}`);
                    idMap.set(source.id, newId);
                    source.id = newId;
                    fixedCount++;
                } else if (!source.id) {
                    source.id = crypto.randomUUID();
                    fixedCount++;
                }
            }
        }
    }

    // 2. Fix Evidence References
    for (const location of data.locations) {
        if (location.evidence) {
            for (const ev of location.evidence) {
                if (ev.sourceId && idMap.has(ev.sourceId)) {
                    ev.sourceId = idMap.get(ev.sourceId);
                }
            }
        }
    }

    if (fixedCount > 0) {
        data.lastUpdated = new Date().toISOString();
        await fs.writeFile(LOCATIONS_FILE, JSON.stringify(data, null, 4));
        console.log(`Fixed ${fixedCount} invalid source IDs.`);
    } else {
        console.log("No invalid source IDs found.");
    }
}

main().catch(console.error);
