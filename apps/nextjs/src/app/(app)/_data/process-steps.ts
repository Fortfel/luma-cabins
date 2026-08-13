type ProcessStepNumber = '01' | '02' | '03' | '04'

interface ProcessStep {
  id: string
  number: ProcessStepNumber
  label: string
  title: string
  description: string
  bullets: ReadonlyArray<string>
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
    href: '/contact'
  }
}

// Descriptions and bullets are explicitly provisional until the process is reviewed against the final service scope.
const processSteps = [
  {
    id: 'design-yours',
    number: '01',
    label: 'Design yours',
    title: 'Shape a cabin around the way you want to live.',
    description:
      'Start with Niva, Aster, or Veyra, then shape a curated set of finishes, systems, and add-ons around how you want to use the space.',
    bullets: ['Choose the model and layout', 'Curate interior and exterior finishes', 'Add energy and outdoor options'],
    copyStatus: 'provisional',
    media: {
      kind: 'image',
      src: '/images/process/process-step1-v1.jpg',
      alt: 'Exploded view of a cabin interior with its roof, walls, kitchen, living area, bathroom, bedroom, and deck separated.',
      width: 1448,
      height: 1086,
      isPlaceholder: false,
    },
  },
  {
    id: 'pick-the-spot',
    number: '02',
    label: 'Pick the spot',
    title: 'Find the setting that makes it feel at home.',
    description:
      'Share the setting you have in mind. Luma helps review access, orientation, terrain, and the local requirements that may shape the project.',
    bullets: [
      'Consider views, daylight, and privacy',
      'Review access and ground conditions',
      'Identify local requirements early',
    ],
    copyStatus: 'provisional',
    media: {
      kind: 'video',
      src: '/videos/process/process-step2-video2.mp4',
      webmSrc: '/videos/process/process-step2-video2.webm',
      posterSrc: '/images/process/process-step2-video2-poster.webp',
      alt: 'Video of a landscaped garden setting with a mature tree and open lawn.',
      width: 1280,
      height: 720,
      isPlaceholder: false,
    },
  },
  {
    id: 'prepare-together',
    number: '03',
    label: 'Prepare together',
    title: 'Bring the site and cabin plan together.',
    description:
      'With the direction agreed, Luma coordinates the cabin plan with the local specialists preparing the foundations, utilities, and route to site.',
    bullets: ['Confirm drawings and selections', 'Align foundations and utility work', 'Plan production and delivery'],
    copyStatus: 'provisional',
    media: {
      kind: 'video',
      src: '/videos/process/process-step3-video.mp4',
      webmSrc: '/videos/process/process-step3-video.webm',
      posterSrc: '/images/process/process-step3-video-poster.webp',
      alt: 'Two people reviewing architectural plans, material samples, and interior references at a table.',
      width: 960,
      height: 720,
      isPlaceholder: false,
    },
  },
  {
    id: 'deliver-and-install',
    number: '04',
    label: 'Deliver and install',
    title: 'Watch your cabin take its place.',
    description:
      'Once the site is ready, the cabin is delivered and installed, with final connections and handover coordinated around the agreed project scope.',
    bullets: ['Position and secure the cabin', 'Complete agreed site connections', 'Walk through the finished space'],
    copyStatus: 'provisional',
    media: {
      kind: 'video',
      src: '/videos/process/process-step4-video.mp4',
      webmSrc: '/videos/process/process-step4-video.webm',
      posterSrc: '/images/process/process-step4-video-poster.webp',
      alt: 'Video showing a cabin being delivered, installed, and prepared for handover.',
      width: 960,
      height: 720,
      isPlaceholder: false,
    },
    cta: {
      label: 'Get started',
      href: '/contact',
    },
  },
] as const satisfies ReadonlyArray<ProcessStep>

export type { ProcessStep }
export { processSteps }
