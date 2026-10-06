// GitHub Pages não tem fallback de SPA: 404.html = index.html faz o roteador assumir rotas profundas.
import { copyFileSync } from "node:fs";
copyFileSync("dist/index.html", "dist/404.html");
