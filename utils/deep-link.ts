/**
 * Build a deep-link URL that scrolls/highlights evidence on a page.
 *
 * Strategy:
 *   1. Text fragment (#:~:text=...) – works in Chromium browsers
 *   2. Hash anchor (#section) – fallback if provided
 *   3. Plain URL – ultimate fallback
 *
 * Never throws.
 */
export function buildEvidenceDeepLink(
    baseUrl: string,
    options?: { textFragment?: string; hash?: string }
): string {
    if (!baseUrl) return "";
    try {
        const url = new URL(baseUrl);

        // Prefer text fragment (Chromium)
        if (options?.textFragment) {
            const encoded = encodeURIComponent(options.textFragment);
            url.hash = `:~:text=${encoded}`;
            return url.toString();
        }

        // Fallback to hash
        if (options?.hash) {
            url.hash = options.hash;
            return url.toString();
        }

        return url.toString();
    } catch {
        // If URL parsing fails, attempt naive concatenation
        if (options?.textFragment) {
            return `${baseUrl}#:~:text=${encodeURIComponent(options.textFragment)}`;
        }
        if (options?.hash) {
            return `${baseUrl}#${options.hash}`;
        }
        return baseUrl;
    }
}
