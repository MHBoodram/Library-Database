import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

function readStored() {
  try { return JSON.parse(localStorage.getItem("auth")) ?? { token:null, user:null }; }
  catch { return { token:null, user:null }; }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored);

  const save = useCallback((next) => {
    setAuth(next);
    localStorage.setItem("auth", JSON.stringify(next));
  }, []);

  const Login = useCallback(async (email, password) => {
    const { token, user } = await api("auth/login", {
      method: "POST",
      body: { email: email.trim().toLowerCase(), password }
    });
    save({ token, user });
    return user; // caller can route by role
  }, [save]);

  const Logout = useCallback(() => {
    save({ token:null, user:null });
  }, [save]);

  const Register = useCallback(async (first_name, last_name, email, password, { autoLogin=true } = {}) => {
    await api("auth/register", {
      method: "POST",
      body: {
        first_name: first_name.trim(),
        last_name:  last_name.trim(),
        email:      email.trim().toLowerCase(),
        password
      }
    });
    if (!autoLogin) return null;
    const user = await Login(email, password);
    return user;
  }, [Login]);

  // convenience: useApi wraps api() with current token
  const useApi = () => {
    const { token } = auth;
    return (path, opts={}) => api(path, { ...opts, token });
  };

  const value = useMemo(() => ({
    token: auth.token,
    user:  auth.user,
    Login,
    Logout,
    Register,
    useApi
  }), [auth, Login, Logout, Register]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
