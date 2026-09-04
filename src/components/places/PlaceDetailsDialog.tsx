"use client"

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    MapPin, Globe, Star, Users, TrendingUp, Utensils,
    ChevronDown, ChevronUp, BarChart3, Cloud, Tags, MessageSquare, X
} from 'lucide-react';

import WordCloud from '@/components/analytics/WordCloud';
import TopKeywords from '@/components/analytics/TopKeywords';
import SemanticTags from '@/components/analytics/SemanticTags';
import { analyzeReviews } from '@/lib/reviewAnalyzer';

interface Lugar {
    id: number;
    nombre: string;
    direccion: string | null;
    url: string | null;
    rating_gral: number | null;
    total_reviews_google: number | null;
    zona: string | null;
    categoria: string | null;
    resumen_reviews: string | null;
    embedding_updated_at: string | null;
}

interface Review {
    review_id: string;
    autor: string;
    rating_user: number | null;
    texto: string | null;
    fecha_original: string | null;
    fecha_scraping: string | null;
}

interface PlaceDetailsDialogProps {
    lugar: Lugar | null;
    reviews: Review[];
    allReviews: Review[];
    reviewsLoading: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function PlaceDetailsDialog({
    lugar,
    reviews,
    allReviews,
    reviewsLoading,
    open,
    onOpenChange,
}: PlaceDetailsDialogProps) {
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // El estado arranca limpio para cada lugar porque el padre remonta este componente con
    // `key={lugar.id}`. Antes se reseteaba desde un efecto, que dispara un render extra y es
    // justo lo que React desaconseja para "resetear estado cuando cambia una prop".

    // Analyze reviews for visualizations - USE ALL REVIEWS
    const analytics = useMemo(() => {
        if (!allReviews || allReviews.length === 0) {
            return {
                wordCloud: [],
                topKeywords: [],
                semanticTags: [],
            };
        }
        return analyzeReviews(allReviews);
    }, [allReviews]);

    if (!lugar) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] max-h-[95vh] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-2xl font-bold truncate">{lugar.nombre}</DialogTitle>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-sm">
                                    {lugar.categoria || 'Gastronomía'}
                                </Badge>
                                {lugar.rating_gral && (
                                    <Badge className="bg-amber-500 hover:bg-amber-600">
                                        {lugar.rating_gral} ⭐
                                    </Badge>
                                )}
                                {lugar.zona && (
                                    <Badge variant="secondary">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {lugar.zona}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="border-b px-6 bg-muted/20">
                        <TabsList className="w-full justify-start h-12 bg-transparent">
                            <TabsTrigger value="overview" className="gap-2">
                                <Users className="h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="reviews" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Reseñas ({allReviews.length})
                            </TabsTrigger>
                            <TabsTrigger value="wordcloud" className="gap-2">
                                <Cloud className="h-4 w-4" />
                                Word Cloud
                            </TabsTrigger>
                            <TabsTrigger value="keywords" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Top Keywords
                            </TabsTrigger>
                            <TabsTrigger value="tags" className="gap-2">
                                <Tags className="h-4 w-4" />
                                Tags Semánticos
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {/* Overview Tab */}
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Dirección
                                        </h4>
                                        <p className="text-sm font-medium">{lugar.direccion || 'No especificada'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Globe className="h-4 w-4" /> Google Maps
                                        </h4>
                                        {lugar.url ? (
                                            <a
                                                href={lugar.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-500 hover:underline"
                                            >
                                                Ver en Maps ↗
                                            </a>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">-</p>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* AI Summary */}
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

                                    {lugar.resumen_reviews ? (
                                        <div className="relative">
                                            <div
                                                className={`transition-all duration-500 ease-in-out overflow-hidden ${isSummaryExpanded ? 'max-h-[1000px]' : 'max-h-24'
                                                    }`}
                                            >
                                                <p className="text-sm text-foreground/90 leading-relaxed italic">
                                                    &ldquo;{lugar.resumen_reviews}&rdquo;
                                                </p>
                                                <p
                                                    className={`text-[10px] text-muted-foreground text-right mt-2 transition-opacity duration-500 ${isSummaryExpanded ? 'opacity-100' : 'opacity-0'
                                                        }`}
                                                >
                                                    Actualizado: {lugar.embedding_updated_at ? new Date(lugar.embedding_updated_at).toLocaleString() : 'Sin fecha'}
                                                </p>
                                            </div>
                                            {!isSummaryExpanded && (
                                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted to-transparent pointer-events-none" />
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            No hay resumen generado aún. (Requiere {'>'} 3 reviews válidas)
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-medium text-muted-foreground">Total Reviews</span>
                                            </div>
                                            <div className="text-2xl font-bold">{lugar.total_reviews_google?.toLocaleString() || 0}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                                <span className="text-sm font-medium text-muted-foreground">Rating</span>
                                            </div>
                                            <div className="text-2xl font-bold">{lugar.rating_gral || 'N/A'}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Promedio global</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Reviews Tab */}
                            <TabsContent value="reviews" className="mt-0">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Utensils className="h-4 w-4" />
                                    Últimas {reviews.length} Reseñas Guardadas
                                    <span className="text-xs text-muted-foreground font-normal">
                                        (de {allReviews.length} totales)
                                    </span>
                                </h3>

                                {reviewsLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/10">
                                        No hay reseñas guardadas de este lugar en la base de datos.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reviews.map((review, i) => (
                                            <Card key={review.review_id || `review-${i}`} className="overflow-hidden">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-medium text-sm truncate max-w-[400px]" title={review.autor}>
                                                            {review.autor}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {review.fecha_original || 'Fecha desc.'}
                                                        </span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <div className="flex text-amber-500 text-xs">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-3 w-3 ${i < (review.rating_user || 0) ? 'fill-current' : 'text-muted stroke-muted-foreground'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                        {review.texto || <span className="italic text-muted-foreground text-xs">Sin comentario escrito</span>}
                                                    </p>
                                                    <div className="mt-3 pt-2 border-t flex justify-end">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Scrapeado el: {review.fecha_scraping ? new Date(review.fecha_scraping).toLocaleDateString('es-AR') : '-'}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Word Cloud Tab */}
                            <TabsContent value="wordcloud" className="mt-0">
                                <div className="bg-card border rounded-lg p-6 min-h-[600px]">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Cloud className="h-5 w-5" />
                                        Nube de Palabras de las Reseñas
                                        <span className="text-xs text-muted-foreground font-normal">
                                            (análisis de {allReviews.length} reseñas)
                                        </span>
                                    </h3>
                                    {analytics.wordCloud.length > 0 ? (
                                        <WordCloud words={analytics.wordCloud} />
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                                            No hay suficientes datos para generar la nube de palabras
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Top Keywords Tab */}
                            <TabsContent value="keywords" className="mt-0">
                                <div className="bg-card border rounded-lg p-6 min-h-[500px]">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Palabras Clave Más Mencionadas
                                    </h3>
                                    {analytics.topKeywords.length > 0 ? (
                                        <TopKeywords keywords={analytics.topKeywords} />
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                                            No hay suficientes datos para generar el análisis de keywords
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Semantic Tags Tab */}
                            <TabsContent value="tags" className="mt-0">
                                <div className="bg-card border rounded-lg p-6 min-h-[500px]">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Tags className="h-5 w-5" />
                                        Análisis Semántico por Categoría
                                    </h3>
                                    {analytics.semanticTags.length > 0 ? (
                                        <SemanticTags tags={analytics.semanticTags} />
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                                            No hay suficientes datos para generar tags semánticos
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
