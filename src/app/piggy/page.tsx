"use client";

import { useBudget } from "@/lib/context";
import { formatCurrency, formatMonthLabel } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";

export default function Piggy() {
  const { budget, isLoaded } = useBudget();

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!budget) return null;

  const closedMonths = budget.closedMonths ?? {};
  const piggyTotal = budget.piggyBankTotal ?? 0;

  const sortedMonths = Object.entries(closedMonths).sort(([a], [b]) => b.localeCompare(a));

  const last3Saved = sortedMonths.slice(0, 3).map(([, m]) => m.saved);
  const avgMonthly = last3Saved.length > 0
    ? last3Saved.reduce((s, v) => s + v, 0) / last3Saved.length
    : 0;
  const annualProjection = avgMonthly * 12;

  const maxAbs = sortedMonths.length > 0
    ? Math.max(...sortedMonths.map(([, m]) => Math.abs(m.saved)))
    : 1;

  const parseMonthKey = (key: string) => {
    const [year, month] = key.split("-").map(Number);
    return { year, month: month - 1 };
  };

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-6 pt-8" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-1">Salvadanaio</p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatCurrency(piggyTotal)}
        </p>
        {last3Saved.length > 0 && (
          <p className="text-sm text-muted mt-1">
            {formatCurrency(avgMonthly)}/mese in media · {formatCurrency(annualProjection)} proiettati quest&apos;anno
          </p>
        )}
      </div>

      {/* History */}
      <p className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-3">Mesi chiusi</p>

      {sortedMonths.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted text-sm">Nessun mese chiuso ancora</p>
          <p className="text-muted/50 text-xs mt-1.5 max-w-[240px] leading-relaxed">
            Torna alla dashboard a fine mese per chiuderlo e salvare l&apos;avanzo
          </p>
        </div>
      ) : (
        <div className="space-y-px">
          {sortedMonths.map(([key, data]) => {
            const { year, month } = parseMonthKey(key);
            const isPositive = data.saved >= 0;
            const barWidth = maxAbs > 0 ? Math.abs(data.saved) / maxAbs : 0;
            const spentPct = data.budget > 0 ? Math.min((data.spent / data.budget) * 100, 100) : 0;

            return (
              <div key={key} className="py-3">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-sm font-medium">{formatMonthLabel(year, month)}</p>
                  <span className={`text-sm font-mono tabular-nums font-semibold ${isPositive ? "text-success" : "text-danger"}`}>
                    {isPositive ? "+" : ""}{formatCurrency(data.saved)}
                  </span>
                </div>

                {/* Spending bar */}
                <div className="h-1.5 rounded-full bg-border overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${spentPct}%`,
                      backgroundColor: isPositive ? "var(--color-success)" : "var(--color-danger)",
                      opacity: 0.7,
                    }}
                  />
                </div>

                {/* Relative bar showing this month's saving vs max */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-0.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barWidth * 100}%`,
                        backgroundColor: isPositive ? "var(--color-success)" : "var(--color-danger)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted font-mono tabular-nums shrink-0">
                    {formatCurrency(data.spent)} / {formatCurrency(data.budget)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav active="piggy" />
    </div>
  );
}
