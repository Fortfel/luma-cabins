import { AboutSection } from '~/app/(app)/_components/about-section'
import { HeroSection } from '~/app/(app)/_components/hero-section'
import { ModelsOverviewSection } from '~/app/(app)/_components/models-overview-section'

export default function AppHomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection className="section-py mt-[clamp(2.5rem,calc(-0.5rem+7.5vw),5.5rem)] bg-background" />
      <ModelsOverviewSection className="section-py bg-background" />
    </>
  )
}
