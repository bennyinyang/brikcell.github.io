import { LandingHeader } from "@/components/landing-header"
import { HeroSection } from "@/components/hero-section"
import {
  TopServicesSection,
  WhyChooseBrikcellSection,
  TopTalentsSection,
  FindTalentsSection,
  ShowcaseTalentSection,
  ReadyToStartSection,
} from "@/components/landing-sections"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      <main>
        <HeroSection />
        <TopServicesSection />
        <WhyChooseBrikcellSection />
        <TopTalentsSection />
        <FindTalentsSection />
        <ShowcaseTalentSection />
        <ReadyToStartSection />
      </main>
    </div>
  )
}