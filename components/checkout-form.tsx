"use client";

import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Minus, Plus, Trash2 } from "lucide-react";
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
import { DeliveryRegionField } from "@/components/delivery-region-field";
import { OrderTotalSummary } from "@/components/order-total-summary";
import { useDeliveryRegions } from "@/hooks/use-delivery-regions";
import { isValidCep } from "@/lib/correios-freight";
import {
  formatCurrency,
  parseRegionPrice,
} from "@/lib/delivery-regions";

const NATIONAL_SHIPPING_FLAT_FEE = 35;

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

export function CheckoutForm() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } =
    useCart();
  const { user } = useUser();
  const router = useRouter();
  const { regions, loading: loadingRegions, error: regionsError, getRegionByName } =
    useDeliveryRegions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup" | "shipping">("delivery");
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

  useEffect(() => {
    if (
      deliveryMethod !== "delivery" ||
      loadingRegions ||
      regions.length === 0 ||
      !formData.district
    ) {
      return;
    }

    const matchedRegion = getRegionByName(formData.district);

    if (matchedRegion && matchedRegion.name !== formData.district) {
      setFormData((current) => ({
        ...current,
        district: matchedRegion.name,
      }));
      return;
    }

    if (!matchedRegion) {
      setFormData((current) => ({
        ...current,
        district: "",
      }));
    }
  }, [deliveryMethod, loadingRegions, regions, formData.district, getRegionByName]);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string | null;
    discountAmount: number;
    eligibleSubtotal: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const skipNextCouponRevalidation = useRef(false);

  const productsSubtotal = getTotalPrice();
  const selectedRegion = getRegionByName(formData.district);

  const freight =
    deliveryMethod === "pickup"
      ? 0
      : deliveryMethod === "shipping"
        ? NATIONAL_SHIPPING_FLAT_FEE
        : selectedRegion
          ? parseRegionPrice(selectedRegion.price)
          : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount / 100 : 0;
  const isFreeShippingCoupon = appliedCoupon?.discountType === "free_shipping";
  const effectiveFreight = isFreeShippingCoupon ? 0 : freight;
  const orderTotal = Math.max(0, productsSubtotal + effectiveFreight - discountAmount);

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

  const validateCoupon = useCallback(
    async (code: string) => {
      const couponItems = items
        .filter((item) => item.pharmacyProductId)
        .map((item) => ({
          pharmacy_product_id: item.pharmacyProductId,
          amount: item.quantity,
        }));

      if (couponItems.length === 0) {
        setAppliedCoupon(null);
        setCouponError("Não foi possível validar o cupom para os itens do carrinho.");
        return;
      }

      setCouponLoading(true);
      setCouponError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user?.accessToken
              ? { Authorization: `Bearer ${user.accessToken}` }
              : {}),
          },
          body: JSON.stringify({
            code,
            items: couponItems,
            payment_method: "pix",
            city: deliveryMethod === "pickup" ? undefined : formData.city || undefined,
          }),
        });

        const data = await response.json();

        if (response.ok && data.valid) {
          setAppliedCoupon({
            code: data.code,
            discountType: data.discount_type ?? null,
            discountAmount: data.discount_amount ?? 0,
            eligibleSubtotal: data.eligible_subtotal ?? 0,
            message: data.message,
          });
          setCouponError(null);
        } else {
          setAppliedCoupon(null);
          setCouponError(data.message || "Cupom inválido.");
        }
      } catch (error) {
        console.error("Error validating coupon:", error);
        setAppliedCoupon(null);
        setCouponError("Erro ao validar cupom. Tente novamente.");
      } finally {
        setCouponLoading(false);
      }
    },
    [items, formData.city, user, deliveryMethod],
  );

  const applyCouponCode = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return;
      skipNextCouponRevalidation.current = true;
      setCouponCode(normalized);
      validateCoupon(normalized);
    },
    [validateCoupon],
  );

  const handleApplyCoupon = () => applyCouponCode(couponCode);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  useEffect(() => {
    if (!appliedCoupon) return;
    if (skipNextCouponRevalidation.current) {
      skipNextCouponRevalidation.current = false;
      return;
    }
    validateCoupon(appliedCoupon.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, formData.city, selectedRegion?.name, freight, deliveryMethod]);

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

  const handleRegionChange = (regionName: string) => {
    setFormData((current) => ({
      ...current,
      district: regionName,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.accessToken) {
      alert("Erro: usuário não autenticado");
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

    if (deliveryMethod === "delivery" && !selectedRegion) {
      alert("Selecione uma região de entrega válida.");
      return;
    }

    if (deliveryMethod === "shipping" && !isValidCep(formData.zipCode)) {
      alert("Informe um CEP válido para o envio.");
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
        delivery_method: deliveryMethod,
        delivery_fee: freight,
        ...(deliveryMethod !== "pickup"
          ? {
              address: {
                street: formData.street,
                street_number: formData.street_number,
                address_details: formData.address_details || "",
                district: deliveryMethod === "delivery" ? selectedRegion!.name : formData.district,
                city: formData.city,
                state: formData.state,
                postal_code: formData.zipCode,
              },
            }
          : {}),
        products: products,
        ...(appliedCoupon ? { coupon_code: appliedCoupon.code } : {}),
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
        setAppliedCoupon(null);
        setCouponCode("");
        router.push(`/pedidos?orderId=${createdOrderId}`);
        setIsSubmitting(false);
        return;
      }

      clearCart();
      setAppliedCoupon(null);
      setCouponCode("");
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

              <div className="space-y-2 mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-theme-primary">
                  Cupom de desconto
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 p-2 sm:p-3">
                    <span className="text-xs sm:text-sm font-medium text-green-600">
                      Cupom {appliedCoupon.code} aplicado
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="h-8"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Digite o código do cupom"
                        className="focus:border-theme-accent text-sm sm:text-base"
                        disabled={couponLoading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="shrink-0"
                      >
                        {couponLoading ? "Aplicando..." : "Aplicar"}
                      </Button>
                    </div>
                  </>
                )}
                {couponError && (
                  <p className="text-xs sm:text-sm text-red-600">{couponError}</p>
                )}
              </div>

              <OrderTotalSummary
                productsSubtotal={productsSubtotal}
                freight={freight}
                selectedRegionName={
                  deliveryMethod === "delivery"
                    ? selectedRegion?.name
                    : deliveryMethod === "shipping"
                      ? "Envio nacional"
                      : undefined
                }
                discountAmount={discountAmount}
                discountCode={appliedCoupon?.code}
                freeShipping={isFreeShippingCoupon}
                showFreight={deliveryMethod !== "pickup"}
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
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-theme-primary">Como deseja receber?</p>
                    {(
                      [
                        { value: "delivery", label: "Entrega local (Porto Seguro)" },
                        { value: "pickup", label: "Retirar na loja" },
                        { value: "shipping", label: "Envio nacional" },
                      ] as const
                    ).map((option) => (
                      <label
                        key={option.value}
                        htmlFor={`delivery-method-${option.value}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Switch
                          id={`delivery-method-${option.value}`}
                          checked={deliveryMethod === option.value}
                          onCheckedChange={(checked) => {
                            if (checked) setDeliveryMethod(option.value);
                          }}
                        />
                        <span className="text-sm text-theme-primary">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {deliveryMethod !== "pickup" ? (
                    <>
                    <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                      Endereço para entrega:
                    </label>
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

                      {deliveryMethod === "delivery" ? (
                        <DeliveryRegionField
                          id="checkout-region"
                          regions={regions}
                          value={formData.district}
                          onChange={handleRegionChange}
                          loading={loadingRegions}
                          error={regionsError}
                          disabled={isSubmitting}
                        />
                      ) : (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-theme-primary mb-1">
                            Bairro *
                          </label>
                          <Input
                            name="district"
                            value={formData.district}
                            onChange={handleInputChange}
                            required
                            placeholder="Seu bairro"
                            className="focus:border-theme-accent text-sm sm:text-base"
                          />
                        </div>
                      )}

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
                          <Input
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            required
                            placeholder="00000-000"
                            className="focus:border-theme-accent text-sm sm:text-base"
                          />
                        </div>
                      </div>

                      {deliveryMethod === "shipping" && (
                        <div className="rounded-md border border-border bg-muted/40 p-3 sm:p-4">
                          <p className="text-xs sm:text-sm font-medium text-theme-primary">
                            Frete do envio nacional
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Taxa fixa de {formatCurrency(NATIONAL_SHIPPING_FLAT_FEE)} para qualquer
                            endereço no Brasil.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-md border border-border bg-muted/40 p-3 sm:p-4">
                      <p className="text-xs sm:text-sm font-medium text-theme-primary">
                        Retirar na loja
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Rua Dona Candi, 46, bairro Pacatá
                        <br />
                        Porto Seguro — BA, CEP 45810-000
                      </p>
                    </div>
                  )}

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

                  <div className="rounded-md border border-border bg-muted/40 p-3 sm:p-4 space-y-3">
                    <OrderTotalSummary
                      productsSubtotal={productsSubtotal}
                      freight={freight}
                      selectedRegionName={
                        deliveryMethod === "delivery"
                          ? selectedRegion?.name
                          : deliveryMethod === "shipping"
                            ? "Envio nacional"
                            : undefined
                      }
                      discountAmount={discountAmount}
                      discountCode={appliedCoupon?.code}
                      freeShipping={isFreeShippingCoupon}
                      showFreight={deliveryMethod !== "pickup"}
                      compact
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
                    disabled={
                      isSubmitting ||
                      (deliveryMethod === "delivery" &&
                        (loadingRegions || !selectedRegion))
                    }
                    className="w-full btn-theme-primary py-2 sm:py-3 text-sm sm:text-lg"
                  >
                    {isSubmitting
                      ? "Processando..."
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
