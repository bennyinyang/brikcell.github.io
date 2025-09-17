import { CustomerDashboard } from "@/components/dashboard/customer-dashboard"
import { Header } from "@/components/header"

export default function CustomerDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <CustomerDashboard />
      </main>
    </div>
  )
}
