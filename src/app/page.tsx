import { StatsCards } from "@/components/dashboard/stats-cards"
import { ReviewsByZonaChart, CategoriesChart, ReviewsTimelineChart } from "@/components/dashboard/charts"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general de estadísticas de restaurantes y reseñas
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-4 md:grid-cols-3">
        <ReviewsByZonaChart />
        <CategoriesChart />
      </div>

      <ReviewsTimelineChart />
    </div>
  )
}
