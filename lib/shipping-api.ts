import { API_BASE_URL } from "@/lib/api";

export interface ShippingQuoteRequest {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  postal_code: string;
  complement?: string;
  cart_subtotal_cents?: number;
}

export interface ShippingQuoteResponse {
  quote_id: string;
  fee: number;
  fee_cents: number;
  currency: string;
  estimated_pickup_at: string | null;
  estimated_dropoff_at: string | null;
  expires_at: string | null;
  available: boolean;
}

export interface AddressSuggestion {
  address: string;
  detailed_address?: {
    street_address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  latitude?: number;
  longitude?: number;
}

export class ShippingAddressSuggestionsError extends Error {
  readonly suggestions: AddressSuggestion[];
  readonly status = 422;

  constructor(message: string, suggestions: AddressSuggestion[]) {
    super(message);
    this.suggestions = suggestions;
  }
}

export async function fetchShippingQuote(
  params: ShippingQuoteRequest,
): Promise<ShippingQuoteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/delivery/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    if (
      response.status === 422 &&
      data.error === "address_not_found" &&
      Array.isArray(data.suggestions) &&
      data.suggestions.length > 0
    ) {
      throw new ShippingAddressSuggestionsError(
        data.message || "Endereço não encontrado",
        data.suggestions,
      );
    }

    throw Object.assign(
      new Error(data?.error || "Erro ao calcular frete"),
      { status: response.status },
    );
  }

  return response.json();
}
