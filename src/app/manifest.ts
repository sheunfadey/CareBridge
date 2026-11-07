import type { MetadataRoute } from "next";

import { brand } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.shortDescription,
    start_url: "/dashboard",
    display: "standalone",
    background_color: brand.colors.deepNavy,
    theme_color: brand.colors.navy,
    orientation: "portrait-primary",
    categories: ["education", "health", "business"],
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
