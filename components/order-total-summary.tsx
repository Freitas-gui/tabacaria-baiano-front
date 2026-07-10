"use client";

import { formatCurrency } from "@/lib/delivery-regions";
import { Separator } from "@/components/ui/separator";

type OrderTotalSummaryProps = {
  productsSubtotal: number;
  freight: number;
  selectedRegionName?: string;
  compact?: boolean;
  discountAmount?: number;
  discountCode?: string | null;
  freeShipping?: boolean;
  showFreight?: boolean;
};

export function OrderTotalSummary({
  productsSubtotal,
  freight,
  selectedRegionName,
  compact = false,
  discountAmount = 0,
  discountCode,
  freeShipping = false,
  showFreight = true,
}: OrderTotalSummaryProps) {
  const effectiveFreight = freeShipping ? 0 : freight;
  const total = Math.max(0, productsSubtotal + effectiveFreight - discountAmount);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex justify-between items-center text-sm sm:text-base">
        <span className="text-muted-foreground">Subtotal dos produtos</span>
        <span className="font-medium text-theme-primary">
          {formatCurrency(productsSubtotal)}
        </span>
      </div>
      {showFreight && (
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-muted-foreground">
            Frete
            {selectedRegionName ? ` (${selectedRegionName})` : ""}
          </span>
          <span className="font-medium text-theme-primary">
            {freeShipping && freight > 0 ? (
              <>
                <span className="line-through text-muted-foreground mr-1">
                  {formatCurrency(freight)}
                </span>
                Grátis
              </>
            ) : freight > 0 ? (
              formatCurrency(freight)
            ) : (
              "—"
            )}
          </span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-muted-foreground">
            Desconto{discountCode ? ` (${discountCode})` : ""}
          </span>
          <span className="font-medium text-green-600">
            -{formatCurrency(discountAmount)}
          </span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between items-center text-base sm:text-xl font-bold">
        <span className="text-theme-primary">Total</span>
        <span className="price text-lg sm:text-2xl">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
