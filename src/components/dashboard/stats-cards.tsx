"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase"
import { ErrorDeCarga } from "@/components/error-de-carga"
import {
    Utensils,
    MessageSquare,
    TrendingUp,
    Star,
    Clock,
    AlertCircle,
    Info
} from "lucide-react"

interface DashboardStats {
    totalLugares: number
    totalReviews: number
    reviewsSemanal: number
    avgRating: number
    lastScraping: string | null
    erroresSemanal: number
}

interface ReviewQuality {
    sinTexto: number
    conTextoUtil: number
    total: number
}

export function StatsCards() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [reviewQuality, setReviewQuality] = useState<ReviewQuality>({ sinTexto: 0, conTextoUtil: 0, total: 0 })
    const [reviewQualitySemanal, setReviewQualitySemanal] = useState<ReviewQuality>({ sinTexto: 0, conTextoUtil: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchStats() {
            try {
                // Dos consultas donde antes habia ocho. Las que dolian eran las de calidad: se
                // traian 10.000 textos de reseñas (800 kB) y los de la semana, solo para contar
                // cuantos superan los 30 caracteres. Ahora la base devuelve los conteos.
                const [kpis, calidad] = await Promise.all([
                    supabase.from("dashboard_kpis").select("*").single(),
                    supabase.from("dashboard_calidad_reviews").select("*"),
                ])

                if (kpis.error) throw new Error(kpis.error.message)
                if (calidad.error) throw new Error(calidad.error.message)

                setStats({
                    totalLugares: kpis.data.total_lugares ?? 0,
                    totalReviews: kpis.data.total_reviews ?? 0,
                    reviewsSemanal: kpis.data.reviews_semanal ?? 0,
                    avgRating: Number(kpis.data.rating_promedio ?? 0),
                    lastScraping: kpis.data.ultimo_scraping ?? null,
                    erroresSemanal: kpis.data.errores_semanal ?? 0,
                })

                const porAmbito = (ambito: string): ReviewQuality => {
                    const fila = calidad.data?.find((f) => f.ambito === ambito)
                    return {
                        sinTexto: fila?.sin_texto ?? 0,
                        conTextoUtil: fila?.con_texto_util ?? 0,
                        total: fila?.total ?? 0,
                    }
                }
                setReviewQuality(porAmbito("muestra"))
                setReviewQualitySemanal(porAmbito("semana"))
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    const cards = [
        {
            id: "restaurantes",
            title: "Total Restaurantes",
            value: stats?.totalLugares?.toLocaleString() || "0",
            icon: Utensils,
            description: "Lugares registrados",
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            id: "total-reviews",
            title: "Total Reseñas",
            value: stats?.totalReviews?.toLocaleString() || "0",
            icon: MessageSquare,
            description: "Reviews en la base",
            gradient: "from-purple-500 to-pink-500",
            hasTooltip: true,
            tooltipContent: reviewQuality,
        },
        {
            id: "reviews-semanal",
            title: "Reseñas (Semanal)",
            value: stats?.reviewsSemanal?.toLocaleString() || "0",
            icon: TrendingUp,
            description: "Nuevas esta semana",
            gradient: "from-green-500 to-emerald-500",
            hasTooltip: true,
            tooltipContent: reviewQualitySemanal,
        },
        {
            id: "rating",
            title: "Rating Promedio",
            value: stats?.avgRating?.toFixed(2) || "0.00",
            icon: Star,
            description: "Puntuación media",
            gradient: "from-yellow-500 to-orange-500",
        },
        {
            id: "scraping",
            title: "Último Scraping",
            value: stats?.lastScraping
                ? new Date(stats.lastScraping).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                : "N/A",
            icon: Clock,
            description: stats?.lastScraping
                ? new Date(stats.lastScraping).toLocaleDateString("es-AR")
                : "Sin datos",
            gradient: "from-indigo-500 to-violet-500",
        },
        {
            id: "errores",
            title: "Errores (Semanal)",
            value: stats?.erroresSemanal?.toString() || "0",
            icon: AlertCircle,
            description: "Fallos de scraping",
            gradient: stats?.erroresSemanal && stats.erroresSemanal > 0 ? "from-red-500 to-rose-500" : "from-gray-500 to-slate-500",
        },
    ]

    if (error) {
        return <ErrorDeCarga mensaje={error} />
    }

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-1" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
                <Card
                    key={card.id}
                    className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />

                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            {card.title}
                            {card.hasTooltip && card.tooltipContent && (
                                <Tooltip trigger="click">
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center ml-1 rounded-full hover:bg-gray-700 p-1 transition-colors"
                                            title="Ver calidad de reviews"
                                        >
                                            <Info className="h-3.5 w-3.5 text-gray-400 hover:text-cyan-400 transition-colors" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" align="start" className="bg-slate-900 border-slate-700 p-3 w-64 z-50">
                                        <div className="text-xs space-y-2">
                                            <div className="font-semibold text-white pb-1">📊 Calidad de Reviews</div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">📝 Con texto útil (&gt;30 chars):</span>
                                                <span className="font-medium text-emerald-400">{card.tooltipContent.conTextoUtil.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">🚫 Sin texto:</span>
                                                <span className="font-medium text-rose-400">{card.tooltipContent.sinTexto.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between pt-1 border-t border-gray-700/50">
                                                <span className="text-gray-400">✨ % Útiles para IA:</span>
                                                <span className="font-bold text-cyan-400">
                                                    {card.tooltipContent.total > 0
                                                        ? ((card.tooltipContent.conTextoUtil / card.tooltipContent.total) * 100).toFixed(1)
                                                        : 0}%
                                                </span>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </CardTitle>
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient}`}>
                            <card.icon className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {card.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

