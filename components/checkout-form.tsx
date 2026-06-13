"use client";

import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, MapPin, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/cdn";
import {
  formatBrazilianPhone,
  isValidBrazilianPhone,
  unmaskPhone,
} from "@/lib/phone";
import { storePixPaymentForOrder } from "@/lib/pix-payment";
import { OrderTotalSummary } from "@/components/order-total-summary";
import { useShippingQuote } from "@/hooks/use-shipping-quote";
import { useAddressAutocomplete } from "@/hooks/use-address-autocomplete";
import { formatCurrency } from "@/lib/delivery-regions";
import { lookupCep, formatCep } from "@/lib/cep-api";
import { fetchAddressDetails, type PlaceSuggestion } from "@/lib/address-api";
import type { AddressSuggestion } from "@/lib/shipping-api";

function resolveCreatedOrderId(data: {
  order_id?: string;
  payment?: { id?: string };
  data?: { id?: string } | Array<{ id?: string }>;
}): string | null {
  if (data.order_id) {
    return data.order_id;
  }
  if (data.data && !Array.isArray(data.data) && data.data.id) {
    return data.data.id;
  }
  if (Array.isArray(data.data) && data.data[0]?.id) {
    return data.data[0].id;
  }
  return null;
}

function ShippingStatus({
  state,
  quoteExpired,
  onRefresh,
}: {
  state: ReturnType<typeof useShippingQuote>["state"];
  quoteExpired: boolean;
  onRefresh: () => void;
}) {
  if (state.status === "idle" || state.status === "needs_selection") return null;

  if (state.status === "loading") {
    return (
      <p className="text-xs text-muted-foreground animate-pulse">
        Calculando frete...
      </p>
    );
  }

  if (state.status === "unavailable") {
    return (
      <p className="text-xs text-red-600">{state.message}</p>
    );
  }

  if (state.status === "error") {
    return (
      <p className="text-xs text-amber-700">
        Não foi possível calcular o frete. Tente novamente.
      </p>
    );
  }

  if (state.status === "ready" && quoteExpired) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-xs text-amber-700">Cotação expirada.</p>
        <button
          type="button"
          onClick={onRefresh}
          className="text-xs underline text-theme-primary"
        >
          Recalcular
        </button>
      </div>
    );
  }

  if (state.status === "ready") {
    const eta = state.quote.estimated_dropoff_at
      ? new Date(state.quote.estimated_dropoff_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return (
      <p className="text-xs text-emerald-700">
        Frete: {formatCurrency(state.quote.fee)}
        {eta ? ` · Previsão: ${eta}` : ""}
      </p>
    );
  }

  return null;
}

