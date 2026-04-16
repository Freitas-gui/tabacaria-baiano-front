"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CheckoutForm } from "@/components/checkout-form";
import { Suspense } from "react";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">Carregando...</div>
        }
      >
        <Header />
      </Suspense>
      <CheckoutForm />
      <Footer />
    </div>
  );
}
