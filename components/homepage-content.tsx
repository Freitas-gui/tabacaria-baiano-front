"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { API_BASE_URL } from "@/lib/api";
import { extractProductImageUrls } from "@/lib/product-images";
import type { CategoryParent } from "@/lib/categories";
import {
  findLeafByParam,
  normalizeCategoryParents,
  pickCardImage,
  productMatchesAnyChild,
  productMatchesLeaf,
} from "@/lib/categories";

type ProductVariation = {
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
  description?: string | null;
  price: string | null;
  category: string | null;
  image: string | null;
  additionalImages: string[];
  keywords: string[];
  stock?: number | null;
  variations: ProductVariation[];
};

function formatPriceBRL(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const n =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (Number.isNaN(n)) return String(value);
  return n.toFixed(2).replace(".", ","); // ex: 15.5 -> "15,50"
}

export function HomepageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const [parentCategories, setParentCategories] = useState<CategoryParent[]>(
    [],
  );
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const loadCategories = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoadingCategories(true);
      setCategoriesError(null);
      const res = await fetch(`${API_BASE_URL}/api/category`, {
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      setParentCategories(normalizeCategoryParents(data));
    } catch {

    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    loadCategories(ac.signal);
    return () => ac.abort();
  }, [loadCategories]);

  // --------- >>> NEW: Produtos do API ---------
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
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

          return {
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
            stock: p?.stock !== undefined && p?.stock !== null ? Number(p.stock) : null,
            variations: Array.isArray(p?.variations)
              ? p.variations.map((v: any) => ({
                  typeName: String(v.typeName ?? ""),
                  optionId: String(v.optionId ?? ""),
                  optionName: String(v.optionName ?? ""),
                  stock: v?.stock !== undefined && v?.stock !== null ? Number(v.stock) : null,
                }))
              : [],
          } as Product;
        })
        .filter((p: Product) => {
          if (!p.id || !p.name) return false;

          if (p.variations.length > 0) {
            const variationsWithStock = p.variations.filter(
              (v) => v.stock !== null && v.stock !== undefined,
            );
            if (variationsWithStock.length > 0) {
              return variationsWithStock.some((v) => (v.stock as number) > 0);
            }
          }

          if (p.stock !== null && p.stock !== undefined) {
            return p.stock > 0;
          }

          return true;
        });

      setProducts(normalized);
    } catch (e: any) {
      console.error("Error loading products:", e);
      // setProductsError(
      //   "Não foi possível carregar os produtos. Tente novamente."
      // );
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    loadProducts(ac.signal);
    return () => ac.abort();
  }, [loadProducts]);

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const parentFromUrl = searchParams.get("parent");
    const searchFromUrl = searchParams.get("search");
    setSearchQuery(searchFromUrl);
    setSelectedCategory(categoryFromUrl);
    setSelectedParentId(parentFromUrl);
  }, [searchParams]);

  const highlightedParentId = useMemo(() => {
    if (selectedParentId) return selectedParentId;
    if (!selectedCategory) return null;
    const leaf = findLeafByParam(parentCategories, selectedCategory);
    return leaf?.parentId ?? null;
  }, [selectedParentId, selectedCategory, parentCategories]);

  const filterLabel = useMemo(() => {
    if (searchQuery) return null;
    if (selectedParentId) {
      const p = parentCategories.find((x) => x.id === selectedParentId);
      return p?.name ?? null;
    }
    if (selectedCategory) {
      const leaf = findLeafByParam(parentCategories, selectedCategory);
      return leaf?.name ?? selectedCategory;
    }
    return null;
  }, [
    searchQuery,
    selectedParentId,
    selectedCategory,
    parentCategories,
  ]);

  const filteredProducts = useMemo(() => {
    const source = products;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return source.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(q);
        const categoryMatch = (product.category ?? "")
          .toLowerCase()
          .includes(q);
        const keywordMatch = (product.keywords ?? []).some((k) =>
          String(k).toLowerCase().includes(q),
        );
        return nameMatch || categoryMatch || keywordMatch;
      });
    }

    if (selectedParentId) {
      const parent = parentCategories.find((p) => p.id === selectedParentId);
      if (!parent) return source;
      return source.filter((p) =>
        productMatchesAnyChild(p.category, parent.children),
      );
    }

    if (selectedCategory) {
      const leaf = findLeafByParam(parentCategories, selectedCategory);
      if (leaf) {
        return source.filter((p) => productMatchesLeaf(p.category, leaf));
      }
      return source.filter((p) => p.category === selectedCategory);
    }

    return source;
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedParentId,
    parentCategories,
  ]);

  const handleParentCardClick = (parentId: string) => {
    if (selectedParentId === parentId && !selectedCategory) {
      router.push("/");
      return;
    }
    router.push(`/?parent=${encodeURIComponent(parentId)}`);
  };

  const handleShowAllProducts = () => {
    router.push("/");
  };

  const handleProductClick = (product: Product) => {
    localStorage.setItem("selectedProduct", JSON.stringify(product));
    router.push("/produto");
  };

  const getDisplayTitle = () =>
    searchQuery
      ? `Resultados da busca: "${searchQuery}" (${filteredProducts.length} produtos encontrados)`
      : filterLabel
        ? `Produtos: ${filterLabel} (${filteredProducts.length} produtos)`
        : `Produtos: Todos (${filteredProducts.length} produtos)`;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Search Results Header */}
      {searchQuery && (
        <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-[var(--bg-secondary)] border border-border rounded-[14px]">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-theme-secondary flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold text-theme-primary break-words">
              Resultados para: "{searchQuery}"
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-theme-secondary mt-1">
            {filteredProducts.length} produto
            {filteredProducts.length !== 1 ? "s" : ""} encontrado
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Categories - Hide when searching */}
      {!searchQuery && (
        <div className="hidden sm:mb-12 sm:block">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-theme-primary">
              Categorias:
            </h2>

            {categoriesError && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-red-600">
                  {categoriesError}
                </span>
                <Button
                  variant="outline"
                  onClick={() => loadCategories()}
                  className="text-theme-secondary text-xs sm:text-sm"
                >
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card
                  key={i}
                  className="card-static min-h-[140px] animate-pulse p-4"
                >
                  <div className="mx-auto mb-2 h-[90px] w-[90px] rounded bg-muted" />
                  <div className="mx-auto h-3 w-3/4 rounded bg-muted" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6 primary">
              {parentCategories.map((parent) => (
                <Card
                  key={parent.id}
                  className={`text-center category-hover flex min-h-[140px] cursor-pointer flex-col justify-between p-4 ${
                    highlightedParentId === parent.id
                      ? "ring-2 ring-theme-accent bg-muted/40"
                      : ""
                  }`}
                  onClick={() => handleParentCardClick(parent.id)}
                >
                  <div className="mb-2 flex-shrink-0">
                    <Image
                      src={pickCardImage(parent)}
                      alt={parent.name}
                      width={90}
                      height={90}
                      className="mx-auto h-[90px] w-[90px] object-contain"
                    />
                  </div>
                  <h3
                    className={`text-xs font-medium leading-tight ${
                      highlightedParentId === parent.id
                        ? "text-theme-accent"
                        : "text-foreground"
                    }`}
                  >
                    {parent.name}
                  </h3>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-theme-primary break-words">
            {getDisplayTitle()}
          </h2>
          {(selectedCategory || selectedParentId || searchQuery) && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedParentId(null);
                setSearchQuery(null);
                router.push("/");
              }}
              className="text-theme-secondary border-theme-accent hover:bg-theme-smokeSoft/20 bg-transparent text-xs sm:text-sm w-full sm:w-auto"
            >
              Ver todos
            </Button>
          )}
        </div>

        <style jsx global>{`
          .category-hover img {
            filter: brightness(1.08) contrast(1.05);
          }
        `}</style>

        {productsError && (
          <div className="mb-6 text-sm text-red-600">
            {productsError}
            <Button
              variant="outline"
              onClick={() => loadProducts()}
              className="ml-3"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-6 [&>*]:min-w-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="card-static min-w-0 animate-pulse overflow-hidden p-2 sm:p-4">
                <div className="w-full aspect-square bg-muted mb-2 sm:mb-4 rounded" />
                <div className="h-3 sm:h-4 w-3/4 bg-muted mb-2 sm:mb-3" />
                <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4">
                  <div className="h-2 sm:h-3 w-1/3 bg-muted" />
                  <div className="h-4 sm:h-5 w-1/2 bg-muted" />
                </div>
                <div className="flex min-w-0 gap-1 sm:gap-2">
                  <div className="h-8 min-w-0 flex-1 bg-muted sm:h-9" />
                  <div className="h-8 w-9 shrink-0 bg-muted sm:h-9 sm:w-10" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-6 [&>*]:min-w-0">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="flex min-w-0 flex-col overflow-hidden p-2 sm:p-4"
              >
                <div className="relative mb-2 aspect-square flex-shrink-0 overflow-hidden rounded-md bg-muted sm:mb-4">
                  <Image
                    src={product.image || "/images/products/"}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain p-1 sm:p-2"
                  />
                </div>

                <h3 className="text-xs sm:text-sm font-medium text-theme-primary mb-2 sm:mb-3 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] flex-shrink-0">
                  {product.name}
                </h3>

                <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4 flex-shrink-0">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    A partir de
                  </div>
                  <div className="price text-lg sm:text-xl">
                    {product.price
                      ? `R$ ${formatPriceBRL(product.price)}`
                      : "Preço indisponível"}
                  </div>
                  {product.variations.length > 0 && (() => {
                    const availableVariation =
                      product.variations.find(
                        (v) => v.stock === null || v.stock === undefined || v.stock > 0,
                      ) ?? product.variations[0];
                    return (
                      <span className="inline-block px-2 py-0.5 text-[10px] sm:text-xs rounded-full border border-border bg-muted text-theme-primary">
                        {availableVariation.typeName}:{" "}
                        {availableVariation.optionName}
                      </span>
                    );
                  })()}
                </div>

                <div className="mt-auto flex min-w-0 w-full gap-1 sm:gap-2">
                  <Button
                    onClick={() => handleProductClick(product)}
                    className="h-9 min-w-0 flex-1 truncate px-1.5 text-[10px] btn-theme-primary button-hover sm:h-10 sm:px-3 sm:text-sm"
                  >
                    DETALHES
                  </Button>
                  <Button
                    onClick={() => {
                      const availableVariation =
                        product.variations.find(
                          (v) => v.stock === null || v.stock === undefined || v.stock > 0,
                        ) ?? product.variations[0] ?? null;
                      const variantStock =
                        availableVariation?.stock !== undefined && availableVariation?.stock !== null
                          ? availableVariation.stock
                          : (product.stock ?? null);
                      addToCart({
                        id: `${product.id}-${Date.now()}`,
                        name: product.name,
                        price: product.price ?? "0",
                        image: product.image ?? "/images/products/",
                        pharmacyProductId: product.pharmacyProductId || null,
                        stock: variantStock,
                        variationOptionId: availableVariation?.optionId ?? null,
                        variationOptionName: availableVariation?.optionName ?? null,
                        variationTypeName: availableVariation?.typeName ?? null,
                      });
                    }}
                    className="h-9 w-9 shrink-0 p-0 btn-theme-secondary button-hover text-sm sm:h-10 sm:w-10 sm:text-base sm:py-2"
                    title="Adicionar ao carrinho"
                  >
                    +
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 px-4">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-theme-primary mb-2">
              {searchQuery
                ? `Nenhum produto encontrado para "${searchQuery}"`
                : "Nenhum produto encontrado"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              {searchQuery
                ? "Tente buscar por outros termos ou navegue pelas categorias"
                : "Tente ajustar os filtros ou navegue pelas categorias"}
            </p>
            {searchQuery && (
              <Button
                onClick={handleShowAllProducts}
                className="btn-theme-primary text-sm sm:text-base"
              >
                Ver todos os produtos
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
