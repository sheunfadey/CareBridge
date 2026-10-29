import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    // Cold dynamic imports (e.g. supabase-js) can exceed the default 5s when
    // several workers start at once. Keep the limit generous but bounded.
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
