import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE } from "./api";
import { getLibraryTimezone, setLibraryTimezone } from "./utils";

const DEFAULT_TZ = getLibraryTimezone();

const ConfigCtx = createContext({
  libraryTimezone: DEFAULT_TZ,
  loading: true,
  error: null,
});

export function ConfigProvider({ children }) {
  const [state, setState] = useState({
    libraryTimezone: DEFAULT_TZ,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/config`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load config (${res.status})`);
        const data = await res.json().catch(() => ({}));
        const tz = typeof data?.library_timezone === "string" && data.library_timezone.trim()
          ? data.library_timezone.trim()
          : DEFAULT_TZ;
        setLibraryTimezone(tz);
        setState({ libraryTimezone: tz, loading: false, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        setLibraryTimezone(DEFAULT_TZ);
        setState({ libraryTimezone: DEFAULT_TZ, loading: false, error: err });
      }
    })();
    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({
      libraryTimezone: state.libraryTimezone,
      loading: state.loading,
      error: state.error,
    }),
    [state]
  );

  return <ConfigCtx.Provider value={value}>{children}</ConfigCtx.Provider>;
}

export function useConfig() {
  return useContext(ConfigCtx);
}
