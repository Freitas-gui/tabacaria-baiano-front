import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HomeWrapper } from "./home-wrapper";
import { Suspense } from "react";

export default function Home() {
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
            Carregando produtos...
          </div>
        }
      >
        <HomeWrapper />
      </Suspense>
      <Footer />
    </div>
  );
}
