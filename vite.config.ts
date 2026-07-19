import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    headers: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(self), geolocation=(self), payment=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://rqodmqosrotmtrjnnjul.supabase.co wss://rqodmqosrotmtrjnnjul.supabase.co https://ai.gateway.lovable.dev https://api.elevenlabs.io; media-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self';",
    },
  },
  plugins: [
    react(),
    mode === "production" &&
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
        manifest: {
          name: "SINGU - CRM Inteligente",
          short_name: "SINGU",
          description: "Sistema de Inteligência Relacional para gestão de contatos e relacionamentos",
          theme_color: "#2563eb",
          background_color: "#f8fafc",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24,
                },
              },
            },
          ],
        },
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2022",
    // Minification with esbuild (faster than terser, built-in)
    minify: "esbuild",
    // Enable CSS minification and code splitting
    cssMinify: true,
    cssCodeSplit: true,
    // Reduce source map size in production
    sourcemap: false,
    // Chunk size warning threshold (kB)
    chunkSizeWarningLimit: 600,
    // Optimize asset inlining — inline assets < 8kB
    assetsInlineLimit: 8192,
    rollupOptions: {
      output: {
        // Compact output format
        compact: true,
        // Hashed filenames for long-term caching
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
        manualChunks: {
          // Core vendor — loaded on every page
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          // Heavy UI libs — loaded on demand via lazy routes
          "vendor-charts": ["recharts"],
          "vendor-motion": ["framer-motion"],
          // UI primitives shared across pages
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-popover",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-select",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-scroll-area",
          ],
          // Form handling
          "vendor-forms": [
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
          ],
          // Date utilities
          "vendor-date": ["date-fns"],
        },
      },
      // Tree-shake more aggressively
      treeshake: {
        moduleSideEffects: "no-external",
        preset: "recommended",
      },
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
    ],
  },
}));
