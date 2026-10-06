import { useState } from "react";
import { Plus, Tags } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Category, CategoryKind } from "@/types";

function CategoryGroup({ kind, categories, onEdit, onAddSub }: { kind: CategoryKind; categories: Category[]; onEdit: (c: Category) => void; onAddSub: (parentId: string) => void }) {
  const top = categories.filter((c) => c.kind === kind && !c.parent_id);
  const subsOf = (id: string) => categories.filter((c) => c.parent_id === id);

  return (
    <section className="card" aria-label={kind === "income" ? "Categorias de receita" : "Categorias de despesa"}>
      <h2 className="panel-title">{kind === "income" ? "Receitas" : "Despesas"}</h2>
      {top.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 13.5 }}>Nenhuma categoria ainda.</p>
      ) : (
        top.map((c) => (
          <div key={c.id}>
            <div className="row-item">
              <i className="ledger__dot" style={{ background: c.color }} aria-hidden />
              <button type="button" className="row-item__main" onClick={() => onEdit(c)} aria-label={`Editar ${c.name}`}>{c.name}</button>
              <span className="badge badge--neutral">{c.nature === "fixed" ? "Fixa" : "Variável"}</span>
              <button className="btn btn--ghost btn--sm" onClick={() => onAddSub(c.id)} aria-label={`Adicionar subcategoria em ${c.name}`}>+ Sub</button>
            </div>
            {subsOf(c.id).map((sub) => (
              <div key={sub.id} className="row-item row-item__sub">
                <i className="ledger__dot" style={{ background: sub.color }} aria-hidden />
                <button type="button" className="row-item__main" style={{ fontWeight: 400, fontSize: "0.85rem" }} onClick={() => onEdit(sub)} aria-label={`Editar ${sub.name}`}>{sub.name}</button>
                <span className="badge badge--neutral">{sub.nature === "fixed" ? "Fixa" : "Variável"}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </section>
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
    <div className="stack">
      <PageHeader eyebrow="Organização" title="Categorias">
        <button className="btn btn--primary btn--sm" onClick={() => openNew("expense")}><Plus size={15} /> Nova categoria</button>
      </PageHeader>

      {categories.length === 0 ? (
        <section className="card"><EmptyState icon={Tags} title="Nenhuma categoria" description="Crie categorias e subcategorias para organizar seus lançamentos." /></section>
      ) : (
        <div className="grid grid--2">
          <CategoryGroup kind="expense" categories={categories} onEdit={setEditing} onAddSub={(id) => openNew("expense", id)} />
          <CategoryGroup kind="income" categories={categories} onEdit={setEditing} onAddSub={(id) => openNew("income", id)} />
        </div>
      )}

      {editing && <CategoryForm initial={editing} onClose={() => setEditing(null)} />}
      {showNew && <CategoryForm defaultKind={newKind} defaultParentId={newParentId} onClose={() => { setShowNew(false); setNewParentId(null); }} />}
    </div>
  );
}
