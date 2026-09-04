import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // El template hace que cada ruta aporte su propio título (lo define su layout) y que la
  // pestaña sea distinguible: antes las nueve páginas se llamaban igual.
  title: {
    template: "%s · Qué Morfamos",
    default: "Dashboard · Qué Morfamos",
  },
  description:
    "Panel de monitoreo y análisis del relevamiento gastronómico de Neuquén: 929 locales y más de 200.000 reseñas.",
  openGraph: {
    title: "Qué Morfamos · Dashboard",
    description:
      "Panel de monitoreo y análisis del relevamiento gastronómico de Neuquén: 929 locales y más de 200.000 reseñas.",
    type: "website",
    locale: "es_AR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
                <SidebarTrigger />
                <div className="flex-1" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto p-4 lg:p-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
