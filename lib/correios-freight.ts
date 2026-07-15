import { API_BASE_URL } from "@/lib/api";

export interface CorreiosQuoteItem {
  pharmacy_product_id: string;
  amount: number;
}

export interface CorreiosQuoteOption {
  provider: "correios";
  service_code: string;
  service_name: string;
  price_cents: number;
  price_formatted: string;
  delivery_days: number | null;
  estimated_delivery_date: string | null;
}

export function isValidCep(cep: string): boolean {
  return cep.replace(/\D/g, "").length === 8;
}

export async function fetchCorreiosQuotes(
  destinationCep: string,
  items: CorreiosQuoteItem[],
  signal?: AbortSignal,
): Promise<CorreiosQuoteOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/shipping/correios/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination_cep: destinationCep, items }),
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && (data.message as string)) ||
      "Não foi possível calcular o frete. Tente novamente.";
    throw new Error(message);
  }

  return (data?.data ?? []) as CorreiosQuoteOption[];
}
