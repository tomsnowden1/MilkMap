
import * as cheerio from "cheerio";

const URLS = [
    "https://www.frasersexperience.com/malls/causeway-point",
    "https://www.frasersexperience.com/malls/causeway-point/amenities",
    "https://www.fraseresxperience.com/malls/northpoint-city"
];

async function test() {
    for (const url of URLS) {
        console.log(`Testing ${url}...`);
        try {
            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                }
            });
            console.log(`Status: ${res.status}`);
            const html = await res.text();
            console.log(`Length: ${html.length}`);
            if (res.status === 200) {
                const $ = cheerio.load(html);
                const title = $("title").text();
                console.log(`Title: ${title}`);
            }
        } catch (e) {
            console.log("Error:", e);
        }
    }
}

test();
