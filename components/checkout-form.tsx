"use client";

import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/cdn";
import { cn } from "@/lib/utils";
import { getProductPath } from "@/lib/product-slug";
import {
  formatBrazilianPhone,
  isValidBrazilianPhone,
  unmaskPhone,
} from "@/lib/phone";
import { storePixPaymentForOrder } from "@/lib/pix-payment";
import { DeliveryRegionField } from "@/components/delivery-region-field";
import {
  DeliveryMethodOptions,
  type DeliveryMethod,
  type DeliveryMethodOption,
} from "@/components/delivery-method-options";
import { OrderTotalSummary, computeOrderTotal } from "@/components/order-total-summary";
import { useDeliveryRegions } from "@/hooks/use-delivery-regions";
import { useFreeShippingPromotion } from "@/hooks/use-free-shipping-promotion";
import { formatCep, isValidCep } from "@/lib/correios-freight";
import { withNext } from "@/lib/safe-redirect";
import { STORE_INFO } from "@/lib/store-info";
import { lookupCep } from "@/lib/viacep";
import {
  formatCurrency,
  parseRegionPrice,
} from "@/lib/delivery-regions";

const NATIONAL_SHIPPING_FLAT_FEE = 35;
const FIND_CEP_URL = "https://buscacepinter.correios.com.br/app/endereco/index.php";

// White fill so editable fields don't read as disabled on the cream card, and an
// explicit 16px on mobile so iOS Safari doesn't zoom in on focus.
const fieldClassName = "bg-card text-base md:text-base focus:border-theme-accent";
const invalidFieldClassName = "border-destructive focus:border-destructive";
const labelClassName = "block text-xs sm:text-sm font-medium text-theme-primary mb-1";

type FieldKey =
  | "district"
  | "zipCode"
  | "street"
  | "street_number"
  | "city"
  | "state"
  | "phone";
type FieldErrors = Partial<Record<FieldKey, string>>;

type CepStatus = "idle" | "loading" | "found" | "partial" | "not_found" | "error";

const FIELD_IDS: Record<FieldKey, string> = {
  district: "checkout-district",
  zipCode: "checkout-zip",
  street: "checkout-street",
  street_number: "checkout-street-number",
  city: "checkout-city",
  state: "checkout-state",
  phone: "checkout-phone",
};

/** Laravel validation keys → the field that shows the message. */
const SERVER_FIELD_KEYS: Record<string, FieldKey> = {
  phone: "phone",
  "address.street": "street",
  "address.street_number": "street_number",
  "address.district": "district",
  "address.city": "city",
  "address.state": "state",
  "address.postal_code": "zipCode",
};

function fieldIdFor(key: FieldKey, method: DeliveryMethod): string {
  // Local delivery picks the district from the region list instead of typing it.
  if (key === "district" && method === "delivery") {
    return "checkout-region";
  }
  return FIELD_IDS[key];
}

/** Splits an order-creation error payload into per-field messages and the rest. */
function readServerErrors(data: unknown): { fields: FieldErrors; messages: string[] } {
  const fields: FieldErrors = {};
  const messages: string[] = [];
  const payload = (data ?? {}) as { errors?: unknown; message?: unknown };
  const errors = payload.errors;

  if (Array.isArray(errors)) {
    messages.push(...errors.filter((error): error is string => typeof error === "string"));
  } else if (errors && typeof errors === "object") {
    for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
      const text = String(Array.isArray(value) ? value[0] : value);
      const field = SERVER_FIELD_KEYS[key];
      if (field) {
        fields[field] = text;
      } else {
        messages.push(text);
      }
    }
  } else if (typeof errors === "string" && errors) {
    messages.push(errors);
  }

  if (messages.length === 0 && Object.keys(fields).length === 0 && typeof payload.message === "string") {
    messages.push(payload.message);
  }

  return { fields, messages };
}

