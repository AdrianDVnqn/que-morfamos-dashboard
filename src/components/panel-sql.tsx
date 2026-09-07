"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorDeCarga } from "@/components/error-de-carga"
import { supabase } from "@/lib/supabase"
import { ChevronDown, Code2 } from "lucide-react"

/**
 * Panel de dato con su consulta SQL a la vista.
 *
 * El SQL NO se escribe acá: se lee de la vista `dashboard_definiciones`, que lo saca de la base
 * con `pg_get_viewdef()`. Copiarlo a mano lo habría condenado a desincronizarse de la consulta
 * real —el mismo problema que tenía la fecha de corte duplicada entre el SQL y el front—, y un
 * panel que muestra una consulta que no es la que corrió es peor que no mostrar ninguna.
 */

/** Una columna de la tabla del panel. */
export interface ColumnaPanel<T> {
    clave: keyof T & string
    titulo: string
    /** Alineación a la derecha para números. */
    numerica?: boolean
    /** Formateo opcional del valor. */
    formato?: (fila: T) => React.ReactNode
}

interface PanelSQLProps<T> {
    titulo: string
    /** Qué responde el panel, en una línea. */
    descripcion: string
    /** Vista de Postgres que lo alimenta; también es la clave para buscar su SQL. */
    vista: string
    columnas: ColumnaPanel<T>[]
    /** Columnas a pedir; por defecto todas. */
    seleccion?: string
    icono?: React.ReactNode
}

export function PanelSQL<T>({
    titulo,
    descripcion,
    vista,
    columnas,
    seleccion = "*",
    icono,
}: PanelSQLProps<T>) {
    const [filas, setFilas] = useState<T[]>([])
    const [sql, setSql] = useState<string | null>(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sqlAbierto, setSqlAbierto] = useState(false)

    useEffect(() => {
        async function cargar() {
            try {
                const [datos, definicion] = await Promise.all([
                    supabase.from(vista).select(seleccion),
                    supabase.from("dashboard_definiciones").select("sql").eq("vista", vista).single(),
                ])

                if (datos.error) throw new Error(datos.error.message)
                setFilas((datos.data ?? []) as T[])
                // Que falte la definición no rompe el panel: se oculta el desplegable y ya.
                setSql(definicion.error ? null : definicion.data?.sql ?? null)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setCargando(false)
            }
        }
        cargar()
    }, [vista, seleccion])

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    {icono}
                    {titulo}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{descripcion}</p>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-3">
                {error ? (
                    <ErrorDeCarga mensaje={error} />
                ) : cargando ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                        ))}
                    </div>
                ) : filas.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Sin datos.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-xs uppercase text-muted-foreground">
                                    {columnas.map((c) => (
                                        <th
                                            key={c.clave}
                                            className={`py-2 font-medium ${c.numerica ? "text-right" : "text-left"}`}
                                        >
                                            {c.titulo}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map((fila, i) => (
                                    <tr key={i} className="border-b border-border/50 last:border-0">
                                        {columnas.map((c) => (
                                            <td
                                                key={c.clave}
                                                className={`py-2 ${c.numerica ? "text-right tabular-nums" : ""}`}
                                            >
                                                {c.formato ? c.formato(fila) : String(fila[c.clave] ?? "—")}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {sql && (
                    <div className="mt-auto border-t pt-2">
                        <button
                            type="button"
                            onClick={() => setSqlAbierto((v) => !v)}
                            aria-expanded={sqlAbierto}
                            className="flex w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <Code2 className="h-3.5 w-3.5" />
                            Ver la consulta SQL
                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${sqlAbierto ? "rotate-180" : ""}`}
                            />
                        </button>
                        {sqlAbierto && (
                            <div className="mt-2">
                                <pre className="max-h-72 overflow-auto rounded-md bg-muted/60 p-3 text-[11px] leading-relaxed">
                                    <code>{sql.trim()}</code>
                                </pre>
                                <p className="mt-1.5 text-[11px] text-muted-foreground">
                                    Definición real de <code className="font-mono">{vista}</code>, leída de la
                                    base con <code className="font-mono">pg_get_viewdef()</code>.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
