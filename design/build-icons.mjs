// Gera os PNGs do PWA a partir dos SVGs. Uso: node design/build-icons.mjs (requer playwright + chromium).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const jobs = [
  ["design/logo-icon.svg", "public/icons/icon-192.png", 192],
  ["design/logo-icon.svg", "public/icons/icon-512.png", 512],
  ["design/logo-icon.svg", "public/icons/apple-touch-icon.png", 180],
  ["design/logo-maskable.svg", "public/icons/icon-maskable-192.png", 192],
  ["design/logo-maskable.svg", "public/icons/icon-maskable-512.png", 512],
  ["public/favicon.svg", "public/favicon-32.png", 32],
  ["public/favicon.svg", "public/favicon-16.png", 16],
];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
for (const [src, out, size] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${readFileSync(src, "utf8")}`);
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
}
await browser.close();
