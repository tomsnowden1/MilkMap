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
}

export default function LocationList({
    locations,
    onLocationSelect,
    selectedLocation,
    userLocation,
}: LocationListProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">
                    {locations.length} {locations.length === 1 ? "Location" : "Locations"}
                </h2>
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
                                                {location.floor && (
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
