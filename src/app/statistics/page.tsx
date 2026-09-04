"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { ErrorDeCarga } from "@/components/error-de-carga"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts"
import { BarChart3, MapPin, Star, Users } from "lucide-react"

export default function StatisticsPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [barrioData, setBarrioData] = useState<{ barrio: string; count: number }[]>([])
    const [ratingDist, setRatingDist] = useState<{ rating: string; count: number }[]>([])
    const [reviewsPerLugar, setReviewsPerLugar] = useState<{ range: string; count: number }[]>([])
    const [topLugares, setTopLugares] = useState<{ nombre: string; reviews: number }[]>([])

    useEffect(() => {
        async function fetchStats() {
            try {
                // Cuatro vistas en paralelo. Antes esta pagina bajaba los 929 lugares enteros y
                // armaba las cuatro distribuciones con JavaScript.
                const [barrios, ratings, porReviews, top] = await Promise.all([
                    supabase.from("dashboard_lugares_por_barrio")
                        .select("barrio, lugares").order("lugares", { ascending: false }).limit(10),
                    supabase.from("dashboard_distribucion_rating")
                        .select("etiqueta, lugares").order("orden"),
                    supabase.from("dashboard_distribucion_reviews")
                        .select("etiqueta, lugares").order("orden"),
                    supabase.from("dashboard_top_lugares")
                        .select("nombre, reviews").order("reviews", { ascending: false }),
                ])

                for (const r of [barrios, ratings, porReviews, top]) {
                    if (r.error) throw new Error(r.error.message)
                }

                setBarrioData((barrios.data ?? []).map((b) => ({
                    barrio: b.barrio, count: Number(b.lugares),
                })))
                setRatingDist((ratings.data ?? []).map((r) => ({
                    rating: r.etiqueta, count: Number(r.lugares),
                })))
                setReviewsPerLugar((porReviews.data ?? []).map((r) => ({
                    range: r.etiqueta, count: Number(r.lugares),
                })))
                setTopLugares((top.data ?? []).map((l) => ({
                    nombre: l.nombre ?? "", reviews: Number(l.reviews),
                })))
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (error) {
        return <ErrorDeCarga mensaje={error} />
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
                    <p className="text-muted-foreground">Análisis detallado de la base de datos</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-[350px]" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
                <p className="text-muted-foreground">
                    Análisis detallado de la base de datos de restaurantes
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Lugares por barrio */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-500" />
                            Lugares por Barrio (Top 10)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barrioData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis type="number" className="text-xs" />
                                <YAxis
                                    dataKey="barrio"
                                    type="category"
                                    width={140}
                                    className="text-xs"
                                    tick={{ fontSize: 11 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "0.5rem",
                                    }}
                                    formatter={(value) => [`${value} lugares`, "Cantidad"]}
                                />
                                <defs>
                                    <linearGradient id="barrioGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.85} />
                                        <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <Bar dataKey="count" fill="url(#barrioGradient)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Rating distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Distribución de Ratings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ratingDist}>
                                <defs>
                                    <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={1} />
                                        <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.7} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/70" />
                                <XAxis dataKey="rating" className="text-xs" angle={-20} textAnchor="end" height={50} />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "0.5rem",
                                    }}
                                    formatter={(value) => [`${value} lugares`, "Cantidad"]}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="url(#ratingGradient)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Reviews per lugar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-500" />
                            Distribución de Reviews por Lugar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={reviewsPerLugar}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/70" />
                                <XAxis dataKey="range" className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "0.5rem",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="var(--chart-2)"
                                    fill="var(--chart-2)"
                                    fillOpacity={0.25}
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top lugares */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-purple-500" />
                            Top 10 por Reviews
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topLugares}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/70" />
                                <XAxis
                                    dataKey="nombre"
                                    className="text-xs"
                                    tick={false}
                                />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "0.5rem",
                                    }}
                                    labelFormatter={(_, payload) => payload[0]?.payload?.nombre || ""}
                                />
                                <defs>
                                    <linearGradient id="topReviewsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.85} />
                                    </linearGradient>
                                </defs>
                                <Bar dataKey="reviews" fill="url(#topReviewsGradient)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
