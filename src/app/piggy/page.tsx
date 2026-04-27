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

  const parseMonthKey = (key: string) => {
    const [year, month] = key.split("-").map(Number);
    return { year, month: month - 1 };
  };

  // polish: sparkline extracted from IIFE to named variable
  const sparkline = sortedMonths.length >= 2 ? (() => {
    const values = [...sortedMonths].reverse().map(([, m]) => m.saved);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const W = 280, H = 48, pad = 6;
    const pts = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (W - pad * 2);
      const y = H - pad - ((v - min) / range) * (H - pad * 2);
      return `${x},${y}`;
    }).join(" ");
    const lastPositive = values[values.length - 1] >= 0;
    const strokeColor = lastPositive ? "var(--color-success)" : "var(--color-danger)";
    return (
      <div className="mb-6">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <polyline points={pts} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          {values.map((v, i) => {
            const x = pad + (i / (values.length - 1)) * (W - pad * 2);
            const y = H - pad - ((v - min) / range) * (H - pad * 2);
            return <circle key={i} cx={x} cy={y} r="3" fill={v >= 0 ? "var(--color-success)" : "var(--color-danger)"} />;
          })}
        </svg>
      </div>
    );
  })() : null;

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-6 pt-8" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Salvadanaio</h1>
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-success">
          {formatCurrency(piggyTotal)}
        </p>
        {last3Saved.length > 0 && (
          <p className="text-sm text-muted mt-1.5">
            <span className="tabular-nums">{formatCurrency(avgMonthly)}</span>/mese in media
            {" · "}
            <span className="tabular-nums">{formatCurrency(annualProjection)}</span> proiettati quest&apos;anno
          </p>
        )}
      </div>

      {/* Sparkline trend */}
      {sparkline}

      <p className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-3">Mesi chiusi</p>

      {sortedMonths.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted text-sm">Nessun mese chiuso ancora</p>
          <p className="text-muted/50 text-xs mt-1.5 max-w-[240px] leading-relaxed">
            Torna alla dashboard a fine mese per chiuderlo e salvare l&apos;avanzo
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMonths.map(([key, data]) => {
            const { year, month } = parseMonthKey(key);
            const isPositive = data.saved >= 0;
            const spentPct = data.budget > 0 ? Math.min((data.spent / data.budget) * 100, 100) : 0;

            return (
              <div key={key} className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-sm font-medium">{formatMonthLabel(year, month)}</p>
                  <span className={`text-sm font-semibold font-mono tabular-nums ${isPositive ? "text-success" : "text-danger"}`}>
                    {isPositive ? "+" : ""}{formatCurrency(data.saved)}
                  </span>
                </div>

                {/* Single bar: spent % of budget, colored by outcome */}
                <div className="h-1.5 rounded-full bg-border overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${spentPct}%`,
                      backgroundColor: isPositive ? "var(--color-success)" : "var(--color-danger)",
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted font-mono tabular-nums">
                  <span>Speso {formatCurrency(data.spent)}</span>
                  <span>Budget {formatCurrency(data.budget)}</span>
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
