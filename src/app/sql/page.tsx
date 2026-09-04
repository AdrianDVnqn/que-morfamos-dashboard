"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import Editor from "@monaco-editor/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { Play, ChevronDown, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const PRESET_QUERIES = [
    {
        name: "Top 10 por reviews",
        query: `SELECT nombre, total_reviews_google, rating_gral, zona
FROM lugares 
ORDER BY total_reviews_google DESC 
LIMIT 10`,
    },
    {
        name: "Reviews por zona",
        query: `SELECT zona, COUNT(*) as lugares, SUM(total_reviews_google) as reviews
FROM lugares 
WHERE zona IS NOT NULL 
GROUP BY zona 
ORDER BY reviews DESC`,
    },
    {
        name: "Últimas reviews",
        query: `SELECT restaurante, autor, rating_user, LEFT(texto, 100) as texto, fecha_scraping
FROM reviews 
ORDER BY fecha_scraping DESC 
LIMIT 20`,
    },
    {
        name: "Lugares sin reviews scrapeadas",
        query: `SELECT l.nombre, l.total_reviews_google, l.zona 
FROM lugares l 
LEFT JOIN reviews r ON l.id = r.lugar_id 
WHERE r.id IS NULL 
LIMIT 20`,
    },
    {
        name: "Actividad scraping (semanal)",
        query: `SELECT estado, COUNT(*) as cantidad, SUM(nuevas_reviews) as nuevas_reviews
FROM scraping_logs 
WHERE fecha > NOW() - INTERVAL '7 days'
GROUP BY estado`,
    },
]

interface QueryResult {
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
    executionTime: number
}

export default function SQLEditorPage() {
    const [query, setQuery] = useState(PRESET_QUERIES[0].query)
    const [result, setResult] = useState<QueryResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function executeQuery() {
        if (!query.trim()) return

        setLoading(true)
        setError(null)
        setResult(null)

        const startTime = Date.now()

        try {
            // La función execute_sql corre como el visitante (SECURITY INVOKER), así que RLS la
            // limita a las tablas públicas. Es de sólo lectura y corta a 1000 filas.
            const { data, error: queryError } = await supabase.rpc("execute_sql", {
                sql_query: query,
            })

            if (queryError) {
                throw new Error(queryError.message)
            }

            // Cuando la función rechaza la consulta (no es SELECT, o RLS deniega el acceso)
            // devuelve un objeto { error, detail } en vez de un array de filas.
            if (data && !Array.isArray(data) && data.error) {
                throw new Error(data.error)
            }

            const executionTime = Date.now() - startTime
            const rows: Record<string, unknown>[] = Array.isArray(data) ? data : []

            setResult({
                columns: rows.length > 0 ? Object.keys(rows[0]) : [],
                rows,
                rowCount: rows.length,
                executionTime,
            })
        } catch (err) {
            setError(
                `Error ejecutando la consulta: ${err instanceof Error ? err.message : "Error desconocido"}`
            )
        } finally {
            setLoading(false)
        }
    }

    function selectPreset(preset: typeof PRESET_QUERIES[0]) {
        setQuery(preset.query)
        setResult(null)
        setError(null)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Explorador SQL</h1>
                <p className="text-muted-foreground">
                    Consultas de sólo lectura (SELECT) sobre las tablas públicas · máximo 1000 filas
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">Query</CardTitle>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Queries Predefinidas
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {PRESET_QUERIES.map((preset) => (
                                    <DropdownMenuItem
                                        key={preset.name}
                                        onClick={() => selectPreset(preset)}
                                    >
                                        {preset.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={executeQuery} disabled={loading} size="sm">
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="mr-2 h-4 w-4" />
                            )}
                            Ejecutar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Editor
                            height="200px"
                            defaultLanguage="sql"
                            value={query}
                            onChange={(value) => setQuery(value || "")}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-destructive/50 bg-destructive/10">
                    <CardContent className="flex items-start gap-3 pt-6">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-destructive">Error</p>
                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                                {error}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            )}

            {result && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Resultados
                        </CardTitle>
                        <div className="flex gap-2">
                            <Badge variant="secondary">{result.rowCount} filas</Badge>
                            <Badge variant="outline">{result.executionTime}ms</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {result.rows.length > 0 ? (
                            <ScrollArea className="w-full rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {result.columns.map((col) => (
                                                <TableHead key={col} className="font-bold whitespace-nowrap">
                                                    {col}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.rows.map((row, i) => (
                                            <TableRow key={i}>
                                                {result.columns.map((col) => (
                                                    <TableCell key={col} className="max-w-[300px] truncate">
                                                        {row[col] !== null && row[col] !== undefined
                                                            ? String(row[col])
                                                            : <span className="text-muted-foreground">NULL</span>}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                La consulta no devolvió resultados
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
