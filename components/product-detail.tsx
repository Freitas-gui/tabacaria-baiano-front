"use client";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useState, useEffect } from "react";

// Default product as fallback
const defaultProduct = {
  id: "creme-elseve-liso-250ml",
  name: "Creme para Pentear Elseve Liso dos Sonhos 250ml",
  price: "17,94",
  originalPrice: "21,90",
  image: "/placeholder.svg?height=400&width=400",
  additionalImages: [
    "/placeholder.svg?height=400&width=400&text=Image+2",
    "/placeholder.svg?height=400&width=400&text=Image+3",
  ],
  reference: "7509785461900",
  category: "Cabelos",
};

export function ProductDetail() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [product, setProduct] = useState(defaultProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Create dynamic product images array based on product data
  const productImages = [
    product.image || "/placeholder.svg?height=400&width=400",
    ...(product.additionalImages || []),
  ];

  // Load product data from localStorage when component mounts and scroll to top
  useEffect(() => {
    // Scroll to top of page
    window.scrollTo(0, 0);

    const selectedProduct = localStorage.getItem("selectedProduct");
    if (selectedProduct) {
      try {
        const productData = JSON.parse(selectedProduct);
        setProduct(productData);
        // Reset selected image index when product changes
        setSelectedImageIndex(0);
      } catch (error) {
        console.error("Error parsing product data:", error);
        // Keep default product if parsing fails
      }
    }
  }, []);

  const handleAddToCart = () => {
    addToCart({
      id: `${product.id}-${Date.now()}`, // Unique ID for each cart addition
      name: product.name,
      price: product.price,
      image: product.image || "/placeholder.svg?height=400&width=400",
    });
  };

  const handleBuyNow = () => {
    // Add product to cart first
    addToCart({
      id: `${product.id}-${Date.now()}`, // Unique ID for each cart addition
      name: product.name,
      price: product.price,
      image: product.image || "/placeholder.svg?height=400&width=400",
    });
    // Then redirect to checkout
    router.push("/checkout");
  };

  const handleRelatedProductClick = (relatedProduct: any) => {
    // Save related product to localStorage
    localStorage.setItem("selectedProduct", JSON.stringify(relatedProduct));
    // Update state so UI updates immediately
    setProduct(relatedProduct);
    setSelectedImageIndex(0);
    // Redirect to product detail page
    router.push("/produto");
    // Scroll to top of page
    window.scrollTo(0, 0);
  };

  // Generate product description based on the product
  const getProductDescription = () => {
    if (product.name.toLowerCase().includes("paracetamol")) {
      return {
        description:
          "O Paracetamol é um analgésico e antitérmico amplamente utilizado para o alívio da dor e redução da febre. Sua fórmula eficaz proporciona alívio rápido e seguro para dores de cabeça, dores musculares, dores nas costas e febre.",
        benefits: [
          "Alívio rápido da dor",
          "Redução eficaz da febre",
          "Seguro para uso regular",
          "Bem tolerado pelo organismo",
        ],
        usage:
          "Adultos: 1 a 2 comprimidos a cada 6 horas, não excedendo 8 comprimidos em 24 horas. Crianças: conforme orientação médica.",
      };
    } else if (product.name.toLowerCase().includes("ibuprofeno")) {
      return {
        description:
          "O Ibuprofeno é um anti-inflamatório não esteroidal (AINE) que combate a dor, inflamação e febre. Ideal para dores musculares, articulares e inflamações em geral.",
        benefits: [
          "Ação anti-inflamatória",
          "Alívio da dor intensa",
          "Redução do inchaço",
          "Efeito duradouro",
        ],
        usage:
          "Adultos: 1 comprimido a cada 8 horas, preferencialmente após as refeições. Não exceder 3 comprimidos por dia.",
      };
    } else if (product.name.toLowerCase().includes("whey")) {
      return {
        description:
          "Whey Protein de alta qualidade, ideal para quem busca aumentar a massa muscular e melhorar o desempenho nos treinos. Rico em aminoácidos essenciais e de rápida absorção.",
        benefits: [
          "Aumento da massa muscular",
          "Recuperação pós-treino",
          "Rico em aminoácidos",
          "Fácil digestão",
        ],
        usage:
          "Misture 1 dose (30g) com 200ml de água ou leite. Consuma após o treino ou conforme orientação nutricional.",
      };
    } else {
      return {
        description: `${product.name} é um produto de alta qualidade desenvolvido para atender suas necessidades específicas. Formulado com ingredientes selecionados para proporcionar os melhores resultados.`,
        benefits: [
          "Qualidade garantida",
          "Fórmula eficaz",
          "Resultados comprovados",
          "Seguro para uso",
        ],
        usage:
          "Siga as instruções da embalagem ou orientação profissional para uso adequado do produto.",
      };
    }
  };

  const productInfo = getProductDescription();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Product Images - Only show if there are images */}

        <div className="lg:col-span-2">
          <div className="space-y-2">
            {productImages.map((imageUrl, index) => (
              <div
                key={index}
                className={`border rounded p-2 cursor-pointer transition-all ${
                  selectedImageIndex === index
                    ? "border-theme-secondary ring-2 ring-theme-secondary"
                    : "border-gray-300 hover:border-theme-secondary"
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt={`Product thumbnail ${index + 1}`}
                  width={60}
                  height={60}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Main Product Image */}
        <div
          className={
            productImages.length > 1 ? "lg:col-span-5" : "lg:col-span-5"
          }
        >
          <div className="relative">
            <Image
              src={productImages[selectedImageIndex] || "/placeholder.svg"}
              alt={product.name}
              width={400}
              height={500}
              className="w-full h-auto"
            />
            {/* Image counter */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded">
                {selectedImageIndex + 1} / {productImages.length}
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="lg:col-span-5">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Voltar</span>
              <span>|</span>
              <span className="text-theme-secondary">{product.category}</span>
            </div>

            <div className="text-sm text-gray-500">
              Referência: {product.reference}
            </div>

            <h1 className="text-2xl font-semibold text-theme-primary">
              {product.name}
            </h1>

            <div className="bg-theme-primary p-4 rounded border">
              <div className="text-sm text-theme-primary mb-2">
                6 ofertas a partir de
              </div>
              <div className="text-3xl font-bold text-theme-primary">
                R$ {product.price.split(",")[0]},
                <span className="text-lg">{product.price.split(",")[1]}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={handleBuyNow} className="btn-theme-primary px-8">
                Comprar
              </Button>
              <Button
                onClick={handleAddToCart}
                className="btn-theme-secondary px-6"
              >
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-12">
        <div className="border-b mb-6">
          <h2 className="text-lg font-semibold text-theme-secondary pb-2 border-b-2 border-theme-secondary inline-block">
            DESCRIÇÃO
          </h2>
        </div>

        <div className="prose max-w-none text-sm text-gray-700 space-y-4">
          <p>{productInfo.description}</p>

          <div>
            <h3 className="font-semibold mb-2 text-theme-primary">
              Benefícios
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {productInfo.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-theme-primary">
              Modo de uso
            </h3>
            <p>{productInfo.usage}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-theme-primary">
              Precauções
            </h3>
            <p>
              Produto para uso conforme indicação. Leia atentamente a bula ou
              rótulo antes do uso. Em caso de dúvidas, consulte um profissional
              de saúde. Mantenha fora do alcance de crianças.
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-theme-primary">
            Produtos relacionados
          </h2>
          <a href="/" className="text-theme-secondary text-sm hover:underline">
            Ver todos
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
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
          ]
            // Filter by same category as current product
            .filter(
              (relatedProduct) =>
                relatedProduct.category === product.category &&
                relatedProduct.id !== product.id
            )
            .map((relatedProduct, index) => (
              <Card
                key={index}
                className="p-4 hover:shadow-lg transition-shadow"
              >
                <div className="relative mb-4">
                  <Image
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    width={150}
                    height={150}
                    className="w-full h-auto"
                  />
                </div>

                <h3 className="text-sm font-medium text-theme-primary mb-2 line-clamp-2">
                  {relatedProduct.name}
                </h3>

                <div className="space-y-1">
                  <div className="text-lg font-bold text-theme-primary">
                    R$ {relatedProduct.price}
                  </div>
                </div>

                <div className="flex space-x-2 mt-3">
                  <Button
                    onClick={() => handleRelatedProductClick(relatedProduct)}
                    className="flex-1 btn-theme-primary text-sm"
                  >
                    DETALHES
                  </Button>
                  <Button
                    onClick={() =>
                      addToCart({
                        id: `${relatedProduct.id}-${Date.now()}`,
                        name: relatedProduct.name,
                        price: relatedProduct.price,
                        image: relatedProduct.image,
                      })
                    }
                    className="btn-theme-secondary text-sm px-3"
                    title="Adicionar ao carrinho"
                  >
                    +
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
