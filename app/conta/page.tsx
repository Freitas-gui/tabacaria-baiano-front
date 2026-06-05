import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AccountPage } from "@/components/account-page"
import { Suspense } from "react"

export default function ContaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">Carregando...</div>
        }
      >
        <Header />
      </Suspense>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            Carregando conta...
          </div>
        }
      >
        <AccountPage />
      </Suspense>
      <Footer />
    </div>
  )
}
