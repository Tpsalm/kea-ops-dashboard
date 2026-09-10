"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type UiDensity = "comfortable" | "compact";
export type AccentColor = "emerald" | "blue" | "amber" | "violet";

export interface SettingsPreferences {
  theme: ThemeMode;
  density: UiDensity;
  accent: AccentColor;
  motion: boolean;
  emailAlertsOnApproval: boolean;
  stockoutAlerts: boolean;
  dailyDigest: boolean;
  soundEnabled: boolean;
  vsrDebtLimitLock: boolean;
  requireLeaveRelief: boolean;
  strictGpsRadius: boolean;
  defaultRegion: string;
  currencyFormat: "symbol" | "code";
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD";
  twoFactorApprovals: boolean;
  sessionTimeoutMinutes: number;
}

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  theme: "light",
  density: "comfortable",
  accent: "emerald",
  motion: true,
  emailAlertsOnApproval: true,
  stockoutAlerts: true,
  dailyDigest: true,
  soundEnabled: true,
  vsrDebtLimitLock: true,
  requireLeaveRelief: true,
  strictGpsRadius: false,
  defaultRegion: "all",
  currencyFormat: "symbol",
  dateFormat: "DD/MM/YYYY",
  twoFactorApprovals: false,
  sessionTimeoutMinutes: 30,
};

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  preferences: SettingsPreferences;
  updatePreferences: (updates: Partial<SettingsPreferences>) => void;
  resetPreferences: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "kea_theme";
const PREFS_STORAGE_KEY = "kea_preferences";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [preferences, setPreferences] = useState<SettingsPreferences>(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = useState(false);

  // Synchronize system dark preference
  const [systemDark, setSystemDark] = useState<boolean>(false);

  useEffect(() => {
    // 1. Initial read from localStorage
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
        setThemeState(storedTheme);
      }

      const storedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs);
        setPreferences((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore storage errors
    }

    // 2. Media query listener for system dark mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    // 3. Storage event listener to sync across tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const val = e.newValue as ThemeMode;
        if (val === "light" || val === "dark" || val === "system") {
          setThemeState(val);
        }
      }
      if (e.key === PREFS_STORAGE_KEY && e.newValue) {
        try {
          setPreferences((prev) => ({ ...prev, ...JSON.parse(e.newValue!) }));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Custom window event for intra-page synchronization
    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme?: ThemeMode; preferences?: SettingsPreferences }>;
      if (customEvent.detail?.theme) {
        setThemeState(customEvent.detail.theme);
      }
      if (customEvent.detail?.preferences) {
        setPreferences(customEvent.detail.preferences);
      }
    };
    window.addEventListener("kea-theme-change", handleCustomSync);

    setMounted(true);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("kea-theme-change", handleCustomSync);
    };
  }, []);

  const isDark = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return systemDark;
  }, [theme, systemDark]);

  // Apply dark class and density attributes to document root whenever isDark/density changes
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }

    // Apply UI density
    root.setAttribute("data-density", preferences.density);
    root.setAttribute("data-accent", preferences.accent);
  }, [isDark, preferences.density, preferences.accent]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      window.dispatchEvent(new CustomEvent("kea-theme-change", { detail: { theme: mode } }));
    } catch {}
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = isDark ? "light" : "dark";
    setTheme(nextMode);
  };

  const updatePreferences = (updates: Partial<SettingsPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      if (updates.theme && updates.theme !== theme) {
        setThemeState(updates.theme);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, updates.theme);
        } catch {}
      }
      try {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("kea-theme-change", { detail: { preferences: next } }));
      } catch {}
      return next;
    });
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setTheme("light");
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
      localStorage.removeItem(PREFS_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("kea-theme-change", { detail: { theme: "light", preferences: DEFAULT_PREFERENCES } }));
    } catch {}
  };

  const value = useMemo(
    () => ({
      theme,
      isDark,
      setTheme,
      toggleTheme,
      preferences,
      updatePreferences,
      resetPreferences,
    }),
    [theme, isDark, preferences]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback safe defaults if used outside provider
    return {
      theme: "light" as ThemeMode,
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
      preferences: DEFAULT_PREFERENCES,
      updatePreferences: () => {},
      resetPreferences: () => {},
    };
  }
  return context;
}
