
import { recalculateVerification, calculateFieldConfidence } from "../../utils/verification";
import { Location, Evidence, Source } from "../../data/locations.schema";

function runTest(name: string, location: Partial<Location>, expectedLevel: string, expectedConflicts: string[]) {
    // Mock location defaults
    const loc: Location = {
        id: "test",
        venueName: "Test Venue",
        venueType: "mall",
        lat: 0, lng: 0,
        sources: [],
        evidence: [],
        conflicts: [],
        verificationLevel: "unverified",
        confidence: 0,
        amenities: [],
        cost: "free",
        status: "active",
        isSample: true,
        ...location
    } as Location;

    const result = recalculateVerification(loc);

    const levelMatch = result.verificationLevel === expectedLevel;
    const conflictsMatch = JSON.stringify(result.conflicts.sort()) === JSON.stringify(expectedConflicts.sort());

    if (levelMatch && conflictsMatch) {
        console.log(`✅ ${name}: Passed`);
    } else {
        console.error(`❌ ${name}: Failed`);
        if (!levelMatch) console.error(`   Expected level: ${expectedLevel}, Got: ${result.verificationLevel}`);
        if (!conflictsMatch) console.error(`   Expected conflicts: ${JSON.stringify(expectedConflicts)}, Got: ${JSON.stringify(result.conflicts)}`);
    }
}

console.log("Running Verification Logic Tests...\n");

// Test 1: No sources -> Unverified
runTest("No sources", { sources: [] }, "unverified", []);

// Test 2: 1 source -> User Reported
runTest("1 Source", {
    sources: [{ id: "s1", name: "User", url: "http://test.com", httpStatus: 200, type: "related", isOfficial: false, extractedAt: "" }]
}, "user-reported", []);

// Test 3: 2 sources, no extracted evidence -> Verified (Legacy behavior preserved for now)
runTest("2 Sources (Legacy)", {
    sources: [
        { id: "s1", name: "User", url: "http://test.com", httpStatus: 200, type: "related", isOfficial: false, extractedAt: "" },
        { id: "s2", name: "Blog", url: "http://blog.com", httpStatus: 200, type: "related", isOfficial: false, extractedAt: "" }
    ]
}, "verified", []);

// Test 4: Conflict in Floor (L3 vs L4)
runTest("Floor Conflict", {
    sources: [
        { id: "s1", name: "A", url: "http://a.com", httpStatus: 200, type: "evidence", isOfficial: false, extractedAt: "" },
        { id: "s2", name: "B", url: "http://b.com", httpStatus: 200, type: "evidence", isOfficial: false, extractedAt: "" }
    ],
    evidence: [
        { field: "floor", value: "L3", rawValue: "Level 3", sourceId: "s1", confidence: 10, updatedAt: "" },
        { field: "floor", value: "L4", rawValue: "Level 4", sourceId: "s2", confidence: 10, updatedAt: "" }
    ]
}, "user-reported", ["floor"]);
// Should downgrade to user-reported or unverified on conflict, definitly NOT verifiable

// Test 5: Agreement (L3 vs L3)
runTest("Floor Agreement", {
    sources: [
        { id: "s1", name: "A", url: "http://a.com", httpStatus: 200, type: "evidence", isOfficial: false, extractedAt: "" },
        { id: "s2", name: "B", url: "http://b.com", httpStatus: 200, type: "evidence", isOfficial: false, extractedAt: "" }
    ],
    evidence: [
        { field: "floor", value: "L3", rawValue: "Level 3", sourceId: "s1", confidence: 10, updatedAt: "" },
        { field: "floor", value: "L3", rawValue: "3F", sourceId: "s2", confidence: 10, updatedAt: "" }
    ]
}, "verified", []);

// Test 6: Dead link ignored
runTest("Dead Source Ignored", {
    sources: [
        { id: "s1", name: "A", url: "http://a.com", httpStatus: 404, type: "related", isOfficial: false, extractedAt: "" }, // Dead
        { id: "s2", name: "B", url: "http://b.com", httpStatus: 200, type: "related", isOfficial: false, extractedAt: "" }
    ]
}, "user-reported", []); // Only 1 active source
