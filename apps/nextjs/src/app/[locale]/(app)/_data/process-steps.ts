import type { Locale } from '~/i18n/routing'

import { contactLinkOptions } from '~/app/[locale]/(app)/_validations/app-link-options'
import {
  process_cta,
  process_show_step,
  process_status,
  process_step_01_bullet_01,
  process_step_01_bullet_02,
  process_step_01_bullet_03,
  process_step_01_description,
  process_step_01_label,
  process_step_01_media_alt,
  process_step_01_title,
  process_step_02_bullet_01,
  process_step_02_bullet_02,
  process_step_02_bullet_03,
  process_step_02_description,
  process_step_02_label,
  process_step_02_media_alt,
  process_step_02_title,
  process_step_03_bullet_01,
  process_step_03_bullet_02,
  process_step_03_bullet_03,
  process_step_03_description,
  process_step_03_label,
  process_step_03_media_alt,
  process_step_03_title,
  process_step_04_bullet_01,
  process_step_04_bullet_02,
  process_step_04_bullet_03,
  process_step_04_description,
  process_step_04_label,
  process_step_04_media_alt,
  process_step_04_title,
  process_step_aria,
} from '~/paraglide/messages.js'

type ProcessStepNumber = '01' | '02' | '03' | '04'

interface ProcessStep {
  id: string
  number: ProcessStepNumber
  label: string
  title: string
  description: string
  bullets: ReadonlyArray<string>
  ariaLabel: string
  showLabel: string
  status: string
  copyStatus: 'provisional'
  media: {
    kind: 'image' | 'video'
    src: string
    webmSrc?: string
    posterSrc?: string
    alt: string
    width: number
    height: number
    isPlaceholder: boolean
  }
  cta?: {
    label: string
    href: string
  }
}

const createProcessSteps = (locale: Locale): ReadonlyArray<ProcessStep> => {
  const messageOptions = { locale }
  const total = 4
  const labels = [
    process_step_01_label({}, messageOptions),
    process_step_02_label({}, messageOptions),
    process_step_03_label({}, messageOptions),
    process_step_04_label({}, messageOptions),
  ] as const
  const createAccessibility = (index: number, label: string) => ({
    ariaLabel: process_step_aria({ number: index + 1, label }, messageOptions),
    showLabel: process_show_step({ number: index + 1, label }, messageOptions),
    status: process_status({ current: index + 1, total, label }, messageOptions),
  })

  return [
    {
      id: 'design-yours',
      number: '01',
      label: labels[0],
      title: process_step_01_title({}, messageOptions),
      description: process_step_01_description({}, messageOptions),
      bullets: [
        process_step_01_bullet_01({}, messageOptions),
        process_step_01_bullet_02({}, messageOptions),
        process_step_01_bullet_03({}, messageOptions),
      ],
      ...createAccessibility(0, labels[0]),
      copyStatus: 'provisional',
      media: {
        kind: 'image',
        src: '/images/process/process-step1-v1.jpg',
        alt: process_step_01_media_alt({}, messageOptions),
        width: 1448,
        height: 1086,
        isPlaceholder: false,
      },
    },
    {
      id: 'pick-the-spot',
      number: '02',
      label: labels[1],
      title: process_step_02_title({}, messageOptions),
      description: process_step_02_description({}, messageOptions),
      bullets: [
        process_step_02_bullet_01({}, messageOptions),
        process_step_02_bullet_02({}, messageOptions),
        process_step_02_bullet_03({}, messageOptions),
      ],
      ...createAccessibility(1, labels[1]),
      copyStatus: 'provisional',
      media: {
        kind: 'video',
        src: '/videos/process/process-step2-video2.mp4',
        webmSrc: '/videos/process/process-step2-video2.webm',
        posterSrc: '/images/process/process-step2-video2-poster.webp',
        alt: process_step_02_media_alt({}, messageOptions),
        width: 1280,
        height: 720,
        isPlaceholder: false,
      },
    },
    {
      id: 'prepare-together',
      number: '03',
      label: labels[2],
      title: process_step_03_title({}, messageOptions),
      description: process_step_03_description({}, messageOptions),
      bullets: [
        process_step_03_bullet_01({}, messageOptions),
        process_step_03_bullet_02({}, messageOptions),
        process_step_03_bullet_03({}, messageOptions),
      ],
      ...createAccessibility(2, labels[2]),
      copyStatus: 'provisional',
      media: {
        kind: 'video',
        src: '/videos/process/process-step3-video.mp4',
        webmSrc: '/videos/process/process-step3-video.webm',
        posterSrc: '/images/process/process-step3-video-poster.webp',
        alt: process_step_03_media_alt({}, messageOptions),
        width: 960,
        height: 720,
        isPlaceholder: false,
      },
    },
    {
      id: 'deliver-and-install',
      number: '04',
      label: labels[3],
      title: process_step_04_title({}, messageOptions),
      description: process_step_04_description({}, messageOptions),
      bullets: [
        process_step_04_bullet_01({}, messageOptions),
        process_step_04_bullet_02({}, messageOptions),
        process_step_04_bullet_03({}, messageOptions),
      ],
      ...createAccessibility(3, labels[3]),
      copyStatus: 'provisional',
      media: {
        kind: 'video',
        src: '/videos/process/process-step4-video.mp4',
        webmSrc: '/videos/process/process-step4-video.webm',
        posterSrc: '/images/process/process-step4-video-poster.webp',
        alt: process_step_04_media_alt({}, messageOptions),
        width: 960,
        height: 720,
        isPlaceholder: false,
      },
      cta: {
        label: process_cta({}, messageOptions),
        ...contactLinkOptions(locale),
      },
    },
  ]
}

export type { ProcessStep }
export { createProcessSteps }
