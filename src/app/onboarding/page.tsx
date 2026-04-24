"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBudget } from "@/lib/context";
import { DEFAULT_CATEGORIES, formatCurrency, type Category } from "@/lib/types";

export default function Onboarding() {
  const { setup } = useBudget();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [categories, setCategories] = useState(
    DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: c.name.toLowerCase().replace(/\s+/g, "-") }))
  );

  const totalPercentage = useMemo(
    () => categories.reduce((sum, c) => sum + c.percentage, 0),
    [categories]
  );

  const handleIncomeChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setIncome(cleaned);
  };

  const handlePercentageChange = (index: number, value: number) => {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, percentage: value } : c))
    );
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
      {/* Progress dots */}
      <div className="flex gap-2 mb-12">
        <div className="h-1 flex-1 rounded-full bg-accent" />
        <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-accent" : "bg-border"}`} />
      </div>

      {step === 0 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-muted text-sm font-mono mb-2">Step 1 di 2</p>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">
              Quanto guadagni al mese?
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              Inserisci il tuo reddito mensile netto. Lo useremo per calcolare i limiti del tuo budget.
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-full">
              <label className="block text-muted text-xs font-mono uppercase tracking-wider mb-3">
                Reddito mensile
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-muted font-light">
                  €
                </span>
                <input
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
            className="w-full h-12 bg-foreground text-background font-medium rounded-lg disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors"
          >
            Continua
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-muted text-sm font-mono mb-2">Step 2 di 2</p>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">
              Ripartisci il budget
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              Distribuisci il tuo reddito tra le categorie. Il totale deve essere 100%.
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
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm font-mono tabular-nums">
                      <span className="text-muted">{category.percentage}%</span>
                      <span className="text-muted mx-2">—</span>
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={category.percentage}
                    onChange={(e) => handlePercentageChange(idx, parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
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
              className="h-12 px-6 border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors"
            >
              Indietro
            </button>
            <button
              onClick={handleFinish}
              disabled={totalPercentage !== 100}
              className="flex-1 h-12 bg-foreground text-background font-medium rounded-lg disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors"
            >
              Inizia a usare Financy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
