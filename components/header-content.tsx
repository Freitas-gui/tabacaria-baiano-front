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
    null
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
    <header className="sticky top-0 z-50 bg-theme-header text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div
              className="text-2xl font-bold cursor-pointer"
              onClick={handleLogoClick}
            >
              <span className="text-white">Click</span>
              <div className="text-sm font-normal">Farma</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
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

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:text-blue-100 transition-colors duration-200"
              onClick={() => router.push("/pedidos")}
            >
              <Package className="w-4 h-4 mr-1" />
              <span className="text-sm">Pedidos</span>
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:text-blue-100 transition-colors duration-200"
            >
              <User className="w-4 h-4 mr-1" />
              <span className="text-sm">Ramon Santana</span>
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:text-blue-100 relative cursor-pointer transition-colors duration-200"
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

      {/* Navigation */}
      <nav className="bg-white text-gray-700 border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-8 py-3">
            <button
              onClick={() => handleCategoryClick("Remédios e medicamentos")}
              className="text-sm cursor-pointer transition-colors duration-200 hover:text-theme-secondary"
            >
              Remédios e medicamentos
            </button>
            <button
              onClick={() => handleCategoryClick("Genéricos")}
              className="text-sm cursor-pointer transition-colors duration-200 hover:text-theme-secondary"
            >
              Genéricos
            </button>
            <button
              onClick={() => handleCategoryClick("Saúde e bem-estar")}
              className="text-sm cursor-pointer transition-colors duration-200 hover:text-theme-secondary"
            >
              Saúde e bem-estar
            </button>
            <button
              onClick={() => handleCategoryClick("Mamães e bebês")}
              className="text-sm cursor-pointer transition-colors duration-200 hover:text-theme-secondary"
            >
              Mamães e bebês
            </button>
            <button
              onClick={() => handleCategoryClick("Dermocosméticos")}
              className="text-sm cursor-pointer transition-colors duration-200 hover:text-theme-secondary"
            >
              Dermocosméticos
            </button>
            <button
              onClick={() => handleCategoryClick("Diabetes")}
              className="text-sm cursor-pointer transition-colors duration-200 hover:text-theme-secondary"
            >
              Diabetes
            </button>
            <button
              onClick={() => handleCategoryClick("Cabelos")}
              className="text-sm cursor-pointer transition-colors duration-200 hover:text-theme-secondary"
            >
              Cabelos
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
