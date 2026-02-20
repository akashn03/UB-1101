"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import Image from "next/image";

// Fix for missing default markers in Leaflet + Next.js
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Apply fix only on client
if (typeof window !== "undefined") {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
    });
}

type MapIssue = {
    id: string;
    image_url: string | null;
    ai_title: string | null;
    ai_category: string | null;
    latitude: number;
    longitude: number;
    upvote_count: number;
};

// Map Categories to visually distinct colors
function getCategoryColor(category: string | null): string {
    const cat = (category || "").toLowerCase();
    if (cat.includes("water") || cat.includes("leak")) return "#3b82f6"; // bg-blue-500
    if (cat.includes("road") || cat.includes("pothole") || cat.includes("street")) return "#64748b"; // bg-slate-500
    if (cat.includes("trash") || cat.includes("garbage") || cat.includes("litter")) return "#10b981"; // bg-emerald-500
    if (cat.includes("power") || cat.includes("light") || cat.includes("electrical")) return "#f59e0b"; // bg-amber-500
    if (cat.includes("danger") || cat.includes("hazard")) return "#ef4444"; // bg-red-500
    return "#8b5cf6"; // Default: bg-violet-500
}

export default function MapComponent({ issues }: { issues: MapIssue[] }) {
    // Default bounds to a generic center if no issues (e.g., center of US or a specific city)
    // Let's use the average of all issue coords if available, else a default
    const defaultCenter: [number, number] = issues.length > 0
        ? [issues[0].latitude, issues[0].longitude]
        : [40.7128, -74.0060]; // NY

    return (
        <div className="w-full h-[600px] z-0 relative rounded-lg overflow-hidden">
            <MapContainer
                center={defaultCenter}
                zoom={12}
                scrollWheelZoom={true}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {issues.map((issue) => {
                    // Base circle radius is 6, max is 24, incremented by upvotes
                    const radius = Math.min(24, 6 + (issue.upvote_count * 2));
                    const color = getCategoryColor(issue.ai_category);

                    return (
                        <CircleMarker
                            key={issue.id}
                            center={[issue.latitude, issue.longitude]}
                            pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: 0.6,
                                weight: 2,
                            }}
                            radius={radius}
                        >
                            <Popup className="rounded-2xl">
                                <div className="w-48 overflow-hidden">
                                    <div className="relative w-full h-28 bg-slate-100 mb-2 rounded-lg overflow-hidden">
                                        {issue.image_url ? (
                                            <Image
                                                src={issue.image_url}
                                                alt={issue.ai_title || "Issue"}
                                                fill
                                                className="object-cover"
                                                sizes="192px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1">
                                        {issue.ai_title || "Untitled Civic Issue"}
                                    </h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800">
                                            {issue.ai_category || "Uncategorized"}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-500">
                                            👍 {issue.upvote_count}
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
