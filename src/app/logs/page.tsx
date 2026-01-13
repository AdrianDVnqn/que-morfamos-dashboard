"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { supabase, type ScrapingLog } from "@/lib/supabase"
import { FileText, Search, RefreshCw, Filter } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STATUS_COLORS: Record<string, string> = {
    EXITO: "bg-green-500/10 text-green-600 border-green-500/20",
    ERROR: "bg-red-500/10 text-red-600 border-red-500/20",
    SKIP: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    PARCIAL: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    INFO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
}

// Extraer nombre del lugar desde la URL de Google Maps
function extractPlaceName(url: string | null): string {
    if (!url) return "-"
    try {
        // URL format: https://www.google.com/maps/place/Nombre+Del+Lugar/data=...
        const match = url.match(/\/maps\/place\/([^/]+)/)
        if (match && match[1]) {
            // Decodificar y reemplazar + por espacios
            return decodeURIComponent(match[1].replace(/\+/g, " "))
        }
        return url.split("/").pop()?.slice(0, 30) || "-"
    } catch {
        return "-"
    }
}

export default function LogsPage() {
    const [logs, setLogs] = useState<ScrapingLog[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [stats, setStats] = useState<{ estado: string; count: number }[]>([])

    // Pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(50)
    const [totalCount, setTotalCount] = useState(0)

    async function fetchLogs() {
        setLoading(true)
        try {
            // Get total count first
            let countQuery = supabase
                .from("scraping_logs")
                .select("*", { count: "exact", head: true })

            if (filter) {
                countQuery = countQuery.eq("estado", filter)
            }

            const { count } = await countQuery
            setTotalCount(count || 0)

            // Get paginated data
            const from = (page - 1) * pageSize
            const to = from + pageSize - 1

            let query = supabase
                .from("scraping_logs")
                .select("*")
                .order("fecha", { ascending: false })
                .range(from, to)

            if (filter) {
                query = query.eq("estado", filter)
            }

            const { data } = await query

            if (data) {
                setLogs(data)
            }

            // Stats
            const { data: statsData } = await supabase
                .from("scraping_logs")
                .select("estado")
                .gte("fecha", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

            if (statsData) {
                const statMap = new Map<string, number>()
                statsData.forEach((s) => {
                    statMap.set(s.estado, (statMap.get(s.estado) || 0) + 1)
                })
                setStats(
                    Array.from(statMap.entries())
                        .map(([estado, count]) => ({ estado, count }))
                        .sort((a, b) => b.count - a.count)
                )
            }
        } catch (error) {
            console.error("Error fetching logs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [filter, page, pageSize])

    const totalPages = Math.ceil(totalCount / pageSize)

    const filteredLogs = logs.filter(
        (log) =>
            !search ||
            log.url?.toLowerCase().includes(search.toLowerCase()) ||
            log.mensaje?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Logs de Scraping</h1>
                <p className="text-muted-foreground">
                    Historial de operaciones de scraping
                </p>
            </div>

            {/* Stats cards */}
            <div className="flex gap-2 flex-wrap">
                {stats.map((stat) => (
                    <Badge
                        key={stat.estado}
                        variant="outline"
                        className={`text-sm py-1.5 px-3 cursor-pointer transition-all ${filter === stat.estado ? "ring-2 ring-offset-2" : ""
                            } ${STATUS_COLORS[stat.estado] || ""}`}
                        onClick={() => setFilter(filter === stat.estado ? null : stat.estado)}
                    >
                        {stat.estado}: {stat.count}
                    </Badge>
                ))}
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Últimos 100 Registros
                    </CardTitle>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 w-[200px]"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setFilter(null)}>
                                    Todos
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter("EXITO")}>
                                    ✅ Éxito
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter("ERROR")}>
                                    ❌ Error
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter("SKIP")}>
                                    ⏭️ Skip
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="icon" onClick={fetchLogs}>
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <ScrollArea className="rounded-lg border">
                                <Table className="min-w-[900px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Fecha</TableHead>
                                            <TableHead className="w-[80px]">Estado</TableHead>
                                            <TableHead className="w-[250px]">Lugar</TableHead>
                                            <TableHead className="w-[50px] text-center">🔗</TableHead>
                                            <TableHead className="w-[70px] text-center">Nuevas</TableHead>
                                            <TableHead className="min-w-[350px]">Mensaje</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLogs.length > 0 ? (
                                            filteredLogs.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {new Date(log.fecha).toLocaleString("es-AR", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={STATUS_COLORS[log.estado] || ""}
                                                        >
                                                            {log.estado}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium">
                                                        {extractPlaceName(log.url)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {log.url ? (
                                                            <a
                                                                href={log.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 hover:underline text-xs"
                                                            >
                                                                🔗
                                                            </a>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {log.nuevas_reviews > 0 ? (
                                                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                                                +{log.nuevas_reviews}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {log.mensaje || "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No hay logs que coincidan con el filtro
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>

                            <div className="flex items-center justify-between mt-4 px-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Mostrando {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} de {totalCount}</span>
                                    <span className="mx-2">|</span>
                                    <span>Por página:</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value))
                                            setPage(1)
                                        }}
                                        className="bg-background border rounded px-2 py-1 text-sm"
                                    >
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                        <option value={200}>200</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                    >
                                        ««
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        «
                                    </Button>
                                    <span className="px-3 py-1 text-sm">
                                        Página {page} de {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        »
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(totalPages)}
                                        disabled={page === totalPages}
                                    >
                                        »»
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
