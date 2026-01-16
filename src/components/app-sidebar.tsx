"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    BarChart3,
    Database,
    Activity,
    FileText,
    Utensils,
    Search,
    MessageSquare,
    Map as MapIcon,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
    {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Explorar Lugares",
        url: "/lugares",
        icon: Search,
    },
    {
        title: "Buscador de Reseñas",
        url: "/reviews",
        icon: MessageSquare,
    },
    {
        title: "Estadísticas",
        url: "/statistics",
        icon: BarChart3,
    },
    {
        title: "Monitor",
        url: "/monitor",
        icon: Activity,
    },
    {
        title: "SQL Editor",
        url: "/sql",
        icon: Database,
    },
    {
        title: "Mapa",
        url: "/mapa",
        icon: MapIcon,
    },
    {
        title: "🧪 Mapa 3D",
        url: "/mapa-3d",
        icon: MapIcon,
    },
    {
        title: "Logs",
        url: "/logs",
        icon: FileText,
    },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar>
            <SidebarHeader className="border-b px-6 py-4">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
                        <Utensils className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Qué Morfamos</h1>
                        <p className="text-xs text-muted-foreground">Dashboard</p>
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
