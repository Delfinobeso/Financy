export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  percentage: number;
  color: string;
}

export interface Expense {
  id: string;
  categoryId: CategoryId;
  amount: number;
  description: string;
  date: string;
}

export interface Budget {
  monthlyIncome: number;
  categories: Category[];
  expenses: Expense[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Necessità", percentage: 50, color: "#5e6ad2" },
  { name: "Svago", percentage: 30, color: "#e4a951" },
  { name: "Risparmio", percentage: 20, color: "#4cb782" },
];

export const CATEGORY_COLORS = [
  "#5e6ad2", "#e4a951", "#4cb782", "#e5484d", "#7c5cfc",
  "#3ec8a0", "#ff6b6b", "#4ecdc4", "#ffd93d", "#6c5ce7",
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function calculateBudget(budget: Budget): Map<CategoryId, number> {
  const spent = new Map<CategoryId, number>();
  for (const expense of budget.expenses) {
    const current = spent.get(expense.categoryId) || 0;
    spent.set(expense.categoryId, current + expense.amount);
  }
  return spent;
}

export function getCategoryBudget(income: number, percentage: number): number {
  return (income * percentage) / 100;
}

export function getRemaining(
  income: number,
  percentage: number,
  spent: number
): number {
  return getCategoryBudget(income, percentage) - spent;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
