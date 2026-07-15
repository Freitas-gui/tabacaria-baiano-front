"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchCorreiosQuotes,
  isValidCep,
  type CorreiosQuoteItem,
  type CorreiosQuoteOption,
} from "@/lib/correios-freight";

const DEBOUNCE_MS = 600;

interface UseCorreiosQuoteArgs {
  enabled: boolean;
  destinationCep: string;
  items: CorreiosQuoteItem[];
}

export function useCorreiosQuote({ enabled, destinationCep, items }: UseCorreiosQuoteArgs) {
  const [quotes, setQuotes] = useState<CorreiosQuoteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const itemsKey = JSON.stringify(items);
  const cepDigits = destinationCep.replace(/\D/g, "");

  useEffect(() => {
    // Any cart/CEP change invalidates the previous selection and quotes.
    setSelectedCode(null);
    setQuotes([]);
    setError(null);

    if (!enabled || !isValidCep(cepDigits) || items.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await fetchCorreiosQuotes(cepDigits, items, controller.signal);
        setQuotes(result);
        setError(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setQuotes([]);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cepDigits, itemsKey]);

  const selectedQuote = quotes.find((q) => q.service_code === selectedCode) ?? null;

  return { quotes, loading, error, selectedCode, setSelectedCode, selectedQuote };
}
