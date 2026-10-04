/** Heading of the storefront product list. The unfiltered catalog shows no count. */
export function getProductListTitle({
  searchQuery,
  filterLabel,
  count,
}: {
  searchQuery?: string | null;
  filterLabel?: string | null;
  count: number;
}): string {
  if (searchQuery) return `Resultados da busca: "${searchQuery}" (${count} produtos encontrados)`;
  if (filterLabel) return `Produtos: ${filterLabel} (${count} produtos)`;
  return "Produtos: Todos";
}
