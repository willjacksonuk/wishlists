// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  security: {
    // Trust the X-Forwarded-Host header from Dokploy's proxy for this host only,
    // so origin checks on form posts see the public https URL.
    allowedDomains: [
      {
        hostname: process.env.SITE_HOSTNAME ?? "wishlists.willjackson.uk",
        protocol: "https",
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["better-sqlite3", "@node-rs/argon2"],
    },
  },
});
