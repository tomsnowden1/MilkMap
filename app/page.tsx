"use client";

import { useState, useMemo } from "react";
import locationsDataRaw from "@/data/locations.json";
import { LocationsDataSchema, type Location } from "@/data/locations.schema";
import MapView from "@/components/MapView";
import LocationList from "@/components/LocationList";
import SearchBar from "@/components/SearchBar";
import FilterChips from "@/components/FilterChips";
import LocationDetail from "@/components/LocationDetail";
import AddRoomForm from "@/components/AddRoomForm";
import type { Amenity } from "@/data/locations.schema";

import { calculateDistance } from "@/utils/distance";

export default function HomePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [sortMode, setSortMode] = useState<"default" | "distance">("default");
    const [locationError, setLocationError] = useState<string | null>(null);

    // Normalize data before validation to prevent crashes
    const raw = locationsDataRaw as any;

    // Ensure lastUpdated exists
    if (!raw.lastUpdated) {
        raw.lastUpdated = new Date().toISOString();
    }

    let fixedCount = 0;
    let droppedCount = 0;
    const initialCount = Array.isArray(raw.locations) ? raw.locations.length : 0;

    if (Array.isArray(raw.locations)) {
        raw.locations = raw.locations.map((loc: any) => {
            // Fix missing venueName
            if (!loc.venueName) {
                loc.venueName = loc.mallName || loc.venue || loc.title || loc.addressText || loc.id || "Unknown Location";
                fixedCount++;
            }
            return loc;
        }).filter((loc: any) => {
            // Drop invalid coordinates to avoid map crashes
            if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
                droppedCount++;
                return false;
            }
            return true;
        });
    }

    if (process.env.NODE_ENV === "development") {
        console.log(`[Dev] Locations: ${raw.locations?.length ?? 0}/${initialCount}, Auto-named: ${fixedCount}, Dropped: ${droppedCount}`);
    }

    // Validate and parse the JSON data
    const locationsData = LocationsDataSchema.parse(raw);

    // Filter out sample data in production, or show based on flag
    const showSamples = process.env.NODE_ENV === "development";
    const allLocations: Location[] = locationsData.locations.filter(
        (loc) => showSamples || !loc.isSample
    );

    // Handle "Near Me" click
    const handleNearMe = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setIsLocating(false);
                setSortMode("distance");
                setSearchQuery("");
            },
            (error) => {
                console.error("Error getting location:", error);
                setIsLocating(false);
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError("Location permission denied. Please enable it in your browser settings.");
                } else if (error.code === error.TIMEOUT) {
                    setLocationError("Location request timed out. Try again.");
                } else {
                    setLocationError("Unable to retrieve your location.");
                }
            },
            { timeout: 10000 }
        );
    };

    // Handle sort change
    const handleSortChange = (mode: "default" | "distance") => {
        setSortMode(mode);
        if (mode === "distance" && !userLocation) {
            handleNearMe();
        }
    };

    // Filtered locations based on search and amenity filters
    const filteredLocations = useMemo(() => {
        let filtered = allLocations.filter((location) => {
            // Search filter
            const matchesSearch =
                searchQuery === "" ||
                (location.venueName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                location.addressText?.toLowerCase().includes(searchQuery.toLowerCase());

            // Amenity filter (must have ALL selected amenities)
            const matchesAmenities =
                selectedAmenities.length === 0 ||
                selectedAmenities.every((amenity) => location.amenities.includes(amenity));

            return matchesSearch && matchesAmenities;
        });

        // Sort by distance only when explicitly selected and location available
        if (sortMode === "distance" && userLocation) {
            filtered = [...filtered].sort((a, b) => {
                const distA = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    a.lat,
                    a.lng
                );
                const distB = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    b.lat,
                    b.lng
                );
                return distA - distB;
            });
        }

        return filtered;
    }, [allLocations, searchQuery, selectedAmenities, userLocation, sortMode]);

    return (
        <div className="h-screen w-full relative overflow-hidden flex flex-col md:flex-row">
            {/* Mobile Header - Floating */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none md:hidden">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 pointer-events-auto space-y-3 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            🍼 <span className="text-blue-600">MilkMap</span>
                        </h1>
                        <p className="text-xs text-gray-500">Find nursing rooms</p>
                    </div>

                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onNearMeClick={handleNearMe}
                        isLocating={isLocating}
                    />

                    <div className="overflow-x-auto pb-1 -mx-1 px-1">
                        <FilterChips
                            selected={selectedAmenities}
                            onChange={setSelectedAmenities}
                        />
                    </div>
                </div>
            </div>

            {/* Desktop Sidebar - Left */}
            <div className="hidden md:flex flex-col w-96 bg-white border-r z-20 shadow-xl relative">
                <header className="p-4 border-b bg-white">
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            🍼 MilkMap
                        </h1>
                        <p className="text-sm text-gray-600">
                            Find free nursing & baby-care rooms in Singapore
                        </p>
                    </div>

                    <div className="space-y-3">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onNearMeClick={handleNearMe}
                            isLocating={isLocating}
                        />
                        <FilterChips
                            selected={selectedAmenities}
                            onChange={setSelectedAmenities}
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-hidden relative">
                    <LocationList
                        locations={filteredLocations}
                        onLocationSelect={setSelectedLocation}
                        selectedLocation={selectedLocation}
                        userLocation={userLocation}
                        sortMode={sortMode}
                        onSortChange={handleSortChange}
                        isLocating={isLocating}
                        locationError={locationError}
                        onRetryLocation={handleNearMe}
                    />

                    {/* Add Room Button (Desktop - Floating in Sidebar) */}
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="absolute bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-2xl"
                        title="Add Room"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Map Container - Full Screen on Mobile, Flex on Desktop */}
            <div className="absolute inset-0 md:relative md:flex-1 z-0">
                <MapView
                    locations={filteredLocations}
                    onLocationSelect={setSelectedLocation}
                    selectedLocation={selectedLocation}
                    userLocation={userLocation}
                />
            </div>

            {/* Mobile Bottom Sheet - List */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 h-[40vh] bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-10 flex flex-col">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3 flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                    <LocationList
                        locations={filteredLocations}
                        onLocationSelect={setSelectedLocation}
                        selectedLocation={selectedLocation}
                        userLocation={userLocation}
                        sortMode={sortMode}
                        onSortChange={handleSortChange}
                        isLocating={isLocating}
                        locationError={locationError}
                        onRetryLocation={handleNearMe}
                    />
                </div>
            </div>

            {/* Mobile FAB - Add Room */}
            <button
                onClick={() => setShowAddForm(true)}
                className="md:hidden absolute bottom-[42vh] right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-2xl z-20"
                aria-label="Add Room"
            >
                +
            </button>

            {/* Location Detail Drawer */}
            {selectedLocation && (
                <LocationDetail
                    location={selectedLocation}
                    onClose={() => setSelectedLocation(null)}
                />
            )}

            {/* Add Room Form Modal */}
            {showAddForm && (
                <AddRoomForm onClose={() => setShowAddForm(false)} />
            )}
        </div>
    );
}
