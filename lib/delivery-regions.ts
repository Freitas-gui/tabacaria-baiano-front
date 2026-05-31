import { API_BASE_URL } from "@/lib/api";

export type DeliveryRegion = {
  id: string;
  name: string;
  price: string;
};

export function parseRegionPrice(price: string): number {
  const normalized = price.replace(",", ".");
  const value = Number.parseFloat(normalized);

  return Number.isFinite(value) ? value : 0;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function findRegionByName(
  regions: DeliveryRegion[],
  name: string,
): DeliveryRegion | undefined {
  const trimmed = name.trim();

  if (!trimmed) {
    return undefined;
  }

  return regions.find(
    (region) => region.name.localeCompare(trimmed, "pt-BR", { sensitivity: "accent" }) === 0,
  );
}

export async function fetchDeliveryRegions(): Promise<DeliveryRegion[]> {
  const response = await fetch(`${API_BASE_URL}/api/delivery-region`);

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error("Não foi possível carregar as regiões de entrega.");
  }

  const json = await response.json();
  const data = Array.isArray(json.data) ? json.data : [];

  return data.filter(
    (item: DeliveryRegion) =>
      item && typeof item.name === "string" && typeof item.price === "string",
  );
}