function AddressSuggestionPicker({
  message,
  suggestions,
  onSelect,
}: {
  message: string;
  suggestions: AddressSuggestion[];
  onSelect: (suggestion: AddressSuggestion) => void;
}) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs font-medium text-amber-800">{message}</p>
      </div>
      <p className="text-xs text-amber-700">Selecione um endereço sugerido:</p>
      <ul className="space-y-1">
        {suggestions.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelect(s)}
              className="w-full text-left text-xs px-3 py-2 rounded border border-amber-200 bg-white hover:bg-amber-100 transition-colors text-amber-900"
            >
              {s.address}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CheckoutForm() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } =
    useCart();
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [pharmacyNames, setPharmacyNames] = useState<Record<string, string>>(
    {},
  );
  const [loadingPharmacyNames, setLoadingPharmacyNames] = useState<
    Record<string, boolean>
  >({});
  const [productStocks, setProductStocks] = useState<Record<string, number>>(
    {},
  );
  const [loadingStocks, setLoadingStocks] = useState<Record<string, boolean>>(
    {},
  );
  const requestedItems = useRef<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    street: "",
    street_number: "",
    address_details: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    if (user?.address) {
      setFormData({
        email: user.email,
        phone: formatBrazilianPhone(user.phone || ""),
        street: user.address.street || "",
        street_number: user.address.street_number || "",
        address_details: user.address.address_details || "",
        district: user.address.district || "",
        city: user.address.city || "",
        state: user.address.state || "",
        zipCode: user.address.postal_code || "",
      });
    } else if (user) {
      setFormData({
        email: user.email,
        phone: formatBrazilianPhone(user.phone || ""),
        street: "",
        street_number: "",
        address_details: "",
        district: "",
        city: "",
        state: "",
        zipCode: "",
      });
    }
  }, [user]);

  const productsSubtotal = getTotalPrice();

  const { state: shippingState, quoteExpired, refresh: refreshQuote } = useShippingQuote(
    {
      street: formData.street,
      number: formData.street_number,
      district: formData.district,
      city: formData.city,
      state: formData.state,
      postal_code: formData.zipCode,
      complement: formData.address_details || undefined,
      cart_subtotal_cents: Math.round(productsSubtotal * 100),
    },
    !!user,
  );

  const freight =
    shippingState.status === "ready" && !quoteExpired
      ? shippingState.quote.fee
      : 0;

  const orderTotal = productsSubtotal + freight;

  const canSubmit =
    shippingState.status === "ready" &&
    !quoteExpired &&
    !isSubmitting &&
    !cepLoading;

  const fetchProductInfo = useCallback(
    async (
      pharmacyProductId: string,
      itemId: string,
      variationOptionId?: string | null,
      variationOptionName?: string | null,
    ) => {
      if (requestedItems.current.has(itemId)) return;
      requestedItems.current.add(itemId);

      setLoadingPharmacyNames((prev) => ({ ...prev, [itemId]: true }));
      setLoadingStocks((prev) => ({ ...prev, [itemId]: true }));

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/product/show/${pharmacyProductId}`,
        );

        if (res.ok && res.status !== 204) {
          const json = await res.json();
          const data = json.data || json;

          if (data?.pharmacy?.name) {
            setPharmacyNames((prev) => {
              if (prev[itemId]) return prev;
              return { ...prev, [itemId]: data.pharmacy.name };
            });
          }

          let resolvedStock: number | null = null;

          if (Array.isArray(data?.variations) && data.variations.length > 0) {
            const matchedVariation = data.variations.find((v: any) => {
              if (variationOptionId && v.optionId) {
                return String(v.optionId) === String(variationOptionId);
              }
              if (variationOptionName && v.optionName) {
                return String(v.optionName) === String(variationOptionName);
              }
              return false;
            });

            if (matchedVariation?.stock !== undefined && matchedVariation?.stock !== null) {
              resolvedStock = Number(matchedVariation.stock);
            }
          }

          if (resolvedStock === null && data?.stock !== undefined && data?.stock !== null) {
            resolvedStock = data.stock;
          }

          if (resolvedStock !== null) {
            setProductStocks((prev) => {
              if (prev[itemId] !== undefined) return prev;
              return { ...prev, [itemId]: resolvedStock as number };
            });
          }
        }
      } catch (error) {
        console.error("Error fetching product info:", error);
      } finally {
        setLoadingPharmacyNames((prev) => ({ ...prev, [itemId]: false }));
        setLoadingStocks((prev) => ({ ...prev, [itemId]: false }));
      }
    },
    [],
  );

  useEffect(() => {
    items.forEach((item) => {
      if (!item.pharmacyProductId || requestedItems.current.has(item.id)) return;

      const needsPharmacyName = !item.pharmacyName && !pharmacyNames[item.id];
      const needsStock = productStocks[item.id] === undefined;

      if (needsPharmacyName || needsStock) {
        fetchProductInfo(item.pharmacyProductId, item.id, item.variationOptionId, item.variationOptionName);
      } else if (item.pharmacyName && !pharmacyNames[item.id]) {
        requestedItems.current.add(item.id);
        setPharmacyNames((prev) => ({
          ...prev,
          [item.id]: item.pharmacyName!,
        }));
      }
    });
  }, [items, fetchProductInfo, pharmacyNames, productStocks]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      phone: formatBrazilianPhone(e.target.value),
    });
  };

  const [addressQuery, setAddressQuery] = useState("");
  const [addressSessionToken, setAddressSessionToken] = useState<string | null>(null);
  const [addressDetailsLoading, setAddressDetailsLoading] = useState(false);
  const [addressDetailsError, setAddressDetailsError] = useState<string | null>(null);

  const {
    suggestions: addressSuggestions,
    loading: addressSuggestionsLoading,
    error: addressSuggestionsError,
    clearSuggestions: clearAddressSuggestions,
  } = useAddressAutocomplete(addressQuery, addressSessionToken);

  const cepDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setFormData((prev) => ({ ...prev, zipCode: formatted }));

    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      if (cepDebounceRef.current) clearTimeout(cepDebounceRef.current);
      cepDebounceRef.current = setTimeout(async () => {
        setCepLoading(true);
        const data = await lookupCep(digits);
        setCepLoading(false);
        if (data) {
          setFormData((prev) => ({
            ...prev,
            ...(data.logradouro ? { street: data.logradouro } : {}),
            district: data.bairro || prev.district,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
        }
      }, 400);
    }
  };

  const handleAddressQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddressQuery(value);
    setAddressDetailsError(null);

    if (value.trim().length === 0) {
      setAddressSessionToken(null);
      clearAddressSuggestions();
      return;
    }

    if (!addressSessionToken) {
      setAddressSessionToken(crypto.randomUUID());
    }
  };

  const handleSelectAddressPlace = async (place: PlaceSuggestion) => {
    setAddressQuery(place.description);
    clearAddressSuggestions();
    setAddressDetailsError(null);
    setAddressDetailsLoading(true);

    try {
      const details = await fetchAddressDetails(
        place.place_id,
        addressSessionToken ?? undefined,
      );

      setFormData((prev) => ({
        ...prev,
        ...(details.street ? { street: details.street } : {}),
        ...(details.number ? { street_number: details.number } : {}),
        ...(details.district ? { district: details.district } : {}),
        ...(details.city ? { city: details.city } : {}),
        ...(details.state ? { state: details.state } : {}),
        ...(details.postal_code
          ? { zipCode: formatCep(details.postal_code) }
          : {}),
      }));
    } catch (err) {
      setAddressDetailsError(
        err instanceof Error
          ? err.message
          : "Erro ao buscar detalhes do endereço",
      );
    } finally {
      setAddressDetailsLoading(false);
      setAddressSessionToken(null);
    }
  };

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    const d = suggestion.detailed_address;
    if (d) {
      const streetMatch = d.street_address?.match(/^(.+?),\s*(\d+\S*)$/);
      setFormData((prev) => ({
        ...prev,
        ...(streetMatch
          ? { street: streetMatch[1].trim(), street_number: streetMatch[2] }
          : d.street_address
          ? { street: d.street_address }
          : {}),
        city: d.city || prev.city,
        state: d.state || prev.state,
        ...(d.zip_code ? { zipCode: formatCep(d.zip_code) } : {}),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.accessToken) {
      alert("Erro: usuário não autenticado");
      return;
    }

    if (shippingState.status !== "ready" || quoteExpired) {
      alert("Solicite uma cotação de frete válida antes de finalizar.");
      return;
    }

    const stockErrors: string[] = [];

    for (const item of items) {
      if (!item.pharmacyProductId) {
        alert(
          `Produto "${item.name}" não está disponível. Remova o item do carrinho e adicione novamente.`,
        );
        return;
      }

      const availableStock =
        productStocks[item.id] ??
        (item as CartItem & { stock?: number | null }).stock;
      if (availableStock !== undefined && availableStock !== null) {
        if (item.quantity > availableStock) {
          stockErrors.push(
            `Estoque insuficiente para "${item.name}". Quantidade disponível: ${availableStock}, quantidade solicitada: ${item.quantity}`,
          );
        }
      }
    }

    if (stockErrors.length > 0) {
      alert(stockErrors.join("\n"));
      return;
    }

    if (!isValidBrazilianPhone(formData.phone)) {
      alert("Informe um telefone válido com DDD (10 ou 11 dígitos).");
      return;
    }

    setIsSubmitting(true);

    try {
      const resolvedItems = await Promise.all(
        items.map(async (item) => {
          if (item.variationOptionName && !item.variationOptionId && item.pharmacyProductId) {
            try {
              const res = await fetch(
                `${API_BASE_URL}/api/product/show/${item.pharmacyProductId}`,
              );
              if (res.ok && res.status !== 204) {
                const json = await res.json();
                const data = json.data || json;
                const matched = Array.isArray(data.variations)
                  ? data.variations.find(
                      (v: any) => v.optionName === item.variationOptionName,
                    )
                  : null;
                if (matched?.optionId) {
                  return { ...item, variationOptionId: matched.optionId };
                }
              }
            } catch {}
          }
          return item;
        }),
      );

      const products = resolvedItems.map((item) => ({
        pharmacy_product_id: item.pharmacyProductId,
        amount: item.quantity,
        ...(item.variationOptionId
          ? { variation_option_id: item.variationOptionId }
          : {}),
      }));

      const requestBody = {
        user_id: user.id,
        payment_method: "pix",
        phone: unmaskPhone(formData.phone),
        delivery_quote_id: shippingState.quote.quote_id,
        address: {
          street: formData.street,
          street_number: formData.street_number,
          address_details: formData.address_details || "",
          district: formData.district,
          city: formData.city,
          state: formData.state,
          postal_code: formData.zipCode,
        },
        products: products,
      };

      const response = await fetch(`${API_BASE_URL}/api/customer/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Erro ao criar pedido";

        const quoteError =
          data?.errors?.delivery_quote_id?.[0] ||
          (typeof data?.errors === "object" && data?.errors !== null
            ? Object.values(data.errors as Record<string, string[]>)
                .flat()
                .find((e: string) => e.toLowerCase().includes("cotação"))
            : null);

        if (quoteError) {
          alert(`Cotação de frete inválida: ${quoteError}\nSolicite uma nova cotação.`);
          setIsSubmitting(false);
          return;
        }

        if (data.errors && Array.isArray(data.errors)) {
          const stockErrors = data.errors.filter((err: string) =>
            err.includes("Estoque insuficiente"),
          );
          if (stockErrors.length > 0) {
            errorMessage = stockErrors.join("\n");
          } else {
            errorMessage = data.errors.join("\n");
          }
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data.errors === "string") {
          errorMessage = data.errors;
        }

        alert(`Erro: ${errorMessage}`);
        setIsSubmitting(false);
        return;
      }

      const createdOrderId = resolveCreatedOrderId(data);
      if (createdOrderId) {
        if (data.payment?.brCode) {
          storePixPaymentForOrder(createdOrderId, {
            id: data.payment.id,
            brCode: data.payment.brCode,
            brCodeBase64: data.payment.brCodeBase64,
            expiresAt: data.payment.expiresAt,
          });
        }
        clearCart();
        router.push(`/pedidos?orderId=${createdOrderId}`);
        setIsSubmitting(false);
        return;
      }

      clearCart();
      alert(
        data.message ||
          "Pedido criado com sucesso. Aguarde a confirmação do pagamento.",
      );
      router.push("/pedidos");
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Erro ao conectar com o servidor. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-theme-primary mb-4">
            Seu carrinho está vazio
          </h1>
          <p className="text-muted-foreground mb-8">
            Adicione alguns produtos para continuar com a compra.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="btn-theme-primary"
          >
            Continuar Comprando
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-4 sm:mb-8">
        Finalizar Compra
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mt-4 sm:mt-8">
        {/* Cart Items */}
        <div>
          <Card className="card-static">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-theme-primary">
                Seus Produtos ({items.length} itens)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="text-xs text-gray-500 w-6 sm:w-8 flex-shrink-0">
                        #{index + 1}
                      </div>

                      <div className="flex-shrink-0 aspect-square bg-gray-50 rounded overflow-hidden">
                        <Image
                          src={
                            resolveCdnUrl(item.image) ||
                            "/placeholder.svg?height=80&width=80"
                          }
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain p-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg?height=80&width=80";
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-theme-primary text-xs sm:text-sm line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-base sm:text-lg font-bold text-theme-primary">
                          R$ {item.price}
                        </p>
                        <p className="text-xs sm:text-sm text-theme-secondary">
                          Quantidade: {item.quantity}
                          {(() => {
                            const availableStock =
                              productStocks[item.id] ??
                              (item as CartItem & { stock?: number | null })
                                .stock;
                            if (
                              availableStock !== undefined &&
                              availableStock !== null
                            ) {
                              return ` / Estoque: ${availableStock}`;
                            }
                            return "";
                          })()}
                        </p>
                        {(item.pharmacyName || pharmacyNames[item.id]) && (
                          <p className="text-xs sm:text-sm text-theme-secondary mt-1">
                            Loja: {item.pharmacyName || pharmacyNames[item.id]}
                          </p>
                        )}
                        {loadingPharmacyNames[item.id] &&
                          !item.pharmacyName &&
                          !pharmacyNames[item.id] && (
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">
                              Carregando loja...
                            </p>
                          )}
                        {item.variationOptionName && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full border border-border bg-muted text-theme-primary">
                            {item.variationTypeName
                              ? `${item.variationTypeName}: `
                              : ""}
                            {item.variationOptionName}
                          </span>
                        )}
                        <p className="text-xs sm:text-sm font-semibold text-theme-secondary mt-1">
                          Subtotal: R${" "}
                          {(
                            Number.parseFloat(item.price.replace(",", ".")) *
                            item.quantity
                          )
                            .toFixed(2)
                            .replace(".", ",")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end sm:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="text-theme-secondary hover:bg-muted h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <span className="w-6 sm:w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      {(() => {
                        const availableStock =
                          productStocks[item.id] ??
                          (item as CartItem & { stock?: number | null }).stock;
                        const maxQuantity =
                          availableStock !== undefined &&
                          availableStock !== null
                            ? availableStock
                            : Infinity;
                        const isMaxReached = item.quantity >= maxQuantity;
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!isMaxReached) {
                                updateQuantity(item.id, item.quantity + 1);
                              } else {
                                alert(
                                  `Estoque máximo disponível: ${maxQuantity}`,
                                );
                              }
                            }}
                            disabled={isMaxReached}
                            className="text-theme-secondary hover:bg-muted h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              isMaxReached
                                ? `Estoque máximo: ${maxQuantity}`
                                : "Aumentar quantidade"
                            }
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        );
                      })()}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 border-red-300 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-3 sm:my-4" />

              <OrderTotalSummary
                productsSubtotal={productsSubtotal}
                freight={freight}
                shippingState={shippingState}
              />
            </CardContent>
          </Card>
        </div>

        {/* Checkout Form or Login Message */}
        <div>
          {user ? (
            <Card className="card-static">
              <CardHeader className="bg-muted/60 border-b border-border p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg text-theme-primary">
                  Dados de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-3 sm:space-y-4 mt-2 sm:mt-4"
                >
                  <div className="relative">
                    <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                      Buscar endereço
                    </label>
                    <div className="relative">
                      <Input
                        value={addressQuery}
                        onChange={handleAddressQueryChange}
                        placeholder="Digite o endereço de entrega"
                        autoComplete="off"
                        className="focus:border-theme-accent text-sm sm:text-base pr-8"
                      />
                      {(addressSuggestionsLoading || addressDetailsLoading) && (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {addressSuggestionsError && (
                      <p className="text-xs text-red-600 mt-1">
                        {addressSuggestionsError}
                      </p>
                    )}
                    {addressDetailsError && (
                      <p className="text-xs text-red-600 mt-1">
                        {addressDetailsError}
                      </p>
                    )}
                    {addressSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-md max-h-60 overflow-auto">
                        {addressSuggestions.map((suggestion) => (
                          <li key={suggestion.place_id}>
                            <button
                              type="button"
                              onClick={() => handleSelectAddressPlace(suggestion)}
                              className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-muted transition-colors"
                            >
                              <span className="block font-medium text-theme-primary">
                                {suggestion.main_text}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {suggestion.secondary_text}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione um endereço da lista para preencher os campos
                      automaticamente.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                      Rua *
                    </label>
                    <Input
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      required
                      placeholder="Nome da rua"
                      className="focus:border-theme-accent text-sm sm:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                        Número *
                      </label>
                      <Input
                        name="street_number"
                        value={formData.street_number}
                        onChange={handleInputChange}
                        required
                        placeholder="123"
                        className="focus:border-theme-accent text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                        Complemento
                      </label>
                      <Input
                        name="address_details"
                        value={formData.address_details}
                        onChange={handleInputChange}
                        placeholder="Apto, Bloco, etc"
                        className="focus:border-theme-accent text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                      Bairro *
                    </label>
                    <Input
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      required
                      placeholder="Bairro"
                      className="focus:border-theme-accent text-sm sm:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                        Cidade *
                      </label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Sua cidade"
                        className="focus:border-theme-accent text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                        Estado *
                      </label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        placeholder="UF"
                        maxLength={2}
                        className="focus:border-theme-accent text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                        CEP *
                      </label>
                      <div className="relative">
                        <Input
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleZipCodeChange}
                          required
                          placeholder="00000-000"
                          inputMode="numeric"
                          maxLength={9}
                          className="focus:border-theme-accent text-sm sm:text-base pr-8"
                        />
                        {cepLoading && (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                      Telefone *
                    </label>
                    <Input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                      placeholder="11 9876-54321"
                      maxLength={14}
                      className="focus:border-theme-accent text-sm sm:text-base"
                    />
                  </div>

                  {shippingState.status === "needs_selection" && (
                    <AddressSuggestionPicker
                      message={shippingState.message}
                      suggestions={shippingState.suggestions}
                      onSelect={handleSelectAddressSuggestion}
                    />
                  )}

                  <div className="rounded-md border border-border bg-muted/40 p-3 sm:p-4 space-y-3">
                    <OrderTotalSummary
                      productsSubtotal={productsSubtotal}
                      freight={freight}
                      shippingState={shippingState}
                      compact
                    />
                    <ShippingStatus
                      state={shippingState}
                      quoteExpired={quoteExpired}
                      onRefresh={refreshQuote}
                    />
                  </div>

                  <div className="rounded-md border border-border bg-muted/40 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium text-theme-primary">
                      Pagamento via PIX
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Após finalizar, você receberá o QR Code e o código copia e
                      cola para pagar no app do seu banco.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full btn-theme-primary py-2 sm:py-3 text-sm sm:text-lg"
                  >
                    {isSubmitting
                      ? "Processando..."
                      : shippingState.status === "loading"
                      ? "Calculando frete..."
                      : shippingState.status !== "ready" || quoteExpired
                      ? "Preencha o endereço para calcular o frete"
                      : `Finalizar Compra - ${formatCurrency(orderTotal)} (${items.length} produtos)`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-static">
              <CardHeader className="bg-muted/60 border-b border-border p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg text-theme-primary">
                  Dados de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="text-center py-6 sm:py-8">
                  <h2 className="text-lg sm:text-xl font-bold text-theme-primary mb-3 sm:mb-4">
                    Faça login para finalizar a compra
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-2">
                    Você precisa estar logado para finalizar sua compra. Crie
                    uma conta gratuitamente ou faça login se já tiver uma.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <Button
                      onClick={() => router.push("/login")}
                      className="btn-theme-primary w-full sm:w-auto"
                    >
                      Fazer Login
                    </Button>
                    <Button
                      onClick={() => router.push("/register")}
                      variant="outline"
                      className="w-full sm:w-auto rounded-[10px] border-border bg-transparent text-foreground hover:bg-[var(--bg-secondary)]"
                    >
                      Criar Conta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
