"use client";

import type { Amenity } from "@/data/locations.schema";

const AMENITY_LABELS: Record<Amenity, string> = {
    changing_table: "Changing Table",
    nursing_chair: "Nursing Chair",
    hot_water: "Hot Water",
    sink: "Sink",
    private_room: "Private Room",
    microwave: "Microwave",
    fridge: "Fridge",
    highchair: "High Chair",
    toys: "Toys",
};

const AMENITY_ICONS: Record<Amenity, string> = {
    changing_table: "🍼",
    nursing_chair: "🪑",
    hot_water: "♨️",
    sink: "🚰",
    private_room: "🚪",
    microwave: "📻",
    fridge: "🧊",
    highchair: "👶",
    toys: "🧸",
};

interface FilterChipsProps {
    selected: Amenity[];
    onChange: (amenities: Amenity[]) => void;
}

export default function FilterChips({ selected, onChange }: FilterChipsProps) {
    const commonAmenities: Amenity[] = [
        "changing_table",
        "nursing_chair",
        "hot_water",
        "sink",
        "private_room",
    ];

    const toggleAmenity = (amenity: Amenity) => {
        if (selected.includes(amenity)) {
            onChange(selected.filter((a) => a !== amenity));
        } else {
            onChange([...selected, amenity]);
        }
    };

    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {commonAmenities.map((amenity) => {
                const isSelected = selected.includes(amenity);
                return (
                    <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`
              px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors
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
    );
}

export { AMENITY_LABELS, AMENITY_ICONS };
