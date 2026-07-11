import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export type Banner = {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
};

export function useBanners(type: "desktop" | "mobile") {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`${API_BASE_URL}/api/banner?type=${type}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setBanners(Array.isArray(data?.data) ? data.data : []))
      .catch((error) => {
        if (error.name !== "AbortError") setBanners([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [type]);

  return { banners, loading };
}
