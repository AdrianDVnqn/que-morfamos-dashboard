import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface Word {
    text: string;
    value: number;
}

/** Palabra ya posicionada por d3-cloud (agrega coordenadas, giro y tamaño). */
type PalabraUbicada = cloud.Word & { text: string; size: number; value: number };

interface WordCloudProps {
    words: Word[];
}

export default function WordCloud({ words }: WordCloudProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Handle Resize
    useEffect(() => {
        function handleResize() {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight || 500, // Fallback height
                });
            }
        }

        // Initial measure
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const processedWords = useMemo(() => {
        if (!words || words.length === 0) return [];

        // Sort and take top 70 for density without clutter
        const sorted = [...words].sort((a, b) => b.value - a.value).slice(0, 70);
        const maxValue = sorted[0].value;
        const minValue = sorted[sorted.length - 1].value;

        // Font scale: Linear scale worked nicely for balanced visibility
        const fontScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([14, 60]); // Font sizes from 14px to 60px

        return sorted.map(w => ({
            text: w.text,
            size: fontScale(w.value),
            value: w.value
        }));
    }, [words]);

    useEffect(() => {
        if (dimensions.width === 0 || dimensions.height === 0 || processedWords.length === 0 || !containerRef.current) return;

        // Clear previous SVG
        d3.select(containerRef.current).selectAll('*').remove();

        const layout = cloud()
            .size([dimensions.width, dimensions.height])
            .words(processedWords.map(d => ({ text: d.text, size: d.size, value: d.value })))
            .padding(5) // Padding between words
            .rotate(() => (~~(Math.random() * 2) * 90)) // Randomly rotate 0 or 90 degrees
            .font("Inter, sans-serif")
            .fontSize(d => d.size as number)
            .on("end", draw);

        layout.start();

        function draw(words: PalabraUbicada[]) {
            if (!containerRef.current) return;

            const svg = d3.select(containerRef.current)
                .append("svg")
                .attr("width", dimensions.width)
                .attr("height", dimensions.height)
                .append("g")
                .attr("transform", `translate(${dimensions.width / 2},${dimensions.height / 2})`);

            const text = svg.selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => `${d.size}px`)
                .style("font-family", "Inter, sans-serif")
                .style("fill", (_d, i) => {
                    // Cool palette: Blues, Cyans, Teals, and occasional Accent
                    const palettes = [
                        '#3b82f6', // bright blue
                        '#06b6d4', // cyan
                        '#14b8a6', // teal
                        '#8b5cf6', // violet
                        '#d946ef', // fuchsia (accent)
                        '#e2e8f0', // slate-200 (light text)
                    ];
                    // Use frequency to influence color slightly (optional), here randomish but stable
                    return palettes[i % palettes.length];
                })
                .attr("text-anchor", "middle")
                .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
                .text(d => d.text)
                .style("cursor", "pointer")
                .style("opacity", 0)
                .on("mouseover", function () {
                    d3.select(this).transition().duration(200).style("opacity", 1).style("font-weight", "bold");
                })
                .on("mouseout", function () {
                    d3.select(this).transition().duration(200).style("font-weight", "normal");
                });

            // Add simple title for tooltip
            text.append("title").text(d => `${d.text}: ${d.value} menciones`);

            // Animation in
            text.transition()
                .duration(1000)
                .style("opacity", 1);
        }

    }, [processedWords, dimensions]);

    if (!words || words.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground w-full">
                No hay suficientes palabras para mostrar
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-h-[500px] flex items-center justify-center bg-black/20 rounded-lg overflow-hidden"
        />
    );
}
