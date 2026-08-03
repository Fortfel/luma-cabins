import { ArrowUpRight, Layers, Leaf, ShieldCheck, Truck } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

import { HeroBackground } from '~/app/(app)/_components/hero-background'
import { contactLinkOptions } from '~/app/(app)/_validations/app-link-options'

const HERO_FEATURES = [
  {
    icon: Layers,
    title: 'Precision Built',
    description: 'Factory-crafted modules for superior quality.',
  },
  {
    icon: Truck,
    title: 'Delivered & Installed',
    description: 'Faster build times, less on-site disruption.',
  },
  {
    icon: ShieldCheck,
    title: 'Designed to Last',
    description: 'Durable materials. Timeless design.',
  },
  {
    icon: Leaf,
    title: 'Made to Belong',
    description: 'Sustainable by nature. Considered by design.',
  },
] as const

const MOBILE_FEATURES = ['Precision Built', 'Delivered fast', 'Timeless design'] as const

function HeroSection() {
  return (
    <section className="relative isolate flex min-h-dvh w-full overflow-hidden bg-primary text-primary-foreground">
      <HeroBackground />

      <div
        className={cn(
          'container-page flex grow flex-col justify-end pt-30 pb-16',
          'lg:flex-row lg:items-end lg:justify-between lg:pb-24',
        )}
      >
        <div className="flex flex-col gap-[clamp(1.25rem,calc(1.0115rem+1.0178vw),1.5rem)] sm:max-w-[clamp(36rem,calc(27rem+18.75vw),42rem)]">
          <h1 className="text-clamp-42-88 leading-[1.05] font-medium md:leading-none">
            Live closer
            <br />
            to what matters
          </h1>
          <p className="text-clamp-16-20 leading-normal text-pretty">
            Premium pre-designed cabins, designed to help you slow down, reconnect, and feel at home - anywhere.
          </p>
          <Link
            {...contactLinkOptions()}
            className={cn(
              buttonVariants({ size: 'lg', variant: 'secondary' }),
              'h-13.5 w-full cursor-pointer text-base font-bold text-primary',
            )}
          >
            Get Started
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </div>

        <div>
          <div className="mt-10 grow border-t border-muted-foreground/50 pt-5 lg:hidden">
            <p className="text-[10px] font-black tracking-[0.6px] uppercase">{MOBILE_FEATURES.join(' • ')}</p>
          </div>

          <div className="hidden gap-6 lg:grid">
            {HERO_FEATURES.map((feature) => (
              <HeroFeature key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroFeature({ icon: Icon, title, description }: (typeof HERO_FEATURES)[number]) {
  return (
    <div className="flex items-center gap-4">
      <Icon aria-hidden="true" className="size-6 xl:size-7" />
      <div className="flex flex-col gap-1">
        <p className="font-heading text-lg font-bold">{title}</p>
        <p className="hidden text-sm xl:block">{description}</p>
      </div>
    </div>
  )
}

export { HeroSection }
