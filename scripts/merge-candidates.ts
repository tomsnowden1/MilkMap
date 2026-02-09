#!/usr/bin/env tsx

/**
 * Merge candidate locations from scraper outputs
 * 
 * This script:
 * 1. Reads all candidate JSON files from data/candidates/
 * 2. Deduplicates based on normalized venue name and proximity (if lat/lng present)
 * 3. Assigns confidence scores based on source count and official sources
 * 4. Outputs a normalized, ready-to-review list
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { CandidatesData, CandidateLocation } from "../data/locations.schema";

const CANDIDATES_DIR = join(process.cwd(), "data", "candidates");
const OUTPUT_FILE = join(process.cwd(), "data", "merged-candidates.json");

interface MergedCandidate {
    venueName: string;
    normalizedName: string;
    addressText?: string;
    floor?: string;
    amenitiesText?: string;
    notes?: string;
    lat?: number;
    lng?: number;
    sources: Array<{ source: string; url: string; scrapedAt: string }>;
    confidence: number;
}

function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ");
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Haversine distance in meters
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function calculateConfidence(
    sourceCount: number,
    hasOfficialSource: boolean
): number {
    let confidence = 50; // Base confidence

    // Add points for multiple sources
    confidence += Math.min(sourceCount * 10, 30);

    // Boost for official sources
    if (hasOfficialSource) {
        confidence += 20;
    }

    return Math.min(confidence, 100);
}

async function mergeCandidates() {
    console.log("🔄 Merging candidate locations...\n");

    try {
        const files = readdirSync(CANDIDATES_DIR).filter((f) => f.endsWith(".json"));

        if (files.length === 0) {
            console.log("⚠️  No candidate files found in", CANDIDATES_DIR);
            console.log("💡 Run scrapers first: npm run data:scrape:all");
            return;
        }

        console.log(`📂 Found ${files.length} candidate file(s):`);
        files.forEach((f) => console.log(`   - ${f}`));
        console.log();

        const allCandidates: Array<{
            candidate: CandidateLocation;
            source: string;
            scrapedAt: string;
        }> = [];

        // Read all candidate files
        for (const file of files) {
            const filePath = join(CANDIDATES_DIR, file);
            const rawData = readFileSync(filePath, "utf-8");
            const data: CandidatesData = JSON.parse(rawData);

            data.candidates.forEach((candidate) => {
                allCandidates.push({
                    candidate,
                    source: data.source,
                    scrapedAt: data.scrapedAt,
                });
            });
        }

        console.log(`📊 Total raw candidates: ${allCandidates.length}\n`);

        // Deduplicate and merge
        const mergedMap = new Map<string, MergedCandidate>();

        for (const { candidate, source, scrapedAt } of allCandidates) {
            const normalized = normalizeName(candidate.venueName);
            let merged = mergedMap.get(normalized);

            if (!merged) {
                // New entry
                merged = {
                    venueName: candidate.venueName,
                    normalizedName: normalized,
                    addressText: candidate.addressText,
                    floor: candidate.floor,
                    amenitiesText: candidate.amenitiesText,
                    notes: candidate.notes,
                    lat: candidate.lat,
                    lng: candidate.lng,
                    sources: [
                        {
                            source,
                            url: candidate.sourceUrl,
                            scrapedAt,
                        },
                    ],
                    confidence: 0,
                };
                mergedMap.set(normalized, merged);
            } else {
                // Merge with existing
                // Check proximity if both have coordinates
                if (
                    merged.lat &&
                    merged.lng &&
                    candidate.lat &&
                    candidate.lng
                ) {
                    const distance = calculateDistance(
                        merged.lat,
                        merged.lng,
                        candidate.lat,
                        candidate.lng
                    );
                    if (distance > 1000) {
                        // More than 1km apart, might be different location
                        console.log(
                            `⚠️  Possible duplicate with different coordinates: ${candidate.venueName} (${distance.toFixed(0)}m apart)`
                        );
                    }
                }

                // Add source
                merged.sources.push({
                    source,
                    url: candidate.sourceUrl,
                    scrapedAt,
                });

                // Update fields if missing
                if (!merged.addressText && candidate.addressText) {
                    merged.addressText = candidate.addressText;
                }
                if (!merged.floor && candidate.floor) {
                    merged.floor = candidate.floor;
                }
                if (!merged.lat && candidate.lat) {
                    merged.lat = candidate.lat;
                }
                if (!merged.lng && candidate.lng) {
                    merged.lng = candidate.lng;
                }
            }
        }

        // Calculate confidence scores
        const officialSources = ["nparks", "gov"];
        const mergedList: MergedCandidate[] = Array.from(mergedMap.values()).map(
            (merged) => {
                const hasOfficialSource = merged.sources.some((s) =>
                    officialSources.some((official) => s.source.includes(official))
                );
                merged.confidence = calculateConfidence(
                    merged.sources.length,
                    hasOfficialSource
                );
                return merged;
            }
        );

        // Sort by confidence descending
        mergedList.sort((a, b) => b.confidence - a.confidence);

        // Write output
        writeFileSync(
            OUTPUT_FILE,
            JSON.stringify({ mergedCandidates: mergedList, mergedAt: new Date().toISOString() }, null, 2)
        );

        console.log(`✅ Merged candidates written to: ${OUTPUT_FILE}`);
        console.log(`📊 Unique locations: ${mergedList.length}`);
        console.log(`📊 Duplicates removed: ${allCandidates.length - mergedList.length}\n`);

        console.log("💡 Next steps:");
        console.log("   1. Review merged-candidates.json");
        console.log("   2. Geocode missing lat/lng (if needed)");
        console.log("   3. Parse amenitiesText into structured amenities array");
        console.log("   4. Add reviewed entries to data/locations.json");
    } catch (error) {
        console.error("❌ Error during merge:", error);
        process.exit(1);
    }
}

mergeCandidates();
