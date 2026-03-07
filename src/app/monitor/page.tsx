"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase, type ReviewHistory } from "@/lib/supabase"
import {
    LineChart,
    Line,
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

    useEffect(() => {
        async function fetchData() {
            try {
                // Recent activity (last 50 entries)
                const { data: activity } = await supabase
                    .from("review_history")
                    .select("*")
                    .order("recorded_at", { ascending: false })
                    .limit(50)

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

                // Daily stats -> Weekly stats (last 8 weeks)
                const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString()
                
                // Fetch paginated to bypass 1000 row limit
                let allDailyData: any[] = []
                let dailyPage = 0
                const DAILY_PAGE_SIZE = 1000
                let dailyHasMore = true

                while (dailyHasMore) {
                    const { data: dailyData, error } = await supabase
                        .from("review_history")
                        .select("recorded_at, delta_since_last")
                        .gte("recorded_at", eightWeeksAgo)
                        .gt("delta_since_last", 0)
                        .range(dailyPage * DAILY_PAGE_SIZE, (dailyPage + 1) * DAILY_PAGE_SIZE - 1)

                    if (error || !dailyData) {
                        dailyHasMore = false
                        console.error("Error fetching paginated daily data:", error)
                        break
                    }

                    allDailyData = [...allDailyData, ...dailyData]
                    
                    if (dailyData.length < DAILY_PAGE_SIZE) {
                        dailyHasMore = false
                    } else {
                        dailyPage++
                    }
                }

                if (allDailyData.length > 0) {
                    const weekMap = new Map<string, number>()
                    
                    allDailyData.forEach((d) => {
                        const dateObj = new Date(d.recorded_at)
                        // We need to group by week using consistent UTC to prevent local timezone shifts
                        const day = dateObj.getUTCDay()
                        const diff = dateObj.getUTCDate() - day + (day === 0 ? -6 : 1)
                        const monday = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), diff))
                        
                        const weekKey = monday.toISOString().split('T')[0]
                        weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + (d.delta_since_last || 0))
                    })

                    // Ensure we have 0 for all weeks in the 8-week range
                    const dStart = new Date(eightWeeksAgo)
                    const startDay = dStart.getUTCDay()
                    const startDiff = dStart.getUTCDate() - startDay + (startDay === 0 ? -6 : 1)
                    const minDate = new Date(Date.UTC(dStart.getUTCFullYear(), dStart.getUTCMonth(), startDiff))
                    
                    const today = new Date()
                    const todayDay = today.getUTCDay()
                    const todayDiff = today.getUTCDate() - todayDay + (todayDay === 0 ? -6 : 1)
                    const maxDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), todayDiff))
                    
                    for (let d = new Date(minDate); d <= maxDate; d.setUTCDate(d.getUTCDate() + 7)) {
                        const weekKey = d.toISOString().split('T')[0]
                        if (!weekMap.has(weekKey)) {
                            weekMap.set(weekKey, 0)
                        }
                    }

                    const stats = Array.from(weekMap.entries())
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([weekKey, nuevas]) => {
                            const [year, month, day] = weekKey.split('-')
                            return {
                                date: `Sem. ${day}/${month}`,
                                nuevas
                            }
                        })
                        .slice(-8)

                    setDailyStats(stats)
                }
            } catch (error) {
                console.error("Error fetching monitor data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

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
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "0.5rem",
                                }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Bar
                                dataKey="nuevas"
                                fill="hsl(var(--chart-2))"
                                radius={[4, 4, 0, 0]}
                                name="Nuevas reviews"
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
