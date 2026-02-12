
import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { LocationsData } from "../../data/locations.schema";
import { OPERATOR_PACKS } from "./operator-packs";

const LOCATIONS_FILE = path.resolve(process.cwd(), "data/locations.json");
const REPORT_FILE = path.resolve(process.cwd(), "data/reports/official_evidence_run.json");

// Define trusted domains for relaxed validation
const TRUSTED_DOMAINS = [
    "capitaland.com",
    "frasersproperty.com",
    "fareastmalls.com.sg",
    "vivocity.com.sg",
    "ionorchard.com",
    "changiairport.com",
    "rwsentosa.com",
    "linkreit.com"
];

const KEYWORDS = [
    "nursing room", "baby care", "parent room",
    "lactation", "breastfeeding", "diaper changing",
    "baby changing", "nursery room", "family room",
    "services", "amenities", "concierge", "facilities"
];

const NEGATIVE_KEYWORDS = [
    "no nursing room", "not available"
];

async function fetchAndValidate(url: string, venueName: string): Promise<{ valid: boolean; reason?: string }> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.status !== 200) return { valid: false, reason: `HTTP ${res.status}` };

        // 1. Trusted Domain Relaxed Check
        const isTrusted = TRUSTED_DOMAINS.some(d => url.includes(d));
        if (isTrusted) {
            const pathInfo = new URL(url).pathname.toLowerCase();
            if (pathInfo.includes("amenities") ||
                pathInfo.includes("services") ||
                pathInfo.includes("concierge") ||
                pathInfo.includes("facilities") ||
                pathInfo.includes("visit") ||
                pathInfo.includes("about-mall") ||
                pathInfo.includes("mall-info")) {
                return { valid: true, reason: "Trusted Domain Path Match" };
            }
        }

        // 2. Content Validation
        const html = await res.text();
        const $ = cheerio.load(html);
        const text = $("body").text().toLowerCase().replace(/\s+/g, " ");

        // Strict Check: Keywords
        const hasKeyword = KEYWORDS.some(k => text.includes(k));
        if (!hasKeyword) return { valid: false, reason: "No Keywords Found" };

        // Negative check
        if (NEGATIVE_KEYWORDS.some(k => text.includes(k))) return { valid: false, reason: "Negative Keywords Found" };

        return { valid: true, reason: "Content Verified" };
    } catch (e: any) {
        return { valid: false, reason: `Error: ${e.message}` };
    }
}


async function main() {
    console.log("Starting Official Evidence Finder (Operator Packs)...");

    const rawData = fs.readFileSync(LOCATIONS_FILE, "utf-8");
    const data: LocationsData = JSON.parse(rawData);

    // Initialize stats
    const stats = {
        scanned: 0,
        added: 0,
        by_operator: {} as Record<string, { attempted: number; found: number; blocked: number }>
    };

    // Initialize operator stats
    OPERATOR_PACKS.forEach(p => {
        stats.by_operator[p.name] = { attempted: 0, found: 0, blocked: 0 };
    });
    stats.by_operator["Generic"] = { attempted: 0, found: 0, blocked: 0 };

    // Targets: Unverified locations
    const targets = data.locations.filter(l => l.status === "active" && l.verificationLevel !== "verified");
    stats.scanned = targets.length;
    console.log(`Scanning ${targets.length} unverified locations...`);

    const candidates: any[] = [];

    for (const loc of targets) {
        process.stdout.write(`Checking ${loc.venueName}... `);

        // Extract existing official domains
        const domains = loc.sources
            .filter(s => s.isOfficial && s.url)
            .map(s => {
                try { return new URL(s.url!).hostname; } catch { return ""; }
            })
            .filter(Boolean);

        const urlsToTry = new Set<{ url: string; pack: string; }>();

        // 1. Pack Matching
        for (const pack of OPERATOR_PACKS) {
            if (pack.match(loc, domains)) {
                pack.getUrls(loc).forEach(u => urlsToTry.add({ url: u, pack: pack.name }));
            }
        }

        // 2. Generic Strategies (Existing Sources)
        if (urlsToTry.size === 0 && domains.length > 0) {
            loc.sources.forEach(s => {
                if (!s.url || !s.isOfficial) return;
                try {
                    const u = new URL(s.url);
                    const origin = u.origin;
                    ["amenities", "services", "visit", "concierge", "facilities"].forEach(p => {
                        urlsToTry.add({ url: `${origin}/${p}`, pack: "Generic" });
                    });
                } catch (e) { }
            });
        }

        let found = false;

        // Try candidates
        // Need to iterate manually to access the object properties
        const urlsArray = Array.from(urlsToTry);
        for (const { url, pack } of urlsArray) {
            // Dedupe against existing sources
            if (loc.sources.some(s => s.url === url)) continue;

            if (stats.by_operator[pack]) {
                stats.by_operator[pack].attempted++;
            }

            // Politeness delay
            await new Promise(r => setTimeout(r, 300));

            const { valid, reason } = await fetchAndValidate(url, loc.venueName || "");

            if (valid) {
                console.log(`\n✅ FOUND [${pack}]: ${url} (${reason})`);

                loc.sources.push({
                    name: "Official Website (Auto-Discovered)",
                    url: url,
                    type: "evidence",
                    isOfficial: true,
                    extractedAt: new Date().toISOString()
                });

                candidates.push({
                    venueName: loc.venueName,
                    url,
                    pack,
                    reason
                });

                found = true;
                stats.added++;
                if (stats.by_operator[pack]) {
                    stats.by_operator[pack].found++;
                }
                break; // Stop after finding one good official source
            } else {
                if (reason?.includes("HTTP 403") || reason?.includes("HTTP 429")) {
                    if (stats.by_operator[pack]) {
                        stats.by_operator[pack].blocked++;
                    }
                }
            }
        }

        if (!found) process.stdout.write(urlsToTry.size > 0 ? "No match.\n" : "Skipped (no known pack).\n");
    }

    // Save Data
    if (stats.added > 0) {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(data, null, 4));
        console.log(`\n🎉 Success! Added official evidence to ${stats.added} locations.`);
    }

    // Save Report
    if (!fs.existsSync(path.dirname(REPORT_FILE))) {
        fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
    }
    fs.writeFileSync(REPORT_FILE, JSON.stringify(stats, null, 2));
    console.log(`Report written to ${REPORT_FILE}`);
}

main().catch(console.error);
