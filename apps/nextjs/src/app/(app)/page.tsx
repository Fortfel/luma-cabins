import { AboutSection } from '~/app/(app)/_components/about-section'
import { HeroSection } from '~/app/(app)/_components/hero-section'
import { InteractiveShowcaseSection } from '~/app/(app)/_components/interactive-showcase-section'
import { InteriorComparisonSection } from '~/app/(app)/_components/interior-comparison-section'
import { ModelsOverviewSection } from '~/app/(app)/_components/models-overview-section'
import { TestimonialsSection } from '~/app/(app)/_components/testimonials-section'

export default function AppHomePage() {
  return (
    <>
      <HeroSection className="mb-(--section-gutter-y)" />
      <AboutSection className="section-py bg-background" />
      <ModelsOverviewSection className="section-py bg-linear-to-b from-background to-background-accent" />
      <InteractiveShowcaseSection className="section-py bg-background-accent" />
      <TestimonialsSection className="section-py bg-background" />
      <InteriorComparisonSection className="section-py bg-linear-to-b from-background-accent to-background" />
    </>
  )
}
