import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// CRA → Vite migration notes:
//  - Dev server stays on :3000 (root `npm run dev` + convention).
//  - CRA's package.json `proxy` becomes explicit path proxies here. The SPA
//    talks to the API at /api and reads uploaded images from /uploads.
//  - Build output is `build/` (NOT Vite's default `dist/`) because the backend
//    serves static from frontend/build and the Dockerfile copies that path.
//  - All JSX lives in `.js` files, so esbuild is told to treat them as JSX
//    (both for on-demand transform and dependency pre-bundling).
//  - Tailwind runs via PostCSS (postcss.config.js), NOT the Vite plugin, so it
//    processes Sass output — @apply/@reference inside .scss resolve correctly.
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: { api: "modern-compiler" },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": { target: "http://127.0.0.1:5001", changeOrigin: true },
      "/uploads": { target: "http://127.0.0.1:5001", changeOrigin: true },
    },
  },
  build: {
    outDir: "build",
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },
});
