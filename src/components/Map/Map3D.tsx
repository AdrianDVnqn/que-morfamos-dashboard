"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { FlyToInterpolator } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import { ColumnLayer, ScatterplotLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";
import { Card } from "@/components/ui/card";
import "maplibre-gl/dist/maplibre-gl.css";

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Vista inicial centrada en Neuquén Capital
const INITIAL_VIEW_STATE = {
    longitude: -68.06,
    latitude: -38.95,
    zoom: 12,
    pitch: 55,
    bearing: -20
};

// Tipos de visualización
type ViewMode = 'density' | 'reviews' | 'rating';

interface RestaurantPoint {
    longitude: number;
    latitude: number;
    reviews: number;
    rating: number;
    name: string;
}

interface GridCell {
    position: [number, number];
    count: number;
    totalReviews: number;
    avgRating: number;
    places: string[];
}

// Función para crear un grid de celdas a partir de puntos
function createGrid(points: RestaurantPoint[], cellSize: number = 0.002): GridCell[] {
    const grid: Record<string, GridCell> = {};

    points.forEach(point => {
        // Redondear coordenadas al tamaño de celda
        const gridLng = Math.floor(point.longitude / cellSize) * cellSize + cellSize / 2;
        const gridLat = Math.floor(point.latitude / cellSize) * cellSize + cellSize / 2;
        const key = `${gridLng.toFixed(6)}_${gridLat.toFixed(6)}`;

        if (!grid[key]) {
            grid[key] = {
                position: [gridLng, gridLat],
                count: 0,
                totalReviews: 0,
                avgRating: 0,
                places: []
            };
        }

        grid[key].count += 1;
        grid[key].totalReviews += point.reviews;
        grid[key].places.push(point.name);
        // Calcular promedio incremental
        const n = grid[key].count;
        grid[key].avgRating = grid[key].avgRating + (point.rating - grid[key].avgRating) / n;
    });

    return Object.values(grid);
}

// Paletas de colores para cada modo
function getColor(value: number, maxValue: number, mode: ViewMode): [number, number, number, number] {
    const t = Math.min(value / Math.max(maxValue, 1), 1);

    switch (mode) {
        case 'density':
            // Cyan -> Verde -> Amarillo -> Rojo
            if (t < 0.33) return [50, 200, 255, 200];
            if (t < 0.66) return [100, 255, 150, 220];
            return [255, 100, 50, 255];
        case 'reviews':
            // Amarillo -> Naranja -> Rojo
            if (t < 0.33) return [255, 220, 100, 180];
            if (t < 0.66) return [255, 150, 50, 220];
            return [220, 50, 30, 255];
        case 'rating':
            // Azul -> Verde -> Dorado
            if (t < 0.33) return [80, 100, 200, 180];
            if (t < 0.66) return [100, 200, 150, 220];
            return [255, 215, 0, 255];
    }
}

