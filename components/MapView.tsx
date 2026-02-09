"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Location } from "@/data/locations.schema";

interface MapViewProps {
    locations: Location[];
    onLocationSelect: (location: Location) => void;
    selectedLocation: Location | null;
    userLocation: { lat: number; lng: number } | null;
}

export default function MapView({
    locations,
    onLocationSelect,
    selectedLocation,
    userLocation,
}: MapViewProps) {
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersLayerRef = useRef<any>(null);
    const [mapLoading, setMapLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    // Initialize map once on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (mapRef.current) return; // Already initialized

        const initMap = async () => {
            try {
                setMapLoading(true);
                setMapError(null);

                const L = (await import("leaflet")).default;

                if (mapContainerRef.current) {
                    // Singapore center coordinates
                    mapRef.current = L.map(mapContainerRef.current).setView(
                        [1.3521, 103.8198],
                        12
                    );

                    // Add OpenStreetMap tiles with proper attribution
                    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        attribution:
                            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 19,
                    }).addTo(mapRef.current);

                    // Create a layer group for markers
                    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

                    setMapLoading(false);
                }
            } catch (error) {
                console.error("Map initialization error:", error);
                setMapError("Failed to load map. Please refresh the page.");
                setMapLoading(false);
            }
        };

        initMap();
    }, []); // Only run once on mount

    // Update markers when locations change
    useEffect(() => {
        if (!markersLayerRef.current) return;

        const L = (window as any).L;
        if (!L) return;

        markersLayerRef.current.clearLayers();

        locations.forEach((location) => {
            const icon = L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });

            const marker = L.marker([location.lat, location.lng], { icon })
                .bindPopup(
                    `<div class="font-sans">
                <strong class="text-base">${location.venueName}</strong><br/>
                <span class="text-sm text-gray-600">${location.floor || "N/A"}</span>
              </div>`
                )
                .on("click", () => {
                    onLocationSelect(location);
                });

            markersLayerRef.current.addLayer(marker);
        });
    }, [locations, onLocationSelect]);

    // Pan to selected location
    useEffect(() => {
        if (selectedLocation && mapRef.current) {
            mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 16);
        }
    }, [selectedLocation]);

    // Handle user location marker
    const userMarkerRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const L = (window as any).L;
        if (!L) return;

        if (userLocation) {
            if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
            } else {
                // Create a blue pulsing dot for user location
                const userIcon = L.divIcon({
                    className: "user-location-marker",
                    html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative">
                            <div class="absolute -inset-2 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                           </div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                });

                userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
                    icon: userIcon,
                    zIndexOffset: 1000, // Always on top
                })
                    .addTo(mapRef.current)
                    .bindPopup("You are here");

                // Fly to user location on first fix
                mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15);
            }
        } else if (userMarkerRef.current) {
            // Remove marker if user location is cleared
            mapRef.current.removeLayer(userMarkerRef.current);
            userMarkerRef.current = null;
        }
    }, [userLocation]);

    return (
        <div className="w-full h-full relative">
            {/* Map container - always rendered */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Loading overlay */}
            {mapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-[1000]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading map...</p>
                    </div>
                </div>
            )}

            {/* Error overlay */}
            {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-[1000]">
                    <div className="text-center p-6">
                        <p className="text-red-600 text-lg mb-2">⚠️ Map Error</p>
                        <p className="text-gray-700 text-sm mb-4">{mapError}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
