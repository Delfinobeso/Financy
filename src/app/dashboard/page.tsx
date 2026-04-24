"use client";

import { useState, useMemo } from "react";
import { useBudget } from "@/lib/context";
import {
  calculateBudget,
  getCategoryBudget,
  getRemaining,
  formatCurrency,
  formatDate,
  type Category,
} from "@/lib/types";
import { AddExpenseSheet } from "@/components/AddExpenseSheet";

export default function Dashboard() {
  const { budget, addExpense, deleteExpense, reset } = useBudget();
  const [showAddSheet, setShowAddSheet] = useState(false);

  const spentByCategory = useMemo(() => {
    if (!budget) return new Map<string, number>();
    return calculateBudget(budget);
  }, [budget]);

  if (!budget) return null;

  const recentExpenses = [...budget.expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const totalSpent = budget.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRemaining = budget.monthlyIncome - totalSpent;
  const spentPercent = Math.min((totalSpent / budget.monthlyIncome) * 100, 100);

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-6 pb-24">
      {/* Header */}
      <header className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Financy</h1>
            <p className="text-muted text-sm mt-0.5">Il tuo budget mensile</p>
          </div>
          <button
            onClick={() => {
              if (confirm("Vuoi resettare tutti i dati?")) {
                reset();
                window.location.href = "/onboarding";
              }
            }}
            className="text-muted hover:text-muted-hover transition-colors text-sm"
          >
            Reset
          </button>
        </div>

        {/* Total budget ring */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted text-xs font-mono uppercase tracking-wider mb-1">
                Rimanente
              </p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatCurrency(totalRemaining)}
              </p>
              <p className="text-muted text-sm mt-1">
                di {formatCurrency(budget.monthlyIncome)}
              </p>
            </div>
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle
                  cx={40}
                  cy={40}
                  r={34}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth={6}
                />
                <circle
                  cx={40}
                  cy={40}
                  r={34}
                  fill="none"
                  stroke={
                    spentPercent > 90
                      ? "var(--color-danger)"
                      : spentPercent > 70
                      ? "var(--color-warning)"
                      : "var(--color-accent)"
                  }
                  strokeWidth={6}
                  strokeLinecap="round"
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

      {/* Category cards */}
      <section className="mb-8">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted mb-4">
          Categorie
        </h2>
        <div className="space-y-3">
          {budget.categories.map((category) => {
            const spent = spentByCategory.get(category.id) || 0;
            const budget_amount = getCategoryBudget(budget.monthlyIncome, category.percentage);
            const remaining = getRemaining(budget.monthlyIncome, category.percentage, spent);
            const pct = budget_amount > 0 ? (spent / budget_amount) * 100 : 0;

            return (
              <div
                key={category.id}
                className="bg-surface border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-muted text-xs font-mono">
                      {category.percentage}%
                    </span>
                  </div>
                  <span className="text-sm font-mono tabular-nums font-medium">
                    {formatCurrency(remaining)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor:
                        pct > 90
                          ? "var(--color-danger)"
                          : pct > 70
                          ? "var(--color-warning)"
                          : category.color,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted font-mono tabular-nums">
                  <span>
                    Speso {formatCurrency(spent)}
                  </span>
                  <span>
                    max {formatCurrency(budget_amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent expenses */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted mb-4">
          Ultime spese
        </h2>
        {recentExpenses.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center">
            Nessuna spesa ancora. Aggiungi la prima.
          </p>
        ) : (
          <div className="space-y-1">
            {recentExpenses.map((expense) => {
              const cat = budget.categories.find((c) => c.id === expense.categoryId);
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-surface transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color ?? "#888" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        {expense.description || cat?.name}
                      </p>
                      <p className="text-xs text-muted font-mono mt-0.5">
                        {formatDate(expense.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-mono tabular-nums">
                      {formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-xs"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              );
            })}
            {budget.expenses.length > 5 && (
              <a
                href="/history"
                className="block text-center text-sm text-muted hover:text-muted-hover py-3 transition-colors"
              >
                Vedi tutte ({budget.expenses.length})
              </a>
            )}
          </div>
        )}
      </section>

      {/* FAB */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-20 right-1/2 translate-x-1/2 max-w-lg w-[calc(100%-3rem)] h-12 bg-foreground text-background font-medium rounded-xl hover:bg-muted-hover transition-colors shadow-lg"
      >
        Aggiungi spesa
      </button>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="max-w-lg mx-auto flex">
          <a
            href="/dashboard"
            className="flex-1 flex flex-col items-center gap-1 py-3 text-foreground transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="6" height="6" rx="1" />
              <rect x="10" y="2" width="6" height="6" rx="1" />
              <rect x="2" y="10" width="6" height="6" rx="1" />
              <rect x="10" y="10" width="6" height="6" rx="1" />
            </svg>
            <span className="text-[10px] font-mono uppercase">Dashboard</span>
          </a>
          <a
            href="/history"
            className="flex-1 flex flex-col items-center gap-1 py-3 text-muted hover:text-muted-hover transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="9" r="7" />
              <path d="M9 5v4l2.5 2.5" />
            </svg>
            <span className="text-[10px] font-mono uppercase">Storico</span>
          </a>
        </div>
      </nav>

      {showAddSheet && (
        <AddExpenseSheet
          categories={budget.categories}
          onAdd={addExpense}
          onClose={() => setShowAddSheet(false)}
        />
      )}
    </div>
  );
}
