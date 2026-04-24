"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency, type Category } from "@/lib/types";

interface Props {
  categories: Category[];
  onAdd: (expense: {
    categoryId: string;
    amount: number;
    description: string;
    date: string;
  }) => void;
  onClose: () => void;
}

export function AddExpenseSheet({ categories, onAdd, onClose }: Props) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [step, setStep] = useState<"category" | "amount" | "details">("category");

  const amountRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "amount") amountRef.current?.focus();
    if (step === "details") descRef.current?.focus();
  }, [step]);

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return;
    if (!categoryId) return;

    onAdd({
      categoryId,
      amount: amountNum,
      description: description.trim() || categories.find((c) => c.id === categoryId)?.name || "",
      date,
    });
    onClose();
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 animate-slide-up">
        <div className="bg-surface border-t border-border rounded-t-2xl max-w-lg mx-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 rounded-full bg-border" />
          </div>

          <div className="px-6 pb-8">
            <h2 className="text-lg font-semibold tracking-tight mb-6">
              Nuova spesa
            </h2>

            {step === "category" && (
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setStep("amount");
                    }}
                    className="w-full flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-background transition-colors text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium flex-1">{cat.name}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-muted"
                    >
                      <path d="M4 2l4 4-4 4" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {step === "amount" && (
              <div>
                <button
                  onClick={() => setStep("category")}
                  className="flex items-center gap-2 text-sm text-muted hover:text-muted-hover mb-6 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M7 2L3 6l4 4" />
                  </svg>
                  <span>{selectedCategory?.name}</span>
                </button>

                <label className="block text-muted text-xs font-mono uppercase tracking-wider mb-3">
                  Importo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-muted font-light">
                    €
                  </span>
                  <input
                    ref={amountRef}
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    className="w-full bg-transparent text-4xl font-semibold tracking-tight pl-12 pr-4 py-4 border-b-2 border-border focus:border-accent outline-none transition-colors placeholder:text-muted/30"
                  />
                </div>

                <button
                  onClick={() => {
                    const num = parseFloat(amount);
                    if (num && num > 0) setStep("details");
                  }}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full h-12 bg-foreground text-background font-medium rounded-lg mt-8 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors"
                >
                  Continua
                </button>
              </div>
            )}

            {step === "details" && (
              <div>
                <button
                  onClick={() => setStep("amount")}
                  className="flex items-center gap-2 text-sm text-muted hover:text-muted-hover mb-6 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M7 2L3 6l4 4" />
                  </svg>
                  <span>{formatCurrency(parseFloat(amount))}</span>
                </button>

                <div className="space-y-5">
                  <div>
                    <label className="block text-muted text-xs font-mono uppercase tracking-wider mb-2">
                      Descrizione
                    </label>
                    <input
                      ref={descRef}
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={selectedCategory?.name}
                      className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none focus:border-accent transition-colors placeholder:text-muted/50"
                    />
                  </div>

                  <div>
                    <label className="block text-muted text-xs font-mono uppercase tracking-wider mb-2">
                      Data
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full h-12 bg-foreground text-background font-medium rounded-lg mt-8 hover:bg-muted-hover transition-colors"
                >
                  Aggiungi spesa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
