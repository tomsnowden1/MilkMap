"use client";

import type { Location } from "@/data/locations.schema";
import { AMENITY_LABELS, AMENITY_ICONS } from "./FilterChips";
import FeedbackButtons from "./FeedbackButtons";
import TrustBadge from "./TrustBadge";
import LastUpdated from "./LastUpdated";
import SourceInfo from "./SourceInfo";

interface LocationDetailProps {
    location: Location;
    onClose: () => void;
}

export default function LocationDetail({
    location,
    onClose,
}: LocationDetailProps) {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto">
                {/* Handle bar (mobile) */}
                <div className="md:hidden flex justify-center py-2">
                    <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {location.venueName}
                            </h2>
                            {location.isSample && (
                                <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                    SAMPLE DATA
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Trust & Verification Section */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <TrustBadge
                                status={location.status}
                                level={location.verificationLevel}
                                verifiedAt={location.verifiedAt}
                                size="md"
                            />
                            <span className="text-sm text-gray-600">
                                Confidence: {location.confidence}%
                            </span>
                        </div>
                        {location.verifiedAt && (
                            <div>
                                <LastUpdated date={location.verifiedAt} prefix="Verified" />
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-6">
                        {location.addressText && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">Address</h3>
                                <p className="text-gray-900">{location.addressText}</p>
                            </div>
                        )}

                        {location.floor && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">Floor</h3>
                                <p className="text-gray-900">{location.floor}</p>
                            </div>
                        )}

                        {location.landmark && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Landmark / Directions
                                </h3>
                                <p className="text-gray-900">{location.landmark}</p>
                            </div>
                        )}

                        {location.hours && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">Hours</h3>
                                <p className="text-gray-900">{location.hours}</p>
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                Amenities
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {location.amenities.length > 0 ? (
                                    location.amenities.map((amenity) => (
                                        <span
                                            key={amenity}
                                            className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-sm"
                                        >
                                            <span>{AMENITY_ICONS[amenity]}</span>
                                            <span>{AMENITY_LABELS[amenity]}</span>
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No amenities listed</p>
                                )}
                            </div>
                        </div>

                        {location.notes && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">Notes</h3>
                                <p className="text-gray-900 text-sm">{location.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Sources */}
                    <div className="mb-6">
                        <SourceInfo sources={location.sources} />
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            📍 Open in Google Maps
                        </a>

                        {/* Feedback */}
                        <div className="pt-4 border-t">
                            <FeedbackButtons locationId={location.id} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
