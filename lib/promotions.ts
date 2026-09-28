import { API_BASE_URL } from "@/lib/api";

export type FreeShippingDeliveryMethod = "delivery" | "shipping";

export type FreeShippingPromotion = {
  active: boolean;
  minOrderAmountCents: number | null;
  deliveryMethods: FreeShippingDeliveryMethod[];
};

export const INACTIVE_FREE_SHIPPING_PROMOTION: FreeShippingPromotion = {
  active: false,
  minOrderAmountCents: null,
  deliveryMethods: [],
};

/**
 * Preview only — the order endpoint recalculates free shipping server-side.
 */
export async function fetchFreeShippingPromotion(): Promise<FreeShippingPromotion> {
  const response = await fetch(`${API_BASE_URL}/api/promotions/free-shipping`);

  if (!response.ok) {
    return INACTIVE_FREE_SHIPPING_PROMOTION;
  }

  const json = await response.json();
  const data = json?.data;

  if (!data?.active || typeof data.min_order_amount_cents !== "number") {
    return INACTIVE_FREE_SHIPPING_PROMOTION;
  }

  return {
    active: true,
    minOrderAmountCents: data.min_order_amount_cents,
    deliveryMethods: Array.isArray(data.delivery_methods) ? data.delivery_methods : [],
  };
}
