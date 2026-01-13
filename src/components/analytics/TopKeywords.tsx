import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface KeywordData {
    keyword: string;
    count: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
}

interface TopKeywordsProps {
    keywords: KeywordData[];
    maxItems?: number;
}

export default function TopKeywords({ keywords, maxItems = 12 }: TopKeywordsProps) {
    const topKeywords = keywords.slice(0, maxItems);

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment) {
            case 'positive':
                return 'hsl(142, 76%, 45%)'; // Green
            case 'negative':
                return 'hsl(0, 84%, 60%)'; // Red
            default:
                return 'hsl(217, 91%, 60%)'; // Blue
        }
    };

    if (!topKeywords || topKeywords.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No hay keywords para mostrar
            </div>
        );
    }

    return (
        <div className="w-full h-full p-4" style={{ minHeight: 450 }}>
            <ResponsiveContainer width="100%" height={450}>
                <BarChart
                    data={topKeywords}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                        dataKey="count"
                        type="number"
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        stroke="#52525b"
                        fontSize={12}
                    />
                    <YAxis
                        dataKey="keyword"
                        type="category"
                        width={120}
                        tick={{ fill: '#e2e2e2', fontSize: 13 }}
                        stroke="transparent"
                        fontSize={13}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                        cursor={{ fill: 'hsl(var(--muted))' }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} animationDuration={800}>
                        {topKeywords.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={getSentimentColor(entry.sentiment)}
                                opacity={0.8}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142, 76%, 45%)' }} />
                    <span className="text-muted-foreground">Positivo</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(217, 91%, 60%)' }} />
                    <span className="text-muted-foreground">Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
                    <span className="text-muted-foreground">Negativo</span>
                </div>
            </div>
        </div>
    );
}
