"use client"

import { useEffect } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "@maplibre/maplibre-gl-leaflet"
import "maplibre-gl/dist/maplibre-gl.css"
import { ATRIBUCION_BASE, ESTILO_BASE_OSCURO } from "@/lib/basemap"

/**
 * Mapa base vectorial dentro del Leaflet existente.
 *
 * Reemplaza al `<TileLayer>` de siempre. Se hace con el puente maplibre-gl-leaflet en vez de
 * migrar el mapa entero a MapLibre porque así el resto no se toca: los marcadores, los polígonos
 * de barrios, el heatmap y el control de capas siguen siendo Leaflet puro.
 *
 * El motivo del cambio (la marca de agua del raster de CARTO) está en `lib/basemap.ts`.
 */
export function CapaBaseVectorial() {
    const mapa = useMap()

    useEffect(() => {
        const capa = L.maplibreGL({
            style: ESTILO_BASE_OSCURO,
            // El canvas de MapLibre no participa del sistema de panes de Leaflet, así que sin
            // esto se dibuja por encima de los barrios y los marcadores.
            interactive: false,
            attributionControl: false,
        })

        capa.addTo(mapa)
        mapa.attributionControl?.addAttribution(ATRIBUCION_BASE)

        return () => {
            mapa.attributionControl?.removeAttribution(ATRIBUCION_BASE)
            capa.remove()
        }
    }, [mapa])

    return null
}
