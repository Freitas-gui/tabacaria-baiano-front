"use client";

import type React from "react";

import { Search, ShoppingCart, User, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export function HeaderContent() {
  const { getTotalItems } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Separate input value from search query to prevent premature clearing
  const [inputValue, setInputValue] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(
    null,
  );
  const isInitialLoad = useRef(true);

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
        // If both exist, prioritize search
        setActiveSearchQuery(query);
      }

      isInitialLoad.current = false;
    } else {
      // On subsequent URL changes, only update if there's no active typing
      const query = searchParams.get("search");
      const category = searchParams.get("category");

      // Only update search state if URL changed to no search (e.g., category selected or cleared)
      if (!query && activeSearchQuery) {
        setActiveSearchQuery(null);
        // Only clear input if user navigated away from search (e.g., selected category)
        if (category || (!query && !category)) {
          setInputValue("");
        }
      } else if (query && query !== activeSearchQuery) {
        // Update if search query changed externally (e.g., browser back/forward)
        setInputValue(query);
        setActiveSearchQuery(query);
      }
    }
  }, [searchParams, activeSearchQuery]);

  const handleCategoryClick = (categoryName: string) => {
    // Clear search input and query when clicking category
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
      // If search is empty, clear everything and go to home
      setActiveSearchQuery(null);
      router.push("/");
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Don't automatically search while typing - wait for explicit search action
    // This prevents premature clearing and allows user to type freely
  };

  const clearSearch = () => {
    setInputValue("");
    setActiveSearchQuery(null);
    // Navigate to home page without any query parameters
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

  return (
    <header className="sticky top-0 z-50 bg-theme-header text-[var(--text-primary)] shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div
              className="text-2xl font-bold cursor-pointer"
              onClick={handleLogoClick}
            >
              <span className="text-[var(--text-primary)]">Tabacaria</span>
              <div className="text-sm font-normal">do Baiano</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
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

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-[var(--text-primary)] hover:text-theme-smoke transition-colors duration-200"
              onClick={() => router.push("/pedidos")}
            >
              <Package className="w-4 h-4 mr-1" />
              <span className="text-sm">Pedidos</span>
            </Button>
            <Button
              variant="ghost"
              className="text-[var(--text-primary)] hover:text-theme-smoke transition-colors duration-200"
            >
              <User className="w-4 h-4 mr-1" />
              <span className="text-sm">Login</span>
            </Button>
            <Button
              variant="ghost"
              className="text-[var(--text-primary)] hover:text-theme-smoke relative cursor-pointer transition-colors duration-200"
              onClick={() => router.push("/checkout")}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-theme-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {getTotalItems()}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation - tobacconist categories (fallback when API has no categories) */}
      <nav className="bg-[var(--bg-secondary)] text-muted-foreground border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 py-3">
            <button
              onClick={() => handleCategoryClick("Papel de seda")}
              className="category-item text-sm cursor-pointer"
            >
              Papel de seda
            </button>
            <button
              onClick={() => handleCategoryClick("Filtros")}
              className="category-item text-sm cursor-pointer"
            >
              Filtros
            </button>
            <button
              onClick={() => handleCategoryClick("Isqueiros")}
              className="category-item text-sm cursor-pointer"
            >
              Isqueiros
            </button>
            <button
              onClick={() => handleCategoryClick("Moedores")}
              className="category-item text-sm cursor-pointer"
            >
              Moedores
            </button>
            <button
              onClick={() => handleCategoryClick("Cinzeiros")}
              className="category-item text-sm cursor-pointer"
            >
              Cinzeiros
            </button>
            <button
              onClick={() => handleCategoryClick("Narguilé e acessórios")}
              className="category-item text-sm cursor-pointer"
            >
              Narguilé e acessórios
            </button>
            <button
              onClick={() => handleCategoryClick("Vapes e acessórios")}
              className="category-item text-sm cursor-pointer"
            >
              Vapes e acessórios
            </button>
            <button
              onClick={() => handleCategoryClick("Charutos e acessórios")}
              className="category-item text-sm cursor-pointer"
            >
              Charutos e acessórios
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
