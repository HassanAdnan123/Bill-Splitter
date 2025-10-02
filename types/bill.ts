export type Mode = "per-head" | "individual-items";

export interface Bill {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  billId?: string;
  includedPeople?: string[];
}

export interface Person {
  id: string;
  name: string;
  contribution?: number;
}

export interface Result {
  name: string;
  amount: number;
  type: "pay" | "receive";
}

export interface SavedBill {
  id: string;
  name: string;
  date: string;
  mode: Mode;
  items: Item[];
  people: Person[];
  bills: Bill[];
}

export interface PaymentStatusesMap {
  [personName: string]: number;
}

export interface ValidationState {
  isValid: boolean;
  difference: number;
  message: string;
}


