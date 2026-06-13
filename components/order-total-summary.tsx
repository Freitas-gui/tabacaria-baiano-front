"use client";

import { formatCurrency } from "@/lib/delivery-regions";
import { Separator } from "@/components/ui/separator";

type ShippingStateLike =
  | { status: "idle" | "loading" | "unavailable" | "error" | "expired" | "needs_selection" }
  | { status: "ready"; quote: { fee: number } };

type OrderTotalSummaryProps = {
  productsSubtotal: number;
  freight: number;
  /** Optional: raw region name for display (orders page legacy) */
  selectedRegionName?: string;
  /** Optional: shipping quote state for checkout */
  shippingState?: ShippingStateLike;
  compact?: boolean;
};

function freightLabel(
  shippingState: ShippingStateLike | undefined,
  selectedRegionName: string | undefined,
): string {
  if (shippingState) {
    if (shippingState.status === "loading") return "Calculando...";
    if (shippingState.status === "unavailable") return "Indisponível";
    if (shippingState.status === "error") return "Erro";
    if (shippingState.status === "needs_selection") return "Selecione o endereço";
    if (shippingState.status === "ready") return "Uber Direct";
  }
  if (selectedRegionName) return selectedRegionName;
  return "";
}

export function OrderTotalSummary({
  productsSubtotal,
  freight,
  selectedRegionName,
  shippingState,
  compact = false,
}: OrderTotalSummaryProps) {
  const total = productsSubtotal + freight;
  const label = freightLabel(shippingState, selectedRegionName);

  const isCalculating = shippingState?.status === "loading";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex justify-between items-center text-sm sm:text-base">
        <span className="text-muted-foreground">Subtotal dos produtos</span>
        <span className="font-medium text-theme-primary">
          {formatCurrency(productsSubtotal)}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm sm:text-base">
        <span className="text-muted-foreground">
          Frete{label ? ` (${label})` : ""}
        </span>
        <span className="font-medium text-theme-primary">
          {isCalculating
            ? "..."
            : freight > 0
            ? formatCurrency(freight)
            : "—"}
        </span>
      </div>
      <Separator />
      <div className="flex justify-between items-center text-base sm:text-xl font-bold">
        <span className="text-theme-primary">Total</span>
        <span className="price text-lg sm:text-2xl">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
