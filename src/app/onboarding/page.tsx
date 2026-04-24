"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBudget } from "@/lib/context";
import { DEFAULT_CATEGORIES, formatCurrency } from "@/lib/types";

export default function Onboarding() {
  const { setup } = useBudget();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [categories, setCategories] = useState(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, id: c.name.toLowerCase().replace(/\s+/g, "-") }))
  );

  const totalPercentage = useMemo(
    () => categories.reduce((sum, c) => sum + c.percentage, 0),
    [categories]
  );

  const handleIncomeChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setIncome(cleaned);
  };

  const handlePercentageChange = (index: number, newValue: number) => {
    setCategories((prev) => {
      const oldValue = prev[index].percentage;
      const delta = newValue - oldValue;
      const others = prev
        .map((c, i) => ({ i, pct: c.percentage }))
        .filter((x) => x.i !== index);

      const totalOtherPct = others.reduce((s, x) => s + x.pct, 0);

      const next = prev.map((c, i) => {
        if (i === index) return { ...c, percentage: newValue };
        if (totalOtherPct > 0) {
          const share = c.percentage / totalOtherPct;
          return { ...c, percentage: Math.max(0, c.percentage - Math.round(delta * share)) };
        }
        return c;
      });

      const sum = next.reduce((s, c) => s + c.percentage, 0);
      if (sum !== 100 && next.length > 1) {
        let diff = 100 - sum;
        const targetIndex = next.findIndex((_, i) => i !== index);
        if (targetIndex >= 0) {
          next[targetIndex] = {
            ...next[targetIndex],
            percentage: Math.max(0, next[targetIndex].percentage + diff),
          };
        }
      }

      return next;
    });
  };

  const handleFinish = () => {
    const incomeNum = parseFloat(income);
    if (!incomeNum || incomeNum <= 0) return;
    if (totalPercentage !== 100) return;
    setup(incomeNum, categories);
    router.replace("/dashboard");
  };

  const incomeNum = parseFloat(income) || 0;

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
                  onChange={(e) => handleIncomeChange(e.target.value)}
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
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-muted text-sm mb-2">Step 2 di 2</p>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">
              Come vuoi suddividerlo?
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              Sposta uno slider e gli altri si adattano da soli per restare a 100%.
            </p>
          </div>

          <div className="flex-1 space-y-8">
            {categories.map((category, idx) => {
              const amount = (incomeNum * category.percentage) / 100;
              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm font-mono tabular-nums">
                      <span className="text-muted">{category.percentage}%</span>
                      <span className="text-muted mx-2">—</span>
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <label htmlFor={`slider-${category.id}`} className="sr-only">
                    {category.name}: {category.percentage}%
                  </label>
                  <input
                    id={`slider-${category.id}`}
                    type="range"
                    min={0}
                    max={100}
                    value={category.percentage}
                    onChange={(e) => handlePercentageChange(idx, parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus-visible:ring-2 focus-visible:ring-accent outline-none"
                    style={{
                      background: `linear-gradient(to right, ${category.color} 0%, ${category.color} ${category.percentage}%, #1f1f1f ${category.percentage}%, #1f1f1f 100%)`,
                      accentColor: category.color,
                    }}
                  />
                </div>
              );
            })}

            <div
              className={`flex items-center justify-between py-3 px-4 rounded-lg border ${
                totalPercentage === 100
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-danger/30 bg-danger/5 text-danger"
              }`}
              role="status"
              aria-live="polite"
              aria-label={`Totale allocazione: ${totalPercentage}%. ${totalPercentage === 100 ? "Bilanciato" : "Deve essere 100%"}`}
            >
              <span className="text-sm font-mono">Totale</span>
              <span className="text-sm font-mono tabular-nums font-medium">
                {totalPercentage}%
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setStep(0)}
              className="h-12 px-6 border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
            >
              Indietro
            </button>
            <button
              onClick={handleFinish}
              disabled={totalPercentage !== 100}
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
