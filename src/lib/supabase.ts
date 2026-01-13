import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on database schema
export interface Lugar {
    nombre: string
    categoria: string | null
    rating_gral: number | null
    total_reviews_google: number
    direccion: string | null
    barrio: string | null
    zona: string | null
    url: string
    fecha_scraping: string | null
}

export interface Review {
    id: number
    restaurante: string
    autor: string
    rating_user: number | null
    texto: string
    fecha_aproximada: string | null
    fecha_scraping: string
}

export interface ReviewHistory {
    id: number
    lugar_url: string
    nombre: string | null
    review_count: number
    rating: number | null
    delta_since_last: number
    recorded_at: string
}

export interface ScrapingLog {
    id: number
    fecha: string
    url: string | null
    estado: string
    mensaje: string | null
    reviews_detectadas: number
    nuevas_reviews: number
    intentos: number
}
