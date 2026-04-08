export type TransactionType = "income" | "expense";

export interface Transaction {
  type: TransactionType;
  category: string;
  desc: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface Goal {
  name: string;
  current: number;
  target: number;
}

export type FilterType =
  | { type: "day"; date: string }
  | { type: "month"; year: number; month: number }
  | null;
