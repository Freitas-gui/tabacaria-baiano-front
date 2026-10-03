import { test } from "node:test";
import assert from "node:assert/strict";
import { hasFreeShipping, mapApiOrder, withStoredPix } from "@/lib/orders";
import { apiOrder, PENDING_PIX } from "@/lib/orders.fixtures";

test("mapApiOrder parses prices, items and totals", () => {
  const order = mapApiOrder(apiOrder());
  assert.equal(order.code, "1002ab3k9z");
  assert.equal(order.items.length, 2);
  assert.deepEqual(
    { ...order.items[0], image: undefined },
    {
      id: "op1",
      name: "Seda Smoking Brown",
      slug: "seda-smoking",
      unitPrice: 12.5,
      quantity: 2,
      image: undefined,
      pharmacyName: "Tabacaria do Baiano",
      variation: { typeName: "Tamanho", optionName: "King Size" },
    },
  );
  assert.match(order.items[0].image, /^https:\/\/.+\/file\/a\.png$/);
  assert.equal(order.items[1].image, "/placeholder.svg");
  assert.equal(order.items[1].slug, null);
  assert.equal(order.items[1].variation, null);
  assert.equal(order.productsSubtotal, 42.5);
  assert.equal(order.deliveryFee, 8);
  assert.equal(order.total, 50.5);
  assert.equal(order.paymentMethod, "PIX");
  assert.equal(order.paidAt, "2026-10-03T16:22:00+00:00");
});

test("mapApiOrder falls back to a local total only when the API has none", () => {
  assert.equal(
    mapApiOrder(apiOrder({ total: undefined, price_adjustment: "-5.00", discount_amount: "2.00" })).total,
    43.5,
  );
  assert.equal(mapApiOrder(apiOrder({ total: undefined, discount_type: "free_shipping" })).total, 42.5);
  assert.equal(mapApiOrder(apiOrder({ total: "40.00" })).total, 40);
});

test("mapApiOrder keeps the raw status and treats unknown ones as unknown", () => {
  assert.equal(mapApiOrder(apiOrder({ status: "out_for_delivery" })).status, "out_for_delivery");
  const unknown = mapApiOrder(apiOrder({ status: "preparing" }));
  assert.equal(unknown.status, "unknown");
  assert.equal(unknown.canCancel, false);
  assert.equal(mapApiOrder(apiOrder({ status: "waiting_confirmation" })).canCancel, true);
});

test("mapApiOrder reads the delivery method, defaulting to local delivery", () => {
  assert.equal(mapApiOrder(apiOrder({ delivery_method: "shipping" })).deliveryMethod, "shipping");
  assert.equal(mapApiOrder(apiOrder({ delivery_method: "pickup" })).deliveryMethod, "pickup");
  assert.equal(mapApiOrder(apiOrder({ delivery_method: null })).deliveryMethod, "delivery");
  assert.equal(mapApiOrder(apiOrder({ delivery_method: "drone" })).deliveryMethod, "delivery");
});

test("mapApiOrder maps the address and trims the complement", () => {
  assert.deepEqual(mapApiOrder(apiOrder()).address, {
    street: "Avenida dos Navegantes",
    number: "1234",
    district: "Centro",
    city: "Porto Seguro",
    state: "BA",
    postalCode: "45810000",
    details: "Apto 302",
  });
  assert.equal(mapApiOrder(apiOrder({ address: null })).address, null);
  assert.equal(mapApiOrder(apiOrder({ address: { street: null } })).address, null);
});

test("mapApiOrder exposes a PIX only while the order waits for confirmation", () => {
  const waiting = mapApiOrder(apiOrder(PENDING_PIX));
  assert.equal(waiting.pixPayment?.brCode, "000201PIXDEMO");
  assert.equal(waiting.pixPayment?.expiresAt, "2026-10-03T16:47:00+00:00");
  assert.equal(mapApiOrder(apiOrder({ ...PENDING_PIX, status: "canceled" })).pixPayment, null);
});

test("mapApiOrder survives an order without products", () => {
  const empty = mapApiOrder(apiOrder({ products: [], total: undefined }));
  assert.deepEqual(empty.items, []);
  assert.equal(empty.productsSubtotal, 0);
  const missing = mapApiOrder(apiOrder({ products: undefined }));
  assert.deepEqual(missing.items, []);
  const nullProduct = mapApiOrder(
    apiOrder({ products: [{ id: "op9", amount: 1, price: "5.00", product: null }] }),
  );
  assert.equal(nullProduct.items[0].name, "Produto");
});

test("withStoredPix uses the checkout's PIX only for a payable order", () => {
  const stored = { brCode: "STORED", expiresAt: "2026-10-03T17:00:00Z" };
  const waitingWithoutPix = mapApiOrder(apiOrder({ status: "waiting_confirmation", payment_status: "pending" }));
  assert.equal(withStoredPix(waitingWithoutPix, stored).pixPayment?.brCode, "STORED");
  assert.equal(withStoredPix(waitingWithoutPix, null).pixPayment, null);

  const canceled = mapApiOrder(apiOrder({ status: "canceled", payment_status: "pending" }));
  assert.equal(withStoredPix(canceled, stored).pixPayment, null);

  const expired = mapApiOrder(apiOrder({ status: "waiting_confirmation", payment_status: "expired" }));
  assert.equal(withStoredPix(expired, stored).pixPayment, null);

  const fromApi = mapApiOrder(apiOrder(PENDING_PIX));
  assert.equal(withStoredPix(fromApi, stored).pixPayment?.brCode, "000201PIXDEMO");
});

test("hasFreeShipping covers coupons and the free-shipping promotion", () => {
  assert.equal(hasFreeShipping(mapApiOrder(apiOrder())), false);
  assert.equal(hasFreeShipping(mapApiOrder(apiOrder({ discount_type: "free_shipping" }))), true);
  assert.equal(hasFreeShipping(mapApiOrder(apiOrder({ free_shipping_promotion_fee: "8.00" }))), true);
});
