"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/context";
import {
  formatCurrency,
  CATEGORY_COLORS,
  generateId,
  downloadJSON,
  type Category,
} from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { PinPad } from "@/components/PinPad";
import { isPinEnabled, setPin, clearPin } from "@/lib/pin";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

const CAT_COLORS = [
  "#7c5cfc","#e4a951","#4cb782","#ffd93d","#ff6b6b",
  "#4ecdc4","#5e6ad2","#3ec8a0","#e5484d","#6c5ce7",
];

function CategoryEditor({
  category, categories, onSave, onDelete, canDelete, monthlyIncome,
}: {
  category: Category; categories: Category[]; onSave: (c: Category) => void;
  onDelete: (id: string, migrateTo: string) => void; canDelete: boolean; monthlyIncome: number;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [pct, setPct] = useState(category.percentage.toString());
  const [color, setColor] = useState(category.color);

  const pctNum = parseFloat(pct) || 0;
  const monthlyAmt = (monthlyIncome * pctNum) / 100;

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-surface2 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
          <div>
            <p className="text-sm font-medium">{category.name}</p>
            <p className="text-xs text-muted font-mono">{category.percentage}% · {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(monthlyAmt)}</p>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="text-muted hover:text-muted-hover opacity-0 group-hover:opacity-100 transition-all text-xs">
          Modifica
        </button>
      </div>
    );
  }

  return (
    <div className="py-3 px-3 rounded-xl bg-surface border border-border space-y-3">
      <div>
        <label className="block text-xs text-muted mb-1.5">Nome</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-background border border-border rounded-xl h-9 px-3 text-sm outline-none focus:border-accent transition-colors" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1.5">
          Percentuale
          {monthlyIncome > 0 && pctNum > 0 && (
            <span className="ml-1.5 text-muted/60">— {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(monthlyAmt)}/mese</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className="w-20 bg-background border border-border rounded-xl h-9 px-3 text-sm font-mono outline-none focus:border-accent transition-colors"
          />
          <span className="text-sm text-muted">%</span>
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1.5">Colore</label>
        <div className="flex gap-2 flex-wrap">
          {CAT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                outline: color === c ? `2px solid ${c}` : "none",
                outlineOffset: "2px",
              }}
              aria-label={`Colore ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { onSave({ ...category, name: name.trim() || category.name, percentage: pctNum, color }); setEditing(false); }}
          className="flex-1 h-8 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-muted-hover transition-colors"
        >Salva</button>
        <button onClick={() => setEditing(false)} className="h-8 px-3 border border-border rounded-xl text-xs hover:bg-surface transition-colors">Annulla</button>
        {canDelete && (
          <button onClick={() => { const other = categories.find((c) => c.id !== category.id); if (other) onDelete(category.id, other.id); }} className="h-8 px-3 border border-danger/30 text-danger text-xs rounded-xl hover:bg-danger/10 transition-colors">Elimina</button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { budget, setIncome, editCategory, addCategory, deleteCategory, reset } = useBudget();
  const fileRef = useRef<HTMLInputElement>(null);
  const [incomeValue, setIncomeValue] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPct, setNewCatPct] = useState(10);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);

  // PIN state
  const [pinEnabled, setPinEnabled] = useState(() => isPinEnabled());
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"create" | "confirm">("create");
  const [pinInput, setPinInput] = useState("");
  const [pinFirst, setPinFirst] = useState("");
  const [pinLabel, setPinLabel] = useState("Nuovo PIN a 4 cifre");
  const [pinError, setPinError] = useState(false);

  // Theme state
  const [theme, setCurrentTheme] = useState<Theme>(() => getTheme());

  if (!budget) return null;

  const totalPercentage = budget.categories.reduce((s, c) => s + c.percentage, 0);

  const handleIncomeSave = () => {
    const val = parseFloat(incomeValue);
    if (val && val > 0) { setIncome(val); setIncomeValue(""); }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({ id: generateId(), name: newCatName.trim(), percentage: newCatPct, color: CATEGORY_COLORS[budget.categories.length % CATEGORY_COLORS.length] });
    setNewCatName(""); setNewCatPct(10); setShowNewCategory(false);
  };

  const handleToggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setCurrentTheme(next);
  };

  const openSetupPin = () => {
    setPinModalMode("create");
    setPinInput("");
    setPinFirst("");
    setPinLabel("Nuovo PIN a 4 cifre");
    setPinError(false);
    setShowPinModal(true);
  };

  const handlePinInput = async (v: string) => {
    setPinInput(v);
    if (v.length < 4) return;
    if (pinModalMode === "create") {
      setPinFirst(v);
      setPinInput("");
      setPinModalMode("confirm");
      setPinLabel("Conferma il PIN");
    } else {
      if (v === pinFirst) {
        await setPin(v);
        setPinEnabled(true);
        setShowPinModal(false);
      } else {
        setPinError(true);
        setPinLabel("I PIN non coincidono.");
        setTimeout(() => {
          setPinInput("");
          setPinFirst("");
          setPinError(false);
          setPinModalMode("create");
          setPinLabel("Nuovo PIN a 4 cifre");
        }, 900);
      }
    }
  };

  const handleDisablePin = () => {
    clearPin();
    setPinEnabled(false);
  };

  const validateBackup = (data: unknown): string | null => {
    if (!data || typeof data !== "object") return "Il file non è un JSON valido.";
    const d = data as Record<string, unknown>;
    if (typeof d.monthlyIncome !== "number" || d.monthlyIncome <= 0)
      return "Campo monthlyIncome mancante o non valido.";
    if (!Array.isArray(d.categories) || d.categories.length === 0)
      return "Campo categories mancante o vuoto.";
    if (!Array.isArray(d.expenses))
      return "Campo expenses mancante.";
    for (const cat of d.categories as unknown[]) {
      const c = cat as Record<string, unknown>;
      if (typeof c.id !== "string" || typeof c.name !== "string" || typeof c.percentage !== "number")
        return "Una o più categorie hanno una struttura non valida.";
    }
    return null;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const err = validateBackup(data);
        if (err) { setImportError(err); return; }
        setPendingImport(JSON.stringify(data));
      } catch { setImportError("Errore nella lettura del file. Assicurati che sia un backup Financy."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    localStorage.setItem("financy-budget", pendingImport);
    setPendingImport(null);
    window.location.reload();
  };

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-6 pt-8" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
      <header className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Impostazioni</h1>
      </header>

      <section className="mb-8">
        <h2 className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-3">Reddito mensile</h2>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-2xl font-semibold tracking-tight tabular-nums mb-3">{formatCurrency(budget.monthlyIncome)}</p>
          <div className="flex gap-2">
            <input type="text" inputMode="numeric" value={incomeValue} onChange={(e) => setIncomeValue(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Nuovo reddito" className="flex-1 bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none focus:border-accent transition-colors placeholder:text-muted/50" />
            <button onClick={handleIncomeSave} disabled={!incomeValue || parseFloat(incomeValue) <= 0} className="h-10 px-4 bg-foreground text-background text-sm font-medium rounded-lg disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors">Aggiorna</button>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium text-muted/70 uppercase tracking-widest">Categorie</h2>

          <span className={`text-xs font-mono tabular-nums ${totalPercentage === 100 ? "text-success" : "text-warning"}`}>Totale: {totalPercentage}%</span>
        </div>
        <div className="space-y-1">
          {budget.categories.map((cat) => (
            <CategoryEditor key={cat.id} category={cat} categories={budget.categories} onSave={editCategory} onDelete={deleteCategory} canDelete={budget.categories.length > 1} monthlyIncome={budget.monthlyIncome} />
          ))}
        </div>
        {showNewCategory ? (
          <div className="mt-3 p-3 rounded-lg bg-surface border border-border space-y-3">
            <div><label className="block text-muted text-xs tracking-wider mb-1">Nome</label><input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nuova categoria" className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm outline-none focus:border-accent transition-colors placeholder:text-muted/50" autoFocus /></div>
            <div><label className="block text-muted text-xs tracking-wider mb-1">Percentuale: {newCatPct}%</label><input type="range" min={0} max={100} value={newCatPct} onChange={(e) => setNewCatPct(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: CATEGORY_COLORS[budget.categories.length % CATEGORY_COLORS.length] }} /></div>
            <div className="flex gap-2">
              <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="flex-1 h-8 bg-foreground text-background text-xs font-medium rounded-lg disabled:opacity-20 disabled:cursor-not-allowed hover:bg-muted-hover transition-colors">Aggiungi</button>
              <button onClick={() => setShowNewCategory(false)} className="h-8 px-3 border border-border rounded-lg text-xs hover:bg-surface transition-colors">Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewCategory(true)} className="w-full mt-3 h-10 border border-dashed border-border rounded-lg text-sm text-muted hover:text-muted-hover hover:bg-surface transition-colors">+ Nuova categoria</button>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-4">Dati</h2>
        <div className="space-y-2">
          <button onClick={() => downloadJSON(budget, `financy-backup-${new Date().toISOString().slice(0, 10)}.json`)} className="w-full h-10 border border-border rounded-lg text-sm text-muted hover:text-muted-hover hover:bg-surface transition-colors">Esporta backup</button>
          <button onClick={() => fileRef.current?.click()} className="w-full h-10 border border-border rounded-lg text-sm text-muted hover:text-muted-hover hover:bg-surface transition-colors">Importa backup</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-4">Aspetto</h2>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            onClick={handleToggleTheme}
            className="w-full flex items-center justify-between py-3 px-4 hover:bg-background transition-colors"
          >
            <span className="text-sm">Tema</span>
            <div className="flex items-center gap-2 text-muted text-sm">
              <span>{theme === "dark" ? "Scuro" : "Chiaro"}</span>
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="8" cy="8" r="3" />
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M3.2 12.8l1.1-1.1M11.7 4.3l1.1-1.1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M14 8.5A6 6 0 0 1 7.5 2a6 6 0 1 0 6.5 6.5z" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-4">Sicurezza</h2>
        <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border">
          <div className="flex items-center justify-between py-3 px-4">
            <div>
              <p className="text-sm font-medium">PIN di sblocco</p>
              <p className="text-xs text-muted mt-0.5">{pinEnabled ? "Attivo" : "Non impostato"}</p>
            </div>
            <button
              onClick={pinEnabled ? handleDisablePin : openSetupPin}
              className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
                pinEnabled
                  ? "border-danger/30 text-danger hover:bg-danger/10"
                  : "border-accent/30 text-accent hover:bg-accent/10"
              }`}
            >
              {pinEnabled ? "Disattiva" : "Attiva"}
            </button>
          </div>
          {pinEnabled && (
            <button
              onClick={openSetupPin}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-background transition-colors text-left"
            >
              <span className="text-sm">Cambia PIN</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted" aria-hidden="true">
                <path d="M5 3l4 4-4 4" />
              </svg>
            </button>
          )}
        </div>
      </section>

      <div className="h-px bg-border mb-8" />

      <section>
        <h2 className="text-xs font-medium text-muted/70 uppercase tracking-widest mb-4">Zona pericolosa</h2>
        <button onClick={() => setShowResetDialog(true)} className="w-full h-10 border border-danger/30 text-danger rounded-lg text-sm hover:bg-danger/10 transition-colors">Resetta tutti i dati</button>
      </section>

      <p className="text-center text-muted/40 text-xs mt-12">Financy v1.0 — I tuoi dati sono salvati solo su questo dispositivo</p>

      <BottomNav active="settings" />

      {/* Import confirm dialog */}
      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[oklch(0_0_0/0.6)]" onClick={() => setPendingImport(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 mx-6 max-w-sm w-full animate-scale-in" role="alertdialog">
            <h3 className="text-base font-semibold tracking-tight mb-2">Importa backup</h3>
            <p className="text-muted text-sm mb-5">Tutti i dati attuali verranno sostituiti con quelli del file. L&apos;operazione non è reversibile.</p>
            <div className="flex gap-3">
              <button onClick={() => setPendingImport(null)} className="flex-1 h-10 border border-border rounded-xl text-sm font-medium hover:bg-surface2 transition-colors">Annulla</button>
              <button onClick={confirmImport} className="flex-1 h-10 bg-foreground text-background text-sm font-semibold rounded-xl hover:bg-muted-hover transition-colors">Importa</button>
            </div>
          </div>
        </div>
      )}

      {/* Import error dialog */}
      {importError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[oklch(0_0_0/0.6)]" onClick={() => setImportError(null)} />
          <div className="relative bg-surface border border-danger/30 rounded-2xl p-6 mx-6 max-w-sm w-full animate-scale-in" role="alertdialog">
            <h3 className="text-base font-semibold tracking-tight mb-2 text-danger">File non valido</h3>
            <p className="text-muted text-sm mb-5">{importError}</p>
            <button onClick={() => setImportError(null)} className="w-full h-10 border border-border rounded-xl text-sm font-medium hover:bg-surface2 transition-colors">Ok</button>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[oklch(0_0_0/0.6)]" onClick={() => setShowPinModal(false)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 mx-6 max-w-sm w-full motion-safe:animate-slide-up flex flex-col items-center gap-4" role="dialog" aria-label="Imposta PIN">
            <h3 className="text-lg font-semibold tracking-tight self-start">
              {pinModalMode === "create" ? "Imposta PIN" : "Conferma PIN"}
            </h3>
            <PinPad
              value={pinInput}
              onChange={handlePinInput}
              label={pinLabel}
              error={pinError}
            />
            <button onClick={() => setShowPinModal(false)} className="text-sm text-muted hover:text-muted-hover transition-colors">
              Annulla
            </button>
          </div>
        </div>
      )}

      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[oklch(0_0_0/0.6)]" onClick={() => setShowResetDialog(false)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 mx-6 max-w-sm w-full motion-safe:animate-slide-up" role="alertdialog" aria-labelledby="settings-reset-title">
            <h3 id="settings-reset-title" className="text-lg font-semibold tracking-tight mb-2">Resettare tutti i dati?</h3>
            <p className="text-muted text-sm mb-6">Budget, categorie e spese saranno eliminati. Non è reversibile.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetDialog(false)} className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors">Annulla</button>
              <button onClick={() => { reset(); window.location.href = "/onboarding"; }} className="flex-1 h-10 bg-danger text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Resetta tutto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
