import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Paneles",
    description: "Paneles analíticos con la consulta SQL que calcula cada uno.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
