import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCurrency } from "@/lib/delivery-regions";
import {
  buildWhatsAppHelpUrl,
  getCanceledReason,
  getDeliveryMethodLabel,
  getFreightLabel,
  getPaymentSummary,
  getStatusBadge,
  getTimelineSteps,
  getWhatsAppIntro,
  groupOrders,
  hasMultipleStores,
  isActiveOrder,
  isPixExpired,
  mapApiOrder,
  type ApiOrder,
} from "@/lib/orders";
import { apiOrder, PENDING_PIX } from "@/lib/orders.fixtures";

const NOW = Date.parse("2026-10-03T16:00:00Z");
const order = (overrides: Partial<ApiOrder> = {}) => mapApiOrder(apiOrder(overrides));

test("isPixExpired follows the PIX deadline and ignores orders without one", () => {
  assert.equal(isPixExpired(order(PENDING_PIX), NOW), false);
  assert.equal(isPixExpired(order(PENDING_PIX), Date.parse("2026-10-03T16:47:00Z")), true);
  assert.equal(isPixExpired(order({ ...PENDING_PIX, payment_expires_at: null }), NOW), false);
  assert.equal(isPixExpired(order(), NOW), false);
});

test("getStatusBadge gives one label per order", () => {
  const cases: [Partial<ApiOrder>, string, string][] = [
    [PENDING_PIX, "Aguardando pagamento", "amber"],
    [{ ...PENDING_PIX, payment_expires_at: null }, "Aguardando pagamento", "amber"],
    [{ ...PENDING_PIX, payment_expires_at: "2026-10-01T00:00:00Z" }, "PIX expirado", "stone"],
    [{ status: "waiting_confirmation", payment_status: null }, "Aguardando confirmação", "stone"],
    [{ status: "confirmed" }, "Confirmado", "sky"],
    [{ status: "out_for_delivery" }, "Saiu para entrega", "orange"],
    [{ status: "out_for_delivery", delivery_method: "shipping" }, "Enviado", "orange"],
    [{ status: "out_for_delivery", delivery_method: "pickup" }, "Confirmado", "sky"],
    [{ status: "delivered" }, "Entregue", "emerald"],
    [{ status: "delivered", delivery_method: "pickup" }, "Retirado", "emerald"],
    [{ status: "canceled", payment_status: "pending" }, "Cancelado", "red"],
    [{ status: "preparing" }, "Em andamento", "neutral"],
  ];
  for (const [overrides, label, tone] of cases) {
    assert.deepEqual(getStatusBadge(order(overrides), NOW), { label, tone }, JSON.stringify(overrides));
  }
});

test("timeline for local delivery marks done, current and upcoming steps", () => {
  const steps = getTimelineSteps(order({ status: "confirmed" }));
  assert.deepEqual(
    steps.map((step) => [step.label, step.state, step.at]),
    [
      ["Pedido feito", "done", "2026-10-03T16:10:00.000000Z"],
      ["Pagamento confirmado", "done", "2026-10-03T16:22:00+00:00"],
      ["Saiu para entrega", "current", null],
      ["Entregue", "upcoming", null],
    ],
  );
});

test("timeline while waiting has no payment date yet", () => {
  const steps = getTimelineSteps(order(PENDING_PIX));
  assert.deepEqual(steps.map((step) => step.state), ["done", "current", "upcoming", "upcoming"]);
  assert.equal(steps[1].at, null);
});

test("timeline adapts to pickup and national shipping", () => {
  const pickup = getTimelineSteps(order({ status: "delivered", delivery_method: "pickup" }));
  assert.deepEqual(pickup.map((step) => step.label), ["Pedido feito", "Pagamento confirmado", "Retirado"]);
  assert.ok(pickup.every((step) => step.state === "done"));

  const pickupOut = getTimelineSteps(order({ status: "out_for_delivery", delivery_method: "pickup" }));
  assert.deepEqual(pickupOut.map((step) => step.state), ["done", "done", "current"]);

  const shipping = getTimelineSteps(order({ status: "out_for_delivery", delivery_method: "shipping" }));
  assert.deepEqual(shipping.map((step) => step.label), ["Pedido feito", "Pagamento confirmado", "Enviado", "Entregue"]);
  assert.deepEqual(shipping.map((step) => step.state), ["done", "done", "done", "current"]);
});

