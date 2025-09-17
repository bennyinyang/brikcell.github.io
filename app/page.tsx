import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ServiceCategories } from "@/components/service-categories"
import { HowItWorks } from "@/components/how-it-works"
import { FeaturedArtisans } from "@/components/featured-artisans"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ServiceCategories />
        <HowItWorks />
        <FeaturedArtisans />
      </main>
      <Footer />
    </div>
  )
}
