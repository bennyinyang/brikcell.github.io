import { ArtisanProfile } from "@/components/profile/artisan-profile"
import { Header } from "@/components/header"

interface ArtisanProfilePageProps {
  params: {
    id: string
  }
}

export default function ArtisanProfilePage({ params }: ArtisanProfilePageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <ArtisanProfile artisanId={params.id} />
      </main>
    </div>
  )
}
