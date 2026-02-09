"use client";

import { useState } from "react";
import type { Amenity } from "@/data/locations.schema";
import { AMENITY_LABELS, AMENITY_ICONS } from "./FilterChips";

interface AddRoomFormProps {
    onClose: () => void;
}

export default function AddRoomForm({ onClose }: AddRoomFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        venueName: "",
        addressText: "",
        floor: "",
        landmark: "",
        sourceUrl: "",
        lat: "",
        lng: "",
        amenities: [] as Amenity[],
        notes: "",
    });

    const allAmenities: Amenity[] = [
        "changing_table",
        "nursing_chair",
        "hot_water",
        "sink",
        "private_room",
        "microwave",
        "fridge",
        "highchair",
        "toys",
    ];

    const toggleAmenity = (amenity: Amenity) => {
        if (formData.amenities.includes(amenity)) {
            setFormData({
                ...formData,
                amenities: formData.amenities.filter((a) => a !== amenity),
            });
        } else {
            setFormData({
                ...formData,
                amenities: [...formData.amenities, amenity],
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.venueName || !formData.addressText || !formData.sourceUrl) {
            alert("Please fill in all required fields");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.issueUrl || result.fallbackUrl) {
                const url = result.issueUrl || result.fallbackUrl;
                window.open(url, "_blank");
                alert("Thank you! Your submission will be reviewed.");
                onClose();
            }
        } catch (error) {
            console.error("Failed to submit:", error);
            alert("Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Add a Room</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Venue Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.venueName}
                                onChange={(e) =>
                                    setFormData({ ...formData, venueName: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., VivoCity, Changi Airport T3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.addressText}
                                onChange={(e) =>
                                    setFormData({ ...formData, addressText: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Full Singapore address"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Floor
                                </label>
                                <input
                                    type="text"
                                    value={formData.floor}
                                    onChange={(e) =>
                                        setFormData({ ...formData, floor: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., L3, B1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Landmark / Directions
                                </label>
                                <input
                                    type="text"
                                    value={formData.landmark}
                                    onChange={(e) =>
                                        setFormData({ ...formData, landmark: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Near Starbucks"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Amenities
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {allAmenities.map((amenity) => {
                                    const isSelected = formData.amenities.includes(amenity);
                                    return (
                                        <button
                                            key={amenity}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity)}
                                            className={`
                        px-3 py-1.5 rounded-lg text-sm transition-colors
                        ${isSelected
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }
                      `}
                                        >
                                            {AMENITY_ICONS[amenity]} {AMENITY_LABELS[amenity]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Source URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                required
                                value={formData.sourceUrl}
                                onChange={(e) =>
                                    setFormData({ ...formData, sourceUrl: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Where did you find this information? (website, official source, etc.)
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Latitude (optional)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.lat}
                                    onChange={(e) =>
                                        setFormData({ ...formData, lat: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="1.3521"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Longitude (optional)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.lng}
                                    onChange={(e) =>
                                        setFormData({ ...formData, lng: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="103.8198"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Additional Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Any other details..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {submitting ? "Submitting..." : "Submit for Review"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
