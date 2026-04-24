"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { Budget, Expense, Category } from "@/lib/types";
import { generateId } from "@/lib/types";

const STORAGE_KEY = "financy-budget";

function loadBudget(): Budget | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  return JSON.parse(stored);
}

function saveBudget(budget: Budget) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
}

type Action =
  | { type: "SETUP"; income: number; categories: Category[] }
  | { type: "ADD_EXPENSE"; expense: Expense }
  | { type: "DELETE_EXPENSE"; id: string }
  | { type: "RESET" };

function budgetReducer(state: Budget | null, action: Action): Budget | null {
  switch (action.type) {
    case "SETUP": {
      const budget: Budget = {
        monthlyIncome: action.income,
        categories: action.categories,
        expenses: [],
      };
      saveBudget(budget);
      return budget;
    }
    case "ADD_EXPENSE": {
      if (!state) return state;
      const updated: Budget = {
        ...state,
        expenses: [...state.expenses, action.expense],
      };
      saveBudget(updated);
      return updated;
    }
    case "DELETE_EXPENSE": {
      if (!state) return state;
      const updated: Budget = {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
      };
      saveBudget(updated);
      return updated;
    }
    case "RESET":
      localStorage.removeItem(STORAGE_KEY);
      return null;
    default:
      return state;
  }
}

interface BudgetContextType {
  budget: Budget | null;
  setup: (income: number, categories: Category[]) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  reset: () => void;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [budget, dispatch] = useReducer(budgetReducer, null, loadBudget);

  const setup = useCallback((income: number, categories: Category[]) => {
    dispatch({ type: "SETUP", income, categories });
  }, []);

  const addExpense = useCallback(
    ({ categoryId, amount, description, date }: Omit<Expense, "id">) => {
      dispatch({
        type: "ADD_EXPENSE",
        expense: { id: generateId(), categoryId, amount, description, date },
      });
    },
    []
  );

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: "DELETE_EXPENSE", id });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <BudgetContext.Provider
      value={{ budget, setup, addExpense, deleteExpense, reset }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
