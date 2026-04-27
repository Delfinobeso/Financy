"use client";

import { useState, useEffect, useRef } from "react";
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

  const getCatRemaining = (cat: Category) => {
    const s = spentByCategory.get(cat.id) || 0;
    return getRemaining(monthlyIncome, cat.percentage, s);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Aggiungi una nuova spesa">
      <div
        className="absolute inset-0 bg-[oklch(0_0_0/0.55)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 motion-safe:animate-slide-up">
        <div className="bg-surface border-t border-border rounded-t-2xl max-w-lg mx-auto">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" aria-hidden="true" />
          </div>

          <div className="px-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold tracking-tight" id="add-expense-title">
                {step === "category" ? "Categoria" : step === "amount" ? "Importo" : "Dettagli"}
              </h2>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface2 transition-colors text-lg leading-none"
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>

            {/* Step: category */}
            {step === "category" && (
              <div
                className="space-y-px max-h-[55vh] overflow-y-auto -mx-1 px-1"
                role="radiogroup"
                aria-label="Seleziona categoria"
              >
                {categories.map((cat) => {
                  const rem = getCatRemaining(cat);
                  const isOver = rem < 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setCategoryId(cat.id); setStep("amount"); }}
                      className="w-full flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-surface2 transition-colors text-left focus-visible:ring-2 focus-visible:ring-accent outline-none"
                      role="radio"
                      aria-checked={cat.id === categoryId}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium flex-1">{cat.name}</span>
                      <span className={`text-xs font-mono tabular-nums ${isOver ? "text-danger" : "text-muted"}`}>
                        {isOver ? "−" : ""}{formatCurrency(Math.abs(rem))}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step: amount */}
            {step === "amount" && (
              <div>
                <button
                  onClick={() => setStep("category")}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-muted-hover mb-6 transition-colors focus-visible:ring-1 focus-visible:ring-accent outline-none rounded"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M7 2L3 6l4 4" />
                  </svg>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: selectedCategory?.color }}
                      aria-hidden="true"
                    />
                    {selectedCategory?.name}
                  </span>
                </button>

                <div className="relative mb-2">
                  <span className="absolute left-0 bottom-3 text-3xl text-muted font-light" aria-hidden="true">€</span>
                  <input
                    ref={amountRef}
                    id="expense-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    aria-label="Importo in euro"
                    className="w-full bg-transparent text-4xl font-semibold tracking-tight pl-8 pr-2 pb-3 border-b-2 border-border focus:border-accent outline-none transition-colors placeholder:text-muted/30"
                  />
                </div>
                <p className="text-xs text-muted mb-6">
                  Disponibile: {formatCurrency(remaining)}
                </p>

                {wouldExceed && (
                  <div className="mb-6 py-2.5 px-3 rounded-xl bg-warning/8 border border-warning/20 text-warning text-xs" role="alert">
                    Superi il budget di {formatCurrency(amountNum - remaining)} per {selectedCategory?.name}
                  </div>
                )}

                <button
                  onClick={() => amountNum > 0 && setStep("details")}
                  disabled={amountNum <= 0}
                  className="w-full h-11 bg-foreground text-background text-sm font-semibold rounded-xl disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
                >
                  Continua
                </button>
              </div>
            )}

            {/* Step: details */}
            {step === "details" && (
              <div>
                <button
                  onClick={() => setStep("amount")}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-muted-hover mb-6 transition-colors focus-visible:ring-1 focus-visible:ring-accent outline-none rounded"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M7 2L3 6l4 4" />
                  </svg>
                  {formatCurrency(amountNum)}
                </button>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="expense-desc" className="block text-xs text-muted mb-1.5">
                      Descrizione (opzionale)
                    </label>
                    <input
                      ref={descRef}
                      id="expense-desc"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={selectedCategory?.name}
                      className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-accent transition-colors placeholder:text-muted/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="expense-date" className="block text-xs text-muted mb-1.5">
                      Data
                    </label>
                    <input
                      id="expense-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between py-1 cursor-pointer select-none">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-recurring font-mono" aria-hidden="true">↻</span>
                        Spesa ricorrente
                      </span>
                      <input
                        type="checkbox"
                        checked={recurring}
                        onChange={(e) => setRecurring(e.target.checked)}
                        className="w-4 h-4 accent-accent cursor-pointer"
                      />
                    </label>
                    {recurring && (
                      <p className="text-xs text-muted pl-6 pb-1">
                        Verrà proposta di nuovo alla chiusura del mese.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full h-11 bg-foreground text-background text-sm font-semibold rounded-xl mt-6 hover:bg-muted-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
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
