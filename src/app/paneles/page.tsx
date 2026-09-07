"use client"

import { PanelSQL, type ColumnaPanel } from "@/components/panel-sql"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, Info, PlugZap, Star, Trophy, Layers } from "lucide-react"

interface FilaTop {
    nombre: string
    categoria: string | null
    rating_google: number | null
    reviews: number | null
    qm_score: number | null
}

interface FilaActivos {
    nombre: string
    reviews_nuevas: number
    rating_google: number | null
}

interface FilaCaidos {
    nombre: string
    categoria: string | null
    zona: string | null
    ultima_deteccion: string
}

interface FilaCobertura {
    etiqueta: string
    completos: number
    total: number
    porcentaje: number
}

const estrella = (v: number | null) => (v == null ? "—" : `${Number(v).toFixed(1)} ⭐`)

const COLUMNAS_TOP: ColumnaPanel<FilaTop>[] = [
    { clave: "nombre", titulo: "Lugar" },
    { clave: "rating_google", titulo: "Google", numerica: true, formato: (f) => estrella(f.rating_google) },
    {
        clave: "reviews",
        titulo: "Reseñas",
        numerica: true,
        formato: (f) => (f.reviews ?? 0).toLocaleString("es-AR"),
    },
    {
        clave: "qm_score",
        titulo: "QM",
        numerica: true,
        formato: (f) => (
            <span className="font-semibold text-primary">{f.qm_score ?? "—"}</span>
        ),
    },
]

export default function PanelesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paneles</h1>
                <p className="text-muted-foreground">
                    Cada panel muestra la consulta SQL que lo calcula. Nada acá es una cifra a mano.
                </p>
            </div>

            {/* La explicación va arriba y no escondida: los dos paneles siguientes no se entienden
                sin saber qué es el QM Score. */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex gap-3 pt-6">
                    <Info className="h-5 w-5 shrink-0 text-primary" />
                    <div className="space-y-2 text-sm">
                        <p>
                            <strong>Qué es el QM Score.</strong> Es la valoración propia del motor:{" "}
                            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                                rating + log10(reseñas + 1) × 2.7
                            </code>
                            , llevada a una escala de 0 a 5 para poder compararla con las estrellas de
                            Google. Premia la calificación, pero también el volumen de reseñas: un 5,0 con
                            20 opiniones es más frágil que un 4,2 con 4.500.
                        </p>
                        <p className="text-muted-foreground">
                            <strong>Qué no es:</strong> no es el orden de una búsqueda. El chatbot ordena
                            por una cascada —cuántos conceptos de la consulta cubre el lugar, con cuánta
                            evidencia en las reseñas, y recién al final el QM Score— así que en una búsqueda
                            como “pizza sin tacc” el QM casi no interviene. Manda sólo en pedidos genéricos
                            tipo “mejores pizzas”, y ahí compite con la categoría del local.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* El contraste es el punto: las dos formas de ordenar, lado a lado. */}
            <div className="grid gap-4 lg:grid-cols-2">
                <PanelSQL<FilaTop>
                    titulo="Top 5 por QM Score"
                    descripcion="Cómo ordena el motor cuando el pedido es genérico."
                    vista="dashboard_panel_top_qm"
                    seleccion="nombre, categoria, rating_google, reviews, qm_score"
                    columnas={COLUMNAS_TOP}
                    icono={<Trophy className="h-4 w-4 text-amber-500" />}
                />
                <PanelSQL<FilaTop>
                    titulo="Top 5 por rating de Google"
                    descripcion="El mismo catálogo ordenado sólo por estrellas, sin mínimo de reseñas."
                    vista="dashboard_panel_top_google"
                    seleccion="nombre, categoria, rating_google, reviews, qm_score"
                    columnas={COLUMNAS_TOP}
                    icono={<Star className="h-4 w-4 text-yellow-500" />}
                />
            </div>

            <Card className="border-dashed">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                    Los dos paneles miran los mismos 929 locales. Ordenar por estrellas sube lugares de
                    ~150 reseñas con 5,0 perfecto; ordenar por QM Score sube lugares con miles de
                    opiniones aunque su promedio sea menor. Ninguno de los dos órdenes es “el correcto”:
                    la diferencia es qué se considera evidencia suficiente.
                </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <PanelSQL<FilaActivos>
                    titulo="Top 5 con más movimiento"
                    descripcion="Reseñas sumadas en los últimos 30 días."
                    vista="dashboard_panel_mas_activos"
                    seleccion="nombre, reviews_nuevas, rating_google"
                    columnas={[
                        { clave: "nombre", titulo: "Lugar" },
                        {
                            clave: "rating_google",
                            titulo: "Google",
                            numerica: true,
                            formato: (f) => estrella(f.rating_google),
                        },
                        {
                            clave: "reviews_nuevas",
                            titulo: "Nuevas",
                            numerica: true,
                            formato: (f) => (
                                <span className="font-semibold text-emerald-500">
                                    +{f.reviews_nuevas.toLocaleString("es-AR")}
                                </span>
                            ),
                        },
                    ]}
                    icono={<Activity className="h-4 w-4 text-emerald-500" />}
                />

                <PanelSQL<FilaCaidos>
                    titulo="Locales que dejaron de responder"
                    descripcion="Su ficha de Google Maps ya no carga: suelen ser cierres."
                    vista="dashboard_panel_caidos"
                    seleccion="nombre, categoria, zona, ultima_deteccion"
                    columnas={[
                        { clave: "nombre", titulo: "Lugar" },
                        { clave: "zona", titulo: "Zona" },
                        {
                            clave: "ultima_deteccion",
                            titulo: "Detectado",
                            numerica: true,
                            formato: (f) =>
                                new Date(f.ultima_deteccion).toLocaleDateString("es-AR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                }),
                        },
                    ]}
                    icono={<PlugZap className="h-4 w-4 text-rose-500" />}
                />
            </div>

            <PanelSQL<FilaCobertura>
                titulo="Cobertura del pipeline"
                descripcion="Qué proporción del catálogo tiene cada pieza que el buscador necesita."
                vista="dashboard_panel_cobertura"
                seleccion="etiqueta, completos, total, porcentaje"
                columnas={[
                    { clave: "etiqueta", titulo: "Pieza" },
                    {
                        clave: "completos",
                        titulo: "Lugares",
                        numerica: true,
                        formato: (f) => `${f.completos} / ${f.total}`,
                    },
                    {
                        clave: "porcentaje",
                        titulo: "Cobertura",
                        numerica: true,
                        formato: (f) => (
                            <div className="flex items-center justify-end gap-2">
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${f.porcentaje}%` }}
                                    />
                                </div>
                                <span className="w-12 text-right">{f.porcentaje}%</span>
                            </div>
                        ),
                    },
                ]}
                icono={<Layers className="h-4 w-4 text-violet-500" />}
            />
        </div>
    )
}
