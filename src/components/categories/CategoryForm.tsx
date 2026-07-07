import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import { ICON_CHOICES, getIcon } from "@/components/ui/icons";
import { ACCENT_PRESETS } from "@/contexts/ThemeContext";
import type { Category, CategoryKind, CategoryNature } from "@/types";

export function CategoryForm({
  initial,
  defaultParentId,
  defaultKind,
  onClose,
}: {
  initial?: Category;
  defaultParentId?: string | null;
  defaultKind?: CategoryKind;
  onClose: () => void;
}) {
  const { categories, saveCategory, removeCategory } = useData();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(initial?.kind ?? defaultKind ?? "expense");
  const [nature, setNature] = useState<CategoryNature>(initial?.nature ?? "variable");
  const [parentId, setParentId] = useState<string>(initial?.parent_id ?? defaultParentId ?? "");
  const [color, setColor] = useState(initial?.color ?? ACCENT_PRESETS[0]);
  const [icon, setIcon] = useState(initial?.icon ?? "tag");
  const [monthlyBudget, setMonthlyBudget] = useState(initial?.monthly_budget ? String(initial.monthly_budget) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentOptions = categories.filter((c) => !c.parent_id && c.kind === kind && c.id !== initial?.id);
  const Icon = getIcon(icon);

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Dê um nome para a categoria.");
      return;
    }
    setSaving(true);
    try {
      await saveCategory({
        id: initial?.id,
        name: name.trim(),
        kind,
        nature,
        parent_id: parentId || null,
        color,
        icon,
        monthly_budget: monthlyBudget ? Number(monthlyBudget.replace(",", ".")) : null,
      });
      show(initial ? "Categoria atualizada." : "Categoria criada.", "success");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm("Excluir esta categoria? Lançamentos ligados a ela ficarão sem categoria.")) return;
    await removeCategory(initial.id);
    show("Categoria excluída.", "success");
    onClose();
  }

  return (
    <Sheet title={initial ? "Editar categoria" : "Nova categoria"} onClose={onClose}>
      <div className="auth-form">
        <div style={{ display: "flex", gap: 8 }}>
          {(["expense", "income"] as CategoryKind[]).map((k) => (
            <button
              key={k}
              type="button"
              className={`chip${kind === k ? " chip--active" : ""}`}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => {
                setKind(k);
                setParentId("");
              }}
            >
              {k === "expense" ? "Despesa" : "Receita"}
            </button>
          ))}
        </div>

        <div className="field">
          <label>Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Alimentação" />
        </div>

        <div className="field">
          <label>Subcategoria de (opcional)</label>
          <select className="select" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Categoria principal</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Natureza</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["variable", "fixed"] as CategoryNature[]).map((n) => (
              <button
                key={n}
                type="button"
                className={`chip${nature === n ? " chip--active" : ""}`}
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setNature(n)}
              >
                {n === "fixed" ? "Fixa" : "Variável"}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Orçamento mensal padrão (opcional)</label>
          <input
            className="input"
            inputMode="decimal"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div className="field">
          <label>Cor</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "3px solid var(--color-text)" : "2px solid transparent",
                  cursor: "pointer",
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>Ícone</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ICON_CHOICES.map((name) => {
              const IconOption = getIcon(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className="btn btn--icon"
                  style={{
                    background: icon === name ? "var(--color-accent-soft)" : "var(--color-panel-alt)",
                    border: icon === name ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  }}
                >
                  <IconOption size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="panel-alt" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color }}>
            <Icon size={18} />
          </div>
          <span className="text-muted" style={{ fontSize: 13 }}>Pré-visualização</span>
        </div>

        {error && <div className="error-text">{error}</div>}
        <button className="btn btn--primary btn--block" onClick={handleSubmit} disabled={saving}>
          {saving ? "Salvando…" : "Salvar categoria"}
        </button>
        {initial && (
          <button type="button" className="btn btn--danger btn--block" onClick={handleDelete}>
            Excluir categoria
          </button>
        )}
      </div>
    </Sheet>
  );
}
