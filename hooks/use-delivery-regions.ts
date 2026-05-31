"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchDeliveryRegions,
  findRegionByName,
  type DeliveryRegion,
} from "@/lib/delivery-regions";

export function useDeliveryRegions() {
  const [regions, setRegions] = useState<DeliveryRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchDeliveryRegions()
      .then((data) => {
        if (!cancelled) {
          setRegions(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRegions([]);
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar as regiões de entrega.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const getRegionByName = useCallback(
    (name: string) => findRegionByName(regions, name),
    [regions],
  );

  return {
    regions,
    loading,
    error,
    getRegionByName,
  };
}
