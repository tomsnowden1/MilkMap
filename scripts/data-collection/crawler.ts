/**
 * Web crawler with rate limiting and robots.txt respect
 */

import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { RATE_LIMIT } from "./config";
import type { CrawlResult } from "./types";

// Track last request time per domain for rate limiting
const lastRequestTime = new Map<string, number>();

// Cache for robots.txt
const robotsCache = new Map<string, Set<string>>();

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract domain from URL
 */
function getDomain(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

/**
 * Fetch and parse robots.txt for a domain
 */
async function fetchRobotsTxt(baseUrl: string): Promise<Set<string>> {
    const domain = getDomain(baseUrl);

    if (robotsCache.has(domain)) {
        return robotsCache.get(domain)!;
    }

    const disallowed = new Set<string>();

    try {
        const robotsUrl = `${new URL(baseUrl).origin}/robots.txt`;
        const response = await fetch(robotsUrl, { timeout: 5000 });

        if (response.ok) {
            const text = await response.text();
            const lines = text.split("\n");

            let isRelevantUserAgent = false;
            for (const line of lines) {
                const trimmed = line.trim().toLowerCase();

                if (trimmed.startsWith("user-agent:")) {
                    const agent = trimmed.replace("user-agent:", "").trim();
                    isRelevantUserAgent = agent === "*" || agent.includes("bot");
                } else if (isRelevantUserAgent && trimmed.startsWith("disallow:")) {
                    const path = trimmed.replace("disallow:", "").trim();
                    if (path) {
                        disallowed.add(path);
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`Could not fetch robots.txt for ${domain}:`, error);
    }

    robotsCache.set(domain, disallowed);
    return disallowed;
}

/**
 * Check if a URL is allowed by robots.txt
 */
async function isAllowedByRobots(url: string): Promise<boolean> {
    const disallowed = await fetchRobotsTxt(url);
    const urlPath = new URL(url).pathname;

    for (const path of disallowed) {
        if (urlPath.startsWith(path)) {
            return false;
        }
    }

    return true;
}

/**
 * Apply rate limiting for a domain
 */
async function applyRateLimit(url: string): Promise<void> {
    const domain = getDomain(url);
    const lastTime = lastRequestTime.get(domain) || 0;
    const now = Date.now();
    const minDelay = 1000 / RATE_LIMIT.requestsPerSecond;

    if (now - lastTime < minDelay) {
        await sleep(minDelay - (now - lastTime));
    }

    lastRequestTime.set(domain, Date.now());
}

/**
 * Fetch a URL with rate limiting and retry logic
 */
export async function crawl(
    url: string,
    options: { respectRobots?: boolean; retries?: number } = {}
): Promise<CrawlResult | null> {
    const { respectRobots = true, retries = RATE_LIMIT.maxRetries } = options;

    // Check robots.txt
    if (respectRobots) {
        const allowed = await isAllowedByRobots(url);
        if (!allowed) {
            console.warn(`URL blocked by robots.txt: ${url}`);
            return null;
        }
    }

    let attempt = 0;
    let delay = RATE_LIMIT.initialDelayMs;

    while (attempt < retries) {
        try {
            // Apply rate limiting
            await applyRateLimit(url);

            const response = await fetch(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (compatible; MilkMap/1.0; +https://github.com/milkmap)",
                    Accept: "text/html,application/xhtml+xml",
                },
                timeout: 30000,
            });

            if (response.status === 429) {
                // Rate limited - back off
                console.warn(`Rate limited on ${url}, backing off...`);
                await sleep(delay);
                delay *= RATE_LIMIT.backoffMultiplier;
                attempt++;
                continue;
            }

            if (!response.ok) {
                console.error(`HTTP ${response.status} for ${url}`);
                return null;
            }

            const html = await response.text();

            return {
                url,
                html,
                statusCode: response.status,
                fetchedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error(`Crawl error for ${url}:`, error);
            await sleep(delay);
            delay *= RATE_LIMIT.backoffMultiplier;
            attempt++;
        }
    }

    console.error(`Failed to crawl ${url} after ${retries} attempts`);
    return null;
}

/**
 * Parse HTML with Cheerio
 */
export function parseHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
}

/**
 * Crawl and parse a URL in one step
 */
export async function crawlAndParse(
    url: string
): Promise<cheerio.CheerioAPI | null> {
    const result = await crawl(url);
    if (!result) return null;
    return parseHtml(result.html);
}

/**
 * Extract all links matching a pattern from a page
 */
export async function extractLinks(
    url: string,
    selector: string,
    pattern?: RegExp
): Promise<string[]> {
    const $ = await crawlAndParse(url);
    if (!$) return [];

    const links: string[] = [];
    const baseUrl = new URL(url).origin;

    $(selector).each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;

        // Resolve relative URLs
        const fullUrl = href.startsWith("http")
            ? href
            : href.startsWith("/")
                ? `${baseUrl}${href}`
                : `${baseUrl}/${href}`;

        // Apply pattern filter if provided
        if (!pattern || pattern.test(fullUrl)) {
            links.push(fullUrl);
        }
    });

    return [...new Set(links)]; // Deduplicate
}
