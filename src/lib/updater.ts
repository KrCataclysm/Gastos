import { registerSW } from "virtual:pwa-register";

export const UPDATE_EVENT = "app:update-ready";
let applyFn: ((reload?: boolean) => Promise<void>) | null = null;
let ready = false;

/** Registra o service worker. Versão nova avisa o app (banner "Atualizar") em vez de recarregar sozinha. */
export function initUpdater(): void {
  applyFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      ready = true;
      window.dispatchEvent(new Event(UPDATE_EVENT));
    },
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const check = () => void reg.update().catch(() => undefined);
      window.setInterval(check, 30 * 60 * 1000);
      document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && check());
    },
  });

  // Aba aberta numa versão antiga pedindo um arquivo que já não existe: recarrega uma vez para pegar a nova.
  window.addEventListener("vite:preloadError", () => {
    if (sessionStorage.getItem("gastos:reloaded-chunk") === "1") return;
    sessionStorage.setItem("gastos:reloaded-chunk", "1");
    window.location.reload();
  });
}

export const isUpdateReady = () => ready;
export function applyUpdate(): void {
  // O recarregamento do plugin não cobre atualizações detectadas pelo navegador (isExternal), então escutamos a troca aqui.
  navigator.serviceWorker?.addEventListener("controllerchange", () => window.location.reload(), { once: true });
  void applyFn?.(false);
}
