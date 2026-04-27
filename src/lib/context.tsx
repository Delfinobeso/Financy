"use client";

import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Budget, Expense, Category, CategoryId, ClosedMonth } from "@/lib/types";
import { generateId } from "@/lib/types";

const STORAGE_KEY = "financy-budget";

function loadBudget(): Budget | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveBudget(budget: Budget) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
  } catch {
    // quota exceeded or private browsing
  }
}

type Action =
  | { type: "LOAD"; budget: Budget }
  | { type: "SETUP"; income: number; categories: Category[] }
  | { type: "SET_INCOME"; income: number }
  | { type: "ADD_EXPENSE"; expense: Expense }
  | { type: "EDIT_EXPENSE"; expense: Expense }
  | { type: "DELETE_EXPENSE"; id: string }
  | { type: "ADD_CATEGORY"; category: Category }
  | { type: "EDIT_CATEGORY"; category: Category }
  | { type: "DELETE_CATEGORY"; id: string; migrateTo: CategoryId }
  | { type: "CLOSE_MONTH"; monthKey: string; closedMonth: ClosedMonth }
  | { type: "RESET" };

function budgetReducer(state: Budget | null, action: Action): Budget | null {
  switch (action.type) {
    case "LOAD":
      return action.budget;

    case "SETUP": {
      const now = new Date().toISOString();
      const budget: Budget = {
        monthlyIncome: action.income,
        categories: action.categories,
        expenses: [],
        closedMonths: {},
        piggyBankTotal: 0,
        createdAt: now,
        updatedAt: now,
      };
      saveBudget(budget);
      return budget;
    }

    case "SET_INCOME": {
      if (!state) return state;
      const updated: Budget = {
        ...state,
        monthlyIncome: action.income,
        updatedAt: new Date().toISOString(),
      };
      saveBudget(updated);
      return updated;
    }

    case "ADD_EXPENSE": {
      if (!state) return state;
      const updated: Budget = {
        ...state,
        expenses: [...state.expenses, action.expense],
        updatedAt: new Date().toISOString(),
      };
      saveBudget(updated);
      return updated;
    }

    case "EDIT_EXPENSE": {
      if (!state) return state;
      const updated: Budget = {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.expense.id ? action.expense : e
        ),
        updatedAt: new Date().toISOString(),
      };
      saveBudget(updated);
      return updated;
    }

    case "DELETE_EXPENSE": {
      if (!state) return state;
      const updated: Budget = {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
        updatedAt: new Date().toISOString(),
      };
      saveBudget(updated);
      return updated;
    }

    case "ADD_CATEGORY": {
      if (!state) return state;
      const updated: Budget = {
        ...state,
        categories: [...state.categories, action.category],
        updatedAt: new Date().toISOString(),
      };
      saveBudget(updated);
      return updated;
    }

    case "EDIT_CATEGORY": {
      if (!state) return state;
      const updated: Budget = {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.category.id ? action.category : c
        ),
        updatedAt: new Date().toISOString(),
      };
      saveBudget(updated);
      return updated;
    }

    case "CLOSE_MONTH": {
      if (!state) return state;
      const prevPiggy = state.piggyBankTotal ?? 0;
      const updated: Budget = {
        ...state,
        closedMonths: {
          ...(state.closedMonths ?? {}),
          [action.monthKey]: action.closedMonth,
        },
        piggyBankTotal: prevPiggy + action.closedMonth.saved,
        updatedAt: new Date().toISOString(),
      };
      saveBudget(updated);
      return updated;
    }

    case "DELETE_CATEGORY": {
      if (!state) return state;
      const updated: Budget = {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        expenses: state.expenses.map((e) =>
          e.categoryId === action.id
            ? { ...e, categoryId: action.migrateTo }
            : e
        ),
        updatedAt: new Date().toISOString(),
      };
      saveBudget(updated);
      return updated;
    }

    case "RESET":
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      return null;

    default:
      return state;
  }
}

interface BudgetContextType {
  budget: Budget | null;
  isLoaded: boolean;
  setup: (income: number, categories: Category[]) => void;
  setIncome: (income: number) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  editExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addCategory: (category: Category) => void;
  editCategory: (category: Category) => void;
  deleteCategory: (id: string, migrateTo: CategoryId) => void;
  closeMonth: (monthKey: string, saved: number, spent: number, budget: number) => void;
  reset: () => void;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [budget, dispatch] = useReducer(budgetReducer, null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage after mount (client-side only)
  useEffect(() => {
    const stored = loadBudget();
    if (stored) {
      dispatch({ type: "LOAD", budget: stored });
    }
    setIsLoaded(true);
  }, []);

  const setup = useCallback((income: number, categories: Category[]) => {
    dispatch({ type: "SETUP", income, categories });
  }, []);

  const setIncome = useCallback((income: number) => {
    dispatch({ type: "SET_INCOME", income });
  }, []);

  const addExpense = useCallback(
    ({ categoryId, amount, description, date, recurring }: Omit<Expense, "id">) => {
      dispatch({
        type: "ADD_EXPENSE",
        expense: { id: generateId(), categoryId, amount, description, date, recurring },
      });
    },
    []
  );

  const editExpense = useCallback((expense: Expense) => {
    dispatch({ type: "EDIT_EXPENSE", expense });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: "DELETE_EXPENSE", id });
  }, []);

  const addCategory = useCallback((category: Category) => {
    dispatch({ type: "ADD_CATEGORY", category });
  }, []);

  const editCategory = useCallback((category: Category) => {
    dispatch({ type: "EDIT_CATEGORY", category });
  }, []);

  const deleteCategory = useCallback((id: string, migrateTo: CategoryId) => {
    dispatch({ type: "DELETE_CATEGORY", id, migrateTo });
  }, []);

  const closeMonth = useCallback(
    (monthKey: string, saved: number, spent: number, budget: number) => {
      dispatch({
        type: "CLOSE_MONTH",
        monthKey,
        closedMonth: { saved, spent, budget, closedAt: new Date().toISOString() },
      });
    },
    []
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <BudgetContext.Provider
      value={{
        budget,
        isLoaded,
        setup,
        setIncome,
        addExpense,
        editExpense,
        deleteExpense,
        addCategory,
        editCategory,
        deleteCategory,
        closeMonth,
        reset,
      }}
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
