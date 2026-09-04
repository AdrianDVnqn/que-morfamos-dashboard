import { supabase } from "@/lib/supabase"

/**
 * Fecha desde la que los datos de scraping son comparables entre sí.
 *
 * El 10-ene-2026 se cargó la base entera de una sola vez: 80.528 reseñas nuevas en un día,
 * contra ~1.500 de una semana normal de mantenimiento. Graficar ese pico junto al resto aplasta
 * la escala vertical y vuelve ilegible todo lo demás, así que las series de tiempo arrancan
 * después de la carga inicial.
 *
 * Vive acá, y no repetida en cada gráfico, a propósito: antes estaba duplicada en el dashboard
 * y en el monitor, y cualquier ajuste había que acordarse de hacerlo en los dos lados.
 */
export const INICIO_DATOS_CONFIABLES = new Date("2026-01-20T00:00:00Z")

/** Fila de `scraping_logs` que alimenta las series de tiempo. */
export interface LogDeScraping {
    fecha: string
    nuevas_reviews: number | null
}

/** Un punto de la serie semanal, listo para Recharts. */
export interface SemanaDeReviews {
    /** Etiqueta corta para el eje X, ej. "Sem. 24/02". */
    date: string
    /** Reseñas nuevas sumadas en esa semana. */
    nuevas: number
}

/**
 * Arranque efectivo de una ventana: la ventana pedida, o el inicio de los datos confiables si
 * la ventana llega más atrás que la carga inicial.
 */
function desdeEfectivo(dias: number): Date {
    const inicioVentana = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
    return inicioVentana > INICIO_DATOS_CONFIABLES ? inicioVentana : INICIO_DATOS_CONFIABLES
}

/**
 * El lunes de la semana a la que pertenece una fecha, en UTC.
 *
 * Todo el agrupado se hace en UTC a propósito: mezclar métodos de fecha locales con claves ISO
 * hacía que las filas cercanas a medianoche cayeran en semanas distintas según el huso horario
 * del visitante, y el gráfico cambiaba según quién lo mirara.
 */
function lunesDeLaSemana(fecha: Date): Date {
    const dia = fecha.getUTCDay()
    const corrimiento = fecha.getUTCDate() - dia + (dia === 0 ? -6 : 1)
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), corrimiento))
}

function claveDeSemana(fecha: Date): string {
    return lunesDeLaSemana(fecha).toISOString().split("T")[0]
}

/**
 * Trae todos los logs desde una fecha, paginando.
 *
 * PostgREST corta las respuestas en 1000 filas y no avisa que lo hizo: sin paginar, las semanas
 * con mucha actividad aparecían incompletas en el gráfico y nadie se enteraba.
 */
async function traerLogsDesde(desde: Date, soloConNuevas: boolean): Promise<LogDeScraping[]> {
    const TAMANO_PAGINA = 1000
    const todos: LogDeScraping[] = []

    for (let pagina = 0; ; pagina++) {
        let consulta = supabase
            .from("scraping_logs")
            .select("fecha, nuevas_reviews")
            .gte("fecha", desde.toISOString())
            .order("fecha", { ascending: true })
            .range(pagina * TAMANO_PAGINA, (pagina + 1) * TAMANO_PAGINA - 1)

        if (soloConNuevas) consulta = consulta.gt("nuevas_reviews", 0)

        const { data, error } = await consulta
        // El error se propaga en vez de tragarse: la vista de arriba decide qué mostrar. Antes
        // se logueaba a consola y el gráfico quedaba vacío sin explicación.
        if (error) throw new Error(error.message)
        if (!data || data.length === 0) break

        todos.push(...(data as LogDeScraping[]))
        if (data.length < TAMANO_PAGINA) break
    }

    return todos
}

/**
 * Serie de reseñas nuevas por semana, con las semanas sin actividad en cero.
 *
 * Rellenar los huecos importa: sin eso, una semana sin scraping no dibuja un valle sino que une
 * los dos puntos vecinos con una recta, y el gráfico aparenta una continuidad que no hubo.
 *
 * @param dias           Tamaño de la ventana hacia atrás.
 * @param soloConNuevas  Descarta los logs sin reseñas nuevas (baja el volumen a paginar).
 * @param ultimasSemanas Recorta la serie a las últimas N semanas.
 */
export async function nuevasReviewsPorSemana({
    dias,
    soloConNuevas = false,
    ultimasSemanas,
}: {
    dias: number
    soloConNuevas?: boolean
    ultimasSemanas?: number
}): Promise<SemanaDeReviews[]> {
    const desde = desdeEfectivo(dias)
    const logs = await traerLogsDesde(desde, soloConNuevas)
    if (logs.length === 0) return []

    const porSemana = new Map<string, number>()
    for (const log of logs) {
        if (!log.fecha) continue
        const clave = claveDeSemana(new Date(log.fecha))
        porSemana.set(clave, (porSemana.get(clave) ?? 0) + (log.nuevas_reviews ?? 0))
    }

    // Semanas sin datos → 0, desde el arranque de la ventana hasta el último log recibido.
    const ultimoLog = Math.max(...logs.map((l) => new Date(l.fecha).getTime()))
    const fin = lunesDeLaSemana(new Date(ultimoLog))
    for (const d = lunesDeLaSemana(desde); d <= fin; d.setUTCDate(d.getUTCDate() + 7)) {
        const clave = d.toISOString().split("T")[0]
        if (!porSemana.has(clave)) porSemana.set(clave, 0)
    }

    const serie = Array.from(porSemana.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([clave, nuevas]) => {
            const [, mes, dia] = clave.split("-")
            return { date: `Sem. ${dia}/${mes}`, nuevas }
        })

    return ultimasSemanas ? serie.slice(-ultimasSemanas) : serie
}