test("timeline is empty for canceled orders and starts at step one for unknown ones", () => {
  assert.deepEqual(getTimelineSteps(order({ status: "canceled" })), []);
  assert.deepEqual(
    getTimelineSteps(order({ status: "preparing" })).map((step) => step.state),
    ["done", "current", "upcoming", "upcoming"],
  );
});

test("getCanceledReason explains why and what to do", () => {
  assert.equal(getCanceledReason(order({ status: "confirmed" })), null);
  assert.equal(
    getCanceledReason(order({ status: "canceled", payment_status: "expired" })),
    "O PIX não foi pago no prazo e o pedido foi cancelado.",
  );
  assert.equal(
    getCanceledReason(order({ status: "canceled", payment_status: "refunded" })),
    "Este pedido foi cancelado e o pagamento foi estornado.",
  );
  assert.equal(
    getCanceledReason(order({ status: "canceled", payment_status: "paid" })),
    "Este pedido foi cancelado. Se o valor ainda não voltou para sua conta, fale com a loja.",
  );
  assert.equal(getCanceledReason(order({ status: "canceled", payment_status: null })), "Este pedido foi cancelado.");
});

test("delivery and freight labels per method", () => {
  assert.equal(getDeliveryMethodLabel("delivery"), "Entrega local");
  assert.equal(getDeliveryMethodLabel("pickup"), "Retirada na loja");
  assert.equal(getDeliveryMethodLabel("shipping"), "Envio nacional");
  assert.equal(getFreightLabel(order()), "Centro");
  assert.equal(getFreightLabel(order({ delivery_method: "shipping" })), "Envio nacional");
  assert.equal(getFreightLabel(order({ delivery_method: "pickup" })), undefined);
  assert.equal(getFreightLabel(order({ address: null })), undefined);
});

test("hasMultipleStores only when items come from different stores", () => {
  const single = order();
  assert.equal(hasMultipleStores(single.items), false);
  const mixed = order({
    products: [
      ...apiOrder().products!,
      { id: "op3", amount: 1, price: "5.00", pharmacy: { id: "ph2", name: "Outra Loja" }, product: { id: "p3", name: "Piteira" } },
    ],
  });
  assert.equal(hasMultipleStores(mixed.items), true);
});

test("groupOrders splits active and past, keeping the API order", () => {
  const list = [
    order({ id: "a", status: "delivered" }),
    order({ id: "b", status: "waiting_confirmation" }),
    order({ id: "c", status: "canceled" }),
    order({ id: "d", status: "preparing" }),
    order({ id: "e", status: "out_for_delivery" }),
  ];
  const { active, past } = groupOrders(list);
  assert.deepEqual(active.map((o) => o.id), ["b", "d", "e"]);
  assert.deepEqual(past.map((o) => o.id), ["a", "c"]);
  assert.equal(isActiveOrder(list[0]), false);
});

test("getPaymentSummary is one line per payment state", () => {
  assert.equal(getPaymentSummary(order(), NOW), "PIX · pago em 3 de out., 13:22");
  assert.equal(getPaymentSummary(order({ payment_paid_at: null }), NOW), "PIX · pago");
  assert.equal(getPaymentSummary(order(PENDING_PIX), NOW), "PIX · aguardando pagamento");
  assert.equal(getPaymentSummary(order(PENDING_PIX), Date.parse("2026-10-04T00:00:00Z")), "PIX · prazo encerrado");
  assert.equal(getPaymentSummary(order({ status: "canceled", payment_status: "pending" }), NOW), "PIX · não pago");
  assert.equal(getPaymentSummary(order({ status: "canceled", payment_status: "expired" }), NOW), "PIX · expirado");
  assert.equal(getPaymentSummary(order({ payment_status: "refunded" }), NOW), "PIX · estornado");
  assert.equal(getPaymentSummary(order({ payment_status: null }), NOW), "PIX");
});

