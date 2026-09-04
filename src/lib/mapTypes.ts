import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson"

/**
 * Tipos del GeoJSON que mueve el mapa.
 *
 * Existen porque los componentes del mapa estaban tipados con `any` de punta a punta: en un
 * archivo que navega `feature.properties.NOMBRE` y `geometry.coordinates` a mano, eso significa
 * que ningún error de nombre de campo se detecta hasta que el mapa aparece vacío en pantalla.
 */

/** Propiedades de un local, tal como las arma el mapa a partir de la tabla `lugares`. */
export interface PropiedadesLugar {
    /** Alias de `nombre`, que es el que leen los popups. */
    restaurante: string
    nombre: string
    categoria: string | null
    zona: string | null
    barrio: string | null
    rating_gral: number
    total_reviews_google: number | null
    direccion: string | null
}

export type LugarFeature = Feature<Point, PropiedadesLugar>
export type LugaresGeoJSON = FeatureCollection<Point, PropiedadesLugar>

/**
 * Propiedades de un barrio en el shapefile municipal.
 *
 * `NOMBRE` va en mayúsculas porque así viene del archivo original y se respeta para no tener que
 * transformar las 60 geometrías en cada carga. El resto de los campos del shapefile no se usan.
 */
export interface PropiedadesBarrio {
    NOMBRE: string
    zona: string
    [otroCampo: string]: unknown
}

export type BarrioFeature = Feature<Polygon | MultiPolygon, PropiedadesBarrio>
export type BarriosGeoJSON = FeatureCollection<Polygon | MultiPolygon, PropiedadesBarrio>

/** Filtros del mapa. Todos son multi-selección; `reviewRange` es la tupla [mín, máx]. */
export interface FiltrosMapa {
    zones: string[]
    barrios: string[]
    categories: string[]
    ratingRanges: string[]
    reviewRange: number[]
}
