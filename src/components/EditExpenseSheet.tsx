"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency, getCategoryBudget, getRemaining, type Category, type Expense } from "@/lib/types";

interface Props {
  expense: Expense;
  categories: Category[];
  monthlyIncome: number;
  spentByCategory: Map<string, number>;
  onSave: (expense: Expense) => void;
  onClose: () => void;
}

export function EditExpenseSheet({ expense, categories, monthlyIncome, spentByCategory, onSave, onClose }: Props) {
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [description, setDescription] = useState(expense.description);
  const [date, setDate] = useState(expense.date);

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
    amountRef.current?.select();
  }, []);

  const amountNum = parseFloat(amount) || 0;
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const spent = spentByCategory.get(categoryId) || 0;
  const remaining = selectedCategory
    ? getRemaining(monthlyIncome, selectedCategory.percentage, spent - expense.amount)
    : 0;
  const wouldExceed = amountNum > 0 && amountNum > remaining;

  const handleSave = () => {
    if (!amountNum || amountNum <= 0) return;
    if (!categoryId) return;

    onSave({
      ...expense,
      categoryId,
      amount: amountNum,
      description: description.trim() || selectedCategory?.name || "",
      date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Modifica spesa">
      <div
        className="absolute inset-0 bg-[oklch(0_0_0/0.6)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 motion-safe:animate-slide-up">
        <div className="bg-surface border-t border-border rounded-t-2xl max-w-lg mx-auto">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 rounded-full bg-border" aria-hidden="true" />
          </div>

          <div className="px-6 pb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight">
                Modifica spesa
              </h2>
              <button
                onClick={onClose}
                className="text-muted hover:text-muted-hover transition-colors text-sm"
              >
                Annulla
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-muted text-xs tracking-wider mb-2">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg border text-sm transition-colors ${
                        cat.id === categoryId
                          ? "border-accent bg-accent-muted text-foreground"
                          : "border-border hover:bg-surface text-muted"
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="edit-amount" className="block text-muted text-xs tracking-wider mb-2">
                  Importo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted font-light" aria-hidden="true">
                    €
                  </span>
                  <input
                    ref={amountRef}
                    id="edit-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-full bg-background border border-border rounded-lg h-12 pl-10 pr-4 text-lg font-semibold outline-none focus:border-accent transition-colors"
                  />
                </div>
                {wouldExceed && (
                  <p className="mt-2 text-xs text-warning" role="alert">
                    Supera il budget di {formatCurrency(Math.abs(remaining))} per {selectedCategory?.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="edit-desc" className="block text-muted text-xs tracking-wider mb-2">
                  Descrizione
                </label>
                <input
                  id="edit-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="edit-date" className="block text-muted text-xs tracking-wider mb-2">
                  Data
                </label>
                <input
                  id="edit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={amountNum <= 0}
              className="w-full h-12 bg-foreground text-background font-medium rounded-lg mt-8 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors"
            >
              Salva modifiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
