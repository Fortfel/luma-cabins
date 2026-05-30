'use client'

import * as React from 'react'

import { Button } from '@workspace/ui/components/button'
import { ButtonGradient } from '@workspace/ui/components/button-gradient'

export default function AppHomePage() {
  const [count, setCount] = React.useState(0)

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="rounded-lg border-4 border-dashed border-gray-200 p-8 dark:border-gray-800">
        <div className="text-center">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-gray-50">Luma Cabins</h1>

          <div className="space-y-4">
            <div className="rounded-lg p-6 shadow">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" onClick={() => setCount((currentCount) => currentCount + 1)}>
                  count is {count}
                </Button>
                <Button variant="ghost" onClick={() => setCount((currentCount) => currentCount + 1)}>
                  count is {count}
                </Button>
                <Button variant="secondary" onClick={() => setCount((currentCount) => currentCount + 1)}>
                  count is {count}
                </Button>
                <ButtonGradient
                  variant="ghost"
                  gradient="normal"
                  onClick={() => setCount((currentCount) => currentCount + 1)}
                >
                  count is {count}
                </ButtonGradient>
                <ButtonGradient
                  variant="secondary"
                  gradient="normal"
                  onClick={() => setCount((currentCount) => currentCount + 1)}
                >
                  count is {count}
                </ButtonGradient>
                <ButtonGradient
                  variant="outline"
                  gradient="normal"
                  onClick={() => setCount((currentCount) => currentCount + 1)}
                >
                  count is {count}
                </ButtonGradient>
                <ButtonGradient
                  variant="destructive"
                  gradient="normal"
                  onClick={() => setCount((currentCount) => currentCount + 1)}
                >
                  count is {count}
                </ButtonGradient>
              </div>

              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Edit <code className="rounded px-2 py-1">src/app/(app)/page.tsx</code> and save to test HMR
              </p>
            </div>

            <div className="rounded-lg p-6 text-left shadow">
              <h2 className="mb-2 text-xl font-semibold">Features Enabled</h2>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>Next.js App Router for file-based routing</li>
                <li>Shared UI package for reusable components</li>
                <li>Turborepo workspace for app and tooling structure</li>
                <li>Tailwind CSS for styling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
