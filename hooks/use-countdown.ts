"use client";

import { useEffect, useState } from "react";
import { getRemainingMs } from "@/lib/orders";

/**
 * Milliseconds left until `expiresAt` (≤ 0 once past, null without a date),
 * re-rendering every `intervalMs` while time is left.
 */
export function useCountdown(expiresAt: string | null | undefined, intervalMs = 1000): number | null {
  const [now, setNow] = useState(() => Date.now());
  const remaining = getRemainingMs(expiresAt, now);
  const running = remaining !== null && remaining > 0;

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(interval);
  }, [running, intervalMs]);

  return remaining;
}
