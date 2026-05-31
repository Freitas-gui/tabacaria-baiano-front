export const CDN_ORIGIN =
  process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, "") ??
  "https://d2abfyoj6wwhix.cloudfront.net";
