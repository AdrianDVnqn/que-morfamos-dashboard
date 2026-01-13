"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Search, MapPin, Star, Utensils, Globe, TrendingUp, Users, ChevronDown, ChevronUp } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import PlaceDetailsDialog from "@/components/places/PlaceDetailsDialog"

interface Lugar {
    id: number
    nombre: string
    direccion: string | null
    url: string | null
    rating_gral: number | null
    total_reviews_google: number | null
    zona: string | null
    categoria: string | null
    resumen_reviews: string | null
    embedding_updated_at: string | null
}

interface Review {
    review_id: string
    autor: string
    rating_user: number | null
    texto: string | null
    fecha_original: string | null
    fecha_scraping: string | null
}

export default function LugaresPage() {
    const [lugares, setLugares] = useState<Lugar[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [pageSize] = useState(50)
    const [totalCount, setTotalCount] = useState(0)
    const [selectedLugar, setSelectedLugar] = useState<Lugar | null>(null)
    const [openSheet, setOpenSheet] = useState(false)
    const [placeReviews, setPlaceReviews] = useState<Review[]>([])
    const [allPlaceReviews, setAllPlaceReviews] = useState<Review[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)

    useEffect(() => {
        fetchLugares()
    }, [page, search])

    useEffect(() => {
        if (selectedLugar) {
            fetchPlaceReviews(selectedLugar.nombre)
            setIsSummaryExpanded(false)
        }
    }, [selectedLugar])

    async function fetchLugares() {
        setLoading(true)
        try {
            // Count query
            let countQuery = supabase
                .from("lugares")
                .select("*", { count: "exact", head: true })

            if (search) {
                countQuery = countQuery.ilike("nombre", `%${search}%`)
            }

            const { count } = await countQuery
            setTotalCount(count || 0)

            // Data query
            let query = supabase
                .from("lugares")
                .select("*")
                .order("total_reviews_google", { ascending: false }) // Priorizar populares por defecto
                .range((page - 1) * pageSize, page * pageSize - 1)

            if (search) {
                query = query.ilike("nombre", `%${search}%`)
            }

            const { data } = await query
            if (data) {
                setLugares(data)
            }
        } catch (error) {
            console.error("Error fetching lugares:", error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchPlaceReviews(nombreRestaurante: string) {
        setReviewsLoading(true)
        console.log("🔍 Buscando reviews para:", nombreRestaurante)
        try {
            // Fetch ALL reviews for analytics
            const { data: allData, error: allError } = await supabase
                .from("reviews")
                .select("*")
                .eq("restaurante", nombreRestaurante)
                .order("fecha_original", { ascending: false })

            if (allError) console.error("❌ Error fetching all reviews:", allError)

            if (allData) {
                setAllPlaceReviews(allData)
                console.log("📊 Total reviews para análisis:", allData.length)
            } else {
                setAllPlaceReviews([])
            }

            // Fetch last 20 for display
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("restaurante", nombreRestaurante)
                .order("fecha_original", { ascending: false })
                .limit(20)

            console.log("📄 Últimas reviews para mostrar:", data?.length)
            if (error) console.error("❌ Error Supabase:", error)

            if (data) {
                setPlaceReviews(data)
            } else {
                setPlaceReviews([])
            }
        } catch (error) {
            console.error("❌ Error fetching place reviews:", error)
            setPlaceReviews([])
            setAllPlaceReviews([])
        } finally {
            setReviewsLoading(false)
        }
    }

    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Explorador de Lugares</h2>
                    <p className="text-muted-foreground">
                        Gestioná y analizá los restaurantes registrados en la base de datos.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setPage(1) // Reset page on search
                                }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Nombre</TableHead>
                                    <TableHead>Zona / Dirección</TableHead>
                                    <TableHead className="text-center">Rating</TableHead>
                                    <TableHead className="text-center">Reviews</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            Cargando lugares...
                                        </TableCell>
                                    </TableRow>
                                ) : lugares.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No se encontraron resultados
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lugares.map((lugar) => (
                                        <TableRow key={lugar.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                                            setSelectedLugar(lugar)
                                            setOpenSheet(true)
                                        }}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{lugar.nombre}</span>
                                                    <span className="text-xs text-muted-foreground capitalize">
                                                        {lugar.categoria || "Restaurante"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span className="font-medium flex items-center gap-1">
                                                        {lugar.zona && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{lugar.zona}</Badge>}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs mt-1 truncate max-w-[200px]" title={lugar.direccion || ""}>
                                                        {lugar.direccion?.split(',')[0] || "-"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {lugar.rating_gral ? (
                                                    <Badge variant={lugar.rating_gral >= 4.5 ? "default" : lugar.rating_gral >= 4.0 ? "secondary" : "outline"}>
                                                        {lugar.rating_gral} ⭐
                                                    </Badge>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {lugar.total_reviews_google?.toLocaleString() || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Ver detalles</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {page} de {totalPages || 1}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                            Siguiente
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Place Details Dialog (Fullscreen) */}
            <PlaceDetailsDialog
                lugar={selectedLugar}
                reviews={placeReviews}
                allReviews={allPlaceReviews}
                reviewsLoading={reviewsLoading}
                open={openSheet}
                onOpenChange={setOpenSheet}
            />
        </div>
    )
}

