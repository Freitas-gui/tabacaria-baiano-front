import { test } from "node:test";
import assert from "node:assert/strict";
import { getProductListTitle } from "@/lib/product-list-title";

test("the unfiltered catalog shows no product count", () => {
  assert.equal(getProductListTitle({ count: 268 }), "Produtos: Todos");
});

test("a category filter keeps its count", () => {
  assert.equal(getProductListTitle({ filterLabel: "Sedas", count: 12 }), "Produtos: Sedas (12 produtos)");
});

test("a search keeps its count", () => {
  assert.equal(
    getProductListTitle({ searchQuery: "isqueiro", filterLabel: "Sedas", count: 3 }),
    'Resultados da busca: "isqueiro" (3 produtos encontrados)',
  );
});
