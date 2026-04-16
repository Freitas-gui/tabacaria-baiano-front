export function extractProductImageUrls(p: Record<string, unknown>): string[] {
  const out: string[] = [];
  const pushFromArray = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    for (const it of arr) {
      if (typeof it === "string" && it) {
        out.push(it);
        continue;
      }
      if (
        it &&
        typeof it === "object" &&
        typeof (it as { url?: string }).url === "string"
      ) {
        out.push((it as { url: string }).url);
      }
    }
  };

  pushFromArray(p.images);
  pushFromArray(p.image);
  pushFromArray(p.iamage);

  if (out.length > 0) {
    return out;
  }

  if (typeof p.image === "string" && p.image) {
    return [p.image];
  }
  if (typeof p.images === "string" && p.images) {
    return [p.images];
  }

  return [];
}
