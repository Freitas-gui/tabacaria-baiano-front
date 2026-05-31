export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProductSlug(product: {
  slug?: string | null;
  name: string;
}): string {
  const slug = product.slug?.trim();
  if (slug) {
    return slugify(slug);
  }
  return slugify(product.name);
}

export function getProductPath(product: {
  slug?: string | null;
  name: string;
}): string {
  return `/produto/${getProductSlug(product)}`;
}
