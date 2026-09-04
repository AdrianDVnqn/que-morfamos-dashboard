interface Review {
    texto: string | null;
    rating_user: number | null;
}

interface Word {
    text: string;
    value: number;
    color?: string;
}

interface KeywordData {
    keyword: string;
    count: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
}

interface Tag {
    text: string;
    count: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
    category?: 'food' | 'service' | 'ambiance' | 'price' | 'time' | 'other';
}

const STOP_WORDS = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para',
    'como', 'estar', 'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este',
    'ir', 'otro', 'ese', 'la', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin',
    'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo', 'también', 'hasta', 'año',
    'dos', 'querer', 'entre', 'así', 'primero', 'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar',
    'tiempo', 'ella', 'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa', 'tanto',
    'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte', 'después', 'vida', 'quedar', 'siempre',
    'creer', 'hablar', 'llevar', 'dejar', 'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo',
    'solo', 'decir', 'puede', 'fue', 'una', 'del', 'las', 'los', 'es', 'al', 'vez', 'está', 'son', 'fue',
    'tienen', 'había', 'nos', 'durante', 'fuimos', 'lugar', 'restaurante', 'muy', 'una', 'del', 'las',
    // Common food-related stop words
    'comida', 'rico', 'bueno', 'buena', 'malo', 'mala'
]);

// Category keywords mapping
const CATEGORY_KEYWORDS = {
    food: [
        'pizza', 'hamburguesa', 'milanesa', 'empanadas', 'pasta', 'ensalada', 'postre', 'helado',
        'carne', 'pollo', 'pescado', 'papas', 'sabor', 'sabroso', 'fresco', 'calidad', 'porción',
        'porciones', 'plato', 'platos', 'menú', 'carta', 'comida', 'picante', 'dulce', 'salado',
        'ingredientes', 'casero', 'casera', 'delicioso', 'deliciosa', 'riquísimo', 'exquisito'
    ],
    service: [
        'servicio', 'atención', 'amable', 'amabilidad', 'mesero', 'mesera', 'mozo', 'moza',
        'camarero', 'camarera', 'personal', 'trato', 'cordial', 'profesional', 'rápido', 'lento',
        'amistoso', 'amigable', 'recomienda', 'recomiendan', 'atienden', 'esperar', 'demora'
    ],
    ambiance: [
        'lugar', 'ambiente', 'música', 'luminoso', 'iluminación', 'decoración', 'limpio', 'limpieza',
        'cómodo', 'amplio', 'espacioso', 'acogedor', 'acogedora', 'agradable', 'tranquilo', 'ruidoso',
        'vista', 'mesas', 'sillas', 'baño', 'baños', 'climatización', 'aire', 'terraza', 'patio'
    ],
    price: [
        'precio', 'precios', 'caro', 'cara', 'barato', 'barata', 'económico', 'económica', 'accesible',
        'vale', 'pena', 'relación', 'calidad-precio', 'promoción', 'oferta', 'descuento', 'cuenta',
        'factura', 'cobrar', 'costo', 'pagar'
    ],
    time: [
        'espera', 'esperamos', 'demora', 'rápido', 'rápida', 'lento', 'lenta', 'tiempo', 'minutos',
        'hora', 'horas', 'delivery', 'pedido', 'tardó', 'tardaron'
    ]
};

// Positive/Negative keywords for sentiment
const POSITIVE_KEYWORDS = new Set([
    'excelente', 'bueno', 'buena', 'rico', 'rica', 'delicioso', 'deliciosa', 'espectacular',
    'increíble', 'perfecto', 'perfecta', 'recomiendo', 'recomendable', 'genial', 'bárbaro',
    'mejor', 'mejor', 'top', 'impecable', 'fabuloso', 'fabulosa', 'divino', 'divina',
    'riquísimo', 'riquísima', 'hermoso', 'hermosa', 'maravilloso', 'maravillosa', 'copado'
]);

const NEGATIVE_KEYWORDS = new Set([
    'malo', 'mala', 'pésimo', 'pésima', 'horrible', 'terrible', 'feo', 'fea', 'desagradable',
    'caro', 'cara', 'lento', 'lenta', 'frío', 'fría', 'sucio', 'sucia', 'mal', 'peor',
    'nunca', 'jamás', 'decepción', 'decepcionante', 'asqueroso', 'asquerosa', 'desastre'
]);

function cleanText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .replace(/\s+/g, ' ')
        .trim();
}

type CategoriaKeyword = 'food' | 'service' | 'ambiance' | 'price' | 'time' | 'other';

function categorizeKeyword(keyword: string): CategoriaKeyword {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.includes(keyword)) {
            return category as CategoriaKeyword;
        }
    }
    return 'other';
}

function getSentiment(keyword: string, rating?: number): 'positive' | 'neutral' | 'negative' {
    if (POSITIVE_KEYWORDS.has(keyword)) return 'positive';
    if (NEGATIVE_KEYWORDS.has(keyword)) return 'negative';

    // Use rating as secondary indicator
    if (rating !== undefined) {
        if (rating >= 4) return 'positive';
        if (rating <= 2) return 'negative';
    }

    return 'neutral';
}

export function analyzeReviews(reviews: Review[]): {
    wordCloud: Word[];
    topKeywords: KeywordData[];
    semanticTags: Tag[];
} {
    const wordFrequency = new Map<string, { count: number; ratings: number[] }>();

    // Process each review
    reviews.forEach(review => {
        if (!review.texto) return;

        const cleanedText = cleanText(review.texto);
        const words = cleanedText.split(' ').filter(word =>
            word.length > 3 && !STOP_WORDS.has(word)
        );

        words.forEach(word => {
            const existing = wordFrequency.get(word) || { count: 0, ratings: [] };
            existing.count++;
            if (review.rating_user) existing.ratings.push(review.rating_user);
            wordFrequency.set(word, existing);
        });
    });

    // Filter words that appear at least twice
    const filteredWords = Array.from(wordFrequency.entries())
        .filter(([, data]) => data.count >= 2)
        .sort((a, b) => b[1].count - a[1].count);

    // Generate Word Cloud data
    const wordCloud: Word[] = filteredWords.map(([text, data]) => ({
        text,
        value: data.count,
    }));

    // Generate Top Keywords with sentiment
    const topKeywords: KeywordData[] = filteredWords.slice(0, 20).map(([keyword, data]) => ({
        keyword,
        count: data.count,
        sentiment: getSentiment(
            keyword,
            data.ratings.length > 0
                ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
                : undefined
        ),
    }));

    // Generate Semantic Tags (categorized keywords)
    const semanticTags: Tag[] = filteredWords
        .filter(([word]) => {
            // Only include words that match some category
            return Object.values(CATEGORY_KEYWORDS).some(keywords => keywords.includes(word));
        })
        .map(([text, data]) => {
            const avgRating = data.ratings.length > 0
                ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
                : undefined;

            return {
                text,
                count: data.count,
                category: categorizeKeyword(text),
                sentiment: getSentiment(text, avgRating),
            };
        });

    return {
        wordCloud,
        topKeywords,
        semanticTags,
    };
}
