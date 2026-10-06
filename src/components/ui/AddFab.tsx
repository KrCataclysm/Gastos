import { Plus } from "lucide-react";

export function AddFab({ onClick, label = "Lançar" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="fab no-print" onClick={onClick} aria-label={label === "Lançar" ? "Adicionar lançamento" : label}>
      <Plus size={20} strokeWidth={2.25} aria-hidden />
      {label}
    </button>
  );
}
