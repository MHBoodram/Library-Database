import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api } from "./api";

const DEFAULT_AUTH = { token: null, user: null };
const AuthCtx = createContext({
  ...DEFAULT_AUTH,
  login: async () => DEFAULT_AUTH,
  logout: () => {},
  register: async () => DEFAULT_AUTH,
  useApi: () => api,
});

function readStored() {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return DEFAULT_AUTH;
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
    };
  } catch {
    return DEFAULT_AUTH;
  }
}

function normalizeUser(user) {
  if (!user) return null;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const normalizedRole = user.employee_id ? "staff" : user.role || "student";
  return {
    ...user,
    role: normalizedRole,
    name: (user.name && typeof user.name === "string" && user.name) || fullName || user.email || "",
  };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = readStored();
    return { token: stored.token, user: normalizeUser(stored.user) };
  });

  const save = useCallback((next) => {
    const normalized = {
      token: next?.token ?? null,
      user: normalizeUser(next?.user) ?? null,
    };
    setAuth(normalized);
    localStorage.setItem("auth", JSON.stringify(normalized));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { token, user } = await api("auth/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
      });
      const normalizedUser = normalizeUser(user);
      save({ token, user: normalizedUser });
      return normalizedUser;
    },
    [save]
  );

  const logout = useCallback(() => {
    save(DEFAULT_AUTH);
  }, [save]);

  const register = useCallback(
    async (first_name, last_name, email, password, { autoLogin = true } = {}) => {
      await api("auth/register", {
        method: "POST",
        body: {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      });
      if (!autoLogin) return null;
      return login(email, password);
    },
    [login]
  );

  const useApi = useCallback(() => {
    const { token } = auth;
    return (path, opts = {}) => api(path, { ...opts, token });
  }, [auth]);

  const value = useMemo(
    () => ({
      token: auth.token,
      user: auth.user,
      login,
      logout,
      register,
      useApi,
    }),
    [auth, login, logout, register, useApi]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
