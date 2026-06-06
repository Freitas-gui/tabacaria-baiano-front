"use client";

import type React from "react";
import { Suspense } from "react";
import Image from "next/image";
import { ChevronDown, Search, ShoppingCart, User, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { useUser } from "@/contexts/user-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import type { CategoryParent } from "@/lib/categories";
import { normalizeCategoryParents } from "@/lib/categories";

export function Header() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 bg-theme-header text-[var(--text-primary)] shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Image
                src="/logo-princial.png"
                alt="Tabacaria do Baiano"
                width={80}
                height={80}
                className="h-16 w-16 sm:h-20 sm:w-20"
                priority
              />
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homeQueryKey = pathname === "/" ? searchParams.toString() : "";

  // Separate input value from search query to prevent premature clearing
  const [inputValue, setInputValue] = useState<string>("");
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(
    null,
  );
  const isInitialLoad = useRef(true);

  const [parentCategories, setParentCategories] = useState<CategoryParent[]>(
    [],
  );
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [openNavParentId, setOpenNavParentId] = useState<string | null>(null);
  const categoryNavRef = useRef<HTMLDivElement>(null);

  const loadCategories = useCallback(async (signal: AbortSignal) => {
    try {
      setLoadingCategories(true);
      setCategoriesError(null);
      const res = await fetch(`${API_BASE_URL}/api/category`, { signal });
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
    if (!openNavParentId) return;
    const close = (e: MouseEvent) => {
      if (
        categoryNavRef.current &&
        !categoryNavRef.current.contains(e.target as Node)
      ) {
        setOpenNavParentId(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openNavParentId]);

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

  const handleSubcategoryNav = (childId: string) => {
    setInputValue("");
    setActiveSearchQuery(null);
    setOpenNavParentId(null);
    router.push(`/?category=${encodeURIComponent(childId)}`);
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

  useEffect(() => {
    if (pathname !== "/") {
      setIsMobileMenuOpen(false);
      return;
    }
    setIsMobileMenuOpen(true);
  }, [pathname, homeQueryKey]);

  return (
    <header className="sticky top-0 z-50 bg-theme-header text-[var(--text-primary)] shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center flex-shrink-0">
            <button
              type="button"
              className="cursor-pointer"
              onClick={handleLogoClick}
            >
              <Image
                src="/logo-princial.png"
                alt="Tabacaria do Baiano"
                width={80}
                height={80}
                className="h-16 w-16 sm:h-20 sm:w-20"
                priority
              />
            </button>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Digite aqui o que busca"
                className="search pl-10 pr-10 h-auto min-h-[42px] bg-[#ffffff] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:ring-0 focus-visible:ring-offset-0"
                value={inputValue}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
              {inputValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
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
              className="text-[var(--text-primary)] hover:text-theme-smoke transition-colors duration-200 p-1 sm:p-2"
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
                  className="text-[var(--text-primary)] hover:text-theme-smoke transition-colors duration-200 p-1 sm:p-2"
                >
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="hidden lg:inline text-sm ml-2 max-w-[120px] truncate">
                    {user.name?.split(" ")[0] ||
                      user.email?.split("@")[0] ||
                      "Usuário"}
                  </span>
                </Button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-card text-card-foreground border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    type="button"
                    onClick={() => router.push("/conta")}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted rounded-t-md"
                  >
                    Minha conta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted rounded-b-md"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-[var(--text-primary)] hover:text-theme-smoke transition-colors duration-200 p-1 sm:p-2"
                onClick={() => router.push("/login")}
                title="Login"
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden lg:inline text-sm ml-2">Login</span>
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-[var(--text-primary)] hover:text-theme-smoke relative cursor-pointer transition-colors duration-200 p-1 sm:p-2"
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
              className="md:hidden text-[var(--text-primary)] hover:text-theme-smoke p-1 sm:p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        <div className="md:hidden mt-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Digite aqui o que busca"
              className="search pl-10 pr-10 h-auto min-h-[42px] w-full bg-[#ffffff] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:ring-0 focus-visible:ring-offset-0"
              value={inputValue}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
            />
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                onClick={clearSearch}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* Navigation - Categories from API */}
      <nav
        className={`bg-[var(--bg-secondary)] text-muted-foreground border-b border-border ${isMobileMenuOpen ? "block" : "hidden"} md:block`}
      >
        <div className="container mx-auto px-2 sm:px-4">
          <div
            ref={categoryNavRef}
            className="grid grid-cols-2 gap-x-2 gap-y-1.5 py-2 md:flex md:flex-wrap md:justify-center md:gap-x-6 md:gap-y-2 md:py-3 lg:gap-x-8"
          >
            {loadingCategories ? (
              <span className="col-span-2 text-center text-xs text-muted-foreground/70 md:col-auto">
                Carregando categorias...
              </span>
            ) : parentCategories.length > 0 ? (
              parentCategories.map((parent) => (
                <div
                  key={parent.id}
                  className="relative min-w-0 md:w-auto"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (parent.children.length === 0) return;
                      setOpenNavParentId((prev) =>
                        prev === parent.id ? null : parent.id,
                      );
                    }}
                    className="category-item flex min-h-[2.75rem] w-full min-w-0 cursor-pointer items-center justify-between gap-1 rounded-md px-2 py-2 text-left text-xs hover:bg-muted/60 md:inline-flex md:h-auto md:min-h-0 md:w-auto md:justify-center md:py-1 md:text-sm"
                    aria-expanded={openNavParentId === parent.id}
                  >
                    <span className="min-w-0 flex-1 leading-snug">
                      {parent.name}
                    </span>
                    {parent.children.length > 0 ? (
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 transition-transform md:h-4 md:w-4 ${openNavParentId === parent.id ? "rotate-180" : ""}`}
                      />
                    ) : null}
                  </button>
                  {openNavParentId === parent.id && parent.children.length > 0 ? (
                    <div
                      className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-[min(50vh,280px)] overflow-y-auto rounded-md border border-border bg-card py-1 text-card-foreground shadow-lg md:left-0 md:right-auto md:min-w-[200px] md:max-w-[min(100vw-2rem,320px)]"
                      role="menu"
                    >
                      {parent.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          role="menuitem"
                          className="block w-full cursor-pointer px-3 py-2 text-left text-xs hover:bg-muted sm:text-sm"
                          onClick={() => {
                            handleSubcategoryNav(child.id);
                          }}
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : categoriesError ? (
              <span className="col-span-2 text-center text-xs text-destructive sm:text-sm md:col-auto">
                {categoriesError}
              </span>
            ) : (
              <span className="col-span-2 md:col-auto" />
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
