"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Extend Leaflet types for heatLayer
declare module "leaflet" {
    function heatLayer(
        latlngs: Array<[number, number, number?]>,
        options?: {
            minOpacity?: number;
            maxZoom?: number;
            max?: number;
            radius?: number;
            blur?: number;
            gradient?: { [key: number]: string };
        }
    ): L.Layer;
}

export interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
}

interface HeatmapLayerProps {
    points: HeatmapPoint[];
    options?: {
        radius?: number;
        blur?: number;
        maxZoom?: number;
        max?: number;
        minOpacity?: number;
        gradient?: { [key: number]: string };
    };
}

// Default hot gradient (yellow -> orange -> red -> purple)
const DEFAULT_GRADIENT = {
    0.0: '#2b1055',  // deep purple
    0.25: '#7303c0', // purple
    0.5: '#ec38bc',  // pink
    0.75: '#fdeff9', // light pink
    1.0: '#ffffff'   // white hot
};

export default function HeatmapLayer({ points, options = {} }: HeatmapLayerProps) {
    const map = useMap();
    const layerRef = useRef<L.Layer | null>(null);

    useEffect(() => {
        if (!map || points.length === 0) {
            // Clean up if no points
            if (layerRef.current) {
                map?.removeLayer(layerRef.current);
                layerRef.current = null;
            }
            return;
        }

        // Remove existing layer before creating new one
        if (layerRef.current) {
            map.removeLayer(layerRef.current);
        }

        // Convert points to leaflet.heat format: [lat, lng, intensity]
        const heatData: Array<[number, number, number]> = points.map(p => [
            p.lat,
            p.lng,
            p.intensity
        ]);

        // Find max intensity for normalization
        const maxIntensity = Math.max(...points.map(p => p.intensity), 1);

        // Create heatmap layer with merged options
        const heatLayer = L.heatLayer(heatData, {
            radius: options.radius ?? 25,
            blur: options.blur ?? 20,
            maxZoom: options.maxZoom ?? 17,
            max: options.max ?? maxIntensity,
            minOpacity: options.minOpacity ?? 0.4,
            gradient: options.gradient ?? DEFAULT_GRADIENT
        });

        // Store reference and add to map
        layerRef.current = heatLayer;
        heatLayer.addTo(map);

        // Cleanup on unmount
        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, points, options]);

    return null;
}

export { DEFAULT_GRADIENT };
