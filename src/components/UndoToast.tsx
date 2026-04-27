"use client";

import { useEffect, useState } from "react";

interface Props {
  label: string;
  durationMs?: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ label, durationMs = 5000, onUndo, onDismiss }: Props) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 50);
    const dismiss = setTimeout(onDismiss, durationMs + 100);
    return () => { clearInterval(interval); clearTimeout(dismiss); };
  }, [durationMs, onDismiss]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-sm animate-slide-up overflow-hidden rounded-xl bg-surface border border-border shadow-lg"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <div
          className="h-full bg-accent transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="flex-1 text-sm truncate text-muted">{label} eliminata</p>
        <button
          onClick={onUndo}
          className="text-sm font-semibold text-accent hover:underline shrink-0"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