function scrollToElement(element: HTMLElement | null) {
  if (!element) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-xs sm:text-sm text-destructive">
      {message}
    </p>
  );
}

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
  const { items, updateQuantity, removeFromCart, restoreItem, getTotalPrice, clearCart } =
    useCart();
  const { user } = useUser();
  const router = useRouter();
  const { regions, loading: loadingRegions, error: regionsError, getRegionByName } =
    useDeliveryRegions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
  // Digits of the last CEP sent to ViaCEP, so a saved address isn't overwritten on load.
  const lastLookedUpCep = useRef("");
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
      lastLookedUpCep.current = (user.address.postal_code || "").replace(/\D/g, "");
      setFormData({
        email: user.email,
        phone: formatBrazilianPhone(user.phone || ""),
        street: user.address.street || "",
        street_number: user.address.street_number || "",
        address_details: user.address.address_details || "",
        district: user.address.district || "",
        city: user.address.city || "",
        state: user.address.state || "",
        zipCode: formatCep(user.address.postal_code || ""),
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

  // Preview of the free-shipping promotion; the backend recalculates it on order creation.
  const freeShippingPromotion = useFreeShippingPromotion();
  const promotionCoversMethod =
    freeShippingPromotion.active &&
    deliveryMethod !== "pickup" &&
    freeShippingPromotion.deliveryMethods.includes(deliveryMethod);
  const promotionShortfall = promotionCoversMethod
    ? Math.max(
        0,
        (freeShippingPromotion.minOrderAmountCents ?? 0) -
          Math.round((productsSubtotal - discountAmount) * 100),
      ) / 100
    : 0;
  const isFreeShippingPromotion = promotionCoversMethod && promotionShortfall === 0;
  const isFreeShipping = isFreeShippingCoupon || isFreeShippingPromotion;
  const freeShippingRemaining =
    promotionCoversMethod && !isFreeShipping ? promotionShortfall : undefined;

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

  // Fills the address from the CEP. Street/city/UF are overwritten because a new
  // CEP means a new address; the district is only auto-filled for national
  // shipping, while local delivery uses the region list (matched when possible).
  useEffect(() => {
    if (deliveryMethod === "pickup") {
      return;
    }

    const digits = formData.zipCode.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepStatus("idle");
      return;
    }
    if (digits === lastLookedUpCep.current) {
      return;
    }

    lastLookedUpCep.current = digits;
    const controller = new AbortController();
    let settled = false;
    setCepStatus("loading");

    lookupCep(digits, controller.signal)
      .then((address) => {
        settled = true;
        if (!address) {
          setCepStatus("not_found");
          return;
        }

        const region =
          deliveryMethod === "delivery" && address.district
            ? getRegionByName(address.district)
            : undefined;

        setFormData((current) => ({
          ...current,
          street: address.street || current.street,
          city: address.city || current.city,
          state: address.state || current.state,
          district:
            deliveryMethod === "shipping"
              ? address.district || current.district
              : current.district || region?.name || "",
        }));
        setErrors((current) => {
          const next = { ...current };
          delete next.zipCode;
          if (address.street) delete next.street;
          if (address.city) delete next.city;
          if (address.state) delete next.state;
          if (deliveryMethod === "shipping" ? address.district : region) delete next.district;
          return next;
        });
        setCepStatus(address.street ? "found" : "partial");
      })
      .catch(() => {
        settled = true;
        if (controller.signal.aborted) return;
        // Let the same CEP be retried on the next edit.
        lastLookedUpCep.current = "";
        setCepStatus("error");
      });

    return () => {
      if (!settled) {
        controller.abort();
        lastLookedUpCep.current = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.zipCode, deliveryMethod]);

  const clearFieldError = (key: string) => {
    if (!(key in FIELD_IDS)) return;
    setErrors((current) => {
      if (!current[key as FieldKey]) return current;
      const next = { ...current };
      delete next[key as FieldKey];
      return next;
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    clearFieldError(name);
    setFormData({
      ...formData,
      [name]:
        name === "zipCode"
          ? formatCep(value)
          : name === "state"
            ? value.toUpperCase()
            : value,
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearFieldError("phone");
    setFormData({
      ...formData,
      phone: formatBrazilianPhone(e.target.value),
    });
  };

  const handleRegionChange = (regionName: string) => {
    clearFieldError("district");
    setFormData((current) => ({
      ...current,
      district: regionName,
    }));
  };

  const handleDeliveryMethodChange = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    setErrors({});
    setFormError(null);
  };

  const handleDecrease = (item: CartItem, index: number) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
      return;
    }

    removeFromCart(item.id);
    toast("Item removido do carrinho", {
      description: item.name,
      duration: 6000,
      action: {
        label: "Desfazer",
        onClick: () => restoreItem(item, index),
      },
    });
  };

  const getAvailableStock = (item: CartItem): number | null => {
    const stock =
      productStocks[item.id] ?? (item as CartItem & { stock?: number | null }).stock;
    return stock === undefined || stock === null ? null : stock;
  };

  const showFieldErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next)[0] as FieldKey | undefined;
    if (first) {
      requestAnimationFrame(() =>
        scrollToElement(document.getElementById(fieldIdFor(first, deliveryMethod))),
      );
    }
  };

  const showFormError = (message: string) => {
    setFormError(message);
    requestAnimationFrame(() => scrollToElement(formErrorRef.current));
  };

  // Insertion order follows the on-screen order, so the first key is the first
  // field the customer sees.
  const validateForm = (): FieldErrors => {
    const next: FieldErrors = {};

    if (deliveryMethod !== "pickup") {
      if (deliveryMethod === "delivery" && !selectedRegion) {
        next.district = "Escolha a região de entrega.";
      }
      if (!isValidCep(formData.zipCode)) {
        next.zipCode = "Informe o CEP com 8 dígitos.";
      }
      if (!formData.street.trim()) {
        next.street = "Informe a rua.";
      }
      if (!formData.street_number.trim()) {
        next.street_number = "Informe o número. Se não tiver, use S/N.";
      }
      if (deliveryMethod === "shipping" && !formData.district.trim()) {
        next.district = "Informe o bairro.";
      }
      if (!formData.city.trim()) {
        next.city = "Informe a cidade.";
      }
      if (!/^[A-Za-z]{2}$/.test(formData.state.trim())) {
        next.state = "Informe a UF com 2 letras.";
      }
    }

    if (!isValidBrazilianPhone(formData.phone)) {
      next.phone = "Informe um telefone com DDD.";
    }

    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user || !user.accessToken) {
      showFormError("Sua sessão expirou. Entre na sua conta de novo para finalizar.");
      return;
    }

    const unavailableItem = items.find((item) => !item.pharmacyProductId);
    if (unavailableItem) {
      showFormError(
        `"${unavailableItem.name}" não está mais disponível. Remova o item do carrinho e adicione de novo.`,
      );
      return;
    }

    const overStock = items.filter((item) => {
      const stock = getAvailableStock(item);
      return stock !== null && item.quantity > stock;
    });
    if (overStock.length > 0) {
      const [only] = overStock;
      showFormError(
        overStock.length > 1
          ? "Alguns itens têm menos unidades em estoque do que no carrinho. Ajuste os itens marcados para continuar."
          : getAvailableStock(only) === 0
            ? `"${only.name}" esgotou. Remova o item para continuar.`
            : `"${only.name}" tem menos unidades em estoque do que no carrinho. Diminua a quantidade para continuar.`,
      );
      return;
    }

    const fieldErrors = validateForm();
    if (Object.keys(fieldErrors).length > 0) {
      showFieldErrors(fieldErrors);
      return;
    }

    setErrors({});
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
          // Without it Laravel answers auth failures with an HTML redirect instead of JSON.
          Accept: "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        showFormError("Sua sessão expirou. Entre na sua conta de novo para finalizar a compra.");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok || !data) {
        const { fields, messages } = readServerErrors(data);
        if (Object.keys(fields).length > 0) {
          showFieldErrors(fields);
          if (messages.length > 0) setFormError(messages.join("\n"));
        } else {
          showFormError(
            messages.join("\n") || "Não foi possível criar o pedido. Tente de novo.",
          );
        }
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
      router.push("/pedidos");
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error creating order:", error);
      showFormError("Não conseguimos falar com o servidor. Confira sua conexão e tente de novo.");
      setIsSubmitting(false);
    }
  };

  // Free-shipping preview per option; the backend recalculates on order creation.
  const subtotalAfterDiscountCents = Math.round((productsSubtotal - discountAmount) * 100);
  const isFreeFor = (method: DeliveryMethod) =>
    (isFreeShippingCoupon && method === deliveryMethod) ||
    (method !== "pickup" &&
      freeShippingPromotion.active &&
      freeShippingPromotion.deliveryMethods.includes(method) &&
      subtotalAfterDiscountCents >= (freeShippingPromotion.minOrderAmountCents ?? 0));

  const deliveryOptions: DeliveryMethodOption[] = [
    {
      value: "delivery",
      title: "Entrega local",
      description: "Porto Seguro e região. O frete depende do bairro.",
      price: isFreeFor("delivery")
        ? "Grátis"
        : selectedRegion
          ? formatCurrency(parseRegionPrice(selectedRegion.price))
          : "Pelo bairro",
    },
    {
      value: "pickup",
      title: "Retirar na loja",
      description: STORE_INFO.addressLine1,
      price: "Grátis",
    },
    {
      value: "shipping",
      title: "Envio nacional",
      description: "Para qualquer endereço do Brasil, com taxa fixa.",
      price: isFreeFor("shipping") ? "Grátis" : formatCurrency(NATIONAL_SHIPPING_FLAT_FEE),
    },
  ];

  const orderTotal = computeOrderTotal({
    productsSubtotal,
    freight,
    discountAmount,
    freeShipping: isFreeShipping,
  });
  // Without a region the freight is still unknown, so don't promise an amount yet.
  const totalIsKnown = deliveryMethod !== "delivery" || Boolean(selectedRegion);

  const fieldProps = (key: FieldKey) => {
    const id = fieldIdFor(key, deliveryMethod);
    const message = errors[key];
    return {
      id,
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? `${id}-error` : undefined,
      className: cn(fieldClassName, message && invalidFieldClassName),
    };
  };

  const cepHint: Record<CepStatus, string | null> = {
    idle: null,
    loading: "Buscando endereço…",
    found: "Endereço preenchido pelo CEP. Confira e informe o número.",
    partial: "Esse é o CEP geral da cidade. Preencha a rua.",
    not_found: "Não encontramos esse CEP. Confira os números ou preencha o endereço.",
    error: "Não foi possível buscar o CEP agora. Preencha o endereço.",
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

  const zipProps = fieldProps("zipCode");
  const zipHint = cepHint[cepStatus];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
        <button
          type="button"
          onClick={() => {
            router.push("/");
            window.scrollTo(0, 0);
          }}
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-muted-foreground hover:text-theme-primary hover:bg-muted/60 transition-colors"
          aria-label="Voltar para a tela inicial"
          title="Voltar para a tela inicial"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary">
          Finalizar Compra
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mt-4 sm:mt-8">
        {/* Cart Items */}
        <div>
          <Card className="card-static">
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {items.map((item, index) => {
                  const availableStock = getAvailableStock(item);
                  const isMaxReached =
                    availableStock !== null && item.quantity >= availableStock;
                  const isOverStock =
                    availableStock !== null && item.quantity > availableStock;

                  return (
                    <div key={item.id} className="p-3 sm:p-4 border rounded">
                      <Link
                        href={getProductPath(item)}
                        className="block font-medium text-theme-primary text-xs sm:text-sm line-clamp-2 hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.variationOptionName && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full border border-border bg-muted text-theme-primary">
                          {item.variationTypeName
                            ? `${item.variationTypeName}: `
                            : ""}
                          {item.variationOptionName}
                        </span>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        <Link
                          href={getProductPath(item)}
                          className="flex-shrink-0 aspect-square bg-gray-50 rounded overflow-hidden"
                        >
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
                        </Link>

                        <div className="flex flex-1 min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 whitespace-nowrap">
                            <p className="text-base sm:text-lg font-bold text-theme-primary">
                              {formatCurrency(parseRegionPrice(item.price) * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-xs sm:text-sm text-theme-secondary">
                                {formatCurrency(parseRegionPrice(item.price))} cada
                              </p>
                            )}
                          </div>

                          <div className="flex flex-shrink-0 items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDecrease(item, index)}
                              aria-label={
                                item.quantity === 1
                                  ? `Remover ${item.name} do carrinho`
                                  : `Diminuir quantidade de ${item.name}`
                              }
                              className="text-theme-secondary hover:bg-muted h-8 w-8 p-0"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                            </Button>
                            <span className="w-6 sm:w-8 text-center text-sm" aria-live="polite">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={isMaxReached}
                              aria-label={`Aumentar quantidade de ${item.name}`}
                              className="text-theme-secondary hover:bg-muted h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {isMaxReached && availableStock !== null && (
                        <p
                          className={cn(
                            "mt-2 text-xs sm:text-sm",
                            isOverStock ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {availableStock === 0
                            ? "Esgotado. Remova o item para continuar."
                            : isOverStock
                            ? `Só ${availableStock} em estoque. Diminua a quantidade.`
                            : availableStock === 1
                              ? "Última unidade em estoque."
                              : `Só ${availableStock} em estoque.`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator className="my-3 sm:my-4" />

              <div className="space-y-2 mb-3 sm:mb-4">
                <label
                  htmlFor="checkout-coupon"
                  className="block text-xs sm:text-sm font-medium text-theme-primary"
                >
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
                        id="checkout-coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => {
                          // The coupon lives outside the <form>, so Enter does nothing by default.
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder="Código do cupom"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        enterKeyHint="done"
                        className={fieldClassName}
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
                freeShipping={isFreeShipping}
                freeShippingRemaining={freeShippingRemaining}
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
                  Entrega e pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-3 sm:space-y-4 mt-2 sm:mt-4"
                >
                  <DeliveryMethodOptions
                    options={deliveryOptions}
                    value={deliveryMethod}
                    onChange={handleDeliveryMethodChange}
                    disabled={isSubmitting}
                  />

                  {deliveryMethod !== "pickup" ? (
                    <>
                      <p className="pt-1 text-sm font-medium text-theme-primary">
                        Endereço para entrega
                      </p>

                      {deliveryMethod === "delivery" && (
                        <DeliveryRegionField
                          id="checkout-region"
                          regions={regions}
                          value={formData.district}
                          onChange={handleRegionChange}
                          loading={loadingRegions}
                          error={regionsError ?? errors.district ?? null}
                          disabled={isSubmitting}
                          selectClassName={cn("bg-card", errors.district && invalidFieldClassName)}
                        />
                      )}

                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <label htmlFor="checkout-zip" className={labelClassName}>
                            CEP *
                          </label>
                          <a
                            href={FIND_CEP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-theme-accent underline-offset-2 hover:underline"
                          >
                            Não sei meu CEP
                          </a>
                        </div>
                        <Input
                          {...zipProps}
                          aria-describedby={
                            [zipProps["aria-describedby"], zipHint ? "checkout-zip-hint" : null]
                              .filter(Boolean)
                              .join(" ") || undefined
                          }
                          autoComplete="postal-code"
                          inputMode="numeric"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          required
                          placeholder="00000-000"
                        />
                        <FieldError id="checkout-zip" message={errors.zipCode} />
                        {zipHint && !errors.zipCode && (
                          <p
                            id="checkout-zip-hint"
                            aria-live="polite"
                            className="mt-1 text-xs sm:text-sm text-muted-foreground"
                          >
                            {zipHint}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="checkout-street" className={labelClassName}>
                          Rua *
                        </label>
                        <Input
                          {...fieldProps("street")}
                          autoComplete="address-line1"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          required
                          placeholder="Nome da rua"
                        />
                        <FieldError id="checkout-street" message={errors.street} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label htmlFor="checkout-street-number" className={labelClassName}>
                            Número *
                          </label>
                          <Input
                            {...fieldProps("street_number")}
                            autoComplete="off"
                            name="street_number"
                            value={formData.street_number}
                            onChange={handleInputChange}
                            required
                            placeholder="123"
                          />
                          <FieldError id="checkout-street-number" message={errors.street_number} />
                        </div>
                        <div>
                          <label htmlFor="checkout-address-details" className={labelClassName}>
                            Complemento
                          </label>
                          <Input
                            id="checkout-address-details"
                            autoComplete="address-line2"
                            name="address_details"
                            value={formData.address_details}
                            onChange={handleInputChange}
                            placeholder="Apto, bloco"
                            className={fieldClassName}
                          />
                        </div>
                      </div>

                      {deliveryMethod === "shipping" && (
                        <div>
                          <label htmlFor="checkout-district" className={labelClassName}>
                            Bairro *
                          </label>
                          <Input
                            {...fieldProps("district")}
                            autoComplete="address-level3"
                            name="district"
                            value={formData.district}
                            onChange={handleInputChange}
                            required
                            placeholder="Seu bairro"
                          />
                          <FieldError id="checkout-district" message={errors.district} />
                        </div>
                      )}

                      <div className="grid grid-cols-[1fr_5.5rem] gap-3 sm:gap-4">
                        <div>
                          <label htmlFor="checkout-city" className={labelClassName}>
                            Cidade *
                          </label>
                          <Input
                            {...fieldProps("city")}
                            autoComplete="address-level2"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            placeholder="Sua cidade"
                          />
                          <FieldError id="checkout-city" message={errors.city} />
                        </div>
                        <div>
                          <label htmlFor="checkout-state" className={labelClassName}>
                            UF *
                          </label>
                          <Input
                            {...fieldProps("state")}
                            autoComplete="address-level1"
                            autoCapitalize="characters"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                            placeholder="BA"
                            maxLength={2}
                          />
                          <FieldError id="checkout-state" message={errors.state} />
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
                          {promotionCoversMethod && freeShippingPromotion.minOrderAmountCents && (
                            <p className="text-xs sm:text-sm text-green-600 mt-1">
                              Grátis em compras a partir de{" "}
                              {formatCurrency(freeShippingPromotion.minOrderAmountCents / 100)}.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-md border border-border bg-muted/40 p-3 sm:p-4 text-xs sm:text-sm">
                      <p className="font-medium text-theme-primary">Onde retirar</p>
                      <p className="text-muted-foreground mt-1">
                        {STORE_INFO.addressLine1}
                        <br />
                        {STORE_INFO.addressLine2}
                      </p>
                      <p className="text-muted-foreground mt-2">
                        {STORE_INFO.hoursWeekdays}
                        <br />
                        {STORE_INFO.hoursSaturday}
                      </p>
                      <a
                        href={STORE_INFO.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-theme-accent underline-offset-2 hover:underline"
                      >
                        Ver no mapa
                      </a>
                    </div>
                  )}

                  <div>
                    <label htmlFor="checkout-phone" className={labelClassName}>
                      Telefone *
                    </label>
                    <Input
                      {...fieldProps("phone")}
                      autoComplete="tel-national"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                      placeholder="(73) 99999-9999"
                    />
                    <FieldError id="checkout-phone" message={errors.phone} />
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
                      freeShipping={isFreeShipping}
                      freeShippingRemaining={freeShippingRemaining}
                      showFreight={deliveryMethod !== "pickup"}
                      compact
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-theme-primary">Pagamento</p>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      PIX. Depois de confirmar, você recebe o QR Code e o código copia e
                      cola. O pedido é confirmado assim que o pagamento cair.
                    </p>
                  </div>

                  {formError && (
                    <div
                      ref={formErrorRef}
                      tabIndex={-1}
                      role="alert"
                      className="whitespace-pre-line rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive focus:outline-none"
                    >
                      {formError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full btn-theme-primary py-2 sm:py-3 text-sm sm:text-lg"
                  >
                    {isSubmitting
                      ? "Gerando seu PIX…"
                      : totalIsKnown
                        ? `Gerar PIX de ${formatCurrency(orderTotal)}`
                        : "Gerar PIX"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-static">
              <CardHeader className="bg-muted/60 border-b border-border p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg text-theme-primary">
                  Entrega e pagamento
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
                      onClick={() => router.push(withNext("/login", "/checkout"))}
                      className="btn-theme-primary w-full sm:w-auto"
                    >
                      Fazer Login
                    </Button>
                    <Button
                      onClick={() => router.push(withNext("/register", "/checkout"))}
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
