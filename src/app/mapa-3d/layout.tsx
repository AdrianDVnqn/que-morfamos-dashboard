import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Mapa 3D",
    description: "Visualización tridimensional de densidad de reseñas.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
