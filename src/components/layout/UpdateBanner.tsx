import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { applyUpdate, isUpdateReady, UPDATE_EVENT } from "@/lib/updater";

/** Aviso discreto de versão nova: você escolhe a hora de atualizar (seus dados ficam salvos no aparelho). */
export function UpdateBanner() {
  const [show, setShow] = useState(isUpdateReady());
  useEffect(() => {
    const on = () => setShow(true);
    window.addEventListener(UPDATE_EVENT, on);
    return () => window.removeEventListener(UPDATE_EVENT, on);
  }, []);
  if (!show) return null;
  return (
    <div className="update-banner" role="status">
      <RefreshCw size={16} aria-hidden />
      <span>Nova versão do Prumo disponível.</span>
      <button type="button" className="btn btn--sm btn--primary" onClick={applyUpdate}>Atualizar</button>
    </div>
  );
}
