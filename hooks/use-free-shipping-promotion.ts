"use client";

import { useEffect, useState } from "react";
import {
  fetchFreeShippingPromotion,
  INACTIVE_FREE_SHIPPING_PROMOTION,
  type FreeShippingPromotion,
} from "@/lib/promotions";

export function useFreeShippingPromotion(): FreeShippingPromotion {
  const [promotion, setPromotion] = useState<FreeShippingPromotion>(
    INACTIVE_FREE_SHIPPING_PROMOTION,
  );

  useEffect(() => {
    let cancelled = false;

    fetchFreeShippingPromotion()
      .then((data) => {
        if (!cancelled) {
          setPromotion(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPromotion(INACTIVE_FREE_SHIPPING_PROMOTION);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return promotion;
}
