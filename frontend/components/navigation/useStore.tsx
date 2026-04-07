import { create } from "zustand";

interface Transaction {
    id: string;
    name: string;
    amount: number;
    status: string;
}

interface Store {
    balance: number;
    transactions: Transaction[];

    addTransaction: (tx: Transaction) => void;
    spendMoney: (amount: number) => void;
}

export const useStore = create<Store>((set) => ({
    balance: 1250,

    transactions: [],

    addTransaction: (tx) =>
        set((state) => ({
            transactions: [tx, ...state.transactions],
        })),

    spendMoney: (amount) =>
        set((state) => ({
            balance: state.balance - amount,
        })),
}));