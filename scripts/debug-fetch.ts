
import * as cheerio from "cheerio";

const URLS = [
    { url: "https://www.vivocity.com.sg/services/", venue: "VivoCity" },
    { url: "https://www.capitaland.com/sg/en/shop/malls/plaza-singapura.html", venue: "Plaza Singapura" },
    { url: "https://www.ionorchard.com/en/concierge-services.html", venue: "ION Orchard" }
];

async function test() {
    for (const { url, venue } of URLS) {
        console.log(`\nTesting ${url} for ${venue}...`);
        try {
            const res = await fetch(url, {
                headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
            });
            console.log(`Status: ${res.status}`);
            if (res.status === 200) {
                const html = await res.text();
                console.log(`Length: ${html.length}`);

                const $ = cheerio.load(html);
                const text = $("body").text().toLowerCase().replace(/\s+/g, " ");
                console.log(`Preview: ${text.substring(0, 200)}...`);

                const keywords = ["nursing room", "baby care", "parent room", "lactation"];
                const foundKw = keywords.find(k => text.includes(k));
                console.log(`Keyword Match: ${foundKw ? "YES (" + foundKw + ")" : "NO"}`);

                const slug = venue.toLowerCase().replace(/[^\w]/g, "");
                const hasVenue = text.includes(slug) || text.includes(venue.toLowerCase());
                console.log(`Venue Name Match: ${hasVenue ? "YES" : "NO"}`);
            }
        } catch (e: any) {
            console.error("Error:", e.message);
        }
    }
}

test();
