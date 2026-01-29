"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/cart-context";

export function HomepageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const { addToCart } = useCart();

  // Update state based on URL parameters
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("search");

    // Update states based on URL parameters
    setSearchQuery(searchFromUrl);
    setSelectedCategory(categoryFromUrl);
  }, [searchParams]);

  const categories = [
    {
      name: "Remédios e medicamentos",
      image: "images/products/remedios e medicamentos.png?height=80&width=80",
    },
    {
      name: "Genéricos",
      image: "images/products/genéricos.png?height=100&width=100",
    },
    {
      name: "Saúde e bem-estar",
      image: "images/products/Saúde e bem-estar.png?height=80&width=80",
    },
    {
      name: "Mamães e bebês",
      image: "images/products/mae e bebe.png?height=80&width=80",
    },
    {
      name: "Dermocosméticos",
      image: "images/products/Dermocosméticos.png?height=80&width=80",
    },
    {
      name: "Diabetes",
      image: "images/products/diabetes.png?height=80&width=80",
    },
    {
      name: "Cabelos",
      image: "images/products/Perfumaria.png?height=80&width=80",
    },
  ];

  const allProducts = [
    {
      id: "creme-elseve-liso-250ml",
      name: "Creme para Pentear Elseve Liso dos Sonhos 250ml",
      price: "17,94",
      originalPrice: "21,90",
      image:
        "/images/products/Creme para Pentear Elseve Liso dos Sonhos 250ml (2).jpg?height=200&width=200&text=Elseve+Main",
      additionalImages: [
        "/images/products/Creme para Pentear Elseve Liso dos Sonhos 250ml (3).jpg?height=400&width=400&text=Elseve+Back",
        "/images/products/Creme para Pentear Elseve Liso dos Sonhos 250ml (2).jpg?height=400&width=400&text=Elseve+Back",
      ],
      category: "Cabelos",
      reference: "7509785461900",
      keywords: [
        "creme",
        "pentear",
        "elseve",
        "liso",
        "sonhos",
        "cabelo",
        "hair",
        "cream",
      ],
    },
    {
      id: "paracetamol-500mg-20comp",
      name: "Paracetamol 500mg 20 Comprimidos",
      price: "8,90",
      originalPrice: "12,90",
      image:
        "images/products/paracetamol.jpg?height=200&width=200&text=Paracetamol+Main",
      additionalImages: [
        "images/products/paracetamol_2.jpg?height=400&width=400&text=Paracetamol+Box",
      ],
      category: "Remédios e medicamentos",
      reference: "7891058001234",
      keywords: [
        "paracetamol",
        "dor",
        "febre",
        "comprimido",
        "analgesico",
        "pain",
        "fever",
      ],
    },
    {
      id: "ibuprofeno-600mg-10comp",
      name: "Ibuprofeno 600mg 10 Comprimidos",
      price: "15,90",
      originalPrice: "19,90",
      image:
        "images/products/Ibuprofeno 600mg 10 Comprimidos.jpg?height=400&width=400",
      additionalImages: [],
      category: "Remédios e medicamentos",
      reference: "7891058005678",
      keywords: [
        "ibuprofeno",
        "anti-inflamatorio",
        "dor",
        "comprimido",
        "analgesico",
        "inflammation",
      ],
    },
    {
      id: "oscillococcinum-30-tubos",
      name: "Oscillococcinum 30 Tubos de 1g",
      price: "235,90",
      originalPrice: "289,90",
      image:
        "images/products/Oscillococcinum 30 Tubos de 1g (1).jpg?height=200&width=200&text=Oscillococcinum+Main",
      additionalImages: [
        "images/products/Oscillococcinum 30 Tubos de 1g (2).jpg?height=400&width=400&text=Oscillococcinum+Tubes",
      ],
      category: "Genéricos",
      reference: "3400930404041",
      keywords: [
        "oscillococcinum",
        "homeopatico",
        "gripe",
        "resfriado",
        "flu",
        "cold",
      ],
    },
    {
      id: "dorflex-max-8comp",
      name: "Dorflex Max Sanofi Com 8 Comprimidos",
      price: "14,30",
      originalPrice: "17,90",
      image:
        "images/products/Dorflex Max Sanofi Com 8 Comprimidos (1).jpg?height=200&width=200&text=Dorflex+Main",
      additionalImages: [
        "images/products/Dorflex Max Sanofi Com 8 Comprimidos (2).jpg?height=400&width=400&text=Dorflex+Box",
      ],
      category: "Genéricos",
      reference: "7891058009876",
      keywords: [
        "dorflex",
        "dor",
        "muscular",
        "relaxante",
        "muscle",
        "pain",
        "sanofi",
      ],
    },
    {
      id: "whey-protein-900g",
      name: "Whey Protein 900g",
      price: "89,90",
      originalPrice: "120,90",
      image:
        "images/products/Whey Protein 900g (2).jpg?height=200&width=200&text=Whey+Main",
      additionalImages: [
        "images/products/Whey Protein 900g (1).jpg?height=400&width=400&text=Whey+Back",
      ],
      category: "Saúde e bem-estar",
      reference: "7891234567890",
      keywords: [
        "whey",
        "protein",
        "proteina",
        "suplemento",
        "musculacao",
        "fitness",
        "workout",
      ],
    },
    {
      id: "oleo-coco-500ml",
      name: "Óleo de Coco Extra Virgem 500ml",
      price: "25,90",
      originalPrice: "32,90",
      image:
        "images/products/Óleo de Coco Extra Virgem 500ml (1).jpg?height=200&width=200&text=Coconut+Oil+Main",
      additionalImages: [
        "images/products/Óleo de Coco Extra Virgem 500ml (2).jpg?height=400&width=400&text=Coconut+Oil+Label",
        "images/products/Óleo de Coco Extra Virgem 500ml (3).jpg?height=400&width=400&text=Coconut+Oil+Label",
      ],
      category: "Saúde e bem-estar",
      reference: "7891234567891",
      keywords: [
        "oleo",
        "coco",
        "coconut",
        "oil",
        "natural",
        "virgem",
        "culinario",
      ],
    },
    {
      id: "fralda-pampers-rn",
      name: "Fralda Pampers Recém-Nascido",
      price: "45,90",
      originalPrice: "55,90",
      image:
        "images/products/Fralda Pampers Recém-Nascido (1).jpg?height=200&width=200&text=Pampers+Main",
      additionalImages: [
        "images/products/Fralda Pampers Recém-Nascido (2).jpg?height=400&width=400&text=Pampers+Package",
        "images/products/Fralda Pampers Recém-Nascido (3).jpg?height=400&width=400&text=Pampers+Features",
      ],
      category: "Mamães e bebês",
      reference: "7500435123456",
      keywords: [
        "fralda",
        "pampers",
        "bebe",
        "recem-nascido",
        "diaper",
        "baby",
        "newborn",
      ],
    },
    {
      id: "shampoo-johnsons-400ml",
      name: "Shampoo Johnson's Baby 400ml",
      price: "18,90",
      originalPrice: "24,90",
      image:
        "images/products/Shampoo Johnson's Baby 400ml (2).jpg?height=200&width=200&text=Johnsons+Main",
      additionalImages: [
        "images/products/Shampoo Johnson's Baby 400ml (3).jpg?height=400&width=400&text=Johnsons+Back",
        "images/products/Shampoo Johnson's Baby 400ml (1).jpg?height=400&width=400&text=Johnsons+Ingredients",
      ],
      category: "Mamães e bebês",
      reference: "7891010123456",
      keywords: [
        "shampoo",
        "johnsons",
        "baby",
        "bebe",
        "cabelo",
        "hair",
        "crianca",
      ],
    },
    {
      id: "protetor-solar-laroche-fps60",
      name: "Protetor Solar La Roche Posay FPS 60",
      price: "89,90",
      originalPrice: "110,90",
      image:
        "images/products/Protetor Solar La Roche Posay FPS 60 (1).jpg?height=200&width=200&text=La+Roche+Main",
      additionalImages: [
        "images/products/Protetor Solar La Roche Posay FPS 60 (2).jpg?height=400&width=400&text=La+Roche+Back",
      ],
      category: "Dermocosméticos",
      reference: "3337875543210",
      keywords: [
        "protetor",
        "solar",
        "fps",
        "la roche posay",
        "sun",
        "screen",
        "dermatologico",
      ],
    },
    {
      id: "serum-vitamina-c-ordinary",
      name: "Sérum Vitamina C The Ordinary",
      price: "65,90",
      originalPrice: "79,90",
      image:
        "images/products/Sérum Vitamina C The Ordinary (2).jpg?height=200&width=200&text=Ordinary+Main",
      additionalImages: [
        "images/products/Sérum Vitamina C The Ordinary (1).jpg?height=400&width=400&text=Ordinary+Dropper",
      ],
      category: "Dermocosméticos",
      reference: "0769915190427",
      keywords: [
        "serum",
        "vitamina",
        "c",
        "the ordinary",
        "skincare",
        "antioxidante",
        "facial",
      ],
    },
    {
      id: "glicosimetro-accu-chek",
      name: "Glicosímetro Accu-Chek Active",
      price: "45,90",
      originalPrice: "59,90",
      image:
        "images/products/Glicosímetro Accu-Chek Active (1).jpg?height=200&width=200&text=Accu+Chek+Main",
      additionalImages: [
        "images/products/Glicosímetro Accu-Chek Active (2).jpg?height=400&width=400&text=Accu+Chek+Kit",
      ],
      category: "Diabetes",
      reference: "4015630987654",
      keywords: [
        "glicosimetro",
        "accu-chek",
        "diabetes",
        "glicose",
        "glucose",
        "meter",
        "teste",
      ],
    },
    {
      id: "tiras-reagentes-50un",
      name: "Tiras Reagentes Glicemia 50un",
      price: "89,90",
      originalPrice: "105,90",
      image:
        "images/products/Tiras Reagentes Glicemia 50un (3).jpg?height=200&width=200&text=Test+Strips+Main",
      additionalImages: [],
      category: "Diabetes",
      reference: "4015630987655",
      keywords: [
        "tiras",
        "reagentes",
        "glicemia",
        "diabetes",
        "teste",
        "strips",
        "glucose",
      ],
    },
  ];

  // Filter products based on search query or selected category
  const filteredProducts = (() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return allProducts.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(query);
        const categoryMatch = product.category.toLowerCase().includes(query);
        const keywordMatch = product.keywords.some((keyword) =>
          keyword.toLowerCase().includes(query)
        );
        return nameMatch || categoryMatch || keywordMatch;
      });
    } else if (selectedCategory) {
      return allProducts.filter(
        (product) => product.category === selectedCategory
      );
    }
    return allProducts;
  })();

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      // If clicking the same category, deselect it (show all products)
      router.push("/");
    } else {
      // Select the new category
      router.push(`/?category=${encodeURIComponent(categoryName)}`);
    }
  };

  const handleShowAllProducts = () => {
    router.push("/");
  };

  const handleProductClick = (product: any) => {
    // Store product data in localStorage to pass to product page
    localStorage.setItem("selectedProduct", JSON.stringify(product));
    router.push("/produto");
  };

  const getDisplayTitle = () => {
    if (searchQuery) {
      return `Resultados da busca: "${searchQuery}" (${filteredProducts.length} produtos encontrados)`;
    } else if (selectedCategory) {
      return `Produtos: ${selectedCategory} (${filteredProducts.length} produtos)`;
    }
    return `Produtos: Todos (${filteredProducts.length} produtos)`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Results Header */}
      {searchQuery && (
        <div className="mb-8 p-4 bg-theme-primary border rounded-lg">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-theme-secondary" />
            <h2 className="text-lg font-semibold text-theme-primary">
              Resultados para: "{searchQuery}"
            </h2>
          </div>
          <p className="text-sm text-theme-secondary mt-1">
            {filteredProducts.length} produto
            {filteredProducts.length !== 1 ? "s" : ""} encontrado
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Categories - Hide when searching */}
      {!searchQuery && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-theme-primary mb-6">
            Categorias:
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 primary">
            {categories.map((category, index) => (
              <Card
                key={index}
                className={`p-3 text-center card-hover category-hover transition-all cursor-pointer min-h-[140px] flex flex-col justify-between border border-gray-200 ${
                  selectedCategory === category.name
                    ? "ring-2 ring-blue-500 bg-theme-primary"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="mb-2 flex-shrink-0">
                  <Image
                    src={category.image || "images/products/"}
                    alt={category.name}
                    width={90}
                    height={90}
                    className="mx-auto"
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
        </div>
      )}

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-theme-primary">
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
              className="text-theme-secondary border-blue-500 hover:bg-theme-primary bg-transparent"
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

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {filteredProducts.map((product, index) => (
              <Card
                key={index}
                className="p-4 card-hover transition-shadow border border-gray-200"
              >
                <div className="relative mb-4">
                  <Image
                    src={product.image || "images/products/"}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="w-full h-48 object-contain"
                  />
                </div>

                <h3 className="text-sm font-medium text-theme-primary mb-3 line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600">A partir de</div>
                  <div className="text-xl font-bold text-theme-primary">
                    R$ {product.price}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleProductClick(product)}
                    className="flex-1 btn-theme-primary button-hover text-sm"
                  >
                    DETALHES
                  </Button>
                  <Button
                    onClick={() =>
                      addToCart({
                        id: `${product.id}-${Date.now()}`,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                      })
                    }
                    className="btn-theme-secondary button-hover text-sm px-3"
                    title="Adicionar ao carrinho"
                  >
                    +
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-theme-primary mb-2">
              {searchQuery
                ? `Nenhum produto encontrado para "${searchQuery}"`
                : "Nenhum produto encontrado"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Tente buscar por outros termos ou navegue pelas categorias"
                : "Tente ajustar os filtros ou navegue pelas categorias"}
            </p>
            {searchQuery && (
              <Button
                onClick={handleShowAllProducts}
                className="btn-theme-primary"
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
