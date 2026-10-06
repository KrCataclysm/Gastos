import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

interface ToastItem {
  id: number;
  text: string;
  kind: "info" | "error";
  action?: { label: string; run: () => void };
}
interface ToastApi {
  show: (text: string, opts?: { kind?: "info" | "error"; action?: ToastItem["action"] }) => void;
  error: (err: unknown) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const show = useCallback<ToastApi["show"]>((text, opts) => {
    const id = ++seq.current;
    setItems((l) => [...l.slice(-2), { id, text, kind: opts?.kind ?? "info", action: opts?.action }]);
    setTimeout(() => dismiss(id), opts?.action ? 7000 : 4000);
  }, [dismiss]);
  const api = useMemo<ToastApi>(() => ({ show, error: (e) => show(e instanceof Error ? e.message : "Algo deu errado. Tente novamente.", { kind: "error" }) }), [show]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind === "error" ? "error" : ""}`}>
            <span>{t.text}</span>
            {t.action && (
              <button type="button" onClick={() => { t.action?.run(); dismiss(t.id); }}>
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast fora do ToastProvider");
  return v;
}
