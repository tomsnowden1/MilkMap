import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            venueName,
            addressText,
            floor,
            landmark,
            sourceUrl,
            lat,
            lng,
            amenities,
            notes,
        } = body;

        if (!venueName || !addressText || !sourceUrl) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Build GitHub Issue body
        const issueTitle = `New Room Submission: ${venueName}`;
        const issueBody = `
## New Nursing Room Submission

**Venue Name:** ${venueName}
**Address:** ${addressText}
${floor ? `**Floor:** ${floor}` : ""}
${landmark ? `**Landmark/Directions:** ${landmark}` : ""}
${lat && lng ? `**Coordinates:** ${lat}, ${lng}` : ""}

### Amenities
${amenities && amenities.length > 0 ? amenities.map((a: string) => `- ${a.replace(/_/g, " ")}`).join("\n") : "*None specified*"}

### Source
**URL:** ${sourceUrl}

${notes ? `### Additional Notes\n${notes}` : ""}

---
*Submitted via MilkMap submission form*
*Timestamp: ${new Date().toISOString()}*

### Review Checklist
- [ ] Verify source URL
- [ ] Geocode address if lat/lng missing
- [ ] Validate amenities list
- [ ] Add to locations.json
    `.trim();

        // Try to create GitHub Issue via API if token is configured
        const githubToken = process.env.GITHUB_TOKEN;
        const githubOwner = process.env.GITHUB_OWNER;
        const githubRepo = process.env.GITHUB_REPO;

        if (githubToken && githubOwner && githubRepo) {
            try {
                const response = await fetch(
                    `https://api.github.com/repos/${githubOwner}/${githubRepo}/issues`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `token ${githubToken}`,
                            "Content-Type": "application/json",
                            Accept: "application/vnd.github.v3+json",
                        },
                        body: JSON.stringify({
                            title: issueTitle,
                            body: issueBody,
                            labels: ["submission"],
                        }),
                    }
                );

                if (response.ok) {
                    const issue = await response.json();
                    return NextResponse.json({
                        success: true,
                        issueUrl: issue.html_url,
                    });
                }
            } catch (apiError) {
                console.error("GitHub API error:", apiError);
                // Fall through to fallback
            }
        }

        // Fallback: return a prefilled GitHub Issue URL
        const fallbackUrl = createGitHubIssueUrl({
            owner: githubOwner || "YOUR_USERNAME",
            repo: githubRepo || "MilkMap",
            title: issueTitle,
            body: issueBody,
            labels: ["submission"],
        });

        return NextResponse.json({
            success: true,
            fallbackUrl,
            message: "Please create the issue manually",
        });
    } catch (error) {
        console.error("Submit API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function createGitHubIssueUrl(params: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    labels: string[];
}) {
    const baseUrl = `https://github.com/${params.owner}/${params.repo}/issues/new`;
    const searchParams = new URLSearchParams({
        title: params.title,
        body: params.body,
        labels: params.labels.join(","),
    });
    return `${baseUrl}?${searchParams.toString()}`;
}
