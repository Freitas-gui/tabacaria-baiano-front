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
  /** Manual adjustment set by the store on the order (negative = discount). */
  priceAdjustment?: number;
  /** Total already calculated by the backend; when given, it wins over the local math. */
  total?: number;
};

/** Same math the summary displays; the backend recalculates on order creation. */
export function computeOrderTotal({
  productsSubtotal,
  freight,
  discountAmount = 0,
  freeShipping = false,
  priceAdjustment = 0,
}: Pick<
  OrderTotalSummaryProps,
  "productsSubtotal" | "freight" | "discountAmount" | "freeShipping" | "priceAdjustment"
>): number {
  const effectiveFreight = freeShipping ? 0 : freight;
  return Math.max(0, productsSubtotal + priceAdjustment + effectiveFreight - discountAmount);
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
  priceAdjustment = 0,
  total: totalFromServer,
}: OrderTotalSummaryProps) {
  const total =
    totalFromServer ??
    computeOrderTotal({ productsSubtotal, freight, discountAmount, freeShipping, priceAdjustment });

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex justify-between items-center text-sm sm:text-base">
        <span className="text-muted-foreground">Subtotal dos produtos</span>
        <span className="text-sm font-semibold text-theme-primary">
          {formatCurrency(productsSubtotal)}
        </span>
      </div>
      {showFreight && (
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-muted-foreground">
            Frete
            {selectedRegionName ? ` (${selectedRegionName})` : ""}
          </span>
          <span className="text-sm font-semibold text-theme-primary">
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
        <p className="text-xs sm:text-sm text-emerald-700">
          Faltam {formatCurrency(freeShippingRemaining)} para ganhar frete grátis.
        </p>
      )}
      {priceAdjustment !== 0 && (
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-muted-foreground">Ajuste da loja</span>
          <span
            className={`text-sm font-semibold ${
              priceAdjustment < 0 ? "text-emerald-700" : "text-theme-primary"
            }`}
          >
            {priceAdjustment < 0 ? "-" : "+"}
            {formatCurrency(Math.abs(priceAdjustment))}
          </span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-muted-foreground">
            Desconto{discountCode ? ` (${discountCode})` : ""}
          </span>
          <span className="text-sm font-semibold text-emerald-700">
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
