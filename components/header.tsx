"use client";

import type React from "react";
import { Suspense } from "react";
import Image from "next/image";
import { ChevronDown, Home, Menu, Search, ShoppingCart, User, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { useUser } from "@/contexts/user-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

  // Categories (by name) that have at least one product in stock.
  // null = not loaded yet (or failed) -> fall back to showing all categories.
  const [inStockCategoryNames, setInStockCategoryNames] = useState<
    Set<string> | null
  >(null);

  const loadInStockCategoryNames = useCallback(async (signal: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/product`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      const names = new Set<string>();
      for (const p of data) {
        const category = (p as Record<string, unknown> | null)?.category;
        if (typeof category === "string" && category.trim()) {
          names.add(category.trim());
        }
      }
      setInStockCategoryNames(names);
    } catch {
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    loadInStockCategoryNames(ac.signal);
    return () => ac.abort();
  }, [loadInStockCategoryNames]);

  const visibleCategories = useMemo(() => {
    if (!inStockCategoryNames) return parentCategories;
    return parentCategories
      .map((parent) => ({
        ...parent,
        children: parent.children.filter(
          (child) =>
            inStockCategoryNames.has(child.id) ||
            inStockCategoryNames.has(child.name),
        ),
      }))
      .filter((parent) => parent.children.length > 0);
  }, [parentCategories, inStockCategoryNames]);

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

  const isHome = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(isHome);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  // On the home page every new visit (or filter change) starts at the top,
  // so the categories menu shows automatically. On every other page (product
  // details, checkout, orders, ...) it never appears on its own — only an
  // explicit click on the categories button opens it there.
  useEffect(() => {
    setIsMobileMenuOpen(pathname === "/");
  }, [routeKey, pathname]);

  // Scrolling back to the absolute top only reopens the menu on the home
  // page. On every page, once the menu is open (auto on home, manual
  // elsewhere), scrolling down past a small threshold closes it — and once
  // that closing starts, nothing reopens it again until the user is back at
  // the absolute top. There's no "reverse the close mid-flight" path: the
  // only way back to open is the top-of-page check above.
  //
  // The threshold is measured from where the page was when the menu opened
  // (openScrollY), not the raw scroll position — otherwise opening the menu
  // while already scrolled down would read as "already past the threshold"
  // and close it again on the very next scroll tick.
  //
  // This used to also need a grace-period timer to absorb scroll-position
  // "noise" from the nav's own open/close transition (its height change,
  // above the viewport, could trigger the browser's scroll anchoring to
  // nudge window.scrollY, which this listener would misread as the user
  // scrolling). That noise is now suppressed at the source via
  // `overflow-anchor: none` in globals.css, so no timer is needed here.
  const SCROLL_HIDE_THRESHOLD = 40;
  const openScrollY = useRef(0);
  const isOpenRef = useRef(isMobileMenuOpen);

  useEffect(() => {
    isOpenRef.current = isMobileMenuOpen;
    if (isMobileMenuOpen) {
      openScrollY.current = window.scrollY;
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (pathname === "/" && currentScrollY <= 0) {
        setIsMobileMenuOpen(true);
        return;
      }

      if (
        isOpenRef.current &&
        currentScrollY - openScrollY.current > SCROLL_HIDE_THRESHOLD
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // The categories nav's height is animated via a CSS grid-template-rows
  // 0fr/1fr transition, which requires the content wrapper to stay
  // `overflow-hidden` for the collapse/expand to be clipped correctly. But
  // once open and settled, a parent category's subcategory dropdown must be
  // allowed to overflow below the nav — so overflow only switches to
  // visible after the open transition has actually finished, and switches
  // back to hidden the instant a close starts (no need to wait for that
  // transition, since clipping while shrinking is exactly what we want).
  //
  // Initialized from isMobileMenuOpen (not always false): on first paint
  // the menu can already be open with no transition ever firing (e.g.
  // landing straight on the home page), and without this the dropdown
  // would stay clipped until the user manually closed and reopened it once.
  const [navSettledOpen, setNavSettledOpen] = useState(isMobileMenuOpen);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      setNavSettledOpen(false);
    }
  }, [isMobileMenuOpen]);

  const handleNavTransitionEnd = (e: React.TransitionEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "grid-template-rows") return;
    if (isOpenRef.current) {
      setNavSettledOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-theme-header text-[var(--text-primary)] shadow-sm">
      <div className="container mx-auto px-4 py-2 sm:py-3">
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

          <div className="hidden md:flex flex-1 items-center gap-2 max-w-md mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative flex-1">
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
            <Button
              type="button"
              variant="outline"
              className="flex-shrink-0 h-auto min-h-[42px] w-[42px] p-0 bg-[#ffffff] text-foreground"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              title="Categorias"
              aria-label="Categorias"
            >
              <Menu className="w-5 h-5" />
            </Button>
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
              className="text-[var(--text-primary)] hover:text-theme-smoke transition-colors duration-200 p-1 sm:p-2"
              onClick={handleLogoClick}
              title="Início"
              aria-label="Voltar para a página inicial"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden lg:inline text-sm ml-2">Início</span>
            </Button>
          </div>
        </div>

        <div className="md:hidden mt-2 flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative flex-1">
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
          <Button
            type="button"
            variant="outline"
            className="flex-shrink-0 h-auto min-h-[42px] w-[42px] p-0 bg-[#ffffff] text-foreground"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            title="Categorias"
            aria-label="Categorias"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Navigation - Categories from API. Stays inside the sticky header so it
          always appears attached to the search bar, regardless of scroll position.
          Uses a grid-template-rows 0fr/1fr transition (instead of display or an
          arbitrary max-height) so the show/hide is a genuinely smooth, correctly
          timed height animation rather than an instant cut. */}
      <nav
        onTransitionEnd={handleNavTransitionEnd}
        className={`grid bg-[var(--bg-secondary)] text-muted-foreground transition-[grid-template-rows] duration-[2000ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] [overflow-anchor:none] ${
          isMobileMenuOpen
            ? "grid-rows-[1fr] border-b border-border"
            : "grid-rows-[0fr] border-b-0"
        }`}
      >
        <div
          className={`min-h-0 transition-opacity duration-[2000ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
            navSettledOpen ? "overflow-visible" : "overflow-hidden"
          } ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
        >
          <div className="container mx-auto px-4">
            <div
              ref={categoryNavRef}
              className="grid grid-cols-2 gap-x-2 gap-y-1.5 py-2 md:flex md:flex-wrap md:justify-center md:gap-x-6 md:gap-y-2 md:py-3 lg:gap-x-8"
            >
              {loadingCategories ? (
                <span className="col-span-2 text-center text-xs text-muted-foreground/70 md:col-auto">
                  Carregando categorias...
                </span>
              ) : visibleCategories.length > 0 ? (
                visibleCategories.map((parent) => (
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
        </div>
      </nav>
    </header>
  );
};
