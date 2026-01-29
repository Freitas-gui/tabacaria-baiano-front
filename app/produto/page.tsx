import { Header } from "@/components/header"
import { ProductDetail } from "@/components/product-detail"
import { Footer } from "@/components/footer"
import { Suspense } from "react"

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="container mx-auto px-4 py-8">Carregando...</div>}>
        <Header />
      </Suspense>
      <ProductDetail />
      <Footer />
    </div>
  )
}