test("buildWhatsAppHelpUrl prefills the store chat with the order", () => {
  const url = new URL(buildWhatsAppHelpUrl(order()));
  assert.equal(url.origin + url.pathname, "https://api.whatsapp.com/send");
  assert.equal(url.searchParams.get("phone"), "5573991000465");
  const text = url.searchParams.get("text") ?? "";
  assert.ok(text.startsWith("Salve tropa do baiano! Meu pedido foi confirmado. Qual a previsão de entrega?\n"));
  assert.ok(text.includes("Pedido: #1002ab3k9z"));
  assert.ok(text.includes("Status: Confirmado"));
  assert.ok(text.includes("* 2x Seda Smoking Brown"));
  assert.ok(text.includes(`Total: ${formatCurrency(50.5)}`));
  assert.ok(text.includes("📍Endereço de entrega: Avenida dos Navegantes, 1234 - Centro, Porto Seguro - BA"));

  const pickupText = new URL(buildWhatsAppHelpUrl(order({ delivery_method: "pickup", address: null }))).searchParams.get("text") ?? "";
  assert.ok(pickupText.includes("📍Retirada na loja"));
});

test("getWhatsAppIntro asks what the customer needs at each status", () => {
  const G = "Salve tropa do baiano!";
  const cases: [Partial<ApiOrder>, string][] = [
    [PENDING_PIX, `${G} Fiz um pedido e queria ajuda com o pagamento do PIX.`],
    [{ ...PENDING_PIX, payment_expires_at: "2026-10-01T00:00:00Z" }, `${G} O prazo do PIX do meu pedido acabou. Ainda consigo pagar?`],
    [{ status: "waiting_confirmation", payment_status: null }, `${G} Fiz um pedido e queria saber se ele já foi confirmado.`],
    [{ status: "confirmed" }, `${G} Meu pedido foi confirmado. Qual a previsão de entrega?`],
    [{ status: "confirmed", delivery_method: "pickup" }, `${G} Meu pedido foi confirmado. Quando posso retirar na loja?`],
    [{ status: "confirmed", delivery_method: "shipping" }, `${G} Meu pedido foi confirmado. Quando ele vai ser enviado?`],
    [{ status: "out_for_delivery" }, `${G} Meu pedido saiu para entrega. Qual a previsão de chegada?`],
    [{ status: "out_for_delivery", delivery_method: "shipping" }, `${G} Meu pedido foi enviado. Vocês podem me passar o código de rastreio?`],
    [{ status: "out_for_delivery", delivery_method: "pickup" }, `${G} Meu pedido foi confirmado. Quando posso retirar na loja?`],
    [{ status: "delivered" }, `${G} Recebi meu pedido e queria falar sobre ele.`],
    [{ status: "delivered", delivery_method: "pickup" }, `${G} Retirei meu pedido e queria falar sobre ele.`],
    [{ status: "canceled", payment_status: "paid" }, `${G} Meu pedido foi cancelado depois que paguei. Como fica o estorno?`],
    [{ status: "canceled", payment_status: "refunded" }, `${G} Meu pedido foi cancelado e estornado. Queria tirar uma dúvida.`],
    [{ status: "canceled", payment_status: "expired" }, `${G} Meu pedido foi cancelado porque o prazo do PIX acabou. Queria ajuda com ele.`],
    [{ status: "canceled", payment_status: "pending" }, `${G} Meu pedido foi cancelado e queria entender o que aconteceu.`],
    [{ status: "preparing" }, `${G} Gostaria de acompanhar meu pedido.`],
  ];
  for (const [overrides, intro] of cases) {
    assert.equal(getWhatsAppIntro(order(overrides), NOW), intro, JSON.stringify(overrides));
  }
});
