import { API_BASE_URL } from "@/lib/api";

export interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function fetchAddressSuggestions(
  query: string,
  sessionToken?: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({ q: query });
  if (sessionToken) params.set("session_token", sessionToken);

  const response = await fetch(
    `${API_BASE_URL}/api/address/autocomplete?${params.toString()}`,
    { signal },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(data?.error || "Erro ao buscar sugestões de endereço"),
      { status: response.status },
    );
  }

  const data = await response.json();
  return Array.isArray(data?.suggestions) ? data.suggestions : [];
}

export async function fetchAddressDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceDetails> {
  const params = new URLSearchParams({ place_id: placeId });
  if (sessionToken) params.set("session_token", sessionToken);

  const response = await fetch(
    `${API_BASE_URL}/api/address/details?${params.toString()}`,
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(data?.error || "Erro ao buscar detalhes do endereço"),
      { status: response.status },
    );
  }

  return response.json();
}
