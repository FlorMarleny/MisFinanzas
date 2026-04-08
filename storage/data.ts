import AsyncStorage from "@react-native-async-storage/async-storage";
import { Goal, Transaction } from "./types";

const KEYS = {
  transactions: "finance_transactions",
  goals: "finance_goals",
};

export async function cargarTransacciones(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.transactions);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function guardarTransacciones(txns: Transaction[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(txns));
}

export async function cargarMetas(): Promise<Goal[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.goals);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function guardarMetas(goals: Goal[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.goals, JSON.stringify(goals));
}
