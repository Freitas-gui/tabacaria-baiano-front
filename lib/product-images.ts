import { resolveCdnUrl } from "@/lib/cdn";

function pushResolved(out: string[], value: string) {
  const resolved = resolveCdnUrl(value);
  if (resolved) out.push(resolved);
}

export function extractProductImageUrls(p: Record<string, unknown>): string[] {
  const out: string[] = [];
  const pushFromArray = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    for (const it of arr) {
      if (typeof it === "string" && it) {
        pushResolved(out, it);
        continue;
      }
      if (
        it &&
        typeof it === "object" &&
        typeof (it as { url?: string }).url === "string"
      ) {
        pushResolved(out, (it as { url: string }).url);
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
    const resolved = resolveCdnUrl(p.image);
    return resolved ? [resolved] : [];
  }
  if (typeof p.images === "string" && p.images) {
    const resolved = resolveCdnUrl(p.images);
    return resolved ? [resolved] : [];
  }

  return [];
}
