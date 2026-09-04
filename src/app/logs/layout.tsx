import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Logs de Scraping",
    description: "Historial de corridas del pipeline de datos.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
