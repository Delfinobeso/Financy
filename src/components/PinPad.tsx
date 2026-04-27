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
    } else if (key === "") {
      // ghost cell — no action
    } else if (value.length < maxLength) {
      onChange(value + key);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Dot indicators */}
      <div className="flex gap-4" aria-label={`PIN: ${value.length} di ${maxLength} cifre inserite`}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
              i < value.length
                ? error
                  ? "bg-danger scale-110"
                  : "bg-accent scale-110"
                : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      {label && (
        <p className={`text-sm text-center transition-colors ${error ? "text-danger" : "text-muted"}`}>
          {label}
        </p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[288px]">
        {KEYS.map((key, i) => (
          key === "" ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => handleKey(key)}
              className={`h-14 rounded-2xl text-lg font-semibold transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-accent outline-none ${
                key === "⌫"
                  ? "bg-transparent text-muted hover:text-foreground text-2xl"
                  : "bg-surface border border-border hover:bg-border"
              }`}
              aria-label={key === "⌫" ? "Cancella" : `Cifra ${key}`}
            >
              {key}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
