import { AboutSection } from '~/app/(app)/_components/about-section'
import { HeroSection } from '~/app/(app)/_components/hero-section'

export default function AppHomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection className="bg-background py-10" />
    </>
  )
}
