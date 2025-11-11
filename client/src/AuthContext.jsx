import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api } from "./api";

const DEFAULT_AUTH = { token: null, user: null };
const AuthCtx = createContext({
  ...DEFAULT_AUTH,
  login: async () => DEFAULT_AUTH,
  logout: () => {},
  useApi: () => api,
  refreshProfile: async () => DEFAULT_AUTH.user,
  updateProfile: async () => DEFAULT_AUTH.user,
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
  const employeeRole = user.employee_role || null;
  const normalizedRole = user.employee_id ? "staff" : user.role || "student";
  return {
    ...user,
    role: normalizedRole,
    employee_role: employeeRole,
    is_employee: Boolean(user.employee_id),
    is_admin: Boolean(employeeRole === "admin"),
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

  const useApi = useCallback((path, opts = {}) => {
    const { token } = auth;
    return api(path, { ...opts, token });
  }, [auth]);

  const refreshProfile = useCallback(async () => {
    if (!auth?.token) return null;
    const data = await api("me", { token: auth.token });
    const normalizedUser = normalizeUser(data.user);
    save({ token: auth.token, user: normalizedUser });
    return normalizedUser;
  }, [auth?.token, save]);

  const updateProfile = useCallback(
    async (payload) => {
      if (!auth?.token) throw new Error("unauthorized");
      const data = await api("me", { method: "PATCH", token: auth.token, body: payload });
      const normalizedUser = normalizeUser(data.user);
      save({ token: auth.token, user: normalizedUser });
      return normalizedUser;
    },
    [auth?.token, save]
  );

  const value = useMemo(
    () => ({
      token: auth.token,
      user: auth.user,
      login,
      logout,
      useApi,
      refreshProfile,
      updateProfile,
    }),
    [auth, login, logout, useApi, refreshProfile, updateProfile]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
