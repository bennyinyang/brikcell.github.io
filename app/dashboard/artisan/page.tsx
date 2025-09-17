import { ArtisanDashboard } from "@/components/dashboard/artisan-dashboard"
import { Header } from "@/components/header"

export default function ArtisanDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <ArtisanDashboard />
      </main>
    </div>
  )
}
