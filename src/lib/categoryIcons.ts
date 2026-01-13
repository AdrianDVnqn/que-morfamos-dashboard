import L from 'leaflet';

/**
 * Detecta el tipo de comida basado en la categoría y devuelve el emoji correspondiente
 */
export const detectFoodEmoji = (categoria: string): string => {
    if (!categoria) return '🍽️';

    const c = categoria.toLowerCase();

    // === BEBIDAS & BARES ===
    // Cervecerías / Breweries
    if (c.includes('brew') || c.includes('beer') || c.includes('cervec')) return '🍺';

    // Bares / Lounges / Pubs
    if (c.includes('bar') || c.includes('lounge') || c.includes('pub') || c.includes('piano bar')) return '🍸';

    // Vinos
    if (c.includes('wine')) return '🍷';

    // Jugos
    if (c.includes('juice')) return '🧃';

    // === CAFÉ & DESAYUNO ===
    // Cafeterías / Coffee shops
    if (c.includes('cafe') || c.includes('café') || c.includes('coffee') || c.includes('espresso')) return '☕';

    // === PANADERÍAS & DULCES ===
    // Heladerías
    if (c.includes('ice cream') || c.includes('helad')) return '🍦';

    // Panaderías / Pastelerías
    if (c.includes('bakery') || c.includes('panader') || c.includes('pastry') || c.includes('patisserie')) return '🥐';

    // Tortas / Postres
    if (c.includes('cake') || c.includes('dessert') || c.includes('confectionery') || c.includes('candy') || c.includes('chocolate')) return '🍰';

    // Té
    if (c.includes('tea store')) return '🍵';

    // === PIZZAS ===
    if (c.includes('pizza')) return '🍕';

    // === HAMBURGUESAS ===
    if (c.includes('hamburger') || c.includes('burger')) return '🍔';

    // === PASTA & ITALIANA ===
    if (c.includes('pasta') || c.includes('italian')) return '🍝';

    // === SUSHI & JAPONESA ===
    if (c.includes('sushi') || c.includes('japanese') || c.includes('japon')) return '🍣';

    // === MEXICANA ===
    if (c.includes('mexican') || c.includes('pueblan') || c.includes('taco')) return '🌮';

    // === PARRILLAS & CARNES ===
    // Parrillas / Steakhouses / Grills
    if (c.includes('grill') || c.includes('barbecue') || c.includes('steak') || c.includes('chophouse') || c.includes('parrilla') || c.includes('asado')) return '🥩';

    // Pescados / Mariscos
    if (c.includes('seafood') || c.includes('fish')) return '🐟';

    // Pollo
    if (c.includes('chicken') || c.includes('poultry') || c.includes('fried chicken')) return '🍗';

    // === SANDWICHES & SNACKS ===
    if (c.includes('sandwich') || c.includes('deli') || c.includes('snack')) return '🥪';

    // Fideos / Noodles
    if (c.includes('noodle')) return '🍜';

    // === VEGANO / VEGETARIANO ===
    if (c.includes('vegan') || c.includes('vegetarian') || c.includes('health food')) return '🥗';

    // === COCINAS REGIONALES ===
    // Asiática (genérica)
    if (c.includes('asian')) return '🥡';

    // Brasileña
    if (c.includes('brazilian')) return '🇧🇷';

    // Argentina
    if (c.includes('argentinian')) return '🥩'; // Carne como ícono por defecto

    // Española
    if (c.includes('spanish')) return '🥘';

    // Siria / Medio Oriente
    if (c.includes('syrian')) return '🧆';

    // Colombiana / Venezolana
    if (c.includes('colombian') || c.includes('venezuelan')) return '🌯';

    // === COMIDA RÁPIDA ===
    if (c.includes('fast food') || c.includes('takeout') || c.includes('delivery')) return '🍟';

    // === TIENDAS & OTROS ===
    // Carnicerías
    if (c.includes('butcher') || c.includes('cold cut') || c.includes('poultry store')) return '🥓';

    // Supermercados / Tiendas gourmet
    if (c.includes('grocery') || c.includes('gourmet') || c.includes('store')) return '🛒';

    // === GENÉRICOS ===
    // Family restaurant / Restaurant genérico
    if (c.includes('family') || c.includes('restaurant')) return '🍽️';

    // Por defecto: plato genérico
    return '🍽️';
};

/**
 * Crea un icono de Leaflet personalizado con emoji basado en la categoría
 */
export const createCategoryIcon = (categoria: string) => {
    const emoji = detectFoodEmoji(categoria);

    return L.divIcon({
        html: `<div class="marker-emoji">${emoji}</div>`,
        className: 'food-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48]
    });
};
