export type CepAddress = {
  street: string;
  district: string;
  city: string;
  state: string;
};

/**
 * Looks a CEP up on ViaCEP (public, CORS-enabled). Returns null when the CEP
 * doesn't exist. City-wide CEPs (e.g. 45810-000, Porto Seguro) come back with
 * an empty street and district, so callers must only fill what is present.
 * Throws on network failure so the caller can tell "not found" from "offline".
 */
export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
  if (!response.ok) {
    throw new Error(`ViaCEP respondeu ${response.status}`);
  }

  const data = await response.json();
  if (!data || data.erro) {
    return null;
  }

  return {
    street: String(data.logradouro ?? "").trim(),
    district: String(data.bairro ?? "").trim(),
    city: String(data.localidade ?? "").trim(),
    state: String(data.uf ?? "").trim().toUpperCase(),
  };
}
