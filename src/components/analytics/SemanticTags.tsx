import { Badge } from '@/components/ui/badge';
import { Utensils, Users, Home, DollarSign, Clock, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';

interface Tag {
    text: string;
    count: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
    category?: 'food' | 'service' | 'ambiance' | 'price' | 'time' | 'other';
}

interface SemanticTagsProps {
    tags: Tag[];
}

const getCategoryIcon = (category?: string) => {
    switch (category) {
        case 'food':
            return <Utensils className="h-3 w-3" />;
        case 'service':
            return <Users className="h-3 w-3" />;
        case 'ambiance':
            return <Home className="h-3 w-3" />;
        case 'price':
            return <DollarSign className="h-3 w-3" />;
        case 'time':
            return <Clock className="h-3 w-3" />;
        default:
            return <AlertCircle className="h-3 w-3" />;
    }
};

const getCategoryLabel = (category?: string) => {
    switch (category) {
        case 'food':
            return 'Comida';
        case 'service':
            return 'Servicio';
        case 'ambiance':
            return 'Ambiente';
        case 'price':
            return 'Precio';
        case 'time':
            return 'Tiempo/Espera';
        default:
            return 'Otros';
    }
};

const getCategoryColor = (category?: string) => {
    switch (category) {
        case 'food':
            return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
        case 'service':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'ambiance':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
        case 'price':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case 'time':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
};

const getSentimentVariant = (sentiment?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (sentiment) {
        case 'positive':
            return 'default';
        case 'negative':
            return 'destructive';
        default:
            return 'secondary';
    }
};

export default function SemanticTags({ tags }: SemanticTagsProps) {
    // Group tags by category
    const groupedTags = tags.reduce((acc, tag) => {
        const category = tag.category || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(tag);
        return acc;
    }, {} as Record<string, Tag[]>);

    // Sort tags within each category by count
    Object.keys(groupedTags).forEach(category => {
        groupedTags[category].sort((a, b) => b.count - a.count);
    });

    const categories = ['food', 'service', 'ambiance', 'price', 'time', 'other'];

    if (!tags || tags.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No hay tags semánticos para mostrar
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">
            {categories.map(category => {
                const categoryTags = groupedTags[category];
                if (!categoryTags || categoryTags.length === 0) return null;

                return (
                    <div key={category} className="space-y-3">
                        {/* Category Header */}
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <div className={`p-1.5 rounded ${getCategoryColor(category)}`}>
                                {getCategoryIcon(category)}
                            </div>
                            <h3 className="font-semibold text-sm">{getCategoryLabel(category)}</h3>
                            <span className="text-xs text-muted-foreground">
                                ({categoryTags.length} términos)
                            </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                            {categoryTags.map((tag, idx) => {
                                // Size based on frequency (top 3 get larger)
                                const isTop = idx < 3;
                                const baseSize = isTop ? 'text-sm py-1.5 px-3' : 'text-xs py-1 px-2';

                                return (
                                    <Badge
                                        key={`${tag.text}-${idx}`}
                                        variant={getSentimentVariant(tag.sentiment)}
                                        className={`${baseSize} transition-all hover:scale-105 cursor-default font-medium`}
                                        title={`${tag.count} menciones - ${tag.sentiment || 'neutral'}`}
                                    >
                                        {tag.text}
                                        <span className="ml-1.5 text-[10px] opacity-70">
                                            {tag.count}
                                        </span>
                                        {tag.sentiment === 'positive' && (
                                            <ThumbsUp className="ml-1 h-2.5 w-2.5 inline" />
                                        )}
                                        {tag.sentiment === 'negative' && (
                                            <ThumbsDown className="ml-1 h-2.5 w-2.5 inline" />
                                        )}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
