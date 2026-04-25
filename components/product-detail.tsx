"use client";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { extractProductImageUrls } from "@/lib/product-images";

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
  reference: string | null;
  name: string;
  description: string | null;
  price: string | null;
  category: string | null;
  image: string | null;
  additionalImages: string[];
  keywords?: string[];
};

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

export function ProductDetail() {
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

  const loadProductDetail = useCallback(async (pharmacyProductId: string) => {
    if (!pharmacyProductId) {
      console.log("loadProductDetail: No pharmacyProductId provided");
      return;
    }

    try {
      setLoadingProductDetail(true);
      const url = `${API_BASE_URL}/api/product/show/${pharmacyProductId}`;
      console.log("Loading product detail from:", url);

      const res = await fetch(url);

      if (res.status === 204) {
        console.log("Product not found (204)");
        setOtherPharmacies([]);
        setCurrentPharmacy(null);
        return;
      }

      if (!res.ok) {
        console.error("Error response:", res.status, res.statusText);
        setOtherPharmacies([]);
        setCurrentPharmacy(null);
        return;
      }

      const json = await res.json();
      console.log("Product detail API response:", json);
      const data = json.data || json;

      if (data) {
        if (data.pharmacy) {
          setCurrentPharmacy({
            name: data.pharmacy.name,
            stock: data.stock ?? null,
          });
        }

        if (Array.isArray(data.otherPharmacies)) {
          console.log("Found other pharmacies:", data.otherPharmacies.length);
          setOtherPharmacies(data.otherPharmacies);
        } else {
          console.log("No other pharmacies array found");
          setOtherPharmacies([]);
        }

        if (data.price) {
          setProduct((prev) => ({
            ...prev,
            price: data.price,
            pharmacyProductId: data.pharmacyProductId || pharmacyProductId,
          }));
        }

        if (
          data.images &&
          Array.isArray(data.images) &&
          data.images.length > 0
        ) {
          setProduct((prev) => ({
            ...prev,
            image: data.images[0],
            additionalImages: data.images.slice(1),
          }));
        }

        if (Array.isArray(data.variations) && data.variations.length > 0) {
          const parsed: Variation[] = data.variations.map((v: any) => ({
            typeName: String(v.typeName ?? ""),
            optionId: String(v.optionId ?? ""),
            optionName: String(v.optionName ?? ""),
            stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : null,
          }));
          setVariations(parsed);
          setSelectedVariationOptionId(parsed[0].optionId);
        } else {
          setVariations([]);
          setSelectedVariationOptionId(null);
        }
      }
    } catch (error) {
      console.error("Error loading product detail:", error);
      setOtherPharmacies([]);
      setCurrentPharmacy(null);
    } finally {
      setLoadingProductDetail(false);
    }
  }, []);

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
      localStorage.setItem(
        "selectedProduct",
        JSON.stringify({
          ...product,
          pharmacyProductId: pharmacyProductId,
        }),
      );
      router.push("/produto");
      window.location.reload();
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

  // Load product data from localStorage when component mounts and scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);

    const selectedProduct = localStorage.getItem("selectedProduct");
    if (selectedProduct) {
      try {
        const productData = JSON.parse(selectedProduct);
        console.log("Product data from localStorage:", productData);
        const productDataParsed: Product = {
          id: String(productData?.id ?? ""),
          pharmacyProductId: productData?.pharmacyProductId
            ? String(productData.pharmacyProductId)
            : null,
          reference: productData?.reference ?? null,
          name: String(productData?.name ?? "").trim(),
          description: productData?.description ?? null,
          price:
            productData?.price === null || productData?.price === undefined
              ? null
              : String(productData.price),
          category: productData?.category ?? null,
          image: productData?.image ?? null,
          additionalImages: Array.isArray(productData?.additionalImages)
            ? productData.additionalImages
            : [],
          keywords: Array.isArray(productData?.keywords)
            ? productData.keywords
            : [],
        };
        console.log(
          "Parsed product with pharmacyProductId:",
          productDataParsed.pharmacyProductId,
        );
        setProduct(productDataParsed);
        setSelectedImageIndex(0);

        if (productDataParsed.pharmacyProductId) {
          console.log(
            "Immediately loading product detail for:",
            productDataParsed.pharmacyProductId,
          );
          loadProductDetail(productDataParsed.pharmacyProductId);
        }
      } catch (error) {
        console.error("Error parsing product data:", error);
      }
    } else {
      console.log("No product found in localStorage");
    }
  }, [loadProductDetail]);

  // Load product details and other pharmacies when product has pharmacyProductId (backup)
  useEffect(() => {
    console.log(
      "Product pharmacyProductId changed:",
      product.pharmacyProductId,
    );
    if (product.pharmacyProductId && !loadingProductDetail) {
      console.log("Loading product detail for:", product.pharmacyProductId);
      loadProductDetail(product.pharmacyProductId);
    } else if (!product.pharmacyProductId) {
      console.log("No pharmacyProductId available, skipping load");
    }
  }, [product.pharmacyProductId]);

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
    localStorage.setItem("selectedProduct", JSON.stringify(relatedProduct));
    setProduct(relatedProduct);
    setSelectedImageIndex(0);
    router.push("/produto");
    window.scrollTo(0, 0);
  };

  // Related products: same category, not the current product
  const relatedProducts = useMemo(() => {
    if (!product?.category) return [];
    return products.filter(
      (p) => p.category === product.category && p.id !== product.id,
    );
  }, [products, product]);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
        {/* Thumbnails - Hidden on mobile, shown on desktop */}
        {productImages.length > 1 && (
          <div className="hidden lg:block lg:col-span-2">
            <div className="space-y-2">
              {productImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className={`border rounded p-2 cursor-pointer transition-all aspect-square bg-muted overflow-hidden ${
                    selectedImageIndex === index
                      ? "border-theme-accent ring-2 ring-theme-accent"
                      : "border-border hover:border-theme-accent"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={`Product thumbnail ${index + 1}`}
                    width={60}
                    height={60}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thumbnails - Horizontal scroll on mobile */}
        {productImages.length > 1 && (
          <div className="lg:hidden mb-4">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {productImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className={`border rounded p-1 cursor-pointer transition-all flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-muted overflow-hidden ${
                    selectedImageIndex === index
                      ? "border-theme-accent ring-2 ring-theme-accent"
                      : "border-border hover:border-theme-accent"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={`Product thumbnail ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Image */}
        <div
          className={
            productImages.length > 1 ? "lg:col-span-5" : "lg:col-span-7"
          }
        >
          <div
            className="relative aspect-square bg-muted rounded overflow-hidden max-w-sm mx-auto lg:max-w-none select-none"
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
            <Image
              src={productImages[selectedImageIndex] || "/placeholder.svg"}
              alt={product.name}
              width={400}
              height={400}
              className="w-full h-full object-contain p-2 sm:p-4 pointer-events-none"
              draggable={false}
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
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {productImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      aria-label={`Ir para imagem ${i + 1}`}
                      className={`rounded-full transition-all duration-200 ${
                        i === selectedImageIndex
                          ? "w-4 h-2 bg-gray-700"
                          : "w-2 h-2 bg-gray-400/70 hover:bg-gray-500"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-5">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
              <span>Voltar</span>
              <span>|</span>
              <span className="text-theme-secondary">{product.category}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-theme-primary">
              {product.name}
            </h1>

            <div className="bg-[var(--bg-secondary)] p-3 sm:p-4 rounded-[14px] border border-border">
              <div className="price text-2xl sm:text-3xl">
                R{"$ "}
                {typeof product.price === "string"
                  ? product.price.replace(".", ",")
                  : product.price}
              </div>
              {currentPharmacy && (
                <div className="text-xs sm:text-sm text-muted-foreground mt-2">
                  {currentPharmacy.name}
                </div>
              )}
            </div>

            {variations.length > 1 && (
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
              <Card key={relatedProduct.id} className="flex flex-col">
                <div className="relative mb-2 sm:mb-4 flex-shrink-0 aspect-square bg-muted rounded overflow-hidden">
                  <Image
                    src={
                      relatedProduct.image ||
                      "/placeholder.svg?height=200&width=200"
                    }
                    alt={relatedProduct.name}
                    width={150}
                    height={150}
                    className="w-full h-full object-contain p-1 sm:p-2"
                  />
                </div>

                <h3 className="text-xs sm:text-sm font-medium text-theme-primary mb-2 line-clamp-2 min-h-[2.5rem] flex-shrink-0">
                  {relatedProduct.name}
                </h3>

                <div className="space-y-1 flex-shrink-0">
                  <div className="price text-base sm:text-lg">
                    {relatedProduct.price ? `R$ ${relatedProduct.price}` : "—"}
                  </div>
                </div>

                <div className="flex space-x-1 sm:space-x-2 mt-3">
                  <Button
                    onClick={() => handleRelatedProductClick(relatedProduct)}
                    className="flex-1 btn-theme-primary text-xs sm:text-sm py-1 sm:py-2"
                  >
                    DETALHES
                  </Button>
                  <Button
                    onClick={() =>
                      addToCart({
                        id: `${relatedProduct.id}-${Date.now()}`,
                        name: relatedProduct.name,
                        price: relatedProduct.price ?? "",
                        image:
                          relatedProduct.image ||
                          "/placeholder.svg?height=200&width=200",
                        pharmacyProductId:
                          relatedProduct.pharmacyProductId || null,
                      })
                    }
                    className="btn-theme-secondary text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                    title="Adicionar ao carrinho"
                  >
                    +
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
