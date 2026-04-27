"use client";

import Link from "next/link";
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

  const last3 = sortedMonths.slice(0, 3).map(([, m]) => m.saved);
  const avgMonthly = last3.length > 0 ? last3.reduce((s, v) => s + v, 0) / last3.length : 0;
  const annualProjection = avgMonthly * 12;

  const parseMonthKey = (key: string) => {
    const [year, month] = key.split("-").map(Number);
    return { year, month: month - 1 };
  };

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-6 py-8 pb-24">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/dashboard"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-surface transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
            aria-label="Torna alla dashboard"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M9 3L5 7l4 4" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Salvadanaio</h1>
        </div>
      </header>

      {/* Hero card */}
      <div className="bg-surface border border-success/20 rounded-2xl p-6 mb-6">
        <p className="text-muted text-xs tracking-wider mb-2">Totale accumulato</p>
        <p className="text-4xl font-semibold tracking-tight tabular-nums text-success mb-4">
          {formatCurrency(piggyTotal)}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background border border-border rounded-xl p-3">
            <p className="text-muted text-xs mb-1">Media / mese</p>
            <p className="text-base font-semibold font-mono tabular-nums">
              {last3.length > 0 ? formatCurrency(avgMonthly) : "—"}
            </p>
            {last3.length > 0 && (
              <p className="text-muted text-xs mt-0.5">ultimi {last3.length} {last3.length === 1 ? "mese" : "mesi"}</p>
            )}
          </div>
          <div className="bg-background border border-border rounded-xl p-3">
            <p className="text-muted text-xs mb-1">Proiezione annuale</p>
            <p className="text-base font-semibold font-mono tabular-nums">
              {last3.length > 0 ? formatCurrency(annualProjection) : "—"}
            </p>
            {last3.length > 0 && (
              <p className="text-muted text-xs mt-0.5">al ritmo attuale</p>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <section>
        <h2 className="text-xs tracking-wider text-muted mb-4">Storico mesi chiusi</h2>
        {sortedMonths.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3" aria-hidden="true">🐷</p>
            <p className="text-muted text-sm">Nessun mese chiuso ancora</p>
            <p className="text-muted/50 text-xs mt-1">Chiudi il mese dalla dashboard per vedere i risparmi qui</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedMonths.map(([key, data]) => {
              const { year, month } = parseMonthKey(key);
              const isPositive = data.saved >= 0;
              return (
                <div key={key} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{formatMonthLabel(year, month)}</p>
                    <span className={`text-sm font-semibold font-mono tabular-nums ${isPositive ? "text-success" : "text-danger"}`}>
                      {isPositive ? "+" : ""}{formatCurrency(data.saved)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted font-mono tabular-nums">
                    <span>Budget {formatCurrency(data.budget)}</span>
                    <span>Speso {formatCurrency(data.spent)}</span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((data.spent / data.budget) * 100, 100)}%`,
                        backgroundColor: isPositive ? "var(--color-success)" : "var(--color-danger)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <BottomNav active="piggy" />
    </div>
  );
}
