"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBudget } from "@/lib/context";
import { DEFAULT_CATEGORIES, formatCurrency, generateId } from "@/lib/types";

export default function Onboarding() {
  const { setup } = useBudget();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      DEFAULT_CATEGORIES.map((c) => [c.name, ""])
    )
  );

  const incomeNum = parseFloat(income) || 0;

  const totalAllocated = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [amounts]
  );

  const remaining = incomeNum - totalAllocated;
  const isBalanced = Math.abs(remaining) < 0.01 && incomeNum > 0;
  const allocatedPct = incomeNum > 0 ? Math.min((totalAllocated / incomeNum) * 100, 100) : 0;

  const autofill = () => {
    if (!incomeNum) return;
    const filled: Record<string, string> = {};
    DEFAULT_CATEGORIES.forEach((c) => {
      filled[c.name] = String(Math.round((c.percentage / 100) * incomeNum));
    });
    setAmounts(filled);
  };

  const handleFinish = () => {
    if (!incomeNum || !isBalanced) return;
    const categories = DEFAULT_CATEGORIES.map((c) => {
      const amt = parseFloat(amounts[c.name]) || 0;
      return {
        ...c,
        id: generateId(),
        percentage: Math.round((amt / incomeNum) * 10000) / 100,
      };
    });
    setup(incomeNum, categories);
    router.replace("/dashboard");
  };

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-6 py-12">
      <div
        className="flex gap-2 mb-12"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={2}
        aria-label={`Step ${step + 1} di 2`}
      >
        <div className="h-1 flex-1 rounded-full bg-accent" />
        <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-accent" : "bg-border"}`} />
      </div>

      {step === 0 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-muted text-sm mb-2">Step 1 di 2</p>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">
              Quanto guadagni al mese?
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              Inserisci il tuo reddito netto — useremo questa cifra per calcolare i limiti di ogni categoria.
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-full">
              <label htmlFor="income-input" className="block text-muted text-xs tracking-wider mb-3">
                Reddito mensile
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-muted font-light" aria-hidden="true">
                  €
                </span>
                <input
                  id="income-input"
                  type="text"
                  inputMode="numeric"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  autoFocus
                  className="w-full bg-transparent text-5xl font-semibold tracking-tight pl-12 pr-4 py-6 border-b-2 border-border focus:border-accent outline-none transition-colors placeholder:text-muted/30"
                />
              </div>
              {income && (
                <p className="mt-3 text-muted text-sm">
                  {formatCurrency(incomeNum)} / mese
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => incomeNum > 0 && setStep(1)}
            disabled={!incomeNum}
            className="w-full h-12 bg-foreground text-background font-medium rounded-lg disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
          >
            Continua
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="mb-6 shrink-0">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-muted text-sm mb-1">Step 2 di 2</p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Come vuoi suddividerlo?
                </h1>
              </div>
              <button
                onClick={autofill}
                className="mt-1 text-xs text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-accent/10 transition-colors shrink-0"
              >
                Usa consigliati
              </button>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Allocato</span>
                <span className={`font-mono tabular-nums ${isBalanced ? "text-success" : remaining < 0 ? "text-danger" : ""}`}>
                  {remaining >= 0
                    ? `${formatCurrency(remaining)} rimanenti`
                    : `${formatCurrency(Math.abs(remaining))} in eccesso`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${remaining < 0 ? "bg-danger" : isBalanced ? "bg-success" : "bg-accent"}`}
                  style={{ width: `${allocatedPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pb-4">
            {DEFAULT_CATEGORIES.map((cat) => {
              const suggested = Math.round((cat.percentage / 100) * incomeNum);
              return (
                <div key={cat.name} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-surface">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.name}</p>
                    <p className="text-xs text-muted">{cat.percentage}% suggerito · {formatCurrency(suggested)}</p>
                  </div>
                  <div className="relative shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted" aria-hidden="true">€</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amounts[cat.name]}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [cat.name]: e.target.value.replace(/[^0-9.]/g, "") }))}
                      placeholder={String(suggested)}
                      className="w-24 bg-background border border-border rounded-lg h-9 pl-6 pr-2 text-sm font-mono text-right outline-none focus:border-accent transition-colors placeholder:text-muted/40"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4 shrink-0">
            <button
              onClick={() => setStep(0)}
              className="h-12 px-6 border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
            >
              Indietro
            </button>
            <button
              onClick={handleFinish}
              disabled={!isBalanced}
              className="flex-1 h-12 bg-foreground text-background font-medium rounded-lg disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
            >
              Inizia a usare Financy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
