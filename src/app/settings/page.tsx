"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/context";
import {
  formatCurrency,
  CATEGORY_COLORS,
  generateId,
  downloadJSON,
  type Category,
} from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";

function CategoryEditor({
  category,
  categories,
  onSave,
  onDelete,
  canDelete,
}: {
  category: Category;
  categories: Category[];
  onSave: (c: Category) => void;
  onDelete: (id: string, migrateTo: string) => void;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [percentage, setPercentage] = useState(category.percentage);

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-surface transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
          <div>
            <p className="text-sm font-medium">{category.name}</p>
            <p className="text-xs text-muted font-mono">{category.percentage}%</p>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="text-muted hover:text-muted-hover opacity-0 group-hover:opacity-100 transition-all text-xs">
          Modifica
        </button>
      </div>
    );
  }

  return (
    <div className="py-3 px-3 rounded-lg bg-surface border border-border space-y-3">
      <div>
        <label className="block text-muted text-xs tracking-wider mb-1">Nome</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm outline-none focus:border-accent transition-colors" />
      </div>
      <div>
        <label className="block text-muted text-xs tracking-wider mb-1">Percentuale</label>
        <input type="range" min={0} max={100} value={percentage} onChange={(e) => setPercentage(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: category.color }} />
        <span className="text-xs text-muted font-mono">{percentage}%</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { onSave({ ...category, name: name.trim() || category.name, percentage }); setEditing(false); }} className="flex-1 h-8 bg-foreground text-background text-xs font-medium rounded-lg hover:bg-muted-hover transition-colors">Salva</button>
        <button onClick={() => setEditing(false)} className="h-8 px-3 border border-border rounded-lg text-xs hover:bg-surface transition-colors">Annulla</button>
        {canDelete && (
          <button onClick={() => { const other = categories.find((c) => c.id !== category.id); if (other) onDelete(category.id, other.id); }} className="h-8 px-3 border border-danger/30 text-danger text-xs rounded-lg hover:bg-danger/10 transition-colors">Elimina</button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { budget, setIncome, editCategory, addCategory, deleteCategory, reset } = useBudget();
  const fileRef = useRef<HTMLInputElement>(null);
  const [incomeValue, setIncomeValue] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPct, setNewCatPct] = useState(10);
  const [showResetDialog, setShowResetDialog] = useState(false);

  if (!budget) return null;

  const totalPercentage = budget.categories.reduce((s, c) => s + c.percentage, 0);

  const handleIncomeSave = () => {
    const val = parseFloat(incomeValue);
    if (val && val > 0) { setIncome(val); setIncomeValue(""); }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({ id: generateId(), name: newCatName.trim(), percentage: newCatPct, color: CATEGORY_COLORS[budget.categories.length % CATEGORY_COLORS.length] });
    setNewCatName(""); setNewCatPct(10); setShowNewCategory(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.monthlyIncome && data.categories && data.expenses) {
          if (confirm("Sostituire tutti i dati con quelli importati?")) {
            localStorage.setItem("financy-budget", JSON.stringify(data));
            window.location.reload();
          }
        } else { alert("File non valido."); }
      } catch { alert("Errore nella lettura del file."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-6 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-surface transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none" aria-label="Torna alla dashboard">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M9 3L5 7l4 4" /></svg>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Impostazioni</h1>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="text-xs tracking-wider text-muted mb-4">Reddito mensile</h2>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-2xl font-semibold tracking-tight tabular-nums mb-3">{formatCurrency(budget.monthlyIncome)}</p>
          <div className="flex gap-2">
            <input type="text" inputMode="numeric" value={incomeValue} onChange={(e) => setIncomeValue(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Nuovo reddito" className="flex-1 bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none focus:border-accent transition-colors placeholder:text-muted/50" />
            <button onClick={handleIncomeSave} disabled={!incomeValue || parseFloat(incomeValue) <= 0} className="h-10 px-4 bg-foreground text-background text-sm font-medium rounded-lg disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors">Aggiorna</button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs tracking-wider text-muted">Categorie</h2>
          <span className={`text-xs font-mono tabular-nums ${totalPercentage === 100 ? "text-success" : "text-warning"}`}>Totale: {totalPercentage}%</span>
        </div>
        <div className="space-y-1">
          {budget.categories.map((cat) => (
            <CategoryEditor key={cat.id} category={cat} categories={budget.categories} onSave={editCategory} onDelete={deleteCategory} canDelete={budget.categories.length > 1} />
          ))}
        </div>
        {showNewCategory ? (
          <div className="mt-3 p-3 rounded-lg bg-surface border border-border space-y-3">
            <div><label className="block text-muted text-xs tracking-wider mb-1">Nome</label><input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nuova categoria" className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm outline-none focus:border-accent transition-colors placeholder:text-muted/50" autoFocus /></div>
            <div><label className="block text-muted text-xs tracking-wider mb-1">Percentuale: {newCatPct}%</label><input type="range" min={0} max={100} value={newCatPct} onChange={(e) => setNewCatPct(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: CATEGORY_COLORS[budget.categories.length % CATEGORY_COLORS.length] }} /></div>
            <div className="flex gap-2">
              <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="flex-1 h-8 bg-foreground text-background text-xs font-medium rounded-lg disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors">Aggiungi</button>
              <button onClick={() => setShowNewCategory(false)} className="h-8 px-3 border border-border rounded-lg text-xs hover:bg-surface transition-colors">Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewCategory(true)} className="w-full mt-3 h-10 border border-dashed border-border rounded-lg text-sm text-muted hover:text-muted-hover hover:bg-surface transition-colors">+ Nuova categoria</button>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xs tracking-wider text-muted mb-4">Dati</h2>
        <div className="space-y-2">
          <button onClick={() => downloadJSON(budget, `financy-backup-${new Date().toISOString().slice(0, 10)}.json`)} className="w-full h-10 border border-border rounded-lg text-sm text-muted hover:text-muted-hover hover:bg-surface transition-colors">Esporta backup</button>
          <button onClick={() => fileRef.current?.click()} className="w-full h-10 border border-border rounded-lg text-sm text-muted hover:text-muted-hover hover:bg-surface transition-colors">Importa backup</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-wider text-muted mb-4">Zona pericolosa</h2>
        <button onClick={() => setShowResetDialog(true)} className="w-full h-10 border border-danger/30 text-danger rounded-lg text-sm hover:bg-danger/10 transition-colors">Resetta tutti i dati</button>
      </section>

      <p className="text-center text-muted/40 text-xs mt-12 mb-24">Financy v1.0 — I tuoi dati sono salvati solo su questo dispositivo</p>

      <BottomNav active="settings" />

      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[oklch(0_0_0/0.6)]" onClick={() => setShowResetDialog(false)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 mx-6 max-w-sm w-full motion-safe:animate-slide-up" role="alertdialog" aria-labelledby="settings-reset-title">
            <h3 id="settings-reset-title" className="text-lg font-semibold tracking-tight mb-2">Resettare tutti i dati?</h3>
            <p className="text-muted text-sm mb-6">Budget, categorie e spese saranno eliminati. Non è reversibile.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetDialog(false)} className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors">Annulla</button>
              <button onClick={() => { reset(); window.location.href = "/onboarding"; }} className="flex-1 h-10 bg-danger text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Resetta tutto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
