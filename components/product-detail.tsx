"use client";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/cdn";
import { extractProductImageUrls } from "@/lib/product-images";
import { getProductPath } from "@/lib/product-slug";
import { ProductImageFrame } from "@/components/product-image-frame";

// ---- Types ----
type Pharmacy = {
  id: string;
  name: string;
  price: string;
  stock: number;
  pharmacyProductId: string;
};

type Variation = {
  typeName: string;
  optionId: string;
  optionName: string;
  stock?: number | null;
};

type Product = {
  id: string;
  pharmacyProductId?: string | null;
  slug?: string | null;
  reference: string | null;
  name: string;
  description: string | null;
  price: string | null;
  category: string | null;
  image: string | null;
  additionalImages: string[];
  keywords?: string[];
};

function formatPriceBRL(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const n =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (Number.isNaN(n)) return String(value);
  if (Number.isInteger(n)) return String(n); // ex: 15.0 -> "15"
  return n.toFixed(2).replace(".", ","); // ex: 15.5 -> "15,50"
}

// Default product as fallback
const defaultProduct: Product & {
  originalPrice?: string;
} = {
  id: "creme-elseve-liso-250ml",
  name: "",
  price: "",
  originalPrice: "21,90",
  image: "/placeholder.svg?height=400&width=400",
  additionalImages: [],
  reference: "7509785461900",
  category: "",
  description: null,
};

