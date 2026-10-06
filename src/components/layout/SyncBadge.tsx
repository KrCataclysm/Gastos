import { useData } from "@/contexts/DataContext";

const LABELS: Record<string, string> = {
  idle: "Sincronizado",
  syncing: "Sincronizando…",
  offline: "Offline · dados locais",
  error: "Erro ao sincronizar",
};

export function SyncBadge() {
  const { syncStatus, syncNow } = useData();
  return (
    <button
      className="sync-badge"
      style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
      onClick={() => void syncNow()}
      title="Forçar sincronização"
    >
      <span className={`sync-dot sync-dot--${syncStatus}`} />
      {LABELS[syncStatus] ?? syncStatus}
    </button>
  );
}
