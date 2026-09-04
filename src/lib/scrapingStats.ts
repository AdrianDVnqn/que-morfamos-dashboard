import { supabase } from "@/lib/supabase"

/**
 * Series temporales del pipeline de scraping.
 *
 * El agregado vive en la vista `dashboard_reviews_por_semana`, no acá: antes el navegador se
 * traía 7.432 filas de `scraping_logs` en OCHO peticiones paginadas (el tope de PostgREST es
 * 1000) para después agruparlas por semana con JavaScript. Ahora es una sola consulta que
 * devuelve ~32 filas ya sumadas.
 *
 * La fecha de corte de los datos confiables también se mudó a la vista, así deja de estar
 * duplicada entre el SQL y el front.
 */

/** Un punto de la serie semanal, listo para Recharts. */
export interface SemanaDeReviews {
    /** Etiqueta corta para el eje X, ej. "Sem. 24/02". */
    date: string
    /** Reseñas nuevas sumadas en esa semana. */
    nuevas: number
}

/** Fila de la vista: el lunes de la semana y el total de reseñas nuevas. */
interface FilaSemanal {
    semana: string
    nuevas: number
}

/**
 * Serie de reseñas nuevas por semana, ya agregada por la base.
 *
 * Las semanas sin actividad vienen en cero desde la vista. Rellenar esos huecos importa: sin
 * ellos, una semana sin scraping no dibuja un valle sino que une los dos puntos vecinos con una
 * recta, y el gráfico aparenta una continuidad que no hubo.
 *
 * @param ultimasSemanas Recorta la serie a las últimas N semanas.
 */
export async function nuevasReviewsPorSemana({
    ultimasSemanas,
}: {
    ultimasSemanas?: number
} = {}): Promise<SemanaDeReviews[]> {
    const { data, error } = await supabase
        .from("dashboard_reviews_por_semana")
        .select("semana, nuevas")
        .order("semana", { ascending: true })

    if (error) throw new Error(error.message)
    if (!data) return []

    const serie = (data as FilaSemanal[]).map(({ semana, nuevas }) => {
        // `semana` viene como "YYYY-MM-DD" y se parte a mano en vez de con Date: construir una
        // fecha desde ese string la interpreta en UTC y, según el huso del visitante, la etiqueta
        // se corría un día.
        const [, mes, dia] = semana.split("-")
        return { date: `Sem. ${dia}/${mes}`, nuevas: nuevas ?? 0 }
    })

    return ultimasSemanas ? serie.slice(-ultimasSemanas) : serie
}
