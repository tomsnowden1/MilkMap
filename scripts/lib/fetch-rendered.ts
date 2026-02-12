
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { chromium } from "playwright";

const CACHE_DIR = path.resolve(process.cwd(), "data/cache/rendered");

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export interface RenderedResult {
    ok: boolean;
    status: number;
    finalUrl: string;
    html: string;
    error?: string;
}

export async function fetchRendered(url: string): Promise<RenderedResult> {
    const hash = crypto.createHash("md5").update(url).digest("hex");
    const cacheFile = path.join(CACHE_DIR, `${hash}.json`);

    // strict cache check: if exists, return immediately (unless older than 24h?) 
    // For now, permanent cache till manual clear is fine for this task.
    if (fs.existsSync(cacheFile)) {
        try {
            return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
        } catch (e) {
            // ignore corrupt cache
        }
    }

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        });
        const page = await context.newPage();

        // Block images/fonts to speed up
        await page.route("**/*", (route) => {
            const reqIdx = ["image", "stylesheet", "font"].indexOf(route.request().resourceType());
            if (reqIdx > -1) route.abort();
            else route.continue();
        });

        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

        // Wait a bit for potential client-side rendering
        await page.waitForTimeout(2000);

        const result: RenderedResult = {
            ok: response?.ok() || false,
            status: response?.status() || 0,
            finalUrl: page.url(),
            html: await page.content()
        };

        if (result.ok) {
            fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
        }

        return result;

    } catch (e: any) {
        return {
            ok: false,
            status: 0,
            finalUrl: url,
            html: "",
            error: e.message
        };
    } finally {
        if (browser) await browser.close();
    }
}
