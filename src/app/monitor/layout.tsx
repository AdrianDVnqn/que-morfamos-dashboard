import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Monitor de Scraping",
    description: "Actividad del pipeline y evolución de reseñas nuevas.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
