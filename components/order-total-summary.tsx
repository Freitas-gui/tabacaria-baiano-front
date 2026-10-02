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
  /** Amount still missing to unlock the free-shipping promotion. */
  freeShippingRemaining?: number;
  showFreight?: boolean;
  /** Shown instead of a price while the freight can't be known yet (e.g. no region picked). */
  freightPendingLabel?: string;
};

/** Same math the summary displays; the backend recalculates on order creation. */
export function computeOrderTotal({
  productsSubtotal,
  freight,
  discountAmount = 0,
  freeShipping = false,
}: Pick<OrderTotalSummaryProps, "productsSubtotal" | "freight" | "discountAmount" | "freeShipping">): number {
  const effectiveFreight = freeShipping ? 0 : freight;
  return Math.max(0, productsSubtotal + effectiveFreight - discountAmount);
}

export function OrderTotalSummary({
  productsSubtotal,
  freight,
  selectedRegionName,
  compact = false,
  discountAmount = 0,
  discountCode,
  freeShipping = false,
  freeShippingRemaining,
  showFreight = true,
  freightPendingLabel,
}: OrderTotalSummaryProps) {
  const total = computeOrderTotal({ productsSubtotal, freight, discountAmount, freeShipping });

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex justify-between items-center text-sm sm:text-base">
        <span className="text-muted-foreground">Subtotal dos produtos</span>
        <span className="text-label font-medium text-theme-primary">
          {formatCurrency(productsSubtotal)}
        </span>
      </div>
      {showFreight && (
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-muted-foreground">
            Frete
            {selectedRegionName ? ` (${selectedRegionName})` : ""}
          </span>
          <span className="text-label font-medium text-theme-primary">
            {freeShipping && freight > 0 ? (
              <>
                <span className="line-through text-muted-foreground mr-1">
                  {formatCurrency(freight)}
                </span>
                Grátis
              </>
            ) : freeShipping ? (
              "Grátis"
            ) : freight > 0 ? (
              formatCurrency(freight)
            ) : freightPendingLabel ? (
              <span className="text-sm font-normal text-muted-foreground">
                {freightPendingLabel}
              </span>
            ) : (
              "—"
            )}
          </span>
        </div>
      )}
      {showFreight && freeShippingRemaining !== undefined && freeShippingRemaining > 0 && (
        <p className="text-xs sm:text-sm text-green-600">
          Faltam {formatCurrency(freeShippingRemaining)} para ganhar frete grátis.
        </p>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-muted-foreground">
            Desconto{discountCode ? ` (${discountCode})` : ""}
          </span>
          <span className="text-label font-medium text-green-600">
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
