
import { Location } from "../../data/locations.schema";

// Helper to slugify venue names
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // remove non-word chars
        .trim()
        .replace(/\s+/g, "-");
}

export interface OperatorPack {
    name: string;
    // Return true if this pack applies to the location
    match: (loc: Location, existingDomains: string[]) => boolean;
    // Return a list of candidate URLs to try
    getUrls: (loc: Location) => string[];
    // Optional: Custom validation logic (if standard keyword check isn't enough/appropriate)
    validate?: (html: string, url: string) => boolean;
    // Optional: If true, this pack requires a browser to fetch content (JS-heavy/blocked)
    requiresBrowser?: boolean;
}

export const OPERATOR_PACKS: OperatorPack[] = [
    {
        name: "Capitaland Malls",
        match: (loc, domains) => {
            if (domains.some(d => d.includes("capitaland.com"))) return true;
            const malls = [
                "plaza-singapura", "bugis-junction", "raffles-city", "funan", "ion-orchard",
                "j8", "imm", "westgate", "tampines-mall", "bedok-mall", "bukit-panjang-plaza",
                "lot-one", "junction-8", "singpost-centre", "sengkang-grand-mall", "cq-at-clarke-quay"
            ];
            const slug = slugify(loc.venueName || "");
            return malls.includes(slug) || malls.some(m => slug.includes(m));
        },
        getUrls: (loc) => {
            const slug = slugify(loc.venueName || "").replace("junction-8", "j8"); // Alias fix

            const bases = [
                `https://www.capitaland.com/sg/en/shop/malls/${slug}.html`,
                `https://www.capitaland.com/sg/en/shop/malls/${slug}/amenities.html`,
                `https://www.capitaland.com/sg/en/shop/malls/${slug}/concierge-services.html`
            ];
            // ION specific
            if (slug.includes("ion-orchard")) {
                bases.push("https://www.ionorchard.com/en/concierge-services.html");
            }
            return bases;
        }
    },
    {
        name: "Frasers Property",
        requiresBrowser: true,
        match: (loc, domains) => {
            if (domains.some(d => d.includes("frasersproperty.com"))) return true;
            const malls = [
                "causeway-point", "waterway-point", "northpoint-city", "centrepoint",
                "changi-city-point", "eastpoint-mall", "hougang-mall", "tampines-1",
                "the-centrepoint", "century-square", "white-sands", "tiong-bahru-plaza"
            ];
            const slug = slugify(loc.venueName || "");
            return malls.includes(slug) || malls.some(m => slug.includes(m));
        },
        getUrls: (loc) => {
            const slug = slugify(loc.venueName || "").replace("the-centrepoint", "centrepoint");
            return [
                `https://www.frasersexperience.com/malls/${slug}`,
                `https://www.frasersexperience.com/malls/${slug}/amenities`,
                `https://www.frasersexperience.com/malls/${slug}/services`
            ];
        }
    },
    {
        name: "Far East Malls",
        match: (loc, domains) => {
            if (domains.some(d => d.includes("fareastmalls.com.sg"))) return true;
            const malls = [
                "orchard-central", "clarke-quay-central", "square-2", "west-coast-plaza",
                "pacific-plaza", "mess-hall-at-sentosa", "bijou", "katong-v", "junction-10",
                "greenwich-v", "hillv2", "hougang-1", "lucky-chinatown"
            ];
            const slug = slugify(loc.venueName || "");
            return malls.includes(slug) || malls.some(m => slug.includes(m));
        },
        getUrls: (loc) => {
            const slug = slugify(loc.venueName || "");
            return [
                `https://www.fareastmalls.com.sg/${slug}/amenities`,
                `https://www.fareastmalls.com.sg/${slug}/visit-us`,
                `https://www.fareastmalls.com.sg/${slug}/about-us`
            ];
        }
    },
    {
        name: "Link REIT",
        match: (loc, domains) => {
            if (domains.some(d => d.includes("linkreit.com"))) return true;
            const malls = ["jurong-point", "amk-hub", "swing-by-thomson-plaza"];
            const slug = slugify(loc.venueName || "");
            return malls.includes(slug);
        },
        getUrls: (loc) => {
            const slug = slugify(loc.venueName || "");
            return [
                `https://sg.linkreit.com/malls/${slug}/mall-info/about-mall/`,
                `https://www.${slug}.com.sg/about-us`
            ];
        }
    },
    {
        name: "Mapletree (VivoCity)",
        requiresBrowser: true,
        match: (loc) => slugify(loc.venueName || "") === "vivocity",
        getUrls: () => ["https://www.vivocity.com.sg/"]
    }
];
