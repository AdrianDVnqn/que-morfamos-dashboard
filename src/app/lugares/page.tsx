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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

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
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("restaurante", nombreRestaurante)
                .order("fecha_original", { ascending: false })
                .limit(20)

            console.log("📄 Resultados:", data?.length)
            if (error) console.error("❌ Error Supabase:", error)

            if (data) {
                setPlaceReviews(data)
            } else {
                setPlaceReviews([])
            }
        } catch (error) {
            console.error("❌ Error fetching place reviews:", error)
            setPlaceReviews([])
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

            {/* Panel de Detalles (Sheet) */}
            <Sheet open={openSheet} onOpenChange={setOpenSheet}>
                <SheetContent className="sm:max-w-[540px] overflow-y-auto w-full">
                    {selectedLugar && (
                        <div className="space-y-6">
                            <SheetHeader>
                                <SheetTitle className="text-2xl font-bold flex flex-col gap-2">
                                    {selectedLugar.nombre}
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-sm font-normal">
                                            {selectedLugar.categoria || "Gastronomía"}
                                        </Badge>
                                        {selectedLugar.rating_gral && (
                                            <Badge className="bg-amber-500 hover:bg-amber-600">
                                                {selectedLugar.rating_gral} ⭐
                                            </Badge>
                                        )}
                                    </div>
                                </SheetTitle>
                                <SheetDescription>
                                    Datos detallados del establecimiento extraídos de Google Maps.
                                </SheetDescription>
                            </SheetHeader>

                            <Separator />

                            {/* Info General Data Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Dirección
                                    </h4>
                                    <p className="text-sm font-medium">{selectedLugar.direccion || "No especificada"}</p>
                                    {selectedLugar.zona && (
                                        <p className="text-xs text-muted-foreground">Zona: {selectedLugar.zona}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Globe className="h-4 w-4" /> Google Maps
                                    </h4>
                                    {selectedLugar.url ? (
                                        <a href={selectedLugar.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate block">
                                            Ver en Maps ↗
                                        </a>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">-</p>
                                    )}
                                </div>
                            </div>

                            <Separator />



                            {/* AI Summary Section */}
                            <div className="bg-muted/50 p-4 rounded-lg border">
                                <div
                                    className="flex items-center justify-between cursor-pointer mb-2"
                                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                                >
                                    <h4 className="text-sm font-medium flex items-center gap-2 select-none">
                                        <span className="text-xl">🤖</span> Resumen de IA
                                    </h4>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                                        {isSummaryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {selectedLugar.resumen_reviews ? (
                                    <div className="relative">
                                        <div
                                            className={`transition-all duration-500 ease-in-out overflow-hidden ${isSummaryExpanded ? "max-h-[1000px]" : "max-h-24"}`}
                                        >
                                            <div className="space-y-2 pb-2">
                                                <p className="text-sm text-foreground/90 leading-relaxed italic">
                                                    "{selectedLugar.resumen_reviews}"
                                                </p>

                                                <p className={`text-[10px] text-muted-foreground text-right transition-opacity duration-500 ${isSummaryExpanded ? "opacity-100" : "opacity-0"}`}>
                                                    Actualizado: {selectedLugar.embedding_updated_at ? new Date(selectedLugar.embedding_updated_at).toLocaleString() : "Sin fecha"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Gradient fade overlay - Only visible when collapsed */}
                                        <div
                                            className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted to-transparent pointer-events-none transition-opacity duration-300 ${isSummaryExpanded ? "opacity-0" : "opacity-100"}`}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        No hay resumen generado aún. (Requiere {'>'}3 reviews válidas)
                                    </p>
                                )}

                                {selectedLugar.resumen_reviews && (
                                    <div className="mt-2 text-center">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-xs h-auto p-0 text-muted-foreground"
                                            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                                        >
                                            {isSummaryExpanded ? "Ver menos" : "Ver más"}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium text-muted-foreground">Total Reviews</span>
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {selectedLugar.total_reviews_google?.toLocaleString() || 0}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            <span className="text-sm font-medium text-muted-foreground">Rating</span>
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {selectedLugar.rating_gral || "N/A"}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Promedio global
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Reviews List */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Utensils className="h-4 w-4" />
                                    Últimas Reseñas Guardadas
                                </h3>

                                {reviewsLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                ) : placeReviews.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/10">
                                        No hay reseñas guardadas de este lugar en la base de datos.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {placeReviews.map((review) => (
                                            <Card key={review.review_id || Math.random()} className="overflow-hidden">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-medium text-sm truncate max-w-[200px]" title={review.autor}>
                                                            {review.autor}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {review.fecha_original || "Fecha desc."}
                                                        </span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <div className="flex text-amber-500 text-xs">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-3 w-3 ${i < (review.rating_user || 0) ? "fill-current" : "text-muted stroke-muted-foreground"}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                        {review.texto ? (
                                                            review.texto
                                                        ) : (
                                                            <span className="italic text-muted-foreground text-xs">Sin comentario escrito</span>
                                                        )}
                                                    </p>
                                                    <div className="mt-3 pt-2 border-t flex justify-end">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Scrapeado el: {review.fecha_scraping ? new Date(review.fecha_scraping).toLocaleDateString("es-AR") : "-"}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
