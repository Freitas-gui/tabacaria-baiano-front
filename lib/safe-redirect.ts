/**
 * Returns `next` only when it is an internal path ("/checkout"), so a crafted
 * link like /login?next=https://evil.com or ?next=//evil.com can't send the
 * user off-site after authenticating.
 */
export function getSafeRedirect(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

export function withNext(path: string, next: string | null | undefined): string {
  const safe = getSafeRedirect(next, "");
  return safe ? `${path}?next=${encodeURIComponent(safe)}` : path;
}
