import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { OrdersPage } from "@/components/orders-page";
import { Suspense } from "react";

export default function PedidosPage() {
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
            Carregando pedidos...
          </div>
        }
      >
        <OrdersPage />
      </Suspense>
      <Footer />
    </div>
  );
}
