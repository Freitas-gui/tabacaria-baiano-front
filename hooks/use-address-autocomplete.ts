"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAddressSuggestions,
  type PlaceSuggestion,
} from "@/lib/address-api";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 500;

export function useAddressAutocomplete(
  query: string,
  sessionToken?: string | null,
) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      fetchAddressSuggestions(trimmed, sessionToken ?? undefined, controller.signal)
        .then((results) => {
          setSuggestions(results);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setSuggestions([]);
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao buscar sugestões de endereço",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sessionToken]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { suggestions, loading, error, clearSuggestions };
}
