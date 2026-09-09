import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "maps",
              test: /node_modules\/(@tomtom-org|maplibre-gl)/,
            },
            {
              name: "charts",
              test: /node_modules\/(recharts|d3-)/,
            },
            {
              name: "react-vendor",
              test: /node_modules\/(react|react-dom|scheduler|react-router|@remix-run)/,
            },
          ],
        },
      },
    },
  },
});
