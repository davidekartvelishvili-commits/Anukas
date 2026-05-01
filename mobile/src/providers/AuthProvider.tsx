import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

/** Minimal User type matching the web's auth.ts User interface */
export interface User {
  id: string;
  phone: string;
  name: string | null;
  balance: number;
  coinBalance?: number;
  referralCode?: string;
  hasPin: boolean;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  /** Store token + user after successful login */
  signIn: (token: string, user: User) => Promise<void>;
  /** Clear all auth state */
  signOut: () => Promise<void>;
  /** Update the cached user object */
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  token: null,
  signIn: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // On mount, check for existing token
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("shansi_token");
        const storedUser = await SecureStore.getItemAsync("shansi_user");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // Corrupted storage — treat as logged out
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync("shansi_token", newToken);
    await SecureStore.setItemAsync("shansi_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync("shansi_token");
    await SecureStore.deleteItemAsync("shansi_user");
    await SecureStore.deleteItemAsync("shansi_phone");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updated: User) => {
    await SecureStore.setItemAsync("shansi_user", JSON.stringify(updated));
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated: !!token,
        user,
        token,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
