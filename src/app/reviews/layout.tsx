import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Buscador de Reseñas",
    description: "Búsqueda de texto completo sobre las reseñas relevadas.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
