"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const RestaurantMap = dynamic(
    () => import('../../components/Map/RestaurantMap'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <span className="text-2xl mb-2">🗺️</span>
                    <span className="text-sm text-zinc-400">Cargando mapa...</span>
                </div>
            </div>
        )
    }
);

export default function MapaPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between relative overflow-hidden">
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 z-[1000] bg-zinc-950/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl max-w-sm">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Mapa del Morfi
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                    Visualizá zonas, barrios y encontrá tu próximo destino gastronómico.
                </p>
            </div>

            <div className="w-full h-screen bg-zinc-900">
                <RestaurantMap />
            </div>
        </main>
    );
}
