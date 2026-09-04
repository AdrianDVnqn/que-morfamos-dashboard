"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ErrorDeCarga } from "@/components/error-de-carga"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, User, Store } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface ReviewSearchResult {
    review_id: string
    restaurante: string
    autor: string
    rating_user: number | null
    texto: string | null
    fecha_original: string | null
    fecha_scraping: string | null
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<ReviewSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [placeFilter, setPlaceFilter] = useState("")

    // Debounce values
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [debouncedPlace, setDebouncedPlace] = useState("")

    const [limit] = useState(50)

    // Debounce handlers
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedPlace(placeFilter)
        }, 500)
        return () => clearTimeout(timer)
    }, [placeFilter])

    const searchReviews = useCallback(async () => {
        setLoading(true)
        try {

            let query = supabase
                .from("reviews")
                .select("*")
                .order("fecha_original", { ascending: false })
                .limit(limit)

            if (debouncedSearch) {
                query = query.ilike("texto", `%${debouncedSearch}%`)
            }

            if (debouncedPlace) {
                query = query.ilike("restaurante", `%${debouncedPlace}%`)
            }

            const { data, error: errorConsulta } = await query

            if (errorConsulta) throw new Error(errorConsulta.message)

            setReviews(data ?? [])
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, debouncedPlace, limit])

    // Trigger search when debounced values change
    useEffect(() => {
        if (debouncedSearch.length >= 3 || (debouncedPlace.length >= 3 && debouncedSearch.length > 0)) {
            searchReviews()
        } else if (debouncedSearch.length === 0 && debouncedPlace.length === 0) {
            setReviews([])
        }
    }, [debouncedSearch, debouncedPlace, searchReviews])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Buscador de Reseñas</h2>
                    <p className="text-muted-foreground">
                        Busca palabras clave específicas dentro de todas las reseñas de la base de datos.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Palabra clave (Mensaje)
                            </label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder='Ej: "cucaracha", "excelente"...'
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Filtrar por Lugar (Opcional)
                            </label>
                            <div className="relative">
                                <Store className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder='Ej: "Pizzeria", "Burger"...'
                                    className="pl-8"
                                    value={placeFilter}
                                    onChange={(e) => setPlaceFilter(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground">
                            Ingresa al menos 3 caracteres en el buscador para ver resultados.
                        </p>
                        {reviews.length > 0 && (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                {reviews.length} resultados encontrados
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {error && <ErrorDeCarga mensaje={error} />}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Lugar</TableHead>
                                    <TableHead className="w-[120px]">Autor / Fecha</TableHead>
                                    <TableHead className="w-[80px] text-center">Rating</TableHead>
                                    <TableHead>Comentario</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Search className="h-6 w-6 animate-pulse" />
                                                Buscando coincidencias...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : reviews.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                                            {search.length > 0 && search.length < 3 ? (
                                                "Escribe más caracteres para buscar..."
                                            ) : search.length >= 3 ? (
                                                "No se encontraron reseñas con esos criterios."
                                            ) : (
                                                "Esperando búsqueda..."
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reviews.map((review) => (
                                        <TableRow key={review.review_id || Math.random()}>
                                            <TableCell className="align-top font-medium">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1 text-sm">
                                                        <Store className="h-3 w-3 text-primary" />
                                                        {highlightText(review.restaurante, debouncedPlace)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <div className="flex flex-col text-xs text-muted-foreground gap-1">
                                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                                        <User className="h-3 w-3" />
                                                        {review.autor}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {review.fecha_original ?
                                                            review.fecha_original.length > 15 ? review.fecha_original.substring(0, 15) + "..." : review.fecha_original
                                                            : "-"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top text-center">
                                                <Badge variant={
                                                    (review.rating_user || 0) >= 4 ? "default" :
                                                        (review.rating_user || 0) >= 3 ? "secondary" : "destructive"
                                                } className="whitespace-nowrap">
                                                    {review.rating_user} ⭐
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                                                    {highlightText(review.texto || "", debouncedSearch)}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Helper para resaltar el texto buscado
function highlightText(text: string, highlight: string) {
    if (!text || !highlight.trim()) return text

    // Escape regex characters
    const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const parts = text.split(new RegExp(`(${safeHighlight})`, 'gi'))
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-100 text-yellow-800 font-medium px-0.5 rounded dark:bg-yellow-900/50 dark:text-yellow-200">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    )
}
