
export const ZONAS_MAP: Record<string, string> = {
    // CENTRO
    'ÁREA CENTRO ESTE': 'Centro',
    'ÁREA CENTRO OESTE': 'Centro',
    'ÁREA CENTRO SUR': 'Centro',

    // ESTE
    'SANTA GENOVEVA': 'Este',
    'CONFLUENCIA URBANO': 'Este',
    'MARIANO MORENO': 'Este',
    'VILLA FARRELL': 'Este',
    'SAPERE': 'Este',
    'PROVINCIAS UNIDAS': 'Este',
    'VILLA MARÍA': 'Este',
    'BELGRANO': 'Este',

    // RÍO / PASEO DE LA COSTA
    'RÍO GRANDE': 'Paseo de la Costa',
    'LIMAY': 'Paseo de la Costa',
    'ALTOS DEL LIMAY': 'Paseo de la Costa',
    'CONFLUENCIA RURAL': 'Paseo de la Costa',

    // NORTE / EL ALTO
    'ALTA BARDA': 'Norte / Alto',
    'RINCÓN DE EMILIO': 'Norte / Alto',
    'PARQUE INDUSTRIAL': 'Norte / Alto',
    'CIUDAD INDUSTRIAL OBISPO DON JAIME DE NEVARES': 'Norte / Alto',
    '14 DE OCTUBRE y COPOL': 'Norte / Alto',
    'TERRAZAS DEL NEUQUÉN': 'Norte / Alto',
    'BARDAS SOLEADAS': 'Norte / Alto',

    // OESTE
    'VILLA FLORENCIA': 'Oeste',
    'VILLA CEFERINO': 'Oeste',
    'SAN LORENZO NORTE': 'Oeste',
    'SAN LORENZO SUR': 'Oeste',
    'GRAN NEUQUÉN NORTE': 'Oeste',
    'GRAN NEUQUÉN SUR': 'Oeste',
    'MELIPAL': 'Oeste',
    'UNIÓN DE MAYO': 'Oeste',
    'GREGORIO ÁLVAREZ': 'Oeste',
    'ISLAS MALVINAS': 'Oeste',
    'BOUQUET ROLDÁN': 'Oeste',
    'VALENTINA SUR RURAL': 'Oeste',
    'VALENTINA SUR URBANO': 'Oeste',
    'VALENTINA NORTE URBANO': 'Oeste',
    'VALENTINA NORTE RURAL': 'Oeste',
    'ESFUERZO': 'Oeste',
    'HIBEPA': 'Oeste',
    'CUENCA XV': 'Oeste',
    'CANAL V': 'Oeste',
    'MILITAR': 'Oeste',
    'LA SIRENA': 'Oeste',
    'CUMELÉN': 'Oeste',
    'EL PROGRESO': 'Oeste',
    'HUILICHES': 'Oeste',
    'DON BOSCO II': 'Oeste',
    'DON BOSCO III': 'Oeste',
    'NUEVO': 'Oeste'
};

export const ZONE_COLORS: Record<string, string> = {
    'Centro': '#3b82f6', // blue
    'Este': '#10b981', // green
    'Oeste': '#f59e0b', // amber
    'Norte / Alto': '#8b5cf6', // violet
    'Paseo de la Costa': '#06b6d4', // cyan
    'Otras Zonas': '#9ca3af' // gray
};

/**
 * Helper to get zone safely handling accents/case
 */
export const getZone = (barrio: string): string => {
    if (!barrio) return 'Otras Zonas';
    const normalized = barrio.toUpperCase();

    // Direct match
    if (ZONAS_MAP[normalized]) return ZONAS_MAP[normalized];

    // Fuzzy/Normalized match (remove accents)
    // Create a normalized map cache if performance is issue, but for <100 items loop is fine or pre-compute
    const clean = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const target = clean(normalized);

    const match = Object.keys(ZONAS_MAP).find(k => clean(k) === target);
    return match ? ZONAS_MAP[match] : 'Otras Zonas';
};
