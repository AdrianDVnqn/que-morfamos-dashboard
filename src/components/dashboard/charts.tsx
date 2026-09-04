"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { nuevasReviewsPorSemana, type SemanaDeReviews } from "@/lib/scrapingStats"
import { ErrorDeCarga } from "@/components/error-de-carga"
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


export function ReviewsByZonaChart() {
    const [data, setData] = useState<ZonaData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        async function fetchData() {
            try {
                const { data: lugares, error: errorConsulta } = await supabase
                    .from("lugares")
                    .select("zona, total_reviews_google")
                    .not("zona", "is", null)

                if (errorConsulta) throw new Error(errorConsulta.message)

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
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (!mounted) return null

    if (error) {
        return (
            <Card className="col-span-full md:col-span-2">
                <CardHeader>
                    <CardTitle>Reviews por Zona</CardTitle>
                </CardHeader>
                <CardContent>
                    <ErrorDeCarga mensaje={error} />
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card className="col-span-full md:col-span-2">
                <CardHeader>
                    <CardTitle>Reviews por Zona</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <Skeleton className="w-full h-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-full md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    📊 Reviews por Zona
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
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
                                itemStyle={{ color: "#fff" }}
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
                </div>
            </CardContent>
        </Card>
    )
}

export function CategoriesChart() {
    const [data, setData] = useState<CategoryData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        async function fetchData() {
            try {
                const { data: lugares, error: errorConsulta } = await supabase
                    .from("lugares")
                    .select("categoria")
                    .not("categoria", "is", null)

                if (errorConsulta) throw new Error(errorConsulta.message)

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
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (!mounted) return null

    if (error) {
        return (
            <Card className="col-span-full md:col-span-1">
                <CardHeader>
                    <CardTitle>Por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                    <ErrorDeCarga mensaje={error} />
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card className="col-span-full md:col-span-1">
                <CardHeader>
                    <CardTitle>Por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <Skeleton className="w-full h-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-full md:col-span-1">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                    🥧 Por Categoría
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
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
                                itemStyle={{ color: "#fff" }}
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
                </div>
            </CardContent>
        </Card>
    )
}

export function ReviewsTimelineChart() {
    const [data, setData] = useState<SemanaDeReviews[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        async function fetchData() {
            try {
                setData(await nuevasReviewsPorSemana({ dias: 60 }))
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (!mounted) return null

    if (error) {
        return (
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Evolución de Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                    <ErrorDeCarga mensaje={error} />
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Evolución de Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <Skeleton className="w-full h-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    📈 Nuevas Reviews (Últimos 2 meses)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
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
                                itemStyle={{ color: "#8b5cf6", fontWeight: "bold" }}
                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="nuevas"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={{ fill: "#1e1e2e", stroke: "#8b5cf6", strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: "#8b5cf6" }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
