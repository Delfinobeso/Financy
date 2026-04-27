const THEME_KEY = "financy-theme";

export type Theme = "dark" | "light";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as Theme) ?? "dark";
}

export function applyTheme(t: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", t);
}

export function setTheme(t: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, t);
  applyTheme(t);
}
