import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Estadísticas",
    description: "Análisis por zona, barrio, categoría y distribución de ratings.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
