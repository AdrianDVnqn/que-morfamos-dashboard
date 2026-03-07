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
            // Use Supabase's RPC or direct query
            // Note: For security, in production you'd want to validate/sanitize the query
            const { data, error: queryError } = await supabase.rpc("execute_sql", {
                sql_query: query,
            })

            if (queryError) {
                // If RPC doesn't exist, try a direct approach for simple queries
                // This is a fallback - in production, set up proper RPC
                throw new Error(queryError.message)
            }

            const executionTime = Date.now() - startTime

            if (data && Array.isArray(data) && data.length > 0) {
                setResult({
                    columns: Object.keys(data[0]),
                    rows: data,
                    rowCount: data.length,
                    executionTime,
                })
            } else {
                setResult({
                    columns: [],
                    rows: [],
                    rowCount: 0,
                    executionTime,
                })
            }
        } catch (err) {
            // Try alternative approach using REST API
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute_sql`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                        },
                        body: JSON.stringify({ sql_query: query }),
                    }
                )

                if (!response.ok) {
                    throw new Error(`Query failed: ${err instanceof Error ? err.message : "Unknown error"}`)
                }

                const data = await response.json()
                const executionTime = Date.now() - startTime

                setResult({
                    columns: data.length > 0 ? Object.keys(data[0]) : [],
                    rows: data,
                    rowCount: data.length,
                    executionTime,
                })
            } catch {
                setError(
                    `Error ejecutando query: ${err instanceof Error ? err.message : "Error desconocido"}. 
          
Nota: Necesitás crear una función RPC "execute_sql" en Supabase para ejecutar queries arbitrarias.`
                )
            }
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
                    Ejecuta consultas SQL directamente en la base de datos
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