export function ProductDetail({ slug }: { slug: string }) {
  const { addToCart, items } = useCart();
  const router = useRouter();

  const [product, setProduct] = useState<Product>(defaultProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [otherPharmacies, setOtherPharmacies] = useState<Pharmacy[]>([]);
  const [loadingOtherPharmacies, setLoadingOtherPharmacies] = useState(false);
  const [currentPharmacy, setCurrentPharmacy] = useState<{
    name: string;
    stock: number | null;
  } | null>(null);
  const [loadingProductDetail, setLoadingProductDetail] = useState(false);
  const [productNotFound, setProductNotFound] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariationOptionId, setSelectedVariationOptionId] = useState<
    string | null
  >(null);

  // ---- Products from API ----
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoadingProducts(true);
      setProductsError(null);

      const res = await fetch(`${API_BASE_URL}/api/product`, {
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];

      const normalized: Product[] = data
        .map((p: any) => {
          const imgs = extractProductImageUrls(p as Record<string, unknown>);

          const normalizedProduct: Product = {
            id: String(p?.id ?? ""),
            pharmacyProductId: p?.pharmacyProductId
              ? String(p.pharmacyProductId)
              : null,
            slug: p?.slug ? String(p.slug) : null,
            reference: p?.reference ? String(p.reference) : null,
            name: String(p?.name ?? "").trim(),
            description: p?.description ? String(p.description) : null,
            price:
              p?.price === null || p?.price === undefined
                ? null
                : String(p.price), // manter string (ex: "15.5")
            category: p?.category ? String(p.category) : null,
            image: imgs.length > 0 ? imgs[0] : null,
            additionalImages: imgs.slice(1),
            keywords: Array.isArray(p?.keywords) ? p.keywords : [],
          } as Product;

          return normalizedProduct;
        })
        .filter((p: Product) => p.id && p.name);

      setProducts(normalized);
    } catch (e: any) {
      // Silenciar erro conforme seu exemplo; se quiser exibir, descomente:
      // setProductsError("Não foi possível carregar os produtos. Tente novamente.");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const applyDetailData = useCallback((data: Record<string, unknown>) => {
    const categoryName =
      typeof data.category === "string"
        ? data.category
        : data.category &&
            typeof data.category === "object" &&
            "name" in data.category
          ? String((data.category as { name?: string }).name ?? "")
          : null;

    const images = Array.isArray(data.images)
      ? data.images
          .map((image) => String(image))
          .map((image) => resolveCdnUrl(image))
          .filter(Boolean)
      : [];

    setProduct((prev) => ({
      ...prev,
      id: data.id ? String(data.id) : prev.id,
      slug: data.slug ? String(data.slug) : prev.slug,
      name: data.name ? String(data.name).trim() : prev.name,
      description: data.description ? String(data.description) : prev.description,
      reference: data.ean ? String(data.ean) : prev.reference,
      category: categoryName ?? prev.category,
      price: data.price ? String(data.price) : prev.price,
      pharmacyProductId: data.pharmacyProductId
        ? String(data.pharmacyProductId)
        : prev.pharmacyProductId,
      image: images.length > 0 ? images[0] : prev.image,
      additionalImages: images.length > 1 ? images.slice(1) : prev.additionalImages,
      keywords: Array.isArray(data.keywords)
        ? data.keywords.map((keyword) => String(keyword))
        : prev.keywords,
    }));

    if (
      data.pharmacy &&
      typeof data.pharmacy === "object" &&
      "name" in data.pharmacy
    ) {
      setCurrentPharmacy({
        name: String((data.pharmacy as { name?: string }).name ?? ""),
        stock:
          data.stock !== undefined && data.stock !== null
            ? Number(data.stock)
            : null,
      });
    }

    if (Array.isArray(data.otherPharmacies)) {
      setOtherPharmacies(data.otherPharmacies as Pharmacy[]);
    } else {
      setOtherPharmacies([]);
    }

    if (Array.isArray(data.variations) && data.variations.length > 0) {
      const parsed: Variation[] = data.variations
        .filter(
          (variation) =>
            typeof variation === "object" &&
            variation !== null &&
            "stock" in variation &&
            variation.stock !== undefined &&
            variation.stock !== null &&
            Number(variation.stock) > 0,
        )
        .map((variation) => {
          const item = variation as Record<string, unknown>;
          return {
            typeName: String(item.typeName ?? ""),
            optionId: String(item.optionId ?? ""),
            optionName: String(item.optionName ?? ""),
            stock: Number(item.stock),
          };
        });
      setVariations(parsed);
      setSelectedVariationOptionId(parsed[0]?.optionId ?? null);
    } else {
      setVariations([]);
      setSelectedVariationOptionId(null);
    }
  }, []);

  const loadProductDetail = useCallback(async (pharmacyProductId: string) => {
    if (!pharmacyProductId) {
      return;
    }

    try {
      setLoadingProductDetail(true);
      const res = await fetch(
        `${API_BASE_URL}/api/product/show/${pharmacyProductId}`,
      );

      if (res.status === 204 || !res.ok) {
        setOtherPharmacies([]);
        setCurrentPharmacy(null);
        return;
      }

      const json = await res.json();
      const data = json.data || json;

      if (data) {
        applyDetailData(data as Record<string, unknown>);
      }
    } catch (error) {
      console.error("Error loading product detail:", error);
      setOtherPharmacies([]);
      setCurrentPharmacy(null);
    } finally {
      setLoadingProductDetail(false);
    }
  }, [applyDetailData]);

  const loadProductBySlug = useCallback(async (productSlug: string) => {
    if (!productSlug) {
      setProductNotFound(true);
      return;
    }

    try {
      setLoadingProductDetail(true);
      setProductNotFound(false);
      setSelectedImageIndex(0);

      const res = await fetch(
        `${API_BASE_URL}/api/product/slug/${encodeURIComponent(productSlug)}`,
      );

      if (res.status === 204 || !res.ok) {
        setProductNotFound(true);
        return;
      }

      const json = await res.json();
      const data = json.data || json;

      if (data) {
        applyDetailData(data as Record<string, unknown>);
      } else {
        setProductNotFound(true);
      }
    } catch (error) {
      console.error("Error loading product by slug:", error);
      setProductNotFound(true);
    } finally {
      setLoadingProductDetail(false);
    }
  }, [applyDetailData]);

  const loadOtherPharmacies = useCallback(async (pharmacyProductId: string) => {
    if (!pharmacyProductId) return;

    try {
      setLoadingOtherPharmacies(true);
      const res = await fetch(
        `${API_BASE_URL}/api/product/show/${pharmacyProductId}`,
      );

      if (!res.ok || res.status === 204) {
        setOtherPharmacies([]);
        return;
      }

      const json = await res.json();
      const data = json.data || json;

      if (data && Array.isArray(data.otherPharmacies)) {
        setOtherPharmacies(data.otherPharmacies);
      } else {
        setOtherPharmacies([]);
      }
    } catch (error) {
      console.error("Error loading other pharmacies:", error);
      setOtherPharmacies([]);
    } finally {
      setLoadingOtherPharmacies(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    loadProducts(ac.signal);
    return () => ac.abort();
  }, [loadProducts]);

  const handlePharmacyClick = (pharmacyProductId: string) => {
    if (pharmacyProductId) {
      loadProductDetail(pharmacyProductId);
    }
  };

  // Create dynamic product images array based on product data
  const productImages = useMemo(
    () => [
      product.image || "/placeholder.svg?height=400&width=400",
      ...(product.additionalImages || []),
    ],
    [product.image, product.additionalImages],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProductBySlug(slug);
  }, [slug, loadProductBySlug]);

  const selectedVariation = variations.find(
    (v) => v.optionId === selectedVariationOptionId,
  );

  const handleAddToCart = () => {
    const availableStock =
      selectedVariation?.stock !== undefined && selectedVariation?.stock !== null
        ? selectedVariation.stock
        : (currentPharmacy?.stock ?? null);

    if (availableStock !== null && availableStock !== undefined && availableStock <= 0) {
      router.push("/checkout");
      return;
    }

    if (availableStock !== null && availableStock !== undefined) {
      const existingItem = items.find(
        (item) =>
          item.pharmacyProductId === product.pharmacyProductId &&
          (item.variationOptionId === selectedVariationOptionId ||
            item.variationOptionName === selectedVariation?.optionName),
      );

      if (existingItem && existingItem.quantity >= availableStock) {
        router.push("/checkout");
        return;
      }
    }

    addToCart({
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      price: product.price ?? "",
      image: product.image || "/placeholder.svg?height=400&width=400",
      slug: product.slug || null,
      pharmacyProductId: product.pharmacyProductId || null,
      pharmacyName: currentPharmacy?.name || null,
      stock: availableStock,
      variationOptionId: selectedVariationOptionId,
      variationOptionName: selectedVariation?.optionName ?? null,
      variationTypeName: selectedVariation?.typeName ?? null,
    });
  };

  const handleBuyNow = () => {
    const availableStock =
      selectedVariation?.stock !== undefined && selectedVariation?.stock !== null
        ? selectedVariation.stock
        : (currentPharmacy?.stock ?? null);

    if (availableStock !== null && availableStock !== undefined && availableStock <= 0) {
      router.push("/checkout");
      return;
    }

    if (availableStock !== null && availableStock !== undefined) {
      const existingItem = items.find(
        (item) =>
          item.pharmacyProductId === product.pharmacyProductId &&
          (item.variationOptionId === selectedVariationOptionId ||
            item.variationOptionName === selectedVariation?.optionName),
      );

      if (existingItem && existingItem.quantity >= availableStock) {
        router.push("/checkout");
        return;
      }
    }

    addToCart({
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      price: product.price ?? "",
      image: product.image || "/placeholder.svg?height=400&width=400",
      slug: product.slug || null,
      pharmacyProductId: product.pharmacyProductId || null,
      pharmacyName: currentPharmacy?.name || null,
      stock: availableStock,
      variationOptionId: selectedVariationOptionId,
      variationOptionName: selectedVariation?.optionName ?? null,
      variationTypeName: selectedVariation?.typeName ?? null,
    });
    router.push("/checkout");
  };

  const dragStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const goToPrevImage = useCallback(() => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1,
    );
  }, [productImages.length]);

  const goToNextImage = useCallback(() => {
    setSelectedImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1,
    );
  }, [productImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartX.current === null) return;
    const diff = e.touches[0].clientX - dragStartX.current;
    if (Math.abs(diff) > 5) isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartX.current === null || productImages.length <= 1) return;
    const diff = e.changedTouches[0].clientX - dragStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff < 0) goToNextImage();
      else goToPrevImage();
    }
    dragStartX.current = null;
    isDragging.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const diff = e.clientX - dragStartX.current;
    if (Math.abs(diff) > 5) isDragging.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current === null || productImages.length <= 1) return;
    const diff = e.clientX - dragStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff < 0) goToNextImage();
      else goToPrevImage();
    }
    dragStartX.current = null;
    isDragging.current = false;
  };

  const handleRelatedProductClick = (relatedProduct: Product) => {
    router.push(getProductPath(relatedProduct));
    window.scrollTo(0, 0);
  };

  // Related products: same category, not the current product
  const relatedProducts = useMemo(() => {
    if (!product?.category) return [];
    return products.filter(
      (p) => p.category === product.category && p.id !== product.id,
    );
  }, [products, product]);

  if (productNotFound) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-xl sm:text-2xl font-semibold text-theme-primary mb-3">
          Produto não encontrado
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          O produto que você procura não está disponível ou o link pode estar
          incorreto.
        </p>
        <Button onClick={() => router.push("/")} className="btn-theme-primary">
          Voltar para a loja
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
        {/* Info: name, price, buttons (mobile order-1, desktop right column) */}
        <div className="order-1 lg:order-2 lg:col-span-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  router.push("/");
                  window.scrollTo(0, 0);
                }}
                className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-muted-foreground hover:text-theme-primary hover:bg-muted/60 transition-colors"
                aria-label="Voltar para a tela inicial"
                title="Voltar para a tela inicial"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <h1 className="text-xl sm:text-2xl font-semibold text-theme-primary">
                {product.name}
              </h1>
            </div>

            <div className="bg-[var(--bg-secondary)] p-3 sm:p-4 rounded-[14px] border border-border">
              <div className="price text-2xl sm:text-3xl">
                R$ {formatPriceBRL(product.price)}
              </div>
            </div>

            {variations.length > 0 && (
              <div className="p-3 sm:p-4 border border-border rounded-[14px] bg-card">
                <h3 className="text-xs sm:text-sm font-semibold text-theme-primary mb-2 sm:mb-3">
                  {variations[0].typeName}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {variations.map((v) => (
                    <button
                      key={v.optionId}
                      onClick={() => setSelectedVariationOptionId(v.optionId)}
                      className={`px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-all duration-150 ${
                        selectedVariationOptionId === v.optionId
                          ? "border-theme-accent bg-theme-accent text-white font-semibold"
                          : "border-border hover:border-theme-accent text-theme-primary"
                      }`}
                    >
                      {v.optionName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {otherPharmacies.length > 0 && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 border border-border rounded-[14px] bg-card">
                <h3 className="text-xs sm:text-sm font-semibold text-theme-primary mb-2 sm:mb-3">
                  Outras lojas com este produto:
                </h3>
                <div className="space-y-2">
                  {otherPharmacies.map((pharmacy) => (
                    <div
                      key={pharmacy.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 border border-border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() =>
                        handlePharmacyClick(pharmacy.pharmacyProductId)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-theme-primary break-words">
                          {pharmacy.name}
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="price text-base sm:text-lg">
                          R$ {pharmacy.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={handleBuyNow}
                className="btn-theme-primary px-6 sm:px-8 w-full sm:w-auto"
              >
                Comprar
              </Button>
              <Button
                onClick={handleAddToCart}
                className="btn-theme-secondary px-4 sm:px-6 w-full sm:w-auto"
              >
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>

        {/* Image carousel (mobile order-2, desktop left column) */}
        <div className="order-2 lg:order-1 lg:col-span-6">
          <div
            className="relative max-w-sm mx-auto lg:max-w-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              dragStartX.current = null;
              isDragging.current = false;
            }}
          >
            <ProductImageFrame
              src={productImages[selectedImageIndex] || "/placeholder.svg"}
              alt={product.name}
              variant="main"
              priority
              draggable={false}
              className="pointer-events-none"
            />
            {productImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/25 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/60 hover:scale-110 hover:shadow-md active:scale-95 transition-all duration-200"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.75]" />
                </button>
                <button
                  onClick={goToNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/25 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/60 hover:scale-110 hover:shadow-md active:scale-95 transition-all duration-200"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.75]" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 sm:mt-12">
        <div className="border-b mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-theme-accent pb-2 border-b-2 border-theme-accent inline-block">
            DESCRIÇÃO
          </h2>
        </div>
        <div className="max-w-none text-xs sm:text-sm text-muted-foreground space-y-2 sm:space-y-4 leading-relaxed">
          <p>{product.description || "Descrição não disponível."}</p>
        </div>
      </div>

      {/* Related Products (from API) */}
      <div className="mt-8 sm:mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-theme-primary">
            Produtos relacionados
          </h2>
          <a
            href="/"
            className="text-theme-secondary text-xs sm:text-sm hover:underline"
          >
            Ver todos
          </a>
        </div>

        {loadingProducts && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="card-static animate-pulse">
                <div className="w-full aspect-square bg-muted rounded mb-2 sm:mb-4" />
                <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        )}

        {!loadingProducts && productsError && (
          <p className="text-xs sm:text-sm text-red-600">
            Não foi possível carregar os produtos no momento.
          </p>
        )}

        {!loadingProducts && !productsError && relatedProducts.length === 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Nenhum produto relacionado encontrado.
          </p>
        )}

        {!loadingProducts && !productsError && relatedProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {relatedProducts.map((relatedProduct) => (
              <Card
                key={relatedProduct.id}
                onClick={() => handleRelatedProductClick(relatedProduct)}
                className="flex cursor-pointer flex-col"
              >
                <ProductImageFrame
                  src={
                    relatedProduct.image ||
                    "/placeholder.svg?height=200&width=200"
                  }
                  alt={relatedProduct.name}
                  variant="related"
                  frameClassName="mb-4 sm:mb-6 flex-shrink-0"
                />

                <h3 className="text-xs sm:text-sm font-medium text-theme-primary mb-0.5 sm:mb-1 line-clamp-2 flex-shrink-0">
                  {relatedProduct.name}
                </h3>

                <div className="space-y-1 flex-shrink-0">
                  <div className="price text-base sm:text-lg">
                    {relatedProduct.price
                      ? `R$ ${formatPriceBRL(relatedProduct.price)}`
                      : "—"}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
