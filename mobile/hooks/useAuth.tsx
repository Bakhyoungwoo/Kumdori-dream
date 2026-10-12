import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '@/api/auth';
import { ACCESS_KEY, REFRESH_KEY, tokenStore } from '@/api/session';

type AuthState = {
  isSignedIn: boolean;
  initializing: boolean;
  /** 방금 가입한 경우 환영 화면에 보여줄 닉네임. 환영 화면을 닫으면 null */
  welcomeNickname: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  finishWelcome: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setSignedIn] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [welcomeNickname, setWelcomeNickname] = useState<string | null>(null);

  const saveTokens = useCallback(async (response: authApi.TokenResponse) => {
    await tokenStore.set(REFRESH_KEY, response.refreshToken);
    await tokenStore.set(ACCESS_KEY, response.accessToken);
  }, []);

  // 앱 시작 시 저장된 리프레시 토큰으로 세션 복원
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStore.get(REFRESH_KEY);
        if (!token) return;
        await saveTokens(await authApi.refresh(token));
        setSignedIn(true);
      } catch {
        await tokenStore.remove(REFRESH_KEY);
        await tokenStore.remove(ACCESS_KEY);
      } finally {
        setInitializing(false);
      }
    })();
  }, [saveTokens]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await saveTokens(await authApi.login(email, password));
      setSignedIn(true);
    },
    [saveTokens],
  );

  const signUp = useCallback(
    async (email: string, password: string, nickname: string) => {
      await saveTokens(await authApi.signup(email, password, nickname));
      setWelcomeNickname(nickname);
      setSignedIn(true);
    },
    [saveTokens],
  );

  const finishWelcome = useCallback(() => setWelcomeNickname(null), []);

  const signOut = useCallback(async () => {
    const token = await tokenStore.get(REFRESH_KEY);
    if (token) await authApi.logout(token).catch(() => undefined);
    await tokenStore.remove(REFRESH_KEY);
    await tokenStore.remove(ACCESS_KEY);
    setWelcomeNickname(null);
    setSignedIn(false);
  }, []);

  const value = useMemo(
    () => ({ isSignedIn, initializing, welcomeNickname, signIn, signUp, finishWelcome, signOut }),
    [isSignedIn, initializing, welcomeNickname, signIn, signUp, finishWelcome, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
