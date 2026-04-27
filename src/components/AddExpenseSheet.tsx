"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatCurrency, getCategoryBudget, getRemaining, type Category } from "@/lib/types";

interface Props {
  categories: Category[];
  monthlyIncome: number;
  spentByCategory: Map<string, number>;
  onAdd: (expense: {
    categoryId: string;
    amount: number;
    description: string;
    date: string;
    recurring?: boolean;
  }) => void;
  onClose: () => void;
}

export function AddExpenseSheet({ categories, monthlyIncome, spentByCategory, onAdd, onClose }: Props) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [step, setStep] = useState<"category" | "amount" | "details">("category");
  const [recurring, setRecurring] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "amount") amountRef.current?.focus();
    if (step === "details") descRef.current?.focus();
  }, [step]);

  const amountNum = parseFloat(amount) || 0;
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const spent = spentByCategory.get(categoryId) || 0;
  const budgetAmount = selectedCategory
    ? getCategoryBudget(monthlyIncome, selectedCategory.percentage)
    : 0;
  const remaining = selectedCategory
    ? getRemaining(monthlyIncome, selectedCategory.percentage, spent)
    : 0;
  const wouldExceed = amountNum > 0 && amountNum > remaining;

  const handleSubmit = () => {
    if (!amountNum || amountNum <= 0) return;
    if (!categoryId) return;

    onAdd({
      categoryId,
      amount: amountNum,
      description: description.trim() || selectedCategory?.name || "",
      date,
      recurring,
    });
    onClose();
  };

  const handleAmountContinue = () => {
    if (amountNum <= 0) return;
    setStep("details");
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Aggiungi una nuova spesa">
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
            <h2 className="text-lg font-semibold tracking-tight mb-6" id="add-expense-title">
              Nuova spesa
            </h2>

            {step === "category" && (
              <div className="space-y-1" role="radiogroup" aria-label="Seleziona categoria">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setStep("amount");
                    }}
                    className="w-full flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-background transition-colors text-left focus-visible:ring-2 focus-visible:ring-accent outline-none"
                    aria-current={cat.id === categoryId}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium flex-1">{cat.name}</span>
                    <span className="text-xs text-muted font-mono tabular-nums">
                      {formatCurrency(remaining)} rimanenti
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step === "amount" && (
              <div>
                <button
                  onClick={() => setStep("category")}
                  className="flex items-center gap-2 text-sm text-muted hover:text-muted-hover mb-6 transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none rounded"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M7 2L3 6l4 4" />
                  </svg>
                  <span>{selectedCategory?.name}</span>
                </button>

                <label htmlFor="expense-amount" className="block text-muted text-xs tracking-wider mb-3">
                  Importo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-muted font-light" aria-hidden="true">
                    €
                  </span>
                  <input
                    ref={amountRef}
                    id="expense-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    className="w-full bg-transparent text-4xl font-semibold tracking-tight pl-12 pr-4 py-4 border-b-2 border-border focus:border-accent outline-none transition-colors placeholder:text-muted/30"
                  />
                </div>

                {wouldExceed && (
                  <div
                    className="mt-4 py-2 px-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm"
                    role="alert"
                  >
                    Superi il budget di {formatCurrency(Math.abs(remaining))} per {selectedCategory?.name}.
                    Puoi comunque aggiungere la spesa.
                  </div>
                )}

                <button
                  onClick={handleAmountContinue}
                  disabled={amountNum <= 0}
                  className="w-full h-12 bg-foreground text-background font-medium rounded-lg mt-8 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
                >
                  Continua
                </button>
              </div>
            )}

            {step === "details" && (
              <div>
                <button
                  onClick={() => setStep("amount")}
                  className="flex items-center gap-2 text-sm text-muted hover:text-muted-hover mb-6 transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none rounded"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M7 2L3 6l4 4" />
                  </svg>
                  <span>{formatCurrency(amountNum)}</span>
                </button>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="expense-desc" className="block text-muted text-xs tracking-wider mb-2">
                      Descrizione
                    </label>
                    <input
                      ref={descRef}
                      id="expense-desc"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={selectedCategory?.name}
                      className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none focus:border-accent transition-colors placeholder:text-muted/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="expense-date" className="block text-muted text-xs tracking-wider mb-2">
                      Data
                    </label>
                    <input
                      id="expense-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-warning" aria-hidden="true">↻</span>
                      Spesa ricorrente
                    </span>
                    <input
                      type="checkbox"
                      checked={recurring}
                      onChange={(e) => setRecurring(e.target.checked)}
                      className="w-4 h-4 accent-accent cursor-pointer"
                    />
                  </label>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full h-12 bg-foreground text-background font-medium rounded-lg mt-8 hover:bg-muted-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
                >
                  Aggiungi spesa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
