import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatAddressInline,
  formatAddressLines,
  formatCep,
  formatCountdown,
  formatOrderDate,
  formatOrderDateShort,
  formatRemainingMinutes,
  getRemainingMs,
  type OrderAddress,
} from "@/lib/orders";

// `pnpm test` runs with TZ=America/Bahia (UTC-3).
const ISO = "2026-10-03T16:10:00.000000Z";

const NOW_2026 = Date.parse("2026-10-04T12:00:00Z");

test("order dates use pt-BR short months and local time", () => {
  assert.equal(formatOrderDate(ISO), "3 de out. de 2026 às 13:10");
  assert.equal(formatOrderDateShort(ISO, NOW_2026), "3 de out., 13:10");
});

test("short dates add the year only outside the current year", () => {
  assert.equal(formatOrderDateShort("2025-09-12T10:05:00Z", NOW_2026), "12 de set. de 2025, 07:05");
});

test("invalid or missing dates format as empty strings", () => {
  assert.equal(formatOrderDate("not a date"), "");
  assert.equal(formatOrderDateShort(null), "");
});

test("getRemainingMs measures time left and ignores missing or invalid dates", () => {
  const now = Date.parse("2026-10-03T16:00:00Z");
  assert.equal(getRemainingMs("2026-10-03T16:01:00Z", now), 60_000);
  assert.equal(getRemainingMs("2026-10-03T15:59:00Z", now), -60_000);
  assert.equal(getRemainingMs(null, now), null);
  assert.equal(getRemainingMs("garbage", now), null);
});

test("formatCountdown shows mm:ss under an hour and XhYY above", () => {
  assert.equal(formatCountdown((46 * 60 + 12) * 1000), "46:12");
  assert.equal(formatCountdown(999), "00:01");
  assert.equal(formatCountdown(65 * 60 * 1000), "1h05");
  assert.equal(formatCountdown(0), null);
  assert.equal(formatCountdown(-5), null);
});

test("formatRemainingMinutes rounds down to whole minutes", () => {
  assert.equal(formatRemainingMinutes(46.5 * 60 * 1000), "46 min");
  assert.equal(formatRemainingMinutes(30 * 1000), "menos de 1 min");
  assert.equal(formatRemainingMinutes(65 * 60 * 1000), "1 h 5 min");
  assert.equal(formatRemainingMinutes(120 * 60 * 1000), "2 h");
  assert.equal(formatRemainingMinutes(0), null);
});

test("formatCep masks 8 digits and leaves anything else alone", () => {
  assert.equal(formatCep("45810000"), "45810-000");
  assert.equal(formatCep("45810-000"), "45810-000");
  assert.equal(formatCep("123"), "123");
});

const address: OrderAddress = {
  street: "Avenida dos Navegantes",
  number: "1234",
  district: "Centro",
  city: "Porto Seguro",
  state: "BA",
  postalCode: "45810000",
  details: "Apto 302",
};

test("formatAddressLines splits street, area and CEP", () => {
  assert.deepEqual(formatAddressLines(address), [
    "Avenida dos Navegantes, 1234 · Apto 302",
    "Centro, Porto Seguro – BA",
    "CEP 45810-000",
  ]);
  assert.deepEqual(
    formatAddressLines({ ...address, number: "", details: null, district: "", postalCode: "" }),
    ["Avenida dos Navegantes", "Porto Seguro – BA"],
  );
});

test("formatAddressInline keeps the one-line format used in WhatsApp", () => {
  assert.equal(
    formatAddressInline(address),
    "Avenida dos Navegantes, 1234 - Centro, Porto Seguro - BA",
  );
});
