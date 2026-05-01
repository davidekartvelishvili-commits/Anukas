import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BalanceState {
  coins: number;
  cash: number;
  setCoins: (amount: number) => void;
  setCash: (amount: number) => void;
  /** Sync both balances from a server response */
  syncFromServer: (coinsRemaining: number, cashWon?: number) => void;
}

const BalanceContext = createContext<BalanceState>({
  coins: 0,
  cash: 0,
  setCoins: () => {},
  setCash: () => {},
  syncFromServer: () => {},
});

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoinsState] = useState(0);
  const [cash, setCashState] = useState(0);

  // Load persisted balances on mount
  useEffect(() => {
    (async () => {
      try {
        const [storedCoins, storedCash] = await Promise.all([
          AsyncStorage.getItem("shansi_coins"),
          AsyncStorage.getItem("shansi_cash"),
        ]);
        if (storedCoins) setCoinsState(Number(storedCoins) || 0);
        if (storedCash) setCashState(Number(storedCash) || 0);
      } catch {
        // Ignore read errors
      }
    })();
  }, []);

  const setCoins = useCallback((amount: number) => {
    setCoinsState(amount);
    AsyncStorage.setItem("shansi_coins", String(amount));
  }, []);

  const setCash = useCallback((amount: number) => {
    const rounded = Math.round(amount * 100) / 100;
    setCashState(rounded);
    AsyncStorage.setItem("shansi_cash", String(rounded));
  }, []);

  const syncFromServer = useCallback((coinsRemaining: number, cashWon?: number) => {
    setCoins(coinsRemaining);
    if (cashWon !== undefined) setCash(cashWon);
  }, [setCoins, setCash]);

  return (
    <BalanceContext.Provider value={{ coins, cash, setCoins, setCash, syncFromServer }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  return useContext(BalanceContext);
}
