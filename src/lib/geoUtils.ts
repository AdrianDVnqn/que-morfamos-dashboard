import type { Geometry } from "geojson";

export const webMercatorToWGS84 = (x: number, y: number): [number, number] => {
    const rMajor = 6378137.0; // Equatorial Radius, WGS84
    const shift = Math.PI * rMajor;
    const lon = (x / shift) * 180.0;
    let lat = (y / shift) * 180.0;
    lat = (180.0 / Math.PI) * (2.0 * Math.atan(Math.exp((lat * Math.PI) / 180.0)) - Math.PI / 2.0);
    return [lon, lat];
};

/**
 * Reproyecta en el lugar las coordenadas de una geometría de Web Mercator a WGS84.
 *
 * El shapefile municipal viene en Web Mercator y Leaflet espera lat/lon, así que sin esto los
 * barrios caen en medio del Atlántico.
 */
export const convertGeoJSONCoordinates = (geometry: Geometry | null): Geometry | null => {
    if (!geometry) return null;

    const convertRing = (ring: number[][]) => {
        return ring.map(coord => webMercatorToWGS84(coord[0], coord[1]));
    };

    if (geometry.type === 'Polygon') {
        geometry.coordinates = geometry.coordinates.map(convertRing);
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates = geometry.coordinates.map((polygon) => polygon.map(convertRing));
    }

    return geometry;
};
