"use client";

import type { CorreiosQuoteOption } from "@/lib/correios-freight";

interface ShippingQuoteOptionsProps {
  quotes: CorreiosQuoteOption[];
  loading: boolean;
  error: string | null;
  cepFilled: boolean;
  selectedCode: string | null;
  onSelect: (code: string) => void;
}

export function ShippingQuoteOptions({
  quotes,
  loading,
  error,
  cepFilled,
  selectedCode,
  onSelect,
}: ShippingQuoteOptionsProps) {
  if (!cepFilled) {
    return (
      <p className="text-xs sm:text-sm text-muted-foreground">
        Informe o CEP para calcular o frete.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-xs sm:text-sm text-muted-foreground">
        Calculando frete nos Correios...
      </p>
    );
  }

  if (error) {
    return <p className="text-xs sm:text-sm text-red-600">{error}</p>;
  }

  if (quotes.length === 0) {
    return (
      <p className="text-xs sm:text-sm text-muted-foreground">
        Nenhuma modalidade de envio disponível para este CEP no momento.
      </p>
    );
  }

  return (
    <div className="space-y-2" role="radiogroup" aria-label="Modalidade de envio">
      {quotes.map((quote) => (
        <label
          key={quote.service_code}
          className={`flex items-center justify-between gap-2 rounded-md border p-2 sm:p-3 cursor-pointer ${
            selectedCode === quote.service_code
              ? "border-theme-accent bg-muted/60"
              : "border-border"
          }`}
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name="shipping-service"
              value={quote.service_code}
              checked={selectedCode === quote.service_code}
              onChange={() => onSelect(quote.service_code)}
            />
            <span className="text-xs sm:text-sm font-medium text-theme-primary">
              {quote.service_name}
            </span>
          </span>
          <span className="text-right">
            <span className="block text-xs sm:text-sm font-bold text-theme-primary">
              {quote.price_formatted}
            </span>
            {quote.delivery_days !== null && (
              <span className="block text-xs text-muted-foreground">
                até {quote.delivery_days} dia(s) úteis
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}
