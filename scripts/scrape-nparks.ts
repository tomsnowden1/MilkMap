#!/usr/bin/env tsx

/**
 * Placeholder scraper for nparks.gov.sg
 * 
 * TODO: Implement actual scraping logic for NParks facilities
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { CandidatesData } from "../data/locations.schema";

const OUTPUT_DIR = join(process.cwd(), "data", "candidates");
const OUTPUT_FILE = join(OUTPUT_DIR, "nparks.json");

async function scrape() {
    console.log("🔍 Scraping nparks.gov.sg...");
    console.log("⚠️  This is a PLACEHOLDER script. No actual scraping implemented yet.\n");

    mkdirSync(OUTPUT_DIR, { recursive: true });

    const data: CandidatesData = {
        source: "nparks",
        scrapedAt: new Date().toISOString(),
        candidates: [],
    };

    writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

    console.log(`✅ Output written to: ${OUTPUT_FILE}`);
    console.log(`📊 Candidates found: ${data.candidates.length}`);
}

scrape().catch(console.error);
