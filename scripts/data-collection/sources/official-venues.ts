/**
 * Generic official venue page parser
 * For parsing individual mall/venue facility pages
 */

import { crawlAndParse } from "../crawler";
import { cleanText, extractPostalCode, determineVenueType } from "../utils";
import type { RawCandidate } from "../types";

/**
 * Known mall/venue URLs with nursing room information
 * These are official sources that can serve as verification
 */
export const KNOWN_VENUES: Array<{
    name: string;
    url: string;
    type: string;
}> = [
        // CapitaLand Malls
        { name: "ION Orchard", url: "https://www.ionorchard.com/en/guest-services.html", type: "mall" },
        { name: "Plaza Singapura", url: "https://www.plazasingapura.com.sg/guest-services", type: "mall" },
        { name: "Bugis Junction", url: "https://www.capitaland.com/sg/malls/bugisjunction/en/stores.html", type: "mall" },
        { name: "Bugis+", url: "https://www.capitaland.com/sg/malls/bugisplus/en.html", type: "mall" },
        { name: "JCube", url: "https://www.capitaland.com/sg/malls/jcube/en.html", type: "mall" },
        { name: "Junction 8", url: "https://www.capitaland.com/sg/malls/junction8/en.html", type: "mall" },
        { name: "Lot One", url: "https://www.capitaland.com/sg/malls/lotone/en.html", type: "mall" },
        { name: "Tampines Mall", url: "https://www.capitaland.com/sg/malls/tampinesmall/en.html", type: "mall" },
        { name: "Westgate", url: "https://www.capitaland.com/sg/malls/westgate/en.html", type: "mall" },
        { name: "Funan", url: "https://www.capitaland.com/sg/malls/funan/en.html", type: "mall" },
        { name: "Raffles City", url: "https://www.capitaland.com/sg/malls/rafflescity/en.html", type: "mall" },

        // Other major malls
        { name: "VivoCity", url: "https://www.vivocity.com.sg/visitor-services", type: "mall" },
        { name: "Suntec City", url: "https://www.sunteccity.com.sg/visitor-services", type: "mall" },
        { name: "Marina Bay Sands", url: "https://www.marinabaysands.com/museum/visitor-information.html", type: "attraction" },
        { name: "313@Somerset", url: "https://www.313somerset.com.sg/visitor-services", type: "mall" },
        { name: "Orchard Central", url: "https://www.orchardcentral.com.sg/getting-here", type: "mall" },
        { name: "Ngee Ann City / Takashimaya", url: "https://www.takashimaya-sin.com", type: "mall" },
        { name: "Paragon", url: "https://www.paragon.com.sg", type: "mall" },

        // Changi Airport
        { name: "Changi Airport Terminal 1", url: "https://www.changiairport.com/en/at-changi/facilities-services/baby-care.html", type: "airport" },
        { name: "Changi Airport Terminal 2", url: "https://www.changiairport.com/en/at-changi/facilities-services/baby-care.html", type: "airport" },
        { name: "Changi Airport Terminal 3", url: "https://www.changiairport.com/en/at-changi/facilities-services/baby-care.html", type: "airport" },
        { name: "Changi Airport Terminal 4", url: "https://www.changiairport.com/en/at-changi/facilities-services/baby-care.html", type: "airport" },
        { name: "Jewel Changi Airport", url: "https://www.jewelchangiairport.com/en/visitor-services.html", type: "mall" },

        // Attractions
        { name: "Gardens by the Bay", url: "https://www.gardensbythebay.com.sg/en/plan-your-visit.html", type: "attraction" },
        { name: "Singapore Zoo", url: "https://www.mandai.com/en/singapore-zoo/plan-your-visit.html", type: "attraction" },
        { name: "River Wonders", url: "https://www.mandai.com/en/river-wonders/plan-your-visit.html", type: "attraction" },
        { name: "Bird Paradise", url: "https://www.mandai.com/en/bird-paradise/plan-your-visit.html", type: "attraction" },
        { name: "Night Safari", url: "https://www.mandai.com/en/night-safari/plan-your-visit.html", type: "attraction" },
        { name: "Universal Studios Singapore", url: "https://www.rwsentosa.com/en/attractions/universal-studios-singapore/guest-services", type: "attraction" },
        { name: "S.E.A. Aquarium", url: "https://www.rwsentosa.com/en/attractions/sea-aquarium/guest-services", type: "attraction" },
        { name: "Science Centre Singapore", url: "https://www.science.edu.sg/visit-us", type: "attraction" },
        { name: "ArtScience Museum", url: "https://www.marinabaysands.com/museum/visitor-information.html", type: "attraction" },

        // Hospitals
        { name: "KK Women's and Children's Hospital", url: "https://www.kkh.com.sg", type: "hospital" },
        { name: "National University Hospital", url: "https://www.nuh.com.sg", type: "hospital" },
        { name: "Singapore General Hospital", url: "https://www.sgh.com.sg", type: "hospital" },
        { name: "Mount Elizabeth Hospital", url: "https://www.mountelizabeth.com.sg", type: "hospital" },
        { name: "Gleneagles Hospital", url: "https://www.gleneagles.com.sg", type: "hospital" },
        { name: "Thomson Medical Centre", url: "https://www.thomsonmedical.com", type: "hospital" },
    ];

