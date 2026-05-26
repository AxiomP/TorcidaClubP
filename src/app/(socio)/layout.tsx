'use client'

import { SocioHeader } from '@/components/socio/header'

export default function SocioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <SocioHeader />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
