import { useState } from "react";
import { Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { getIcon } from "@/components/ui/icons";
import { Tags } from "lucide-react";
import type { Category, CategoryKind } from "@/types";

function CategoryGroup({
  kind,
  categories,
  onEdit,
  onAddSub,
}: {
  kind: CategoryKind;
  categories: Category[];
  onEdit: (c: Category) => void;
  onAddSub: (parentId: string) => void;
}) {
  const top = categories.filter((c) => c.kind === kind && !c.parent_id);
  const subsOf = (id: string) => categories.filter((c) => c.parent_id === id);

  return (
    <div className="card">
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{kind === "income" ? "Receitas" : "Despesas"}</h3>
      {top.length === 0 ? (
        <div className="text-muted" style={{ fontSize: 13 }}>Nenhuma categoria ainda.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {top.map((c) => {
            const Icon = getIcon(c.icon);
            return (
              <div key={c.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  <div className="panel-alt" style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, flexShrink: 0 }}>
                    <Icon size={16} />
                  </div>
                  <button
                    onClick={() => onEdit(c)}
                    style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                  >
                    {c.name}
                  </button>
                  <span className="badge badge--neutral">{c.nature === "fixed" ? "Fixa" : "Variável"}</span>
                  <button className="btn btn--ghost btn--sm" onClick={() => onAddSub(c.id)}>
                    + Sub
                  </button>
                </div>
                {subsOf(c.id).map((sub) => {
                  const SubIcon = getIcon(sub.icon);
                  return (
                    <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0 6px 30px" }}>
                      <div className="panel-alt" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: sub.color, flexShrink: 0 }}>
                        <SubIcon size={13} />
                      </div>
                      <button
                        onClick={() => onEdit(sub)}
                        style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
                      >
                        {sub.name}
                      </button>
                      <span className="badge badge--neutral">{sub.nature === "fixed" ? "Fixa" : "Variável"}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CategoriesPage() {
  const { categories } = useData();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<CategoryKind>("expense");

  function openNew(kind: CategoryKind, parentId?: string) {
    setNewKind(kind);
    setNewParentId(parentId ?? null);
    setShowNew(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Categorias</div>
        <button className="btn btn--primary btn--sm" onClick={() => openNew("expense")}>
          <Plus size={16} /> Nova
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={Tags} title="Nenhuma categoria" description="Crie categorias e subcategorias para organizar seus lançamentos." />
      ) : (
        <>
          <CategoryGroup kind="expense" categories={categories} onEdit={setEditing} onAddSub={(id) => openNew("expense", id)} />
          <CategoryGroup kind="income" categories={categories} onEdit={setEditing} onAddSub={(id) => openNew("income", id)} />
        </>
      )}

      {editing && <CategoryForm initial={editing} onClose={() => setEditing(null)} />}
      {showNew && (
        <CategoryForm
          defaultKind={newKind}
          defaultParentId={newParentId}
          onClose={() => {
            setShowNew(false);
            setNewParentId(null);
          }}
        />
      )}
    </div>
  );
}
