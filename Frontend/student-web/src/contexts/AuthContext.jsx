import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as loginRequest, register as registerRequest } from "../services/auth.service";
const AuthContext = createContext(null);
const TOKEN_KEY = "edusmart_token";
const USER_KEY = "edusmart_user";
function readStoredUser() {
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
export function AuthProvider({
  children
}) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(token));
  const saveSession = useCallback(session => {
    const nextToken = session?.token;
    const nextUser = session?.user;
    if (!nextToken || !nextUser) {
      throw new Error("Réponse d’authentification invalide.");
    }
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);
  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);
  const login = useCallback(async credentials => {
    const response = await loginRequest(credentials);
    saveSession(response);
    return response;
  }, [saveSession]);
  const register = useCallback(async payload => {
    const response = await registerRequest(payload);
    saveSession(response);
    return response;
  }, [saveSession]);
  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);
  useEffect(() => {
    let active = true;
    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await getMe(token);
        if (!active) {
          return;
        }
        const currentUser = response?.user;
        if (!currentUser) {
          clearSession();
          return;
        }
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
      } catch (error) {
        console.error("Erreur de restauration de session :", error);
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    restoreSession();
    return () => {
      active = false;
    };
  }, [token, clearSession]);
  const value = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout
  }), [token, user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider.");
  }
  return context;
}
