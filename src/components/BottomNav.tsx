"use client";

import Link from "next/link";

type Tab = "dashboard" | "history" | "settings";

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40" aria-label="Navigazione principale">
      <div className="max-w-lg mx-auto flex">
        <NavTab href="/dashboard" icon="grid" label="Dashboard" active={active === "dashboard"} />
        <NavTab href="/history" icon="clock" label="Storico" active={active === "history"} />
        <NavTab href="/settings" icon="gear" label="Impostazioni" active={active === "settings"} />
      </div>
    </nav>
  );
}

function NavTab({ href, icon, label, active }: { href: string; icon: "grid" | "clock" | "gear"; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors focus-visible:text-accent outline-none ${
        active ? "text-foreground" : "text-muted hover:text-muted-hover"
      }`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      prefetch
    >
      {icon === "grid" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="10" y="2" width="6" height="6" rx="1" />
          <rect x="2" y="10" width="6" height="6" rx="1" />
          <rect x="10" y="10" width="6" height="6" rx="1" />
        </svg>
      )}
      {icon === "clock" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="9" cy="9" r="7" />
          <path d="M9 5v4l2.5 2.5" />
        </svg>
      )}
      {icon === "gear" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="9" cy="9" r="2.5" />
          <path d="M9 1.5v2M9 14.5v2M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4M16.5 9h-2M3.5 9h-2M14.3 14.3l-1.4-1.4M5.1 5.1L3.7 3.7" />
        </svg>
      )}
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}
