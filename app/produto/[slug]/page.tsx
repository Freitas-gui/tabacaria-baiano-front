import { Header } from "@/components/header";
import { ProductDetail } from "@/components/product-detail";
import { Footer } from "@/components/footer";
import { Suspense } from "react";

type ProductPageProps = {
  params: {
    slug: string;
  };
};

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">Carregando...</div>
        }
      >
        <Header />
      </Suspense>
      <ProductDetail slug={decodeURIComponent(params.slug)} />
      <Footer />
    </div>
  );
}
