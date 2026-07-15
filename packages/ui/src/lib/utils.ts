import type { ClassValue } from 'clsx'

import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [(value: string) => value.startsWith('clamp-')],
        },
      ],
    },
  },
})

export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs))
}
