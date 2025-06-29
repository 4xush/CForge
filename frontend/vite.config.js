import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon/favicon.svg",
        "favicon/favicon.ico",
        "favicon/apple-touch-icon.png"
      ],
      manifest: {
        name: "CForge",
        short_name: "CForge",
        description: "Coding community platform with progress analytics.",
        theme_color: "#6b46c1",
        background_color: "#6b46c1",
        display: "standalone",
        start_url: "/",
        orientation: "portrait-primary",
        scope: "/",
        // 🔁 This dummy version forces SW to update on every deploy
        version: Date.now().toString(),
        icons: [
          {
            src: "favicon/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "favicon/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "favicon/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Never cache API calls
            urlPattern: /^https:\/\/cforge\.onrender\.com\/api\//,
            handler: "NetworkOnly",
          },
          {
            // Cache images for 7 days
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
  build: {
    outDir: "dist",
  },
  define: {
    "process.env": {},
  },
});
