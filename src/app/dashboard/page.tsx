"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBudget } from "@/lib/context";
import {
  calculateBudgetForMonth,
  getCategoryBudget,
  getRemaining,
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getMonthKey,
  type Expense,
} from "@/lib/types";
import { AddExpenseSheet } from "@/components/AddExpenseSheet";
import { EditExpenseSheet } from "@/components/EditExpenseSheet";
import { BottomNav } from "@/components/BottomNav";
import { useUndoDelete } from "@/hooks/useUndoDelete";

export default function Dashboard() {
  const { budget, isLoaded, addExpense, editExpense, deleteExpense, closeMonth, reset } = useBudget();
  const router = useRouter();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  const { pendingIds, requestDelete, undoDelete } = useUndoDelete(deleteExpense);

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const isPastMonth =
    viewYear < now.getFullYear() ||
    (viewYear === now.getFullYear() && viewMonth < now.getMonth());

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const monthExpenses = useMemo(() => {
    if (!budget) return [];
    return budget.expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    });
  }, [budget, viewYear, viewMonth]);

  const spentByCategory = useMemo(() => {
    if (!budget) return new Map<string, number>();
    return calculateBudgetForMonth(budget, viewYear, viewMonth);
  }, [budget, viewYear, viewMonth]);

  const handleAdd = useCallback(
    (expense: { categoryId: string; amount: number; description: string; date: string; recurring?: boolean }) => {
      addExpense(expense);
      setShowAddSheet(false);
      setHighlightedCategory(expense.categoryId);
      setTimeout(() => setHighlightedCategory(null), 1400);
    },
    [addExpense]
  );

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!budget) return null;

  const recentExpenses = [...monthExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRemaining = budget.monthlyIncome - totalSpent;
  const spentPercent = Math.min((totalSpent / budget.monthlyIncome) * 100, 100);
  const isOverBudget = totalSpent > budget.monthlyIncome;

  const monthKey = getMonthKey(viewYear, viewMonth);
  const isMonthClosed = !!(budget.closedMonths?.[monthKey]);
  const showCloseBanner = isCurrentMonth && !isMonthClosed && monthExpenses.length > 0;

  const handleCloseMonth = () => {
    closeMonth(monthKey, totalRemaining, totalSpent, budget.monthlyIncome);
    setShowCloseModal(false);
    router.push("/piggy");
  };

  const barColor = isOverBudget
    ? "var(--color-danger)"
    : spentPercent > 80
    ? "var(--color-warning)"
    : "var(--color-accent)";

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full pb-24">

      {/* Month navigation bar */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <button
          onClick={goToPrevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface transition-colors"
          aria-label="Mese precedente"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <path d="M10 3L6 8l4 5" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-base font-semibold tracking-tight">{formatMonthLabel(viewYear, viewMonth)}</h1>
          {isPastMonth && !isMonthClosed && (
            <p className="text-xs text-muted mt-0.5">sola lettura</p>
          )}
          {isMonthClosed && (
            <p className="text-xs text-success mt-0.5">chiuso</p>
          )}
        </div>

        <button
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          aria-label="Mese successivo"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <path d="M6 3l4 5-4 5" />
          </svg>
        </button>
      </div>

      {/* Budget summary */}
      <div className="px-6 mb-6">
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-muted mb-1">Speso questo mese</p>
              <p className={`text-2xl font-semibold tracking-tight tabular-nums ${isOverBudget ? "text-danger" : ""}`}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted mb-1">{isOverBudget ? "Sforato di" : "Disponibile"}</p>
              <p className={`text-lg font-medium tracking-tight tabular-nums ${isOverBudget ? "text-danger" : "text-success"}`}>
                {formatCurrency(Math.abs(totalRemaining))}
              </p>
            </div>
          </div>

          {/* Budget bar */}
          <div className="h-2 rounded-full bg-border overflow-hidden" role="progressbar" aria-valuenow={Math.round(spentPercent)} aria-valuemin={0} aria-valuemax={100} aria-label={`Budget utilizzato: ${Math.round(spentPercent)}%`}>
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${spentPercent}%`, backgroundColor: barColor }}
            />
          </div>
          <p className="text-xs text-muted mt-2 tabular-nums font-mono">
            {Math.round(spentPercent)}% di {formatCurrency(budget.monthlyIncome)}
          </p>
        </div>
      </div>

      {/* Close month banner */}
      {showCloseBanner && (
        <div className="px-6 mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-warning">Fine mese</p>
              <p className="text-xs text-muted mt-0.5 truncate">
                {totalRemaining > 0
                  ? `${formatCurrency(totalRemaining)} da aggiungere al salvadanaio`
                  : `Superato il budget di ${formatCurrency(Math.abs(totalRemaining))}`}
              </p>
            </div>
            <button
              onClick={() => setShowCloseModal(true)}
              className="shrink-0 h-7 px-3 text-xs font-semibold rounded-lg border border-warning/30 text-warning hover:bg-warning/10 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Categories */}
      <section className="px-6 mb-6">
        <p className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-3">Categorie</p>
        <div className="space-y-2">
          {budget.categories.map((category) => {
            const spent = spentByCategory.get(category.id) || 0;
            const budgetAmount = getCategoryBudget(budget.monthlyIncome, category.percentage);
            const remaining = getRemaining(budget.monthlyIncome, category.percentage, spent);
            const pct = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;
            const isHighlighted = highlightedCategory === category.id;
            const isOver = spent > budgetAmount;

            return (
              <div
                key={category.id}
                className={`rounded-xl border px-4 py-3 transition-all duration-300 ${
                  isHighlighted
                    ? "border-accent/40 bg-accent-muted"
                    : "border-border bg-surface"
                }`}
                role="region"
                aria-label={`${category.name}: ${formatCurrency(remaining)} rimanenti`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className={`text-sm font-mono tabular-nums ${isOver ? "text-danger" : "text-muted"}`}>
                    {isOver ? `−${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver ? "var(--color-danger)" : pct > 80 ? "var(--color-warning)" : category.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent expenses */}
      <section className="px-6">
        <p className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-3">
          {isPastMonth ? "Spese del mese" : "Ultime spese"}
        </p>
        {recentExpenses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted text-sm">Nessuna spesa questo mese</p>
            {!isPastMonth && (
              <p className="text-muted/50 text-xs mt-1">
                Tocca &ldquo;Aggiungi spesa&rdquo; per iniziare
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-px">
            {recentExpenses.map((expense) => {
              const cat = budget.categories.find((c) => c.id === expense.categoryId);
              const isPending = pendingIds.has(expense.id);
              return (
                <button
                  key={expense.id}
                  onClick={() => !isPending && !isPastMonth && setEditingExpense(expense)}
                  className={`w-full flex items-center justify-between py-3 px-2 rounded-lg transition-colors group text-left ${
                    isPending ? "bg-danger/5 cursor-default" : isPastMonth ? "cursor-default" : "hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color ?? "#888" }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${isPending ? "line-through opacity-50" : ""}`}>
                        {expense.description || cat?.name}
                        {expense.recurring && (
                          <span className="text-recurring text-xs ml-1.5 font-mono" aria-label="Spesa ricorrente">↻</span>
                        )}
                      </p>
                      <p className="text-xs text-muted font-mono mt-0.5">
                        {formatDate(expense.date)}
                        {cat && <><span className="mx-1.5 opacity-40" aria-hidden="true">·</span>{cat.name}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
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
                    ) : !isPastMonth ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); requestDelete(expense.id); }}
                        className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-xs"
                        aria-label={`Elimina: ${expense.description || cat?.name}`}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </button>
              );
            })}
            {monthExpenses.length > 5 && (
              <Link
                href="/history"
                className="block text-center text-sm text-muted hover:text-muted-hover py-3 transition-colors"
              >
                Vedi tutte ({monthExpenses.length})
              </Link>
            )}
          </div>
        )}
      </section>

      {/* FAB */}
      {!isPastMonth && (
        <button
          onClick={() => setShowAddSheet(true)}
          className="fixed bottom-[72px] right-1/2 translate-x-1/2 max-w-[calc(var(--spacing)*128)] w-[calc(100%-3rem)] h-11 bg-foreground text-background text-sm font-semibold rounded-xl hover:bg-muted-hover transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-accent outline-none z-30"
          aria-label="Aggiungi una nuova spesa"
        >
          + Aggiungi spesa
        </button>
      )}

      <BottomNav active="dashboard" />

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

      {/* Close month bottom sheet */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="close-month-title">
          <div className="absolute inset-0 bg-[oklch(0_0_0/0.5)]" onClick={() => setShowCloseModal(false)} />
          <div className="absolute inset-x-0 bottom-0 motion-safe:animate-slide-up">
            <div className="bg-surface border-t border-border rounded-t-2xl max-w-lg mx-auto px-6 pb-10 pt-5">
              <div className="flex justify-center mb-5">
                <div className="w-8 h-1 rounded-full bg-border" aria-hidden="true" />
              </div>
              <h3 id="close-month-title" className="text-base font-semibold tracking-tight mb-5">
                Chiudi {formatMonthLabel(viewYear, viewMonth)}
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Budget mensile</span>
                  <span className="font-mono tabular-nums">{formatCurrency(budget.monthlyIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Totale speso</span>
                  <span className="font-mono tabular-nums">{formatCurrency(totalSpent)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>{totalRemaining >= 0 ? "Avanzo" : "Deficit"}</span>
                  <span className={`font-mono tabular-nums ${totalRemaining >= 0 ? "text-success" : "text-danger"}`}>
                    {totalRemaining >= 0 ? "+" : ""}{formatCurrency(totalRemaining)}
                  </span>
                </div>
              </div>
              {totalRemaining > 0 && (
                <p className="text-xs text-muted mb-5">
                  {formatCurrency(totalRemaining)} verranno aggiunti al tuo salvadanaio.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 h-11 border border-border rounded-xl text-sm font-medium hover:bg-surface2 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCloseMonth}
                  className="flex-1 h-11 bg-foreground text-background text-sm font-semibold rounded-xl hover:bg-muted-hover transition-colors"
                >
                  Chiudi mese
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
