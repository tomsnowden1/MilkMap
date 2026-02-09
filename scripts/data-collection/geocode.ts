/**
 * Geocoding utility using OneMap API (Singapore) with OSM fallback
 */

import fetch from "node-fetch";
import { ONEMAP_API, OSM_NOMINATIM, RATE_LIMIT } from "./config";
import type { GeocodeResult } from "./types";

// Simple in-memory cache to avoid duplicate lookups
const geocodeCache = new Map<string, GeocodeResult | null>();

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Geocode an address using OneMap API (Singapore official)
 */
async function geocodeWithOneMap(
    query: string
): Promise<GeocodeResult | null> {
    try {
        const url = new URL(ONEMAP_API.searchUrl);
        url.searchParams.set("searchVal", query);
        url.searchParams.set("returnGeom", "Y");
        url.searchParams.set("getAddrDetails", "Y");

        const response = await fetch(url.toString());
        if (!response.ok) {
            console.error(`OneMap API error: ${response.status}`);
            return null;
        }

        const data = (await response.json()) as {
            found: number;
            results: Array<{
                LATITUDE: string;
                LONGITUDE: string;
                ADDRESS: string;
            }>;
        };

        if (data.found === 0 || !data.results.length) {
            return null;
        }

        const result = data.results[0];
        return {
            latitude: parseFloat(result.LATITUDE),
            longitude: parseFloat(result.LONGITUDE),
            matchedAddress: result.ADDRESS,
            confidence: data.found === 1 ? 1.0 : 0.7,
        };
    } catch (error) {
        console.error("OneMap geocoding error:", error);
        return null;
    }
}

/**
 * Geocode using OpenStreetMap Nominatim (fallback)
 */
async function geocodeWithOSM(query: string): Promise<GeocodeResult | null> {
    try {
        const url = new URL(OSM_NOMINATIM.searchUrl);
        url.searchParams.set("q", `${query}, Singapore`);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "1");
        url.searchParams.set("countrycodes", "sg");

        const response = await fetch(url.toString(), {
            headers: {
                "User-Agent": OSM_NOMINATIM.userAgent,
            },
        });

        if (!response.ok) {
            console.error(`OSM API error: ${response.status}`);
            return null;
        }

        const data = (await response.json()) as Array<{
            lat: string;
            lon: string;
            display_name: string;
            importance: number;
        }>;

        if (!data.length) {
            return null;
        }

        const result = data[0];
        return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            matchedAddress: result.display_name,
            confidence: result.importance,
        };
    } catch (error) {
        console.error("OSM geocoding error:", error);
        return null;
    }
}

/**
 * Main geocoding function with caching and fallback
 */
export async function geocode(
    address: string,
    postalCode?: string
): Promise<GeocodeResult | null> {
    // Build cache key
    const cacheKey = `${address}|${postalCode || ""}`.toLowerCase();

    // Check cache first
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey) || null;
    }

    // Build query - prefer postal code for Singapore (more accurate)
    const query = postalCode ? `Singapore ${postalCode}` : address;

    // Try OneMap first (better for Singapore)
    let result = await geocodeWithOneMap(query);

    if (!result && postalCode) {
        // Try with full address if postal code didn't work
        await sleep(RATE_LIMIT.initialDelayMs);
        result = await geocodeWithOneMap(address);
    }

    if (!result) {
        // Fall back to OSM
        await sleep(RATE_LIMIT.initialDelayMs);
        result = await geocodeWithOSM(query);
    }

    // Cache result (including nulls to avoid repeated lookups)
    geocodeCache.set(cacheKey, result);

    return result;
}

/**
 * Batch geocode multiple addresses with rate limiting
 */
export async function batchGeocode(
    items: Array<{ address: string; postalCode?: string }>
): Promise<Map<string, GeocodeResult | null>> {
    const results = new Map<string, GeocodeResult | null>();

    for (const item of items) {
        const key = `${item.address}|${item.postalCode || ""}`;
        const result = await geocode(item.address, item.postalCode);
        results.set(key, result);

        // Rate limit between requests
        await sleep(RATE_LIMIT.initialDelayMs);
    }

    return results;
}

/**
 * Get geocode cache stats
 */
export function getGeocodeStats(): { cached: number; hits: number } {
    return {
        cached: geocodeCache.size,
        hits: geocodeCache.size, // Simplified - would need tracking for real hits
    };
}
