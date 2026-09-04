import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos espejo del esquema real de Postgres (verificado contra information_schema).
// Antes divergían: `Review` declaraba un `id: number` que la tabla no tiene —la clave es
// `review_id`, un texto— y faltaban las columnas por las que se hacen los joins (`lugar_id`).
// Un tipo que miente es peor que no tenerlo: el editor autocompleta campos inexistentes.

export interface Lugar {
    id: number
    nombre: string
    categoria: string | null
    rating_gral: number | null
    total_reviews_google: number
    direccion: string | null
    latitud: number | null
    longitud: number | null
    barrio: string | null
    zona: string | null
    cerca_rio: boolean | null
    url: string
    fecha_scraping: string | null
}

export interface Review {
    review_id: string
    lugar_id: number | null
    restaurante: string
    autor: string
    rating_user: number | null
    texto: string | null
    fecha_aproximada: string | null
    fecha_original: string | null
    fecha_scraping: string | null
}

export interface ReviewHistory {
    id: number
    lugar_id: number | null
    lugar_url: string
    nombre: string | null
    direccion: string | null
    review_count: number
    rating: number | null
    delta_since_last: number
    recorded_at: string
}

export interface ScrapingLog {
    id: number
    lugar_id: number | null
    fecha: string
    url: string | null
    estado: string
    mensaje: string | null
    reviews_detectadas: number
    nuevas_reviews: number
    intentos: number
}
