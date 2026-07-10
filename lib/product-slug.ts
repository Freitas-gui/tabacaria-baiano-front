// Mirrors Laravel's Str::slug(): non-allowed characters (e.g. "/", "(", "+")
// are stripped outright, not replaced with a separator, before whitespace is
// collapsed into a single dash. This must stay in sync with the backend's
// getProductBySlug() fallback (Str::slug($product->name)) or lookups break
// for names containing characters like "/" (e.g. "1 1/4").
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, "")
    .replace(/[-\s]+/g, "-")
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
