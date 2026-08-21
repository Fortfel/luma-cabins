import type { Locale } from '~/i18n/routing'

import {
  testimonial_01_quote,
  testimonial_01_review,
  testimonial_02_quote,
  testimonial_02_review,
  testimonial_03_quote,
  testimonial_03_review,
  testimonial_04_quote,
  testimonial_04_review,
  testimonial_05_quote,
  testimonial_05_review,
  testimonial_06_quote,
  testimonial_06_review,
} from '~/paraglide/messages.js'

interface Testimonial {
  readonly id: string
  readonly quote: string
  readonly review: string
  readonly clientName: string
  readonly clientInitials: string
  readonly avatarSrc: string
  readonly rating: number
}

const createTestimonials = (locale: Locale): ReadonlyArray<Testimonial> => {
  const messageOptions = { locale }

  return [
    {
      id: 'aster-forest-retreat',
      quote: testimonial_01_quote({}, messageOptions),
      review: testimonial_01_review({}, messageOptions),
      clientName: 'Maya & Theo',
      clientInitials: 'MT',
      avatarSrc: 'https://api.dicebear.com/9.x/notionists/svg?seed=Maya-Theo',
      rating: 5,
    },
    {
      id: 'veyra-lakeside-plot',
      quote: testimonial_02_quote({}, messageOptions),
      review: testimonial_02_review({}, messageOptions),
      clientName: 'Jon Bell',
      clientInitials: 'JB',
      avatarSrc: 'https://api.dicebear.com/9.x/notionists/svg?seed=Jon-Bell',
      rating: 5,
    },
    {
      id: 'niva-retreat',
      quote: testimonial_03_quote({}, messageOptions),
      review: testimonial_03_review({}, messageOptions),
      clientName: 'Nina Patel',
      clientInitials: 'NP',
      avatarSrc: 'https://api.dicebear.com/9.x/notionists/svg?seed=Nina-Patel',
      rating: 5,
    },
    {
      id: 'aster-weekend-cabin',
      quote: testimonial_04_quote({}, messageOptions),
      review: testimonial_04_review({}, messageOptions),
      clientName: 'Clara Jensen',
      clientInitials: 'CJ',
      avatarSrc: 'https://api.dicebear.com/9.x/notionists/svg?seed=Clara-Jensen',
      rating: 5,
    },
    {
      id: 'remote-work-cabin',
      quote: testimonial_05_quote({}, messageOptions),
      review: testimonial_05_review({}, messageOptions),
      clientName: 'Theo Martin',
      clientInitials: 'TM',
      avatarSrc: 'https://api.dicebear.com/9.x/notionists/svg?seed=Theo-Martin',
      rating: 5,
    },
    {
      id: 'veyra-hilltop-plot',
      quote: testimonial_06_quote({}, messageOptions),
      review: testimonial_06_review({}, messageOptions),
      clientName: 'Sofia Alvarez',
      clientInitials: 'SA',
      avatarSrc: 'https://api.dicebear.com/9.x/notionists/svg?seed=Sofia-Alvarez',
      rating: 5,
    },
  ]
}

export type { Testimonial }
export { createTestimonials }
