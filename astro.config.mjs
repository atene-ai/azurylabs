// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://azurylabs.online",
  output: "server",
  devToolbar: {
    enabled: false,
  },

  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },

  server: {
    port: 3002,
    host: "0.0.0.0",
  },

  adapter: cloudflare(),
});
