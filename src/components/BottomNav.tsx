"use client";

import Link from "next/link";

type Tab = "dashboard" | "history" | "piggy" | "settings";

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-40"
      aria-label="Navigazione principale"
    >
      <div className="max-w-lg mx-auto flex">
        <NavTab href="/dashboard" icon="grid"     label="Budget"       active={active === "dashboard"} />
        <NavTab href="/history"   icon="clock"    label="Storico"      active={active === "history"}   />
        <NavTab href="/piggy"     icon="piggy"    label="Risparmi"     active={active === "piggy"}     />
        <NavTab href="/settings"  icon="gear"     label="Impostazioni" active={active === "settings"}  />
      </div>
    </nav>
  );
}

type IconType = "grid" | "clock" | "piggy" | "gear";

function NavTab({ href, icon, label, active }: { href: string; icon: IconType; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center gap-1 pt-2.5 pb-3 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        active ? "text-foreground" : "text-muted hover:text-muted-hover"
      }`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      prefetch
    >
      {active && (
        <span className="absolute top-0 inset-x-6 h-[2px] bg-accent rounded-full" aria-hidden="true" />
      )}
      <Icon name={icon} />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  );
}

function Icon({ name }: { name: IconType }) {
  if (name === "grid") return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="6" height="6" rx="1.5" />
      <rect x="10" y="2" width="6" height="6" rx="1.5" />
      <rect x="2" y="10" width="6" height="6" rx="1.5" />
      <rect x="10" y="10" width="6" height="6" rx="1.5" />
    </svg>
  );
  if (name === "clock") return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5v4l2.5 2.5" strokeLinecap="round" />
    </svg>
  );
  if (name === "piggy") return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 9c0-.55-.05-1.08-.15-1.59A2 2 0 0 0 15 6h-.5A6 6 0 0 0 5 8H4a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.18A6 6 0 0 0 8 16.9V18h1v1h2v-1h1v-1.1A6 6 0 0 0 15 12h.5a1 1 0 0 0 .95-.68A9 9 0 0 0 17 9z" />
      <circle cx="13" cy="9" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" />
      <path d="M9 1.5v2M9 14.5v2M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4M16.5 9h-2M3.5 9h-2M14.3 14.3l-1.4-1.4M5.1 5.1L3.7 3.7" strokeLinecap="round" />
    </svg>
  );
}
