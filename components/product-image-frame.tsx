"use client";

import Image from "next/image";
import { resolveCdnUrl } from "@/lib/cdn";
import { cn } from "@/lib/utils";

type ProductImageFrameProps = {
  src: string;
  alt: string;
  variant?: "main" | "thumb" | "thumb-mobile" | "related";
  className?: string;
  frameClassName?: string;
  priority?: boolean;
  draggable?: boolean;
  onClick?: () => void;
};

const variantConfig = {
  main: {
    frame: "aspect-square w-full rounded-lg",
    inset: "inset-3 sm:inset-5 md:inset-6",
    sizes: "(max-width: 1024px) 384px, 40vw",
  },
  thumb: {
    frame: "aspect-square w-full rounded-md",
    inset: "inset-1.5",
    sizes: "72px",
  },
  "thumb-mobile": {
    frame: "aspect-square w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md",
    inset: "inset-1",
    sizes: "80px",
  },
  related: {
    frame: "aspect-square w-full rounded-md",
    inset: "inset-2 sm:inset-3",
    sizes: "(max-width: 640px) 50vw, 20vw",
  },
} as const;

export function ProductImageFrame({
  src,
  alt,
  variant = "main",
  className,
  frameClassName,
  priority = false,
  draggable = false,
  onClick,
}: ProductImageFrameProps) {
  const config = variantConfig[variant];
  const imageSrc = resolveCdnUrl(src) || "/placeholder.svg";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white border border-border",
        config.frame,
        onClick && "cursor-pointer",
        frameClassName,
      )}
      onClick={onClick}
    >
      <div className={cn("absolute", config.inset)}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={config.sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          draggable={draggable}
          className={cn("object-contain object-center", className)}
        />
      </div>
    </div>
  );
}
