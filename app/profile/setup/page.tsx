import { ArtisanProfileSetup } from "@/components/profile/artisan-profile-setup"
import { Header } from "@/components/header"

export default function ProfileSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8">
        <ArtisanProfileSetup />
      </main>
    </div>
  )
}
