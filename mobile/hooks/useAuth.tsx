import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type AuthState = {
  isSignedIn: boolean;
  signIn: (provider: 'google' | 'email') => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

// TODO: core-api 연동 — JWT 발급·갱신, expo-secure-store에 토큰 저장
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setSignedIn] = useState(false);

  const value = useMemo<AuthState>(
    () => ({
      isSignedIn,
      signIn: async () => setSignedIn(true),
      signOut: () => setSignedIn(false),
    }),
    [isSignedIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
