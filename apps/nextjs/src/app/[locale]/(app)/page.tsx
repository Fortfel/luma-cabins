import { AboutSection } from '~/app/[locale]/(app)/_components/about-section'
import { HeroSection } from '~/app/[locale]/(app)/_components/hero-section'
import { HowItWorksSection } from '~/app/[locale]/(app)/_components/how-it-works-section'
import { InteractiveShowcaseSection } from '~/app/[locale]/(app)/_components/interactive-showcase-section'
import { InteriorComparisonSection } from '~/app/[locale]/(app)/_components/interior-comparison-section'
import { ModelsOverviewSection } from '~/app/[locale]/(app)/_components/models-overview-section'
import { TestimonialsSection } from '~/app/[locale]/(app)/_components/testimonials-section'

export default function AppHomePage() {
  return (
    <>
      <HeroSection className="mb-(--section-gutter-y)" />
      <AboutSection className="section-py bg-background" />
      <ModelsOverviewSection className="section-py bg-background" />
      <InteractiveShowcaseSection className="section-py bg-background" />
      <TestimonialsSection className="section-py bg-background-accent" />
      <InteriorComparisonSection className="section-py bg-linear-to-b from-background to-background-accent " />
      <HowItWorksSection id="process" className="section-py bg-background-accent" />
    </>
  )
}
