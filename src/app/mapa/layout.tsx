import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Mapa",
    description: "Distribución geográfica de los locales relevados.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
