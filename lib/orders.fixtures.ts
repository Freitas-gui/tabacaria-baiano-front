import type { ApiOrder } from "@/lib/orders";

export function apiOrder(overrides: Partial<ApiOrder> = {}): ApiOrder {
  return {
    id: "9d36b84f-1111-4c1a-9f00-aaaaaaaaaaa1",
    code: "1002ab3k9z",
    status: "confirmed",
    payment_method: "pix",
    payment_provider: "abacatepay",
    payment_status: "paid",
    payment_paid_at: "2026-10-03T16:22:00+00:00",
    address: {
      street: "Avenida dos Navegantes",
      street_number: "1234",
      postal_code: "45810000",
      district: "Centro",
      city: "Porto Seguro",
      state: "BA",
      address_details: " Apto 302 ",
    },
    pharmacy: { id: "ph1", name: "Tabacaria do Baiano" },
    products: [
      {
        id: "op1",
        amount: 2,
        price: "12.50",
        pharmacy: { id: "ph1", name: "Tabacaria do Baiano" },
        product: { id: "p1", name: "Seda Smoking Brown", slug: "seda-smoking", images: ["/file/a.png"] },
        variationOption: { typeName: "Tamanho", optionName: "King Size" },
      },
      {
        id: "op2",
        amount: 1,
        price: "17.50",
        pharmacy: { id: "ph1", name: "Tabacaria do Baiano" },
        product: { id: "p2", name: "Isqueiro Clipper", slug: null, images: [] },
        variationOption: null,
      },
    ],
    total: "50.50",
    price_adjustment: "0.00",
    delivery_method: "delivery",
    delivery_fee: "8.00",
    free_shipping_promotion_fee: null,
    coupon_code: null,
    discount_amount: "0.00",
    created_at: "2026-10-03T16:10:00.000000Z",
    ...overrides,
  };
}

export const PENDING_PIX: Partial<ApiOrder> = {
  status: "waiting_confirmation",
  payment_status: "pending",
  payment_paid_at: null,
  pix_copy_paste: "000201PIXDEMO",
  pix_qrcode_base64: "iVBOR",
  payment_expires_at: "2026-10-03T16:47:00+00:00",
};
