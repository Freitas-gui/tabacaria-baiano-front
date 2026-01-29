"use client";

import type React from "react";
import { Suspense } from "react";
import { Search, ShoppingCart, User, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { useUser } from "@/contexts/user-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";

// Type definitions for category data
interface Category {
  id: string;
  name: string;
  image: string | null;
}

export function Header() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 bg-theme-header text-white shadow-md">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                <span>Click</span>
                <div className="text-sm font-normal">Farma</div>
              </div>
              <div className="text-sm">Carregando...</div>
            </div>
          </div>
        </header>
      }
    >
      <HeaderContent />
    </Suspense>
  );
}

const HeaderContent = () => {
  const { getTotalItems } = useCart();
  const { user, logout } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("Header - User state:", user);
  }, [user]);

  // Separate input value from search query to prevent premature clearing
  const [inputValue, setInputValue] = useState<string>("");
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(
    null
  );
  const isInitialLoad = useRef(true);

  // Categories from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const loadCategories = useCallback(async (signal: AbortSignal) => {
    try {
      setLoadingCategories(true);
      setCategoriesError(null);
      const res = await fetch(`${API_BASE_URL}/api/category`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Ensure json.data is treated as an array of Category objects
      const data = Array.isArray(json?.data) ? json.data : [];

      // Explicitly define the type for the items in data
      const normalized = data
        .map((c: { id: any; name: any; image: any }) => ({
          id: String(c?.id ?? ""),
          name: String(c?.name ?? "").trim(),
          image: typeof c?.image === "string" ? c.image : null,
        }))
        .filter((c: Category) => c.id && c.name);

      setCategories(normalized);
    } catch {
      setCategoriesError(
        "Não foi possível carregar as categorias. Tente novamente."
      );
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    loadCategories(ac.signal);
    return () => ac.abort();
  }, [loadCategories]);

  // Initialize search input from URL params only on initial load
  useEffect(() => {
    if (isInitialLoad.current) {
      const query = searchParams.get("search");
      const category = searchParams.get("category");

      if (query) {
        setInputValue(query);
        setActiveSearchQuery(query);
      } else {
        setInputValue("");
        setActiveSearchQuery(null);
      }

      // Clear category selection when there's a search query
      if (query && category) {
        setActiveSearchQuery(query);
      }

      isInitialLoad.current = false;
    } else {
      const query = searchParams.get("search");
      const category = searchParams.get("category");

      if (!query && activeSearchQuery) {
        setActiveSearchQuery(null);
        if (category || (!query && !category)) {
          setInputValue("");
        }
      } else if (query && query !== activeSearchQuery) {
        setInputValue(query);
        setActiveSearchQuery(query);
      }
    }
  }, [searchParams, activeSearchQuery]);

  const handleCategoryClick = (categoryName: string) => {
    setInputValue("");
    setActiveSearchQuery(null);
    router.push(`/?category=${encodeURIComponent(categoryName)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = inputValue.trim();

    if (trimmedQuery) {
      setActiveSearchQuery(trimmedQuery);
      router.push(`/?search=${encodeURIComponent(trimmedQuery)}`);
    } else {
      setActiveSearchQuery(null);
      router.push("/");
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const clearSearch = () => {
    setInputValue("");
    setActiveSearchQuery(null);
    router.push("/");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };

  const handleLogoClick = () => {
    setInputValue("");
    setActiveSearchQuery(null);
    router.push("/");
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-theme-header text-white shadow-md">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center flex-shrink-0">
            <div
              className="text-xl sm:text-2xl font-bold cursor-pointer"
              onClick={handleLogoClick}
            >
              <span className="text-white">Click</span>
              <div className="text-xs sm:text-sm font-normal">Farma</div>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Digite aqui o que busca"
                className="pl-10 pr-10 bg-white text-gray-900 border-0"
                value={inputValue}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
              {inputValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  onClick={clearSearch}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </form>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:text-blue-100 transition-colors duration-200 p-1 sm:p-2"
              onClick={() => router.push("/pedidos")}
              title="Pedidos"
            >
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden lg:inline text-sm ml-2">Pedidos</span>
            </Button>
            {user ? (
              <div className="relative group">
                <Button
                  variant="ghost"
                  className="text-white hover:text-blue-100 transition-colors duration-200 p-1 sm:p-2"
                >
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="hidden lg:inline text-sm ml-2 max-w-[120px] truncate">{user.name?.split(' ')[0] || user.email?.split('@')[0] || "Usuário"}</span>
                </Button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-white hover:text-blue-100 transition-colors duration-200 p-1 sm:p-2"
                onClick={() => router.push("/login")}
                title="Login"
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden lg:inline text-sm ml-2">Login</span>
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-white hover:text-blue-100 relative cursor-pointer transition-colors duration-200 p-1 sm:p-2"
              onClick={() => router.push("/checkout")}
              title="Carrinho"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute -top-1 -right-1 bg-theme-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {getTotalItems()}
              </span>
            </Button>
            <Button
              variant="ghost"
              className="md:hidden text-white hover:text-blue-100 p-1 sm:p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
          </div>
        </div>

        <div className="md:hidden mt-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Digite aqui o que busca"
              className="pl-10 pr-10 bg-white text-gray-900 border-0 w-full"
              value={inputValue}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
            />
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                onClick={clearSearch}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* Navigation - Categories from API */}
      <nav className={`bg-white text-gray-700 border-b ${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 lg:gap-8 py-2 sm:py-3">
            {loadingCategories ? (
              <span className="text-xs sm:text-sm text-gray-400">
                Carregando categorias...
              </span>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    handleCategoryClick(category.name);
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xs sm:text-sm cursor-pointer transition-colors duration-200 hover:text-theme-secondary px-2 py-1"
                >
                  {category.name}
                </button>
              ))
            ) : (
              <span className="text-xs sm:text-sm text-gray-400"></span>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
