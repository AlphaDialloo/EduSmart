import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loginRequest,
  registerRequest,
} from "../services/auth.service";

const AuthContext = createContext(null);

const TOKEN_KEY = "edusmart_token";
const USER_KEY = "edusmart_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function persistSession(data) {
    const authenticatedUser = data.user || data.utilisateur;

    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, data.token),
      AsyncStorage.setItem(
        USER_KEY,
        JSON.stringify(authenticatedUser),
      ),
    ]);

    setToken(data.token);
    setUser(authenticatedUser);

    return authenticatedUser;
  }

  async function login(credentials) {
    const data = await loginRequest(credentials);
    return persistSession(data);
  }

  async function register(payload) {
    const data = await registerRequest(payload);
    return persistSession(data);
  }

  async function logout() {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);

    setToken(null);
    setUser(null);
    router.replace("/(auth)/login");
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
    }),
    [token, user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé dans AuthProvider.",
    );
  }

  return context;
}
