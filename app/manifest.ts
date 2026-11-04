import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest and linked from every page. With it (and
// HTTPS), Android offers "Install app" and iOS "Add to Home Screen" opens
// TurkmenHub full screen. The icons are full-bleed green with the gül mark
// in the middle, so they work both as-is and cropped to a circle
// ("maskable").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TurkmenHub",
    short_name: "TurkmenHub",
    description: "Find Turkmens in your city abroad. · Daşary ýurtda şäheriňizdäki türkmenleri tapyň.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#f7f3ec",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
