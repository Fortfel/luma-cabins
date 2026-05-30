import type * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'

type PictureCandidate = {
  readonly src: string
  readonly width: number
}

type PictureProps = Omit<React.ComponentPropsWithoutRef<'img'>, 'src' | 'srcSet' | 'alt'> & {
  readonly avif?: ReadonlyArray<PictureCandidate>
  readonly webp?: ReadonlyArray<PictureCandidate>
  readonly fallback: {
    readonly src: string
    readonly candidates?: ReadonlyArray<PictureCandidate>
  }
  readonly pictureClassName?: string
  readonly alt: string
}

const buildSrcSet = (candidates: ReadonlyArray<PictureCandidate>) =>
  candidates.map(({ src, width }) => `${src} ${width.toString()}w`).join(', ')

function Picture({ avif, webp, fallback, sizes, alt, pictureClassName, className, ...props }: PictureProps) {
  return (
    <picture className={cn(pictureClassName)}>
      {avif && <source type="image/avif" srcSet={buildSrcSet(avif)} sizes={sizes} />}
      {webp && <source type="image/webp" srcSet={buildSrcSet(webp)} sizes={sizes} />}
      <img
        src={fallback.src}
        srcSet={fallback.candidates ? buildSrcSet(fallback.candidates) : undefined}
        alt={alt}
        sizes={sizes}
        className={cn(className)}
        {...props}
      />
    </picture>
  )
}

export { Picture }
export type { PictureCandidate, PictureProps }
