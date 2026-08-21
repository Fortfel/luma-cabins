import type * as React from 'react'
import type { Locale } from '~/i18n/routing'

import { ArrowUpRight, Layers, Leaf, ShieldCheck, Truck } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

import { HeroBackground } from '~/app/[locale]/(app)/_components/hero-background'
import { contactLinkOptions } from '~/app/[locale]/(app)/_validations/app-link-options'
import {
  hero_cta,
  hero_description,
  hero_feature_belonging_description,
  hero_feature_belonging_title,
  hero_feature_delivery_description,
  hero_feature_delivery_title,
  hero_feature_durability_description,
  hero_feature_durability_title,
  hero_feature_precision_description,
  hero_feature_precision_title,
  hero_mobile_delivery,
  hero_mobile_design,
  hero_mobile_precision,
  hero_title,
  hero_video_pause_aria,
  hero_video_play_aria,
} from '~/paraglide/messages.js'

interface HeroSectionProps extends React.ComponentProps<'section'> {
  readonly locale: Locale
}

interface HeroFeatureProps {
  readonly icon: typeof Layers
  readonly title: string
  readonly description: string
}

function HeroSection({ locale, className, ...props }: HeroSectionProps) {
  const messageOptions = { locale }
  const features = [
    {
      icon: Layers,
      title: hero_feature_precision_title({}, messageOptions),
      description: hero_feature_precision_description({}, messageOptions),
    },
    {
      icon: Truck,
      title: hero_feature_delivery_title({}, messageOptions),
      description: hero_feature_delivery_description({}, messageOptions),
    },
    {
      icon: ShieldCheck,
      title: hero_feature_durability_title({}, messageOptions),
      description: hero_feature_durability_description({}, messageOptions),
    },
    {
      icon: Leaf,
      title: hero_feature_belonging_title({}, messageOptions),
      description: hero_feature_belonging_description({}, messageOptions),
    },
  ] as const satisfies ReadonlyArray<HeroFeatureProps>

  const mobileFeatures = [
    hero_mobile_precision({}, messageOptions),
    hero_mobile_delivery({}, messageOptions),
    hero_mobile_design({}, messageOptions),
  ]

  return (
    <section
      className={cn(
        'relative isolate flex min-h-svh w-full overflow-hidden bg-primary text-primary-foreground',
        className,
      )}
      {...props}
    >
      <HeroBackground
        playLabel={hero_video_play_aria({}, messageOptions)}
        pauseLabel={hero_video_pause_aria({}, messageOptions)}
      />

      <div
        className={cn(
          'container-page-2xl flex grow flex-col justify-end pt-30 pb-16',
          'lg:flex-row lg:items-end lg:justify-between lg:pb-24',
        )}
      >
        <div className="flex flex-col gap-[clamp(1.25rem,calc(1.0115rem+1.0178vw),1.5rem)] sm:max-w-[clamp(36rem,calc(27rem+18.75vw),42rem)]">
          <h1 className="text-display-xl text-balance">{hero_title({}, messageOptions)}</h1>
          <p className="text-body-lg text-pretty">{hero_description({}, messageOptions)}</p>
          <Link
            {...contactLinkOptions(locale)}
            className={cn(
              buttonVariants({ size: 'lg', variant: 'secondary' }),
              'h-13.5 w-full cursor-pointer text-base font-bold text-primary',
            )}
          >
            {hero_cta({}, messageOptions)}
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </div>

        <div>
          <div className="mt-10 grow border-t border-muted-foreground/50 pt-5 lg:hidden">
            <p className="text-[10px] font-black tracking-[0.6px] uppercase">{mobileFeatures.join(' • ')}</p>
          </div>

          <div className="hidden gap-6 lg:grid">
            {features.map((feature) => (
              <HeroFeature key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroFeature({ icon: Icon, title, description }: HeroFeatureProps) {
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
