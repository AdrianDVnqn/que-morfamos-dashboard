"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, LayersControl, LayerGroup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Define specific icon with fallback for properties
const customIcon = new L.Icon({
    iconUrl: iconMarker.src || iconMarker.toString(),
    iconRetinaUrl: iconRetina.src || iconRetina.toString(),
    shadowUrl: iconShadow.src || iconShadow.toString(),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Use shared client
import { supabase } from "@/lib/supabase";
import { ZONAS_MAP, ZONE_COLORS, getZone } from "@/data/zones";
import { convertGeoJSONCoordinates } from '@/lib/geoUtils';

import MapFilters from "./MapFilters";

export default function RestaurantMap() {
    const [barrios, setBarrios] = useState<any>(null);
    const [lugares, setLugares] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Filters State (Multi-select arrays)
    const [filters, setFilters] = useState<{
        zones: string[];
        barrios: string[];
        categories: string[];
        ratingRanges: string[];
    }>({
        zones: [],
        barrios: [],
        categories: [],
        ratingRanges: []
    });

    // Derived Data for Filter Lists
    const [filterOptions, setFilterOptions] = useState<{
        zones: string[];
        barrios: string[];
        categories: string[];
    }>({ zones: [], barrios: [], categories: [] });

    useEffect(() => {
        // 1. Fetch Barrios (Local GeoJSON)
        fetch('/data/shapeBarrios.json')
            .then(res => {
                if (!res.ok) throw new Error(`Error Barrios HTTP: ${res.status}`);
                return res.json();
            })
            .then(data => {
                // Enforce tagging with normalization
                if (data.features) {
                    data.features = data.features.map((f: any) => {
                        // Convert coordinates from Web Mercator to WGS84
                        convertGeoJSONCoordinates(f.geometry);

                        // Use robust getZone to fix "Otras Zonas" mismatch
                        f.properties.zona = getZone(f.properties.NOMBRE);
                        return f;
                    });
                    setBarrios(data);
                } else {
                    throw new Error("Formato GeoJSON inválido (sin features)");
                }
            })
            .catch(err => {
                console.error("Error fetching barrios:", err);
                setError(`Falló carga de Barrios: ${err.message}`);
            });

        // 2. Fetch Lugares (Supabase)
        const fetchLugares = async () => {
            try {
                const { data, error } = await supabase
                    .from('lugares')
                    .select('nombre, latitud, longitud, barrio, zona, categoria, rating_gral, total_reviews_google, direccion')
                    .not('latitud', 'is', null)
                    .not('longitud', 'is', null);

                if (error) throw error;

                if (!data) {
                    throw new Error("Supabase devolvió datos vacíos");
                }

                // Convert to GeoJSON format for consistency
                const features: any[] = [];
                const zonesSet = new Set<string>();
                const categoriesSet = new Set<string>();

                data.forEach((l: any) => {
                    if (l.zona) zonesSet.add(l.zona);
                    if (l.categoria) categoriesSet.add(l.categoria);

                    const lat = parseFloat(l.latitud);
                    const lon = parseFloat(l.longitud);

                    if (!isNaN(lat) && !isNaN(lon)) {
                        features.push({
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [lon, lat]
                            },
                            properties: {
                                restaurante: l.nombre,
                                ...l,
                                rating_gral: parseFloat(l.rating_gral) || 0
                            }
                        });
                    }
                });

                setLugares({
                    type: "FeatureCollection",
                    features: features
                });
                setFilterOptions(prev => ({
                    ...prev,
                    zones: Array.from(zonesSet).sort(),
                    categories: Array.from(categoriesSet).sort()
                }));

            } catch (err: any) {
                console.error("Error fetching lugares from Supabase:", err);
                setError(`Falló carga de Lugares: ${err.message || JSON.stringify(err)}`);
            }
        };

        fetchLugares();
    }, []);

    // Update available barrios based on selected zone
    useEffect(() => {
        if (!barrios) return;

        let availableBarrios = new Set<string>();
        barrios.features.forEach((f: any) => {
            // If no zone selected, all barrios valid. 
            // If zones selected, barrio must be in one of them.
            if (filters.zones.length === 0 || filters.zones.includes(f.properties.zona)) {
                availableBarrios.add(f.properties.NOMBRE);
            }
        });

        setFilterOptions(prev => ({
            ...prev,
            barrios: Array.from(availableBarrios).sort()
        }));
    }, [barrios, filters.zones]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => {
            const newFilters = { ...prev, [key]: value };
            // Optional: reset child filters if parent changes? 
            // For multi-select, maybe keep them if valid? 
            // Simplicity: Clear barrios if zones cleared? No, keep it flexible.
            return newFilters;
        });
    };

    const resetFilters = () => setFilters({ zones: [], barrios: [], categories: [], ratingRanges: [] });

    // Filter Logic
    const filteredLugares = placesFilter(lugares, filters);
    const filteredBarrios = barriosFilter(barrios, filters);

    function checkRating(rating: number, ranges: string[]) {
        if (ranges.length === 0) return true;
        return ranges.some(r => {
            const [min, max] = r.split('-').map(Number);
            // Note: 5.0 needs inclusive handling? 
            // Logic: 4.5-5.0 usually covers UP TO 5.0. 
            // Adjust: if max is 5.0, make it inclusive.
            if (max === 5.0) return rating >= min && rating <= max;
            return rating >= min && rating < max;
        });
    }

    function placesFilter(data: any, filters: any) {
        if (!data) return null;
        const features = data.features.filter((f: any) => {
            const p = f.properties;

            if (filters.zones.length > 0 && !filters.zones.includes(p.zona)) return false;

            // Note: 'barrio' in places might differ from shapefile names. 
            // Relaxing mismatch logic or relying on zone is safer.
            // But if user specificly picks a barrio, we try to match.
            if (filters.barrios.length > 0 && !filters.barrios.includes(p.barrio)) {
                // Try fuzzy match? Or just strict? Strict for now.
                // If data.barrio is "Don Bosco II" and filter is "Don Bosco II", it works.
                // If data.barrio is null, skip.
                return false;
            }

            if (filters.categories.length > 0 && !filters.categories.includes(p.categoria)) return false;

            if (filters.ratingRanges.length > 0) {
                const rating = typeof p.rating_gral === 'string' ? parseFloat(p.rating_gral) : p.rating_gral;
                if (!checkRating(rating || 0, filters.ratingRanges)) {
                    // console.log(`[Filter] Rejected ${p.restaurante} because rating ${rating} not in ${filters.ratingRanges}`);
                    return false;
                }
            }

            return true;
        });

        console.log(`[Filter] Places Count: ${features.length} / ${data.features.length}`);
        return { ...data, features };
    }

    function barriosFilter(data: any, filters: any) {
        if (!data) return null;
        const features = data.features.filter((f: any) => {
            const p = f.properties;

            // Logic: Show barrios if they belong to selected zones.
            // If no zones selected, show ALL barrios.
            if (filters.zones.length > 0 && !filters.zones.includes(p.zona)) return false;

            // Logic: If specific barrios selected, show ONLY those.
            if (filters.barrios.length > 0 && !filters.barrios.includes(p.NOMBRE)) return false;

            return true;
        });

        // Debug Log
        console.log(`Filtering Barrios: 
            Zones Filter: ${JSON.stringify(filters.zones)}
            Features Count: ${features.length}
            Sample Feature: ${features.length > 0 ? JSON.stringify(features[0].properties) : 'None'}
        `);

        return { ...data, features };
    }

    const styleBarrios = (feature: any) => {
        return {
            fillColor: ZONE_COLORS[feature.properties.zona] || '#9ca3af',
            weight: 2, // Increased weight for visibility
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.5 // Increased opacity for visibility
        };
    };

    const onEachBarrio = (feature: any, layer: any) => {
        layer.bindPopup(`<b>${feature.properties.NOMBRE}</b><br/>${feature.properties.zona}`);
    };

    if (error) return (
        <div className="h-full flex flex-col items-center justify-center text-red-500 p-8 text-center">
            <p className="font-bold text-lg mb-2">⚠️ Hubo un problema cargando el mapa</p>
            <pre className="text-xs bg-red-50 dark:bg-red-950/30 p-4 rounded max-w-lg overflow-auto border border-red-200 dark:border-red-900">
                {error}
            </pre>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 text-sm"
            >
                Reintentar
            </button>
        </div>
    );

    if (!barrios || !lugares) return (
        <div className="h-full flex flex-col items-center justify-center text-primary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <span className="font-medium">Cargando mapa...</span>
            <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span className={barrios ? "text-green-500" : ""}>
                    {barrios ? "✓ Barrios" : "⏳ Barrios..."}
                </span>
                <span className="text-gray-600">|</span>
                <span className={lugares ? "text-green-500" : ""}>
                    {lugares ? "✓ Lugares" : "⏳ Lugares..."}
                </span>
            </div>
        </div>
    );

    return (
        <>
            <MapFilters
                zones={filterOptions.zones}
                barrios={filterOptions.barrios}
                categories={filterOptions.categories}
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
            />

            <MapContainer
                center={[-38.9516, -68.0591]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <LayersControl position="topright">
                    <LayersControl.Overlay checked name="Barrios y Zonas">
                        <GeoJSON
                            data={filteredBarrios}
                            style={styleBarrios}
                            onEachFeature={onEachBarrio}
                            key={`geo-json-${filters.zones.join('-')}-${filters.barrios.join('-')}`} // Force re-render on filter change
                        />
                    </LayersControl.Overlay>

                    <LayersControl.Overlay checked name="Restaurantes">
                        <LayerGroup>
                            {filteredLugares?.features?.map((lugar: any, idx: number) => {
                                const [lon, lat] = lugar.geometry.coordinates;
                                return (
                                    <Marker key={idx} position={[lat, lon]} icon={customIcon}>
                                        <Popup>
                                            <div className="p-1">
                                                <h3 className="font-bold text-sm">{lugar.properties.restaurante}</h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-300">{lugar.properties.categoria}</p>
                                                <p className="text-xs">⭐ {lugar.properties.rating_gral} ({lugar.properties.total_reviews_google})</p>
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800">
                                                    {lugar.properties.zona}
                                                </span>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            })}
                        </LayerGroup>
                    </LayersControl.Overlay>
                </LayersControl>
            </MapContainer>
        </>
    );
}
