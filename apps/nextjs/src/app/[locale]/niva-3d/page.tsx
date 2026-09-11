import type { Metadata } from 'next'

import { Niva3DPrototype } from './niva-3d-prototype'

export const metadata: Metadata = {
  title: { absolute: 'Niva browser gate' },
  description: 'Private Niva React Three Fiber feasibility prototype.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function Niva3DPage() {
  return <Niva3DPrototype />
}
