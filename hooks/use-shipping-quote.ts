"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchShippingQuote,
  ShippingAddressSuggestionsError,
  type ShippingQuoteRequest,
  type ShippingQuoteResponse,
  type AddressSuggestion,
} from "@/lib/shipping-api";

export type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; quote: ShippingQuoteResponse }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string }
  | { status: "expired" }
  | { status: "needs_selection"; suggestions: AddressSuggestion[]; message: string };

function isAddressComplete(params: Partial<ShippingQuoteRequest>): params is ShippingQuoteRequest {
  return !!(
    params.street &&
    params.number &&
    params.district &&
    params.city &&
    params.state &&
    params.state.length === 2 &&
    params.postal_code
  );
}

export function useShippingQuote(params: Partial<ShippingQuoteRequest>, enabled = true) {
  const [state, setState] = useState<QuoteState>({ status: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paramsKey = JSON.stringify(params);
  const prevKeyRef = useRef<string>("");

  const doFetch = useCallback((req: ShippingQuoteRequest) => {
    setState({ status: "loading" });

    fetchShippingQuote(req)
      .then((quote) => {
        setState({ status: "ready", quote });
      })
      .catch((err) => {
        if (err instanceof ShippingAddressSuggestionsError) {
          setState({ status: "needs_selection", suggestions: err.suggestions, message: err.message });
        } else if ((err as { status?: number }).status === 503) {
          setState({ status: "unavailable", message: "Entrega indisponível para este endereço" });
        } else if ((err as { status?: number }).status === 422) {
          setState({ status: "unavailable", message: err.message });
        } else {
          setState({ status: "error", message: err.message });
        }
      });
  }, []);

  const refresh = useCallback(() => {
    if (!enabled || !isAddressComplete(params)) {
      setState({ status: "idle" });
      return;
    }
    doFetch(params);
  }, [paramsKey, enabled, doFetch]);

  useEffect(() => {
    if (!enabled) {
      setState({ status: "idle" });
      return;
    }

    if (!isAddressComplete(params)) {
      if (prevKeyRef.current !== paramsKey) {
        setState({ status: "idle" });
      }
      prevKeyRef.current = paramsKey;
      return;
    }

    if (prevKeyRef.current === paramsKey) return;
    prevKeyRef.current = paramsKey;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      doFetch(params as ShippingQuoteRequest);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [paramsKey, enabled, doFetch]);

  const quoteExpired =
    state.status === "ready" &&
    state.quote.expires_at !== null &&
    new Date(state.quote.expires_at) < new Date();

  return { state, quoteExpired, refresh };
}
