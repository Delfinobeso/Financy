"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/context";
import { formatCurrency, formatDate, type Expense } from "@/lib/types";
import { useUndoDelete } from "@/hooks/useUndoDelete";
import { EditExpenseSheet } from "@/components/EditExpenseSheet";
import { BottomNav } from "@/components/BottomNav";

export default function History() {
  const { budget, editExpense, deleteExpense } = useBudget();
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { pendingIds, requestDelete, undoDelete } = useUndoDelete(deleteExpense);

  const filtered = useMemo(() => {
    if (!budget) return [];
    let list = [...budget.expenses];
    if (filter) {
      const cat = budget.categories.find(c => c.id === filter || c.name.toLowerCase().includes(filter.toLowerCase()));
      if (cat) list = list.filter(e => e.categoryId === cat.id);
      else list = list.filter(e => e.description.toLowerCase().includes(filter.toLowerCase()));
    }
    switch (sort) {
      case "date-desc": list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); break;
      case "date-asc": list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); break;
      case "amount-desc": list.sort((a, b) => b.amount - a.amount); break;
      case "amount-asc": list.sort((a, b) => a.amount - b.amount); break;
    }
    return list;
  }, [budget, filter, sort]);

  if (!budget) return null;

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);
  const spentByCategory = new Map<string, number>();
  for (const e of budget.expenses) {
    spentByCategory.set(e.categoryId, (spentByCategory.get(e.categoryId) || 0) + e.amount);
  }

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-6 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-surface transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none" aria-label="Torna alla dashboard">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M9 3L5 7l4 4" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Storico</h1>
            <p className="text-muted text-sm">{budget.expenses.length} spese totali</p>
          </div>
        </div>
        <div className="flex gap-2">
          <label htmlFor="history-filter" className="sr-only">Filtra spese</label>
          <input id="history-filter" type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtra..." className="flex-1 h-10 bg-surface border border-border rounded-lg px-3 text-sm outline-none focus:border-accent transition-colors placeholder:text-muted/50" />
          <label htmlFor="history-sort" className="sr-only">Ordina spese</label>
          <select id="history-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 bg-surface border border-border rounded-lg px-3 text-sm outline-none focus:border-accent transition-colors appearance-none cursor-pointer font-mono">
            <option value="date-desc">Più recenti</option>
            <option value="date-asc">Meno recenti</option>
            <option value="amount-desc">Importo ↓</option>
            <option value="amount-asc">Importo ↑</option>
          </select>
        </div>
        {filter && <p className="text-muted text-xs mt-3">{filtered.length} risultati — {formatCurrency(totalFiltered)}</p>}
      </header>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          {filter ? (
            <><p className="text-2xl mb-2" aria-hidden="true">🔍</p><p className="text-muted text-sm">Nessun risultato</p></>
          ) : (
            <><p className="text-4xl mb-3" aria-hidden="true">📋</p><p className="text-muted text-sm">Ancora nessuna spesa</p><p className="text-muted/50 text-xs mt-1">Quando aggiungi una spesa, apparirà qui</p></>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((expense) => {
            const cat = budget.categories.find((c) => c.id === expense.categoryId);
            const isPending = pendingIds.has(expense.id);
            return (
              <button
                key={expense.id}
                onClick={() => !isPending && setEditingExpense(expense)}
                className={`w-full flex items-center justify-between py-3 px-3 rounded-lg transition-colors group text-left ${isPending ? "bg-danger/5 cursor-default" : "hover:bg-surface cursor-pointer"}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat?.color ?? "#888" }} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className={`text-sm truncate ${isPending ? "line-through opacity-50" : ""}`}>
                      {expense.description || cat?.name}
                      {expense.recurring && <span className="text-warning text-xs ml-1.5" aria-label="Spesa ricorrente">↻</span>}
                    </p>
                    <p className="text-xs text-muted mt-0.5"><span className="font-mono">{formatDate(expense.date)}</span>{cat && <><span className="mx-1.5 text-border" aria-hidden="true">·</span>{cat.name}</>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-mono tabular-nums ${isPending ? "opacity-50" : ""}`}>{formatCurrency(expense.amount)}</span>
                  {isPending ? (
                    <button onClick={(e) => { e.stopPropagation(); undoDelete(expense.id); }} className="text-accent text-xs font-medium hover:underline">Annulla</button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); requestDelete(expense.id); }} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-xs" aria-label={`Elimina: ${expense.description || cat?.name}`}>Elimina</button>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BottomNav active="history" />

      {editingExpense && (
        <EditExpenseSheet
          expense={editingExpense}
          categories={budget.categories}
          monthlyIncome={budget.monthlyIncome}
          spentByCategory={spentByCategory}
          onSave={(e) => { editExpense(e); setEditingExpense(null); }}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}
