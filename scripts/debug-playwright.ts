
import { fetchRendered } from "./lib/fetch-rendered";
import * as cheerio from "cheerio";

const URL = "https://www.vivocity.com.sg/";

async function test() {
    console.log(`Fetching ${URL} with Playwright...`);
    const res = await fetchRendered(URL);
    console.log(`Status: ${res.status}`);
    console.log(`Final URL: ${res.finalUrl}`);
    console.log(`HTML Length: ${res.html.length}`);

    if (res.ok) {
        const $ = cheerio.load(res.html);
        const text = $("body").text().replace(/\s+/g, " ");
        console.log(`Title: ${$("title").text()}`);
        console.log(`Body Snippet: ${text.substring(0, 500)}`);

        // Check for specific keywords
        const keywords = ["nursing", "baby", "care", "amenities", "services"];
        keywords.forEach(k => {
            console.log(`Contains '${k}': ${text.toLowerCase().includes(k)}`);
        });
    } else {
        console.log("Error:", res.error);
    }
}

test();
