import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { X, Filter, ChevronDown, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MapFiltersProps {
    zones: string[];
    barrios: string[];
    categories: string[];
    filters: {
        zones: string[];
        barrios: string[];
        categories: string[];
        ratingRanges: string[];
        reviewRange: number[];
    };
    onFilterChange: (key: string, value: any) => void;
    onReset: () => void;
    maxReviews: number;
}

const RATING_RANGES = [
    { label: "1.0 - 2.0 ⭐", value: "1.0-2.0" },
    { label: "2.0 - 2.5 ⭐", value: "2.0-2.5" },
    { label: "2.5 - 3.0 ⭐", value: "2.5-3.0" },
    { label: "3.0 - 3.5 ⭐", value: "3.0-3.5" },
    { label: "3.5 - 4.0 ⭐", value: "3.5-4.0" },
    { label: "4.0 - 4.5 ⭐", value: "4.0-4.5" },
    { label: "4.5 - 5.0 ⭐", value: "4.5-5.0" },
];

export default function MapFilters({
    zones,
    barrios,
    categories,
    filters,
    onFilterChange,
    onReset,
    maxReviews
}: MapFiltersProps) {

    const toggleFilter = (key: string, item: string) => {
        const current = (filters as any)[key] as string[];
        if (current.includes(item)) {
            onFilterChange(key, current.filter(i => i !== item));
        } else {
            onFilterChange(key, [...current, item]);
        }
    };

    const renderMultiSelect = (label: string, key: string, items: string[], placeholder: string) => {
        const selected = (filters as any)[key] as string[];
        return (
            <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-medium">{label}</label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white h-9 text-xs">
                            <span className="truncate">
                                {selected.length === 0 ? placeholder : `${selected.length} seleccionados`}
                            </span>
                            <ChevronDown className="w-3 h-3 opacity-50 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-700 text-zinc-200 max-h-[300px] overflow-y-auto z-[1100]">
                        <DropdownMenuLabel className="text-xs">{label}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        {items.map(item => (
                            <DropdownMenuCheckboxItem
                                key={item}
                                checked={selected.includes(item)}
                                onCheckedChange={() => toggleFilter(key, item)}
                                className="text-xs focus:bg-zinc-800 focus:text-white"
                            >
                                {item}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                {selected.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {selected.slice(0, 3).map(item => (
                            <div key={item} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-zinc-800 text-zinc-300 hover:bg-zinc-700 h-5">
                                {item}
                                <button
                                    type="button"
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-zinc-600/50 p-0.5"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFilter(key, item);
                                    }}
                                >
                                    <X className="h-3 w-3 text-zinc-400 hover:text-white" />
                                    <span className="sr-only">Remove {item}</span>
                                </button>
                            </div>
                        ))}
                        {selected.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] px-1 h-5 bg-zinc-800 text-zinc-300">
                                +{selected.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="absolute top-48 left-4 z-[1000] w-72 bg-zinc-950/90 backdrop-blur-md border-zinc-800 p-4 shadow-xl overflow-y-auto max-h-[70vh] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                    <Filter className="w-4 h-4 text-yellow-500" /> Filtros
                </h3>
                {(filters.zones.length > 0 || filters.barrios.length > 0 || filters.categories.length > 0 || filters.ratingRanges.length > 0) &&
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    >
                        Limpiar todo
                    </Button>
                }
            </div>

            <div className="space-y-4">
                {renderMultiSelect("Zona", "zones", zones, "Todas las zonas")}

                {/* Barrio Filter - Dependent on Zone logic handled in parent but visually independent here */}
                {renderMultiSelect("Barrio", "barrios", barrios, "Todos los barrios")}

                {renderMultiSelect("Categoría", "categories", categories, "Todas las categorías")}

                {/* Rating Ranges */}
                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 font-medium">Rating</label>
                    <div className="grid grid-cols-2 gap-2">
                        {RATING_RANGES.map(range => {
                            const isSelected = filters.ratingRanges.includes(range.value);
                            return (
                                <div
                                    key={range.value}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFilter('ratingRanges', range.value);
                                    }}
                                    className={`
                                        cursor-pointer text-[10px] px-2 py-1.5 rounded border transition-all text-center
                                        ${isSelected
                                            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                        }
                                    `}
                                >
                                    {range.label}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Reviews Range Slider */}
                <div className="space-y-3 pt-2 border-t border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-zinc-400 font-medium">Rango de Reseñas</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={0}
                                max={filters.reviewRange[1]}
                                value={filters.reviewRange[0]}
                                onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    onFilterChange('reviewRange', [val, filters.reviewRange[1]]);
                                }}
                                className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-xs text-right focus:outline-none focus:border-yellow-500/50 transition-colors"
                            />
                            <span className="text-zinc-600">-</span>
                            <input
                                type="number"
                                min={filters.reviewRange[0]}
                                max={maxReviews}
                                value={filters.reviewRange[1]}
                                onChange={(e) => {
                                    const val = Math.min(maxReviews, parseInt(e.target.value) || 0);
                                    onFilterChange('reviewRange', [filters.reviewRange[0], val]);
                                }}
                                className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-xs text-right focus:outline-none focus:border-yellow-500/50 transition-colors"
                            />
                        </div>
                    </div>
                    <Slider
                        min={0}
                        max={maxReviews}
                        step={10}
                        minStepsBetweenThumbs={1}
                        value={filters.reviewRange}
                        onValueChange={(vals) => onFilterChange('reviewRange', vals)}
                        className="py-1"
                    />
                </div>
            </div>
        </Card>
    );
}
