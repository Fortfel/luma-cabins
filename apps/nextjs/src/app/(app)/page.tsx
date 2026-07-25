import { AboutSection } from '~/app/(app)/_components/about-section'
import { HeroSection } from '~/app/(app)/_components/hero-section'
import { InteractiveShowcaseSection } from '~/app/(app)/_components/interactive-showcase-section'
import { ModelsOverviewSection } from '~/app/(app)/_components/models-overview-section'
import { TestimonialsSection } from '~/app/(app)/_components/testimonials-section'

export default function AppHomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection className="section-py mt-[clamp(2.5rem,calc(-0.5rem+7.5vw),5.5rem)] bg-background" />
      <ModelsOverviewSection className="section-py bg-linear-to-b from-background to-background-accent" />
      <InteractiveShowcaseSection className="section-py bg-background-accent" />
      <TestimonialsSection className="section-py bg-background" />
    </>
  )
}
