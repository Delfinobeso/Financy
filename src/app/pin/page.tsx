"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (isPinEnabled()) {
      setMode("login");
      setLabel("Inserisci il tuo PIN");
    } else {
      setMode("setup-create");
      setLabel("Crea un PIN a 4 cifre");
    }
  }, []);

  useEffect(() => {
    if (pin.length < 4) return;

    if (mode === "login") {
      if (verifyPin(pin)) {
        router.replace("/dashboard");
      } else {
        setError(true);
        setLabel("PIN errato. Riprova.");
        setTimeout(() => {
          setCurrentPin("");
          setError(false);
          setLabel("Inserisci il tuo PIN");
        }, 900);
      }
    } else if (mode === "setup-create") {
      setFirstPin(pin);
      setCurrentPin("");
      setMode("setup-confirm");
      setLabel("Conferma il PIN");
    } else if (mode === "setup-confirm") {
      if (pin === firstPin) {
        setPin(pin);
        router.replace("/dashboard");
      } else {
        setError(true);
        setLabel("I PIN non coincidono.");
        setTimeout(() => {
          setCurrentPin("");
          setFirstPin("");
          setError(false);
          setMode("setup-create");
          setLabel("Crea un PIN a 4 cifre");
        }, 900);
      }
    }
  }, [pin, mode, firstPin, router]);

  const handleSkip = () => {
    router.replace("/dashboard");
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-12 max-w-lg mx-auto w-full">
      <div className="mb-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Financy</h1>
        <p className="text-muted text-sm">il tuo budget personale</p>
      </div>

      {mode !== "login" && (
        <div className="flex gap-2 mb-8">
          <div className={`w-6 h-1 rounded-full transition-colors ${mode === "setup-create" ? "bg-accent" : "bg-border"}`} />
          <div className={`w-6 h-1 rounded-full transition-colors ${mode === "setup-confirm" ? "bg-accent" : "bg-border"}`} />
        </div>
      )}

      <PinPad
        value={pin}
        onChange={setCurrentPin}
        label={label}
        error={error}
      />

      {mode !== "login" && (
        <button
          onClick={handleSkip}
          className="mt-8 text-sm text-muted hover:text-muted-hover underline underline-offset-2 transition-colors"
        >
          Continua senza PIN
        </button>
      )}
    </div>
  );
}
