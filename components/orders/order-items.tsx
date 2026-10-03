import Image from "next/image";
import Link from "next/link";
import { OrderTotalSummary } from "@/components/order-total-summary";
import { formatCurrency } from "@/lib/delivery-regions";
import {
  getFreightLabel,
  hasFreeShipping,
  hasMultipleStores,
  type CustomerOrder,
} from "@/lib/orders";
import { getProductPath } from "@/lib/product-slug";

export function OrderItems({ order }: { order: CustomerOrder }) {
  const showStore = hasMultipleStores(order.items);

  return (
    <section aria-labelledby="order-items-title" className="card card-static p-4">
      <h2 id="order-items-title" className="text-base font-semibold text-theme-primary">
        Itens ({order.items.length})
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-3 py-3 first:pt-0">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              <Image
                src={item.image}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={getProductPath({ slug: item.slug, name: item.name })}
                className="line-clamp-2 break-words text-label font-medium leading-5 text-theme-primary underline-offset-2 hover:underline"
              >
                {item.name}
              </Link>
              {item.variation && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.variation.typeName}: {item.variation.optionName}
                </p>
              )}
              {showStore && item.pharmacyName && (
                <p className="mt-0.5 text-xs text-muted-foreground">Loja: {item.pharmacyName}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="whitespace-nowrap text-label text-muted-foreground">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </span>
                <span className="price whitespace-nowrap text-sm">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-1 border-t border-border pt-4">
        <OrderTotalSummary
          productsSubtotal={order.productsSubtotal}
          freight={order.freeShippingPromotionFee ?? order.deliveryFee}
          selectedRegionName={getFreightLabel(order)}
          discountAmount={order.discountAmount}
          discountCode={order.couponCode ?? undefined}
          freeShipping={hasFreeShipping(order)}
          showFreight={order.deliveryMethod !== "pickup"}
          priceAdjustment={order.priceAdjustment}
          total={order.total}
        />
      </div>
    </section>
  );
}
