"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
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
    const [barrioData, setBarrioData] = useState<{ barrio: string; count: number }[]>([])
    const [ratingDist, setRatingDist] = useState<{ rating: string; count: number }[]>([])
    const [reviewsPerLugar, setReviewsPerLugar] = useState<{ range: string; count: number }[]>([])
    const [topLugares, setTopLugares] = useState<{ nombre: string; reviews: number }[]>([])

    useEffect(() => {
        async function fetchStats() {
            try {
                // Lugares por barrio
                const { data: lugares } = await supabase
                    .from("lugares")
                    .select("barrio, rating_gral, total_reviews_google, nombre")

                if (lugares) {
                    // Barrio distribution
                    const barrioMap = new Map<string, number>()
                    lugares.forEach((l) => {
                        const barrio = l.barrio || "Sin barrio"
                        barrioMap.set(barrio, (barrioMap.get(barrio) || 0) + 1)
                    })
                    setBarrioData(
                        Array.from(barrioMap.entries())
                            .map(([barrio, count]) => ({ barrio, count }))
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 10)
                    )

                    // Rating distribution - by ranges
                    const ratingRanges = [
                        { min: 1.0, max: 1.9, label: "1-2 ⭐" },
                        { min: 2.0, max: 2.9, label: "2-3 ⭐" },
                        { min: 3.0, max: 3.4, label: "3.0-3.4 ⭐" },
                        { min: 3.5, max: 3.9, label: "3.5-3.9 ⭐" },
                        { min: 4.0, max: 4.2, label: "4.0-4.2 ⭐" },
                        { min: 4.3, max: 4.5, label: "4.3-4.5 ⭐" },
                        { min: 4.6, max: 4.8, label: "4.6-4.8 ⭐" },
                        { min: 4.9, max: 5.0, label: "4.9-5.0 ⭐" },
                    ]
                    const ratingArray = ratingRanges.map((range) => {
                        const count = lugares.filter((l) => {
                            if (l.rating_gral === null || l.rating_gral === undefined) return false
                            const parsed = parseFloat(String(l.rating_gral))
                            return !isNaN(parsed) && parsed >= range.min && parsed <= range.max
                        }).length
                        return { rating: range.label, count }
                    })
                    setRatingDist(ratingArray)

                    // Reviews per lugar distribution
                    const ranges = [
                        { min: 0, max: 10, label: "0-10" },
                        { min: 11, max: 50, label: "11-50" },
                        { min: 51, max: 100, label: "51-100" },
                        { min: 101, max: 500, label: "101-500" },
                        { min: 501, max: Infinity, label: "500+" },
                    ]
                    const rangeCounts = ranges.map((r) => ({
                        range: r.label,
                        count: lugares.filter(
                            (l) => l.total_reviews_google >= r.min && l.total_reviews_google <= r.max
                        ).length,
                    }))
                    setReviewsPerLugar(rangeCounts)

                    // Top lugares
                    setTopLugares(
                        lugares
                            .sort((a, b) => (b.total_reviews_google || 0) - (a.total_reviews_google || 0))
                            .slice(0, 10)
                            .map((l) => ({ nombre: l.nombre || "", reviews: l.total_reviews_google || 0 }))
                    )
                }
            } catch (error) {
                console.error("Error fetching statistics:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

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
