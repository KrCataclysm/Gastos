import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

const DISMISS_KEY = "gastos:install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissed) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (isIos()) setShowIosHint(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  if (dismissed || isStandalone() || (!deferred && !showIosHint)) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="install-banner">
      <div className="install-banner__icon">
        <Download size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Instale o Gastos no seu aparelho</div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          {deferred
            ? "Acesso rápido, tela cheia e funciona offline."
            : 'Toque em compartilhar (ícone de Share) e depois em "Adicionar à Tela de Início".'}
        </div>
      </div>
      {deferred ? (
        <button
          className="btn btn--primary btn--sm"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
            dismiss();
          }}
        >
          Instalar
        </button>
      ) : (
        <Share size={18} style={{ flexShrink: 0 }} />
      )}
      <button className="btn btn--ghost btn--icon" onClick={dismiss} aria-label="Dispensar">
        <X size={16} />
      </button>
    </div>
  );
}
