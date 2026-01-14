"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase"
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
    reviews24h: number
    avgRating: number
    lastScraping: string | null
    errores24h: number
}

interface ReviewQuality {
    sinTexto: number
    conTextoUtil: number
    total: number
}

// Normaliza texto eliminando caracteres repetidos consecutivos
function normalizeText(text: string): string {
    if (!text) return ""
    // Reduce caracteres repetidos a máximo 2 (ej: "muuuuuy" -> "muy")
    return text.replace(/(.)\1{2,}/g, '$1$1').trim()
}

// Determina si un texto es "útil" para análisis
function isUsefulText(text: string): boolean {
    if (!text) return false
    const normalized = normalizeText(text)
    return normalized.length >= 30
}

export function StatsCards() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [reviewQuality, setReviewQuality] = useState<ReviewQuality>({ sinTexto: 0, conTextoUtil: 0, total: 0 })
    const [reviewQuality24h, setReviewQuality24h] = useState<ReviewQuality>({ sinTexto: 0, conTextoUtil: 0, total: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                // Total de lugares
                const { count: totalLugares } = await supabase
                    .from("lugares")
                    .select("*", { count: "exact", head: true })

                // Total de reviews
                const { count: totalReviews } = await supabase
                    .from("reviews")
                    .select("*", { count: "exact", head: true })

                // Reviews últimas 24h
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                const { count: reviews24h } = await supabase
                    .from("reviews")
                    .select("*", { count: "exact", head: true })
                    .gte("fecha_scraping", yesterday)

                // Rating promedio
                const { data: ratingData } = await supabase
                    .from("lugares")
                    .select("rating_gral")
                    .not("rating_gral", "is", null)

                const avgRating = ratingData && ratingData.length > 0
                    ? ratingData.reduce((sum, l) => {
                        const parsed = parseFloat(String(l.rating_gral))
                        return sum + (isNaN(parsed) ? 0 : parsed)
                    }, 0) / ratingData.length
                    : 0

                // Último scraping
                const { data: lastLog } = await supabase
                    .from("scraping_logs")
                    .select("fecha")
                    .order("fecha", { ascending: false })
                    .limit(1)
                    .single()

                // Errores 24h
                const { count: errores24h } = await supabase
                    .from("scraping_logs")
                    .select("*", { count: "exact", head: true })
                    .eq("estado", "ERROR")
                    .gte("fecha", yesterday)

                setStats({
                    totalLugares: totalLugares || 0,
                    totalReviews: totalReviews || 0,
                    reviews24h: reviews24h || 0,
                    avgRating,
                    lastScraping: lastLog?.fecha || null,
                    errores24h: errores24h || 0,
                })

                // Fetch review quality stats (sample for performance - last 10k reviews)
                const { data: reviewsForQuality } = await supabase
                    .from("reviews")
                    .select("texto")
                    .order("fecha_scraping", { ascending: false })
                    .limit(10000)

                if (reviewsForQuality) {
                    let sinTexto = 0
                    let conTextoUtil = 0
                    reviewsForQuality.forEach(r => {
                        if (!r.texto || r.texto.trim() === "") {
                            sinTexto++
                        } else if (isUsefulText(r.texto)) {
                            conTextoUtil++
                        }
                    })
                    setReviewQuality({
                        sinTexto,
                        conTextoUtil,
                        total: reviewsForQuality.length
                    })
                }

                // Fetch review quality for 24h
                const { data: reviews24hData } = await supabase
                    .from("reviews")
                    .select("texto")
                    .gte("fecha_scraping", yesterday)

                if (reviews24hData) {
                    let sinTexto = 0
                    let conTextoUtil = 0
                    reviews24hData.forEach(r => {
                        if (!r.texto || r.texto.trim() === "") {
                            sinTexto++
                        } else if (isUsefulText(r.texto)) {
                            conTextoUtil++
                        }
                    })
                    setReviewQuality24h({
                        sinTexto,
                        conTextoUtil,
                        total: reviews24hData.length
                    })
                }

            } catch (error) {
                console.error("Error fetching stats:", error)
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
            id: "reviews-24h",
            title: "Reseñas 24h",
            value: stats?.reviews24h?.toLocaleString() || "0",
            icon: TrendingUp,
            description: "Nuevas hoy",
            gradient: "from-green-500 to-emerald-500",
            hasTooltip: true,
            tooltipContent: reviewQuality24h,
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
            title: "Errores 24h",
            value: stats?.errores24h?.toString() || "0",
            icon: AlertCircle,
            description: "Fallos de scraping",
            gradient: stats?.errores24h && stats.errores24h > 0 ? "from-red-500 to-rose-500" : "from-gray-500 to-slate-500",
        },
    ]

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
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-cyan-400 transition-colors cursor-help ml-1" />
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="bottom"
                                        className="w-72 p-0 bg-gray-900 border-gray-700"
                                    >
                                        <div className="p-3 text-xs text-gray-300 space-y-2">
                                            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                                                <span className="font-semibold text-white">📊 Calidad de Reviews</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">📝 Con texto útil (&gt;30 chars):</span>
                                                <span className="font-medium text-emerald-400">{card.tooltipContent.conTextoUtil.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">🚫 Sin texto:</span>
                                                <span className="font-medium text-rose-400">{card.tooltipContent.sinTexto.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-gray-700">
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

