
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import crypto from "crypto";
import { Location, LocationsData } from "../../data/locations.schema";
import { calculateVerificationLevel } from "../../utils/verification";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");
const RATE_LIMIT_MS = 500; // 500ms delay between requests

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkUrl(url: string): Promise<{
    status: number;
    resolvedUrl?: string;
    hash?: string;
    error?: string;
}> {
    if (!url || !url.startsWith("http")) {
        return { status: 0, error: "Invalid URL" };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            method: "GET", // Use GET to get content hash. HEAD is faster but no content.
            // HEAD might be sufficient for status, but user mentioned "contentHash".
            // I'll stick to GET for now or maybe HEAD first then GET if changed?
            // "Fetch/HEAD sources".
            // I'll use GET to ensure redirects and content hash.
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; MilkMapBot/1.0)",
            },
        });
        clearTimeout(timeout);

        const text = await response.text();
        const hash = crypto.createHash("md5").update(text).digest("hex");

        return {
            status: response.status,
            resolvedUrl: response.url,
            hash,
        };
    } catch (error: any) {
        return {
            status: 0,
            error: error.message,
        };
    }
}

async function main() {
    console.log("Starting link check...");

    // Read locations
    const rawData = await fs.readFile(LOCATIONS_FILE, "utf-8");
    const data: LocationsData = JSON.parse(rawData);

    let totalSources = 0;
    let checkedSources = 0;
    let deadLinks = 0;

    for (const location of data.locations) {
        console.log(`Checking location: ${location.venueName}`);

        // Ensure sources is array
        if (!location.sources) location.sources = [];

        let locationChanged = false;

        for (const source of location.sources) {
            totalSources++;
            if (!source.url) continue;

            // Generate ID if missing
            if (!source.id) {
                source.id = crypto.randomUUID();
                locationChanged = true;
            }

            // Check URL
            // Skip if recently checked? (Optional optimization, skipping for now to force check)
            await sleep(RATE_LIMIT_MS);

            const result = await checkUrl(source.url);
            checkedSources++;

            // Update source
            if (result.status !== source.httpStatus ||
                result.resolvedUrl !== source.urlResolved ||
                result.hash !== source.contentHash) {

                locationChanged = true;
                source.httpStatus = result.status;
                if (result.resolvedUrl && result.resolvedUrl !== source.url) {
                    source.urlResolved = result.resolvedUrl;
                }
                if (result.hash) {
                    source.contentHash = result.hash;
                }
                source.lastChecked = new Date().toISOString();

                if (result.status >= 400 || result.status === 0) {
                    console.warn(`❌ [${result.status}] ${source.url}`);
                    deadLinks++;
                } else {
                    console.log(`✅ [${result.status}] ${source.url}`);
                }
            }
        }

        // Recalculate verification level
        const newLevel = calculateVerificationLevel(location);
        if (location.verificationLevel !== newLevel) {
            console.log(`⚠️  Verification level changed for ${location.venueName}: ${location.verificationLevel} -> ${newLevel}`);
            location.verificationLevel = newLevel;
            locationChanged = true;
        }

        // Also update legacy verified boolean? No, schema removed it in my thought process but I kept interface compatible?
        // Wait, schema has `verificationLevel`. Legacy `verified` boolean might exist in JSON but not in my TS type definition fully (or strictly).
        // I should set `verified` if I want backward compat, but I defined new schema without it (or with it removed).
        // I'll stick to `verificationLevel`.
    }

    if (checkedSources > 0) {
        data.lastUpdated = new Date().toISOString();
        await fs.writeFile(LOCATIONS_FILE, JSON.stringify(data, null, 4));
        console.log(`\nLink check complete.`);
        console.log(`Total Sources: ${totalSources}`);
        console.log(`Checked: ${checkedSources}`);
        console.log(`Dead Links: ${deadLinks}`);
    } else {
        console.log("No sources to check.");
    }
}

main().catch(console.error);
