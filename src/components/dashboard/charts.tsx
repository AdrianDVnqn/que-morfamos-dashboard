"use client"

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
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from "recharts"

const COLORS = [
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#f59e0b", // amber
    "#10b981", // emerald
    "#f43f5e", // rose
    "#6366f1", // indigo
]

interface ZonaData {
    zona: string
    count: number
    [key: string]: string | number
}

interface CategoryData {
    categoria: string
    count: number
    [key: string]: string | number
}

interface HistoryData {
    date: string
    reviews: number
    [key: string]: string | number
}

export function ReviewsByZonaChart() {
    const [data, setData] = useState<ZonaData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: lugares } = await supabase
                    .from("lugares")
                    .select("zona, total_reviews_google")
                    .not("zona", "is", null)

                if (lugares) {
                    const zonaMap = new Map<string, number>()
                    lugares.forEach((l) => {
                        const current = zonaMap.get(l.zona) || 0
                        zonaMap.set(l.zona, current + (l.total_reviews_google || 0))
                    })

                    const chartData = Array.from(zonaMap.entries())
                        .map(([zona, count]) => ({ zona, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 8)

                    setData(chartData)
                }
            } catch (error) {
                console.error("Error fetching zona data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Reviews por Zona</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <Skeleton className="w-full h-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    📊 Reviews por Zona
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={data} layout="vertical">
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="50%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            type="number"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                        />
                        <YAxis
                            dataKey="zona"
                            type="category"
                            width={100}
                            tick={{ fill: '#e5e7eb', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(30, 30, 46, 0.95)",
                                borderColor: "rgba(255, 255, 255, 0.1)",
                                borderRadius: "0.75rem",
                                color: "#fff",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            }}
                            formatter={(value) => [`${value} reviews`, 'Total']}
                        />
                        <Bar
                            dataKey="count"
                            fill="url(#barGradient)"
                            radius={[0, 8, 8, 0]}
                            className="drop-shadow-lg"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export function CategoriesChart() {
    const [data, setData] = useState<CategoryData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: lugares } = await supabase
                    .from("lugares")
                    .select("categoria")
                    .not("categoria", "is", null)

                if (lugares) {
                    const catMap = new Map<string, number>()
                    lugares.forEach((l) => {
                        const cat = l.categoria || "Sin categoría"
                        catMap.set(cat, (catMap.get(cat) || 0) + 1)
                    })

                    const chartData = Array.from(catMap.entries())
                        .map(([categoria, count]) => ({ categoria, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 6)

                    setData(chartData)
                }
            } catch (error) {
                console.error("Error fetching category data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <Skeleton className="w-full h-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                    🥧 Por Categoría
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="count"
                            nameKey="categoria"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    className="drop-shadow-md"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(30, 30, 46, 0.95)",
                                borderColor: "rgba(255, 255, 255, 0.1)",
                                borderRadius: "0.75rem",
                                color: "#fff",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            }}
                            formatter={(value, name) => [
                                `${value} lugares`,
                                name as string
                            ]}
                        />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{
                                paddingTop: "8px",
                                fontSize: "12px",
                            }}
                            formatter={(value: string) => (
                                <span style={{ color: "#e5e7eb" }}>{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export function ReviewsTimelineChart() {
    const [data, setData] = useState<HistoryData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                // Last 30 days from scraping_logs (sum of nuevas_reviews per day)
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

                const { data: logs, error } = await supabase
                    .from("scraping_logs")
                    .select("fecha, nuevas_reviews")
                    .gte("fecha", thirtyDaysAgo)
                    .order("fecha", { ascending: true })

                if (logs && logs.length > 0) {
                    // Group by date and sum nuevas_reviews
                    const dateMap = new Map<string, number>()
                    logs.forEach((l) => {
                        if (l.fecha) {
                            const date = new Date(l.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
                            dateMap.set(date, (dateMap.get(date) || 0) + (l.nuevas_reviews || 0))
                        }
                    })

                    const chartData = Array.from(dateMap.entries())
                        .map(([date, reviews]) => ({ date, reviews }))

                    setData(chartData)
                }
            } catch (error) {
                console.error("Error fetching timeline:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Evolución de Reviews</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <Skeleton className="w-full h-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    📈 Nuevas Reviews (Últimos 30 días)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "0.5rem",
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="reviews"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--chart-2))" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
