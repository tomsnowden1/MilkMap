import { describe, it, expect } from "vitest";
import { calculateDistance, formatDistance } from "./distance";

describe("calculateDistance (Haversine)", () => {
    it("returns 0 for same point", () => {
        expect(calculateDistance(1.3521, 103.8198, 1.3521, 103.8198)).toBe(0);
    });

    it("calculates distance between two Singapore locations", () => {
        // Changi Airport → Marina Bay Sands ≈ 16–18 km
        const dist = calculateDistance(1.3644, 103.9915, 1.2834, 103.8607);
        expect(dist).toBeGreaterThan(14);
        expect(dist).toBeLessThan(20);
    });

    it("calculates distance for nearby points (sub-km)", () => {
        // ~100m apart
        const dist = calculateDistance(1.3521, 103.8198, 1.3530, 103.8198);
        expect(dist).toBeGreaterThan(0.05);
        expect(dist).toBeLessThan(0.2);
    });

    it("is symmetric", () => {
        const d1 = calculateDistance(1.3521, 103.8198, 1.2834, 103.8607);
        const d2 = calculateDistance(1.2834, 103.8607, 1.3521, 103.8198);
        expect(d1).toBeCloseTo(d2, 10);
    });
});

describe("formatDistance", () => {
    it("formats sub-1km as meters", () => {
        expect(formatDistance(0.5)).toBe("500m");
        expect(formatDistance(0.123)).toBe("123m");
    });

    it("formats 1km+ with one decimal", () => {
        expect(formatDistance(1.0)).toBe("1.0km");
        expect(formatDistance(2.567)).toBe("2.6km");
        expect(formatDistance(15.32)).toBe("15.3km");
    });
});

describe("sorting by distance", () => {
    const userLat = 1.3521;
    const userLng = 103.8198;

    const locations = [
        { id: "far", name: "Far", lat: 1.4000, lng: 103.9000 }, // ~10km
        { id: "near", name: "Near", lat: 1.3530, lng: 103.8200 }, // ~0.1km
        { id: "mid", name: "Mid", lat: 1.3600, lng: 103.8400 }, // ~2.5km
    ];

    it("sorts nearest first", () => {
        const sorted = [...locations].sort((a, b) => {
            const distA = calculateDistance(userLat, userLng, a.lat, a.lng);
            const distB = calculateDistance(userLat, userLng, b.lat, b.lng);
            return distA - distB;
        });
        expect(sorted.map((l) => l.id)).toEqual(["near", "mid", "far"]);
    });

    it("is stable for equal distances", () => {
        const same = [
            { id: "a", lat: 1.3530, lng: 103.8200 },
            { id: "b", lat: 1.3530, lng: 103.8200 },
            { id: "c", lat: 1.3530, lng: 103.8200 },
        ];
        const sorted = [...same].sort((a, b) => {
            const distA = calculateDistance(userLat, userLng, a.lat, a.lng);
            const distB = calculateDistance(userLat, userLng, b.lat, b.lng);
            return distA - distB;
        });
        expect(sorted.map((l) => l.id)).toEqual(["a", "b", "c"]);
    });

    it("sorts items with NaN/missing coords to bottom", () => {
        const withMissing = [
            { id: "ok", lat: 1.3530, lng: 103.8200 },
            { id: "bad", lat: NaN, lng: NaN },
            { id: "ok2", lat: 1.3600, lng: 103.8400 },
        ];
        const sorted = [...withMissing].sort((a, b) => {
            const distA = Number.isFinite(a.lat) && Number.isFinite(a.lng)
                ? calculateDistance(userLat, userLng, a.lat, a.lng)
                : Infinity;
            const distB = Number.isFinite(b.lat) && Number.isFinite(b.lng)
                ? calculateDistance(userLat, userLng, b.lat, b.lng)
                : Infinity;
            return distA - distB;
        });
        expect(sorted.map((l) => l.id)).toEqual(["ok", "ok2", "bad"]);
    });
});
