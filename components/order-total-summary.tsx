"use client";

import { formatCurrency } from "@/lib/delivery-regions";
import { Separator } from "@/components/ui/separator";

type OrderTotalSummaryProps = {
  productsSubtotal: number;
  freight: number;
  selectedRegionName?: string;
  compact?: boolean;
};

export function OrderTotalSummary({
  productsSubtotal,
  freight,
  selectedRegionName,
  compact = false,
}: OrderTotalSummaryProps) {
  const total = productsSubtotal + freight;

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
          Frete
          {selectedRegionName ? ` (${selectedRegionName})` : ""}
        </span>
        <span className="font-medium text-theme-primary">
          {freight > 0 ? formatCurrency(freight) : "—"}
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
