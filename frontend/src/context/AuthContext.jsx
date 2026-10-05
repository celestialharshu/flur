import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { authApi, clearApiCache } from '../api/backend';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('flur_token'));
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef(null);

  const setUser = useCallback((u) => {
    userRef.current = u;
    setUserState(u);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    // login/signup already returned the user: no need to ask the server again
    if (userRef.current) {
      setIsLoading(false);
      return;
    }
    authApi.me(token)
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem('flur_token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token, setUser]);

  const startSession = useCallback(({ user, token }) => {
    localStorage.setItem('flur_token', token);
    setUser(user);
    setToken(token);
  }, [setUser]);

  const login = useCallback(async (email, password) => {
    startSession(await authApi.login(email, password));
  }, [startSession]);

  const signup = useCallback(async (name, email, password) => {
    startSession(await authApi.signup(name, email, password));
  }, [startSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('flur_token');
    clearApiCache();
    setToken(null);
    setUser(null);
  }, [setUser]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const { user } = await authApi.me(token);
    setUser(user);
  }, [token, setUser]);

  const value = useMemo(
    () => ({ user, token, isLoading, login, signup, logout, refreshUser }),
    [user, token, isLoading, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
