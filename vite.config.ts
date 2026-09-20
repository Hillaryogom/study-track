/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Firebase and Chart.js are large and change rarely, so they are split
        // out of the application chunk and cached separately by the browser.
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          charts: ["chart.js", "react-chartjs-2"],
        },
      },
    },
  },
  server: { port: 5173 },
  preview: { port: 4173 },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // Playwright specs live in tests/e2e and must not be collected by Vitest.
    exclude: ["node_modules/**", "dist/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/main.tsx"],
    },
  },
});