export default function Map3D() {
    const [rawData, setRawData] = useState<RestaurantPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('density');
    const [cellSize, setCellSize] = useState(0.003);
    const [elevation, setElevation] = useState(3000);
    const [showPoints, setShowPoints] = useState(false);
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const [is3DMode, setIs3DMode] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Fetch datos de Supabase
    useEffect(() => {
        async function fetchData() {
            try {
                const { data: lugares, error } = await supabase
                    .from("lugares")
                    .select("nombre, latitud, longitud, total_reviews_google, rating_gral")
                    .not("latitud", "is", null)
                    .not("longitud", "is", null);

                if (error) throw error;

                const points: RestaurantPoint[] = lugares.map((l: any) => ({
                    longitude: parseFloat(l.longitud),
                    latitude: parseFloat(l.latitud),
                    reviews: l.total_reviews_google || 0,
                    rating: typeof l.rating_gral === 'string' ? parseFloat(l.rating_gral) : (l.rating_gral || 0),
                    name: l.nombre || "Sin nombre"
                })).filter(p => !isNaN(p.longitude) && !isNaN(p.latitude));

                setRawData(points);
                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Crear grid agregado
    const gridData = useMemo(() => {
        return createGrid(rawData, cellSize);
    }, [rawData, cellSize]);

    // Calcular min/max para normalización (especialmente importante para rating)
    const { minValues, maxValues } = useMemo(() => {
        const initial = {
            min: { count: Infinity, reviews: Infinity, rating: Infinity },
            max: { count: 0, reviews: 0, rating: 0 }
        };

        const result = gridData.reduce((acc, cell) => ({
            min: {
                count: Math.min(acc.min.count, cell.count),
                reviews: Math.min(acc.min.reviews, cell.totalReviews),
                rating: Math.min(acc.min.rating, cell.avgRating)
            },
            max: {
                count: Math.max(acc.max.count, cell.count),
                reviews: Math.max(acc.max.reviews, cell.totalReviews),
                rating: Math.max(acc.max.rating, cell.avgRating)
            }
        }), initial);

        // Evitar división por cero
        if (result.min.rating === Infinity) result.min.rating = 0;

        return { minValues: result.min, maxValues: result.max };
    }, [gridData]);

    // Configurar layers de deck.gl
    const layers = useMemo(() => {
        if (gridData.length === 0) return [];

        const columnRadius = cellSize * 111000 * 0.4; // Aprox m por grado * factor

        const columnLayer = new ColumnLayer({
            id: 'column-layer',
            data: gridData,
            diskResolution: 6, // Hexágono
            radius: columnRadius,
            extruded: true,
            pickable: true,
            elevationScale: 1,
            getPosition: (d: GridCell) => d.position,
            getFillColor: (d: GridCell) => {
                switch (viewMode) {
                    case 'density':
                        return getColor(d.count, maxValues.count, viewMode);
                    case 'reviews':
                        return getColor(d.totalReviews, maxValues.reviews, viewMode);
                    case 'rating':
                        // Usar la misma amplificación que en elevation para consistencia
                        const ratingRange = maxValues.rating - minValues.rating;
                        if (ratingRange === 0) return [100, 200, 150, 200] as [number, number, number, number];
                        const normalized = (d.avgRating - minValues.rating) / ratingRange;
                        const amplified = Math.pow(normalized, 4);
                        // Interpolar color: Rojo (bajo) -> Amarillo (medio) -> Verde brillante (alto)
                        if (amplified < 0.3) return [220, 80, 80, 200] as [number, number, number, number];
                        if (amplified < 0.6) return [255, 200, 80, 220] as [number, number, number, number];
                        return [80, 220, 120, 255] as [number, number, number, number];
                }
            },
            getElevation: (d: GridCell) => {
                switch (viewMode) {
                    case 'density':
                        return (d.count / maxValues.count) * elevation;
                    case 'reviews':
                        return (d.totalReviews / maxValues.reviews) * elevation;
                    case 'rating':
                        // Normalizar al rango real de datos y amplificar con potencia 4
                        const ratingRange = maxValues.rating - minValues.rating;
                        if (ratingRange === 0) return elevation * 0.5;
                        const normalized = (d.avgRating - minValues.rating) / ratingRange;
                        // Potencia 4 para amplificar diferencias pequeñas
                        const amplified = Math.pow(normalized, 4);
                        // Asegurar altura mínima visible (10% de la altura máxima)
                        return (0.1 + amplified * 0.9) * elevation;
                }
            },
            material: {
                ambient: 0.5,
                diffuse: 0.6,
                shininess: 50,
                specularColor: [60, 60, 60]
            },
            updateTriggers: {
                getFillColor: [viewMode, maxValues, minValues],
                getElevation: [viewMode, maxValues, minValues, elevation]
            }
        });

        const result: any[] = [columnLayer];

        // Capa de puntos opcional
        if (showPoints) {
            const scatterLayer = new ScatterplotLayer({
                id: 'scatter-layer',
                data: rawData,
                pickable: true,
                opacity: 0.7,
                stroked: true,
                filled: true,
                radiusScale: 3,
                radiusMinPixels: 2,
                radiusMaxPixels: 8,
                lineWidthMinPixels: 1,
                getPosition: (d: RestaurantPoint) => [d.longitude, d.latitude],
                getRadius: 30,
                getFillColor: [255, 200, 100, 200],
                getLineColor: [0, 0, 0, 150]
            });
            result.push(scatterLayer);
        }

        return result;
    }, [gridData, rawData, viewMode, cellSize, elevation, showPoints, maxValues]);

    const handleViewStateChange = useCallback(({ viewState }: any) => {
        setViewState(viewState);
    }, []);

    // Toggle entre vista 2D y 3D con animación snappy
    const toggle3DView = useCallback(() => {
        setIsTransitioning(true);
        const newIs3D = !is3DMode;
        setIs3DMode(newIs3D);

        setViewState((prev: typeof INITIAL_VIEW_STATE) => ({
            ...prev,
            pitch: newIs3D ? 55 : 0,
            bearing: newIs3D ? -20 : 0,
            transitionDuration: 1000,
            transitionInterpolator: new FlyToInterpolator({
                curve: 2.5,  // Curva más agresiva - acelera rápido y desacelera suave
                speed: 3     // Más velocidad
            }),
            transitionEasing: (t: number) => {
                // Ease-out expo - arranca fuerte, frena suave, sin overshoot
                return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            }
        }));

        // Reset transitioning state after animation
        setTimeout(() => setIsTransitioning(false), 800);
    }, [is3DMode]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
                    <span className="text-sm text-zinc-400">Cargando lugares...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-950 text-red-400">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="h-full relative" style={{ minHeight: '500px' }}>
            {/* Mapa 3D */}
            <DeckGL
                viewState={viewState}
                onViewStateChange={handleViewStateChange}
                controller={{
                    dragRotate: true,
                    touchRotate: true
                }}
                layers={layers}
                getTooltip={({ object }: any) => {
                    if (!object) return null;
                    // Tooltip para ColumnLayer
                    if (object.count !== undefined) {
                        return {
                            html: `
                                <div style="padding: 10px; background: rgba(0,0,0,0.9); border-radius: 8px; font-size: 12px; max-width: 200px;">
                                    <div style="font-weight: bold; margin-bottom: 6px; color: #fbbf24;">📍 ${object.count} lugares</div>
                                    <div style="margin-bottom: 4px;">📊 ${object.totalReviews.toLocaleString()} reseñas</div>
                                    <div>⭐ ${object.avgRating.toFixed(1)} rating promedio</div>
                                    ${object.places.length <= 3 ? `<div style="margin-top: 6px; font-size: 10px; color: #9ca3af;">${object.places.join(', ')}</div>` : ''}
                                </div>
                            `,
                            style: {
                                backgroundColor: 'transparent',
                                color: 'white'
                            }
                        };
                    }
                    // Tooltip para puntos individuales
                    if (object.name) {
                        return {
                            html: `
                                <div style="padding: 8px; background: rgba(0,0,0,0.9); border-radius: 6px; font-size: 12px;">
                                    <b>${object.name}</b><br/>
                                    ⭐ ${object.rating.toFixed(1)} • 📊 ${object.reviews} reseñas
                                </div>
                            `,
                            style: {
                                backgroundColor: 'transparent',
                                color: 'white'
                            }
                        };
                    }
                    return null;
                }}
            >
                <Map
                    mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                    attributionControl={false}
                />
            </DeckGL>

            {/* Toggle 2D/3D - Botón flotante animado */}
            <button
                onClick={toggle3DView}
                disabled={isTransitioning}
                className={`
                    absolute top-4 left-4 z-[1000]
                    group flex items-center gap-2.5 px-4 py-2.5
                    rounded-xl border backdrop-blur-md
                    transition-all duration-500 ease-out
                    ${is3DMode
                        ? 'bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 border-violet-500/50 shadow-lg shadow-violet-500/20'
                        : 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                    }
                    hover:scale-105 hover:shadow-xl
                    ${isTransitioning ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
                `}
            >
                {/* Icono animado */}
                <div className={`
                    relative w-8 h-8 flex items-center justify-center
                    transition-all duration-500
                    ${isTransitioning ? 'animate-spin' : ''}
                `}>
                    {/* Cubo 3D / Grid 2D */}
                    <svg
                        viewBox="0 0 24 24"
                        className={`
                            w-6 h-6 transition-all duration-500
                            ${is3DMode ? 'text-violet-300' : 'text-cyan-300'}
                        `}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        {is3DMode ? (
                            /* Cubo 3D isométrico */
                            <>
                                <path d="M12 2L22 7V17L12 22L2 17V7L12 2Z" strokeLinejoin="round" />
                                <path d="M12 12L22 7" />
                                <path d="M12 12V22" />
                                <path d="M12 12L2 7" />
                            </>
                        ) : (
                            /* Grid 2D desde arriba */
                            <>
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </>
                        )}
                    </svg>

                    {/* Glow effect */}
                    <div className={`
                        absolute inset-0 rounded-full blur-md opacity-50
                        transition-all duration-500
                        ${is3DMode ? 'bg-violet-500' : 'bg-cyan-500'}
                    `} />
                </div>

                {/* Texto */}
                <div className="flex flex-col items-start">
                    <span className={`
                        text-[10px] font-medium tracking-wider uppercase
                        transition-all duration-300
                        ${is3DMode ? 'text-violet-300/70' : 'text-cyan-300/70'}
                    `}>
                        Vista
                    </span>
                    <span className={`
                        text-sm font-bold tracking-wide
                        transition-all duration-300
                        ${is3DMode ? 'text-white' : 'text-white'}
                    `}>
                        {is3DMode ? '3D Isométrica' : '2D Cenital'}
                    </span>
                </div>

                {/* Indicador de switch */}
                <div className={`
                    relative w-10 h-5 rounded-full
                    transition-all duration-500
                    ${is3DMode ? 'bg-violet-500/40' : 'bg-cyan-500/40'}
                `}>
                    <div className={`
                        absolute top-0.5 w-4 h-4 rounded-full
                        transition-all duration-500 ease-out
                        ${is3DMode
                            ? 'left-5.5 bg-violet-400 shadow-md shadow-violet-500/50'
                            : 'left-0.5 bg-cyan-400 shadow-md shadow-cyan-500/50'
                        }
                    `}
                        style={{
                            left: is3DMode ? '22px' : '2px'
                        }}
                    />
                </div>
            </button>

            {/* Controles */}
            <Card className="absolute top-4 right-4 p-4 bg-zinc-900/95 border-zinc-800 w-64 space-y-4 z-[1000]">
                <div>
                    <h3 className="text-sm font-semibold text-white mb-2">🎨 Modo de visualización</h3>
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['density', 'reviews', 'rating'] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`
                                    text-[9px] px-2 py-2 rounded border transition-all text-center
                                    ${viewMode === mode
                                        ? mode === 'density' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                                            : mode === 'reviews' ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                                                : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200'
                                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }
                                `}
                            >
                                {mode === 'density' && '📍'}
                                {mode === 'reviews' && '📊'}
                                {mode === 'rating' && '⭐'}
                                <div className="capitalize mt-0.5">{mode === 'density' ? 'Densidad' : mode === 'reviews' ? 'Reseñas' : 'Rating'}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs text-zinc-400 block mb-1">
                        Tamaño de celda: {(cellSize * 111).toFixed(0)}m
                    </label>
                    <input
                        type="range"
                        min="0.001"
                        max="0.01"
                        step="0.0005"
                        value={cellSize}
                        onChange={(e) => setCellSize(Number(e.target.value))}
                        className="w-full accent-orange-500"
                    />
                </div>

                <div>
                    <label className="text-xs text-zinc-400 block mb-1">
                        Altura máxima: {elevation}m
                    </label>
                    <input
                        type="range"
                        min="500"
                        max="10000"
                        step="500"
                        value={elevation}
                        onChange={(e) => setElevation(Number(e.target.value))}
                        className="w-full accent-orange-500"
                    />
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showPoints}
                        onChange={(e) => setShowPoints(e.target.checked)}
                        className="accent-orange-500"
                    />
                    Mostrar puntos individuales
                </label>

                <div className="pt-2 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">
                        {rawData.length.toLocaleString()} lugares → {gridData.length} celdas
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                        {is3DMode
                            ? '💡 Click derecho + arrastrar para rotar'
                            : '💡 Scroll para zoom, arrastrar para mover'
                        }
                    </p>
                </div>
            </Card>

            {/* Leyenda */}
            <Card className="absolute bottom-4 right-4 p-3 bg-zinc-900/95 border-zinc-800 z-[1000]">
                <div className="text-xs text-zinc-400 mb-1">
                    {viewMode === 'density' && 'Concentración de lugares'}
                    {viewMode === 'reviews' && 'Volumen de reseñas'}
                    {viewMode === 'rating' && 'Calidad promedio'}
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-500">Bajo</span>
                    <div className="flex h-3 rounded overflow-hidden">
                        <div className="w-4" style={{ backgroundColor: viewMode === 'density' ? 'rgb(50,200,255)' : viewMode === 'reviews' ? 'rgb(255,220,100)' : 'rgb(80,100,200)' }} />
                        <div className="w-4" style={{ backgroundColor: viewMode === 'density' ? 'rgb(100,255,150)' : viewMode === 'reviews' ? 'rgb(255,150,50)' : 'rgb(100,200,150)' }} />
                        <div className="w-4" style={{ backgroundColor: viewMode === 'density' ? 'rgb(255,100,50)' : viewMode === 'reviews' ? 'rgb(220,50,30)' : 'rgb(255,215,0)' }} />
                    </div>
                    <span className="text-[10px] text-zinc-500">Alto</span>
                </div>
            </Card>
        </div>
    );
}
