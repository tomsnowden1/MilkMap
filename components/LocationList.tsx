"use client";

import type { Location } from "@/data/locations.schema";
import { AMENITY_ICONS } from "./FilterChips";
import TrustBadge from "./TrustBadge";
import { calculateDistance, formatDistance } from "@/utils/distance";

interface LocationListProps {
    locations: Location[];
    onLocationSelect: (location: Location) => void;
    selectedLocation: Location | null;
    userLocation: { lat: number; lng: number } | null;
    sortMode: "default" | "distance";
    onSortChange: (mode: "default" | "distance") => void;
    isLocating: boolean;
    locationError: string | null;
    onRetryLocation: () => void;
}

export default function LocationList({
    locations,
    onLocationSelect,
    selectedLocation,
    userLocation,
    sortMode,
    onSortChange,
    isLocating,
    locationError,
    onRetryLocation,
}: LocationListProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">
                        {locations.length} {locations.length === 1 ? "Location" : "Locations"}
                    </h2>
                    <select
                        value={sortMode}
                        onChange={(e) => onSortChange(e.target.value as "default" | "distance")}
                        className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label="Sort order"
                    >
                        <option value="default">Sort: Default</option>
                        <option value="distance">Sort: Distance to me</option>
                    </select>
                </div>

                {/* Location states */}
                {sortMode === "distance" && isLocating && (
                    <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                        <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Getting your location…
                    </p>
                )}
                {sortMode === "distance" && locationError && (
                    <div className="mt-1.5 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5 flex items-center justify-between gap-2">
                        <span>{locationError}</span>
                        <button
                            onClick={onRetryLocation}
                            className="text-blue-600 font-medium hover:underline whitespace-nowrap"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {locations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-4xl mb-2">🔍</p>
                        <p>No locations found.</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {locations.map((location) => {
                            const isSelected = selectedLocation?.id === location.id;
                            return (
                                <li key={location.id}>
                                    <button
                                        onClick={() => onLocationSelect(location)}
                                        className={`
                      w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors
                      ${isSelected ? "bg-blue-50 border-l-4 border-blue-600" : ""}
                    `}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {location.venueName}
                                                    {location.isSample && (
                                                        <span className="ml-2 text-xs text-orange-600 font-normal">
                                                            [SAMPLE]
                                                        </span>
                                                    )}
                                                </h3>
                                                {location.rooms && location.rooms.length > 1 ? (
                                                    <p className="text-sm text-gray-600">
                                                        {location.rooms.length} rooms
                                                        <span className="text-gray-400 ml-1">
                                                            · Levels {[...new Set(location.rooms.map(r => r.floor.replace(/^Level\s*/i, '')))].join(', ')}
                                                        </span>
                                                        {userLocation && (
                                                            <span className="ml-2 text-blue-600 font-medium">
                                                                • {formatDistance(
                                                                    calculateDistance(
                                                                        userLocation.lat,
                                                                        userLocation.lng,
                                                                        location.lat,
                                                                        location.lng
                                                                    )
                                                                )} away
                                                            </span>
                                                        )}
                                                    </p>
                                                ) : location.floor && (
                                                    <p className="text-sm text-gray-600">
                                                        Floor: {location.floor}
                                                        {userLocation && (
                                                            <span className="ml-2 text-blue-600 font-medium">
                                                                • {formatDistance(
                                                                    calculateDistance(
                                                                        userLocation.lat,
                                                                        userLocation.lng,
                                                                        location.lat,
                                                                        location.lng
                                                                    )
                                                                )} away
                                                            </span>
                                                        )}
                                                    </p>
                                                )}
                                                {location.addressText && (
                                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                                        {location.addressText}
                                                    </p>
                                                )}
                                                <div className="flex gap-1 mt-2 flex-wrap">
                                                    {location.amenities.slice(0, 4).map((amenity) => (
                                                        <span
                                                            key={amenity}
                                                            className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                                                            title={amenity.replace(/_/g, " ")}
                                                        >
                                                            {AMENITY_ICONS[amenity]}
                                                        </span>
                                                    ))}
                                                    {location.amenities.length > 4 && (
                                                        <span className="text-xs text-gray-400">
                                                            +{location.amenities.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <TrustBadge
                                                    status={location.status}
                                                    level={location.verificationLevel}
                                                    hasConflicts={location.conflicts && location.conflicts.length > 0}
                                                    verifiedAt={location.verifiedAt}
                                                    size="sm"
                                                    showTooltip={false}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
