import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "seed/**/*.test.ts"],
    // Only public variables are loaded into tests. The service_role key is never loaded here.
    env: loadEnv(mode, process.cwd(), "NEXT_PUBLIC_"),
  },
}));
