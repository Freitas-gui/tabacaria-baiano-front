export const CDN_ORIGIN =
  process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, "") ??
  "https://d2abfyoj6wwhix.cloudfront.net";

export function resolveCdnUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("/file/")) {
      return `${CDN_ORIGIN}${trimmed}`;
    }
    return trimmed;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/*/, "")}`;
  }
  return `${CDN_ORIGIN}/${trimmed.replace(/^\/*/, "")}`;
}
