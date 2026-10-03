import { resolveCdnUrl } from "@/lib/cdn";
import {
  buildPixPaymentPayload,
  isAwaitingPixPayment,
  type PixPaymentPayload,
} from "@/lib/pix-payment";

// ---------------------------------------------------------------------------
// API shape: tabacaria-baiano/app/Http/Resources/V1/OrderResource.php
// ---------------------------------------------------------------------------

export interface ApiOrderProduct {
  id: string;
  amount: number;
  /** Decimal string, e.g. "12.50". */
  price: string;
  pharmacy?: { id: string; name: string } | null;
  product?: {
    id: string;
    name: string;
    slug?: string | null;
    images?: string[];
  } | null;
  variationOption?: { typeName?: string | null; optionName?: string | null } | null;
}

export interface ApiOrder {
  id: string;
  code: string;
  status: string;
  payment_method?: string | null;
  payment_provider?: string | null;
  payment_status?: string | null;
  payment_expires_at?: string | null;
  payment_paid_at?: string | null;
  pix_copy_paste?: string | null;
  pix_qrcode_base64?: string | null;
  address?: {
    street?: string | null;
    street_number?: string | null;
    postal_code?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    address_details?: string | null;
  } | null;
  pharmacy?: { id: string; name: string } | null;
  products?: ApiOrderProduct[];
  total?: string | null;
  price_adjustment?: string | null;
  delivery_method?: string | null;
  delivery_fee?: string | null;
  free_shipping_promotion_fee?: string | number | null;
  coupon_code?: string | null;
  discount_amount?: string | null;
  discount_type?: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Storefront model
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "waiting_confirmation"
  | "confirmed"
  | "out_for_delivery"
  | "delivered"
  | "canceled"
  | "unknown";

export type DeliveryMethod = "delivery" | "pickup" | "shipping";

export interface OrderAddress {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  details: string | null;
}

export interface OrderItem {
  id: string;
  name: string;
  slug: string | null;
  unitPrice: number;
  quantity: number;
  image: string;
  pharmacyName: string | null;
  variation: { typeName: string; optionName: string } | null;
}

export interface CustomerOrder {
  id: string;
  code: string;
  createdAt: string;
  paidAt: string | null;
  status: OrderStatus;
  /** Mirrors the API rule: customers may only cancel while waiting_confirmation. */
  canCancel: boolean;
  deliveryMethod: DeliveryMethod;
  address: OrderAddress | null;
  items: OrderItem[];
  productsSubtotal: number;
  deliveryFee: number;
  /** Original fee waived by the free-shipping promotion, when it applied. */
  freeShippingPromotionFee: number | null;
  discountAmount: number;
  couponCode: string | null;
  couponDiscountType: string | null;
  /** Manual adjustment the store applied to the order (negative = discount). */
  priceAdjustment: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string | null;
  pixPayment: PixPaymentPayload | null;
}

const KNOWN_STATUSES: readonly OrderStatus[] = [
  "waiting_confirmation",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "canceled",
];

const TERMINAL_PAYMENT_STATUSES = new Set([
  "paid",
  "expired",
  "cancelled",
  "canceled",
  "failed",
  "refunded",
]);

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de crédito",
  credit: "Cartão de crédito",
  debit_card: "Cartão de débito",
  debit: "Cartão de débito",
  cash: "Dinheiro",
  dinheiro: "Dinheiro",
  boleto: "Boleto",
};

/** The API sends money as decimal strings ("12.50"); some metadata values are numbers. */
export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** A status the storefront doesn't know yet must not look like (or be cancellable as) a pending order. */
export function parseOrderStatus(raw: string | null | undefined): OrderStatus {
  return KNOWN_STATUSES.find((status) => status === raw) ?? "unknown";
}

export function parseDeliveryMethod(raw: string | null | undefined): DeliveryMethod {
  return raw === "pickup" || raw === "shipping" ? raw : "delivery";
}

export function isTerminalPaymentStatus(status: string | null | undefined): boolean {
  return !!status && TERMINAL_PAYMENT_STATUSES.has(status.toLowerCase());
}

function mapAddress(address: ApiOrder["address"]): OrderAddress | null {
  if (!address?.street) return null;
  return {
    street: address.street,
    number: address.street_number ?? "",
    district: address.district ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    postalCode: address.postal_code ?? "",
    details: address.address_details?.trim() || null,
  };
}

export function hasFreeShipping(
  order: Pick<CustomerOrder, "couponDiscountType" | "freeShippingPromotionFee">,
): boolean {
  return order.couponDiscountType === "free_shipping" || order.freeShippingPromotionFee !== null;
}

