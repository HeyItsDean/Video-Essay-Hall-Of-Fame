import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages friendly:
// - base "./" makes assets resolve under any repo name
// - HashRouter avoids needing server rewrites
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "favicon.svg", "archive.csv"],
      manifest: {
        name: "Video Essay Hall of Fame",
        short_name: "VE HoF",
        description: "A beautiful, offline-first, searchable hall of fame for video essays.",
        theme_color: "#0b0b10",
        background_color: "#0b0b10",
        display: "standalone",
        start_url: "./",
        icons: [
          { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
          { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // YouTube thumbnails
          {
            urlPattern: /^https:\/\/i\.ytimg\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "yt-thumbs",
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 120 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // YouTube channel avatars / images
          {
            urlPattern: /^https:\/\/yt3\.ggpht\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "yt-avatars",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
});
