"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { API_BASE_URL } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  image?: string | null;
};

// >>> Product normalizado para o front
type Product = {
  id: string;
  pharmacyProductId?: string | null;
  reference: string | null;
  name: string;
  description?: string | null;
  price: string | null; // manter string para compatibilidade com o carrinho
  category: string | null;
  image: string | null; // principal (1ª imagem)
  additionalImages: string[]; // demais imagens
  keywords: string[];
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
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  // --------- Categorias (como você já fez) ---------
  const [categories, setCategories] = useState<Category[]>([]);
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
      const normalized: Category[] = data
        .map((c: any) => ({
          id: String(c?.id ?? ""),
          name: String(c?.name ?? "").trim(),
          image: typeof c?.image === "string" ? c.image : null,
        }))
        .filter((c: Category) => c.id && c.name);
      setCategories(normalized);
    } catch (e: any) {
      console.error("Error loading categories:", e);
      // setCategoriesError("Não foi possível carregar as categorias. Tente novamente.");
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
          // A API tem "iamage" (typo) e pode ter "image". Vamos suportar ambos.
          const rawImages =
            (Array.isArray(p?.image) && p.image) ||
            (Array.isArray(p?.iamage) && p.iamage) ||
            [];

          // Aceita string[] ou [{url: "..."}]
          const imgs: string[] = rawImages
            .map((it: any) =>
              typeof it === "string"
                ? it
                : typeof it?.url === "string"
                ? it.url
                : null
            )
            .filter(Boolean);

          return {
            id: String(p?.id ?? ""),
            pharmacyProductId: p?.pharmacyProductId ? String(p.pharmacyProductId) : null,
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
        })
        .filter((p: Product) => p.id && p.name);

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

  // --------- Leitura de querystring ----------
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("search");
    setSearchQuery(searchFromUrl);
    setSelectedCategory(categoryFromUrl);
  }, [searchParams]);

  // --------- >>> Trocar allProducts -> products ----------
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
          String(k).toLowerCase().includes(q)
        );
        return nameMatch || categoryMatch || keywordMatch;
      });
    } else if (selectedCategory) {
      return source.filter((p) => p.category === selectedCategory);
    }
    return source;
  }, [products, searchQuery, selectedCategory]);

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      router.push("/");
    } else {
      router.push(`/?category=${encodeURIComponent(categoryName)}`);
    }
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
      : selectedCategory
      ? `Produtos: ${selectedCategory} (${filteredProducts.length} produtos)`
      : `Produtos: Todos (${filteredProducts.length} produtos)`;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Search Results Header */}
      {searchQuery && (
        <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-theme-primary border rounded-lg">
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
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-theme-primary">
              Categorias:
            </h2>

            {categoriesError && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-red-600">{categoriesError}</span>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Card
                  key={i}
                  className="p-2 sm:p-3 min-h-[120px] sm:min-h-[140px] animate-pulse border border-gray-200"
                >
                  <div className="h-[70px] sm:h-[90px] w-[70px] sm:w-[90px] mx-auto bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-3/4 mx-auto bg-gray-200 rounded" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 primary">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className={`p-2 sm:p-3 text-center card-hover category-hover transition-all cursor-pointer min-h-[120px] sm:min-h-[140px] flex flex-col justify-between border border-gray-200 ${
                    selectedCategory === category.name
                      ? "ring-2 ring-blue-500 bg-theme-primary"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <div className="mb-2 flex-shrink-0">
                    <Image
                      src={
                        category.image && category.image.length > 0
                          ? category.image
                          : "/images/products/"
                      }
                      alt={category.name}
                      width={90}
                      height={90}
                      className="mx-auto object-contain w-[60px] h-[60px] sm:w-[90px] sm:h-[90px]"
                    />
                  </div>
                  <h3
                    className={`text-xs font-medium leading-tight ${
                      selectedCategory === category.name
                        ? "text-theme-primary"
                        : "text-gray-700"
                    }`}
                  >
                    {category.name}
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
          {(selectedCategory || searchQuery) && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery(null);
                router.push("/");
              }}
              className="text-theme-secondary border-blue-500 hover:bg-theme-primary bg-transparent text-xs sm:text-sm w-full sm:w-auto"
            >
              Ver todos
            </Button>
          )}
        </div>

        <style jsx global>{`
          /* Make only category images primary color */
          .category-hover img {
            filter: invert(24%) sepia(82%) saturate(356%) hue-rotate(178deg)
              brightness(95%) contrast(90%);
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card
                key={i}
                className="p-2 sm:p-4 border border-gray-200 animate-pulse"
              >
                <div className="w-full aspect-square bg-gray-200 mb-2 sm:mb-4 rounded" />
                <div className="h-3 sm:h-4 w-3/4 bg-gray-200 mb-2 sm:mb-3" />
                <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4">
                  <div className="h-2 sm:h-3 w-1/3 bg-gray-200" />
                  <div className="h-4 sm:h-5 w-1/2 bg-gray-200" />
                </div>
                <div className="flex space-x-1 sm:space-x-2">
                  <div className="h-7 sm:h-9 flex-1 bg-gray-200" />
                  <div className="h-7 sm:h-9 w-8 sm:w-10 bg-gray-200" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="p-2 sm:p-4 card-hover transition-shadow border border-gray-200 flex flex-col"
              >
                <div className="relative mb-2 sm:mb-4 flex-shrink-0 aspect-square bg-gray-50 rounded overflow-hidden">
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
                  <div className="text-xs sm:text-sm text-gray-600">A partir de</div>
                  <div className="text-base sm:text-xl font-bold text-theme-primary">
                    {product.price
                      ? `R$ ${formatPriceBRL(product.price)}`
                      : "Preço indisponível"}
                  </div>
                </div>

                <div className="flex space-x-1 sm:space-x-2 mt-auto">
                  <Button
                    onClick={() => handleProductClick(product)}
                    className="flex-1 btn-theme-primary button-hover text-xs sm:text-sm py-1 sm:py-2"
                  >
                    DETALHES
                  </Button>
                  <Button
                    onClick={() =>
                      addToCart({
                        id: `${product.id}-${Date.now()}`,
                        name: product.name,
                        price: product.price ?? "0",
                        image: product.image ?? "/images/products/",
                        pharmacyProductId: product.pharmacyProductId || null,
                      })
                    }
                    className="btn-theme-secondary button-hover text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
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
            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-theme-primary mb-2">
              {searchQuery
                ? `Nenhum produto encontrado para "${searchQuery}"`
                : "Nenhum produto encontrado"}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
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
