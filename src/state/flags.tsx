import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { db } from "../core/db";
import type { VideoFlags } from "../core/types";

type FlagsMap = Record<string, VideoFlags>;

type FlagsContextValue = {
  flagsById: FlagsMap;
  isLoading: boolean;
  toggleFlag: (id: string, key: "watched" | "watchLater" | "favorite") => Promise<void>;
  setFlag: (id: string, key: "watched" | "watchLater" | "favorite", value: boolean) => Promise<void>;
  clearAllFlags: () => Promise<void>;
};

const FlagsContext = createContext<FlagsContextValue | undefined>(undefined);

export function FlagsProvider({ children }: { children: React.ReactNode }) {
  const [flagsById, setFlagsById] = useState<FlagsMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await db.flags.toArray();
      if (!alive) return;
      const map: FlagsMap = {};
      for (const r of rows) map[r.id] = r;
      setFlagsById(map);
      setIsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setFlag = useCallback(async (id: string, key: "watched" | "watchLater" | "favorite", value: boolean) => {
    const existing = flagsById[id];
    const next: VideoFlags = {
      id,
      watched: existing?.watched ?? false,
      watchLater: existing?.watchLater ?? false,
      favorite: existing?.favorite ?? false,
      updatedAt: Date.now(),
      [key]: value
    };
    await db.flags.put(next);
    setFlagsById((prev) => ({ ...prev, [id]: next }));
  }, [flagsById]);

  const toggleFlag = useCallback(async (id: string, key: "watched" | "watchLater" | "favorite") => {
    const existing = flagsById[id];
    const current = Boolean(existing?.[key]);
    await setFlag(id, key, !current);
  }, [flagsById, setFlag]);

  const clearAllFlags = useCallback(async () => {
    await db.flags.clear();
    setFlagsById({});
  }, []);

  const value = useMemo<FlagsContextValue>(() => ({
    flagsById,
    isLoading,
    toggleFlag,
    setFlag,
    clearAllFlags
  }), [flagsById, isLoading, toggleFlag, setFlag, clearAllFlags]);

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

export function useFlags() {
  const ctx = useContext(FlagsContext);
  if (!ctx) throw new Error("useFlags must be used within FlagsProvider");
  return ctx;
}
