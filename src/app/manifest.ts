import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARK Connect — B2B Garment & Innerwear Wholesale",
    short_name: "ARK Connect",
    description: "Wholesale garment and innerwear ordering platform for retail stores in AP and Telangana.",
    start_url: "/?mode=retailer",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#3B3BF5",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
