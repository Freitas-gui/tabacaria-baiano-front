"use client"

import { Homepage } from "@/components/homepage"
import { Suspense } from "react"

function HomeContent() {
  return <Homepage />
}

export function HomeWrapper() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Carregando...</div>}>
      <HomeContent />
    </Suspense>
  )
}