export function mapApiOrder(api: ApiOrder): CustomerOrder {
  const items: OrderItem[] = (api.products ?? []).map((product) => ({
    id: product.id,
    name: product.product?.name || "Produto",
    slug: product.product?.slug || null,
    unitPrice: parseMoney(product.price),
    quantity: product.amount || 0,
    image: resolveCdnUrl(product.product?.images?.[0]) || "/placeholder.svg",
    pharmacyName: product.pharmacy?.name || api.pharmacy?.name || null,
    variation: product.variationOption?.optionName
      ? {
          typeName: product.variationOption.typeName || "Opção",
          optionName: product.variationOption.optionName,
        }
      : null,
  }));

  const status = parseOrderStatus(api.status);
  const productsSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = parseMoney(api.delivery_fee);
  const promotionFee = api.free_shipping_promotion_fee;
  const freeShippingPromotionFee =
    promotionFee === null || promotionFee === undefined || promotionFee === ""
      ? null
      : parseMoney(promotionFee);
  const discountAmount = parseMoney(api.discount_amount);
  const priceAdjustment = parseMoney(api.price_adjustment);
  const couponDiscountType = api.discount_type ?? null;
  const serverTotal = Number.parseFloat(api.total ?? "");
  const localTotal = Math.max(
    0,
    productsSubtotal +
      priceAdjustment +
      (hasFreeShipping({ couponDiscountType, freeShippingPromotionFee }) ? 0 : deliveryFee) -
      discountAmount,
  );

  return {
    id: api.id,
    code: api.code,
    createdAt: api.created_at,
    paidAt: api.payment_paid_at ?? null,
    status,
    canCancel: status === "waiting_confirmation",
    deliveryMethod: parseDeliveryMethod(api.delivery_method),
    address: mapAddress(api.address),
    items,
    productsSubtotal,
    deliveryFee,
    freeShippingPromotionFee,
    discountAmount,
    couponCode: api.coupon_code ?? null,
    couponDiscountType,
    priceAdjustment,
    // The backend total is the source of truth: it includes the store's manual adjustment.
    total: Number.isFinite(serverTotal) ? serverTotal : localTotal,
    paymentMethod: PAYMENT_METHOD_LABELS[api.payment_method ?? ""] ?? api.payment_method ?? "",
    paymentStatus: api.payment_status ?? null,
    // A canceled order must never offer a PIX to pay, whatever the payment status says.
    pixPayment:
      status === "waiting_confirmation" && isAwaitingPixPayment(api)
        ? buildPixPaymentPayload(api)
        : null,
  };
}

/** Falls back to the PIX the checkout kept in sessionStorage while the API doesn't expose it. */
export function withStoredPix(
  order: CustomerOrder,
  stored: PixPaymentPayload | null,
): CustomerOrder {
  if (order.pixPayment || !stored) return order;
  if (order.status !== "waiting_confirmation" || isTerminalPaymentStatus(order.paymentStatus)) {
    return order;
  }
  return { ...order, pixPayment: stored };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const DAY_MONTH_FORMAT = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const TIME_FORMAT = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "3 de out. de 2026, 13:10" */
export function formatOrderDate(iso: string | null | undefined): string {
  const date = parseDate(iso);
  return date ? DATE_TIME_FORMAT.format(date) : "";
}

/** "3 de out. · 13:10" */
export function formatOrderDateShort(iso: string | null | undefined): string {
  const date = parseDate(iso);
  return date ? `${DAY_MONTH_FORMAT.format(date)} · ${TIME_FORMAT.format(date)}` : "";
}

/** "3 de out., 13:22" */
export function formatPaidAt(iso: string | null | undefined): string {
  const date = parseDate(iso);
  return date ? `${DAY_MONTH_FORMAT.format(date)}, ${TIME_FORMAT.format(date)}` : "";
}

/** Milliseconds until `expiresAt` (negative once past); null when there is no usable date. */
export function getRemainingMs(expiresAt: string | null | undefined, now: number): number | null {
  const date = parseDate(expiresAt);
  return date ? date.getTime() - now : null;
}

/** "46:12" under an hour, "1h05" above; null once the time is up. */
export function formatCountdown(ms: number): string | null {
  if (ms <= 0) return null;
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** "46 min", "1 h 5 min", "menos de 1 min"; null once the time is up. */
export function formatRemainingMinutes(ms: number): string | null {
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "menos de 1 min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : raw;
}

function streetLine(address: OrderAddress): string {
  return address.number ? `${address.street}, ${address.number}` : address.street;
}

function areaLine(address: OrderAddress, citySeparator: string): string {
  const place = [address.city, address.state].filter(Boolean).join(citySeparator);
  return [address.district, place].filter(Boolean).join(", ");
}

/** Up to three lines: street (+ complement), area, CEP. */
export function formatAddressLines(address: OrderAddress): string[] {
  return [
    [streetLine(address), address.details].filter(Boolean).join(" · "),
    areaLine(address, " – "),
    address.postalCode ? `CEP ${formatCep(address.postalCode)}` : "",
  ].filter(Boolean);
}

/** "Avenida dos Navegantes, 1234 - Centro, Porto Seguro - BA" */
export function formatAddressInline(address: OrderAddress): string {
  return [streetLine(address), areaLine(address, " - ")].filter(Boolean).join(" - ");
}
