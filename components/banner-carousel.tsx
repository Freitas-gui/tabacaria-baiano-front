"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useBanners, type Banner } from "@/hooks/use-banners";
import { useIsMobile } from "@/hooks/use-mobile";
import { resolveCdnUrl } from "@/lib/cdn";

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const onChange = () => setPrefersReducedMotion(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
}

function BannerSlide({ banner }: { banner: Banner }) {
  const image = (
    <Image
      src={resolveCdnUrl(banner.imageUrl)}
      alt={banner.title}
      fill
      sizes="100vw"
      className="object-cover rounded-[14px]"
    />
  );

  if (!banner.linkUrl) {
    return <div className="relative h-full w-full">{image}</div>;
  }

  if (banner.linkUrl.startsWith("/")) {
    return (
      <Link href={banner.linkUrl} className="relative block h-full w-full">
        {image}
      </Link>
    );
  }

  return (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block h-full w-full"
    >
      {image}
    </a>
  );
}

export function BannerCarousel() {
  const isMobile = useIsMobile();
  const { banners, loading } = useBanners(isMobile ? "mobile" : "desktop");
  const prefersReducedMotion = usePrefersReducedMotion();
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!loading && banners.length === 0) {
    return null;
  }

  const aspectClass = isMobile ? "aspect-[4/3]" : "aspect-[16/5]";
  const plugins =
    banners.length > 1 && !prefersReducedMotion
      ? [
          Autoplay({
            delay: 5000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]
      : [];

  return (
    <div className="mb-6 sm:mb-8">
      <Carousel
        setApi={setApi}
        opts={{ loop: banners.length > 1 }}
        plugins={plugins}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {banners.map((banner) => (
            <CarouselItem
              key={banner.id}
              className={`pl-0 relative ${aspectClass}`}
            >
              <BannerSlide banner={banner} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {banners.length > 1 && (
          <>
            <CarouselPrevious className="hidden md:flex left-4" />
            <CarouselNext className="hidden md:flex right-4" />
          </>
        )}
      </Carousel>
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Ir para o banner ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === selectedIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
