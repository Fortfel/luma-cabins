import { AboutSection } from '~/app/[locale]/(app)/_components/about-section'
import { HeroSection } from '~/app/[locale]/(app)/_components/hero-section'
import { HowItWorksSection } from '~/app/[locale]/(app)/_components/how-it-works-section'
import { InteractiveShowcaseSection } from '~/app/[locale]/(app)/_components/interactive-showcase-section'
import { InteriorComparisonSection } from '~/app/[locale]/(app)/_components/interior-comparison-section'
import { ModelsOverviewSection } from '~/app/[locale]/(app)/_components/models-overview-section'
import { TestimonialsSection } from '~/app/[locale]/(app)/_components/testimonials-section'
import { resolveLocale } from '~/i18n/server'

interface AppHomePageProps {
  readonly params: Promise<{ locale: string }>
}

export default async function AppHomePage({ params }: AppHomePageProps) {
  const locale = resolveLocale((await params).locale)

  return (
    <>
      <HeroSection locale={locale} className="mb-(--section-gutter-y)" />
      <AboutSection locale={locale} className="section-py bg-background" />
      <ModelsOverviewSection locale={locale} className="section-py bg-background" />
      <InteractiveShowcaseSection locale={locale} className="section-py bg-background" />
      <TestimonialsSection locale={locale} className="section-py bg-background-accent" />
      <InteriorComparisonSection
        locale={locale}
        className="section-py bg-linear-to-b from-background to-background-accent "
      />
      <HowItWorksSection locale={locale} id="process" className="section-py bg-background-accent" />
    </>
  )
}
