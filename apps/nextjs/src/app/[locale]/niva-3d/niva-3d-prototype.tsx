'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'

import styles from './niva-3d-prototype.module.css'

const NivaRuntime = dynamic(() => import('./niva-3d-runtime').then(({ NivaRuntime: Runtime }) => Runtime), {
  ssr: false,
  loading: () => <NivaLoadingState />,
})

export function Niva3DPrototype() {
  return <NivaRuntime />
}

function NivaLoadingState() {
  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Private feasibility sandbox</p>
            <h1 className={styles.title}>Niva / browser gate</h1>
          </div>
          <span className={styles.privateBadge}>Unlinked / noindex</span>
        </header>

        <section className={styles.loadingIntro} aria-live="polite">
          <p>Loading the finalized Niva configurator behind its canonical review poster.</p>
        </section>

        <div className={styles.loadingStage}>
          <Image
            src="/niva-3d/niva-configurator-poster.png"
            alt="Niva cabin canonical review render"
            fill
            priority
            unoptimized
            sizes="(max-width: 900px) 100vw, 70vw"
            className={styles.poster}
          />
        </div>
      </div>
    </main>
  )
}
