/**
 * CSV emission - generate output files
 */

import { createObjectCsvWriter } from "csv-writer";
import * as fs from "fs";
import * as path from "path";
import type { VerifiedRoom, UnverifiedRoom, SourceRow } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Write verified rooms CSV
 */
export async function writeVerifiedCsv(rooms: VerifiedRoom[]): Promise<string> {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, "nursing_rooms_sg.csv");

    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: "id", title: "id" },
            { id: "name", title: "name" },
            { id: "venue", title: "venue" },
            { id: "venueType", title: "venue_type" },
            { id: "address", title: "address" },
            { id: "postalCode", title: "postal_code" },
            { id: "region", title: "region" },
            { id: "areaAccess", title: "area_access" },
            { id: "floorLevel", title: "floor_level" },
            { id: "locationDetail", title: "location_detail" },
            { id: "latitude", title: "latitude" },
            { id: "longitude", title: "longitude" },
            { id: "features", title: "features" },
            { id: "openingHours", title: "opening_hours" },
            { id: "sourceUrl1", title: "source_url_1" },
            { id: "sourceUrl2", title: "source_url_2" },
            { id: "lastVerifiedAt", title: "last_verified_at" },
            { id: "notes", title: "notes" },
        ],
    });

    // Transform features array to comma-separated string
    const records = rooms.map((r) => ({
        ...r,
        features: r.features.join(","),
        latitude: r.latitude || "",
        longitude: r.longitude || "",
    }));

    await csvWriter.writeRecords(records);
    console.log(`[CSV] Wrote ${rooms.length} verified rooms to ${filePath}`);

    return filePath;
}

/**
 * Write unverified rooms CSV
 */
export async function writeUnverifiedCsv(rooms: UnverifiedRoom[]): Promise<string> {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, "nursing_rooms_sg_unverified.csv");

    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: "id", title: "id" },
            { id: "name", title: "name" },
            { id: "venue", title: "venue" },
            { id: "venueType", title: "venue_type" },
            { id: "address", title: "address" },
            { id: "postalCode", title: "postal_code" },
            { id: "region", title: "region" },
            { id: "floorLevel", title: "floor_level" },
            { id: "locationDetail", title: "location_detail" },
            { id: "latitude", title: "latitude" },
            { id: "longitude", title: "longitude" },
            { id: "features", title: "features" },
            { id: "openingHours", title: "opening_hours" },
            { id: "sourceUrl", title: "source_url" },
            { id: "sourceName", title: "source_name" },
            { id: "extractedAt", title: "extracted_at" },
            { id: "notes", title: "notes" },
        ],
    });

    const records = rooms.map((r) => ({
        ...r,
        features: r.features.join(","),
        latitude: r.latitude || "",
        longitude: r.longitude || "",
    }));

    await csvWriter.writeRecords(records);
    console.log(`[CSV] Wrote ${rooms.length} unverified rooms to ${filePath}`);

    return filePath;
}

/**
 * Write sources attribution CSV
 */
export async function writeSourcesCsv(
    verified: VerifiedRoom[],
    unverified: UnverifiedRoom[]
): Promise<string> {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, "nursing_rooms_sg_sources.csv");

    const rows: SourceRow[] = [];

    // Add verified room sources (2 per room)
    for (const room of verified) {
        rows.push({
            roomId: room.id,
            sourceUrl: room.sourceUrl1,
            sourceName: "Source 1",
            extractedAt: room.lastVerifiedAt,
            notes: "",
        });
        rows.push({
            roomId: room.id,
            sourceUrl: room.sourceUrl2,
            sourceName: "Source 2",
            extractedAt: room.lastVerifiedAt,
            notes: "",
        });
    }

    // Add unverified room sources
    for (const room of unverified) {
        rows.push({
            roomId: room.id,
            sourceUrl: room.sourceUrl,
            sourceName: room.sourceName,
            extractedAt: room.extractedAt,
            notes: "unverified",
        });
    }

    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: "roomId", title: "room_id" },
            { id: "sourceUrl", title: "source_url" },
            { id: "sourceName", title: "source_name" },
            { id: "extractedAt", title: "extracted_at" },
            { id: "notes", title: "notes" },
        ],
    });

    await csvWriter.writeRecords(rows);
    console.log(`[CSV] Wrote ${rows.length} source rows to ${filePath}`);

    return filePath;
}

/**
 * Generate summary statistics
 */
export function generateSummary(
    verified: VerifiedRoom[],
    unverified: UnverifiedRoom[]
): string {
    const regionCounts = new Map<string, number>();
    const venueTypeCounts = new Map<string, number>();

    for (const room of verified) {
        regionCounts.set(room.region, (regionCounts.get(room.region) || 0) + 1);
        venueTypeCounts.set(room.venueType, (venueTypeCounts.get(room.venueType) || 0) + 1);
    }

    const lines: string[] = [
        "## Nursing Rooms Dataset Summary",
        "",
        `**Total Verified Rooms**: ${verified.length}`,
        `**Total Unverified Rooms**: ${unverified.length}`,
        "",
        "### By Region",
        "",
        "| Region | Count |",
        "|--------|-------|",
        ...[...regionCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([region, count]) => `| ${region} | ${count} |`),
        "",
        "### By Venue Type",
        "",
        "| Type | Count |",
        "|------|-------|",
        ...[...venueTypeCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => `| ${type} | ${count} |`),
        "",
    ];

    return lines.join("\n");
}
