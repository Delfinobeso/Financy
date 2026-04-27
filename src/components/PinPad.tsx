"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  label?: string;
  error?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function PinPad({ value, onChange, maxLength = 4, label, error }: Props) {
  const handleKey = (key: string) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
    } else if (key !== "" && value.length < maxLength) {
      onChange(value + key);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Dot indicators */}
      <div
        className={`flex gap-3.5 ${error ? "motion-safe:animate-[shake_0.4s_cubic-bezier(.36,.07,.19,.97)_both]" : ""}`}
        aria-label={`${value.length} di ${maxLength} cifre inserite`}
      >
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full transition-all duration-200"
            style={{
              backgroundColor: i < value.length
                ? error ? "var(--color-danger)" : "var(--color-accent)"
                : "var(--color-border)",
              transform: i < value.length ? "scale(1.15)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Label */}
      {label && (
        <p
          className="text-sm text-center transition-colors duration-200 min-h-[20px]"
          style={{ color: error ? "var(--color-danger)" : "var(--color-muted)" }}
        >
          {label}
        </p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] mt-1">
        {KEYS.map((key, i) =>
          key === "" ? (
            <div key={i} aria-hidden="true" />
          ) : key === "⌫" ? (
            <button
              key={i}
              type="button"
              onClick={() => handleKey(key)}
              className="h-14 flex items-center justify-center rounded-2xl text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none active:scale-90 text-xl"
              aria-label="Cancella"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5H8L3 10l5 5h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
                <path d="M12 8l-4 4M8 8l4 4" />
              </svg>
            </button>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => handleKey(key)}
              className="h-14 rounded-2xl bg-surface border border-border text-lg font-medium hover:bg-surface2 hover:border-border-hover transition-all focus-visible:ring-2 focus-visible:ring-accent outline-none active:scale-90"
              aria-label={`Cifra ${key}`}
            >
              {key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