/**
 * Parse a venue's facilities page for nursing room info
 */
export async function parseVenuePage(
    venue: { name: string; url: string; type: string }
): Promise<RawCandidate | null> {
    console.log(`[Official] Parsing ${venue.name}...`);

    const $ = await crawlAndParse(venue.url);
    if (!$) {
        console.warn(`[Official] Failed to fetch ${venue.name}`);
        return null;
    }

    const pageText = cleanText($("body").text()).toLowerCase();

    // Check if page mentions nursing/baby care facilities
    const nursingKeywords = [
        "nursing room",
        "baby room",
        "baby care",
        "breastfeeding",
        "lactation",
        "mother's room",
        "parent's room",
        "diaper changing",
        "nappy changing",
    ];

    const hasNursingRoom = nursingKeywords.some((kw) =>
        pageText.includes(kw)
    );

    if (!hasNursingRoom) {
        console.log(`[Official] ${venue.name} - no nursing room mentioned`);
        return null;
    }

    // Extract features
    const features: string[] = [];
    const featurePatterns = [
        { pattern: /changing\s*table/i, feature: "changing_table" },
        { pattern: /nursing\s*(chair|area|room)/i, feature: "breastfeeding_area" },
        { pattern: /hot\s*water/i, feature: "hot_water_dispenser" },
        { pattern: /private\s*(room|area)/i, feature: "private_room" },
        { pattern: /diaper\s*(bin|disposal)/i, feature: "diaper_disposal" },
        { pattern: /sink|wash/i, feature: "sink" },
        { pattern: /microwave/i, feature: "microwave" },
        { pattern: /bottle\s*warmer/i, feature: "bottle_warmer" },
        { pattern: /stroller|pram/i, feature: "stroller_space" },
    ];

    for (const { pattern, feature } of featurePatterns) {
        if (pattern.test(pageText)) {
            features.push(feature);
        }
    }

    // Try to extract floor level
    const floorMatch = pageText.match(
        /(?:level|floor|L|B)\s*(\d+|B\d?|basement)/i
    );
    const floorLevel = floorMatch ? floorMatch[0].toUpperCase() : undefined;

    // Try to extract address
    const addressEl = $("[itemprop='address'], .address, address");
    const address = addressEl.length
        ? cleanText(addressEl.first().text())
        : undefined;

    return {
        name: `Nursing Room at ${venue.name}`,
        venue: venue.name,
        venueType: venue.type,
        address,
        postalCode: address ? extractPostalCode(address) : undefined,
        floorLevel,
        features: features.length ? features : ["breastfeeding_area"],
        sourceUrl: venue.url,
        sourceName: "Official Website",
        extractedAt: new Date().toISOString(),
    };
}

/**
 * Parse all known venue pages
 */
export async function parseAllVenues(): Promise<RawCandidate[]> {
    console.log(`[Official] Parsing ${KNOWN_VENUES.length} known venues...`);

    const candidates: RawCandidate[] = [];

    for (const venue of KNOWN_VENUES) {
        try {
            const result = await parseVenuePage(venue);
            if (result) {
                candidates.push(result);
            }
            // Small delay between venues
            await new Promise((r) => setTimeout(r, 500));
        } catch (error) {
            console.error(`[Official] Error parsing ${venue.name}:`, error);
        }
    }

    console.log(`[Official] Found ${candidates.length} venues with nursing rooms`);
    return candidates;
}

export const officialVenues = {
    name: "Official Venues",
    venues: KNOWN_VENUES,
    parseVenue: parseVenuePage,
    parseAll: parseAllVenues,
};
