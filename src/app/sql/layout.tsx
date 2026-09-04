import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Explorador SQL",
    description: "Consultas de sólo lectura sobre las tablas públicas.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
