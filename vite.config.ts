import { fileURLToPath, URL } from "node:url";
import { createHash } from "node:crypto";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const base = "/Gastos/";

/** Política de segurança de conteúdo (CSP) por <meta>: o GitHub Pages não deixa definir cabeçalhos.
 *  Scripts inline recebem hash SHA-256 calculado na hora do build (nada de 'unsafe-inline' em script). */
function cspPlugin(): Plugin {
  return {
    name: "prumo-csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const hashes = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)).map(
          (m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`,
        );
        const csp = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(" ")}`.trim(),
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          "worker-src 'self'",
          "manifest-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-src 'none'",
        ].join("; ");
        return html.replace(
          "<head>",
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />\n    <meta name="referrer" content="no-referrer" />`,
        );
      },
    },
  };
}

export default defineConfig({
  base,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "favicon-16.png",
        "favicon-32.png",
        "icons/apple-touch-icon.png",
      ],
      manifest: {
        id: base,
        name: "Prumo - Finanças universitárias no prumo",
        short_name: "Prumo",
        description:
          "Prumo: controle de receitas e despesas para universitários, com orçamento, metas, Pareto e Ishikawa.",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#f3f1eb",
        theme_color: "#0e6b62",
        lang: "pt-BR",
        orientation: "portrait",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        categories: ["finance", "productivity"],
      },
      workbox: {
        // Só a fonte padrão (Plus Jakarta Sans + Inter nos números) é pré-carregada para uso offline; as opcionais são cacheadas ao serem usadas.
        globPatterns: ["**/*.{js,css,html,png,svg,ico}", "assets/plus-jakarta-sans-latin-*.woff2", "assets/inter-latin-{500,600,700}-normal-*.woff2"],
        // Versão nova espera o aviso "Atualizar" (sem recarregar a tela no meio de um lançamento).
        skipWaiting: false,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\.(woff2?|ttf)$/.test(url.pathname),
            handler: "CacheFirst",
            options: { cacheName: "fontes", expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/rest/v1/") || url.pathname.includes("/auth/v1/"),
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Bibliotecas em pacotes próprios: mudam pouco e ficam em cache entre versões do app.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return "vendor-react";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("date-fns")) return "vendor-date";
          return undefined;
        },
      },
    },
  },
});
