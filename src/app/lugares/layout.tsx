import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Explorar Lugares",
    description: "Ficha detallada de cada restaurante y sus reseñas.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
