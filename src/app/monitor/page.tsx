"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase, type ReviewHistory } from "@/lib/supabase"
import { nuevasReviewsPorSemana } from "@/lib/scrapingStats"
import { ErrorDeCarga } from "@/components/error-de-carga"
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts"
import { TrendingUp, Clock, ArrowUp, Utensils } from "lucide-react"

interface TopMover {
    nombre: string
    totalDelta: number
    lastRating: number | null
}

export default function MonitorPage() {
    const [recentActivity, setRecentActivity] = useState<ReviewHistory[]>([])
    const [topMovers, setTopMovers] = useState<TopMover[]>([])
    const [dailyStats, setDailyStats] = useState<{ date: string; nuevas: number }[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                // Recent activity (last 50 entries)
                const { data: activity, error: errorActividad } = await supabase
                    .from("review_history")
                    .select("*")
                    .order("recorded_at", { ascending: false })
                    .limit(50)

                if (errorActividad) throw new Error(errorActividad.message)

                if (activity) {
                    setRecentActivity(activity)
                }

                // Top movers (last 7 days)
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                const { data: movers } = await supabase
                    .from("review_history")
                    .select("nombre, delta_since_last, rating")
                    .gte("recorded_at", weekAgo)
                    .gt("delta_since_last", 0)

                if (movers) {
                    const moverMap = new Map<string, { total: number; rating: number | null }>()
                    movers.forEach((m) => {
                        const current = moverMap.get(m.nombre || "") || { total: 0, rating: null }
                        moverMap.set(m.nombre || "", {
                            total: current.total + (m.delta_since_last || 0),
                            rating: m.rating,
                        })
                    })

                    const topMoversData = Array.from(moverMap.entries())
                        .map(([nombre, data]) => ({
                            nombre,
                            totalDelta: data.total,
                            lastRating: data.rating,
                        }))
                        .sort((a, b) => b.totalDelta - a.totalDelta)
                        .slice(0, 10)

                    setTopMovers(topMoversData)
                }

                // Serie semanal de reseñas nuevas (últimas 8 semanas).
                setDailyStats(await nuevasReviewsPorSemana({ ultimasSemanas: 8 }))
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Monitor de Scraping</h1>
                    <p className="text-muted-foreground">Seguimiento de actividad y nuevas reseñas</p>
                </div>
                <ErrorDeCarga mensaje={error} />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Monitor de Scraping</h1>
                    <p className="text-muted-foreground">Seguimiento de actividad y nuevas reseñas</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-[400px]" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Monitor de Scraping</h1>
                <p className="text-muted-foreground">
                    Seguimiento de actividad y nuevas reseñas en tiempo real
                </p>
            </div>

            {/* Daily trend chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Reviews Nuevas por Semana
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyStats}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(30, 30, 46, 0.95)",
                                    borderColor: "rgba(255, 255, 255, 0.1)",
                                    borderRadius: "0.75rem",
                                    color: "#fff",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                }}
                                itemStyle={{ color: "#0ea5e9", fontWeight: "bold" }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar
                                dataKey="nuevas"
                                fill="url(#barGradient)"
                                radius={[6, 6, 0, 0]}
                                name="Nuevas reviews"
                                animationDuration={1000}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Top movers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowUp className="h-5 w-5 text-emerald-500" />
                            Top Crecimiento (7 días)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[350px]">
                            <div className="space-y-3">
                                {topMovers.length > 0 ? (
                                    topMovers.map((mover, i) => (
                                        <div
                                            key={mover.nombre}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm font-bold">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm line-clamp-1">{mover.nombre}</p>
                                                    {mover.lastRating && (
                                                        <p className="text-xs text-muted-foreground">⭐ {mover.lastRating.toFixed(1)}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                                +{mover.totalDelta}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        Sin datos de crecimiento esta semana
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Recent activity timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            Actividad Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[350px]">
                            <div className="space-y-3">
                                {recentActivity.length > 0 ? (
                                    recentActivity
                                        .filter((a) => a.delta_since_last > 0)
                                        .slice(0, 15)
                                        .map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shrink-0">
                                                    <Utensils className="h-4 w-4 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm line-clamp-1">
                                                        {activity.nombre || "Sin nombre"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(activity.recorded_at).toLocaleString("es-AR", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="shrink-0">
                                                    +{activity.delta_since_last}
                                                </Badge>
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        Sin actividad reciente
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
