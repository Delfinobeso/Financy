"use client";

import { useState, useMemo, useCallback } from "react";
import { useBudget } from "@/lib/context";
import {
  calculateBudget,
  getCategoryBudget,
  getRemaining,
  formatCurrency,
  formatDate,
  type Expense,
} from "@/lib/types";
import { AddExpenseSheet } from "@/components/AddExpenseSheet";
import { EditExpenseSheet } from "@/components/EditExpenseSheet";
import { useUndoDelete } from "@/hooks/useUndoDelete";

export default function Dashboard() {
  const { budget, addExpense, editExpense, deleteExpense, reset } = useBudget();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const [ringPulse, setRingPulse] = useState(false);

  const { pendingIds, requestDelete, undoDelete } = useUndoDelete(deleteExpense);

  const spentByCategory = useMemo(() => {
    if (!budget) return new Map<string, number>();
    return calculateBudget(budget);
  }, [budget]);

  const handleAdd = useCallback(
    (expense: { categoryId: string; amount: number; description: string; date: string }) => {
      addExpense(expense);
      setShowAddSheet(false);
      setHighlightedCategory(expense.categoryId);
      setRingPulse(true);
      setTimeout(() => setHighlightedCategory(null), 1200);
      setTimeout(() => setRingPulse(false), 800);
    },
    [addExpense]
  );

  if (!budget) return null;

  const recentExpenses = [...budget.expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const totalSpent = budget.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRemaining = budget.monthlyIncome - totalSpent;
  const spentPercent = Math.min((totalSpent / budget.monthlyIncome) * 100, 100);

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-6 pb-24">
      <header className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Financy</h1>
            <p className="text-muted text-sm mt-0.5">Il tuo budget mensile</p>
          </div>
          <button
            onClick={() => setShowResetDialog(true)}
            className="text-muted hover:text-muted-hover transition-colors text-sm"
            aria-label="Resetta tutti i dati"
          >
            Reset
          </button>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted text-xs tracking-wider mb-1">Rimanente</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatCurrency(totalRemaining)}
              </p>
              <p className="text-muted text-sm mt-1">
                di {formatCurrency(budget.monthlyIncome)}
              </p>
            </div>
            <div
              className={`relative w-20 h-20 transition-transform ${ringPulse ? "scale-110" : "scale-100"}`}
              style={{ transitionDuration: "300ms" }}
              role="progressbar"
              aria-valuenow={Math.round(spentPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Budget utilizzato: ${Math.round(spentPercent)}%`}
            >
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx={40} cy={40} r={34} fill="none" stroke="var(--color-border)" strokeWidth={6} />
                <circle
                  cx={40} cy={40} r={34} fill="none"
                  stroke={spentPercent > 90 ? "var(--color-danger)" : spentPercent > 70 ? "var(--color-warning)" : "var(--color-accent)"}
                  strokeWidth={6} strokeLinecap="round"
                  strokeDasharray={`${spentPercent * 2.14} 214`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-mono tabular-nums text-muted">
                {Math.round(spentPercent)}%
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-xs tracking-wider text-muted mb-4">Categorie</h2>
        <div className="space-y-3">
          {budget.categories.map((category) => {
            const spent = spentByCategory.get(category.id) || 0;
            const budget_amount = getCategoryBudget(budget.monthlyIncome, category.percentage);
            const remaining = getRemaining(budget.monthlyIncome, category.percentage, spent);
            const pct = budget_amount > 0 ? (spent / budget_amount) * 100 : 0;
            const isHighlighted = highlightedCategory === category.id;

            return (
              <div
                key={category.id}
                className={`bg-surface border rounded-xl p-4 transition-all ${
                  isHighlighted ? "border-accent/50 shadow-[0_0_24px_var(--color-accent-muted)]" : "border-border"
                }`}
                style={{ transitionDuration: "400ms" }}
                role="region"
                aria-label={`${category.name}: ${Math.round(pct)}% utilizzato, ${formatCurrency(remaining)} rimanenti`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${isHighlighted ? "scale-150" : "scale-100"}`}
                      style={{ backgroundColor: category.color, transitionDuration: "400ms" }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-muted text-xs font-mono tabular-nums">{category.percentage}%</span>
                  </div>
                  <span className="text-sm font-mono tabular-nums font-medium">{formatCurrency(remaining)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 90 ? "var(--color-danger)" : pct > 70 ? "var(--color-warning)" : category.color }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted font-mono tabular-nums">
                  <span>Speso {formatCurrency(spent)}</span>
                  <span>max {formatCurrency(budget_amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-wider text-muted mb-4">Ultime spese</h2>
        {recentExpenses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-3" aria-hidden="true">💶</p>
            <p className="text-muted text-sm">Il tuo budget è intatto</p>
            <p className="text-muted/50 text-xs mt-1">Aggiungi la prima spesa per iniziare a tracciare</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentExpenses.map((expense) => {
              const cat = budget.categories.find((c) => c.id === expense.categoryId);
              const isPending = pendingIds.has(expense.id);
              return (
                <button
                  key={expense.id}
                  onClick={() => !isPending && setEditingExpense(expense)}
                  className={`w-full flex items-center justify-between py-3 px-3 rounded-lg transition-colors group text-left ${
                    isPending ? "bg-danger/5 cursor-default" : "hover:bg-surface cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat?.color ?? "#888" }} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${isPending ? "line-through opacity-50" : ""}`}>
                        {expense.description || cat?.name}
                      </p>
                      <p className="text-xs text-muted font-mono mt-0.5">
                        {formatDate(expense.date)}
                        <span className="mx-1.5 text-border" aria-hidden="true">·</span>
                        <span>{cat?.name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-mono tabular-nums ${isPending ? "opacity-50" : ""}`}>
                      {formatCurrency(expense.amount)}
                    </span>
                    {isPending ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); undoDelete(expense.id); }}
                        className="text-accent text-xs font-medium hover:underline"
                      >
                        Annulla
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); requestDelete(expense.id); }}
                        className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-xs"
                        aria-label={`Elimina spesa: ${expense.description || cat?.name}`}
                      >
                        Elimina
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
            {budget.expenses.length > 5 && (
              <a href="/history" className="block text-center text-sm text-muted hover:text-muted-hover py-3 transition-colors">
                Vedi tutte ({budget.expenses.length})
              </a>
            )}
          </div>
        )}
      </section>

      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-20 right-1/2 translate-x-1/2 max-w-lg w-[calc(100%-3rem)] h-12 bg-foreground text-background font-medium rounded-xl hover:bg-muted-hover transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-accent outline-none"
        aria-label="Aggiungi una nuova spesa"
      >
        Aggiungi spesa
      </button>

      {/* Bottom nav 3 tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border" aria-label="Navigazione principale">
        <div className="max-w-lg mx-auto flex">
          <NavItem href="/dashboard" icon="grid" label="Dashboard" active />
          <NavItem href="/history" icon="clock" label="Storico" />
          <NavItem href="/settings" icon="gear" label="Impostazioni" />
        </div>
      </nav>

      {showAddSheet && (
        <AddExpenseSheet
          categories={budget.categories}
          monthlyIncome={budget.monthlyIncome}
          spentByCategory={spentByCategory}
          onAdd={handleAdd}
          onClose={() => setShowAddSheet(false)}
        />
      )}

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

      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[oklch(0_0_0/0.6)]" onClick={() => setShowResetDialog(false)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 mx-6 max-w-sm w-full motion-safe:animate-slide-up" role="alertdialog">
            <h3 className="text-lg font-semibold tracking-tight mb-2">Resettare tutti i dati?</h3>
            <p className="text-muted text-sm mb-6">Il budget e tutte le spese saranno eliminati. Non è reversibile.</p>
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

function NavItem({ href, icon, label, active }: { href: string; icon: "grid" | "clock" | "gear"; label: string; active?: boolean }) {
  return (
    <a
      href={href}
      className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors focus-visible:text-accent outline-none ${
        active ? "text-foreground" : "text-muted hover:text-muted-hover"
      }`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      {icon === "grid" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="10" y="2" width="6" height="6" rx="1" />
          <rect x="2" y="10" width="6" height="6" rx="1" />
          <rect x="10" y="10" width="6" height="6" rx="1" />
        </svg>
      )}
      {icon === "clock" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="9" cy="9" r="7" />
          <path d="M9 5v4l2.5 2.5" />
        </svg>
      )}
      {icon === "gear" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="9" cy="9" r="2.5" />
          <path d="M9 1.5v2M9 14.5v2M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4M16.5 9h-2M3.5 9h-2M14.3 14.3l-1.4-1.4M5.1 5.1L3.7 3.7" />
        </svg>
      )}
      <span className="text-[10px]">{label}</span>
    </a>
  );
}
