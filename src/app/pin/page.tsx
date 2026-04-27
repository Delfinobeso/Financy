"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@/components/PinPad";
import { isPinEnabled, verifyPin, setPin } from "@/lib/pin";

type Mode = "login" | "setup-create" | "setup-confirm";

export default function PinPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [pin, setCurrentPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isPinEnabled()) {
      setMode("login");
      setLabel("Inserisci il PIN");
    } else {
      setMode("setup-create");
      setLabel("Crea un PIN a 4 cifre");
    }
  }, []);

  const handlePinComplete = useCallback(async (completed: string) => {
    if (busy) return;
    setBusy(true);

    if (mode === "login") {
      const ok = await verifyPin(completed);
      if (ok) {
        router.replace("/dashboard");
      } else {
        try { navigator.vibrate([10, 50, 10]); } catch {}
        setError(true);
        setLabel("PIN non corretto");
        setTimeout(() => {
          setCurrentPin("");
          setError(false);
          setLabel("Inserisci il PIN");
          setBusy(false);
        }, 900);
      }
    } else if (mode === "setup-create") {
      setFirstPin(completed);
      setCurrentPin("");
      setMode("setup-confirm");
      setLabel("Conferma il PIN");
      setBusy(false);
    } else if (mode === "setup-confirm") {
      if (completed === firstPin) {
        await setPin(completed);
        router.replace("/dashboard");
      } else {
        try { navigator.vibrate([10, 50, 10]); } catch {}
        setError(true);
        setLabel("I PIN non coincidono");
        setTimeout(() => {
          setCurrentPin("");
          setFirstPin("");
          setError(false);
          setMode("setup-create");
          setLabel("Crea un PIN a 4 cifre");
          setBusy(false);
        }, 900);
      }
    }
  }, [busy, mode, firstPin, router]);

  const handleChange = (v: string) => {
    setCurrentPin(v);
    if (v.length === 4) handlePinComplete(v);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-8 py-16 max-w-sm mx-auto w-full">
      <div className="mb-12 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Financy</h1>
        <p className="text-muted text-sm mt-1">il tuo budget personale</p>
      </div>

      {mode !== "login" && (
        <div className="flex items-center gap-1.5 mb-10" aria-label="Passo corrente">
          <div className={`h-0.5 w-8 rounded-full transition-colors duration-200 ${mode === "setup-create" ? "bg-accent" : "bg-border"}`} />
          <div className={`h-0.5 w-8 rounded-full transition-colors duration-200 ${mode === "setup-confirm" ? "bg-accent" : "bg-border"}`} />
        </div>
      )}

      <PinPad value={pin} onChange={handleChange} label={label} error={error} />

      {mode !== "login" && (
        <button
          onClick={() => router.replace("/dashboard")}
          className="mt-10 text-sm text-muted hover:text-muted-hover transition-colors underline underline-offset-3 decoration-muted/40"
        >
          Continua senza PIN
        </button>
      )}
    </div>
  );
}
