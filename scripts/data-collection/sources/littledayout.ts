/**
 * Little Day Out nursing rooms parser
 * Source: https://www.littledayout.com
 */

import { crawlAndParse } from "../crawler";
import { cleanText, extractPostalCode, determineVenueType } from "../utils";
import { SOURCES } from "../config";
import type { RawCandidate } from "../types";

const SOURCE_NAME = SOURCES.littleDayOut.name;

/**
 * Parse the main nursing rooms list page
 */
export async function parseLittleDayOutList(): Promise<RawCandidate[]> {
    console.log(`[${SOURCE_NAME}] Fetching nursing rooms list...`);

    const $ = await crawlAndParse(SOURCES.littleDayOut.listUrl);
    if (!$) {
        console.error(`[${SOURCE_NAME}] Failed to fetch list page`);
        return [];
    }

    const candidates: RawCandidate[] = [];
    const now = new Date().toISOString();

    // Little Day Out typically lists venues in article/list format
    // This selector may need adjustment based on actual page structure
    $("article, .entry-content li, .venue-item, .location-item").each((_, el) => {
        const $el = $(el);

        // Try to extract venue name
        const venueName = cleanText(
            $el.find("h2, h3, h4, .venue-name, strong").first().text()
        );
        if (!venueName || venueName.length < 3) return;

        // Try to extract address
        const addressText = cleanText(
            $el.find(".address, address, p").first().text()
        );

        // Try to extract features from description
        const description = cleanText($el.text());
        const features: string[] = [];

        // Common feature keywords to look for
        const featureKeywords = [
            "changing table",
            "nursing chair",
            "hot water",
            "microwave",
            "private",
            "sink",
            "diaper",
            "bottle warmer",
        ];
        for (const keyword of featureKeywords) {
            if (description.toLowerCase().includes(keyword)) {
                features.push(keyword);
            }
        }

        // Extract floor level if mentioned
        const floorMatch = description.match(
            /(?:level|floor|L|B|#)\s*(\d+|B\d?|basement)/i
        );
        const floorLevel = floorMatch ? floorMatch[0] : undefined;

        // Try to get a link to more details
        const link = $el.find("a").first().attr("href");
        const sourceUrl = link || SOURCES.littleDayOut.listUrl;

        candidates.push({
            name: `Nursing Room at ${venueName}`,
            venue: venueName,
            venueType: determineVenueType(venueName),
            address: addressText || undefined,
            postalCode: extractPostalCode(addressText || ""),
            floorLevel,
            features,
            sourceUrl,
            sourceName: SOURCE_NAME,
            extractedAt: now,
        });
    });

    console.log(`[${SOURCE_NAME}] Found ${candidates.length} candidates`);
    return candidates;
}

/**
 * Parse a specific venue detail page for more info
 */
export async function parseLittleDayOutDetail(
    url: string
): Promise<Partial<RawCandidate> | null> {
    const $ = await crawlAndParse(url);
    if (!$) return null;

    const content = cleanText($("article, .entry-content").text());
    const features: string[] = [];

    // Extract more detailed features
    const featurePatterns = [
        { pattern: /changing\s*table/i, feature: "changing_table" },
        { pattern: /nursing\s*(chair|area)/i, feature: "breastfeeding_area" },
        { pattern: /hot\s*water/i, feature: "hot_water_dispenser" },
        { pattern: /private\s*(room|area)/i, feature: "private_room" },
        { pattern: /diaper\s*(bin|disposal)/i, feature: "diaper_disposal" },
        { pattern: /sink|wash\s*basin/i, feature: "sink" },
        { pattern: /microwave/i, feature: "microwave" },
        { pattern: /bottle\s*warmer/i, feature: "bottle_warmer" },
        { pattern: /stroller|pram/i, feature: "stroller_space" },
        { pattern: /wheelchair|accessible/i, feature: "wheelchair_accessible" },
    ];

    for (const { pattern, feature } of featurePatterns) {
        if (pattern.test(content)) {
            features.push(feature);
        }
    }

    // Try to extract address
    const addressEl = $(".address, address, [itemprop='address']");
    const address = addressEl.length ? cleanText(addressEl.text()) : undefined;

    return {
        features,
        address,
        postalCode: address ? extractPostalCode(address) : undefined,
    };
}

// Main export
export const littleDayOut = {
    name: SOURCE_NAME,
    parseList: parseLittleDayOutList,
    parseDetail: parseLittleDayOutDetail,
};
