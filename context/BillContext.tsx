"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Bill, Item, Mode, Person, Result, SavedBill, PaymentStatusesMap } from "@/types/bill";
import { SAVED_BILLS_KEY, STORAGE_KEY, loadFromStorage, removeFromStorage, saveToStorage } from "@/lib/storage";
import { getContributionsTotal, getItemsTotal } from "@/lib/calculations";

export interface BillState {
  mode: Mode;
  currentScreen: "mode-selection" | "items" | "people" | "bill" | "assign-items" | "results";
  bills: Bill[];
  items: Item[];
  people: Person[];
  results: Result[];
  savedBills: SavedBill[];
  paymentStatuses: PaymentStatusesMap;
}

export interface BillActions {
  setMode: (m: Mode) => void;
  setCurrentScreen: (s: BillState["currentScreen"]) => void;
  setBills: (b: Bill[]) => void;
  setItems: (i: Item[]) => void;
  setPeople: (p: Person[]) => void;
  setResults: (r: Result[]) => void;
  setSavedBills: (s: SavedBill[]) => void;
  setPaymentStatuses: (m: PaymentStatusesMap) => void;
  resetApp: () => void;
}

const defaultState: BillState = {
  mode: "per-head",
  currentScreen: "mode-selection",
  bills: [{ id: "1", name: "Bill 1" }],
  items: [{ id: "1", name: "", price: 0, billId: "1", includedPeople: [] }],
  people: [{ id: "1", name: "", contribution: 0 }],
  results: [],
  savedBills: [],
  paymentStatuses: {},
};

type BillContextValue = BillState & BillActions & {
  totals: { itemsTotal: number; contributionsTotal: number };
};

const BillContext = createContext<BillContextValue | undefined>(undefined);

export function BillProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(defaultState.mode);
  const [currentScreen, setCurrentScreen] = useState<BillState["currentScreen"]>(defaultState.currentScreen);
  const [bills, setBills] = useState<Bill[]>(defaultState.bills);
  const [items, setItems] = useState<Item[]>(defaultState.items);
  const [people, setPeople] = useState<Person[]>(defaultState.people);
  const [results, setResults] = useState<Result[]>(defaultState.results);
  const [savedBills, setSavedBills] = useState<SavedBill[]>(defaultState.savedBills);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatusesMap>({});

  // load
  useEffect(() => {
    const state = loadFromStorage<any>(STORAGE_KEY, null);
    if (state) {
      try {
        setMode(state.mode ?? defaultState.mode);
        setCurrentScreen(state.currentScreen ?? defaultState.currentScreen);
        setBills(state.bills ?? defaultState.bills);
        setItems(state.items ?? defaultState.items);
        setPeople(state.people ?? defaultState.people);
        setResults(state.results ?? defaultState.results);
        setPaymentStatuses(state.paymentStatuses ?? {});
      } catch {
        // ignore
      }
    }
    const saved = loadFromStorage<SavedBill[]>(SAVED_BILLS_KEY, []);
    setSavedBills(saved);
  }, []);

  // persist
  useEffect(() => {
    saveToStorage(STORAGE_KEY, {
      mode,
      currentScreen,
      bills,
      items,
      people,
      results,
      paymentStatuses,
    });
  }, [mode, currentScreen, bills, items, people, results, paymentStatuses]);

  const totals = useMemo(() => ({
    itemsTotal: getItemsTotal(items),
    contributionsTotal: getContributionsTotal(people),
  }), [items, people]);

  const resetApp = () => {
    setMode("per-head");
    setCurrentScreen("mode-selection");
    setBills([{ id: "1", name: "Bill 1" }]);
    setItems([{ id: "1", name: "", price: 0, billId: "1", includedPeople: [] }]);
    setPeople([{ id: "1", name: "", contribution: 0 }]);
    setResults([]);
    setPaymentStatuses({});
    removeFromStorage(STORAGE_KEY);
  };

  const value: BillContextValue = {
    mode,
    currentScreen,
    bills,
    items,
    people,
    results,
    savedBills,
    paymentStatuses,
    setMode,
    setCurrentScreen,
    setBills,
    setItems,
    setPeople,
    setResults,
    setSavedBills: (s) => {
      setSavedBills(s);
      saveToStorage(SAVED_BILLS_KEY, s);
    },
    setPaymentStatuses,
    resetApp,
    totals,
  };

  return <BillContext.Provider value={value}>{children}</BillContext.Provider>;
}

export function useBillContext(): BillContextValue {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error("useBillContext must be used within BillProvider");
  return ctx;
}


